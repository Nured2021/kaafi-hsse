import { askOllama } from "./ollamaClient.js";

const EXTREME_TERMS = ["high pressure", "toxic gas", "live electrical", "confined space", "explosive"];

export function calculateRiskScore(input = "", modelOutput = "") {
  const combined = `${input} ${modelOutput}`.toLowerCase();
  const severity = EXTREME_TERMS.some((term) => combined.includes(term)) ? 3 : 2;
  const probability = combined.includes("routine") || combined.includes("low") ? 1 : 3;
  return probability * severity;
}

export async function runCore1Hazard({ cleanedInput, province = "AB", mode = "ai_auto" }) {
  const prompt = [
    "KAAFI HSSE Core 1 - Hazard Identification.",
    "Use DeepSeek R1 style safety reasoning. Identify hazards, probability, severity, controls, and stop-work triggers.",
    `Province: ${province}`,
    `Mode: ${mode}`,
    `Task: ${cleanedInput}`,
  ].join("\n");

  const output = await askOllama("deepseek-r1:7b", prompt);
  const riskScore = calculateRiskScore(cleanedInput, output);

  return {
    hazards: output
      .split(/\n|;/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8),
    risk_score: riskScore,
    reasoning_chain: output,
    safety_stop: riskScore >= 9,
  };
}
