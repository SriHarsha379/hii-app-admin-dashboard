import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectMongo = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI is not configured");

  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(mongoUri);
  console.log("MongoDB Connected");
};
