const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.VITE_GROQ_API_KEY });

async function main() {
  try {
    const res = await groq.chat.completions.create({
      messages: [{ role: 'system', content: 'You are a JSON machine.' }, { role: 'user', content: 'Output JSON' }],
      model: 'openai/gpt-oss-20b',
      response_format: { type: 'json_object' }
    });
    console.log(res.choices[0].message.content);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

main();
