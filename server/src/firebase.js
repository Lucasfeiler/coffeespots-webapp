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

  const shapeInfo = {
    hasProjectId: typeof serviceAccount.project_id === 'string',
    hasClientEmail: typeof serviceAccount.client_email === 'string',
    hasPrivateKey: typeof serviceAccount.private_key === 'string',
    privateKeyLength: typeof serviceAccount.private_key === 'string' ? serviceAccount.private_key.length : null,
    privateKeyHasNewlines: typeof serviceAccount.private_key === 'string' ? serviceAccount.private_key.includes('\n') : null,
  };

  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`;

  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: bucketName,
      });
    } catch (e) {
      const err = new Error(`initializeApp failed: ${e.message} | shape=${JSON.stringify(shapeInfo)}`);
      throw err;
    }
  }

  bucket = admin.storage().bucket();
  return bucket;
}
