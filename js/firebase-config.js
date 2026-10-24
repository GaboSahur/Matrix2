/**
 * firebase-config.js
 * -----------------------------------------------------------
 * Único lugar donde se inicializa Firebase (núcleo: app, auth, db).
 *
 * Todos los imports de Firebase del proyecto usan la MISMA versión
 * del SDK (12.17.1). Si algún día la cambiás, cambiala en todos los
 * archivos a la vez; mezclar versiones rompe la app.
 *
 * La parte de IA (Gemini + App Check) vive aparte en
 * firebase-ai-config.js, a propósito: si esa parte falla, el
 * registro, el login y el ranking siguen funcionando.
 * -----------------------------------------------------------
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAP-Zzb9_9cQCglwHS76Y-QhtcB1rgFjMY",
  authDomain: "matrix-77d55.firebaseapp.com",
  projectId: "matrix-77d55",
  storageBucket: "matrix-77d55.firebasestorage.app",
  messagingSenderId: "533802082287",
  appId: "1:533802082287:web:ac5cadece071beec5d601a",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
