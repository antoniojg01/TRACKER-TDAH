// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDnQlzkoxsZ5bZhlWASgAnBXtHP3-Occcg",
  authDomain: "controle-de-assinaturas.firebaseapp.com",
  projectId: "controle-de-assinaturas",
  storageBucket: "controle-de-assinaturas.firebasestorage.app",
  messagingSenderId: "421292619235",
  appId: "1:421292619235:web:7a2ee16000cb309cc91cd6",
  measurementId: "G-FHV9M51Y19"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore with offline persistence enabled from the start
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

const auth = getAuth(app);
const storage = getStorage(app);

console.log('🔥 Firebase inicializado com sucesso!');
console.log('✅ Persistência offline ativada com suporte a múltiplas abas!');
console.log('📦 Project ID:', firebaseConfig.projectId);

export { app, analytics, db, auth, storage };