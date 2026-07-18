import { useEffect, useState } from 'react';
import { useCourseData } from '../hooks/useCourseData';
import { useIeltsSpeakingProgress } from '../hooks/useIeltsSpeakingProgress';
import { filterByLevel } from '../lib/ieltsSession';
import AudioRecorder from './AudioRecorder';

const BAND_OPTIONS = Array.from({ length: 15 }, (_, i) => 2 + i * 0.5);

function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function IeltsSpeakingTrainer({ course, onBack }) {
  const { data: tests, error } = useCourseData(course.dataFile);
  const { progress, recordAttempt, resetProgress } = useIeltsSpeakingProgress();

  const [view, setView] = useState('home');
  const [selectedLevel, setSelectedLevel] = useState(course.levels[0].id);
  const [activeTest, setActiveTest] = useState(null);
  const [activePart, setActivePart] = useState(1);
  const [part2Phase, setPart2Phase] = useState('cue'); // cue | prep | speak | done
  const [prepSecLeft, setPrepSecLeft] = useState(0);
  const [notes, setNotes] = useState('');
  const [showModel, setShowModel] = useState({});
  const [band, setBand] = useState('');
  const [savedSummary, setSavedSummary] = useState(null);

  useEffect(() => {
    if (part2Phase !== 'prep') return;
    if (prepSecLeft <= 0) {
      setPart2Phase('speak');
      return;
    }
    const id = setInterval(() => setPrepSecLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [part2Phase, prepSecLeft]);

  if (error) return <div className="home-wrap"><p>Could not load IELTS Speaking tests.</p></div>;
  if (!tests) return <div className="home-wrap"><p>Loading…</p></div>;

  const levelTests = filterByLevel(tests, selectedLevel);

  const startTest = (test) => {
    setActiveTest(test);
    setActivePart(1);
    setPart2Phase('cue');
    setPrepSecLeft(test.part2.prepSeconds);
    setNotes('');
    setShowModel({});
    setBand('');
    setSavedSummary(null);
    setView('test');
  };

  const finishTest = () => setView('assess');

  const saveAssessment = () => {
    const b = Number(band);
    recordAttempt(activeTest.id, activeTest.level, { band: b });
    setSavedSummary({ band: b });
  };

  const goHome = () => {
    setView('home');
    setActiveTest(null);
    setSavedSummary(null);
  };

  const toggleModel = (key) => setShowModel((s) => ({ ...s, [key]: !s[key] }));

  if (view === 'home') {
    return (
      <div className="home-wrap">
        <h1>{course.title}<br /><span>IELTS Academic</span></h1>
        <p className="subtitle">Part 1, 2 &amp; 3 · record yourself · self-assessed against a model answer</p>
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
                  <span>🎤 Parts 1, 2 &amp; 3</span>
                </div>
              </div>
            );
          })}
          {!levelTests.length && <p className="subtitle">No tests yet for this level.</p>}
        </div>
        <button
          className="btn-secondary"
          style={{ width: '100%', maxWidth: '560px', color: '#c0392b', borderColor: '#c0392b33' }}
          onClick={() => { if (confirm('Reset all IELTS Speaking progress?')) resetProgress(); }}
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
    return (
      <div className="home-wrap">
        <h2>Self-Assessment</h2>
        <p className="subtitle">Listen back to your recordings, compare against the model answers, then estimate your own band.</p>

        <div className="band-descriptors" style={{ maxWidth: 700, width: '100%' }}>
          {activeTest.bandDescriptors.map((d) => (
            <div key={d.criterion} className="band-descriptor">
              <strong>{d.criterion}</strong>
              <ul>{d.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
          ))}
        </div>

        <div className="card-section assess-card">
          <h3>Part 1</h3>
          <button className="btn-secondary" onClick={() => toggleModel('p1')}>{showModel.p1 ? 'Hide' : 'Show'} Model Answers</button>
          {showModel.p1 && activeTest.part1.questions.map((q, i) => (
            <p key={i} className="assess-model-text"><strong>{q}</strong><br />{activeTest.part1.modelAnswers[i]}</p>
          ))}
        </div>

        <div className="card-section assess-card">
          <h3>Part 2</h3>
          <button className="btn-secondary" onClick={() => toggleModel('p2')}>{showModel.p2 ? 'Hide' : 'Show'} Model Answer</button>
          {showModel.p2 && <p className="assess-model-text">{activeTest.part2.modelAnswer}</p>}
        </div>

        <div className="card-section assess-card">
          <h3>Part 3</h3>
          <button className="btn-secondary" onClick={() => toggleModel('p3')}>{showModel.p3 ? 'Hide' : 'Show'} Model Answers</button>
          {showModel.p3 && activeTest.part3.questions.map((q, i) => (
            <p key={i} className="assess-model-text"><strong>{q}</strong><br />{activeTest.part3.modelAnswers[i]}</p>
          ))}
        </div>

        <label className="band-select-label">
          Your self-assessed overall Speaking band:
          <select className="q-select" value={band} onChange={(e) => setBand(e.target.value)}>
            <option value="">Select a band…</option>
            {BAND_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>

        {!savedSummary && (
          <button className="btn-primary" disabled={!band} onClick={saveAssessment}>Save Self-Assessment</button>
        )}
        {savedSummary && (
          <div className="results-wrap" style={{ padding: 0 }}>
            <div className="band-circle" style={{ background: `conic-gradient(var(--ielts) ${(savedSummary.band / 9) * 100}%,var(--surf2) ${(savedSummary.band / 9) * 100}%)` }}>
              <div className="score-inner">
                <div className="score-pct">{savedSummary.band}</div>
                <div className="score-lbl">overall band</div>
              </div>
            </div>
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
  return (
    <div className="ielts-test-wrap">
      <div className="ielts-timer-bar">
        <span className="ielts-test-title">{activeTest.title}</span>
        <button className="btn-secondary" onClick={finishTest}>Finish &amp; Self-Assess</button>
      </div>
      <div className="passage-tabs">
        <button className={`passage-tab${activePart === 1 ? ' active' : ''}`} onClick={() => setActivePart(1)}>Part 1</button>
        <button className={`passage-tab${activePart === 2 ? ' active' : ''}`} onClick={() => setActivePart(2)}>Part 2</button>
        <button className={`passage-tab${activePart === 3 ? ' active' : ''}`} onClick={() => setActivePart(3)}>Part 3</button>
      </div>

      {activePart === 1 && (
        <div className="card-section speaking-part-card">
          <h3>Part 1 — Introduction and Interview</h3>
          <p className="subtitle">Topic: {activeTest.part1.topic}</p>
          <ul className="speaking-question-list">
            {activeTest.part1.questions.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
          <AudioRecorder />
        </div>
      )}

      {activePart === 2 && (
        <div className="card-section speaking-part-card">
          <h3>Part 2 — Long Turn</h3>
          <div className="cue-card">
            <h4>{activeTest.part2.cueCardTitle}</h4>
            <p>You should say:</p>
            <ul>{activeTest.part2.cueCardPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
          </div>
          {part2Phase === 'cue' && (
            <button className="btn-primary" onClick={() => setPart2Phase('prep')}>
              Start Preparation ({activeTest.part2.prepSeconds}s)
            </button>
          )}
          {part2Phase === 'prep' && (
            <div>
              <div className="ielts-timer">⏱ Preparation: {formatTime(prepSecLeft)}</div>
              <textarea className="sp-editor" placeholder="Jot down notes (optional)…" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ minHeight: 100 }} />
              <button className="btn-secondary" onClick={() => setPart2Phase('speak')}>Start Speaking Now</button>
            </div>
          )}
          {part2Phase === 'speak' && (
            <div>
              <p className="subtitle">Speak for up to {Math.round(activeTest.part2.speakSeconds / 60)} minutes.</p>
              <AudioRecorder autoStopAfterSec={activeTest.part2.speakSeconds} onRecordingComplete={() => setPart2Phase('done')} />
            </div>
          )}
          {part2Phase === 'done' && (
            <div>
              <p className="subtitle">Follow-up questions the examiner might ask next:</p>
              <ul className="speaking-question-list">
                {activeTest.part2.followUpQuestions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {activePart === 3 && (
        <div className="card-section speaking-part-card">
          <h3>Part 3 — Discussion</h3>
          <ul className="speaking-question-list">
            {activeTest.part3.questions.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
          <AudioRecorder />
        </div>
      )}
    </div>
  );
}
