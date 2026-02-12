import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Simple hardcoded auth check for specific requirement
export const checkHardcodedAuth = (username, password) => {
  return username === "EON" && password === "0130";
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Helper to save data to Firebase
  const saveToFirebase = async (data) => {
    try {
      await addDoc(collection(db, "tracker_entries"), {
        ...data,
        user: "EON",
        timestamp: new Date()
      });
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'EON' && password === '0130') {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
    } else {
      alert('Credenciais inválidas');
    }
  };

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    
    // Auto-sync mechanism: If the app uses localStorage, sync it to Firebase
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      originalSetItem.apply(this, arguments);
      // Ignore auth keys or system keys
      if (key !== 'isAuthenticated' && key !== 'vite-ui-theme') {
         saveToFirebase({ type: 'local_storage_sync', key, value });
      }
    };
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-96">
          <h2 className="text-2xl mb-6 font-bold text-center text-gray-800">Tracker TDAH Login</h2>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-bold text-gray-700">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite seu usuário"
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-bold text-gray-700">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite sua senha"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <h1>Home Page</h1>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div>
          <h1>Home Page</h1>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}