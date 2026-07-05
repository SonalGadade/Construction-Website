import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_construction');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.log('Ensure local MongoDB server is running or configure MONGO_URI in backend/.env');
    // We don't exit the process immediately so we can see the error, but in production, we might.
    process.exit(1);
  }
};

export default connectDB;
