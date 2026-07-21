import { useState, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { Send, Square, Paperclip, Mic, MicOff, Globe, ImageIcon, X, FileText } from 'lucide-react';
import { extractPdfText } from '../../lib/pdfClient';
import { createRecognizer, isSpeechRecognitionSupported } from '../../lib/voice';
import { PendingAttachment, SendOptions } from '../../hooks/useChat';

interface Props {
  onSend: (text: string, opts?: SendOptions) => void;
  onStop: () => void;
  isStreaming: boolean;
}

// Catches common ways people ask for an image without pressing the toggle first —
// both English and Hinglish phrasing. Deliberately conservative to avoid false positives
// on genuine questions like "what is in this image" (handled separately via attachments).
const IMAGE_REQUEST_PATTERN =
  /\b(generate|create|draw|make|banao|banade|bana do|bhejo|de do|chahiye)\b.{0,25}\b(image|photo|picture|tasveer|pic)\b|\b(image|photo|picture|tasveer|pic)\b.{0,25}\b(banao|banade|bhejo|generate|create|draw)\b/i;

function looksLikeImageRequest(text: string): boolean {
  return IMAGE_REQUEST_PATTERN.test(text);
}

export default function ChatComposer({ onSend, onStop, isStreaming }: Props) {
  const [value, setValue] = useState('');
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [imageGen, setImageGen] = useState(false);
  const [listening, setListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognizerRef = useRef<ReturnType<typeof createRecognizer>>(null);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleSend = () => {
    if ((!value.trim() && !attachment) || isStreaming) return;
    const autoImageGen = !attachment && !webSearch && !imageGen && looksLikeImageRequest(value);
    onSend(value, { attachment: attachment ?? undefined, webSearch, imageGen: imageGen || autoImageGen });
    setValue('');
    setAttachment(null);
    setWebSearch(false);
    setImageGen(false);
    requestAnimationFrame(autoResize);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAttaching(true);
    try {
      if (file.type === 'application/pdf') {
        const extracted = await extractPdfText(file);
        setAttachment({ kind: 'pdf', name: file.name, text: extracted.truncatedForAI });
      } else if (file.type.startsWith('image/')) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        setAttachment({ kind: 'image', name: file.name, dataUrl });
      }
    } finally {
      setAttaching(false);
    }
  };

  const toggleMic = () => {
    if (!isSpeechRecognitionSupported()) {
      alert("This browser doesn't support voice input. Try the latest Chrome.");
      return;
    }
    if (listening) {
      recognizerRef.current?.stop();
      setListening(false);
      return;
    }
    const recognizer = createRecognizer('en-US');
    if (!recognizer) return;
    recognizerRef.current = recognizer;
    let finalText = value;
    recognizer.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        interim += event.results[i][0].transcript;
      }
      setValue((finalText ? finalText + ' ' : '') + interim);
    };
    recognizer.onend = () => {
      setListening(false);
      requestAnimationFrame(autoResize);
    };
    recognizer.onerror = () => setListening(false);
    setListening(true);
    recognizer.start();
  };

  return (
    <div className="glass-strong rounded-3xl p-2.5 shadow-premium">
      {attachment && (
        <div className="flex items-center gap-2 mb-2 px-2">
          <div className="flex items-center gap-2 glass rounded-lg px-3 py-1.5 text-xs text-ink/70">
            {attachment.kind === 'pdf' ? <FileText size={13} /> : <ImageIcon size={13} />}
            <span className="max-w-[160px] truncate">{attachment.name}</span>
            <button onClick={() => setAttachment(null)} aria-label="Remove attachment">
              <X size={13} className="text-ink/40 hover:text-ink/70" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={attaching}
          className="shrink-0 w-10 h-10 rounded-xl glass flex items-center justify-center text-ink/50 hover:text-paper disabled:opacity-40"
          aria-label="Attach image or PDF"
          title="Attach image or PDF"
        >
          <Paperclip size={17} />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            autoResize();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Message MEV AI..."
          rows={1}
          className="flex-1 bg-transparent outline-none resize-none text-sm text-paper placeholder-ink/30 px-1 py-2.5 max-h-[200px]"
        />

        <button
          onClick={toggleMic}
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            listening ? 'bg-red-500/20 text-red-400' : 'glass text-ink/50 hover:text-paper'
          }`}
          aria-label="Voice input"
        >
          {listening ? <MicOff size={17} /> : <Mic size={17} />}
        </button>

        {isStreaming ? (
          <button
            onClick={onStop}
            className="shrink-0 w-10 h-10 rounded-xl bg-ink/10 hover:bg-ink/20 flex items-center justify-center"
            aria-label="Stop generation"
          >
            <Square size={15} className="fill-current text-paper" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={(!value.trim() && !attachment) || attaching}
            className="shrink-0 w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center disabled:opacity-30"
            aria-label="Send message"
          >
            <Send size={15} className="text-on-accent" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 px-1">
        <button
          onClick={() => {
            setWebSearch(!webSearch);
            if (!webSearch) setImageGen(false);
          }}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
            webSearch ? 'bg-gold text-on-accent font-medium' : 'glass text-ink/40 hover:text-ink/70'
          }`}
        >
          <Globe size={12} /> Web Search
        </button>
        <button
          onClick={() => {
            setImageGen(!imageGen);
            if (!imageGen) setWebSearch(false);
          }}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
            imageGen ? 'bg-gold text-on-accent font-medium' : 'glass text-ink/40 hover:text-ink/70'
          }`}
        >
          <ImageIcon size={12} /> Generate Image
        </button>
      </div>
    </div>
  );
}
