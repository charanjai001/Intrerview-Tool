import mongoose from "mongoose";
 
const resultSchema = new mongoose.Schema({
   
  "candidateId": String,
  "finalReport": {
    "Category": [{
      "question": String,
      "answer": String,
      "Score": String, // "Poor/Average/Excellent"
    }],
    "overallStatus": String, // "Poor/Average/Excellent"
    "botFeedback": String, // Provide feedback on the user's strengths and areas for improvement.
    "totalNoOfQuestionsAsked": Number, // Numerical value
    "totalNoOfQuestionsAnsweredCorrectly": Number, // Numerical value
    "yourStrength": String // User input for strengths
  }
});
 
const Result = mongoose.model("results", resultSchema);
/*
async function saveResult(resultData) {
  try {
    const result = await Result.create(resultData);
    console.log("Result saved successfully:", result);
    return result;
  } catch (error) {
    console.error("Error saving result:", error);
    throw error;
  }
}
*/
 
 
async function saveResult(id , candidateId, finalReport) {
  console.log(" finalReport : " + JSON.stringify(finalReport))
   console.log(" finalReport : " + JSON.stringify(finalReport))
  try {
    const result = await Result.create({  'candidateId' : candidateId, 'finalReport': finalReport });
    console.log("Result saved successfully:", result);
    return result;
  } catch (error) {
    console.error("Error saving result:", error);
    throw error;
  }
}
 
export { saveResult };
 