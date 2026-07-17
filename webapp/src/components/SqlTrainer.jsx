import { useMemo, useRef, useState } from 'react';
import { useCourseData } from '../hooks/useCourseData';
import { useSqlProgress } from '../hooks/useSqlProgress';
import { useSqlDb } from '../hooks/useSqlDb';
import { checkResult } from '../lib/sqlCheck';
import { researchQuestion } from '../lib/research';
import ResultTable from './ResultTable';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert'];
const DIFF_COLORS = { Easy: '#2d7d6f', Medium: '#e67e22', Hard: '#b85c38', Expert: '#c0392b' };
const DIFF_BG = { Easy: '#2d7d6f22', Medium: '#e67e2222', Hard: '#b85c3822', Expert: '#c0392b22' };

function researchTextForProblem(p) {
  return `Problem: ${p.title}\n\n${p.problem}\n\nKey concept: ${p.key_concept}\n\nSolution:\n${p.solution}`;
}

export default function SqlTrainer({ course, onBack }) {
  const { data: problems, error: problemsError } = useCourseData(course.dataFile);
  const { data: sampleData } = useCourseData(course.sampleDataFile);
  const { progress, saveProgress, resetProgress } = useSqlProgress();
  const { db, ready: dbReady, error: dbError } = useSqlDb();

  const [view, setView] = useState('home');
  const [selectedDiff, setSelectedDiff] = useState('Easy');
  const [activeProblem, setActiveProblem] = useState(null);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null); // {columns, values} | null
  const [runError, setRunError] = useState(null);
  const [attempted, setAttempted] = useState(false);
  const [solved, setSolved] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showConcept, setShowConcept] = useState(false);
  const editorRef = useRef(null);

  const solvedCount = Object.keys(progress.solved).length;
  const pct = progress.totalAnswered ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100) + '%' : '—';

  const byDiff = useMemo(() => {
    const map = {};
    if (problems) DIFFICULTIES.forEach((d) => { map[d] = problems.filter((p) => p.difficulty === d); });
    return map;
  }, [problems]);

  if (problemsError || dbError) return <div className="home-wrap"><p>Could not load SQL Training.</p></div>;
  if (!problems || !sampleData) return <div className="home-wrap"><p>Loading…</p></div>;

  const openProblem = (id) => {
    const p = problems.find((x) => x.id === id);
    if (!p) return;
    setActiveProblem(p);
    setQuery('');
    setResult(null);
    setRunError(null);
    setAttempted(false);
    setSolved(false);
    setShowHint(false);
    setShowConcept(false);
    setView('problem');
    setTimeout(() => editorRef.current?.focus(), 0);
  };

  const runQuery = () => {
    if (!dbReady) { alert('Database is still loading, please wait...'); return; }
    const userSQL = query.trim();
    if (!userSQL) { alert('Write a query first.'); return; }

    let userResult = null;
    let userErr = null;
    try {
      const res = db.current.exec(userSQL);
      userResult = res.length > 0 ? res[0] : { columns: [], values: [] };
    } catch (e) {
      userErr = e.message;
    }

    if (userErr) {
      setResult(null);
      setRunError(userErr);
      return;
    }
    setRunError(null);
    setResult(userResult);

    if (attempted) return; // already graded this attempt

    let solResult = null;
    try {
      const res = db.current.exec(activeProblem.solution.trim());
      solResult = res.length > 0 ? res[0] : { columns: [], values: [] };
    } catch { /* solution should always be valid; ignore */ }

    const correct = checkResult(userResult, solResult);
    setAttempted(true);

    if (correct) {
      setSolved(true);
      setShowConcept(true);
      saveProgress({
        ...progress,
        solved: { ...progress.solved, [activeProblem.id]: true },
        totalAnswered: (progress.totalAnswered || 0) + 1,
        totalCorrect: (progress.totalCorrect || 0) + 1,
      });
    } else {
      setAttempted(false); // allow retry, don't lock
    }
  };

  const revealSolution = () => {
    if (!confirm('Show solution? This will count as not solved.')) return;
    setQuery(activeProblem.solution.trim());
    saveProgress({ ...progress, totalAnswered: (progress.totalAnswered || 0) + 1 });
    setShowConcept(true);
  };

  const nextProblem = () => {
    const probs = byDiff[activeProblem.difficulty];
    const idx = probs.findIndex((x) => x.id === activeProblem.id);
    const next = probs[idx + 1];
    if (next) openProblem(next.id);
    else goHome();
  };

  const goHome = () => {
    setView('home');
    setActiveProblem(null);
  };

  if (view === 'home') {
    const probs = byDiff[selectedDiff] || [];
    return (
      <div className="sql-home-v2">
        <h1>SQL Training<br /><span>MySQL · Interview Prep</span></h1>
        <p className="subtitle">Real-world problems · Interactive editor</p>
        <div className="sql-stats-row">
          <div className="stat-box"><div className="num">{solvedCount}/{problems.length}</div><div className="lbl">Solved</div></div>
          <div className="stat-box"><div className="num">{pct}</div><div className="lbl">Success Rate</div></div>
          <div className="stat-box"><div className="num sql-db-status" style={{ color: dbReady ? '#2d7d6f' : 'var(--yellow)' }}>{dbReady ? '● DB Ready' : '⏳ Loading DB'}</div><div className="lbl">Database</div></div>
        </div>
        <div className="diff-tabs">
          {DIFFICULTIES.map((d) => {
            const dProbs = byDiff[d] || [];
            const dSolved = dProbs.filter((p) => progress.solved[p.id]).length;
            return (
              <button key={d} className={`diff-tab${selectedDiff === d ? ' active' : ''}`} data-diff={d} onClick={() => setSelectedDiff(d)}>
                <span className="diff-name">{d}</span>
                <span className="diff-count">{dSolved}/{dProbs.length}</span>
              </button>
            );
          })}
        </div>
        <div className="prob-grid">
          {probs.map((p) => (
            <div key={p.id} className={`prob-card${progress.solved[p.id] ? ' solved' : ''}`} onClick={() => openProblem(p.id)}>
              <div className="prob-card-header">
                <span className="prob-id">{p.id}</span>
                <span className="prob-check">{progress.solved[p.id] ? '✓' : ''}</span>
              </div>
              <div className="prob-title">{p.title}</div>
              <div className="prob-topics">
                {p.topics.slice(0, 3).map((t) => <span key={t} className="prob-topic">{t}</span>)}
              </div>
              <div className="prob-meta">
                <span>⏱ ~{p.estimated_min} min</span>
                <span>{p.schema_used.join(' · ')}</span>
              </div>
            </div>
          ))}
        </div>
        <button
          className="btn-secondary"
          style={{ width: '100%', maxWidth: '560px', color: '#c0392b', borderColor: '#c0392b33', marginTop: '4px' }}
          onClick={() => { if (confirm('Reset all SQL progress?')) resetProgress(); }}
        >
          🗑 Reset Progress
        </button>
        <button className="btn-secondary" style={{ width: '100%', maxWidth: '560px' }} onClick={onBack}>
          ← Back to courses
        </button>
      </div>
    );
  }

  // view === 'problem'
  const p = activeProblem;
  return (
    <div className="sql-problem-view">
      <div className="sp-header">
        <button className="sp-back" onClick={goHome}>← Back</button>
        <span className="sp-id">{p.id}</span>
        <span className="sp-title-h">{p.title}</span>
        <span className="sp-diff-badge" style={{ background: DIFF_BG[p.difficulty], color: DIFF_COLORS[p.difficulty] }}>{p.difficulty}</span>
        <span className="sp-time">⏱ ~{p.estimated_min} min</span>
      </div>
      <div className="sp-topics-row">
        {p.topics.map((t) => <span key={t} className="prob-topic">{t}</span>)}
      </div>

      <div className="two-col">
        <div className="card-section">
          <h3>Problem</h3>
          <div className="problem-text">{p.problem}</div>
        </div>
        <div className="card-section">
          <h3>Schema &amp; Sample Data</h3>
          {p.schema_used.map((tname) => {
            const td = sampleData[tname];
            if (!td) return null;
            return (
              <div key={tname} className="schema-table-wrap">
                <div className="schema-table-name">{tname} <span className="schema-note">{td.note}</span></div>
                <div className="schema-table-scroll">
                  <table className="schema-table">
                    <thead><tr>{td.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>
                      {td.rows.map((r, i) => (
                        <tr key={i}>{r.map((v, j) => <td key={j}>{v === null || v === 'NULL' ? <em className="null-val">NULL</em> : String(v)}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-section editor-wrap">
        <div className="editor-label">Your Query — MySQL / SQLite syntax</div>
        <div className="expected-cols">Expected columns: {p.expected_columns.join(', ')}</div>
        <textarea
          ref={editorRef}
          className="sp-editor"
          placeholder="-- Write your SQL query here&#10;SELECT ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="editor-btns">
          <button className="btn-run-sql" onClick={runQuery}>▶ Run Query</button>
          <button className="btn-hint-sql" onClick={() => setShowHint(true)}>💡 Common Mistake</button>
          <button className="btn-sol-sql" onClick={revealSolution}>📋 Show Solution</button>
        </div>
        {showHint && <div className="hint-box"><strong>💡 Hint:</strong> {p.common_mistakes[0]}</div>}
      </div>

      {(result || runError) && (
        <div className="sp-result-area">
          <div className="result-header">
            <span className="result-label-sm">Query Result</span>
            <span className={`result-status ${runError ? 'err' : 'ok'}`}>{runError ? 'Error' : `${result.values.length} row(s) returned`}</span>
          </div>
          <div className="result-table-scroll">
            {runError ? <div className="sql-error">❌ {runError}</div> : <ResultTable result={result} />}
          </div>
        </div>
      )}

      {result && !runError && (
        <div className={`feedback-box ${solved ? 'correct' : 'wrong'}`}>
          {solved ? <>✓ <strong>Correct!</strong> Your query returns the expected result.</> : "✗ Not quite yet. Keep trying or use the Hint / Solution buttons."}
        </div>
      )}

      {showConcept && (
        <div className="concept-box">
          <h3>📖 Key Concept</h3>
          <div className="concept-text">{p.key_concept}</div>
        </div>
      )}
      {showConcept && (
        <div className="mistakes-box">
          <h3>⚠ Common Mistakes</h3>
          <ul>{p.common_mistakes.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </div>
      )}

      {showConcept && (
        <button className="btn-review-web" onClick={() => researchQuestion(researchTextForProblem(p))}>
          🔍 Research this question
        </button>
      )}
      {solved && <button className="btn-next-prob" onClick={nextProblem}>Next Problem →</button>}
    </div>
  );
}
