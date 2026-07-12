import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getStorage,
} from "firebase/storage";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  initializeFirestore,
  getFirestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD3GQN4zeWOZr97_hmZ_Xje_M5-WFECX80",
  authDomain: "edulance-66e03.firebaseapp.com",
  projectId: "edulance-66e03",
  storageBucket: "edulance-66e03.firebasestorage.app",
  messagingSenderId: "700394410080",
  appId: "1:700394410080:web:6ee92ac0d569dfb2573305",
  measurementId: "G-HKD121ZZF5",
};

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

let auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  auth = getAuth(app);
}

let db;

try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch (error) {
  db = getFirestore(app);
}
const storage = getStorage(app);

export {
  app,
  auth,
  db,
   storage,
  firebaseConfig,
};