import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function run() {
  const modelsToTest = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
    'gemini-2.5-flash',
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash',
    'gemini-1.0-pro'
  ];
  for (const modelName of modelsToTest) {
    try {
      const m = genAI.getGenerativeModel({ model: modelName });
      const res = await m.generateContent("Hello");
      console.log(`Success with ${modelName}:`, res.response.text());
      return; // Stop on first success
    } catch (e) {
      console.log(`Failed with ${modelName}:`, e.message);
    }
  }
}

run();
