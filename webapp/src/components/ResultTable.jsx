export default function ResultTable({ result }) {
  if (!result || !result.columns || !result.columns.length) {
    return <div style={{ padding: '12px', color: 'var(--muted)' }}>Query returned no columns.</div>;
  }
  return (
    <table className="result-table">
      <thead>
        <tr>{result.columns.map((c) => <th key={c}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {result.values.length === 0 ? (
          <tr><td colSpan={result.columns.length} style={{ color: 'var(--muted)', textAlign: 'center' }}>No rows returned</td></tr>
        ) : (
          result.values.map((row, i) => (
            <tr key={i}>
              {row.map((v, j) => (
                <td key={j}>{v === null ? <em className="null-val">NULL</em> : String(v)}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
