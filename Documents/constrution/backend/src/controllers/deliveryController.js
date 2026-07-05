import Delivery from '../models/Delivery.js';
import Order from '../models/Order.js';
import { sendWhatsAppAlert } from '../services/whatsappService.js';

// @desc    Get all deliveries
// @route   GET /api/delivery
// @access  Private
export const getDeliveries = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role !== 'Dealer' && req.user.role !== 'Admin') {
      // Find orders for this buyer, then get deliveries
      const buyerOrders = await Order.find({ buyer: req.user.id });
      const orderIds = buyerOrders.map(o => o._id);
      query.order = { $in: orderIds };
    }

    const deliveries = await Delivery.find(query)
      .populate({
        path: 'order',
        populate: [
          { path: 'buyer', select: 'name phone email address' },
          { path: 'items.product' },
          { path: 'warehouse', select: 'name' }
        ]
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, count: deliveries.length, data: deliveries });
  } catch (error) {
    next(error);
  }
};

// @desc    Get delivery by order id
// @route   GET /api/delivery/order/:orderId
// @access  Private
export const getDeliveryByOrderId = async (req, res, next) => {
  try {
    const delivery = await Delivery.findOne({ order: req.params.orderId })
      .populate({
        path: 'order',
        populate: [
          { path: 'buyer', select: 'name phone email address' },
          { path: 'items.product' },
          { path: 'warehouse', select: 'name' }
        ]
      });

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery dispatch record not found for this order' });
    }

    // Auth validation
    if (req.user.role !== 'Dealer' && req.user.role !== 'Admin' && delivery.order.buyer._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this delivery' });
    }

    res.status(200).json({ success: true, data: delivery });
  } catch (error) {
    next(error);
  }
};

// @desc    Update delivery details & step (Dealer/Driver simulation)
// @route   PUT /api/delivery/:id
// @access  Private (Dealer/Admin)
export const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { status, note, latitude, longitude } = req.body;
    const delivery = await Delivery.findById(req.params.id).populate({
      path: 'order',
      populate: { path: 'buyer' }
    });

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery record not found' });
    }

    if (status) {
      delivery.status = status;
      delivery.statusLogs.push({
        status,
        note: note || `Fulfillment step updated to ${status}`
      });

      // Synchronize back with main Order status
      const order = await Order.findById(delivery.order._id);
      if (order) {
        order.status = status;
        await order.save();
      }

      // Proximity tracking adjustments
      if (latitude && longitude) {
        delivery.trackingCoordinates = { latitude, longitude };
      }

      // WhatsApp communication simulations
      const buyerPhone = delivery.order.buyer.phone;
      const orderNo = delivery.order.orderNumber;
      let alertMsg = '';

      if (status === 'Loaded') {
        alertMsg = `Alert: Your materials for Order #${orderNo} have been loaded onto vehicle ${delivery.vehicleNo}. Pre-dispatch inspection complete.`;
      } else if (status === 'Out for Delivery') {
        alertMsg = `Out for Delivery! Driver ${delivery.driverName} has departed in vehicle ${delivery.vehicleNo} heading to your site. ETA: ${new Date(delivery.eta).toLocaleTimeString()}. Call driver at ${delivery.driverPhone}.`;
      } else if (status === 'Delivered') {
        alertMsg = `Delivered! Materials under Order #${orderNo} have been successfully unloaded at your site location. Thank you for buying from Smart Construction Marketplace!`;
      }

      if (alertMsg) {
        await sendWhatsAppAlert(buyerPhone, alertMsg);
      }
    }

    await delivery.save();
    res.status(200).json({ success: true, message: 'Delivery status updated', data: delivery });
  } catch (error) {
    next(error);
  }
};
