import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bookmark, BookmarkCheck, Clock, Tag } from 'lucide-react';
import { Article } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface ArticleDetailProps {
  slug: string;
  onBack: () => void;
}

export default function ArticleDetail({ slug, onBack }: ArticleDetailProps) {
  const { token } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const cleanContent = useMemo(() => {
    if (!article?.content) return '';
    return article.content;
  }, [article?.content]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/articles/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Unable to load article');
        setArticle(data.item);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load article');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [slug]);

  useEffect(() => {
    const syncBookmarks = async () => {
      if (!token || !article?.id) {
        setIsSaved(false);
        return;
      }

      try {
        const res = await fetch('/api/bookmarks', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const ids = new Set((data.items || []).map((item: Article) => item.id));
        setIsSaved(ids.has(article.id));
      } catch {
        setIsSaved(false);
      }
    };

    syncBookmarks();
  }, [token, article?.id]);

  const toggleBookmark = async () => {
    if (!token || !article?.id) return;

    try {
      const endpoint = `/api/bookmarks/${encodeURIComponent(article.id)}`;
      const method = isSaved ? 'DELETE' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update bookmark');
      }
      setIsSaved((prev) => !prev);
    } catch {
      // no-op to keep view stable
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-emerald-700 font-medium mb-6">
          <ArrowLeft size={16} /> Back to Education Hub
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">Loading article...</div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-emerald-700 font-medium mb-6">
          <ArrowLeft size={16} /> Back to Education Hub
        </button>
        <div className="bg-white rounded-xl border border-red-100 p-10 text-center text-red-600">{error || 'Article not found.'}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-emerald-700 font-medium">
        <ArrowLeft size={16} /> Back to Education Hub
      </button>

      <article className="bg-white rounded-2xl border border-emerald-100 overflow-hidden">
        <img src={article.imageUrl} alt={article.title} className="w-full h-72 object-cover" />

        <div className="p-6 md:p-8 space-y-5">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
            <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">{article.category}</span>
            <span className="inline-flex items-center gap-1 text-slate-500"><Clock size={14} /> {article.readTimeMinutes} min read</span>
            <span className="inline-flex items-center gap-1 text-slate-500"><Tag size={14} /> {article.level || 'Beginner'}</span>
            {article.authorName ? <span className="text-slate-500">By {article.authorName}</span> : null}
          </div>

          <h1 className="text-3xl font-bold text-slate-900 leading-tight">{article.title}</h1>
          <p className="text-slate-600 leading-relaxed">{article.excerpt}</p>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleBookmark}
              disabled={!token}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 disabled:opacity-50"
            >
              {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              {isSaved ? 'Saved' : token ? 'Save Article' : 'Login to Save'}
            </button>
          </div>

          <div
            className="prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: cleanContent }}
          />
        </div>
      </article>
    </div>
  );
}
