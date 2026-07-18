/**
 * Browser built-in speech synthesis (used in lib/voice.ts) is free but sounds robotic — that's
 * a hard ceiling of the Web Speech API, not something we can tune away. For a genuinely
 * realistic, human-sounding voice, MEV AI can optionally use ElevenLabs' text-to-speech API,
 * which has a free tier (10,000 characters/month at the time of writing) and sounds close to
 * a real person.
 *
 * This is entirely optional: if the person hasn't added an API key, the app just falls back
 * to the browser voice profiles in lib/voice.ts.
 */

export interface RealisticVoice {
  id: string;
  label: string;
  gender: 'male' | 'female';
  elevenLabsVoiceId: string;
}

// ElevenLabs' well-known default premade voices — stable IDs, good general-purpose quality.
export const REALISTIC_VOICES: RealisticVoice[] = [
  { id: 'r-f1', label: 'Rachel — warm, clear', gender: 'female', elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM' },
  { id: 'r-f2', label: 'Bella — soft, friendly', gender: 'female', elevenLabsVoiceId: 'EXAVITQu4vr4xnSDxMaL' },
  { id: 'r-f3', label: 'Elli', gender: 'female', elevenLabsVoiceId: 'MF3mGyEYCl7XYWbV9V6O' },
  { id: 'r-m1', label: 'Adam — deep, confident', gender: 'male', elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB' },
  { id: 'r-m2', label: 'Antoni — smooth, casual', gender: 'male', elevenLabsVoiceId: 'ErXwobaYiN019PkySvjV' },
  { id: 'r-m3', label: 'Josh', gender: 'male', elevenLabsVoiceId: 'TxGEqnHWrfWFTfGW9XjX' },
];

/**
 * Fetches the realistic ElevenLabs audio for a message and triggers a browser download as .mp3.
 * Throws if no key is configured or the request fails, so the caller can show a clear message.
 */
export async function downloadRealisticAudio(text: string, elevenLabsVoiceId: string, filename: string): Promise<void> {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('No ElevenLabs API key configured.');

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (response.status === 401) throw new Error('ElevenLabs API key is invalid.');
  if (response.status === 429) throw new Error('ElevenLabs free quota used up for this month.');
  if (!response.ok) throw new Error(`ElevenLabs request failed (${response.status}).`);

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.mp3') ? filename : `${filename}.mp3`;
  a.click();
  URL.revokeObjectURL(url);
}

export function hasElevenLabsKey(): boolean {
  return !!import.meta.env.VITE_ELEVENLABS_API_KEY;
}

let currentAudio: HTMLAudioElement | null = null;

export function stopRealisticSpeech(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

/**
 * Speaks text using ElevenLabs. Throws a friendly Error on failure (missing key, quota
 * exceeded, network issue) so the caller can fall back to browser TTS.
 */
export async function speakRealistic(text: string, elevenLabsVoiceId: string, onEnd?: () => void): Promise<void> {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('No ElevenLabs API key configured.');

  stopRealisticSpeech();

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (response.status === 401) throw new Error('ElevenLabs API key is invalid.');
  if (response.status === 429) throw new Error('ElevenLabs free quota used up for this month.');
  if (!response.ok) throw new Error(`ElevenLabs request failed (${response.status}).`);

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;
  audio.onended = () => {
    URL.revokeObjectURL(url);
    if (currentAudio === audio) currentAudio = null;
    onEnd?.();
  };
  audio.onerror = () => {
    URL.revokeObjectURL(url);
    if (currentAudio === audio) currentAudio = null;
    onEnd?.();
  };
  await audio.play();
}
