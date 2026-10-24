/**
 * content-library.js
 * -----------------------------------------------------------
 * Biblioteca centralizada de todos los niveles/dificultades.
 * Define la estructura de cada nivel: operación, rango numérico,
 * descripción, emoji, etc.
 * -----------------------------------------------------------
 */

export const CONTENT_LIBRARY = {
  suma: {
    id: "suma",
    titulo: "Sumas",
    descripcion: "Ejercicios de suma con números de hasta dos cifras.",
    simbolo: "+",
    emoji: "➕",
    dificultad: 1,
    min: 2,
    max: 12,
    categoria: "operaciones-basicas",
  },

  resta: {
    id: "resta",
    titulo: "Restas",
    descripcion: "Restas sin resultados negativos, ideales para entrar en calor.",
    simbolo: "−",
    emoji: "➖",
    dificultad: 1,
    min: 2,
    max: 12,
    categoria: "operaciones-basicas",
  },

  multiplicacion: {
    id: "multiplicacion",
    titulo: "Multiplicación",
    descripcion: "Tablas y combinaciones para agilizar el cálculo mental.",
    simbolo: "×",
    emoji: "✕",
    dificultad: 2,
    min: 2,
    max: 10,
    categoria: "operaciones-basicas",
  },

  division: {
    id: "division",
    titulo: "División",
    descripcion: "Divisiones exactas, pensadas como la operación inversa de multiplicar.",
    simbolo: "÷",
    emoji: "÷",
    dificultad: 2,
    min: 2,
    max: 10,
    categoria: "operaciones-basicas",
  },

  mixto: {
    id: "mixto",
    titulo: "Desafío mixto",
    descripcion: "Las cuatro operaciones combinadas al azar, para quienes ya entraron en ritmo.",
    simbolo: "?",
    emoji: "❓",
    dificultad: 3,
    min: 2,
    max: 12,
    categoria: "desafios",
  },

  potencias: {
    id: "potencias",
    titulo: "Potencias",
    descripcion: "Calcula cuadrados y cubos para fortalecer el cálculo mental exponencial.",
    simbolo: "²",
    emoji: "🔳",
    dificultad: 4,
    min: 2,
    max: 12,
    categoria: "operaciones-avanzadas",
  },

  porcentajes: {
    id: "porcentajes",
    titulo: "Porcentajes",
    descripcion: "Calcula porcentajes de números para practicar proporcionalidad.",
    simbolo: "%",
    emoji: "📊",
    dificultad: 3,
    min: 10,
    max: 100,
    categoria: "operaciones-avanzadas",
  },

  fracciones: {
    id: "fracciones",
    titulo: "Fracciones",
    descripcion: "Suma y resta de fracciones con denominadores comunes.",
    simbolo: "⅕",
    emoji: "🥧",
    dificultad: 4,
    min: 1,
    max: 10,
    categoria: "operaciones-avanzadas",
  },

  // Nivel especial: los ejercicios no salen de un generador local sino
  // de Gemini (ver generarProblema() en game.js y jugar-ia.js). No usa
  // min/max porque no hay rango numérico que sortear.
  ia: {
    id: "ia",
    titulo: "Desafío IA",
    descripcion: "Ejercicios y problemas con contexto, inventados por inteligencia artificial en el momento. Nunca se repiten.",
    simbolo: "🤖",
    emoji: "🤖",
    dificultad: 4,
    categoria: "desafios",
  },
};

export function obtenerNivel(id) {
  return CONTENT_LIBRARY[id] || null;
}

export function listarNiveles(categoria = null) {
  const niveles = Object.values(CONTENT_LIBRARY);
  return categoria
    ? niveles.filter((n) => n.categoria === categoria)
    : niveles;
}

export function agruparPorCategoria() {
  const agrupado = {};
  Object.values(CONTENT_LIBRARY).forEach((nivel) => {
    if (!agrupado[nivel.categoria]) {
      agrupado[nivel.categoria] = [];
    }
    agrupado[nivel.categoria].push(nivel);
  });
  return agrupado;
}

export function nivelExiste(id) {
  return id in CONTENT_LIBRARY;
}
