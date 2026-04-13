export type Screen = 'dashboard' | 'mandi-prices' | 'disease-detection' | 'education' | 'creator-studio' | 'chatbot';
export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml' | 'or';

export interface MandiPrice {
  crop: string;
  market: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  trend: number;
  icon: string;
  color: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  category: string;
  readTimeMinutes: number;
  imageUrl: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  tags?: string[];
  language: SupportedLanguage;
  featured: boolean;
  published: boolean;
  authorName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = 'farmer' | 'buyer' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  location?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: Exclude<UserRole, 'admin'>;
  phone?: string;
  location?: string;
}
