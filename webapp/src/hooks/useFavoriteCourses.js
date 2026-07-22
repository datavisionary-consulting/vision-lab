import { useCallback, useState } from 'react';

const KEY = 'vlab_favorite_courses_v1';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read favorite courses:', err);
  }
  return [];
}

// Which courses the user has manually flagged as "practice more" — distinct
// from the Dashboard's automatic "Needs Attention" detection (due cards,
// low accuracy). Local-only by design, same as the rest of the app's UI
// preferences; not synced to Firestore.
export function useFavoriteCourses() {
  const [favorites, setFavorites] = useState(load);

  const toggleFavorite = useCallback((courseId) => {
    setFavorites((prev) => {
      const next = prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((courseId) => favorites.includes(courseId), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
