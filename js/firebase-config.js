import { initializeApp } from "https://gstatic.com";
import { getAuth } from "https://gstatic.com";
import { getFirestore } from "https://gstatic.com";

const firebaseConfig = {
  apiKey: "AIzaSyCHEnFfDDYgWNWmO8J5WSeuDNfn1cJQeUs",
  authDomain: "://firebaseapp.com",
  projectId: "matrix-da6b5",
  storageBucket: "matrix-da6b5.firebasestorage.app",
  messagingSenderId: "590415080038",
  appId: "1:590415080038:web:9a1e04decc7e72cf15ba7",
  measurementId: "G-75ER9HEP5C"
};

// Inicialización y exportación limpia para tus otros archivos
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
        