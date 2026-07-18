function normalizeText(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?]$/, '');
}

export function gradeAnswer(q, userAnswer) {
  switch (q.type) {
    case 'multiple-choice':
    case 'matching-headings':
    case 'matching-information':
      return normalizeText(userAnswer) === normalizeText(q.correctAnswer);

    case 'multiple-select': {
      const norm = (arr) => (arr || []).map((v) => normalizeText(v)).sort();
      return JSON.stringify(norm(userAnswer)) === JSON.stringify(norm(q.correctAnswer));
    }

    case 'true-false-notgiven':
    case 'yes-no-notgiven':
      return normalizeText(userAnswer) === normalizeText(q.correctAnswer);

    case 'sentence-completion':
    case 'short-answer': {
      const accepted = (q.acceptableAnswers && q.acceptableAnswers.length ? q.acceptableAnswers : [q.correctAnswer]).map(normalizeText);
      return accepted.includes(normalizeText(userAnswer));
    }

    default:
      return false;
  }
}
