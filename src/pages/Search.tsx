import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface SearchResult {
  id: number;
  title: string;
  author: string;
  category_id: number;
  replies_count: number;
  views_count: number;
  created_at: string;
  snippet?: string;
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.forum.search(q.trim());
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setQuery(q); doSearch(q); }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchParams({ q: query.trim() });
    doSearch(query.trim());
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Icon name="Search" size={24} className="text-primary" />
        <h1 className="text-2xl font-black">Поиск по форуму</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Поиск тем и сообщений..."
            className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
            autoFocus
          />
        </div>
        <button type="submit" className="btn-primary flex items-center gap-2">
          <Icon name="Search" size={18} />
          Найти
        </button>
      </form>

      {loading && (
        <div className="text-center py-8">
          <Icon name="Loader2" size={32} className="mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground mt-2">Ищем...</p>
        </div>
      )}

      {!loading && searched && (
        <div>
          <div className="text-sm text-muted-foreground mb-3">
            {results.length > 0 ? `Найдено: ${results.length} результатов` : 'Ничего не найдено'}
          </div>
          <div className="space-y-2">
            {results.map(r => (
              <Link key={r.id} to={`/topics/${r.id}`} className="forum-card p-4 block">
                <div className="font-semibold text-foreground hover:text-primary transition-colors">{r.title}</div>
                {r.snippet && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.snippet}</p>}
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                  <span>от <span className="text-primary">{r.author}</span></span>
                  <span className="flex items-center gap-1"><Icon name="MessageCircle" size={11} />{r.replies_count}</span>
                  <span className="flex items-center gap-1"><Icon name="Eye" size={11} />{r.views_count}</span>
                  <span>{r.created_at}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!searched && (
        <div className="forum-card p-10 text-center text-muted-foreground">
          <Icon name="Search" size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg">Введите запрос для поиска по форуму</p>
          <p className="text-sm mt-1">Поиск ведётся по названиям и содержимому тем</p>
        </div>
      )}
    </div>
  );
}
