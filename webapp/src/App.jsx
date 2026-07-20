import { useState } from 'react';
import { getCourse } from './data/courses';
import TopBar from './components/TopBar';
import CourseHub from './components/CourseHub';
import Dashboard from './components/Dashboard';
import Trainer from './components/Trainer';
import SqlTrainer from './components/SqlTrainer';
import IeltsReadingTrainer from './components/IeltsReadingTrainer';
import IeltsListeningTrainer from './components/IeltsListeningTrainer';
import IeltsWritingTrainer from './components/IeltsWritingTrainer';
import IeltsSpeakingTrainer from './components/IeltsSpeakingTrainer';

const KIND_COMPONENT = {
  trainer: Trainer,
  sql: SqlTrainer,
  'ielts-reading': IeltsReadingTrainer,
  'ielts-listening': IeltsListeningTrainer,
  'ielts-writing': IeltsWritingTrainer,
  'ielts-speaking': IeltsSpeakingTrainer,
};

export default function App() {
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);

  const goHub = () => {
    setActiveCourseId(null);
    setShowDashboard(false);
  };
  const openDashboard = () => {
    setActiveCourseId(null);
    setShowDashboard(true);
  };
  const selectFromDashboard = (id) => {
    setShowDashboard(false);
    setActiveCourseId(id);
  };
  const course = activeCourseId ? getCourse(activeCourseId) : null;
  const CourseComponent = course && KIND_COMPONENT[course.kind];

  return (
    <>
      <TopBar title="Exam Trainer" onTitleClick={goHub} onDashboardClick={openDashboard} />

      {!course && !showDashboard && <CourseHub onSelect={setActiveCourseId} />}
      {!course && showDashboard && <Dashboard onSelect={selectFromDashboard} onBack={goHub} />}
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
