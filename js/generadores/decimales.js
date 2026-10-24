/**
 * Genera ejercicios de decimales.
 */

function aleatorioEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function redondear(numero) {
  return Number(numero.toFixed(2));
}

export function generarEjercicioDecimales() {
  const tipo = ["suma", "resta"][aleatorioEntre(0, 1)];
  const decimales = [1, 2][aleatorioEntre(0, 1)];

  const numA = aleatorioEntre(1, 50) / (decimales === 1 ? 10 : 100);
  const numB = aleatorioEntre(1, 50) / (decimales === 1 ? 10 : 100);

  const a = redondear(numA);
  const b = redondear(numB);

  const resultado =
    tipo === "suma" ? redondear(a + b) : redondear(a - b);

  return {
    tema: "decimales",
    tipo,
    enunciado:
      tipo === "suma"
        ? `${a.toFixed(decimales)} + ${b.toFixed(decimales)} = ?`
        : `${a.toFixed(decimales)} - ${b.toFixed(decimales)} = ?`,
    respuesta: resultado.toFixed(decimales),
    pista:
      tipo === "suma"
        ? "Alineá los decimales y sumá de derecha a izquierda."
        : "Alineá los decimales y restá de derecha a izquierda.",
    datos: {
      a,
      b,
      resultado,
    },
  };
}
