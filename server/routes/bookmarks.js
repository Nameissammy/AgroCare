import express from 'express';
import mongoose from 'mongoose';
import Article from '../models/Article.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const ensureDbReady = (res) => {
  if (mongoose.connection?.readyState !== 1) {
    res.status(503).json({ message: 'Database not connected. Please try again shortly.' });
    return false;
  }
  return true;
};

const articleProjection = {
  title: 1,
  slug: 1,
  excerpt: 1,
  category: 1,
  level: 1,
  readTimeMinutes: 1,
  imageUrl: 1,
  language: 1,
  featured: 1,
  published: 1,
  createdAt: 1,
};

router.get('/', requireAuth, async (req, res) => {
  if (!ensureDbReady(res)) return;

  try {
    const user = await User.findById(req.user.id).select('savedArticles');
    const ids = user?.savedArticles || [];

    const items = await Article.find({ _id: { $in: ids }, published: true }, articleProjection).sort({ createdAt: -1 });

    return res.json({
      items: items.map((item) => ({
        id: item._id.toString(),
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        category: item.category,
        level: item.level,
        readTimeMinutes: item.readTimeMinutes,
        imageUrl: item.imageUrl,
        language: item.language,
        featured: item.featured,
        published: item.published,
        createdAt: item.createdAt,
      })),
    });
  } catch (err) {
    console.error('[bookmarks] list failed:', err);
    return res.status(500).json({ message: 'Failed to fetch bookmarks.' });
  }
});

router.post('/:articleId', requireAuth, async (req, res) => {
  if (!ensureDbReady(res)) return;

  try {
    const { articleId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return res.status(400).json({ message: 'Invalid article id.' });
    }

    const article = await Article.findOne({ _id: articleId, published: true }).select('_id');
    if (!article) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    await User.updateOne({ _id: req.user.id }, { $addToSet: { savedArticles: article._id } });
    return res.status(201).json({ message: 'Bookmark added.' });
  } catch (err) {
    console.error('[bookmarks] add failed:', err);
    return res.status(500).json({ message: 'Failed to add bookmark.' });
  }
});

router.delete('/:articleId', requireAuth, async (req, res) => {
  if (!ensureDbReady(res)) return;

  try {
    const { articleId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return res.status(400).json({ message: 'Invalid article id.' });
    }

    await User.updateOne({ _id: req.user.id }, { $pull: { savedArticles: articleId } });
    return res.json({ message: 'Bookmark removed.' });
  } catch (err) {
    console.error('[bookmarks] remove failed:', err);
    return res.status(500).json({ message: 'Failed to remove bookmark.' });
  }
});

export default router;
