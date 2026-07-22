import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFirestoreSync } from './useFirestoreSync';

const KEY = 'vlab_progress_sql_v1';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read SQL progress:', err);
  }
  return { solved: {}, totalAnswered: 0, totalCorrect: 0 };
}

// Solved problems only ever accumulate, so merging is a simple union; the
// running totals use whichever device has answered more (same Math.max
// approximation the spaced-repetition courses use for these counters).
function mergeSql(local, cloud) {
  return {
    solved: { ...local.solved, ...(cloud.solved || {}) },
    totalAnswered: Math.max(local.totalAnswered || 0, cloud.totalAnswered || 0),
    totalCorrect: Math.max(local.totalCorrect || 0, cloud.totalCorrect || 0),
  };
}

export function useSqlProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(load);
  const { writeThrough } = useFirestoreSync({ user, courseId: 'sql', storageKey: KEY, setState: setProgress, mergeFn: mergeSql });

  const save = useCallback(
    (next) => {
      setProgress(next);
      localStorage.setItem(KEY, JSON.stringify(next));
      writeThrough(next);
    },
    [writeThrough]
  );

  const resetProgress = useCallback(() => {
    save({ solved: {}, totalAnswered: 0, totalCorrect: 0 });
  }, [save]);

  return { progress, saveProgress: save, resetProgress };
}
