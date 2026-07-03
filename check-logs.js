import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./firebase-service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function check() {
  const snapshot = await db.collection('ai_logs').orderBy('timestamp', 'desc').limit(5).get();
  console.log('Total returned:', snapshot.size);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(doc.id, '=>', {
      actionType: data.actionType,
      query: data.query,
      timestamp: data.timestamp ? data.timestamp.toDate().toString() : null
    });
  });
  
  // also check how many total
  const all = await db.collection('ai_logs').count().get();
  console.log('Total count in ai_logs:', all.data().count);
}

check();
