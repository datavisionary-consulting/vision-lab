import { useState } from 'react';
import { getCourse } from './data/courses';
import TopBar from './components/TopBar';
import CourseHub from './components/CourseHub';
import Trainer from './components/Trainer';
import SqlTrainer from './components/SqlTrainer';

export default function App() {
  const [activeCourseId, setActiveCourseId] = useState(null);

  const goHub = () => setActiveCourseId(null);
  const course = activeCourseId ? getCourse(activeCourseId) : null;

  return (
    <>
      <TopBar title="Exam Trainer" onTitleClick={goHub} />

      {!course && <CourseHub onSelect={setActiveCourseId} />}
      {course && course.kind === 'trainer' && <Trainer course={course} onBack={goHub} />}
      {course && course.kind === 'sql' && <SqlTrainer course={course} onBack={goHub} />}

      <footer className="site-footer">
        <div className="footer-inner">
          <span className="footer-name">Developed by <span>Alexander Sandoval</span></span>
          <span className="footer-divider">·</span>
          <span className="footer-org">
            Data Scientist ·{' '}
            <a href="https://datavisionary-consulting.github.io/" className="footer-link" target="_blank" rel="noopener">
              Data Visionary
            </a>
          </span>
        </div>
      </footer>
    </>
  );
}
