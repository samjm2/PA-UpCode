function getVerdict(score) {
  if (score >= 85) return { text: "Excellent", cls: "ok" };
  if (score >= 75) return { text: "Strong", cls: "ok" };
  if (score >= 65) return { text: "Moderate", cls: "warn" };
  return { text: "Risky", cls: "bad" };
}

function getScoreColor(score) {
  if (score >= 85) return "#16a34a";
  if (score >= 75) return "#22c55e";
  if (score >= 65) return "#f59e0b";
  return "#ef4444";
}

export default function ScoreCard({ factors }) {
  const enabled = Object.values(factors).filter((f) => f.enabled);

  if (enabled.length === 0) {
    return (
      <div className="card score-card">
        <div className="score-card-inner empty">
          <div className="score-ring">
            <svg viewBox="0 0 120 120" className="score-ring-svg">
              <circle cx="60" cy="60" r="52" className="score-ring-bg" />
            </svg>
            <div className="score-ring-value">--</div>
          </div>
          <div className="score-info">
            <div className="score-label">Overall Score</div>
            <div className="verdict-text">Enable at least one factor</div>
          </div>
        </div>
      </div>
    );
  }

  const avg = Math.round(
    enabled.reduce((sum, f) => sum + f.value, 0) / enabled.length
  );
  const verdict = getVerdict(avg);
  const color = getScoreColor(avg);
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (avg / 100) * circumference;

  return (
    <div className="card score-card">
      <div className="score-card-inner">
        <div className="score-ring">
          <svg viewBox="0 0 120 120" className="score-ring-svg">
            <circle cx="60" cy="60" r="52" className="score-ring-bg" />
            <circle
              cx="60"
              cy="60"
              r="52"
              className="score-ring-fill"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: offset,
                stroke: color,
              }}
            />
          </svg>
          <div className="score-ring-value" style={{ color }}>{avg}</div>
        </div>
        <div className="score-info">
          <div className="score-label">Overall Score</div>
          <span className={`badge ${verdict.cls}`}>{verdict.text}</span>
          <div className="score-detail">
            Based on {enabled.length} active factor{enabled.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

export { getVerdict };
