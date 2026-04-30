const SCORES = [1, 2, 3, 4, 5];

function getCell(score) {
  if (score >= 9) return { label: "High", color: "#FF0000" };
  if (score >= 4) return { label: "Medium", color: "#FFFF00" };
  return { label: "Low", color: "#00B050" };
}

export default function RiskMatrix({ activeScore = 1 }) {
  return (
    <div className="risk-matrix-table">
      {SCORES.map((severity) =>
        SCORES.map((probability) => {
          const score = severity * probability;
          const cell = getCell(score);

          return (
            <span
              className={`risk-cell ${score === activeScore ? "active" : ""}`}
              key={`${severity}-${probability}`}
              style={{ backgroundColor: cell.color }}
              title={`P${probability} x S${severity} = ${score} ${cell.label}`}
            >
              {score}
            </span>
          );
        }),
      )}
    </div>
  );
}
