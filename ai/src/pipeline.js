const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";

export const MODELS = {
  deepseek: "deepseek-r1:7b",
  mistral: "mistral:7b-instruct",
  gemma: "gemma:7b",
  phi3: "phi3",
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
    throw new Error(`Ollama ${model} failed: ${response.status} ${detail}`);
  }

  const data = await response.json();
  return data.response || "";
}

async function runModel(modelKey, prompt, outputKey, result) {
  try {
    result[outputKey] = await askOllama(MODELS[modelKey], prompt);
    result.status[modelKey] = "OK";
  } catch (error) {
    result[outputKey] = `Model failed: ${error.message}`;
    result.status[modelKey] = "FAILED";
  }
}

function buildRiskPrompt(input) {
  return [
    "You are KAAFI HSSE DeepSeek risk analysis.",
    "Analyze this work activity for hazards, risk level, and controls.",
    "",
    input,
  ].join("\n");
}

function buildJsaPrompt(input, risk) {
  return [
    "You are KAAFI HSSE Mistral JSA generation.",
    "Create a job safety analysis using the user input and risk analysis.",
    "",
    `User input:\n${input}`,
    "",
    `Risk analysis:\n${risk}`,
  ].join("\n");
}

function buildDocumentsPrompt(input, risk, jsa) {
  return [
    "You are KAAFI HSSE Gemma document generation.",
    "Draft required safety documents, permits, toolbox talk notes, and recordkeeping items.",
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
    "You are KAAFI HSSE Phi-3 summary generation.",
    "Summarize the final safety output with top risks, controls, documents, and next actions.",
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

  const result = {
    risk: "",
    jsa: "",
    documents: "",
    summary: "",
    status: {
      deepseek: "FAILED",
      mistral: "FAILED",
      gemma: "FAILED",
      phi3: "FAILED",
    },
  };

  await runModel("deepseek", buildRiskPrompt(userInput), "risk", result);
  await runModel("mistral", buildJsaPrompt(userInput, result.risk), "jsa", result);
  await runModel("gemma", buildDocumentsPrompt(userInput, result.risk, result.jsa), "documents", result);
  await runModel("phi3", buildSummaryPrompt(userInput, result.risk, result.jsa, result.documents), "summary", result);

  return {
    input: userInput,
    ...result,
  };
}
