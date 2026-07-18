import { useEffect, useState } from 'react';
import { useCourseData } from '../hooks/useCourseData';
import { useIeltsWritingProgress } from '../hooks/useIeltsWritingProgress';
import { filterByLevel } from '../lib/ieltsSession';
import DataChart from './DataChart';

const BAND_OPTIONS = Array.from({ length: 15 }, (_, i) => 2 + i * 0.5); // 2.0 .. 9.0

function countWords(text) {
  return (text.trim().match(/\S+/g) || []).length;
}

function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function roundHalf(n) {
  return Math.round(n * 2) / 2;
}

export default function IeltsWritingTrainer({ course, onBack }) {
  const { data: tests, error } = useCourseData(course.dataFile);
  const { progress, recordAttempt, resetProgress } = useIeltsWritingProgress();

  const [view, setView] = useState('home');
  const [selectedLevel, setSelectedLevel] = useState(course.levels[0].id);
  const [activeTest, setActiveTest] = useState(null);
  const [activeTaskTab, setActiveTaskTab] = useState(1);
  const [task1Text, setTask1Text] = useState('');
  const [task2Text, setTask2Text] = useState('');
  const [timeLeftSec, setTimeLeftSec] = useState(0);
  const [showModel1, setShowModel1] = useState(false);
  const [showModel2, setShowModel2] = useState(false);
  const [task1Band, setTask1Band] = useState('');
  const [task2Band, setTask2Band] = useState('');
  const [savedSummary, setSavedSummary] = useState(null);

  useEffect(() => {
    if (view !== 'test') return;
    const id = setInterval(() => setTimeLeftSec((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [view]);

  if (error) return <div className="home-wrap"><p>Could not load IELTS Writing tests.</p></div>;
  if (!tests) return <div className="home-wrap"><p>Loading…</p></div>;

  const levelTests = filterByLevel(tests, selectedLevel);

  const startTest = (test) => {
    setActiveTest(test);
    setActiveTaskTab(1);
    setTask1Text('');
    setTask2Text('');
    setTimeLeftSec(60 * 60);
    setShowModel1(false);
    setShowModel2(false);
    setTask1Band('');
    setTask2Band('');
    setSavedSummary(null);
    setView('test');
  };

  const finishTest = () => {
    setView('assess');
  };

  const saveAssessment = () => {
    const t1 = Number(task1Band) || 0;
    const t2 = Number(task2Band) || 0;
    const overall = roundHalf((t1 + t2 * 2) / 3);
    recordAttempt(activeTest.id, activeTest.level, {
      task1WordCount: countWords(task1Text),
      task1Band: t1,
      task2WordCount: countWords(task2Text),
      task2Band: t2,
      overallBand: overall,
    });
    setSavedSummary({ overall });
  };

  const goHome = () => {
    setView('home');
    setActiveTest(null);
    setSavedSummary(null);
  };

  if (view === 'home') {
    return (
      <div className="home-wrap">
        <h1>{course.title}<br /><span>IELTS Academic</span></h1>
        <p className="subtitle">Task 1 + Task 2 · self-assessed against a model answer · 60 minutes</p>
        <div className="level-tabs">
          {course.levels.map((l) => (
            <button key={l.id} className={`level-tab${selectedLevel === l.id ? ' active' : ''}`} onClick={() => setSelectedLevel(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="test-grid">
          {levelTests.map((t) => {
            const bestBand = progress.bestBandByLevel[t.level];
            return (
              <div key={t.id} className="test-card" onClick={() => startTest(t)}>
                <div className="test-card-header">
                  <span className="prob-id">{t.id}</span>
                  {bestBand !== null && bestBand !== undefined && <span className="test-best-band">Best: {bestBand}</span>}
                </div>
                <div className="prob-title">{t.title}</div>
                <div className="prob-meta">
                  <span>📝 Task 1 + Task 2</span>
                  <span>⏱ 60 min</span>
                </div>
              </div>
            );
          })}
          {!levelTests.length && <p className="subtitle">No tests yet for this level.</p>}
        </div>
        <button
          className="btn-secondary"
          style={{ width: '100%', maxWidth: '560px', color: '#c0392b', borderColor: '#c0392b33' }}
          onClick={() => { if (confirm('Reset all IELTS Writing progress?')) resetProgress(); }}
        >
          🗑 Reset Progress
        </button>
        <button className="btn-secondary" style={{ width: '100%', maxWidth: '560px' }} onClick={onBack}>
          ← Back to courses
        </button>
      </div>
    );
  }

  if (view === 'assess') {
    const wc1 = countWords(task1Text);
    const wc2 = countWords(task2Text);
    return (
      <div className="home-wrap">
        <h2>Self-Assessment</h2>
        <p className="subtitle">Compare your response against the model answer and band descriptors, then estimate your own band.</p>

        {[
          { task: activeTest.task1, text: task1Text, wc: wc1, show: showModel1, setShow: setShowModel1, band: task1Band, setBand: setTask1Band, label: 'Task 1' },
          { task: activeTest.task2, text: task2Text, wc: wc2, show: showModel2, setShow: setShowModel2, band: task2Band, setBand: setTask2Band, label: 'Task 2' },
        ].map((t) => (
          <div key={t.label} className="card-section assess-card">
            <h3>{t.label} — {t.wc} words {t.wc < t.task.minWords && <span className="assess-warning">(under the {t.task.minWords}-word minimum)</span>}</h3>
            <details className="assess-your-response">
              <summary>Your response</summary>
              <p className="assess-response-text">{t.text || '(nothing written)'}</p>
            </details>
            <button className="btn-secondary" onClick={() => t.setShow((v) => !v)}>{t.show ? 'Hide' : 'Show'} Model Answer</button>
            {t.show && <p className="assess-model-text">{t.task.modelAnswer}</p>}
            <div className="band-descriptors">
              {t.task.bandDescriptors.map((d) => (
                <div key={d.criterion} className="band-descriptor">
                  <strong>{d.criterion}</strong>
                  <ul>{d.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>
              ))}
            </div>
            <label className="band-select-label">
              Your self-assessed band for {t.label}:
              <select className="q-select" value={t.band} onChange={(e) => t.setBand(e.target.value)}>
                <option value="">Select a band…</option>
                {BAND_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </label>
          </div>
        ))}

        {!savedSummary && (
          <button className="btn-primary" disabled={!task1Band || !task2Band} onClick={saveAssessment}>
            Save Self-Assessment
          </button>
        )}
        {savedSummary && (
          <div className="results-wrap" style={{ padding: 0 }}>
            <div className="band-circle" style={{ background: `conic-gradient(var(--ielts) ${(savedSummary.overall / 9) * 100}%,var(--surf2) ${(savedSummary.overall / 9) * 100}%)` }}>
              <div className="score-inner">
                <div className="score-pct">{savedSummary.overall}</div>
                <div className="score-lbl">overall band</div>
              </div>
            </div>
            <p className="subtitle">Overall = (Task 1 + 2 × Task 2) ÷ 3, rounded to the nearest 0.5 — matches how the real Writing band is weighted.</p>
          </div>
        )}
        <div className="btn-row">
          <button className="btn-secondary" onClick={() => startTest(activeTest)}>Retry Test</button>
          <button className="btn-secondary" onClick={goHome}>Home</button>
        </div>
      </div>
    );
  }

  // view === 'test'
  const activeTask = activeTaskTab === 1 ? activeTest.task1 : activeTest.task2;
  const activeText = activeTaskTab === 1 ? task1Text : task2Text;
  const setActiveText = activeTaskTab === 1 ? setTask1Text : setTask2Text;
  const wordCount = countWords(activeText);

  return (
    <div className="ielts-test-wrap">
      <div className="ielts-timer-bar">
        <span className="ielts-test-title">{activeTest.title}</span>
        <span className={`ielts-timer${timeLeftSec <= 300 ? ' low' : ''}`}>⏱ {formatTime(timeLeftSec)}</span>
        <button className="btn-secondary" onClick={finishTest}>Finish Test</button>
      </div>
      <div className="passage-tabs">
        <button className={`passage-tab${activeTaskTab === 1 ? ' active' : ''}`} onClick={() => setActiveTaskTab(1)}>Task 1</button>
        <button className={`passage-tab${activeTaskTab === 2 ? ' active' : ''}`} onClick={() => setActiveTaskTab(2)}>Task 2</button>
      </div>
      <div className="ielts-split">
        <div className="passage-pane">
          <h3>{activeTaskTab === 1 ? 'Task 1' : 'Task 2'} — recommended {activeTask.timeLimitMin} min</h3>
          <p className="passage-text">{activeTask.prompt}</p>
          {activeTaskTab === 1 && activeTest.task1.chart && <DataChart chart={activeTest.task1.chart} />}
        </div>
        <div className="question-pane">
          <div className="writing-word-count">{wordCount} words {wordCount < activeTask.minWords && <span className="assess-warning">(minimum {activeTask.minWords})</span>}</div>
          <textarea
            className="sp-editor writing-editor"
            placeholder="Write your response here…"
            value={activeText}
            onChange={(e) => setActiveText(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
