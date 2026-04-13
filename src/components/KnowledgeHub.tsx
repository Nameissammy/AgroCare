import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, BookmarkCheck, Clock, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Article } from '../types';

interface KnowledgeHubProps {
  onOpenArticle: (slug: string) => void;
}

const categories = [
  { id: 'all', key: 'knowledge.category.all', fallback: 'All Topics' },
  { id: 'crop-management', key: 'knowledge.category.cropManagement', fallback: 'Crop Management' },
  { id: 'sustainable-farming', key: 'knowledge.category.sustainable', fallback: 'Sustainable Farming' },
  { id: 'government-schemes', key: 'knowledge.category.government', fallback: 'Government Schemes' },
  { id: 'market-trends', key: 'knowledge.category.marketTrends', fallback: 'Market Trends' },
  { id: 'livestock', key: 'knowledge.category.livestock', fallback: 'Livestock' },
  { id: 'general', key: 'knowledge.category.general', fallback: 'General' },
];

export default function KnowledgeHub({ onOpenArticle }: KnowledgeHubProps) {
  const { t, language } = useLanguage();
  const { token, user } = useAuth();
  const [items, setItems] = useState<Article[]>([]);
  const [featured, setFeatured] = useState<Article | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', '30');
    params.set('language', language);
    if (activeCategory !== 'all') {
      params.set('category', activeCategory);
    }
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim());
    }
    return params.toString();
  }, [activeCategory, language, searchTerm]);

  useEffect(() => {
    const loadArticles = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [listRes, featuredRes] = await Promise.all([
          fetch(`/api/articles?${query}`),
          fetch(`/api/articles/featured/latest?language=${encodeURIComponent(language)}`),
        ]);

        const listData = await listRes.json();
        if (!listRes.ok) {
          throw new Error(listData.message || 'Failed to fetch education content.');
        }
        setItems(listData.items || []);

        if (featuredRes.ok) {
          const featuredData = await featuredRes.json();
          setFeatured(featuredData.item || null);
        } else {
          setFeatured(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch education content.');
      } finally {
        setIsLoading(false);
      }
    };

    loadArticles();
  }, [language, query]);

  useEffect(() => {
    const loadBookmarks = async () => {
      if (!token) {
        setSavedIds(new Set());
        return;
      }

      try {
        const res = await fetch('/api/bookmarks', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const ids = new Set<string>((data.items || []).map((article: Article) => article.id));
        setSavedIds(ids);
      } catch {
        setSavedIds(new Set());
      }
    };

    loadBookmarks();
  }, [token]);

  const toggleBookmark = async (articleId: string) => {
    if (!token) return;

    const alreadySaved = savedIds.has(articleId);
    const method = alreadySaved ? 'DELETE' : 'POST';

    try {
      const res = await fetch(`/api/bookmarks/${encodeURIComponent(articleId)}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      setSavedIds((prev) => {
        const next = new Set(prev);
        if (alreadySaved) {
          next.delete(articleId);
        } else {
          next.add(articleId);
        }
        return next;
      });
    } catch {
      // no-op for non-blocking UX
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {featured ? (
          <section>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-2xl bg-slate-900 aspect-[21/9] flex flex-col justify-end p-8 group cursor-pointer"
              onClick={() => onOpenArticle(featured.slug)}
            >
              <div
                className="absolute inset-0 opacity-60 transition-transform duration-700 group-hover:scale-105 bg-cover bg-center"
                style={{ backgroundImage: `url('${featured.imageUrl}')` }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
              <div className="relative space-y-3 max-w-2xl">
                <div className="inline-block px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded">
                  {t('knowledge.featured.badge', 'Featured Topic')}
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">{featured.title}</h3>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">{featured.excerpt}</p>
                <div className="flex items-center gap-4 pt-2">
                  <button className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm transition-all">
                    {t('knowledge.featured.readGuide', 'Read Full Guide')}
                  </button>
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <Clock size={14} /> {featured.readTimeMinutes} min read
                  </span>
                </div>
              </div>
            </motion.div>
          </section>
        ) : null}

        <section className="flex flex-col gap-4 py-2">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search articles by title, topic, or tags"
              className="w-full rounded-full border border-emerald-200 bg-white pl-9 pr-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white border border-emerald-100 text-slate-600 hover:border-emerald-600'
                }`}
              >
                {t(cat.key, cat.fallback)}
              </button>
            ))}
          </div>
        </section>

        {error ? (
          <section className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </section>
        ) : null}

        {isLoading ? (
          <section className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading education articles...</section>
        ) : null}

        {!isLoading && !error && items.length === 0 ? (
          <section className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No published articles found for this filter.
          </section>
        ) : null}

        {!isLoading && items.length > 0 ? (
          <section className="space-y-4 pb-12">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-bold">Latest Education Articles</h4>
              {user ? <span className="text-xs text-slate-500">Bookmarks enabled</span> : <span className="text-xs text-slate-500">Login to bookmark articles</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((article) => (
                <article key={article.id} className="bg-white rounded-xl border border-emerald-50 overflow-hidden hover:shadow-lg transition-shadow">
                  <button className="block h-48 overflow-hidden w-full" onClick={() => onOpenArticle(article.slug)}>
                    <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                  </button>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        article.level === 'Beginner'
                          ? 'bg-emerald-100 text-emerald-700'
                          : article.level === 'Intermediate'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {article.level || 'Beginner'}
                      </span>
                      <span className="text-[10px] text-slate-400">{article.readTimeMinutes} min read</span>
                    </div>

                    <button onClick={() => onOpenArticle(article.slug)} className="font-bold text-left text-lg leading-tight hover:text-emerald-700">
                      {article.title}
                    </button>

                    <p className="text-slate-500 text-sm line-clamp-3">{article.excerpt}</p>

                    <div className="pt-2 flex items-center justify-between gap-3">
                      <button onClick={() => onOpenArticle(article.slug)} className="text-emerald-600 text-sm font-bold">Read More</button>
                      <button
                        onClick={() => toggleBookmark(article.id)}
                        disabled={!token}
                        className="text-slate-400 hover:text-emerald-600 disabled:opacity-40"
                        aria-label="Toggle bookmark"
                      >
                        {savedIds.has(article.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

