import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
import { createRecognizer, speakWithProfile, stopSpeaking, isSpeechRecognitionSupported, isSpeechSynthesisSupported, VOICE_LANGUAGES } from '../../lib/voice';

export default function VoiceChat() {
  const { firebaseUser, profile } = useAuth();
  const [lang, setLang] = useState('en-US');
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognizerRef = useRef<SpeechRecognition | null>(null);

  const { messages, isStreaming, sendMessage } = useChat(firebaseUser?.uid, [], null, undefined, { persist: false });

  const supported = isSpeechRecognitionSupported() && isSpeechSynthesisSupported();

  // Speak the assistant's reply once it finishes streaming.
  const lastMessage = messages[messages.length - 1];
  useEffect(() => {
    if (!speakEnabled) return;
    if (lastMessage?.role === 'assistant' && !isStreaming && lastMessage.content && !lastMessage.error) {
      setIsSpeaking(true);
      speakWithProfile(lastMessage.content, lang, profile?.preferredVoice, () => setIsSpeaking(false));
    }
  }, [isStreaming]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMicToggle = () => {
    if (listening) {
      recognizerRef.current?.stop();
      setListening(false);
      return;
    }

    const recognizer = createRecognizer(lang);
    if (!recognizer) return;
    recognizerRef.current = recognizer;

    recognizer.onresult = (event) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };
    recognizer.onend = () => {
      setListening(false);
      setTranscript((current) => {
        if (current.trim()) sendMessage(current.trim());
        return '';
      });
    };
    recognizer.onerror = () => setListening(false);

    stopSpeaking();
    setListening(true);
    recognizer.start();
  };

  if (!supported) {
    return (
      <DashboardLayout>
        <div className="section-pad max-w-lg mx-auto text-center">
          <AlertCircle size={28} className="text-gold mx-auto mb-4" />
          <h1 className="font-display font-bold text-xl text-paper mb-2">Voice not supported here</h1>
          <p className="text-ink/50 text-sm">
            Your browser doesn't support the Web Speech API. Try the latest Chrome or Edge on desktop or Android.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="section-pad max-w-2xl mx-auto flex flex-col items-center">
        <h1 className="font-display font-bold text-2xl text-paper mb-1">Voice Chat</h1>
        <p className="text-ink/50 text-sm mb-8 text-center">Tap the mic, speak naturally, and hear MEV AI reply.</p>

        <div className="flex items-center gap-3 mb-10">
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="input-field text-sm w-auto">
            {VOICE_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-obsidian">{l.label}</option>
            ))}
          </select>
          <button
            onClick={() => setSpeakEnabled(!speakEnabled)}
            className={`w-10 h-10 rounded-xl glass flex items-center justify-center ${speakEnabled ? 'text-gold' : 'text-ink/30'}`}
            aria-label="Toggle voice output"
          >
            {speakEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
        </div>

        <button
          onClick={handleMicToggle}
          disabled={isStreaming}
          className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 ${
            listening ? 'bg-red-500/20 border-2 border-red-500 animate-pulseGlow' : 'bg-gold-gradient shadow-gold-glow'
          }`}
        >
          {listening ? <MicOff size={32} className="text-red-400" /> : <Mic size={32} className="text-on-accent" />}
        </button>

        <p className="text-ink/40 text-sm mt-6 min-h-[20px]">
          {listening ? transcript || 'Listening...' : isStreaming ? 'Thinking...' : isSpeaking ? 'Speaking...' : 'Tap to speak'}
        </p>

        {lastMessage && (
          <GlassCard className="w-full mt-10 p-6">
            <p className="text-ink/40 text-xs uppercase tracking-wide mb-2">
              {lastMessage.role === 'user' ? 'You said' : 'MEV AI replied'}
            </p>
            <p className="text-paper text-sm leading-relaxed whitespace-pre-wrap">{lastMessage.content}</p>
          </GlassCard>
        )}
      </div>
    </DashboardLayout>
  );
}
