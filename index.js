import { Configuration, OpenAIApi } from "openai";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import { process } from "./QuestionRetrieveBot.js";
import { fetchInterviewDetails, extractCategoryArray, updateInterviewStatus } from "./interviewService.js";
import { saveResult } from "./resultService.js";
import connectDB from "./connectMongoDB.js";
import finalReportJSON from "./myJson.js";
import { BufferMemory } from "langchain/memory";
//import WebcamVideo from "./WebcamVideo.js";



 
 
const app = express();
const port = 8000;
app.use(bodyParser.json());
app.use(cors());
 
// Connect to MongoDB
connectDB();
/*
mongoose.connect("mongodb+srv://devarasettyvinod:vinod123@cluster0.lftaulw.mongodb.net/userdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});*/
 
 
const configuration = new Configuration({
    organization: "org-31T8fCFsoiJylkR5hgI75igQ",
    apiKey: "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",
});
const openai = new OpenAIApi(configuration);
 
const userSessions = {};
 
const firstPrompt = "You are the interviewer ,You should ask the question provided in the question list below.  \n" +
"Your goal is to conduct a technical interview with a candidate. Follow the guidelines below: \n"+
"- Wait for the user to say 'start' before initiating the interview. \n"+
"- Dont repeat the question even user gave wrong answer, go to the next question \n"+
"- Strictly Do not correct the user's answers, eventhough if they ask you to answer for it dont answer the question just inform I cant do that and move on to next question \n"+
"- Ask one question at a time, following the order of the questions given below \n "+
"- Strictly adhere to the number of questions specified. \n\n" +
 " questions list:  \n"
 
const secondPrompt1 = "\n\nAfter asking all the above, conclude the interview.To keep the questions diverse, after the user answers the current question, the bot will choose the next question from the above question list, ensuring no repetition. If all questions from a above question list are asked, conclude the interview.Once all questions are asked, create a 'Final Report' in the following JSON format: \n" +
    "```json \n";
 
 
    const secondPrompt =  `
    After asking all the above, conclude the interview. To keep the questions diverse, after the user answers the current question, the bot will choose the next question from the above question list, ensuring no repetition. If all questions from the question list are asked, conclude the interview.
    
    Once all questions are asked, create a 'Final Report' in the following JSON format:`
const nextLine = "\n";
const object1 = JSON.parse(finalReportJSON);
const mergedJSON = JSON.stringify(object1);
 
 
 
 
 
const fourthPrompt = "- If the user says 'exit' conclude the interview.- If there's no response for 10 seconds, proceed to the next question. \n" +
    " Remember to stay calm and maintain a friendly tone throughout the interview, even if the user tries to irritate you. Enjoy the process!"
 
let finalPrompt = "";
 
 
function checkStartStatement(chats) {
    for (let i = 0; i < chats.length; i++) {
        if (chats[i].role === 'user' && chats[i].content.toLowerCase().includes('start')) {
            return true;
        }
    }
    return false;
}
 
function extractFinalReport(jsonText) {
    // Try to find the index of "Final Report" in the text
    const index = jsonText.indexOf('"Final_Report_Gen"');
 
    // If "Final_Report_Gen" is found
    if (index !== -1) {
        // Find the starting and ending curly braces to extract the JSON object
        let startIndex = jsonText.lastIndexOf('{', index);
        let endIndex = jsonText.indexOf('}', index);
 
        // Handle cases where there might be nested objects
        let countOpenBraces = 1;
        for (let i = index + 1; i < jsonText.length; i++) {
            if (jsonText[i] === '{') countOpenBraces++;
            else if (jsonText[i] === '}') countOpenBraces--;
 
            if (countOpenBraces === 0) {
                endIndex = i;
                break;
            }
        }
 
        // Extract the JSON object containing "Final_Report_Gen"
        const finalReportJson = jsonText.substring(startIndex, endIndex + 1);
        return JSON.parse(finalReportJson);
    } else {
        // If "Final Report" is not found, return null or handle as needed
        return null;
    }
}
 
