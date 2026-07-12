import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "",
});

async function listModels() {
  const models = await ai.models.list();

  console.log(models);
}

listModels();