// Shared merge rule for all 4 IELTS skills' { attempts, bestBandByLevel }
// progress shape. Attempts are append-only and timestamped, so two devices'
// histories are combined by union (deduped by date) rather than one
// replacing the other; bestBandByLevel keeps the higher band per level.
export function mergeIeltsProgress(local, cloud) {
  const attempts = { ...local.attempts };
  Object.entries(cloud.attempts || {}).forEach(([testId, cloudList]) => {
    const localList = attempts[testId] || [];
    const seenDates = new Set(localList.map((a) => a.date));
    const combined = [...localList, ...cloudList.filter((a) => !seenDates.has(a.date))];
    combined.sort((a, b) => new Date(a.date) - new Date(b.date));
    attempts[testId] = combined;
  });

  const bestBandByLevel = { ...local.bestBandByLevel };
  Object.entries(cloud.bestBandByLevel || {}).forEach(([level, band]) => {
    const current = bestBandByLevel[level];
    if (band !== null && band !== undefined && (current === null || current === undefined || band > current)) {
      bestBandByLevel[level] = band;
    }
  });

  return { attempts, bestBandByLevel };
}
