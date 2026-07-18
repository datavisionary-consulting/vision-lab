import { useState } from 'react';
import { getCourse } from './data/courses';
import TopBar from './components/TopBar';
import CourseHub from './components/CourseHub';
import Trainer from './components/Trainer';
import SqlTrainer from './components/SqlTrainer';
import IeltsReadingTrainer from './components/IeltsReadingTrainer';

const KIND_COMPONENT = {
  trainer: Trainer,
  sql: SqlTrainer,
  'ielts-reading': IeltsReadingTrainer,
};

export default function App() {
  const [activeCourseId, setActiveCourseId] = useState(null);

  const goHub = () => setActiveCourseId(null);
  const course = activeCourseId ? getCourse(activeCourseId) : null;
  const CourseComponent = course && KIND_COMPONENT[course.kind];

  return (
    <>
      <TopBar title="Exam Trainer" onTitleClick={goHub} />

      {!course && <CourseHub onSelect={setActiveCourseId} />}
      {CourseComponent && <CourseComponent course={course} onBack={goHub} />}

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
