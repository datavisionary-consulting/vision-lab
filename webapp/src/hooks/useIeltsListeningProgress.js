import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFirestoreSync } from './useFirestoreSync';
import { mergeIeltsProgress } from '../lib/mergeIeltsProgress';

const KEY = 'vlab_progress_ielts-listening_v1';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read IELTS Listening progress:', err);
  }
  return { attempts: {}, bestBandByLevel: { B2: null, C1: null, C2: null } };
}

export function useIeltsListeningProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(load);
  const { writeThrough } = useFirestoreSync({ user, courseId: 'ielts-listening', storageKey: KEY, setState: setProgress, mergeFn: mergeIeltsProgress });

  const save = useCallback(
    (next) => {
      setProgress(next);
      localStorage.setItem(KEY, JSON.stringify(next));
      writeThrough(next);
    },
    [writeThrough]
  );

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