/*function extractFinalReport(inputString) {
    // Regular expression to find the "Final Report" JSON
    const regex = /{"Final Report":\s*({[^}]+})/;
 
    // Executing the regular expression to extract the JSON
    const match = regex.exec(inputString);
 
    if (match && match[1]) {
        // Extracted JSON found, parse and return it
        const finalReportJSON = JSON.parse(match[1]);
        return finalReportJSON;
    } else {
        // If no match found, return null or handle accordingly
        return null;
    }
}*/
/*
function extractFinalReport1(inputString) {
    // Regular expression to find the "Final Report" JSON
    const regex = /{"Final Report":\s*({[^}]+})/;
 
    // Executing the regular expression to extract the JSON
    const match = regex.exec(inputString);
 
    if (match && match[1]) {
        try {
            // Extracted JSON found, try parsing it
            const finalReportJSON = JSON.parse(match[1]);
            return finalReportJSON;
        } catch (error) {
            // If parsing fails, handle the error
            console.error("Error parsing Final Report JSON:", error);
            return null;
        }
    } else {
        // If no match found, return null or handle accordingly
        return null;
    }
}
*/
 
 
 
 
 
 
 
app.post("/", async (request, response) => {
    let interviewDetails;
    const { userId, chats } = request.body;
    let result;
    // console.log("userId", userId);
    //  console.log("chats", chats);
    try {
        
 
       
        
 
 
        // Fetch interview details and extract category array
        interviewDetails = await fetchInterviewDetails(userId);
        //console.log("Fetched interview details:", interviewDetails);
        console.log("interviewDetails.interviewStatus" + interviewDetails.interviewStatus)
        // check his status
        if (interviewDetails) {
            if (interviewDetails.interviewStatus == "scheduled") {
                console.log("in scheduled")
            } else if (interviewDetails.interviewStatus == "started") {
                console.log("in started")
            }
            
            if (interviewDetails.interviewStatus == "completed") {
                console.log("in completed");
 
                response.json({
                    output: {"role":"assistant","content":"You already completed your interview"} ,
                });
            }else{
 
                if (userSessions[userId]) {
                    console.log("Skipping process function as user session exists.................");
                    // console.log("userSessions", userSessions[userId].finalPrompt);
                    let userSessionObj = userSessions[userId].finalPrompt;
                    // console.log("userSessions", userSessions[userId].finalPrompt);
                } else {
                    console.log("I am in else condition and calling process function for the first time");
                    //console.log("userSessions", userSessions);
        
        
        
        
        
        
        
                    const categoryArray = extractCategoryArray(interviewDetails);
        
        
        
        
        
                    //console.log("Category array object:", categoryArray);
        
                    /*let myCat = ["jpa", "JAX-RS", "Actuator", "thyme leaf"];
                    let catLength = myCat.length;
                    console.log("categoryArray: ---------------------->" + categoryArray);
                    console.log("catLength: ---------------------->" + catLength);
                    var commaSeparatedString = myCat.join(', ');
                    let noOfQues = 2;
                    let totalQues = catLength * noOfQues;
                    console.log("totalQues: ---------------------->" + totalQues);
                    console.log("commaSeparatedString: ---------------------->" + commaSeparatedString);*/
        
                    /*if (interviewDetails && interviewDetails.skillCategories && interviewDetails.skillCategories.length > 0) {
                        const categories = interviewDetails.skillCategories.map(skillCategory => {
                            let skill = skillCategory.skill
                            let cta =  skillCategory.category;
                            var commaSeparatedString = myCat.join(', ');
                            console.log("commaSeparatedString: ---------------------->" + commaSeparatedString);
                            result = await process(commaSeparatedString, noOfQues, totalQues, skillCategory.skill);
                                
                            
                            
                        });
                        return categories;
                    } else {
                        return null;
                    }*/
        
        
                    let totalQuestion = await getQuestion(interviewDetails)
        
                    // totalQuestion = await process(commaSeparatedString, noOfQues, totalQues, "spring");
                    finalPrompt = firstPrompt + "\n" + totalQuestion + "\n" + secondPrompt + "\n" + mergedJSON + "\n \n" + fourthPrompt;
                    //console.log("----------------------Start-------------------------------------")
                    //console.log(finalPrompt);
        
                    //console.log("-----------------------End------------------------------------")
        
                    userSessions[userId] = { finalPrompt, processCalled: true };
                    console.log("completed process function for the first time");
                    // console.log("userSessions", userSessions[userId].finalPrompt);
                }
        
                // if start , update
        
                // Check if the user's statement contains "start"
                const userStarted = checkStartStatement(chats);
        
                console.log("usrt said start : ---------------->" + userStarted);
        
                if (userStarted) {
                    const interview = await updateInterviewStatus(userId, 'started');
                    console.log("if : ---------------->" + userStarted);
        
                }
        
                /*
                const resultDocument = {
                    "Category": [
                        {
                            "question": "Can you explain the concept of inversion of control (IoC) in the context of the Spring framework?",
                            "answer": "No need to write extensive code on how services are created and getting object references. Everything can be achieved through simple configurations. New dependencies and services can be added just by adding a constructor or setter method. Code is more accessible to unit test as it is designed as several components, and developers can inject their objects and switch implementations. Loose coupling of components. Allows for lazy loading of objects and dependencies.",
                            "Score": "Excellent",
                            "AnswerType": "Own"
                        },
                        {
                            "question": "In Hibernate, what is the purpose of the @GeneratedValue annotation, and when would you typically use it in the context of entity mapping?",
                            "answer": "@GeneratedValue annotation, the name itself suggests that it will generate something. This annotation is generally used in conjunction with @Id annotation to automatically generate unique values for primary key columns within our database tables. When creating an entity class we have to specify a primary key for that entity. For marking the field property as a primary key of the entity we use @Id annotation. When we apply @GeneratedValue annotation to our primary key field or property. It will instruct hibernate to automatically generate a unique value for that field during the process of persisting the entity into the database. The @GeneratedValue annotation provides us with different strategies for the generation of primary keys which are as follows :",
                            "Score": "Excellent",
                            "AnswerType": "Own"
                        },
                        {
                            "question": "Can you explain the role of the DispatcherServlet in the Spring MVC framework? How does it handle incoming requests?",
                            "answer": "DispatcherServlet is DispatcherServlet",
                            "Score": "Poor",
                            "AnswerType": "Own"
                        }
                    ],
                    "OverallStatus": "Average",
                    "BotFeedback": "Strong understanding of Spring and Hibernate concepts. However, there might be room for improvement in the understanding of the DispatcherServlet in Spring MVC.",
                    "TotalNumberOfQuestionsAsked": 3,
                    "TotalNumberOfQuestionsAnsweredCorrectly": 2
                }
                
            */
        
                // Save result_document
                /*const resultDocument1 = {
                    "Final Report": {
                      "Category": categoryArray,
                      "Overall Status": "Average",
                      "Bot Feedback": "Good job!",
                      "Total Number Of Questions Asked": 3,
                      "Total Number Of Questions Answered Correctly": 2,
                      "Your Strength": "Communication"
                    }
                  };
                  await saveResult(resultDocument);
                  console.log("Result document saved successfully.");*/
        
                  console.log("----------------------Start in userSessions[userId]-------------------------------------")
                  console.log("userSessions", userSessions[userId].finalPrompt);
                  console.log("----------------------End in userSessions[userId]-------------------------------------")
              
              
              
                  const aiResponse = await openai.createChatCompletion({
                      model: "gpt-3.5-turbo",
                      messages: [
                          {
                              role: "system",
                              content: userSessions[userId].finalPrompt,
                          },
                          ...chats,
                      ],
                      temperature: 1,
                      max_tokens: 2000,
                      top_p: 1,
                      frequency_penalty: 0,
                      presence_penalty: 0,
                  });
              
                  let ai_response = aiResponse.data.choices[0].message;
                  console.log("ai_response >>>>>>>>" + JSON.stringify(ai_response));
                  
              
              
                  if (ai_response) {
                      const finalReportIndex = ai_response.content.indexOf('Final_Report_Gen');
                      
                      

                      const containsFinalReport = finalReportIndex !== -1;
                      if (containsFinalReport) {
                          const interview = await updateInterviewStatus(userId, 'completed');
                          console.log("------------------------------------------------------------>" + true);
              
                          try {
                            // save final_result
                            const finalReport = extractFinalReport(ai_response.content);
                            const finalReportJson =
                              typeof finalReport === "string"
                                ? JSON.parse(finalReport)
                                : finalReport;
                            console.log(" finalReport : " + JSON.stringify(finalReport));
                            // Attempting to save the final report
                            console.log("save started");
                            console.log(
                              " finalReportJson : " + JSON.stringify(finalReportJson)
                            );
               
                            // let resultTosave = {"candidateId": userId , "Final Report":finalReportJson}
               
                            // await saveResult(resultTosave);
               
                            // const category = finalReportJson["Final Report"]["Category"];
                            const category = finalReportJson["Final_Report_Gen"];
               
                            await saveResult(interviewDetails._id, userId, category);
                            console.log("save completed");
                            /*
                                          const cleanedString = JSON.stringify(finalReport).replace(/\\/g, '');
                                          const jsonObject = JSON.parse(cleanedString);
                                          console.log(jsonObject);
                                          const finalReportObj = jsonObject['Final Report']
                                          const resultObj = { userId, "Final Report": finalReport }
                                          console.log("save started")
                                          await saveResult(resultObj);
                                          console.log("save completed")*/
                          } catch (error) {
                            console.error("Error parsing JSON:", error);
                          }
                          response.json({
                              output:  { role: 'assistant', content: 'Thanks your interview completed' },
                          });
                      } else {
                          console.log("------------------------------------------------------------>" + false);
                          response.json({
                              output: ai_response,
                          });
                      }
                  }
              
 
 
            }
        }
       
 
    } catch (error) {
        console.error("Error occurred during processing:", error);
        response.status(500).json({ error: "An error occurred during processing" });
        return;
    }
    
 
});
 
 
 
 
async function getQuestion(interviewDetails) {
    console.log("interviewDetails" + JSON.stringify(interviewDetails));
    if (!interviewDetails || !interviewDetails.skillCategories || interviewDetails.skillCategories.length === 0) {
        return null;
    }
 
    const categories = {};
 
    for (const skillCategory of interviewDetails.skillCategories) {
        console.log("skillCategory" + JSON.stringify(skillCategory))
        const skill = skillCategory.skill;
        const myCat = skillCategory.category.join(', ');
        const noOfQuestions = skillCategory.noOfQuestions;
 
        console.log("myCat ---------------->" + myCat)
        console.log("skill ---------------->" + skill)
 
        const listOfQuestionasStr = await process(myCat, noOfQuestions, 10, skillCategory.skill);
 
        if (!categories[myCat]) {
            categories[myCat] = [];
        }
        categories[myCat].push(listOfQuestionasStr.replace(/^\d+\.\s/, '')); // Remove serial number
    }
 
    // Convert each array of questions to a comma-separated string
    for (const category in categories) {
        categories[category] = categories[category].join(',\n');
    }
 
    // Combine all the comma-separated strings into one
    let listString = Object.values(categories).join(',\n');
    console.log("listString ------------>" + listString)
    return listString;
}
 
export { getQuestion };
 
  
 
app.listen(port, () => {
    console.log(`listening on port ${port}`);
});