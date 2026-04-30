const feedbackLog = [];

export function logFeedback({ runId = "", accepted = false, core = "overall", note = "" } = {}) {
  const entry = {
    runId,
    accepted: Boolean(accepted),
    core,
    note,
    createdAt: new Date().toISOString(),
  };

  feedbackLog.push(entry);

  const coreEntries = feedbackLog.filter((item) => item.core === core);
  const acceptedCount = coreEntries.filter((item) => item.accepted).length;
  const accuracyPct = coreEntries.length ? Math.round((acceptedCount / coreEntries.length) * 100) : 0;

  return {
    accepted: entry.accepted,
    accuracy_pct: accuracyPct,
    total_feedback: coreEntries.length,
  };
}

export function getFeedbackSummary() {
  return feedbackLog;
}
