import mongoose from "mongoose";
 
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://0.0.0.0:27017", {
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
