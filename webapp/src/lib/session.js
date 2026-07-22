// Generic session-building logic. Ported from the legacy vanilla app's
// iaBuildSession/sparkBuildSession (byte-for-byte identical there) —
// generalized to operate on any question[] + cards map, unchanged algorithm.

export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dedup(a) {
  return [...new Map(a.map((q) => [q.id, q])).values()];
}

export function filterByTopic(questions, topic) {
  if (!topic || topic === 'all') return questions;
  return questions.filter((q) => q.topic === topic || (q.topics && q.topics.includes(topic)));
}

// mode: 'smart' | 'new' | 'review' | 'random' | 'favorites'
export function buildSession(pool, cards, mode, count) {
  const now = Date.now();
  const N = Math.min(count, pool.length);

  if (mode === 'random') return shuffle([...pool]).slice(0, N);

  if (mode === 'favorites') {
    const favs = pool.filter((q) => cards[q.id]?.favorite);
    const f = shuffle([...favs]).slice(0, N);
    return f.length ? f : null;
  }

  const due = pool.filter((q) => cards[q.id].seen && cards[q.id].due <= now);
  const unseen = pool.filter((q) => !cards[q.id].seen);
  const hard = pool.filter((q) => cards[q.id].seen && cards[q.id].wrong > cards[q.id].correct);

  if (mode === 'new') {
    let s = shuffle([...unseen]).slice(0, N);
    if (s.length < N) s = s.concat(shuffle([...due]).slice(0, N - s.length));
    return s;
  }

  if (mode === 'review') {
    const r = dedup([...shuffle(due), ...shuffle(hard)]).slice(0, N);
    return r.length ? r : null;
  }

  // smart (default): 60% new, 40% due/hard, backfilled from the rest of the pool
  const nN = Math.ceil(N * 0.6);
  const nR = N - nN;
  let c = dedup([...shuffle(unseen).slice(0, nN), ...dedup([...shuffle(due), ...shuffle(hard)]).slice(0, nR)]);
  if (c.length < N) {
    const rest = pool.filter((q) => !c.find((x) => x.id === q.id));
    c = c.concat(shuffle(rest).slice(0, N - c.length));
  }
  return shuffle(c).slice(0, N);
}
