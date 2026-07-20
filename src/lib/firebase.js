import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyDPbGjux8qSlgyQbZRVFrTxxNRVgLOgDbc',
  authDomain: 'coffeespots-e1460.firebaseapp.com',
  projectId: 'coffeespots-e1460',
  storageBucket: 'coffeespots-e1460.firebasestorage.app',
  messagingSenderId: '630721079699',
  appId: '1:630721079699:web:73cad3a51d60e24bcbe066',
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let app = null;
function getFirebaseApp() {
  if (!app) app = initializeApp(firebaseConfig);
  return app;
}

export async function requestNotificationToken() {
  const supported = await isSupported().catch(() => false);
  if (!supported) throw new Error('Push notifications are not supported in this browser');
  if (!VAPID_KEY) throw new Error('VITE_FIREBASE_VAPID_KEY is not set');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was not granted');

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const messaging = getMessaging(getFirebaseApp());
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) throw new Error('Could not get a notification token');
  return token;
}
