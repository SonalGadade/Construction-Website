import Order from '../models/Order.js';
import Quote from '../models/Quote.js';
import Product from '../models/Product.js';

// @desc    Get order history
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role !== 'Dealer' && req.user.role !== 'Admin') {
      query.buyer = req.user.id;
    }

    const orders = await Order.find(query)
      .populate('buyer', 'name email role phone companyName')
      .populate('items.product')
      .populate('warehouse', 'name locationName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email role phone companyName gstNumber address')
      .populate('items.product')
      .populate('warehouse', 'name locationName coordinates');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Auth verification
    if (req.user.role !== 'Dealer' && req.user.role !== 'Admin' && order.buyer._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Re-order from historical order (Clones items into a new RFQ)
// @route   POST /api/orders/:id/reorder
// @access  Private
export const reOrder = async (req, res, next) => {
  try {
    const historicalOrder = await Order.findById(req.params.id);
    if (!historicalOrder) {
      return res.status(404).json({ success: false, message: 'Historical order reference not found' });
    }

    // Re-verify authorization
    if (req.user.role !== 'Dealer' && req.user.role !== 'Admin' && historicalOrder.buyer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to clone this order' });
    }

    // Build the new RFQ items list
    let totalRequestedAmount = 0;
    const items = [];

    for (const histItem of historicalOrder.items) {
      const product = await Product.findById(histItem.product);
      if (!product) {
        continue; // skip deleted products
      }

      // Check current pricing tier for the active user
      const userRole = req.user.role;
      const basePrice = product.pricingTiers[userRole] || product.pricingTiers.Retail;

      items.push({
        product: product._id,
        quantity: histItem.quantity,
        targetPrice: basePrice, // suggest current tier price
        offerPrice: basePrice,
        finalPrice: basePrice,
      });

      totalRequestedAmount += basePrice * histItem.quantity;
    }

    if (items.length === 0) {
      return res.status(400).json({ success: false, message: 'Could not re-order. Products in this order are no longer available in the catalog.' });
    }

    const quote = await Quote.create({
      buyer: req.user.id,
      items,
      remarks: `Quick Re-order cloned from Order #${historicalOrder.orderNumber}`,
      totalRequestedAmount,
      totalOfferedAmount: totalRequestedAmount,
      negotiationHistory: [
        {
          sender: 'Buyer',
          message: `Submitted Re-order request cloned from Order #${historicalOrder.orderNumber}`,
          priceProposal: items.map(i => ({ productId: i.product, price: i.targetPrice })),
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Reorder successfully initiated as a new Quote RFQ!',
      data: quote,
    });
  } catch (error) {
    next(error);
  }
};
