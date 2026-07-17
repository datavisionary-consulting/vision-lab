export function checkResult(user, sol) {
  if (!user || !sol) return false;
  if (user.columns.length !== sol.columns.length) return false;
  if (user.values.length !== sol.values.length) return false;
  const norm = (rows) => rows.map((r) => r.map((v) => (v === null ? 'NULL' : String(v).trim())).join('|')).sort();
  return JSON.stringify(norm(user.values)) === JSON.stringify(norm(sol.values));
}
