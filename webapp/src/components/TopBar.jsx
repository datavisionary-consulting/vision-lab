import { useEffect, useRef, useState } from 'react';
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

const PALETTE_KEY = 'vlab_palette_v1';

function PaletteToggle() {
  const [palette, setPalette] = useState(
    () => (document.documentElement.getAttribute('data-palette') === 'bronze' ? 'bronze' : 'classic')
  );

  const toggle = () => {
    const next = palette === 'bronze' ? 'classic' : 'bronze';
    if (next === 'classic') {
      document.documentElement.removeAttribute('data-palette');
    } else {
      document.documentElement.setAttribute('data-palette', next);
    }
    try {
      localStorage.setItem(PALETTE_KEY, next);
    } catch {
      /* ignore */
    }
    setPalette(next);
  };

  const nextLabel = palette === 'bronze' ? 'Classic' : 'Bronze';

  return (
    <button className="palette-toggle" onClick={toggle} title={`Switch to ${nextLabel} palette`} aria-label={`Switch to ${nextLabel} palette`}>
      <span className="palette-toggle-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="9" cy="9" r="5" />
          <circle cx="15" cy="15" r="5" />
        </svg>
      </span>
      <span className="palette-toggle-label">{palette === 'bronze' ? 'Bronze' : 'Classic'}</span>
    </button>
  );
}

function RankBadge({ rank, totalXp }) {
  if (!rank) return null;
  return (
    <div className="rank-badge" title={`${totalXp.toLocaleString()} XP${rank.next ? ` · ${rank.xpForNext - rank.xpIntoRank} XP to ${rank.next}` : ' · Max rank'}`}>
      <span className="rank-badge-icon" style={{ color: rank.color }} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="9" r="5" />
          <path d="M9 13.5L7 21l5-2.4L17 21l-2-7.5" />
        </svg>
      </span>
      <span className="rank-badge-name">{rank.name}</span>
      <span className="rank-badge-bar"><i style={{ width: `${rank.pct}%`, background: rank.color }} /></span>
    </div>
  );
}

export default function TopBar({ title, onTitleClick, onDashboardClick, rank, totalXp }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const actionsRef = useRef(null);
  const menuBtnRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onOutside = (e) => {
      if (actionsRef.current?.contains(e.target)) return;
      if (menuBtnRef.current?.contains(e.target)) return;
      setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <div className="top-bar">
      <div className="top-bar-title" onClick={onTitleClick}>{title}</div>
      <div
        ref={actionsRef}
        className={`topbar-actions${menuOpen ? ' mobile-open' : ''}`}
        onClickCapture={() => setMenuOpen(false)}
      >
        <RankBadge rank={rank} totalXp={totalXp} />
        <button className="dashboard-btn" onClick={onDashboardClick} title="Your journey" aria-label="Your journey">
          <span className="dashboard-btn-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 18V13M12 18V8M19 18V5" /></svg>
          </span>
          <span className="dashboard-btn-label">Journey</span>
        </button>
        <SaveProgressButton />
        <AuthButton />
        <PaletteToggle />
        <FullscreenButton />
      </div>
      <button
        ref={menuBtnRef}
        className="topbar-menu-btn"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="More options"
        aria-expanded={menuOpen}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
    </div>
  );
}
