import admin from 'firebase-admin';

let bucket = null;

export function getStorageBucket() {
  if (bucket) return bucket;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set');

  const serviceAccount = JSON.parse(raw);
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`;

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: bucketName,
    });
  }

  bucket = admin.storage().bucket();
  return bucket;
}
