import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Edit3, Eye, FilePlus2, ImagePlus, Save, Send, Trash2, X } from 'lucide-react';
import { Article } from '../types';
import { useAuth } from '../contexts/AuthContext';

type EditorState = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  readTimeMinutes: number;
  imageUrl: string;
  tags: string;
  language: 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml' | 'or';
  featured: boolean;
  published: boolean;
};

const initialEditor: EditorState = {
  title: '',
  excerpt: '',
  content: '',
  category: 'general',
  level: 'Beginner',
  readTimeMinutes: 5,
  imageUrl: '',
  tags: '',
  language: 'en',
  featured: false,
  published: false,
};

const categories = [
  { label: 'General', value: 'general' },
  { label: 'Crop Management', value: 'crop-management' },
  { label: 'Sustainable Farming', value: 'sustainable-farming' },
  { label: 'Government Schemes', value: 'government-schemes' },
  { label: 'Market Trends', value: 'market-trends' },
  { label: 'Livestock', value: 'livestock' },
];

export default function CreatorStudio() {
  const { token } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editor, setEditor] = useState<EditorState>(initialEditor);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    [token]
  );

  const loadArticles = async () => {
    if (!token) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/articles/admin/manage', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to load articles');
      setArticles(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load articles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [token]);

  const clearFlash = () => {
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 2400);
  };

  const resetForm = () => {
    setEditingId(null);
    setEditor(initialEditor);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  const runFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setEditor((prev) => ({ ...prev, content: editorRef.current?.innerHTML || '' }));
    }
  };

  const startEdit = async (id: string) => {
    if (!token) return;

    try {
      const res = await fetch(`/api/articles/admin/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to load article');
      const item = data.item as Article;
      setEditingId(item.id);
      setEditor({
        title: item.title,
        excerpt: item.excerpt,
        content: item.content || '',
        category: item.category,
        level: item.level || 'Beginner',
        readTimeMinutes: item.readTimeMinutes || 5,
        imageUrl: item.imageUrl,
        tags: item.tags?.join(', ') || '',
        language: item.language,
        featured: Boolean(item.featured),
        published: Boolean(item.published),
      });
      if (editorRef.current) {
        editorRef.current.innerHTML = item.content || '';
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load article');
      clearFlash();
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!token) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('cover', file);

    setIsUploading(true);
    try {
      const res = await fetch('/api/articles/upload-cover', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setEditor((prev) => ({ ...prev, imageUrl: data.imageUrl }));
      setSuccess('Cover image uploaded successfully.');
      clearFlash();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      clearFlash();
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const onSave = async () => {
    if (!token) return;

    const payload = {
      ...editor,
      tags: editor.tags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      content: editorRef.current?.innerHTML || editor.content,
    };

    setIsSaving(true);
    try {
      const url = editingId ? `/api/articles/${encodeURIComponent(editingId)}` : '/api/articles';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');

      setSuccess(editingId ? 'Article updated successfully.' : 'Article created successfully.');
      await loadArticles();
      resetForm();
      clearFlash();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      clearFlash();
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!token) return;
    const confirmDelete = window.confirm('Delete this article permanently?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      setSuccess('Article deleted.');
      await loadArticles();
      if (editingId === id) {
        resetForm();
      }
      clearFlash();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      clearFlash();
    }
  };

  const togglePublish = async (id: string, current: boolean) => {
    if (!token) return;

    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(id)}/publish`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ published: !current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Status update failed');
      setSuccess(!current ? 'Article published.' : 'Article moved to draft.');
      await loadArticles();
      clearFlash();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
      clearFlash();
    }
  };

  const filtered = articles.filter((item) => {
    const haystack = `${item.title} ${item.excerpt} ${item.category}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Creator Studio</h2>
            <p className="text-sm text-slate-600">Admin-only workspace to draft, publish, and manage Education Hub articles.</p>
          </div>
          <button
            onClick={resetForm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700"
          >
            <FilePlus2 size={16} /> New Article
          </button>
        </div>

        {error ? <div className="px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div> : null}
        {success ? <div className="px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">{success}</div> : null}

        <section className="bg-white rounded-xl border border-emerald-100 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Title</span>
              <input
                value={editor.title}
                onChange={(e) => setEditor((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Example: Modern Smart Irrigation Techniques"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Cover Image URL</span>
              <input
                value={editor.imageUrl}
                onChange={(e) => setEditor((prev) => ({ ...prev, imageUrl: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="/uploads/cover-image.jpg"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white cursor-pointer text-sm">
              <ImagePlus size={16} />
              {isUploading ? 'Uploading...' : 'Upload Cover'}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={isUploading} />
            </label>
          </div>

          <label className="space-y-1 text-sm block">
            <span className="font-medium text-slate-700">Excerpt</span>
            <textarea
              value={editor.excerpt}
              onChange={(e) => setEditor((prev) => ({ ...prev, excerpt: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 min-h-[84px]"
              placeholder="Write a concise summary for article cards and featured preview."
            />
          </label>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
            <label className="space-y-1 col-span-2">
              <span className="font-medium text-slate-700">Category</span>
              <select
                value={editor.category}
                onChange={(e) => setEditor((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              >
                {categories.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="font-medium text-slate-700">Level</span>
              <select
                value={editor.level}
                onChange={(e) => setEditor((prev) => ({ ...prev, level: e.target.value as EditorState['level'] }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="font-medium text-slate-700">Read Time</span>
              <input
                type="number"
                min={1}
                value={editor.readTimeMinutes}
                onChange={(e) => setEditor((prev) => ({ ...prev, readTimeMinutes: Number(e.target.value) || 1 }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>

            <label className="space-y-1">
              <span className="font-medium text-slate-700">Language</span>
              <select
                value={editor.language}
                onChange={(e) => setEditor((prev) => ({ ...prev, language: e.target.value as EditorState['language'] }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
                <option value="kn">Kannada</option>
                <option value="ml">Malayalam</option>
                <option value="or">Odia</option>
              </select>
            </label>

            <label className="space-y-1 col-span-2">
              <span className="font-medium text-slate-700">Tags (comma separated)</span>
              <input
                value={editor.tags}
                onChange={(e) => setEditor((prev) => ({ ...prev, tags: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="irrigation, soil, pest"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={editor.featured}
                onChange={(e) => setEditor((prev) => ({ ...prev, featured: e.target.checked }))}
              />
              Mark as featured
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={editor.published}
                onChange={(e) => setEditor((prev) => ({ ...prev, published: e.target.checked }))}
              />
              Publish now
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => runFormat('bold')} className="px-2 py-1 rounded border border-slate-200 text-sm">Bold</button>
              <button type="button" onClick={() => runFormat('italic')} className="px-2 py-1 rounded border border-slate-200 text-sm">Italic</button>
              <button type="button" onClick={() => runFormat('insertUnorderedList')} className="px-2 py-1 rounded border border-slate-200 text-sm">Bullet List</button>
              <button type="button" onClick={() => runFormat('formatBlock', 'p')} className="px-2 py-1 rounded border border-slate-200 text-sm">Paragraph</button>
            </div>

            <div
              ref={editorRef}
              contentEditable
              onInput={() => setEditor((prev) => ({ ...prev, content: editorRef.current?.innerHTML || '' }))}
              className="min-h-[220px] rounded-lg border border-slate-200 px-3 py-2 prose max-w-none focus:outline-none"
              suppressContentEditableWarning
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : editingId ? 'Update Article' : 'Create Article'}
            </button>
            {editingId ? (
              <button onClick={resetForm} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700">
                <X size={16} /> Cancel Edit
              </button>
            ) : null}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-emerald-100 p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">Your Articles</h3>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, excerpt, category"
              className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          {isLoading ? <p className="text-sm text-slate-500">Loading articles...</p> : null}

          {!isLoading && filtered.length === 0 ? (
            <div className="text-sm text-slate-500 border border-dashed border-slate-300 rounded-lg p-6 text-center">
              No articles found. Start by creating your first article.
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <article key={item.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 truncate">{item.title}</h4>
                    <p className="text-xs text-slate-500">{item.category} • {item.readTimeMinutes} min • {item.language.toUpperCase()}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.published ? 'Published' : 'Draft'}
                  </span>
                </div>

                <p className="text-sm text-slate-600 line-clamp-2">{item.excerpt}</p>

                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => startEdit(item.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-200 text-xs">
                    <Edit3 size={14} /> Edit
                  </button>
                  <button onClick={() => togglePublish(item.id, Boolean(item.published))} className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-200 text-xs">
                    <Send size={14} /> {item.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <a
                    href={`/api/articles/${item.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-200 text-xs"
                  >
                    <Eye size={14} /> API View
                  </a>
                  <button onClick={() => onDelete(item.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-red-200 text-red-600 text-xs">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
