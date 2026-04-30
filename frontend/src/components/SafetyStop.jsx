export default function SafetyStop({ safetyStop }) {
  if (!safetyStop?.active) {
    return null;
  }

  return (
    <div className="stop-work-callout safety-stop-overlay">
      <strong>STOP WORK</strong>
      <span>{safetyStop.message}</span>
    </div>
  );
}
