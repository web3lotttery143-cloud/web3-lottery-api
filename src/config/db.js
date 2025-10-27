import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined. .env file not loaded.');
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB Connected successfully.');
    console.log(`Connecting to: ${process.env.MONGO_URI}`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
