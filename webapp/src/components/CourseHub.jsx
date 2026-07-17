import { COURSES } from '../data/courses';

export default function CourseHub({ onSelect }) {
  return (
    <div className="hub-wrap">
      <h1>Exam Trainer<br /><span>Choose a course</span></h1>
      <div className="hub-grid">
        {COURSES.map((c) => (
          <div
            key={c.id}
            className={`hub-card${c.enabled ? '' : ' disabled'}`}
            onClick={() => c.enabled && onSelect(c.id)}
          >
            <div className="hub-icon">{c.icon}</div>
            <h3>{c.title}</h3>
            <p>{c.kind === 'sql' ? 'Interactive SQL problems' : 'Spaced-repetition MCQ trainer'}</p>
            {!c.enabled && <div className="hub-soon">Coming soon</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
