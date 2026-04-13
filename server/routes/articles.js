import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import multer from 'multer';
import Article from '../models/Article.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    return cb(new Error('Only image files are allowed'));
  },
});

const ensureDbReady = (res) => {
  if (mongoose.connection?.readyState !== 1) {
    res.status(503).json({ message: 'Database not connected. Please try again shortly.' });
    return false;
  }
  return true;
};

const parseBool = (value) => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
};

const slugify = (raw = '') =>
  raw
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

const uniqueSlug = async (title, excludeId) => {
  const base = slugify(title) || `article-${Date.now()}`;
  let attempt = base;
  let counter = 1;
  while (true) {
    const existing = await Article.findOne({ slug: attempt, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).select('_id');
    if (!existing) return attempt;
    counter += 1;
    attempt = `${base}-${counter}`;
  }
};

const toListItem = (doc) => ({
  id: doc._id.toString(),
  title: doc.title,
  slug: doc.slug,
  excerpt: doc.excerpt,
  category: doc.category,
  level: doc.level,
  readTimeMinutes: doc.readTimeMinutes,
  imageUrl: doc.imageUrl,
  tags: doc.tags,
  language: doc.language,
  featured: doc.featured,
  published: doc.published,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  authorName: doc.author?.name || 'Admin',
});

router.get('/', async (req, res) => {
  if (!ensureDbReady(res)) return;

  try {
    const {
      category,
      language,
      search,
      featured,
      page = '1',
      limit = '12',
    } = req.query;

    const query = { published: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (language) {
      query.language = language;
    }

    const featuredValue = parseBool(featured);
    if (typeof featuredValue === 'boolean') {
      query.featured = featuredValue;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const safeSearch = search.trim();
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { excerpt: { $regex: safeSearch, $options: 'i' } },
        { tags: { $elemMatch: { $regex: safeSearch, $options: 'i' } } },
      ];
    }

    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 12));

    const [items, total] = await Promise.all([
      Article.find(query)
        .sort({ featured: -1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('author', 'name'),
      Article.countDocuments(query),
    ]);

    return res.json({
      items: items.map(toListItem),
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    });
  } catch (err) {
    console.error('[articles] list failed:', err);
    return res.status(500).json({ message: 'Failed to fetch articles.' });
  }
});

router.get('/featured/latest', async (req, res) => {
  if (!ensureDbReady(res)) return;

  try {
    const language = typeof req.query.language === 'string' ? req.query.language : undefined;
    const query = { published: true, featured: true };
    if (language) {
      query.language = language;
    }

    let article = await Article.findOne(query).sort({ updatedAt: -1 }).populate('author', 'name');
    if (!article) {
      article = await Article.findOne({ published: true, ...(language ? { language } : {}) })
        .sort({ updatedAt: -1 })
        .populate('author', 'name');
    }

    if (!article) {
      return res.status(404).json({ message: 'No article available.' });
    }

    return res.json({ item: toListItem(article) });
  } catch (err) {
    console.error('[articles] featured failed:', err);
    return res.status(500).json({ message: 'Failed to fetch featured article.' });
  }
});

router.get('/admin/manage', requireAuth, requireAdmin, async (_req, res) => {
  if (!ensureDbReady(res)) return;

  try {
    const items = await Article.find({}).sort({ updatedAt: -1 }).populate('author', 'name');
    return res.json({ items: items.map(toListItem) });
  } catch (err) {
    console.error('[articles] admin list failed:', err);
    return res.status(500).json({ message: 'Failed to fetch admin articles.' });
  }
});

router.get('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
  if (!ensureDbReady(res)) return;

  try {
    const article = await Article.findById(req.params.id).populate('author', 'name');
    if (!article) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    return res.json({
      item: {
        ...toListItem(article),
        content: article.content,
      },
    });
  } catch (err) {
    console.error('[articles] admin get failed:', err);
    return res.status(500).json({ message: 'Failed to fetch article.' });
  }
});

router.post('/upload-cover', requireAuth, requireAdmin, (req, res) => {
  if (!ensureDbReady(res)) return;

  upload.single('cover')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Failed to upload image.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    return res.status(201).json({ imageUrl: `/uploads/${req.file.filename}` });
  });
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  if (!ensureDbReady(res)) return;

  try {
    const {
      title,
      excerpt,
      content,
      category,
      level,
      readTimeMinutes,
      imageUrl,
      tags,
      language,
      featured,
      published,
    } = req.body || {};

    if (!title || !excerpt || !content || !category || !imageUrl) {
      return res.status(400).json({ message: 'Title, excerpt, content, category, and imageUrl are required.' });
    }

    const article = await Article.create({
      title: title.trim(),
      slug: await uniqueSlug(title),
      excerpt: excerpt.trim(),
      content: content.trim(),
      category,
      level: level || 'Beginner',
      readTimeMinutes: Number.parseInt(readTimeMinutes, 10) || 5,
      imageUrl: imageUrl.trim(),
      tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
      language: language || 'en',
      featured: Boolean(featured),
      published: Boolean(published),
      author: req.user.id,
    });

    return res.status(201).json({ item: toListItem(article) });
  } catch (err) {
    console.error('[articles] create failed:', err);
    return res.status(400).json({ message: err.message || 'Failed to create article.' });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  if (!ensureDbReady(res)) return;

  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    const updatableFields = [
      'title',
      'excerpt',
      'content',
      'category',
      'level',
      'readTimeMinutes',
      'imageUrl',
      'tags',
      'language',
      'featured',
      'published',
    ];

    for (const field of updatableFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        article[field] = req.body[field];
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'title') && req.body.title) {
      article.slug = await uniqueSlug(req.body.title, article._id);
    }

    if (!article.title || !article.excerpt || !article.content || !article.category || !article.imageUrl) {
      return res.status(400).json({ message: 'Title, excerpt, content, category, and imageUrl are required.' });
    }

    await article.save();
    const populated = await Article.findById(article._id).populate('author', 'name');
    return res.json({ item: toListItem(populated) });
  } catch (err) {
    console.error('[articles] update failed:', err);
    return res.status(400).json({ message: err.message || 'Failed to update article.' });
  }
});

router.patch('/:id/publish', requireAuth, requireAdmin, async (req, res) => {
  if (!ensureDbReady(res)) return;

  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    if (typeof req.body?.published !== 'boolean') {
      return res.status(400).json({ message: 'published must be a boolean value.' });
    }

    article.published = req.body.published;
    await article.save();
    return res.json({ item: toListItem(article) });
  } catch (err) {
    console.error('[articles] publish failed:', err);
    return res.status(400).json({ message: 'Failed to change publish status.' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  if (!ensureDbReady(res)) return;

  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found.' });
    }
    return res.json({ message: 'Article deleted successfully.' });
  } catch (err) {
    console.error('[articles] delete failed:', err);
    return res.status(500).json({ message: 'Failed to delete article.' });
  }
});

router.get('/:slug', async (req, res) => {
  if (!ensureDbReady(res)) return;

  try {
    const article = await Article.findOne({ slug: req.params.slug, published: true }).populate('author', 'name');
    if (!article) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    return res.json({
      item: {
        ...toListItem(article),
        content: article.content,
      },
    });
  } catch (err) {
    console.error('[articles] detail failed:', err);
    return res.status(500).json({ message: 'Failed to fetch article details.' });
  }
});

export default router;
