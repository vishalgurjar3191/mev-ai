import { useState, useEffect, memo, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check, Pencil, RotateCcw, User, AlertCircle, Volume2, VolumeX, Download, Loader2 } from 'lucide-react';
import Logo from '../common/Logo';
import { ChatMessage } from '../../hooks/useChat';
import { stopSpeaking, downloadRealisticAudio, speakSavedVoice } from '../../lib/ttsClient';
import { useAuth } from '../../context/AuthContext';

interface CodeBlockProps {
  className?: string;
  children?: ReactNode;
}

function CodeBlock({ className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const language = /language-(\w+)/.exec(className ?? '')?.[1] ?? 'text';
  const code = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-ink/10">
      <div className="flex items-center justify-between bg-ink/[0.04] px-4 py-2 text-xs text-ink/40">
        <span className="uppercase tracking-wide">{language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 hover:text-gold transition-colors">
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="!m-0 !rounded-none overflow-x-auto text-sm">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

interface Props {
  message: ChatMessage;
  isLast: boolean;
  isStreaming: boolean;
  onRegenerate: () => void;
  onEdit: (id: string, content: string) => void;
}

function ChatMessageBubbleBase({ message, isLast, isStreaming, onRegenerate, onEdit }: Props) {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [speaking, setSpeaking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSpeakToggle = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speakSavedVoice(message.content, profile?.preferredVoice, () => setSpeaking(false)).catch((err) => {
      setSpeaking(false);
      alert((err as Error).message);
    });
  };

  const handleDownloadMp3 = async () => {
    let elevenLabsVoiceId: string | undefined;
    try {
      const parsed = profile?.preferredVoice ? JSON.parse(profile.preferredVoice) : null;
      elevenLabsVoiceId = parsed?.elevenLabsVoiceId;
    } catch {
      // ignore malformed profile
    }
    if (!elevenLabsVoiceId) {
      alert('MP3 download needs the Realistic Voice (ElevenLabs) set up in Settings — browser voices can\'t be exported as audio files.');
      return;
    }
    setDownloading(true);
    try {
      await downloadRealisticAudio(message.content, elevenLabsVoiceId, `mev-ai-reply-${message.id}`);
    } catch (err) {
      alert((err as Error).message || 'Could not download audio.');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (speaking) stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitEdit = () => {
    if (draft.trim() && draft.trim() !== message.content) {
      onEdit(message.id, draft.trim());
    }
    setEditing(false);
  };

  const renderContent = () => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        code({ className, children, ...props }) {
          const isBlock = /language-/.test(className ?? '');
          if (isBlock) {
            return <CodeBlock className={className}>{children}</CodeBlock>;
          }
          return (
            <code className="bg-ink/10 px-1.5 py-0.5 rounded text-gold text-[0.85em]" {...props}>
              {children}
            </code>
          );
        },
        p: ({ children }) => <p className="mb-2 last:mb-0 text-paper/90">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1 text-paper/90">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-paper/90">{children}</ol>,
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noreferrer" className="text-gold hover:underline">
            {children}
          </a>
        ),
      }}
    >
      {message.content}
    </ReactMarkdown>
  );

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'w-full'}`}>
      <div className="shrink-0 mt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full glass flex items-center justify-center">
            <User size={15} className="text-ink/60" />
          </div>
        ) : (
          <Logo size={28} withWordmark={false} />
        )}
      </div>

      <div className={`group flex flex-col ${isUser ? 'max-w-[80%] items-end' : 'flex-1 min-w-0 items-start'}`}>
        {editing ? (
          <div className="w-full">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="input-field text-sm min-h-[80px] resize-y"
              autoFocus
            />
            <div className="flex gap-2 mt-2 justify-end">
              <button onClick={() => setEditing(false)} className="btn-ghost text-xs py-1.5 px-4">Cancel</button>
              <button onClick={submitEdit} className="btn-gold text-xs py-1.5 px-4">Save &amp; Resend</button>
            </div>
          </div>
        ) : isUser ? (
          <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed glass-strong border-gold/10">
            <div className="prose-chat">{renderContent()}</div>
          </div>
        ) : (
          <div
            className={`text-sm leading-relaxed w-full ${message.error ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl px-4 py-3' : ''}`}
          >
            {message.error && (
              <div className="flex items-center gap-2 mb-1 text-red-400 text-xs font-medium">
                <AlertCircle size={13} /> Error
              </div>
            )}
            {message.content ? <div className="prose-chat">{renderContent()}</div> : isLast && isStreaming && <TypingDots />}
          </div>
        )}

        {!editing && message.content && (
          <div className="flex items-center gap-3 mt-1.5 px-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button onClick={handleCopy} className="text-ink/60 hover:text-gold text-xs flex items-center gap-1 bg-ink/[0.06] hover:bg-ink/[0.1] rounded-full px-2.5 py-1 transition-colors">
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
            {isUser && (
              <button onClick={() => setEditing(true)} className="text-ink/60 hover:text-gold text-xs flex items-center gap-1 bg-ink/[0.06] hover:bg-ink/[0.1] rounded-full px-2.5 py-1 transition-colors">
                <Pencil size={12} />
              </button>
            )}
            {!isUser && (
              <button onClick={handleSpeakToggle} className="text-ink/60 hover:text-gold text-xs flex items-center gap-1 bg-ink/[0.06] hover:bg-ink/[0.1] rounded-full px-2.5 py-1 transition-colors">
                {speaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                {speaking ? 'Stop' : 'Listen'}
              </button>
            )}
            {!isUser && (
              <button
                onClick={handleDownloadMp3}
                disabled={downloading}
                className="text-ink/60 hover:text-gold text-xs flex items-center gap-1 bg-ink/[0.06] hover:bg-ink/[0.1] rounded-full px-2.5 py-1 transition-colors disabled:opacity-50"
              >
                {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                MP3
              </button>
            )}
            {!isUser && isLast && !isStreaming && (
              <button onClick={onRegenerate} className="text-ink/60 hover:text-gold text-xs flex items-center gap-1 bg-ink/[0.06] hover:bg-ink/[0.1] rounded-full px-2.5 py-1 transition-colors">
                <RotateCcw size={12} /> Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1.5 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-bounce" />
    </div>
  );
}

export default memo(ChatMessageBubbleBase);
