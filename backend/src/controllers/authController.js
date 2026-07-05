import User from '../models/User.js';
import CreditLedger from '../models/CreditLedger.js';
import jwt from 'jsonwebtoken';
import { sendWhatsAppAlert } from '../services/whatsappService.js';

// Helper to sign JWT
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'supersecretjwtkeyforconstructionmaterialsmarketplace',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        companyName: user.companyName,
        gstNumber: user.gstNumber,
        loyaltyPoints: user.loyaltyPoints,
        address: user.address,
      },
    });
};

// Temp store for simulated OTPs: phone -> otp
const otpMap = new Map();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, companyName, gstNumber, address } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Retail',
      phone,
      companyName,
      gstNumber,
      address,
    });

    // If builder, contractor, gold, or silver, automatically initialize their credit ledger
    if (['Builder', 'Contractor', 'Gold', 'Silver'].includes(user.role)) {
      let limit = 100000; // Silver
      if (user.role === 'Gold') limit = 1000000;
      else if (user.role === 'Builder') limit = 500000;
      else if (user.role === 'Contractor') limit = 600000;

      await CreditLedger.create({
        buyer: user._id,
        creditLimit: limit,
        outstandingBalance: 0,
      });
    }

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Request OTP (simulate WhatsApp OTP login)
// @route   POST /api/auth/otp-request
// @access  Public
export const requestOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Please provide a phone number' });
    }

    // Find user by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account associated with this phone number' });
    }

    // Generate a 6 digit code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpMap.set(phone, otp);

    // Simulate sending OTP via WhatsApp Business API
    const message = `Your Smart Construction Marketplace login code is ${otp}. Valid for 5 minutes.`;
    await sendWhatsAppAlert(phone, message);

    res.status(200).json({ success: true, message: `OTP sent successfully to ${phone} via WhatsApp (simulation).` });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/otp-verify
// @access  Public
export const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide phone and OTP' });
    }

    const storedOtp = otpMap.get(phone);
    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // OTP matched, delete it from temporary cache
    otpMap.delete(phone);

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
