import { COURSES } from '../data/courses';
import { useFavoriteCourses } from '../hooks/useFavoriteCourses';

const SQL_TOTAL = 26;
const UNCATEGORIZED = 'More Courses';

function readLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore malformed/legacy data */
  }
  return null;
}

function trainerStats(course) {
  const data = readLocal(course.storageKey);
  const cards = data?.cards ? Object.values(data.cards) : [];
  const seen = cards.filter((c) => c.seen).length;
  const now = Date.now();
  const due = cards.filter((c) => c.seen && c.due <= now).length;
  const totalAnswered = data?.totalAnswered || 0;
  const totalCorrect = data?.totalCorrect || 0;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;
  const started = seen > 0;
  const attention = started && (due >= 5 || (totalAnswered >= 5 && accuracy < 60));
  return { kind: 'trainer', started, seen, total: course.countMax, due, accuracy, attention };
}

function sqlStats(course) {
  const data = readLocal(course.storageKey);
  const solved = data?.solved ? Object.keys(data.solved).length : 0;
  const totalAnswered = data?.totalAnswered || 0;
  const totalCorrect = data?.totalCorrect || 0;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;
  const started = solved > 0;
  const attention = started && totalAnswered >= 5 && accuracy < 60;
  return { kind: 'sql', started, solved, total: SQL_TOTAL, accuracy, attention };
}

function ieltsStats(course) {
  const data = readLocal(course.storageKey);
  const attempts = data?.attempts || {};
  const attemptCount = Object.values(attempts).reduce((sum, arr) => sum + arr.length, 0);
  const bestBandByLevel = data?.bestBandByLevel || { B2: null, C1: null, C2: null };
  return { kind: 'ielts', started: attemptCount > 0, attemptCount, bestBandByLevel, attention: false };
}

function statsFor(course) {
  if (course.kind === 'trainer') return trainerStats(course);
  if (course.kind === 'sql') return sqlStats(course);
  return ieltsStats(course);
}

function groupByCategory(courses) {
  const groups = [];
  const byName = new Map();
  for (const c of courses) {
    const name = c.category || UNCATEGORIZED;
    if (!byName.has(name)) {
      const group = { name, courses: [] };
      byName.set(name, group);
      groups.push(group);
    }
    byName.get(name).courses.push(c);
  }
  return groups;
}

function DashCard({ course, stats, onSelect, isFavorite, onToggleFavorite }) {
  const statusClass = !stats.started ? 'unstarted' : stats.attention ? 'attention' : 'ontrack';

  return (
    <div className={`dash-card ${statusClass}${course.enabled ? '' : ' disabled'}`} onClick={() => course.enabled && onSelect(course.id)}>
      <div className="dash-card-head">
        <span className="dash-icon">{course.icon}</span>
        <h3>{course.title}</h3>
        {stats.attention && <span className="dash-flag" title="Needs attention">⚠</span>}
        <button
          className={`dash-fav-btn${isFavorite ? ' active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(course.id); }}
          title={isFavorite ? 'Remove from My Focus' : 'Add to My Focus — courses you want to practice more'}
          aria-label={isFavorite ? 'Remove from My Focus' : 'Add to My Focus'}
        >
          {isFavorite ? '⭐' : '☆'}
        </button>
      </div>

      {stats.kind !== 'ielts' && !stats.started && <p className="dash-empty">Not started yet</p>}

      {stats.kind === 'trainer' && stats.started && (
        <>
          <div className="dash-bar"><div className="dash-bar-fill" style={{ width: `${(stats.seen / stats.total) * 100}%` }} /></div>
          <div className="dash-stats-row">
            <div><span className="dash-num">{stats.seen}/{stats.total}</span><span className="dash-lbl">Seen</span></div>
            <div><span className={`dash-num${stats.due > 0 ? ' warn' : ''}`}>{stats.due}</span><span className="dash-lbl">Due now</span></div>
            <div><span className="dash-num">{stats.accuracy === null ? '—' : `${stats.accuracy}%`}</span><span className="dash-lbl">Accuracy</span></div>
          </div>
        </>
      )}

      {stats.kind === 'sql' && stats.started && (
        <>
          <div className="dash-bar"><div className="dash-bar-fill" style={{ width: `${(stats.solved / stats.total) * 100}%` }} /></div>
          <div className="dash-stats-row">
            <div><span className="dash-num">{stats.solved}/{stats.total}</span><span className="dash-lbl">Solved</span></div>
            <div><span className="dash-num">{stats.accuracy === null ? '—' : `${stats.accuracy}%`}</span><span className="dash-lbl">Accuracy</span></div>
          </div>
        </>
      )}

      {stats.kind === 'ielts' && (
        <>
          <div className="dash-stats-row dash-stats-row-ielts">
            {['B2', 'C1', 'C2'].map((lvl) => (
              <div key={lvl}>
                <span className="dash-num">{stats.bestBandByLevel[lvl] ?? '—'}</span>
                <span className="dash-lbl">{lvl}</span>
              </div>
            ))}
          </div>
          <p className="dash-empty">{stats.attemptCount} attempt{stats.attemptCount === 1 ? '' : 's'}</p>
        </>
      )}

      {!course.enabled && <div className="hub-soon">Coming soon</div>}
    </div>
  );
}

export default function Dashboard({ onSelect, onBack }) {
  const { isFavorite, toggleFavorite } = useFavoriteCourses();
  const groups = groupByCategory(COURSES);
  const withStats = groups.map((g) => ({
    ...g,
    entries: g.courses.map((course) => ({ course, stats: statsFor(course) })),
  }));

  const allEntries = withStats.flatMap((g) => g.entries);
  const myFocus = allEntries.filter((e) => isFavorite(e.course.id));
  const needsAttention = allEntries.filter((e) => e.stats.attention);

  const renderCard = ({ course, stats }) => (
    <DashCard
      key={course.id}
      course={course}
      stats={stats}
      onSelect={onSelect}
      isFavorite={isFavorite(course.id)}
      onToggleFavorite={toggleFavorite}
    />
  );

  return (
    <div className="hub-wrap dash-wrap">
      <h1>Your Progress<br /><span>How each course is going</span></h1>

      {myFocus.length > 0 && (
        <section className="hub-section">
          <h2 className="hub-section-title">⭐ My Focus</h2>
          <div className="hub-grid">{myFocus.map(renderCard)}</div>
        </section>
      )}

      {needsAttention.length > 0 && (
        <section className="hub-section">
          <h2 className="hub-section-title">⚠ Needs Attention</h2>
          <div className="hub-grid">{needsAttention.map(renderCard)}</div>
        </section>
      )}

      {withStats.map((group) => (
        <section className="hub-section" key={group.name}>
          <h2 className="hub-section-title">{group.name}</h2>
          <div className="hub-grid">{group.entries.map(renderCard)}</div>
        </section>
      ))}

      <button className="btn-secondary" style={{ width: '100%', maxWidth: '480px' }} onClick={onBack}>
        ← Back to courses
      </button>
    </div>
  );
}
