// firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCBR7K6Kp4j2O8YDViarGagD_K1Bt5spR4",
  authDomain: "cetpro-ernesto-reyna-zegarra.firebaseapp.com",
  projectId: "cetpro-ernesto-reyna-zegarra",
  storageBucket: "cetpro-ernesto-reyna-zegarra.firebasestorage.app",
  messagingSenderId: "656308952148",
  appId: "1:656308952148:web:f6d33724da35cb893a61c1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
