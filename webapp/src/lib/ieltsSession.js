import { gradeAnswer } from './ieltsGrading';

export function filterByLevel(tests, level) {
  if (!level || level === 'all') return tests;
  return tests.filter((t) => t.level === level);
}

export function buildAttempt(test) {
  const questions = test.passages.flatMap((p) =>
    p.questions.map((q) => ({ ...q, passageId: p.id, passageTitle: p.title }))
  );
  return {
    testId: test.id,
    timeLimitMin: test.timeLimitMin,
    questions,
  };
}

export function scoreAttempt(questions, answers) {
  const byPassage = {};
  let correctCount = 0;

  for (const q of questions) {
    const isCorrect = gradeAnswer(q, answers[q.id]);
    if (isCorrect) correctCount++;
    if (!byPassage[q.passageId]) byPassage[q.passageId] = { correct: 0, total: 0 };
    byPassage[q.passageId].total++;
    if (isCorrect) byPassage[q.passageId].correct++;
  }

  return { correctCount, totalCount: questions.length, byPassage };
}

// Standard, publicly published Academic Reading raw-score (out of 40) to
// band-score conversion. Approximate/unofficial — actual IELTS band
// boundaries vary slightly test-to-test.
const BAND_TABLE_40 = [
  { min: 39, band: 9 },
  { min: 37, band: 8.5 },
  { min: 35, band: 8 },
  { min: 33, band: 7.5 },
  { min: 30, band: 7 },
  { min: 27, band: 6.5 },
  { min: 23, band: 6 },
  { min: 19, band: 5.5 },
  { min: 15, band: 5 },
  { min: 13, band: 4.5 },
  { min: 10, band: 4 },
  { min: 8, band: 3.5 },
  { min: 6, band: 3 },
  { min: 4, band: 2.5 },
  { min: 0, band: 2 },
];

export function rawScoreToBand(correctCount, totalCount) {
  if (!totalCount) return 0;
  const scaledTo40 = Math.round((correctCount / totalCount) * 40);
  const entry = BAND_TABLE_40.find((e) => scaledTo40 >= e.min);
  return entry ? entry.band : 0;
}
