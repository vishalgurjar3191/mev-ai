import { useEffect, useState } from 'react';
import { Sparkles, Download, Trash2, Loader2, ImageIcon } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { buildImageUrl, downloadImage } from '../../lib/imageClient';
import { ImageRecord, saveImageRecord, listImages, deleteImageRecord } from '../../lib/imageStore';

export default function ImageGenerator() {
  const { firebaseUser } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [history, setHistory] = useState<ImageRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    listImages(firebaseUser.uid)
      .then(setHistory)
      .finally(() => setLoadingHistory(false));
  }, [firebaseUser]);

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    const seed = Math.floor(Math.random() * 1_000_000);
    const url = buildImageUrl(prompt, seed);

    // Pollinations generates on-demand — preload so we only show it once it's actually ready.
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
    });

    setCurrent(url);
    setGenerating(false);

    if (firebaseUser) {
      await saveImageRecord(firebaseUser.uid, prompt.trim(), url);
      setHistory((prev) => [{ id: crypto.randomUUID(), uid: firebaseUser.uid, prompt: prompt.trim(), url, createdAt: Date.now() }, ...prev]);
    }
  };

  const handleDelete = async (record: ImageRecord) => {
    await deleteImageRecord(record.id);
    setHistory((prev) => prev.filter((r) => r.id !== record.id));
  };

  return (
    <DashboardLayout>
      <div className="section-pad max-w-4xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-1">Image Generator</h1>
        <p className="text-ink/50 text-sm mb-8">Describe what you want to see, and MEV AI will create it.</p>

        <GlassCard strong className="p-5 mb-10">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="A neon-lit cyberpunk city at night, cinematic, 4k..."
              className="input-field flex-1"
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || generating}
              className="btn-gold flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>

          {(current || generating) && (
            <div className="mt-6 flex justify-center">
              <div className="relative w-full max-w-md aspect-square rounded-xl2 overflow-hidden glass">
                {generating ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 size={28} className="animate-spin text-gold" />
                  </div>
                ) : (
                  current && (
                    <>
                      <img src={current} alt={prompt} className="w-full h-full object-cover" />
                      <button
                        onClick={() => downloadImage(current, `mev-ai-${Date.now()}.jpg`)}
                        className="absolute bottom-3 right-3 glass rounded-full px-3 py-2 text-xs flex items-center gap-1.5 hover:text-gold"
                      >
                        <Download size={13} /> Download
                      </button>
                    </>
                  )
                )}
              </div>
            </div>
          )}
        </GlassCard>

        <h2 className="font-display font-semibold text-lg text-paper mb-4">History</h2>
        {loadingHistory ? (
          <div className="flex justify-center py-10 text-ink/30"><Loader2 className="animate-spin" size={20} /></div>
        ) : history.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <ImageIcon size={24} className="text-ink/20 mx-auto mb-3" />
            <p className="text-ink/40 text-sm">No images yet — generate your first one above.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {history.map((record) => (
              <div key={record.id} className="relative group rounded-xl overflow-hidden glass aspect-square">
                <img src={record.url} alt={record.prompt} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-ink/80 text-xs line-clamp-2 mb-2">{record.prompt}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadImage(record.url, `mev-ai-${record.id}.jpg`)}
                      className="glass rounded-lg p-1.5 hover:text-gold"
                      aria-label="Download"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(record)}
                      className="glass rounded-lg p-1.5 hover:text-red-400"
                      aria-label="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
