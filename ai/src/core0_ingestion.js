import { askOllama } from "./ollamaClient.js";
import { sanitizeKaafiText } from "./brandSanitizer.js";
import { MODELS } from "./pipeline.js";

const TYPE_KEYWORDS = {
  JSA: ["jsa", "job safety", "task", "work activity"],
  PTW: ["permit", "ptw", "hot work", "confined space"],
  RISK: ["risk", "hazard", "matrix", "assessment"],
  INCIDENT: ["incident", "near miss", "injury", "spill"],
  FLASHCARD: ["flashcard", "training", "quiz", "cards"],
  DOCUMENT: ["document", "procedure", "policy", "report"],
};

function classifyLocally(input) {
  const normalized = input.toLowerCase();
  let bestType = "JSA";
  let bestScore = 0;

  for (const [type, terms] of Object.entries(TYPE_KEYWORDS)) {
    const score = terms.filter((term) => normalized.includes(term)).length;
    if (score > bestScore) {
      bestType = type;
      bestScore = score;
    }
  }

  return {
    type: bestType,
    confidence: bestScore > 0 ? Math.min(0.95, 0.55 + bestScore * 0.15) : 0.5,
  };
}

export async function runCore0Ingestion({ input, mode = "ai_auto" }) {
  const cleanedInput = sanitizeKaafiText(input || "").trim();

  if (!cleanedInput) {
    throw new Error("Input is required before KAAFI can build the HSSE analysis.");
  }

  const localClassification = classifyLocally(cleanedInput);
  let aiClassification = "";

  try {
    aiClassification = await askOllama(
      MODELS.summary,
      [
        "Classify this HSSE request as one of: JSA, PTW, RISK, INCIDENT, FLASHCARD, DOCUMENT.",
        "Return only the type and confidence.",
        "",
        cleanedInput,
      ].join("\n"),
    );
  } catch (error) {
    aiClassification = `AI classification unavailable: ${error.message}`;
  }

  return {
    type: localClassification.type,
    confidence: localClassification.confidence,
    cleanedInput,
    mode,
    aiClassification,
  };
}
