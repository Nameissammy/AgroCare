export type Screen = 'dashboard' | 'mandi-prices' | 'disease-detection' | 'education' | 'chatbot';

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
