importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDPbGjux8qSlgyQbZRVFrTxxNRVgLOgDbc',
  authDomain: 'coffeespots-e1460.firebaseapp.com',
  projectId: 'coffeespots-e1460',
  storageBucket: 'coffeespots-e1460.firebasestorage.app',
  messagingSenderId: '630721079699',
  appId: '1:630721079699:web:73cad3a51d60e24bcbe066',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'CoffeeSpots', {
    body: body || '',
    icon: '/app-icon.svg',
  });
});
