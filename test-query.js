import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./firebase-service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function test() {
  try {
    const booksSnap = await db.collection('books').count().get();
    console.log('Books count:', booksSnap.data().count);
    const researchSnap = await db.collection('research').count().get();
    console.log('Research count:', researchSnap.data().count);
    const usersSnap = await db.collection('users').count().get();
    console.log('Users count:', usersSnap.data().count);
    const aiLogsSnap = await db.collection('ai_logs').count().get();
    console.log('AI Logs count:', aiLogsSnap.data().count);
    
    const logsSnap = await db.collection('ai_logs').orderBy('timestamp', 'desc').limit(500).get();
    console.log('Logs returned:', logsSnap.size);
  } catch(e) {
    console.error('Error:', e);
  }
}
test();
