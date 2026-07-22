// XP and Rank are derived, read-only projections over each course's existing
// localStorage progress record — never a new source of truth, so they can't
// desync from or corrupt the underlying spaced-repetition / SQL / IELTS data.

export const RANKS = [
  { name: 'Recruit', minXp: 0, color: 'var(--rank-recruit)' },
  { name: 'Cadet', minXp: 400, color: 'var(--rank-cadet)' },
  { name: 'Operative', minXp: 1200, color: 'var(--rank-operative)' },
  { name: 'Specialist', minXp: 2800, color: 'var(--rank-specialist)' },
  { name: 'Veteran', minXp: 5500, color: 'var(--rank-veteran)' },
  { name: 'Elite', minXp: 10000, color: 'var(--rank-elite)' },
  { name: 'Master', minXp: 17000, color: 'var(--rank-master)' },
  { name: 'Legend', minXp: 28000, color: 'var(--rank-legend)' },
];

function trainerXp(data) {
  const totalCorrect = data?.totalCorrect || 0;
  const totalAnswered = data?.totalAnswered || 0;
  const wrong = Math.max(0, totalAnswered - totalCorrect);
  return totalCorrect * 8 + wrong * 2;
}

function sqlXp(data) {
  const solved = data?.solved ? Object.keys(data.solved).length : 0;
  const totalAnswered = data?.totalAnswered || 0;
  return solved * 40 + totalAnswered * 2;
}

function ieltsXp(data) {
  const attempts = data?.attempts || {};
  let xp = 0;
  Object.values(attempts).forEach((arr) => {
    (arr || []).forEach((a) => { xp += Math.round((a.band || 0) * 12); });
  });
  return xp;
}

export function xpForCourse(course, data) {
  if (course.kind === 'trainer') return trainerXp(data);
  if (course.kind === 'sql') return sqlXp(data);
  return ieltsXp(data);
}

export function rankForXp(xp) {
  let current = RANKS[0];
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].minXp) {
      current = RANKS[i];
      index = i;
    }
  }
  const next = RANKS[index + 1] || null;
  const xpIntoRank = xp - current.minXp;
  const xpForNext = next ? next.minXp - current.minXp : 0;
  const pct = next ? Math.min(100, Math.round((xpIntoRank / xpForNext) * 100)) : 100;
  return { name: current.name, index, xp, next: next?.name || null, xpIntoRank, xpForNext, pct, color: current.color };
}
