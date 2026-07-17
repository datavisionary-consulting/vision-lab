import { useCallback, useState } from 'react';

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

export function useSqlProgress() {
  const [progress, setProgress] = useState(load);

  const save = useCallback((next) => {
    setProgress(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const resetProgress = useCallback(() => {
    save({ solved: {}, totalAnswered: 0, totalCorrect: 0 });
  }, [save]);

  return { progress, saveProgress: save, resetProgress };
}
