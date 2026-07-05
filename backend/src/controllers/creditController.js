import CreditLedger from '../models/CreditLedger.js';
import User from '../models/User.js';
import { sendWhatsAppAlert } from '../services/whatsappService.js';

// @desc    Get Credit Ledger for a user
// @route   GET /api/credit
// @access  Private
export const getMyLedger = async (req, res, next) => {
  try {
    let buyerId = req.user.id;

    // Dealers can query ledger by query parameter `buyerId`
    if ((req.user.role === 'Dealer' || req.user.role === 'Admin') && req.query.buyerId) {
      buyerId = req.query.buyerId;
    }

    const ledger = await CreditLedger.findOne({ buyer: buyerId }).populate('buyer', 'name email companyName phone role');
    
    if (!ledger) {
      return res.status(404).json({ success: false, message: 'Credit ledger record not found for this account' });
    }

    res.status(200).json({ success: true, data: ledger });
  } catch (error) {
    next(error);
  }
};

// @desc    Make credit payment (clears outstanding balance)
// @route   POST /api/credit/pay
// @access  Private
export const payCreditOutstanding = async (req, res, next) => {
  try {
    const { amount, referenceNumber } = req.body;
    let buyerId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Please specify a positive payment amount' });
    }

    // Dealer can apply payment on behalf of builder
    if ((req.user.role === 'Dealer' || req.user.role === 'Admin') && req.body.buyerId) {
      buyerId = req.body.buyerId;
    }

    const ledger = await CreditLedger.findOne({ buyer: buyerId }).populate('buyer');
    if (!ledger) {
      return res.status(404).json({ success: false, message: 'Credit ledger record not found' });
    }

    // Deduct payment from outstanding
    ledger.outstandingBalance -= Number(amount);
    if (ledger.outstandingBalance < 0) {
      // Overpayment is fine, represents a credit balance, but we pin it or allow negative outstanding
    }

    const paymentTx = {
      type: 'Credit',
      amount: Number(amount),
      referenceModel: 'Payment',
      referenceId: ledger.buyer._id,
      description: `Payment Received - Ref #${referenceNumber || 'NEFT-' + Math.floor(Math.random() * 10000000)}`,
    };

    ledger.paymentHistory.push(paymentTx);
    await ledger.save();

    // Notify user of payment acknowledgement
    const userMsg = `Payment ACK: We received INR ${Number(amount).toFixed(2)} toward your Credit outstanding balance. New outstanding balance is INR ${ledger.outstandingBalance.toFixed(2)}. Remaining Limit: INR ${(ledger.creditLimit - ledger.outstandingBalance).toFixed(2)}.`;
    await sendWhatsAppAlert(ledger.buyer.phone, userMsg);

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: ledger,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Adjust credit limit for builder (Dealer/Admin only)
// @route   PUT /api/credit/limit
// @access  Private (Dealer/Admin)
export const updateCreditLimit = async (req, res, next) => {
  try {
    const { buyerId, newLimit } = req.body;

    if (!buyerId || !newLimit || newLimit < 0) {
      return res.status(400).json({ success: false, message: 'Please provide valid buyerId and new credit limit' });
    }

    const ledger = await CreditLedger.findOne({ buyer: buyerId }).populate('buyer');
    if (!ledger) {
      return res.status(404).json({ success: false, message: 'Credit ledger record not found for builder' });
    }

    ledger.creditLimit = Number(newLimit);
    await ledger.save();

    const notifyMsg = `Hi ${ledger.buyer.name}, your credit line limit has been adjusted by the Dealer to INR ${Number(newLimit).toFixed(2)}.`;
    await sendWhatsAppAlert(ledger.buyer.phone, notifyMsg);

    res.status(200).json({
      success: true,
      message: 'Credit limit updated successfully',
      data: ledger,
    });
  } catch (error) {
    next(error);
  }
};
