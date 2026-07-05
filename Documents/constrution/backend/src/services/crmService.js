import Quote from '../models/Quote.js';
import { sendWhatsAppAlert } from './whatsappService.js';
import nodemailer from 'nodemailer';

// Mock mail transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: process.env.EMAIL_USER || 'mock_email@gmail.com',
    pass: process.env.EMAIL_PASS || 'mock_email_password',
  },
});

export const scanAndRemindQuotes = async (hoursThreshold = 24) => {
  try {
    const cutoffTime = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);
    
    // Find quotes updated/created before the cutoff that are either Pending or Negotiated
    const idleQuotes = await Quote.find({
      status: { $in: ['Pending', 'Negotiated'] },
      updatedAt: { $lte: cutoffTime },
    }).populate('buyer');

    console.log(`[CRM JOB] Scanning idle quotes older than ${hoursThreshold} hours. Found ${idleQuotes.length} quotes.`);

    const results = [];
    
    for (const quote of idleQuotes) {
      const buyer = quote.buyer;
      if (!buyer) continue;

      const message = `Hello ${buyer.name}, your quotation RFQ #${quote._id.toString().substring(18)} for construction materials is currently ${quote.status}. Approve or place counter-offers now to secure your inventory and current pricing!`;
      
      // Send WhatsApp Mock
      await sendWhatsAppAlert(buyer.phone, message);

      // Send Mock Email
      const mailOptions = {
        from: '"Smart Construction Materials" <no-reply@smartconstruction.com>',
        to: buyer.email,
        subject: `Reminder: Your RFQ is pending action - Smart Construction Marketplace`,
        text: message,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 600px;">
                <h2 style="color: #2563eb;">Action Required: Quote Pending</h2>
                <p>Hello ${buyer.name},</p>
                <p>You have a pending quote request with status: <strong>${quote.status}</strong>.</p>
                <p>Total Amount: <strong>INR ${quote.totalOfferedAmount || quote.totalRequestedAmount}</strong></p>
                <p>To secure this pricing and prevent inventory depletion at the warehouse, please review and approve it from your dashboard.</p>
                <br />
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/quotes" style="background-color: #2563eb; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Review Quote</a>
                <br /><br />
                <p>Regards,<br/>Smart Construction Materials Team</p>
              </div>`,
      };

      try {
        // We log since it's a simulated environment, but we attempt sending too
        console.log(`[CRM MAIL] Sending email reminder to ${buyer.email}`);
        await transporter.sendMail(mailOptions);
      } catch (err) {
        console.log(`[CRM MAIL INFO] Email sending skipped or failed (mock environment: ${err.message})`);
      }

      results.push({
        quoteId: quote._id,
        buyerName: buyer.name,
        status: quote.status,
      });
    }

    return results;
  } catch (error) {
    console.error(`Error running CRM follow-up job: ${error.message}`);
    throw error;
  }
};

export default { scanAndRemindQuotes };
