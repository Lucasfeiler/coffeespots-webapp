import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

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

let foregroundListenerSet = false;

export async function requestNotificationToken() {
  const supported = await isSupported().catch(() => false);
  if (!supported) throw new Error('Push notifications are not supported in this browser');
  if (!VAPID_KEY) throw new Error('VITE_FIREBASE_VAPID_KEY is not set');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was not granted');

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const messaging = getMessaging(getFirebaseApp());

  // FCM only delivers to the service worker's onBackgroundMessage when the tab
  // isn't focused. While the tab is open and active, messages arrive here instead
  // — without this listener they're received by the SDK but never actually shown.
  if (!foregroundListenerSet) {
    foregroundListenerSet = true;
    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      new Notification(title || 'CoffeeSpots', { body: body || '', icon: '/app-icon.svg' });
    });
  }

  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) throw new Error('Could not get a notification token');
  return token;
}
