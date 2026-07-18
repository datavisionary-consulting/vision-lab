// Web Speech API voices don't expose a gender field, only a name (e.g.
// "Microsoft Zira - English (United States)", "Google UK English Male",
// "Samantha"). This guesses gender from known naming conventions used by
// Windows/macOS/iOS/Android/Chrome TTS engines so dialogue can be matched
// to a voice that actually fits the speaker (e.g. a male caller named
// "Michael" shouldn't be read by a female-sounding voice).

const FEMALE_NAMES = [
  'zira', 'aria', 'jenny', 'sonia', 'samantha', 'karen', 'moira', 'tessa',
  'susan', 'catherine', 'hazel', 'michelle', 'emma', 'amy', 'joanna', 'salli',
  'kimberly', 'kendra', 'ivy', 'victoria', 'allison', 'ava', 'zoe', 'libby',
  'olivia', 'natasha', 'sara', 'linda', 'heera', 'raveena', 'veena', 'kate',
  'serena', 'fiona', 'moira', 'tessa', 'lucia', 'paulina', 'elsa', 'nora',
];

const MALE_NAMES = [
  'david', 'mark', 'guy', 'ryan', 'james', 'daniel', 'alex', 'fred', 'oliver',
  'thomas', 'george', 'lee', 'eric', 'matthew', 'brian', 'justin', 'kevin',
  'gordon', 'liam', 'aaron', 'nathan', 'russell', 'sean', 'callum', 'ravi',
  'diego', 'jorge', 'carlos', 'miguel', 'henry', 'arthur', 'rishi',
];

export function guessVoiceGender(voice) {
  if (!voice?.name) return null;
  const name = voice.name.toLowerCase();
  if (/\bfemale\b/.test(name)) return 'female';
  if (/\bmale\b/.test(name)) return 'male';
  if (FEMALE_NAMES.some((n) => name.includes(n))) return 'female';
  if (MALE_NAMES.some((n) => name.includes(n))) return 'male';
  return null;
}
