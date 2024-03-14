import mongoose from "mongoose";
 
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://devarasettyvinod:vinod123@cluster0.lftaulw.mongodb.net/userdb", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit process with failure
  }
};
 
export default connectDB;
