const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";

export const MODELS = {
  risk: "deepseek-r1:7b",
  riskFallback: "mistral:7b-instruct",
  jsa: "mistral:7b-instruct",
  documents: "gemma:7b",
  summary: "phi3",
};

const EXTREME_RISK_TERMS = [
  "confined space rescue",
  "fatal",
  "explosive",
  "toxic gas",
  "high pressure",
  "live electrical",
  "working at height",
];

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

async function runStep(contextBus, stepName, model, prompt) {
  const startedAt = new Date().toISOString();

  contextBus.status.currentModel = model;
  contextBus.status.stages.push({
    step: stepName,
    model,
    status: "running",
    startedAt,
  });

  try {
    const output = await askOllama(model, prompt);
    contextBus.outputs[stepName] = output;
    contextBus.status.stages[contextBus.status.stages.length - 1] = {
      step: stepName,
      model,
      status: "complete",
      startedAt,
      finishedAt: new Date().toISOString(),
    };

    return output;
  } catch (error) {
    const failure = {
      step: stepName,
      model,
      message: error.message,
    };
    contextBus.errors.push(failure);
    contextBus.outputs[stepName] = `Model failed: ${error.message}`;
    contextBus.status.stages[contextBus.status.stages.length - 1] = {
      step: stepName,
      model,
      status: "failed",
      error: error.message,
      startedAt,
      finishedAt: new Date().toISOString(),
    };

    return contextBus.outputs[stepName];
  }
}

function inferRiskLevel(input, riskText) {
  const combined = `${input}\n${riskText}`.toLowerCase();

  if (EXTREME_RISK_TERMS.some((term) => combined.includes(term))) {
    return "EXTREME";
  }

  if (combined.includes("high") || combined.includes("permit") || combined.includes("stop work")) {
    return "HIGH";
  }

  if (combined.includes("medium") || combined.includes("traffic") || combined.includes("chemical")) {
    return "MEDIUM";
  }

  return "LOW";
}

function getRiskColor(riskLevel) {
  if (riskLevel === "EXTREME" || riskLevel === "HIGH") return "#FF0000";
  if (riskLevel === "MEDIUM") return "#FFFF00";
  return "#00B050";
}

function buildRiskPrompt(input) {
  return [
    "You are the KAAFI HSSE risk analysis assistant.",
    "Identify hazards, risk level, controls, escalation needs, and whether STOP WORK is required.",
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

function buildCriticPrompt(input, risk, jsa) {
  return [
    "You are the KAAFI HSSE critic reviewer.",
    "Review the JSA against the risk analysis. Return APPROVED if sufficient.",
    "If it is insufficient, list missing controls and a corrected JSA refinement.",
    "",
    `User input:\n${input}`,
    "",
    `Risk analysis:\n${risk}`,
    "",
    `JSA:\n${jsa}`,
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

  const contextBus = {
    input: userInput,
    models: MODELS,
    riskMatrix: {
      level: "LOW",
      color: "#00B050",
      safetyStop: false,
    },
    outputs: {
      risk: "",
      jsa: "",
      critic: "",
      documents: "",
      summary: "",
    },
    errors: [],
    status: {
      currentModel: "",
      stages: [],
    },
  };

  await runStep(contextBus, "risk", MODELS.risk, buildRiskPrompt(userInput));

  if (contextBus.status.stages.at(-1)?.status === "failed") {
    await runStep(contextBus, "risk", MODELS.riskFallback, buildRiskPrompt(userInput));
    contextBus.status.deepSeekFallback = "Mistral handled risk analysis after DeepSeek failure";
  }

  contextBus.riskMatrix.level = inferRiskLevel(userInput, contextBus.outputs.risk);
  contextBus.riskMatrix.color = getRiskColor(contextBus.riskMatrix.level);
  contextBus.riskMatrix.safetyStop = contextBus.riskMatrix.level === "EXTREME";
  contextBus.riskMatrix.action = contextBus.riskMatrix.safetyStop
    ? "STOP WORK: Extreme risk detected. Do not proceed until a competent person reviews and lowers risk."
    : "Proceed only after listed controls are verified.";

  await runStep(contextBus, "jsa", MODELS.jsa, buildJsaPrompt(userInput, contextBus.outputs.risk));
  await runStep(
    contextBus,
    "critic",
    MODELS.risk,
    buildCriticPrompt(userInput, contextBus.outputs.risk, contextBus.outputs.jsa),
  );
  await runStep(
    contextBus,
    "documents",
    MODELS.documents,
    buildDocumentsPrompt(userInput, contextBus.outputs.risk, contextBus.outputs.jsa),
  );
  await runStep(
    contextBus,
    "summary",
    MODELS.summary,
    buildSummaryPrompt(
      userInput,
      contextBus.outputs.risk,
      contextBus.outputs.jsa,
      contextBus.outputs.documents,
    ),
  );

  return {
    models: MODELS,
    input: userInput,
    risk: contextBus.outputs.risk,
    jsa: contextBus.outputs.jsa,
    critic: contextBus.outputs.critic,
    criticReview: contextBus.outputs.critic,
    documents: contextBus.outputs.documents,
    summary: contextBus.outputs.summary,
    contextBus,
    errors: contextBus.errors,
    status: contextBus.status.stages,
    stages: contextBus.status.stages,
    currentModel: contextBus.status.currentModel,
    riskMatrix: contextBus.riskMatrix,
    riskLevel: contextBus.riskMatrix.level,
    safetyStop: {
      active: contextBus.riskMatrix.safetyStop,
      message: contextBus.riskMatrix.action,
    },
    failedModels: contextBus.errors,
  };
}
