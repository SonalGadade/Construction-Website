import mongoose from 'mongoose';

const negotiationLogSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['Buyer', 'Dealer', 'System'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  priceProposal: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      price: Number,
    }
  ],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const quoteSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1'],
        },
        targetPrice: {
          type: Number, // customer's requested price per unit
          required: true,
        },
        offerPrice: {
          type: Number, // dealer's counter-offer price per unit
        },
        finalPrice: {
          type: Number, // final negotiated price
        },
      },
    ],
    status: {
      type: String,
      enum: ['Pending', 'Negotiated', 'Approved', 'Rejected', 'Converted to Order'],
      default: 'Pending',
      index: true,
    },
    remarks: {
      type: String,
    },
    negotiationHistory: [negotiationLogSchema],
    totalRequestedAmount: {
      type: Number,
      required: true,
    },
    totalOfferedAmount: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

const Quote = mongoose.model('Quote', quoteSchema);
export default Quote;
