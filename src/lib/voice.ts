/**
 * This file handles speech INPUT (mic capture via the Web Speech API's SpeechRecognition)
 * and re-exports a thin speech OUTPUT layer. Speech output itself is handled entirely by
 * lib/ttsClient.ts using ElevenLabs — we deliberately removed the old browser-TTS fallback
 * voices because they sounded robotic no matter how much we tuned them. If ElevenLabs isn't
 * configured, speak() throws the same clear error speakSavedVoice() throws, so the caller
 * can tell the user to set it up rather than silently falling back to a robotic voice.
 */

import { speakSavedVoice, stopSpeaking as stopRealisticVoicePlayback } from './ttsClient';

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Feature-detects the browser's native speech synthesis API. We don't use it to actually
 * speak (see the note above — realistic voices only, via ElevenLabs), but callers such as
 * VoiceModeOverlay use this to know whether the underlying platform has any speech-output
 * capability at all before deciding what UI/state to show.
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
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
 * Speaks a reply aloud using the user's saved ElevenLabs voice (delegates to
 * speakSavedVoice() in ttsClient.ts). Throws the same friendly errors speakSavedVoice()
 * throws (no key configured, no voice picked, request failed) — callers should catch and
 * surface those to the user.
 */
export async function speak(text: string, preferredVoiceJson: string | undefined, onEnd?: () => void): Promise<void> {
  await speakSavedVoice(text, preferredVoiceJson, onEnd);
}

/** Stops whatever ElevenLabs reply is currently being read aloud. */
export function stopSpeaking(): void {
  stopRealisticVoicePlayback();
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
