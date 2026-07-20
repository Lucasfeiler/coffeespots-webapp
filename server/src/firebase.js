import admin from 'firebase-admin';

let bucket = null;

export function getStorageBucket() {
  if (bucket) return bucket;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set');

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch (e) {
    throw new Error(`FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON: ${e.message}`);
  }

  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.firebasestorage.app`;

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: bucketName,
      });
    }
    bucket = admin.storage().bucket();
  } catch (e) {
    throw new Error(`Firebase Storage init failed (bucketName="${bucketName}"): ${e.message}`);
  }

  return bucket;
}
