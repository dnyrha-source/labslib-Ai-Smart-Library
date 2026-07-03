const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
  const snapshot = await db.collection('ai_logs').get();
  console.log('Total ai_logs:', snapshot.size);
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}

check();
