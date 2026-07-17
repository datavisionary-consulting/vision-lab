import { COURSES } from '../data/courses';

const UNCATEGORIZED = 'More Courses';

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

export default function CourseHub({ onSelect }) {
  const groups = groupByCategory(COURSES);
  return (
    <div className="hub-wrap">
      <h1>Exam Trainer<br /><span>Choose a course</span></h1>
      {groups.map((group) => (
        <section className="hub-section" key={group.name}>
          {groups.length > 1 && <h2 className="hub-section-title">{group.name}</h2>}
          <div className="hub-grid">
            {group.courses.map((c) => (
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
        </section>
      ))}
    </div>
  );
}
