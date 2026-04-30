export const KAAFI_CONFIG = {
  brand: "KAAFI HSSE",
  header: "KAAFI HSSE - Safety Excellence",
  logoPlaceholder: "CLEAN_KAAFI_LOGO_V1",
  assistantPrompt:
    "Hello! I'm KAAFI. Tell me what job you're starting today, and I'll build your JSA with the right safety controls.",
  alertColors: {
    HIGH: "#FF0000",
    MEDIUM: "#FFFF00",
    LOW: "#00B050",
  },
};

const HIGH_RISK_TERMS = [
  "confined space",
  "energized",
  "high pressure",
  "hot work",
  "live line",
  "lifting",
  "lockout",
  "pressure valve",
  "working at height",
];

const MEDIUM_RISK_TERMS = [
  "chemical",
  "forklift",
  "grinding",
  "manual handling",
  "scaffold",
  "traffic",
  "welding",
];

const BRAND_REPLACEMENTS = [
  /SafetyCo Partners/gi,
  /SafetyCo/gi,
  /BP Wind Energy/gi,
  /\bBP\b/gi,
  /IHSA\.ca/gi,
];

const PERSONAL_NAME_LINE =
  /^(prepared by|reviewed by|worker name|supervisor name|employee name)\s*:\s*.+$/gim;

export function sanitizeKaafiText(value = "") {
  let cleaned = value.replace(PERSONAL_NAME_LINE, "$1: [Removed for privacy]");

  for (const rule of BRAND_REPLACEMENTS) {
    cleaned = cleaned.replace(rule, KAAFI_CONFIG.brand);
  }

  return cleaned.replace(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b(?=\s*(?:,|$))/g, "[Removed name]");
}

export function calculateRisk(probability: number, severity: number) {
  const score = probability * severity;

  if (score >= 9) {
    return {
      level: "HIGH",
      color: KAAFI_CONFIG.alertColors.HIGH,
      action: "Immediate Action: Restrict exposure until risk is lowered.",
    };
  }

  if (score >= 4) {
    return {
      level: "MEDIUM",
      color: KAAFI_CONFIG.alertColors.MEDIUM,
      action: "Action Required: Eliminate or minimize risk as soon as possible.",
    };
  }

  return {
    level: "LOW",
    color: KAAFI_CONFIG.alertColors.LOW,
    action: "Monitor: Minimize risk within a reasonable time.",
  };
}

export function inferRiskFromTask(input = "") {
  const normalized = input.toLowerCase();

  if (HIGH_RISK_TERMS.some((term) => normalized.includes(term))) {
    return calculateRisk(3, 3);
  }

  if (MEDIUM_RISK_TERMS.some((term) => normalized.includes(term))) {
    return calculateRisk(2, 2);
  }

  return calculateRisk(1, 1);
}

export function injectKaafiLogic(payload: string | { input?: string } = "") {
  const input = typeof payload === "string" ? payload : payload.input || "";
  const cleanedInput = sanitizeKaafiText(input);
  const risk = inferRiskFromTask(cleanedInput);

  return {
    brand: KAAFI_CONFIG.brand,
    header: KAAFI_CONFIG.header,
    cleanedInput,
    risk,
    safetyStop:
      risk.level === "HIGH"
        ? "STOP WORK CHECK: Permit to Work must be reviewed before task starts."
        : "",
    permitPriority: risk.level === "HIGH" ? "Permit to Work prioritized" : "Standard JSA flow",
    assistantPrompt: KAAFI_CONFIG.assistantPrompt,
  };
}

export function getAssistantPrompt() {
  return KAAFI_CONFIG.assistantPrompt;
}

export function getEmpathyValidationMessage() {
  return "I want to make sure you stay safe on-site. Could you tell me a bit more about the equipment you're using so I can finish the JSA for you?";
}

export function buildCleanDownload({ input = "", result = null }: { input: string; result: any }) {
  const bridge = injectKaafiLogic(input);
  const cleanedResult = result
    ? {
        risk: sanitizeKaafiText(result.risk || ""),
        jsa: sanitizeKaafiText(result.jsa || ""),
        documents: sanitizeKaafiText(result.documents || ""),
        summary: sanitizeKaafiText(result.summary || ""),
      }
    : null;

  return [
    bridge.header,
    `Risk Level: ${bridge.risk.level}`,
    `Risk Action: ${bridge.risk.action}`,
    bridge.safetyStop,
    "",
    "Input:",
    bridge.cleanedInput,
    "",
    "Risk Analysis:",
    cleanedResult?.risk || "No output returned.",
    "",
    "JSA:",
    cleanedResult?.jsa || "No output returned.",
    "",
    "Documents:",
    cleanedResult?.documents || "No output returned.",
    "",
    "Summary:",
    cleanedResult?.summary || "No output returned.",
  ]
    .filter(Boolean)
    .join("\n");
}
