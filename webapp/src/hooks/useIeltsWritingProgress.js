import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFirestoreSync } from './useFirestoreSync';
import { mergeIeltsProgress } from '../lib/mergeIeltsProgress';

const KEY = 'vlab_progress_ielts-writing_v1';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read IELTS Writing progress:', err);
  }
  return { attempts: {}, bestBandByLevel: { B2: null, C1: null, C2: null } };
}

export function useIeltsWritingProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(load);
  const { writeThrough } = useFirestoreSync({ user, courseId: 'ielts-writing', storageKey: KEY, setState: setProgress, mergeFn: mergeIeltsProgress });

  const save = useCallback(
    (next) => {
      setProgress(next);
      localStorage.setItem(KEY, JSON.stringify(next));
      writeThrough(next);
    },
    [writeThrough]
  );

  const recordAttempt = useCallback(
    (testId, level, { task1WordCount, task1Band, task2WordCount, task2Band, overallBand }) => {
      const prevAttempts = progress.attempts[testId] || [];
      const nextAttempts = {
        ...progress.attempts,
        [testId]: [
          ...prevAttempts,
          { date: new Date().toISOString(), task1WordCount, task1Band, task2WordCount, task2Band, overallBand },
        ],
      };
      const prevBest = progress.bestBandByLevel[level];
      const nextBest = prevBest === null || overallBand > prevBest ? overallBand : prevBest;
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
