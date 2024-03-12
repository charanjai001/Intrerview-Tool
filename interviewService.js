import mongoose from "mongoose";
 
const interviewDetailsSchema = new mongoose.Schema({
  _id: String,
  candidateId: String,
  interviewScheduledtime: Date,
  interviewStatus: String,
  skillCategories: [{
    _id: Number,
    skill: String,
    category: [String],
    noOfQuestions: Number,
  }],
  panelId: String,
  meetingLink: String,
  _class: String,
});
 
const InterviewDetails = mongoose.model("InterviewDetails", interviewDetailsSchema);
 
async function fetchInterviewDetails(candidateId) {
  try {
    return await InterviewDetails.findOne({ candidateId });
  } catch (error) {
    console.error("Error fetching interview details:", error);
    throw error;
  }
}
 
// Method to update interviewStatus
 
async function updateInterviewStatus1(interviewDetails) {
  try {
    const doc = await InterviewDetails.findOneAndUpdate({  candidateId : interviewDetails.candidateId}, {interviewStatus: interviewDetails.interviewStatus}, {
      new: true
    });
 
 
 
    
    return interviewDetails;
  } catch (error) {
    console.error("Error updating interview status:", error);
    throw error;
  }
};
 
function extractCategoryArray(interviewDetails) {
  if (interviewDetails && interviewDetails.skillCategories && interviewDetails.skillCategories.length > 0) {
    const skillCategories = interviewDetails.skillCategories[0];
    return skillCategories.category;
  } else {
    return null;
  }
}
 
function extractCategoryArray2(interviewDetails) {
  if (interviewDetails && interviewDetails.skillCategories && interviewDetails.skillCategories.length > 0) {
    const skillCategories = interviewDetails.skillCategories[0];
    return skillCategories.category;
  } else {
    return null;
  }
}
 
async function updateInterviewStatus(candidateId, newStatus) {
  try {
    const interview = await fetchInterviewDetails(candidateId);
    console.log("interview" + interview)
 
  
    if (interview) {
      console.log("interview.interviewStatus :" + interview.interviewStatus)
      interview.interviewStatus = newStatus;
      // await interview.save();
    
      await updateInterviewStatus1(interview);
      return interview;
    } else {
      console.error("Interview not found for candidate:", candidateId);
      return null;
    }
  } catch (error) {
    console.error("Error updating interview status:", error);
    throw error;
  }
}
 
 
export { fetchInterviewDetails, extractCategoryArray , updateInterviewStatus};
