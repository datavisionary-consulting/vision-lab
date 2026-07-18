// Renders IELTS Writing Task 1 source data (table / bar chart / process
// diagram) directly from JSON. No image-generation capability is available
// to author real chart images, so this renders the same underlying data
// as a genuine table or a simple CSS/SVG bar chart instead — an authentic
// IELTS Task 1 format in its own right, not a workaround.
export default function DataChart({ chart }) {
  if (chart.type === 'table') {
    return (
      <div className="chart-table-wrap">
        <table className="chart-table">
          <thead>
            <tr>{chart.data.columns.map((c) => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {chart.data.rows.map((row, i) => (
              <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (chart.type === 'bar') {
    const { categories, series } = chart.data;
    const max = Math.max(...series.flatMap((s) => s.values));
    const colors = ['var(--ielts)', 'var(--acc2)'];
    return (
      <div className="chart-bar-wrap">
        <div className="chart-legend">
          {series.map((s, i) => (
            <span key={s.name} className="chart-legend-item">
              <span className="chart-legend-swatch" style={{ background: colors[i % colors.length] }} />
              {s.name}
            </span>
          ))}
        </div>
        <div className="chart-bar-groups">
          {categories.map((cat, ci) => (
            <div key={cat} className="chart-bar-group">
              <div className="chart-bar-columns">
                {series.map((s, si) => (
                  <div
                    key={s.name}
                    className="chart-bar-col"
                    style={{ height: `${(s.values[ci] / max) * 100}%`, background: colors[si % colors.length] }}
                    title={`${s.name}: ${s.values[ci]}`}
                  >
                    <span className="chart-bar-value">{s.values[ci]}</span>
                  </div>
                ))}
              </div>
              <div className="chart-bar-label">{cat}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (chart.type === 'process') {
    return (
      <ol className="chart-process-list">
        {chart.data.steps.map((step, i) => (
          <li key={i} className="chart-process-step">
            <span className="chart-process-num">{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    );
  }

  return null;
}
