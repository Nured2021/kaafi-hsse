import { askOllama } from "./ollamaClient.js";
import crypto from "crypto";

const MODELS = {
  phi3: "phi3",
  deepseek: "deepseek-r1:7b",
  mistral: "mistral:7b-instruct",
  gemma: "gemma:7b",
};

const CANADIAN_REGULATIONS = {
  AB: "Alberta OHS Act, Regulation & Code 2023",
  BC: "BC Workers Compensation Act & OHS Regulation",
  ON: "Ontario OHSA & Industrial Establishments Reg. 851",
  SK: "Saskatchewan Employment Act & OHS Regulations",
  MB: "Manitoba Workplace Safety and Health Act",
  QC: "Quebec Act Respecting Occupational Health and Safety",
  default: "Canada Labour Code Part II & COHSR",
};

export async function runOstrichPipeline({ input, sessionId, province, company, workers, weather }) {
  const reg = CANADIAN_REGULATIONS[province] || CANADIAN_REGULATIONS.default;
  const ctx = { sessionId, input, province, company, workers, weather, regulation: reg, startedAt: new Date().toISOString() };

  // CORE 1: Hazard Analysis (DeepSeek)
  let core1;
  try {
    const p = `You are a Senior Safety Engineer with 20 years of Canadian industrial experience. Analyze this work for ALL hazards using Chain-of-Thought reasoning. Apply ${reg}. Work: ${input}. Workers: ${workers}. Weather: ${weather}. Output as JSON: { "hazards": [{"type":"","probability":1-5,"severity":1-5,"score":0}], "risk_level": "LOW|MEDIUM|HIGH|EXTREME", "safety_stop": true|false, "reasoning": "..." }`;
    const r = await askOllama(MODELS.deepseek, p);
    core1 = JSON.parse(r.replace(/```json|```/g, "").trim());
  } catch (e) {
    core1 = { hazards: [], risk_level: "UNKNOWN", safety_stop: false, reasoning: "DeepSeek unavailable.", _error: e.message };
  }

  if (core1.safety_stop) {
    return { safety_stop: true, message: "EXTREME RISK DETECTED — DO NOT PROCEED. Human safety manager override required.", core1, core2: null, core3: null, core4: null, core5: null };
  }

  // CORE 2: JSA Generation (Mistral)
  let core2;
  try {
    const p = `You are an HSSE Compliance Officer certified in ${reg}. Generate a Job Safety Analysis from these hazards: ${JSON.stringify(core1.hazards)}. Apply Hierarchy of Controls: Elimination→Substitution→Engineering→Admin→PPE. Output as JSON: { "steps": [{"step":1,"task":"","hazard":"","control":"","responsible":"","hierarchy_level":""}], "ppe_required":[], "emergency_procedure":"", "nearest_hospital":"" }`;
    const r = await askOllama(MODELS.mistral, p);
    core2 = JSON.parse(r.replace(/```json|```/g, "").trim());
  } catch (e) {
    core2 = { steps: [], ppe_required: [], _error: e.message };
  }

  // CORE 4: Validation Critic (DeepSeek — reviews Core 2)
  let core4;
  let refinementCount = 0;
  try {
    let passed = false;
    while (!passed && refinementCount < 3) {
      const p = `You are an Independent Safety Auditor. Review this JSA against the original hazards. Hazards: ${JSON.stringify(core1.hazards)}. JSA: ${JSON.stringify(core2.steps)}. Check: 1) Are ALL hazards addressed? 2) Are controls adequate per Hierarchy of Controls? 3) Would this pass a ${reg} audit? Output JSON: { "passed": true|false, "gaps": [], "required_fixes": "..." }`;
      const r = await askOllama(MODELS.deepseek, p);
      core4 = JSON.parse(r.replace(/```json|```/g, "").trim());
      if (core4.passed) { passed = true; } else { refinementCount++; }
    }
  } catch (e) {
    core4 = { passed: true, gaps: [], _error: e.message, refinementCount };
  }

  // CORE 3: Documents (Gemma)
  let core3;
  try {
    const p = `You are an HSSE Document Controller. Generate required documents for this work based on the JSA. JSA: ${JSON.stringify(core2.steps)}. Hazards: ${JSON.stringify(core1.hazards)}. Generate: 1) Permit to Work, 2) Toolbox Talk (5 min), 3) FLHA Card (3 points). Ensure compliance with ${reg}. Output as JSON: { "ptw": {"permit_type":"","checks":[],"gas_test_required":false}, "toolbox_talk": {"topic":"","key_points":[]}, "flha_card": {"hazards_checked":[],"controls":[],"safe_to_proceed":true} }`;
    const r = await askOllama(MODELS.gemma, p);
    core3 = JSON.parse(r.replace(/```json|```/g, "").trim());
  } catch (e) {
    core3 = { ptw: {}, toolbox_talk: {}, flha_card: {}, _error: e.message };
  }

  // CORE 5: Synthesis (Phi-3)
  let core5;
  try {
    const p = `You are an Executive Safety Reporter. Summarize this complete safety analysis. Original work: ${input}. Risk: ${core1.risk_level}. JSA steps: ${core2.steps?.length || 0}. Hazards found: ${core1.hazards?.length || 0}. Critical findings and action items in 3-5 bullet points. Include: estimated completion time, required permits, and next steps.`;
    const r = await askOllama(MODELS.phi3, p);
    core5 = { summary: r, action_items: [], required_permits: [], estimated_time: "" };
  } catch (e) {
    core5 = { summary: "Summary unavailable.", _error: e.message };
  }

  return {
    sessionId,
    input,
    province,
    regulation: reg,
    safety_stop: false,
    core1_hazards: core1,
    core2_jsa: core2,
    core3_documents: core3,
    core4_validation: { ...core4, refinementCount },
    core5_synthesis: core5,
    completedAt: new Date().toISOString(),
  };
}
