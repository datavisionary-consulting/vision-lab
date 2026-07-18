import { gradeAnswer } from './ieltsGrading';

export { rawScoreToBand, filterByLevel } from './ieltsSession';

export function buildAttempt(test) {
  const questions = test.sections.flatMap((s) =>
    s.questions.map((q) => ({ ...q, sectionId: s.id, sectionTitle: s.title }))
  );
  return {
    testId: test.id,
    timeLimitMin: test.timeLimitMin,
    questions,
  };
}

export function scoreAttempt(questions, answers) {
  const bySection = {};
  let correctCount = 0;

  for (const q of questions) {
    const isCorrect = gradeAnswer(q, answers[q.id]);
    if (isCorrect) correctCount++;
    if (!bySection[q.sectionId]) bySection[q.sectionId] = { correct: 0, total: 0 };
    bySection[q.sectionId].total++;
    if (isCorrect) bySection[q.sectionId].correct++;
  }

  return { correctCount, totalCount: questions.length, bySection };
}
