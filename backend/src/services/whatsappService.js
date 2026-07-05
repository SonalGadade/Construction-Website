export const sendWhatsAppAlert = async (phone, message) => {
  console.log(`\n======================================================`);
  console.log(`[WHATSAPP SERVICE] Sending message to: ${phone}`);
  console.log(`[CONTENT]: ${message}`);
  console.log(`======================================================\n`);
  return { success: true, timestamp: new Date() };
};

export default { sendWhatsAppAlert };
