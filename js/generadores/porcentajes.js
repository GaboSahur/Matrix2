/**
 * Genera ejercicios de porcentajes.
 */

function aleatorioEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generarEjercicioPorcentajes() {
  const porcentaje = [10, 15, 20, 25, 30, 50, 75][
    aleatorioEntre(0, 6)
  ];
  const base = aleatorioEntre(10, 200);

  const resultado = (base * porcentaje) / 100;

  return {
    tema: "porcentajes",
    tipo: "calculo",
    enunciado: `¿Cuál es ${porcentaje}% de ${base}?`,
    respuesta: String(resultado),
    pista:
      "Multiplica el porcentaje por el número y divide entre 100. Ejemplo: 25% de 100 = (25 × 100) / 100 = 25.",
    datos: {
      porcentaje,
      base,
      resultado,
    },
  };
}
