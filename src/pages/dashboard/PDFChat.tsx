import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Loader2, X, ListTree, Sparkles } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ChatMessageBubble from '../../components/chat/ChatMessageBubble';
import ChatComposer from '../../components/chat/ChatComposer';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
import { extractPdfText } from '../../lib/pdfClient';

export default function PDFChat() {
  const { firebaseUser } = useAuth();
  const [fileName, setFileName] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [documentText, setDocumentText] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const extraInstructions = documentText
    ? `The user has uploaded a PDF document. Answer their questions using only the following document content. If the answer isn't in the document, say so clearly.\n\nDOCUMENT CONTENT:\n${documentText}`
    : undefined;

  const { messages, isStreaming, sendMessage, stopGeneration, regenerateLast, editMessage } = useChat(firebaseUser?.uid, [], null, undefined, {
    persist: false,
    extraInstructions,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('PDF must be under 20MB.');
      return;
    }
    setError('');
    setExtracting(true);
    try {
      const extracted = await extractPdfText(file);
      setDocumentText(extracted.truncatedForAI);
      setPageCount(extracted.pageCount);
      setFileName(file.name);
    } catch {
      setError('Could not read that PDF. It may be scanned or corrupted.');
    } finally {
      setExtracting(false);
    }
  };

  const reset = () => {
    setFileName(null);
    setDocumentText(null);
    setPageCount(0);
  };

  if (!fileName) {
    return (
      <DashboardLayout>
        <div className="section-pad max-w-xl mx-auto">
          <h1 className="font-display font-bold text-2xl text-paper mb-1">PDF Chat</h1>
          <p className="text-ink/50 text-sm mb-8">Upload a PDF and ask questions, get summaries, or pull out key facts.</p>

          <label
            className="glass rounded-xl2 border-2 border-dashed border-ink/10 hover:border-gold/30 transition-colors flex flex-col items-center justify-center py-16 cursor-pointer"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {extracting ? (
              <>
                <Loader2 size={28} className="animate-spin text-gold mb-4" />
                <p className="text-ink/50 text-sm">Reading your PDF...</p>
              </>
            ) : (
              <>
                <Upload size={28} className="text-gold mb-4" />
                <p className="text-paper text-sm font-medium mb-1">Click to upload a PDF</p>
                <p className="text-ink/30 text-xs">Up to 20MB</p>
              </>
            )}
          </label>
          {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-65px)] flex flex-col">
        <div className="px-4 md:px-8 py-4 border-b border-ink/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg glass flex items-center justify-center shrink-0">
              <FileText size={16} className="text-gold" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-paper truncate">{fileName}</p>
              <p className="text-xs text-ink/30">{pageCount} pages</p>
            </div>
          </div>
          <button onClick={reset} className="text-ink/40 hover:text-ink/70 p-2" aria-label="Remove PDF">
            <X size={18} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto section-pad !py-6 space-y-6">
          <div className="max-w-3xl mx-auto">
            {messages.length === 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <button onClick={() => sendMessage('Summarize this document in a few clear paragraphs.')} className="glass rounded-xl px-4 py-3 text-xs text-ink/60 text-left hover:border-gold/30 flex items-center gap-2">
                  <ListTree size={14} className="text-gold shrink-0" /> Summarize this document
                </button>
                <button onClick={() => sendMessage('What are the key takeaways or facts in this document?')} className="glass rounded-xl px-4 py-3 text-xs text-ink/60 text-left hover:border-gold/30 flex items-center gap-2">
                  <Sparkles size={14} className="text-gold shrink-0" /> Extract key facts
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((m, i) => (
                  <ChatMessageBubble
                    key={m.id}
                    message={m}
                    isLast={i === messages.length - 1}
                    isStreaming={isStreaming}
                    onRegenerate={regenerateLast}
                    onEdit={editMessage}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 md:px-8 pb-6 pt-2">
          <div className="max-w-3xl mx-auto">
            <ChatComposer onSend={sendMessage} onStop={stopGeneration} isStreaming={isStreaming} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
