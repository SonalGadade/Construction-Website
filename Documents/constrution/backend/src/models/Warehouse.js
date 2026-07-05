import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add warehouse name'],
      trim: true,
      unique: true,
    },
    locationName: {
      type: String,
      required: [true, 'Please add location details'],
    },
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'Please add latitude'],
      },
      longitude: {
        type: Number,
        required: [true, 'Please add longitude'],
      },
    },
    inventory: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Geo index can be used, but since we will compute simple haversine distance in controller/service, we index coordinates for queries.
warehouseSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

const Warehouse = mongoose.model('Warehouse', warehouseSchema);
export default Warehouse;
