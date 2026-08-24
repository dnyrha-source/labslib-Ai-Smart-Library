import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from './firebase-service-account.json' with { type: "json" };

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkFirestore() {
  const snapshot = await db.collection('books').get();
  let count = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    const str = JSON.stringify(data).toLowerCase();
    if (str.includes('planet')) {
      count++;
      console.log(data.title);
    }
  });
  console.log('Total books with planet:', count);
}

checkFirestore();
