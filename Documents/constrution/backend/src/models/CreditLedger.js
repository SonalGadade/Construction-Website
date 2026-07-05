import mongoose from 'mongoose';

const ledgerTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Debit', 'Credit'], // Debit increases outstanding (buying), Credit decreases outstanding (paying)
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  referenceModel: {
    type: String,
    enum: ['Order', 'Payment'],
    required: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const creditLedgerSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    creditLimit: {
      type: Number,
      required: true,
      default: 500000, // 5 Lakhs default limit for builders
    },
    outstandingBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    dueDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days credit terms
    },
    paymentHistory: [ledgerTransactionSchema],
  },
  {
    timestamps: true,
  }
);

// Method to verify if a purchase can be approved based on credit limit
creditLedgerSchema.methods.canAfford = function (amount) {
  return (this.outstandingBalance + amount) <= this.creditLimit;
};

const CreditLedger = mongoose.model('CreditLedger', creditLedgerSchema);
export default CreditLedger;
