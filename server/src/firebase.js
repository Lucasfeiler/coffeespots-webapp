import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getMessaging } from 'firebase-admin/messaging';

function ensureApp() {
  if (getApps().length) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set');

  const serviceAccount = JSON.parse(raw);
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.firebasestorage.app`;

  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: bucketName,
  });
}

let bucket = null;
export function getStorageBucket() {
  if (bucket) return bucket;
  ensureApp();
  bucket = getStorage().bucket();
  return bucket;
}

export function getMessagingInstance() {
  ensureApp();
  return getMessaging();
}
