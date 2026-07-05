import Quote from '../models/Quote.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import CreditLedger from '../models/CreditLedger.js';
import Warehouse from '../models/Warehouse.js';
import Order from '../models/Order.js';
import Delivery from '../models/Delivery.js';
import { generateInvoicePDF } from '../services/invoiceService.js';
import { sendWhatsAppAlert } from '../services/whatsappService.js';
import { scanAndRemindQuotes } from '../services/crmService.js';

// Helper to find nearest warehouse that has stock for an order
const findNearestWarehouseWithStock = async (buyerCoords, items) => {
  const warehouses = await Warehouse.find();
  if (warehouses.length === 0) return null;

  // Proximity calculations
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const buyerLat = buyerCoords?.latitude || 28.6139; // default Delhi coords if missing
  const buyerLng = buyerCoords?.longitude || 77.2090;

  const whWithDistances = warehouses.map(wh => {
    const distance = calculateDistance(buyerLat, buyerLng, wh.coordinates.latitude, wh.coordinates.longitude);
    return { warehouse: wh, distance };
  });

  // Sort by distance ascending
  whWithDistances.sort((a, b) => a.distance - b.distance);

  // Check which nearest warehouse has enough stock for all items
  for (const item of whWithDistances) {
    let hasStock = true;
    for (const orderLine of items) {
      const whItem = item.warehouse.inventory.find(
        inv => inv.product.toString() === orderLine.product.toString()
      );
      if (!whItem || whItem.quantity < orderLine.quantity) {
        hasStock = false;
        break;
      }
    }
    if (hasStock) {
      return item.warehouse; // returns nearest warehouse with stock
    }
  }

  // Fallback to absolute nearest warehouse if no single warehouse has complete stock
  return whWithDistances[0]?.warehouse || null;
};

// @desc    Submit a Request for Quote (RFQ)
// @route   POST /api/quotes
// @access  Private
export const submitQuoteRequest = async (req, res, next) => {
  try {
    const { items, remarks } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please add items to request a quote' });
    }

    let totalRequestedAmount = 0;
    const formattedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
      }

      // Automatically check tier pricing based on user's role
      const userRole = req.user.role;
      const basePrice = product.pricingTiers[userRole] || product.pricingTiers.Retail;

      formattedItems.push({
        product: product._id,
        quantity: item.quantity,
        targetPrice: item.targetPrice || basePrice, // targetPrice proposed by customer
        offerPrice: basePrice, // initially dealer price matches tier price
        finalPrice: basePrice,
      });

      totalRequestedAmount += (item.targetPrice || basePrice) * item.quantity;
    }

    const quote = await Quote.create({
      buyer: req.user.id,
      items: formattedItems,
      remarks,
      totalRequestedAmount,
      totalOfferedAmount: totalRequestedAmount, // init
      negotiationHistory: [
        {
          sender: 'Buyer',
          message: `Submitted Quote Request. Remarks: ${remarks || 'No remarks'}`,
          priceProposal: formattedItems.map(i => ({ productId: i.product, price: i.targetPrice })),
        }
      ]
    });

    res.status(201).json({ success: true, data: quote });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quotes
// @route   GET /api/quotes
// @access  Private
export const getQuotes = async (req, res, next) => {
  try {
    let query = {};
    
    // If not Dealer/Admin, only show buyer's quotes
    if (req.user.role !== 'Dealer' && req.user.role !== 'Admin') {
      query.buyer = req.user.id;
    }

    const quotes = await Quote.find(query)
      .populate('buyer', 'name email role phone companyName gstNumber address')
      .populate('items.product')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, count: quotes.length, data: quotes });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quote details
// @route   GET /api/quotes/:id
// @access  Private
export const getQuoteById = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('buyer', 'name email role phone companyName gstNumber address')
      .populate('items.product');

    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }

    // Security check: Buyer can only see their own quote
    if (req.user.role !== 'Dealer' && req.user.role !== 'Admin' && quote.buyer._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this quote' });
    }

    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    next(error);
  }
};

