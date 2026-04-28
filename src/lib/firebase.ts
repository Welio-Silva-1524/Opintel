import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// We'll try to load from a potentially missing file
let firebaseConfig: any = {};
try {
  // @ts-ignore
  import config from '../../firebase-applet-config.json';
  firebaseConfig = config;
} catch (e) {
  console.warn("Firebase config not found. App will run in mock mode.");
}

const app = initializeApp(firebaseConfig.apiKey ? firebaseConfig : {
  apiKey: "placeholder",
  authDomain: "placeholder",
  projectId: "placeholder",
  storageBucket: "placeholder",
  messagingSenderId: "placeholder",
  appId: "placeholder"
});

export const db = getFirestore(app);
export const auth = getAuth(app);
