import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [180, 'Title must not exceed 180 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      trim: true,
      maxlength: [320, 'Excerpt must not exceed 320 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      minlength: [40, 'Content must be at least 40 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['crop-management', 'sustainable-farming', 'government-schemes', 'market-trends', 'livestock', 'general'],
      index: true,
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    readTimeMinutes: {
      type: Number,
      min: 1,
      max: 120,
      default: 5,
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'or'],
      default: 'en',
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    published: {
      type: Boolean,
      default: false,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

articleSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

export default mongoose.model('Article', articleSchema);
