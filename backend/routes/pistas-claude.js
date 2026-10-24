import express from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = express.Router();

function generarPistaFallback(tema = "general", problema = "") {
  const map = {
    suma: "Pista: sumá de derecha a izquierda y llevá si hace falta.",
    resta: "Pista: restá de derecha a izquierda. Si hace falta, pedí prestado.",
    multiplicacion: "Pista: multiplicá cada parte y luego sumá los resultados.",
    division: "Pista: pensá cuántas veces entra el divisor dentro del dividendo.",
    fracciones:
      "Pista: busca un denominador común antes de sumar o restar fracciones.",
    decimales:
      "Pista: alineá los números por la coma decimal y resolvé como si fueran enteros.",
    porcentajes:
      "Pista: pensá el porcentaje como una parte de 100 y luego calculá esa proporción.",
    general:
      "Pista: revisá la operación, descomponé el problema y probá otra vez.",
  };

  return map[tema] || map.general;
}

router.post("/claude-hint", async (req, res) => {
  const { tema, problema, respuestaIncorrecta, idioma = "es" } = req.body;

  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    return res.json({
      pista: generarPistaFallback(tema, problema),
      source: "fallback-local",
    });
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    const prompt = `
      Eres un profesor de matemática para niños y adolescentes.
      Responde en ${idioma}.
      Tema: ${tema}
      Problema: ${problema}
      Respuesta incorrecta: ${respuestaIncorrecta || "sin respuesta"}

      Queremos una pista muy breve, pedagógica y útil.
      No des la respuesta final.
      Máximo 2 frases.
    `;

    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-haiku-5-5",
      max_tokens: 160,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const text =
      response.content?.[0]?.type === "text"
        ? response.content[0].text
        : generarPistaFallback(tema, problema);

    return res.json({
      pista: text.trim(),
      source: "claude",
    });
  } catch (error) {
    console.error("Error con Anthropic:", error);
    return res.json({
      pista: generarPistaFallback(tema, problema),
      source: "fallback-local",
    });
  }
});

export { router };