// @desc    Dealer submits counter-offer or system updates quote
// @route   PUT /api/quotes/:id/negotiate
// @access  Private
export const negotiateQuote = async (req, res, next) => {
  try {
    const { items: counterItems, message } = req.body;
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }

    const isDealer = req.user.role === 'Dealer' || req.user.role === 'Admin';
    const sender = isDealer ? 'Dealer' : 'Buyer';

    // Update item prices and calculate totalOfferedAmount
    let totalOfferedAmount = 0;
    
    if (counterItems && counterItems.length > 0) {
      counterItems.forEach(counterItem => {
        const item = quote.items.find(i => i.product.toString() === counterItem.productId);
        if (item) {
          if (isDealer) {
            item.offerPrice = counterItem.price;
            item.finalPrice = counterItem.price;
          } else {
            item.targetPrice = counterItem.price;
          }
        }
      });
    }

    // Re-evaluate totals
    quote.items.forEach(item => {
      totalOfferedAmount += (item.finalPrice || item.offerPrice || item.targetPrice) * item.quantity;
    });

    quote.totalOfferedAmount = totalOfferedAmount;
    quote.status = 'Negotiated';

    // Append to logs
    quote.negotiationHistory.push({
      sender,
      message: message || `Updated counter price proposal`,
      priceProposal: quote.items.map(i => ({ productId: i.product, price: isDealer ? i.offerPrice : i.targetPrice })),
    });

    await quote.save();

    // Notify buyer via WhatsApp
    const populatedQuote = await quote.populate('buyer');
    const notifyMsg = `Hi ${populatedQuote.buyer.name}, your RFQ #${quote._id.toString().substring(18)} has been updated with a counter-offer by Shyam Materials. Total offered: INR ${totalOfferedAmount}. Review on the portal.`;
    await sendWhatsAppAlert(populatedQuote.buyer.phone, notifyMsg);

    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Reject quote by Buyer
// @route   PUT /api/quotes/:id/status
// @access  Private
export const updateQuoteStatus = async (req, res, next) => {
  try {
    const { status, paymentMethod } = req.body; // status: 'Approved' or 'Rejected'
    const quote = await Quote.findById(req.params.id).populate('buyer');

    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }

    // Check authorization: only the buyer can approve/reject the final offer
    if (quote.buyer._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the requesting buyer can approve or reject this quotation' });
    }

    if (status === 'Approved') {
      // 1. Resolve pricing totals (include GST 18%)
      const subtotal = quote.totalOfferedAmount || quote.totalRequestedAmount;
      const gstAmount = subtotal * 0.18;
      const deliveryCharge = subtotal > 100000 ? 0 : 2500; // free delivery above 1L
      const totalAmount = subtotal + gstAmount + deliveryCharge;

      // 2. Perform B2B financial checks if using Credit Line
      if (paymentMethod === 'Credit Line') {
        const ledger = await CreditLedger.findOne({ buyer: req.user.id });
        if (!ledger) {
          return res.status(400).json({
            success: false,
            message: 'B2B credit line not established for your account. Please select COD or Razorpay.'
          });
        }

        // Validate credit limit
        if (!ledger.canAfford(totalAmount)) {
          return res.status(400).json({
            success: false,
            message: `Credit limit exceeded! Order Total is INR ${totalAmount.toFixed(2)}, outstanding balance is INR ${ledger.outstandingBalance.toFixed(2)}, limit is INR ${ledger.creditLimit.toFixed(2)}. Please reduce order size or pay outstanding balance.`
          });
        }
      }

      quote.status = 'Approved';
      // Set finalPrice for items
      quote.items.forEach(item => {
        item.finalPrice = item.offerPrice || item.targetPrice;
      });

      quote.negotiationHistory.push({
        sender: 'System',
        message: `Quote Approved by Buyer. Payment method selected: ${paymentMethod || 'Not Selected'}`
      });

      await quote.save();

      // Immediately convert approved quote to a completed Order
      return convertQuoteToOrderInternal(quote, paymentMethod, totalAmount, subtotal, gstAmount, deliveryCharge, res);
    } else {
      quote.status = 'Rejected';
      quote.negotiationHistory.push({
        sender: 'Buyer',
        message: 'Quotation rejected by buyer'
      });
      await quote.save();
      return res.status(200).json({ success: true, message: 'Quote rejected', data: quote });
    }
  } catch (error) {
    next(error);
  }
};

