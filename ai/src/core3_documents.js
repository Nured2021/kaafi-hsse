import { askOllama } from "./ollamaClient.js";

export async function runCore3Documents({ input, hazard, jsa, model = "gemma:7b", language = "en" }) {
  const prompt = [
    "KAAFI HSSE Core 3 - Documents.",
    "Generate permit to work notes, toolbox talk, and safety flash cards.",
    `Language: ${language}`,
    "",
    `Task:\n${input}`,
    "",
    `Hazards:\n${hazard?.raw || ""}`,
    "",
    `JSA:\n${jsa?.raw || ""}`,
  ].join("\n");

  const raw = await askOllama(model, prompt);

  return {
    ptw: `Permit to Work:\n${raw}`,
    toolbox_talk: `Toolbox Talk:\n${raw}`,
    flashcards: [
      "Confirm energy isolation before work starts.",
      "Stop work if conditions change.",
      "Use the required PPE and controls.",
    ],
    language,
    raw,
  };
}
