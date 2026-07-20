import { useEffect, useState } from 'react';
import { useCourseData } from '../hooks/useCourseData';
import { useIeltsProgress } from '../hooks/useIeltsProgress';
import { buildAttempt, filterByLevel, rawScoreToBand, scoreAttempt } from '../lib/ieltsSession';
import { gradeAnswer } from '../lib/ieltsGrading';

const TFN_OPTIONS = {
  'true-false-notgiven': ['TRUE', 'FALSE', 'NOT GIVEN'],
  'yes-no-notgiven': ['YES', 'NO', 'NOT GIVEN'],
};

function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatAnswer(val) {
  if (val === undefined || val === null || val === '') return '—';
  if (Array.isArray(val)) return val.join(', ').toUpperCase();
  return String(val);
}

export default function IeltsReadingTrainer({ course, onBack }) {
  const { data: tests, error } = useCourseData(course.dataFile);
  const { progress, recordAttempt, resetProgress } = useIeltsProgress();

  const [view, setView] = useState('home');
  const [selectedLevel, setSelectedLevel] = useState(course.levels[0].id);
  const [activeTest, setActiveTest] = useState(null);
  const [attempt, setAttempt] = useState(null); // { testId, timeLimitMin, questions }
  const [answers, setAnswers] = useState({});
  const [activePassageIdx, setActivePassageIdx] = useState(0);
  const [timeLeftSec, setTimeLeftSec] = useState(0);
  const [results, setResults] = useState(null); // { correctCount, totalCount, byPassage, band }
  const [openExplainIds, setOpenExplainIds] = useState(() => new Set());

  const toggleExplain = (id) => {
    setOpenExplainIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (view !== 'test') return;
    const id = setInterval(() => setTimeLeftSec((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [view]);

  useEffect(() => {
    if (view === 'test' && timeLeftSec === 0 && attempt) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeftSec]);

  if (error) return <div className="home-wrap"><p>Could not load IELTS Reading tests.</p></div>;
  if (!tests) return <div className="home-wrap"><p>Loading…</p></div>;

  const levelTests = filterByLevel(tests, selectedLevel);

  const startTest = (test) => {
    const att = buildAttempt(test);
    setActiveTest(test);
    setAttempt(att);
    setAnswers({});
    setActivePassageIdx(0);
    setTimeLeftSec(test.timeLimitMin * 60);
    setResults(null);
    setOpenExplainIds(new Set());
    setView('test');
  };

  const setAnswer = (questionId, value) => {
    setAnswers((a) => ({ ...a, [questionId]: value }));
  };

  const handleSubmit = () => {
    const scored = scoreAttempt(attempt.questions, answers);
    const band = rawScoreToBand(scored.correctCount, scored.totalCount);
    recordAttempt(attempt.testId, activeTest.level, { ...scored, band });
    setResults({ ...scored, band });
    setOpenExplainIds(new Set());
    setView('results');
  };

  const goHome = () => {
    setView('home');
    setActiveTest(null);
    setAttempt(null);
    setResults(null);
  };

  if (view === 'home') {
    return (
      <div className="home-wrap">
        <h1>{course.title}<br /><span>IELTS Academic</span></h1>
        <p className="subtitle">Timed reading practice · 3 passages · 40 questions · 60 minutes</p>
        <div className="level-tabs">
          {course.levels.map((l) => (
            <button key={l.id} className={`level-tab${selectedLevel === l.id ? ' active' : ''}`} onClick={() => setSelectedLevel(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="test-grid">
          {levelTests.map((t) => {
            const qCount = t.passages.reduce((n, p) => n + p.questions.length, 0);
            const bestBand = progress.bestBandByLevel[t.level];
            const subjects = [...new Set(t.passages.map((p) => p.subject))];
            return (
              <div key={t.id} className="test-card" onClick={() => startTest(t)}>
                <div className="test-card-header">
                  <span className="prob-id">{t.id}</span>
                  {bestBand !== null && bestBand !== undefined && <span className="test-best-band">Best: {bestBand}</span>}
                </div>
                <div className="prob-title">{t.title}</div>
                <div className="prob-topics">
                  {subjects.map((s) => <span key={s} className="prob-topic">{s}</span>)}
                </div>
                <div className="prob-meta">
                  <span>📄 {t.passages.length} passages</span>
                  <span>❓ {qCount} questions</span>
                  <span>⏱ {t.timeLimitMin} min</span>
                </div>
              </div>
            );
          })}
          {!levelTests.length && <p className="subtitle">No tests yet for this level.</p>}
        </div>
        <button
          className="btn-secondary"
          style={{ width: '100%', maxWidth: '560px', color: '#c0392b', borderColor: '#c0392b33' }}
          onClick={() => { if (confirm('Reset all IELTS Reading progress?')) resetProgress(); }}
        >
          🗑 Reset Progress
        </button>
        <button className="btn-secondary" style={{ width: '100%', maxWidth: '560px' }} onClick={onBack}>
          ← Back to courses
        </button>
      </div>
    );
  }

  if (view === 'results') {
    const { correctCount, totalCount, band } = results;
    const pct = totalCount ? Math.round((correctCount / totalCount) * 100) : 0;
    return (
      <div className="quiz-layout">
        <div className="results-wrap">
          <h2>Test Complete 🎉</h2>
          <div className="band-circle" style={{ background: `conic-gradient(var(--ielts) ${pct}%,var(--surf2) ${pct}%)` }}>
            <div className="score-inner">
              <div className="score-pct">{band}</div>
              <div className="score-lbl">band score</div>
            </div>
          </div>
          <p className="subtitle">Approximate band · standard Academic Reading conversion</p>
          <div className="result-grid">
            <div className="result-box green"><div className="num">{correctCount}</div><div className="lbl">Correct</div></div>
            <div className="result-box red"><div className="num">{totalCount - correctCount}</div><div className="lbl">Wrong</div></div>
          </div>
          <div className="review-list">
            {attempt.questions.map((q) => {
              const isCorrect = gradeAnswer(q, answers[q.id]);
              const isOpen = openExplainIds.has(q.id);
              return (
                <div key={q.id} className={`review-row ${isCorrect ? 'correct' : 'wrong'}`}>
                  <div className="review-main">
                    <span className="review-num">{q.number}.</span>
                    <span className="review-prompt">{q.prompt}</span>
                  </div>
                  <div className="review-answers">
                    <span>Your answer: <strong>{formatAnswer(answers[q.id])}</strong></span>
                    <span>Correct: <strong>{formatAnswer(q.correctAnswer)}</strong></span>
                  </div>
                  {q.explanation && (
                    <button className="btn-review-theory" onClick={() => toggleExplain(q.id)}>
                      {isOpen ? '✕ Hide' : '📖 Explain'}
                    </button>
                  )}
                  {isOpen && <p className="review-explanation">{q.explanation}</p>}
                </div>
              );
            })}
          </div>
          <div className="btn-row">
            <button className="btn-secondary" onClick={() => startTest(activeTest)}>Retry Test</button>
            <button className="btn-secondary" onClick={goHome}>Home</button>
          </div>
        </div>
      </div>
    );
  }

  // view === 'test'
  const passage = activeTest.passages[activePassageIdx];
  let lastGroupId = null;

  function renderGroupIntro(q) {
    if (q.type === 'matching-headings') {
      return (
        <div className="q-group-intro">
          <strong>List of Headings</strong>
          <ul>
            {Object.entries(q.groupIntro).map(([key, label]) => (
              <li key={key}><span className="letter">{key}</span> {label}</li>
            ))}
          </ul>
        </div>
      );
    }
    if (typeof q.groupIntro === 'string') {
      return <div className="q-group-intro"><p>{q.groupIntro}</p></div>;
    }
    return null;
  }

  function renderQuestionItem(q, value, onChange, passageObj) {
    return (
      <div className="q-item">
        <div className="q-prompt"><span className="q-num">{q.number}.</span> {q.prompt || ''}</div>
        {q.type === 'multiple-choice' && (
          <div className="q-options">
            {Object.entries(q.options).map(([key, text]) => (
              <button key={key} className={`option-btn${value === key ? ' selected' : ''}`} onClick={() => onChange(key)}>
                <span className="letter">{key}</span><span>{text}</span>
              </button>
            ))}
          </div>
        )}
        {q.type === 'multiple-select' && (
          <div className="q-options">
            {Object.entries(q.options).map(([key, text]) => {
              const arr = value || [];
              const checked = arr.includes(key);
              return (
                <button
                  key={key}
                  className={`option-btn${checked ? ' selected' : ''}`}
                  onClick={() => onChange(checked ? arr.filter((k) => k !== key) : [...arr, key])}
                >
                  <span className="letter">{key}</span><span>{text}</span>
                </button>
              );
            })}
          </div>
        )}
        {(q.type === 'true-false-notgiven' || q.type === 'yes-no-notgiven') && (
          <div className="q-options tfn">
            {TFN_OPTIONS[q.type].map((opt) => (
              <button key={opt} className={`option-btn${value === opt ? ' selected' : ''}`} onClick={() => onChange(opt)}>
                {opt}
              </button>
            ))}
          </div>
        )}
        {q.type === 'matching-headings' && (
          <select className="q-select" value={value || ''} onChange={(e) => onChange(e.target.value)}>
            <option value="">Choose a heading…</option>
            {Object.keys(q.groupIntro).map((key) => <option key={key} value={key}>{key}</option>)}
          </select>
        )}
        {q.type === 'matching-information' && (
          <select className="q-select" value={value || ''} onChange={(e) => onChange(e.target.value)}>
            <option value="">Choose a paragraph…</option>
            {(passageObj.paragraphs || []).map((letter) => <option key={letter} value={letter}>{letter}</option>)}
          </select>
        )}
        {(q.type === 'sentence-completion' || q.type === 'short-answer') && (
          <input
            type="text"
            className="q-text-input"
            placeholder={q.maxWords ? `No more than ${q.maxWords} word${q.maxWords > 1 ? 's' : ''}` : 'Your answer'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="ielts-test-wrap">
      <div className="ielts-timer-bar">
        <span className="ielts-test-title">{activeTest.title}</span>
        <span className={`ielts-timer${timeLeftSec <= 300 ? ' low' : ''}`}>⏱ {formatTime(timeLeftSec)}</span>
        <button className="btn-secondary" onClick={handleSubmit}>Submit Test</button>
      </div>
      <div className="passage-tabs">
        {activeTest.passages.map((p, i) => (
          <button key={p.id} className={`passage-tab${activePassageIdx === i ? ' active' : ''}`} onClick={() => setActivePassageIdx(i)}>
            Passage {i + 1}
          </button>
        ))}
      </div>
      <div className="ielts-split">
        <div className="passage-pane">
          <h3>{passage.title}</h3>
          <div className="passage-text">{passage.text}</div>
        </div>
        <div className="question-pane">
          {passage.questions.map((q) => {
            const showGroupIntro = q.groupId && q.groupId !== lastGroupId;
            lastGroupId = q.groupId || lastGroupId;
            return (
              <div key={q.id}>
                {showGroupIntro && renderGroupIntro(q)}
                {renderQuestionItem(q, answers[q.id], (v) => setAnswer(q.id, v), passage)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
