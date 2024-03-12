import mongoose from "mongoose";
import connectDB from "./connectMongoDB.js";
 
// Connect to MongoDB
connectDB();
 
/*
mongoose.connect("mongodb+srv://devarasettyvinod:vinod123@cluster0.lftaulw.mongodb.net/userdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});*/
const trainingDocumentSchema = new mongoose.Schema({
  _id: String,
  skill: String,
  link: [String],
});
 
const TrainingDocument = mongoose.model("traningdocs", trainingDocumentSchema);
 
/*
async function fetchTrainingDocumentBySkill(skill) {
  try {
    return await TrainingDocument.findOne({ skill });
  } catch (error) {
    console.error("Error fetching training document:", error);
    throw error;
  }
}*/
 
async function fetchTrainingDocumentBySkill(skills) {
    try {
      const result = await TrainingDocument.findOne({ skill:skills }).maxTimeMS(30000); // Set max time to 30 seconds
 
      console.log("Result : "  + result);
      return result
    } catch (error) {
      console.error("Error fetching training document:", error);
      throw error;
    }
  }
 
 
export { fetchTrainingDocumentBySkill };