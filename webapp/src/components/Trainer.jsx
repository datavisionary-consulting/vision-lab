import { useMemo, useState } from 'react';
import { useCourseData } from '../hooks/useCourseData';
import { useCourseProgress } from '../hooks/useCourseProgress';
import { sm2 } from '../lib/sm2';
import { buildSession, filterByTopic } from '../lib/session';
import { researchQuestion, questionResearchText } from '../lib/research';
import SidePanel from './SidePanel';

const MODES = [
  { id: 'smart', title: '🧠 Smart Mode', desc: '60% new + 40% review of mistakes. Best for daily practice.' },
  { id: 'new', title: '✨ New Only', desc: "Questions you haven't answered yet." },
  { id: 'review', title: '🔁 Review Only', desc: 'Questions due for review or previously failed.' },
  { id: 'favorites', title: '⭐ Favorites', desc: "Only questions you've starred." },
  { id: 'random', title: '🎲 Random', desc: 'All questions, no filtering.' },
];

export default function Trainer({ course, onBack }) {
  const { data: questions, error } = useCourseData(course.dataFile);
  const { progress, saveProgress, resetProgress } = useCourseProgress(course, questions);

  const [view, setView] = useState('home');
  const [topic, setTopic] = useState('all');
  const [mode, setMode] = useState('smart');
  const [count, setCount] = useState(course.countDefault);
  const [session, setSession] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [showTheory, setShowTheory] = useState(false);

  const doneCount = useMemo(
    () => Object.values(progress.cards).filter((c) => c.seen).length,
    [progress.cards]
  );
  const favoriteCount = useMemo(
    () => Object.values(progress.cards).filter((c) => c.favorite).length,
    [progress.cards]
  );
  const globalPct = progress.totalAnswered
    ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100)
    : null;

  if (error) return <div className="home-wrap"><p>Could not load this course's questions.</p></div>;
  if (!questions) return <div className="home-wrap"><p>Loading…</p></div>;

  const startSession = () => {
    const pool = filterByTopic(questions, topic);
    const qs = buildSession(pool, progress.cards, mode, count);
    if (!qs || !qs.length) {
      alert('No questions available for this selection.');
      return;
    }
    setSession({
      questions: qs,
      idx: 0,
      correct: 0,
      wrong: 0,
      hard: 0,
      newCount: qs.filter((q) => !progress.cards[q.id].seen).length,
    });
    setAnswered(false);
    setSelectedKey(null);
    setShowTheory(false);
    setView('quiz');
  };

  const selectAnswer = (key) => {
    if (answered) return;
    const q = session.questions[session.idx];
    const correct = key === q.correct;
    const cards = { ...progress.cards, [q.id]: { ...progress.cards[q.id] } };
    cards[q.id].seen = true;
    if (correct) {
      cards[q.id].correct++;
      setSession((s) => ({ ...s, correct: s.correct + 1 }));
    } else {
      cards[q.id].wrong++;
      setSession((s) => ({ ...s, wrong: s.wrong + 1 }));
    }
    saveProgress({
      ...progress,
      cards,
      lastDate: new Date().toDateString(),
      totalAnswered: (progress.totalAnswered || 0) + 1,
      totalCorrect: (progress.totalCorrect || 0) + (correct ? 1 : 0),
    });
    setSelectedKey(key);
    setAnswered(true);
  };

  const toggleFavorite = (qId) => {
    const cards = { ...progress.cards, [qId]: { ...progress.cards[qId], favorite: !progress.cards[qId].favorite } };
    saveProgress({ ...progress, cards });
  };

  const rateAndNext = (rating) => {
    const q = session.questions[session.idx];
    const cards = { ...progress.cards, [q.id]: { ...progress.cards[q.id] } };
    sm2(cards[q.id], rating);
    saveProgress({ ...progress, cards });
    const nextIdx = session.idx + 1;
    const nextHard = rating === 1 ? session.hard + 1 : session.hard;
    if (nextIdx >= session.questions.length) {
      saveProgress({ ...progress, cards, streak: (progress.streak || 0) + 1 });
      setSession((s) => ({ ...s, idx: nextIdx, hard: nextHard }));
      setView('results');
    } else {
      setSession((s) => ({ ...s, idx: nextIdx, hard: nextHard }));
      setAnswered(false);
      setSelectedKey(null);
      setShowTheory(false);
    }
  };

  const goHome = () => {
    setView('home');
    setSession(null);
  };

  if (view === 'home') {
    return (
      <div className="home-wrap">
        <h1>{course.title}<br /><span>Campaign Briefing</span></h1>
        <p className="subtitle">Spaced repetition · {questions.length} questions</p>
        <div className="stats-grid">
          <div className="stat-box"><div className="num">{questions.length}</div><div className="lbl">Total</div></div>
          <div className="stat-box"><div className="num">{doneCount}</div><div className="lbl">Seen</div></div>
          <div className="stat-box"><div className="num">{globalPct === null ? '—' : `${globalPct}%`}</div><div className="lbl">% Correct</div></div>
        </div>
        {course.topics.length > 1 && (
          <div className="topic-select">
            {course.topics.map((t) => (
              <button key={t.id} className={`topic-btn${topic === t.id ? ' active' : ''}`} onClick={() => setTopic(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        )}
        <div className="mode-cards">
          {MODES.map((m) => (
            <div key={m.id} className={`mode-card${mode === m.id ? ' selected' : ''}`} onClick={() => setMode(m.id)}>
              <h3>{m.title}</h3>
              <p>{m.id === 'favorites' ? `${favoriteCount} starred question${favoriteCount === 1 ? '' : 's'}` : m.desc}</p>
            </div>
          ))}
        </div>
        <div className="count-row">
          <label>Questions per session:</label>
          <input type="range" min="5" max={course.countMax} step="5" value={count} onChange={(e) => setCount(Number(e.target.value))} />
          <span>{count}</span>
        </div>
        <button className="btn-primary" onClick={startSession}>▶ Start Session</button>
        <button
          className="btn-secondary"
          style={{ width: '100%', maxWidth: '480px', color: '#c0392b', borderColor: '#c0392b33', marginTop: '4px' }}
          onClick={() => {
            if (confirm(`Reset all ${course.title} progress?`)) resetProgress();
          }}
        >
          🗑 Reset Progress
        </button>
        <button className="btn-secondary" style={{ width: '100%', maxWidth: '480px' }} onClick={onBack}>
          ← Back to courses
        </button>
      </div>
    );
  }

  if (view === 'results') {
    const total = session.questions.length;
    const pct = total ? Math.round((session.correct / total) * 100) : 0;
    const now = Date.now();
    const dueCount = questions.filter((q) => progress.cards[q.id].seen && progress.cards[q.id].due <= now + 86400000).length;
    const unseenCount = questions.filter((q) => !progress.cards[q.id].seen).length;
    const gPct = progress.totalAnswered ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100) : 0;

    return (
      <div className="results-wrap">
        <h2>Session Complete 🎉</h2>
        <div className="score-circle" style={{ background: `conic-gradient(var(--acc) ${pct}%,var(--surf2) ${pct}%)` }}>
          <div className="score-inner">
            <div className="score-pct">{pct}%</div>
            <div className="score-lbl">correct</div>
          </div>
        </div>
        <div className="result-grid">
          <div className="result-box green"><div className="num">{session.correct}</div><div className="lbl">Correct</div></div>
          <div className="result-box red"><div className="num">{session.wrong}</div><div className="lbl">Wrong</div></div>
          <div className="result-box yellow"><div className="num">{session.hard}</div><div className="lbl">Hard</div></div>
          <div className="result-box blue"><div className="num">{session.newCount}</div><div className="lbl">New</div></div>
        </div>
        <div className="next-info">
          <strong>Tomorrow:</strong> {dueCount} reviews scheduled<br />
          <strong>Unseen:</strong> {unseenCount} new questions<br />
          <strong>Global accuracy:</strong> {gPct}% ({progress.totalAnswered} answered)
        </div>
        <div className="btn-row">
          <button className="btn-secondary" onClick={startSession}>New Session</button>
          <button className="btn-secondary" onClick={goHome}>Home</button>
        </div>
      </div>
    );
  }

  // view === 'quiz'
  const q = session.questions[session.idx];
  const total = session.questions.length;
  const card = progress.cards[q.id];
  const isReview = card.seen && card.due <= Date.now();

  return (
    <div className="quiz-layout">
      <div className="quiz-wrap">
        <div className="quiz-header">
          <span className="quiz-progress-text">{session.idx + 1} / {total}</span>
          <div className="quiz-header-actions">
            <button
              className={`favorite-btn${card.favorite ? ' active' : ''}`}
              onClick={() => toggleFavorite(q.id)}
              title={card.favorite ? 'Unmark favorite' : 'Mark as favorite'}
              aria-label={card.favorite ? 'Unmark favorite' : 'Mark as favorite'}
            >
              {card.favorite ? '⭐' : '☆'}
            </button>
            <button className="btn-ghost" onClick={goHome}>← Exit</button>
          </div>
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${(session.idx / total) * 100}%` }} /></div>
        <div className="tag-row">
          {q.topic && <span className="tag">{q.topic}</span>}
          {isReview && <span className="tag">🔁 Review</span>}
          {!card.seen && <span className="tag">✨ New</span>}
        </div>
        <div className="question-card">
          <div className="question-text">{q.question}</div>
          <div className="options">
            {Object.entries(q.options).map(([key, val]) => {
              let cls = 'option-btn';
              if (answered && key === q.correct) cls += ' correct';
              if (answered && key === selectedKey && key !== q.correct) cls += ' wrong';
              return (
                <button key={key} className={cls} disabled={answered} onClick={() => selectAnswer(key)}>
                  <span className="letter">{key}</span>
                  <span>{val}</span>
                </button>
              );
            })}
          </div>
        </div>
        {answered && (
          <div className={`feedback-box ${selectedKey === q.correct ? 'correct' : 'wrong'}`}>
            {selectedKey === q.correct ? '✓ Correct!' : `✗ Wrong — correct answer (${q.correct}): ${q.options[q.correct]}`}
          </div>
        )}
        {answered && (
          <div className="action-row">
            <button className="btn-review-web" onClick={() => researchQuestion(questionResearchText(q))}>
              🔍 Research this question
            </button>
            {q.theory && (
              <button className="btn-review-theory" onClick={() => setShowTheory((v) => !v)}>
                📖 {showTheory ? 'Hide' : 'Review'} Theory
              </button>
            )}
          </div>
        )}
        {answered && (
          <div className="self-rate">
            <p>How did it go?</p>
            <div className="rate-btns">
              <button className="rate-btn hard" onClick={() => rateAndNext(1)}>😓 Hard</button>
              <button className="rate-btn ok" onClick={() => rateAndNext(3)}>🤔 OK</button>
              <button className="rate-btn easy" onClick={() => rateAndNext(5)}>😎 Easy</button>
            </div>
          </div>
        )}
      </div>
      {showTheory && q.theory && <SidePanel theory={q.theory} onClose={() => setShowTheory(false)} />}
    </div>
  );
}
