// Opens a new tab with a search query built from the full question, and
// copies the same text to the clipboard as a bonus. Deliberately NOT an
// inline panel — that variant was tried and the client reverted it.
export function researchQuestion(text) {
  const query = encodeURIComponent(text);
  window.open('https://www.google.com/search?q=' + query, '_blank');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch((err) => console.error('Clipboard write failed:', err));
  }
}

export function questionResearchText(q) {
  const options = Object.entries(q.options)
    .map(([k, v]) => `${k}) ${v}`)
    .join('\n');
  return `Question: ${q.question}\n\nOptions:\n${options}\n\nCorrect answer: ${q.correct}) ${q.options[q.correct]}`;
}
