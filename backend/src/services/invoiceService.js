import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoicePDF = (order, buyerDetails) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const dirPath = path.join(__dirname, '../../public/invoices');
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      const filename = `invoice-${order.orderNumber}.pdf`;
      const filePath = path.join(dirPath, filename);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // Header block
      doc.fillColor('#2563eb').fontSize(22).text('SMART CONSTRUCTION MATERIALS', { align: 'left' });
      doc.fillColor('#475569').fontSize(10).text('101 Builder Plaza, Sector 62, Noida, UP, India');
      doc.text('GSTIN: 09AAAAA1111A1Z1 | Support: support@smartconstruction.com');
      doc.moveDown(1.5);

      // Divider line
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1.5);

      // Title & Meta details
      doc.fillColor('#1e293b').fontSize(16).text('TAX INVOICE', { align: 'right' });
      doc.moveDown(0.5);
      
      const metaY = doc.y;
      doc.fontSize(10).fillColor('#475569');
      doc.text(`Invoice No: ${order.orderNumber}`, 350, metaY, { align: 'right' });
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 350, metaY + 15, { align: 'right' });
      doc.text(`Payment Term: ${order.paymentMethod}`, 350, metaY + 30, { align: 'right' });
      doc.text(`Payment Status: ${order.paymentStatus}`, 350, metaY + 45, { align: 'right' });

      // Customer Info
      doc.text('Billed To:', 50, metaY);
      doc.fillColor('#0f172a').fontSize(11).text(buyerDetails.name, 50, metaY + 15);
      doc.fillColor('#475569').fontSize(10);
      if (buyerDetails.companyName) {
        doc.text(buyerDetails.companyName, 50, metaY + 30);
      }
      if (buyerDetails.gstNumber) {
        doc.text(`GSTIN: ${buyerDetails.gstNumber}`, 50, metaY + 45);
      }
      
      const shippingText = `Shipping: ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zipCode}`;
      doc.text(shippingText, 50, metaY + 60, { width: 280 });
      doc.moveDown(3);

      // Table Header
      const tableTop = doc.y + 15;
      doc.fillColor('#0f172a').fontSize(10);
      doc.text('Item / Specification', 50, tableTop);
      doc.text('Qty', 320, tableTop, { width: 30, align: 'right' });
      doc.text('Rate (INR)', 370, tableTop, { width: 80, align: 'right' });
      doc.text('Amount (INR)', 470, tableTop, { width: 80, align: 'right' });
      
      doc.strokeColor('#94a3b8').lineWidth(1).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
      
      // Table Content
      let currentY = tableTop + 25;
      order.items.forEach((item) => {
        const prodName = item.product?.name || 'Construction Material';
        const prodUnit = item.product?.unit || 'Units';
        
        doc.text(`${prodName} (${prodUnit})`, 50, currentY, { width: 250 });
        doc.text(item.quantity.toString(), 320, currentY, { width: 30, align: 'right' });
        doc.text(item.pricePerUnit.toFixed(2), 370, currentY, { width: 80, align: 'right' });
        doc.text(item.subtotal.toFixed(2), 470, currentY, { width: 80, align: 'right' });
        
        currentY += 20;
      });

      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, currentY + 5).lineTo(550, currentY + 5).stroke();
      currentY += 15;

      // Summary block
      doc.text('Subtotal:', 350, currentY, { align: 'right', width: 100 });
      doc.text(order.subtotal.toFixed(2), 470, currentY, { align: 'right', width: 80 });
      
      doc.text(`GST (${order.gstRate}%):`, 350, currentY + 15, { align: 'right', width: 100 });
      doc.text(order.gstAmount.toFixed(2), 470, currentY + 15, { align: 'right', width: 80 });

      if (order.deliveryCharge > 0) {
        doc.text('Delivery Charge:', 350, currentY + 30, { align: 'right', width: 100 });
        doc.text(order.deliveryCharge.toFixed(2), 470, currentY + 30, { align: 'right', width: 80 });
        currentY += 15;
      }
      
      if (order.discountAmount > 0) {
        doc.text('Discount:', 350, currentY + 30, { align: 'right', width: 100 });
        doc.text(`-${order.discountAmount.toFixed(2)}`, 470, currentY + 30, { align: 'right', width: 80 });
        currentY += 15;
      }

      doc.strokeColor('#0f172a').lineWidth(1.5).moveTo(350, currentY + 32).lineTo(550, currentY + 32).stroke();
      
      doc.fillColor('#2563eb').fontSize(12);
      doc.text('Total Amount (INR):', 330, currentY + 40, { align: 'right', width: 120 });
      doc.text(order.totalAmount.toFixed(2), 470, currentY + 40, { align: 'right', width: 80 });

      doc.fontSize(8).fillColor('#64748b').text('Thank you for your business. Terms of payment: 30 days for Credit Line customers. All materials are subject to standard quality testing upon delivery.', 50, doc.page.height - 70, { align: 'center', width: 500 });

      doc.end();

      writeStream.on('finish', () => {
        resolve(`/invoices/${filename}`);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

export default { generateInvoicePDF };
