const CORE_LABELS = [
  ["core0", "Ingestion"],
  ["core1", "Hazard"],
  ["core2", "JSA"],
  ["core3", "Documents"],
  ["core4", "Critic"],
  ["core5", "Synthesis"],
  ["core6", "Feedback"],
];

export default function CoreStatus({ stages = [] }) {
  return (
    <div className="core-status">
      {CORE_LABELS.map(([core, label]) => {
        const stage = stages.find((item) => item.step === core);
        const status = stage?.status || "pending";

        return (
          <article className={`core-step ${status}`} key={core}>
            <strong>{core.toUpperCase()}</strong>
            <span>{label}</span>
            <small>{status}</small>
          </article>
        );
      })}
    </div>
  );
}
