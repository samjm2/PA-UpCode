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

export default function ScoreCard({ factors, analysisResult }) {
  const enabled = Object.entries(factors).filter(([, f]) => f.enabled);

  if (enabled.length === 0 || !analysisResult) {
    return null;
  }

  const avg = analysisResult.overall;
  const verdict = getVerdict(avg);
  const color = getScoreColor(avg);
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (avg / 100) * circumference;

  return (
    <div className="card score-card" style={{ animation: "fadeIn 0.4s ease-out" }}>
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

      {/* Per-factor breakdown */}
      <div className="score-breakdown">
        {enabled.map(([key, f]) => {
          const mockVal = analysisResult.factorScores[key];
          const diff = mockVal - f.value;
          const diffLabel = diff > 0 ? `+${diff}` : `${diff}`;
          const diffCls = diff >= 0 ? "ok" : diff >= -5 ? "warn" : "bad";
          return (
            <div key={key} className="breakdown-row">
              <span className="breakdown-label">{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</span>
              <span className="breakdown-vals">
                <span className="breakdown-score">{mockVal}</span>
                <span className={`breakdown-diff ${diffCls}`}>{diffLabel}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { getVerdict };
