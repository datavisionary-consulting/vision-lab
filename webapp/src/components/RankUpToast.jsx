import { useEffect } from 'react';

export default function RankUpToast({ rankName, onDone }) {
  useEffect(() => {
    if (!rankName) return;
    const t = setTimeout(onDone, 4200);
    return () => clearTimeout(t);
  }, [rankName, onDone]);

  if (!rankName) return null;

  return (
    <div className="rank-up-toast" role="status">
      <span className="rank-up-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="9" r="5" />
          <path d="M9 13.5L7 21l5-2.4L17 21l-2-7.5" />
        </svg>
      </span>
      <div>
        <b>Rank Up</b>
        <span>Promoted to {rankName}</span>
      </div>
    </div>
  );
}
