import { useCallback, useState } from 'react';

const KEY = 'vlab_progress_ielts-reading_v1';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read IELTS Reading progress:', err);
  }
  return { attempts: {}, bestBandByLevel: { B2: null, C1: null, C2: null } };
}

export function useIeltsProgress() {
  const [progress, setProgress] = useState(load);

  const save = useCallback((next) => {
    setProgress(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const recordAttempt = useCallback(
    (testId, level, { correctCount, totalCount, band }) => {
      const prevAttempts = progress.attempts[testId] || [];
      const nextAttempts = {
        ...progress.attempts,
        [testId]: [...prevAttempts, { date: new Date().toISOString(), correctCount, totalCount, band }],
      };
      const prevBest = progress.bestBandByLevel[level];
      const nextBest = prevBest === null || band > prevBest ? band : prevBest;
      save({
        attempts: nextAttempts,
        bestBandByLevel: { ...progress.bestBandByLevel, [level]: nextBest },
      });
    },
    [progress, save]
  );

  const resetProgress = useCallback(() => {
    save({ attempts: {}, bestBandByLevel: { B2: null, C1: null, C2: null } });
  }, [save]);

  return { progress, recordAttempt, resetProgress };
}
