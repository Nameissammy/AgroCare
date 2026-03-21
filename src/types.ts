export type Screen = 'dashboard' | 'mandi-prices' | 'disease-detection' | 'education' | 'chatbot';
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
  category: string;
  readTime: string;
  image: string;
  excerpt: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
}

export type UserRole = 'farmer' | 'buyer';

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
  role: UserRole;
  phone?: string;
  location?: string;
}
