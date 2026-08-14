import dotenv from 'dotenv';
dotenv.config();

// Fix Firebase import issue by mocking before importing
import { groqService } from './src/data/services/groq.service.js';

async function test() {
  try {
    const chatSession = groqService.startChatSession([]);
    const res = await groqService.sendMessageToChat(chatSession, "carikan saya buku astronomi", [{biblio_id: "1", title: "Astronomi 1"}]);
    console.log("Success:", res);
  } catch (err) {
    console.error("Chat Error:", err);
  }
}

test();
