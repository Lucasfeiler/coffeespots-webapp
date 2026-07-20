import admin from 'firebase-admin';

let bucket = null;

export function getStorageBucket() {
  if (bucket) return bucket;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set');

  const serviceAccount = JSON.parse(raw);
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.firebasestorage.app`;

  let cred;
  try {
    cred = admin.credential.cert(serviceAccount);
  } catch (e) {
    throw new Error(`substep=admin.credential.cert | ${e.message}`);
  }

  if (!admin.apps.length) {
    try {
      admin.initializeApp({ credential: cred, storageBucket: bucketName });
    } catch (e) {
      throw new Error(`substep=admin.initializeApp | ${e.message}`);
    }
  }

  let storageInstance;
  try {
    storageInstance = admin.storage();
  } catch (e) {
    throw new Error(`substep=admin.storage() | ${e.message}`);
  }

  try {
    bucket = storageInstance.bucket();
  } catch (e) {
    throw new Error(`substep=storageInstance.bucket() bucketName="${bucketName}" | ${e.message}`);
  }

  return bucket;
}
