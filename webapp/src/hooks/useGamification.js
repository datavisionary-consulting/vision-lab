import { useEffect, useState } from 'react';
import { COURSES } from '../data/courses';
import { xpForCourse, rankForXp } from '../lib/gamification';

const LAST_RANK_KEY = 'vlab_last_rank_v1';

function readLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore malformed/legacy data */
  }
  return null;
}

function computeTotalXp() {
  let total = 0;
  for (const course of COURSES) {
    total += xpForCourse(course, readLocal(course.storageKey));
  }
  return total;
}

// Polls localStorage rather than hooking into every progress-saving path —
// progress data across 20 courses lives in independently-evolving hooks
// (trainer/SQL/4x IELTS), and XP here is a derived display value, not a
// source of truth, so a cheap periodic re-read is far lower-risk than
// threading an event through each of them.
export function useGamification() {
  const [totalXp, setTotalXp] = useState(computeTotalXp);
  const [justRankedUp, setJustRankedUp] = useState(null);

  useEffect(() => {
    const refresh = () => setTotalXp(computeTotalXp());
    refresh();
    const interval = setInterval(refresh, 4000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const rank = rankForXp(totalXp);

  useEffect(() => {
    const lastRank = localStorage.getItem(LAST_RANK_KEY);
    if (lastRank && lastRank !== rank.name) {
      setJustRankedUp(rank.name);
    }
    if (lastRank !== rank.name) {
      localStorage.setItem(LAST_RANK_KEY, rank.name);
    }
  }, [rank.name]);

  const clearRankUp = () => setJustRankedUp(null);

  return { totalXp, rank, justRankedUp, clearRankUp };
}
