// Spaced-repetition scheduler. Ported verbatim from the legacy vanilla app
// (index.html) — do not change the constants, existing card progress data
// depends on this exact behavior.
export function sm2(card, rating) {
  if (rating < 3) {
    card.interval = 1;
    card.ease = Math.max(1.3, card.ease - 0.2);
  } else {
    if (card.interval === 0) card.interval = 1;
    else if (card.interval === 1) card.interval = 3;
    else card.interval = Math.round(card.interval * card.ease);
    card.ease = Math.max(1.3, card.ease + 0.1 * (rating - 5) * (-0.02 * (rating - 5) + 0.28));
  }
  card.due = Date.now() + card.interval * 86400000;
  card.seen = true;
}

export function newCard() {
  return { ease: 2.5, interval: 0, due: 0, seen: false, correct: 0, wrong: 0, favorite: false };
}
