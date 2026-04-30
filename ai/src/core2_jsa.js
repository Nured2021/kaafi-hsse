import { askOllama } from "./ollamaClient.js";

const MODEL = "mistral:7b-instruct";

export async function runCore2Jsa(contextBus) {
  const prompt = [
    "You are KAAFI HSSE Core 2 JSA.",
    "Generate JSA steps from the identified hazards.",
    "Apply the Hierarchy of Controls: elimination, substitution, engineering, admin, PPE.",
    "Assign a responsible person for each step.",
    "",
    `Cleaned input:\n${contextBus.cleanedInput}`,
    "",
    `Hazards:\n${JSON.stringify(contextBus.core1?.hazards || [])}`,
  ].join("\n");
  const output = await askOllama(MODEL, prompt);

  return {
    model: MODEL,
    steps: [
      {
        task: "Confirm job scope and isolate energy sources.",
        hazards: contextBus.core1?.hazards || [],
        controls: ["Verify permit", "Apply hierarchy of controls", "Confirm competent supervision"],
        responsible_person: "Site supervisor",
      },
      {
        task: "Execute task with controls in place.",
        hazards: contextBus.core1?.hazards || [],
        controls: ["Barricade area", "Use approved PPE", "Stop if conditions change"],
        responsible_person: "Work crew lead",
      },
    ],
    control_measures: [
      "Eliminate exposure where possible",
      "Substitute lower-risk methods where available",
      "Use engineering controls before PPE",
    ],
    responsible_party: "Site supervisor",
    text: output,
  };
}
