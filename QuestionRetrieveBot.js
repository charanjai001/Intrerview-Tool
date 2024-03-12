import { fetchTrainingDocumentBySkill } from './TrainingDocumentService.js';
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { ChatOpenAI } from "@langchain/openai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
 
import * as dotenv from "dotenv";
dotenv.config();
 
// let categoryList = "";
// let noOfQuestions = 0;
// let totalQues = 1;
// let skill;
 
async function getUrlsBySkill(skill) {
 
 
    const trainingDocument = await fetchTrainingDocumentBySkill(skill);
    console.log("Training in call : " + trainingDocument)
    return trainingDocument ? trainingDocument.link : [];
}
 
async function initializeComponents(categoryList1, noOfQuestions1, totalQues1, skill1) {
 
    const categoryList = categoryList1;
    const noOfQuestions = noOfQuestions1;
    const totalQues = totalQues1;
    const skill = skill1;
 
 
    const urls = await getUrlsBySkill(skill);
    console.log("Training final: " + urls)
 
    const loader = new CheerioWebBaseLoader(...urls);
    const docsList = [];
 
    for (const url of urls) {
        const docs = await loader.load(url);
        docsList.push(docs);
    }
 
    const splitter = new RecursiveCharacterTextSplitter();
    const splitDocs = await splitter.splitDocuments(...docsList);
 
    const embeddings = new OpenAIEmbeddings();
 
    const vectorestore = await MemoryVectorStore.fromDocuments(
        splitDocs,
        embeddings
    );
 
    const retriever = vectorestore.asRetriever();
 
    const model = new ChatOpenAI({
        temperature: 1,
        
    });
 
    const prompt = ChatPromptTemplate.fromTemplate(
        `Use the following piece of context to generate interview questions related to the specified categories : ${categoryList} .  
        Generate ${noOfQuestions} interview questions from each category.
        Dont add serial number for question.
        Generate question by comma sperated.  
        After the question mark, give the category name in brackets:
        <context>
        {context}
        </context>
        Topic: {input}`
    );

 
    const chain = await createStuffDocumentsChain({
        llm: model,
        prompt
    });
 
    const retrievalChain = await createRetrievalChain({
        combineDocsChain: chain,
        retriever,
    });
 
    return retrievalChain;
}
 
async function process(input, noOfQuestions1, totalQues1, skill) {
   
    const retrievalChain = await initializeComponents(input, noOfQuestions1, totalQues1, skill);
    const result = await retrievalChain.invoke({
        input: input,
    });
    

    return result.answer;
}
 
export { process };
 