/**
 * respuestas.js
 * -----------------------------------------------------------
 * Interpreta y corrige lo que escribe el jugador. Es un módulo puro
 * (no toca el DOM) para poder probarlo solo.
 *
 * Tipos de respuesta:
 *   "numero"   -> acepta enteros y decimales, con coma o con punto
 *                 ("4,5" y "4.5" valen lo mismo).
 *   "fraccion" -> acepta "3/4", y también equivalentes ("6/8") o
 *                 enteros ("2" equivale a "2/1").
 * -----------------------------------------------------------
 */

const TOLERANCIA = 1e-9;

/** "4,5" -> 4.5. Devuelve null si el texto no es un número válido. */
export function parsearNumero(texto) {
  const limpio = String(texto).trim().replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(limpio)) return null;
  return Number(limpio);
}

/** "3/4" -> [3, 4]; "2" -> [2, 1]. Devuelve null si no es válida o el denominador es 0. */
export function parsearFraccion(texto) {
  const limpio = String(texto).trim().replace(/\s+/g, "");
  const coincidencia = /^(-?\d+)(?:\/(-?\d+))?$/.exec(limpio);
  if (!coincidencia) return null;

  let numerador = Number(coincidencia[1]);
  let denominador = coincidencia[2] === undefined ? 1 : Number(coincidencia[2]);
  if (denominador === 0) return null;

  if (denominador < 0) {
    numerador = -numerador;
    denominador = -denominador;
  }
  return [numerador, denominador];
}

/**
 * Corrige la entrada del jugador contra el problema actual.
 * Devuelve { valida, correcta }:
 *   valida=false -> no se entiende lo que escribió (no cuenta como error)
 *   valida=true  -> se pudo leer; `correcta` dice si acertó
 */
export function evaluarRespuesta(entrada, problema) {
  if (problema.tipoRespuesta === "fraccion") {
    const dada = parsearFraccion(entrada);
    const esperada = parsearFraccion(problema.resultado);
    if (!dada || !esperada) return { valida: false, correcta: false };
    // a/b == c/d  <=>  a*d == c*b (sin dividir, evita errores de decimales)
    return { valida: true, correcta: dada[0] * esperada[1] === esperada[0] * dada[1] };
  }

  const dada = parsearNumero(entrada);
  if (dada === null) return { valida: false, correcta: false };
  const esperada = Number(problema.resultado);
  return { valida: true, correcta: Math.abs(dada - esperada) < TOLERANCIA };
}

/** Texto de ayuda cuando la entrada no se entiende, según el tipo de respuesta */
export function mensajeEntradaInvalida(problema) {
  return problema.tipoRespuesta === "fraccion"
    ? "Escribí una fracción, por ejemplo 3/4."
    : "Escribí un número antes de responder.";
}
