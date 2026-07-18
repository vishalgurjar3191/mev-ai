export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function createRecognizer(lang: string): SpeechRecognition | null {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;
  const recognizer = new Ctor();
  recognizer.lang = lang;
  recognizer.continuous = false;
  recognizer.interimResults = true;
  return recognizer;
}

/**
 * The browser loads its voice list asynchronously, so a plain getVoices() call right after
 * page load often returns an empty array. This waits for the 'voiceschanged' event too.
 */
export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) return resolve([]);
    const existing = window.speechSynthesis.getVoices();
    if (existing.length) return resolve(existing);
    const handler = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    // Fallback in case the event never fires on this browser.
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
  });
}

const FEMALE_HINTS = ['female', 'zira', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'veena', 'salli', 'joanna', 'kendra', 'susan', 'heera', 'aria'];
const MALE_HINTS = ['male', 'david', 'george', 'daniel', 'fred', 'alex', 'james', 'ravi', 'rishi', 'matthew', 'guy'];

export type VoiceGender = 'male' | 'female' | 'unknown';

export function guessVoiceGender(voice: SpeechSynthesisVoice): VoiceGender {
  const name = voice.name.toLowerCase();
  if (FEMALE_HINTS.some((h) => name.includes(h))) return 'female';
  if (MALE_HINTS.some((h) => name.includes(h))) return 'male';
  return 'unknown';
}

export interface VoiceProfile {
  id: string;
  label: string;
  gender: 'male' | 'female';
  /** Preferred underlying system voice, if a genuinely different one exists on this device. */
  voiceURI?: string;
  pitch: number;
  rate: number;
  /** If set, this profile should be spoken via the ElevenLabs realistic engine instead. */
  elevenLabsVoiceId?: string;
}

/**
 * IMPORTANT REALITY CHECK: most Android phones ship with only ONE real installed voice per
 * language (usually via "Google Speech Services"), regardless of how many locale variants show
 * up in the list (e.g. "English India", "English Nigeria" are often the exact same underlying
 * voice, just different accents/languages routed through it). Because of that we can't always
 * offer 6 genuinely different-sounding system voices.
 *
 * To still give 3 clearly male-leaning and 3 clearly female-leaning options that are audibly
 * different from each other, we pick the best real voice(s) we can find per gender, and layer
 * distinct pitch/rate on top — lower+slower reads as male, higher+brisker reads as female. This
 * is a workaround for a real hardware/OS limitation, not a fake "6 voices" claim.
 */
export async function getVoiceProfiles(): Promise<{ female: VoiceProfile[]; male: VoiceProfile[]; singleVoiceDevice: boolean }> {
  const voices = await getAvailableVoices();
  const englishFirst = [...voices].sort((a, b) => {
    const aEn = a.lang.startsWith('en') ? 0 : 1;
    const bEn = b.lang.startsWith('en') ? 0 : 1;
    return aEn - bEn;
  });

  const femaleVoices = englishFirst.filter((v) => guessVoiceGender(v) === 'female');
  const maleVoices = englishFirst.filter((v) => guessVoiceGender(v) === 'male');
  const fallbackVoice = englishFirst[0];

  const bestFemale = femaleVoices[0] ?? fallbackVoice;
  const bestMale = maleVoices[0] ?? fallbackVoice;
  const singleVoiceDevice = englishFirst.length <= 1 || (!femaleVoices.length && !maleVoices.length);

  const female: VoiceProfile[] = [
    { id: 'f1', label: 'Warm', gender: 'female', voiceURI: bestFemale?.voiceURI, pitch: 1.12, rate: 0.98 },
    { id: 'f2', label: 'Bright', gender: 'female', voiceURI: bestFemale?.voiceURI, pitch: 1.24, rate: 1.05 },
    { id: 'f3', label: 'Calm', gender: 'female', voiceURI: bestFemale?.voiceURI, pitch: 1.05, rate: 0.9 },
  ];
  const male: VoiceProfile[] = [
    { id: 'm1', label: 'Deep', gender: 'male', voiceURI: bestMale?.voiceURI, pitch: 0.78, rate: 0.94 },
    { id: 'm2', label: 'Casual', gender: 'male', voiceURI: bestMale?.voiceURI, pitch: 0.88, rate: 1.0 },
    { id: 'm3', label: 'Confident', gender: 'male', voiceURI: bestMale?.voiceURI, pitch: 0.82, rate: 0.9 },
  ];

  return { female, male, singleVoiceDevice };
}

interface SpeakOptions {
  voiceURI?: string;
  rate?: number;
  pitch?: number;
}

export async function speak(text: string, lang: string, onEnd?: () => void, options?: SpeakOptions): Promise<void> {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  // Slightly slower than default and a touch of pitch variation reads as more natural/human
  // than the flat robotic default of rate=1, pitch=1.
  utterance.rate = options?.rate ?? 0.96;
  utterance.pitch = options?.pitch ?? 1.02;
  if (options?.voiceURI) {
    const voices = await getAvailableVoices();
    const match = voices.find((v) => v.voiceURI === options.voiceURI);
    if (match) utterance.voice = match;
  }
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

/** Speak using a saved VoiceProfile (JSON string from settings), falling back to defaults. */
export function speakWithProfile(text: string, lang: string, profileJson: string | undefined, onEnd?: () => void): void {
  let opts: SpeakOptions = {};
  let elevenLabsVoiceId: string | undefined;
  if (profileJson) {
    try {
      const p = JSON.parse(profileJson) as VoiceProfile;
      opts = { voiceURI: p.voiceURI, pitch: p.pitch, rate: p.rate };
      elevenLabsVoiceId = p.elevenLabsVoiceId;
    } catch {
      // ignore malformed stored value, use defaults
    }
  }

  if (elevenLabsVoiceId) {
    import('./ttsClient').then(({ speakRealistic }) => {
      speakRealistic(text, elevenLabsVoiceId!, onEnd).catch(() => {
        // Realistic engine failed (bad key, quota, offline) — fall back to browser TTS so
        // the person still hears something instead of silence.
        void speak(text, lang, onEnd, opts);
      });
    });
    return;
  }

  void speak(text, lang, onEnd, opts);
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
  import('./ttsClient').then(({ stopRealisticSpeech }) => stopRealisticSpeech());
}

export const VOICE_LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'fr-FR', label: 'French' },
  { code: 'de-DE', label: 'German' },
  { code: 'ja-JP', label: 'Japanese' },
];
