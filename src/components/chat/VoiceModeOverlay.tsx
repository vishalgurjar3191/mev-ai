import { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff } from 'lucide-react';
import Logo from '../common/Logo';
import {
  createRecognizer,
  speak,
  stopSpeaking,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
} from '../../lib/voice';
import { ChatMessage } from '../../hooks/useChat';

type CallState = 'listening' | 'thinking' | 'speaking' | 'idle';

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
  sendMessage: (text: string) => void;
  preferredVoice?: string;
  language: string; // BCP-47, e.g. 'en-US'
  onClose: () => void;
}

/**
 * A hands-free, continuous voice conversation loop — speak, MEV AI replies out loud, then
 * automatically listens again — similar to ChatGPT/Gemini's voice mode. Closing it returns
 * to the normal typed chat; nothing said here is lost, it's still the same conversation.
 */
export default function VoiceModeOverlay({ messages, isStreaming, sendMessage, preferredVoice, language, onClose }: Props) {
  const [state, setState] = useState<CallState>('idle');
  const [muted, setMuted] = useState(false);
  const recognizerRef = useRef<ReturnType<typeof createRecognizer>>(null);
  const spokenIdsRef = useRef<Set<string>>(new Set());
  const activeRef = useRef(true);

  const supported = isSpeechRecognitionSupported() && isSpeechSynthesisSupported();

  const startListening = () => {
    if (!activeRef.current || muted) return;
    const recognizer = createRecognizer(language);
    if (!recognizer) return;
    recognizerRef.current = recognizer;
    let finalTranscript = '';
    recognizer.onresult = (event) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript = text;
      }
    };
    recognizer.onend = () => {
      if (finalTranscript.trim()) {
        setState('thinking');
        sendMessage(finalTranscript.trim());
      } else if (activeRef.current) {
        startListening(); // nothing heard — keep listening rather than going silent
      }
    };
    recognizer.onerror = () => {
      if (activeRef.current) setTimeout(startListening, 500);
    };
    setState('listening');
    recognizer.start();
  };

  // Speak new assistant replies as they complete, then resume listening.
  useEffect(() => {
    if (isStreaming) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant' || last.error || !last.content) return;
    if (spokenIdsRef.current.has(last.id)) return;
    spokenIdsRef.current.add(last.id);

    setState('speaking');
    void speak(
  last.content.replace(/[#*_`]/g, ''),
  preferredVoice,
  () => {
    if (activeRef.current) startListening();
  }
);
  }, [isStreaming, messages]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    activeRef.current = true;
    startListening();
    return () => {
      activeRef.current = false;
      recognizerRef.current?.stop();
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    activeRef.current = false;
    recognizerRef.current?.stop();
    stopSpeaking();
    onClose();
  };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      if (next) {
        recognizerRef.current?.stop();
      } else if (state !== 'speaking' && state !== 'thinking') {
        startListening();
      }
      return next;
    });
  };

  if (!supported) {
    return (
      <div className="fixed inset-0 z-[90] bg-obsidian/95 backdrop-blur-xl flex flex-col items-center justify-center px-8 text-center">
        <p className="text-paper text-sm mb-6">Voice mode needs speech support your browser doesn't have — try the latest Chrome.</p>
        <button onClick={onClose} className="btn-ghost">Close</button>
      </div>
    );
  }

  const stateLabel = { listening: 'Listening...', thinking: 'Thinking...', speaking: 'Speaking...', idle: 'Starting...' }[state];

  return (
    <div className="fixed inset-0 z-[90] bg-obsidian/97 backdrop-blur-xl flex flex-col items-center justify-center">
      <button onClick={handleClose} className="absolute top-6 right-6 w-10 h-10 rounded-full glass flex items-center justify-center text-ink/60 hover:text-paper" aria-label="Close voice mode">
        <X size={20} />
      </button>

      <div
        className={`w-40 h-40 rounded-full bg-gold-gradient shadow-gold-glow flex items-center justify-center transition-transform duration-500 ${
          state === 'listening' ? 'scale-105 animate-pulseGlow' : state === 'speaking' ? 'scale-110' : 'scale-100'
        }`}
      >
        <Logo size={56} withWordmark={false} />
      </div>

      <p className="text-ink/50 text-sm mt-8 tracking-wide">{stateLabel}</p>

      <button
        onClick={toggleMute}
        className={`mt-10 w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
          muted ? 'bg-red-500/20 text-red-400' : 'glass text-ink/70 hover:text-paper'
        }`}
        aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
      >
        {muted ? <MicOff size={22} /> : <Mic size={22} />}
      </button>
    </div>
  );
}
