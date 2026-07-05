import mongoose from 'mongoose';

const deliveryLogSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Preparing', 'Loaded', 'Out for Delivery', 'Delivered'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  note: String,
});

const deliverySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },
    driverName: {
      type: String,
      required: true,
      default: 'Ramesh Singh',
    },
    driverPhone: {
      type: String,
      required: true,
      default: '+919876543210',
    },
    vehicleNo: {
      type: String,
      required: true,
      default: 'MH-12-PQ-9876',
    },
    vehicleType: {
      type: String,
      required: true,
      default: 'Dumper Truck (10-Ton)',
    },
    status: {
      type: String,
      enum: ['Preparing', 'Loaded', 'Out for Delivery', 'Delivered'],
      default: 'Preparing',
      index: true,
    },
    trackingCoordinates: {
      latitude: { type: Number, default: 18.5204 }, // Pune area defaults
      longitude: { type: Number, default: 73.8567 },
    },
    eta: {
      type: Date,
      default: () => new Date(Date.now() + 4 * 60 * 60 * 1000), // Default 4 hours from now
    },
    statusLogs: [deliveryLogSchema],
  },
  {
    timestamps: true,
  }
);

const Delivery = mongoose.model('Delivery', deliverySchema);
export default Delivery;
