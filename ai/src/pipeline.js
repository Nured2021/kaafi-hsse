const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";

export const MODELS = {
  risk: "deepseek-r1:7b",
  jsa: "mistral:7b-instruct",
  documents: "gemma:7b",
  summary: "phi3",
};

async function askOllama(model, prompt) {
  const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Ollama ${model} request failed: ${response.status} ${detail}`);
  }

  const data = await response.json();
  return data.response || "";
}

async function runStep(stepName, model, prompt, results) {
  try {
    results[stepName] = await askOllama(model, prompt);
  } catch (error) {
    results[stepName] = `Model failed: ${error.message}`;
  }
}

function buildRiskPrompt(input) {
  return [
    "You are the KAAFI HSSE risk analysis assistant.",
    "Identify hazards, risk levels, controls, and escalation needs for this work activity.",
    "",
    `User input:\n${input}`,
  ].join("\n");
}

function buildJsaPrompt(input, risk) {
  return [
    "You are the KAAFI HSSE JSA assistant.",
    "Create a concise job safety analysis using the user input and risk analysis.",
    "",
    `User input:\n${input}`,
    "",
    `Risk analysis:\n${risk}`,
  ].join("\n");
}

function buildDocumentsPrompt(input, risk, jsa) {
  return [
    "You are the KAAFI HSSE document assistant.",
    "Draft required HSSE documents, permits, toolbox talk notes, and recordkeeping items.",
    "",
    `User input:\n${input}`,
    "",
    `Risk analysis:\n${risk}`,
    "",
    `JSA:\n${jsa}`,
  ].join("\n");
}

function buildSummaryPrompt(input, risk, jsa, documents) {
  return [
    "You are the KAAFI HSSE summary assistant.",
    "Summarize the final HSSE output with top risks, immediate controls, required documents, and next actions.",
    "",
    `User input:\n${input}`,
    "",
    `Risk analysis:\n${risk}`,
    "",
    `JSA:\n${jsa}`,
    "",
    `Documents:\n${documents}`,
  ].join("\n");
}

export async function runKaafiPipeline(userInput) {
  if (!userInput || !userInput.trim()) {
    throw new Error("User input is required");
  }

  const results = {
    risk: "",
    jsa: "",
    documents: "",
    summary: "",
  };

  await runStep("risk", MODELS.risk, buildRiskPrompt(userInput), results);
  await runStep("jsa", MODELS.jsa, buildJsaPrompt(userInput, results.risk), results);
  await runStep(
    "documents",
    MODELS.documents,
    buildDocumentsPrompt(userInput, results.risk, results.jsa),
    results,
  );
  await runStep(
    "summary",
    MODELS.summary,
    buildSummaryPrompt(userInput, results.risk, results.jsa, results.documents),
    results,
  );

  return {
    models: MODELS,
    input: userInput,
    risk: results.risk,
    jsa: results.jsa,
    documents: results.documents,
    summary: results.summary,
  };
}