// Internal function to process approved quote conversion to Order
const convertQuoteToOrderInternal = async (quote, paymentMethod, totalAmount, subtotal, gstAmount, deliveryCharge, res) => {
  try {
    const buyer = quote.buyer;

    // 1. Locate nearest warehouse with stock
    const nearestWarehouse = await findNearestWarehouseWithStock(buyer.address?.coordinates, quote.items);
    if (!nearestWarehouse) {
      return res.status(400).json({
        success: false,
        message: 'Unable to fulfill order. None of the warehouses contain enough stock for this material.'
      });
    }

    // 2. Deduct inventory stock from selected warehouse
    for (const orderLine of quote.items) {
      const whItem = nearestWarehouse.inventory.find(
        inv => inv.product.toString() === orderLine.product.toString()
      );
      if (whItem) {
        whItem.quantity -= orderLine.quantity;
      }
    }
    await nearestWarehouse.save();

    // 3. Apply credit ledger adjustment if Credit Line is used
    let paymentStatus = 'Pending';
    if (paymentMethod === 'Credit Line') {
      const ledger = await CreditLedger.findOne({ buyer: buyer._id });
      ledger.outstandingBalance += totalAmount;
      ledger.paymentHistory.push({
        type: 'Debit',
        amount: totalAmount,
        referenceModel: 'Order',
        referenceId: null, // will update post order creation
        description: `Material Purchase under Credit Line terms (30 days)`
      });
      await ledger.save();
      paymentStatus = 'Added to Credit Ledger';
    } else if (paymentMethod === 'Razorpay') {
      paymentStatus = 'Paid';
    }

    // 4. Create Order
    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const order = await Order.create({
      orderNumber,
      buyer: buyer._id,
      quote: quote._id,
      items: quote.items.map(i => ({
        product: i.product,
        quantity: i.quantity,
        pricePerUnit: i.finalPrice,
        subtotal: i.finalPrice * i.quantity,
      })),
      subtotal,
      gstAmount,
      deliveryCharge,
      totalAmount,
      paymentMethod,
      paymentStatus,
      warehouse: nearestWarehouse._id,
      shippingAddress: {
        street: buyer.address?.street || 'Default Street',
        city: buyer.address?.city || 'Default City',
        state: buyer.address?.state || 'Default State',
        zipCode: buyer.address?.zipCode || '000000',
      },
      status: 'Preparing',
    });

    // Update credit transaction reference ID if using Credit Line
    if (paymentMethod === 'Credit Line') {
      const ledger = await CreditLedger.findOne({ buyer: buyer._id });
      const lastTx = ledger.paymentHistory[ledger.paymentHistory.length - 1];
      lastTx.referenceId = order._id;
      await ledger.save();
    }

    // 5. Update quote status to Converted to Order
    quote.status = 'Converted to Order';
    await quote.save();

    // 6. Generate GST Invoice PDF using Service
    const relativeInvoicePath = await generateInvoicePDF(
      await order.populate('items.product'),
      buyer
    );
    order.invoiceUrl = relativeInvoicePath;
    await order.save();

    // 7. Initialize Delivery driver assignments
    const delivery = await Delivery.create({
      order: order._id,
      status: 'Preparing',
      statusLogs: [{ status: 'Preparing', note: 'Order confirmed and inventory locked.' }]
    });

    // 8. Add loyalty points to buyer profile (1 point for every 1000 spend)
    const pointsEarned = Math.floor(totalAmount / 1000);
    buyer.loyaltyPoints += pointsEarned;
    await buyer.save();

    // 9. Dispatch alerts
    const buyerWhatsApp = `Order CONFIRMED! Your order #${orderNumber} total INR ${totalAmount.toFixed(2)} is being processed from ${nearestWarehouse.name}. Invoice downloaded. Driver: Ramesh Singh (${delivery.driverPhone})`;
    await sendWhatsAppAlert(buyer.phone, buyerWhatsApp);

    res.status(200).json({
      success: true,
      message: 'Quote approved and converted to order successfully',
      order,
      delivery,
      invoiceUrl: relativeInvoicePath
    });
  } catch (err) {
    res.status(500).json({ success: false, message: `Conversion error: ${err.message}` });
  }
};

// @desc    Run CRM Scanner manually
// @route   POST /api/quotes/crm/scan
// @access  Private (Dealer/Admin)
export const triggerCrmScan = async (req, res, next) => {
  try {
    const { hours } = req.body;
    const remindersSent = await scanAndRemindQuotes(hours || 24);
    res.status(200).json({ success: true, count: remindersSent.length, data: remindersSent });
  } catch (error) {
    next(error);
  }
};
