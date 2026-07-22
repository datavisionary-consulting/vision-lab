import { useEffect, useState } from 'react';
import AuthButton from './AuthButton';
import { useAuth } from '../context/AuthContext';
import { saveAllProgress } from '../lib/saveAllProgress';

function SaveProgressButton() {
  const { user } = useAuth();
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error

  if (!user) return null;

  const handleSave = async () => {
    if (status === 'saving') return;
    setStatus('saving');
    try {
      await saveAllProgress(user.uid);
      setStatus('saved');
    } catch (err) {
      console.error('Save Progress failed:', err);
      setStatus('error');
    } finally {
      setTimeout(() => setStatus('idle'), 2200);
    }
  };

  const label = { idle: '💾 Save Progress', saving: '⏳ Saving…', saved: '✓ Saved', error: '✗ Save failed' }[status];

  return (
    <button
      className={`save-progress-btn ${status}`}
      onClick={handleSave}
      disabled={status === 'saving'}
      title="Push your progress on this device to the cloud right now"
    >
      {label}
    </button>
  );
}

function FullscreenButton() {
  const [isFs, setIsFs] = useState(!!document.fullscreenElement);

  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.error('Fullscreen request failed:', err));
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <button className="fullscreen-btn" onClick={toggle} title={isFs ? 'Exit fullscreen' : 'Toggle fullscreen'} aria-label="Toggle fullscreen">
      {isFs ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      )}
    </button>
  );
}

export default function TopBar({ title, onTitleClick, onDashboardClick }) {
  return (
    <div className="top-bar">
      <div className="top-bar-title" onClick={onTitleClick}>{title}</div>
      <button className="dashboard-btn" onClick={onDashboardClick} title="Your progress" aria-label="Your progress">
        📊<span className="dashboard-btn-label">Progress</span>
      </button>
      <SaveProgressButton />
      <AuthButton />
      <FullscreenButton />
    </div>
  );
}
