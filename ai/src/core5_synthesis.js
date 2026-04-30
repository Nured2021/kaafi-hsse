import { askOllama } from "./ollamaClient.js";

export async function runCore5Synthesis({ input, risk, jsa, documents, language = "en" }) {
  const prompt = [
    "You are Core 5 Synthesis for KAAFI HSSE.",
    "Create human-readable final output, action items, and required permits.",
    `Language: ${language}`,
    "",
    `Input:\n${input}`,
    "",
    `Risk:\n${risk}`,
    "",
    `JSA:\n${jsa}`,
    "",
    `Documents:\n${JSON.stringify(documents)}`,
  ].join("\n");

  const summary = await askOllama("phi3", prompt);
  const requiredPermits = [];
  const combined = `${input}\n${risk}\n${summary}`.toLowerCase();

  if (combined.includes("hot work") || combined.includes("welding")) {
    requiredPermits.push("Hot Work Permit");
  }
  if (combined.includes("confined space")) {
    requiredPermits.push("Confined Space Entry Permit");
  }
  if (combined.includes("high pressure") || combined.includes("energized")) {
    requiredPermits.push("Permit to Work");
  }

  return {
    summary,
    action_items: [
      "Confirm hazards and controls with the work crew.",
      "Verify required permits before work starts.",
      "Stop work immediately if site conditions change.",
    ],
    required_permits: requiredPermits.length ? requiredPermits : ["JSA review"],
  };
}
