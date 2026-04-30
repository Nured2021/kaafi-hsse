export default function ModeSelector({ mode, onChange }) {
  return (
    <div className="mode-selector">
      {["ai_auto", "manual", "hybrid"].map((value) => (
        <button
          className={mode === value ? "active" : ""}
          key={value}
          onClick={() => onChange(value)}
          type="button"
        >
          {value === "ai_auto" ? "AI Auto" : value[0].toUpperCase() + value.slice(1)}
        </button>
      ))}
    </div>
  );
}
