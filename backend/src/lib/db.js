// import mongoose from "mongoose";

// export const connectDB = async () => {
//     try {
//         const conn = await mongoose.connect(process.env.MONGO_URI);
//         console.log(`MongoDB Connected: ${conn.connection.host}`);
//     } catch (error) {
//         console.log("Error in connecting MongoDB", error);
//         process.exit(1); 
        
//     }
// }
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.log("Error in connecting MongoDB", error);
    process.exit(1);
  }
};