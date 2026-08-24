const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

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
