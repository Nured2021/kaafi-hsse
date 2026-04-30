export const MODELS = {
  risk: "deepseek-r1:7b",
  riskFallback: "mistral:7b-instruct",
  jsa: "mistral:7b-instruct",
  documents: "gemma:7b",
  summary: "phi3",
};
import { runCore0Ingestion } from "./core0_ingestion.js";
import { runCore1Hazard } from "./core1_hazard.js";
import { runCore2Jsa } from "./core2_jsa.js";
import { runCore3Documents } from "./core3_documents.js";
import { runCore4Critic } from "./core4_critic.js";
import { runCore5Synthesis } from "./core5_synthesis.js";

function createContextBus({ userInput, mode = "ai_auto", province = "AB", manualData = {} }) {
  return {
    input: userInput,
    mode,
    province,
    manualData,
    models: MODELS,
    outputs: {},
    errors: [],
    status: {
      currentModel: "",
      stages: [],
    },
  };
}

function startCore(contextBus, core, model) {
  contextBus.status.currentModel = model;
  contextBus.status.stages.push({
    core,
    step: core,
    model,
    status: "running",
    startedAt: new Date().toISOString(),
  });
}

function finishCore(contextBus, status = "complete", extra = {}) {
  const index = contextBus.status.stages.length - 1;
  contextBus.status.stages[index] = {
    ...contextBus.status.stages[index],
    ...extra,
    status,
    finishedAt: new Date().toISOString(),
  };
}

async function runCore(contextBus, core, model, callback) {
  startCore(contextBus, core, model);

  try {
    const result = await callback();
    finishCore(contextBus);
    return result;
  } catch (error) {
    const failure = { core, step: core, model, message: error.message };
    contextBus.errors.push(failure);
    finishCore(contextBus, "failed", { error: error.message });
    return { error: error.message };
  }
}

function formatCoreResult(title, value) {
  if (typeof value === "string") {
    return value;
  }

  return `${title}\n${JSON.stringify(value, null, 2)}`;
}

export async function runKaafiPipeline(userInput, options = {}) {
  if (!userInput || !userInput.trim()) {
    throw new Error("User input is required");
  }

  const contextBus = createContextBus({
    userInput,
    mode: options.mode,
    province: options.province,
    manualData: options.manualData,
  });

  const ingestion = await runCore(contextBus, "core0_ingestion", MODELS.summary, () =>
    runCore0Ingestion({ input: userInput }),
  );

  const cleanedInput = ingestion.cleanedInput || userInput;
  contextBus.input = cleanedInput;
  contextBus.outputs.ingestion = ingestion;

  const hazard = await runCore(contextBus, "core1_hazard", MODELS.risk, async () => {
    const result = await runCore1Hazard({ input: cleanedInput });
    if (result.error) {
      const fallback = await runCore1Hazard({ input: cleanedInput, model: MODELS.riskFallback });
      contextBus.status.deepSeekFallback = "Mistral handled hazard identification after DeepSeek failure";
      finishCore(contextBus, "complete", { fallbackUsed: true, fallbackModel: MODELS.riskFallback });
      return fallback;
    }
    return result;
  });
  contextBus.outputs.hazard = hazard;

  const jsa = await runCore(contextBus, "core2_jsa", MODELS.jsa, () =>
    options.mode === "manual"
      ? Promise.resolve(options.manualData?.jsa || {
          steps: ["Manual mode selected. Review provided manual data."],
          control_measures: [],
          responsible_party: "Manual reviewer",
        })
      : runCore2Jsa({ input: cleanedInput, hazards: hazard }),
  );
  contextBus.outputs.jsa = jsa;

  const critic = await runCore(contextBus, "core4_critic", MODELS.risk, () =>
    runCore4Critic({ input: cleanedInput, hazards: hazard, jsa }),
  );
  contextBus.outputs.critic = critic;

  const documents = await runCore(contextBus, "core3_documents", MODELS.documents, () =>
    runCore3Documents({ input: cleanedInput, hazards: hazard, jsa, province: options.province }),
  );
  contextBus.outputs.documents = documents;

  const synthesis = await runCore(contextBus, "core5_synthesis", MODELS.summary, () =>
    runCore5Synthesis({ input: cleanedInput, hazards: hazard, jsa, documents, critic }),
  );
  contextBus.outputs.synthesis = synthesis;

  const riskMatrix = {
    level: hazard.risk_score >= 9 ? "EXTREME" : hazard.risk_score >= 6 ? "HIGH" : hazard.risk_score >= 4 ? "MEDIUM" : "LOW",
    score: hazard.risk_score || 1,
    color: hazard.safety_stop || hazard.risk_score >= 6 ? "#FF0000" : hazard.risk_score >= 4 ? "#FFFF00" : "#00B050",
    safetyStop: Boolean(hazard.safety_stop),
    hazards: hazard.hazards || [],
    controls: jsa.control_measures || [],
    action: hazard.safety_stop
      ? "STOP WORK: Extreme risk detected. Do not proceed until risk is reduced."
      : "Proceed only after controls are verified.",
  };

  return {
    models: MODELS,
    input: cleanedInput,
    mode: contextBus.mode,
    province: contextBus.province,
    type: ingestion.type,
    risk: formatCoreResult("Core 1 Hazard", hazard),
    jsa: formatCoreResult("Core 2 JSA", jsa),
    critic: formatCoreResult("Core 4 Critic", critic),
    criticReview: formatCoreResult("Core 4 Critic", critic),
    documents: formatCoreResult("Core 3 Documents", documents),
    summary: synthesis.summary || formatCoreResult("Core 5 Synthesis", synthesis),
    actionItems: synthesis.action_items || [],
    requiredPermits: synthesis.required_permits || [],
    contextBus,
    cores: contextBus.outputs,
    errors: contextBus.errors,
    status: contextBus.status.stages,
    stages: contextBus.status.stages,
    currentModel: contextBus.status.currentModel,
    riskMatrix,
    riskLevel: riskMatrix.level,
    safetyStop: {
      active: riskMatrix.safetyStop,
      message: riskMatrix.action,
    },
    failedModels: contextBus.errors,
  };
}
