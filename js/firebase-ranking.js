/**
 * firebase-ranking.js
 * -----------------------------------------------------------
 * Ranking compartido de verdad entre todos los jugadores,
 * guardado en Firestore (a diferencia del ranking anterior en
 * localStorage, que solo vivía en el navegador de cada uno).
 *
 * Modelo de datos en Firestore:
 *   usuarios/{uid}          -> { nombre, email, mejorPuntaje, creadoEn }
 *   partidas/{autoId}       -> { uid, nombre, puntaje, nivel, creadoEn }
 *
 * Cada partida jugada se guarda como un documento nuevo en
 * "partidas". El ranking semanal/mensual se arma filtrando esos
 * documentos por fecha. Como Firestore no tiene forma directa de
 * decir "el mejor puntaje por usuario" en una sola consulta,
 * pedimos varios resultados ordenados por puntaje y nos quedamos
 * con la primera aparición de cada jugador (deduplicado acá en
 * el cliente) — así cada persona aparece una sola vez, con su
 * mejor marca de ese período.
 * -----------------------------------------------------------
 */
import { auth, db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

/**
 * Guarda una partida jugada por el usuario actualmente logueado.
 * Lanza un error si no hay sesión iniciada (lo maneja quien llame
 * a esta función, normalmente mostrando un cartel de "iniciá sesión").
 */
export async function guardarPartida({ puntaje, nivel }) {
  const usuario = auth.currentUser;
  if (!usuario) {
    throw new Error("Necesitás iniciar sesión para guardar tu puntaje en el ranking.");
  }

  await addDoc(collection(db, "partidas"), {
    uid: usuario.uid,
    nombre: usuario.displayName || "Jugador sin nombre",
    puntaje,
    nivel,
    creadoEn: serverTimestamp(),
  });

  // Actualiza el mejor puntaje histórico del perfil, solo si lo mejoró.
  const refPerfil = doc(db, "usuarios", usuario.uid);
  const snapPerfil = await getDoc(refPerfil);
  const mejorActual = snapPerfil.exists() ? snapPerfil.data().mejorPuntaje || 0 : 0;
  if (puntaje > mejorActual) {
    await updateDoc(refPerfil, { mejorPuntaje: puntaje });
  }
}

/**
 * Trae hasta 10 partidas destacadas dentro de una ventana de
 * tiempo, una por jugador (la mejor de cada uno en ese período).
 * fechaDesde en null = sin filtro de fecha = ranking histórico.
 */
async function obtenerTopPartidas(fechaDesde) {
  const CANTIDAD_BRUTA = 50; // pedimos de más porque vamos a deduplicar por jugador

  const restricciones = [orderBy("puntaje", "desc"), limit(CANTIDAD_BRUTA)];
  if (fechaDesde) {
    restricciones.unshift(where("creadoEn", ">=", Timestamp.fromDate(fechaDesde)));
  }

  const consulta = query(collection(db, "partidas"), ...restricciones);
  const snapshot = await getDocs(consulta);

  const vistos = new Set();
  const resultado = [];

  snapshot.forEach((docSnap) => {
    const datos = docSnap.data();
    if (vistos.has(datos.uid)) return; // ya guardamos la mejor marca de este jugador
    vistos.add(datos.uid);
    resultado.push({ uid: datos.uid, nombre: datos.nombre, puntaje: datos.puntaje, nivel: datos.nivel });
  });

  return resultado.slice(0, 10);
}

export function obtenerRankingSemanal() {
  const hoy = new Date();
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - hoy.getDay()); // retrocede hasta el domingo
  inicioSemana.setHours(0, 0, 0, 0);
  return obtenerTopPartidas(inicioSemana);
}

export function obtenerRankingMensual() {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  return obtenerTopPartidas(inicioMes);
}

export function obtenerRankingHistorico() {
  return obtenerTopPartidas(null);
}
