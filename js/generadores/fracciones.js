/**
 * Genera ejercicios de fracciones simples.
 */

function aleatorioEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function simplificar(fraccion) {
  const [num, den] = fraccion;
  let a = Math.abs(num);
  let b = Math.abs(den);

  while (a && b && a !== b) {
    if (a > b) a %= b;
    else b %= a;
  }

  const mcd = a === 0 ? b : a;
  return [num / mcd, den / mcd];
}

function crearFraccionSimple() {
  const denominador = aleatorioEntre(2, 8);
  const numerador = aleatorioEntre(1, denominador - 1);
  return [numerador, denominador];
}

export function generarEjercicioFracciones() {
  const tipo = ["suma", "resta"][aleatorioEntre(0, 1)];

  let a = crearFraccionSimple();
  let b = crearFraccionSimple();

  if (tipo === "suma") {
    const denominador = a[1];
    const n1 = a[0] * b[1];
    const n2 = b[0] * denominador;
    const d = denominador * b[1];

    const resultado = [n1 + n2, d];
    const simplificado = simplificar(resultado);

    return {
      tema: "fracciones",
      tipo,
      enunciado: `${a[0]}/${a[1]} + ${b[0]}/${b[1]} = ?`,
      respuesta: `${simplificado[0]}/${simplificado[1]}`,
      pista: "Busca el denominador común y luego suma los numeradores.",
      datos: {
        a,
        b,
        resultado: simplificado,
      },
    };
  }

  const denominador = a[1];
  const n1 = a[0] * b[1];
  const n2 = b[0] * denominador;
  const d = denominador * b[1];

  const resultado = [n1 - n2, d];
  const simplificado = simplificar(resultado);

  return {
    tema: "fracciones",
    tipo,
    enunciado: `${a[0]}/${a[1]} - ${b[0]}/${b[1]} = ?`,
    respuesta: `${simplificado[0]}/${simplificado[1]}`,
    pista: "Usá el mismo denominador para ambas fracciones y restá numeradores.",
    datos: {
      a,
      b,
      resultado: simplificado,
    },
  };
}
