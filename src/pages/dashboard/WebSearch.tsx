import { useState, KeyboardEvent } from 'react';
import { Search, Loader2, ExternalLink, Globe } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import { searchWeb, SearchResult } from '../../lib/webSearch';
import { AIRequestError } from '../../lib/aiClient';

const examples = ['Latest AI news this week', 'Current weather in Mumbai', 'Who won the last T20 World Cup'];

export default function WebSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState('');

  const runSearch = async (q: string) => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await searchWeb(q.trim());
      setResult(res);
    } catch (err) {
      setError(err instanceof AIRequestError ? err.message : 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') runSearch(query);
  };

  return (
    <DashboardLayout>
      <div className="section-pad max-w-2xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-1">Web Search</h1>
        <p className="text-ink/50 text-sm mb-8">Ask anything current — MEV AI searches the live web and cites its sources.</p>

        <div className="relative mb-8">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search the web..."
            className="input-field pl-11 pr-28"
          />
          <button
            onClick={() => runSearch(query)}
            disabled={!query.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-gold text-xs py-2 px-4 disabled:opacity-50"
          >
            Search
          </button>
        </div>

        {!result && !loading && !error && (
          <div className="flex flex-wrap gap-2 mb-8">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setQuery(ex);
                  runSearch(ex);
                }}
                className="glass rounded-full px-4 py-2 text-xs text-ink/50 hover:text-gold hover:border-gold/30 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center py-16 text-ink/40">
            <Loader2 size={24} className="animate-spin text-gold mb-3" />
            <p className="text-sm">Searching the web...</p>
          </div>
        )}

        {error && (
          <GlassCard className="p-5 border-red-500/20">
            <p className="text-red-400 text-sm">{error}</p>
          </GlassCard>
        )}

        {result && (
          <div className="space-y-6">
            <GlassCard className="p-6">
              <p className="text-paper text-sm leading-relaxed whitespace-pre-wrap">{result.answer}</p>
            </GlassCard>

            {result.sources.length > 0 && (
              <div>
                <p className="text-ink/40 text-xs uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Globe size={13} /> Sources
                </p>
                <div className="space-y-2">
                  {result.sources.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 glass rounded-xl px-4 py-3 text-sm text-ink/60 hover:text-gold hover:border-gold/30 transition-colors"
                    >
                      <span className="truncate">{source.title}</span>
                      <ExternalLink size={14} className="shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
