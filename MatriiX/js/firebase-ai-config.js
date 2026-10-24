/**
 * firebase-ai-config.js
 * -----------------------------------------------------------
 * Inicializa la IA de Firebase (Gemini vía Firebase AI Logic) y
 * App Check, reutilizando la `app` de firebase-config.js.
 *
 * Solo lo importa firebase-ai.js, y ese solo se carga cuando hace
 * falta (el chat, el nivel "Desafío IA" o una pista con IA). El
 * resto del sitio nunca descarga este código.
 *
 * RECAPTCHA_SITE_KEY: clave de SITIO de reCAPTCHA v3 que te da el
 * asistente de AI Logic en la consola de Firebase (ver README). Es
 * pública por diseño, igual que firebaseConfig.
 * -----------------------------------------------------------
 */
import { app } from "./firebase-config.js";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-ai.js";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app-check.js";

const RECAPTCHA_SITE_KEY = "TU_RECAPTCHA_SITE_KEY";

// App Check evita que otros sitios o bots usen tu cuota de Gemini.
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
  isTokenAutoRefreshEnabled: true,
});

// "Gemini Developer API": funciona con el plan gratis Spark (el de
// Vertex / Agent Platform exige plan Blaze).
export const ai = getAI(app, { backend: new GoogleAIBackend() });

export const modeloTexto = getGenerativeModel(ai, { model: "gemini-2.0-flash" });
