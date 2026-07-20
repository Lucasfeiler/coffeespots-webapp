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

  const fieldTypes = Object.fromEntries(
    ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id']
      .map((k) => [k, typeof serviceAccount[k]])
  );
  const privateKeyPreview = typeof serviceAccount.private_key === 'string'
    ? `len=${serviceAccount.private_key.length} starts="${serviceAccount.private_key.slice(0, 15)}" hasLiteralBackslashN=${serviceAccount.private_key.includes('\\n')} hasRealNewline=${serviceAccount.private_key.includes('\n')}`
    : 'not a string';

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: bucketName,
      });
    }
    bucket = admin.storage().bucket();
  } catch (e) {
    throw new Error(
      `Firebase Storage init failed (bucketName="${bucketName}"): ${e.message} | fieldTypes=${JSON.stringify(fieldTypes)} | privateKey: ${privateKeyPreview}`
    );
  }

  return bucket;
}
