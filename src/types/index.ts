export type ProductType = 'WHITE' | 'BLACK' | 'CYAN';
export type Strain = 'Mimosa' | 'Lemon Mint' | 'Classic' | 'Pinapple Express' | 'Gorilla Glue' | 'Grape Stomper' | 'Strawberry Cough' | 'Green Haze';
export type ProductCategory = 'plastic-bags' | 'boxes' | 'nano-blunts' | 'hash-rosin' | 'big-blunts';

export interface Product {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  category: string;
  category_id?: number;
  category_name?: string;
  product_category?: ProductCategory;
  productCategory?: ProductCategory;
  strains: Strain[];
  price: number;
  price_rub: number;  // ДОБАВЛЕНО
  price_usd: number;  // ДОБАВЛЕНО
  originalPrice?: number;
  discount?: number;
  sizes?: string[];
  size: string;
  image: string;
  images: string[];
  gallery?: string[];
  model_3d?: string;
  description: string;
  features: string[];
  inStock: boolean;
  stock: number;
  rating?: number;
  reviews?: number;
  thc?: string;
  cbd?: string;
  featured?: boolean;
  new?: boolean;
  is_active?: boolean;
  strain_id?: number; // Добавляем это поле
  strain?: any; // Добавляем для хранения информации о сорте
  terpenes?: string;
  aroma_taste?: string;
  effects?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  strain?: string;
  strain_id?: number;
  name: string;
  image: string;
  price: number;
  type: string;
  size: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  avatar?: string;
  role: 'customer' | 'admin';
  points: number;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total: number;
  currency: string;
  delivery_method: 'standard' | 'express';
  payment_method?: string;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_postal_code: string;
  delivery_country: string;
  gift_message?: string;
  notes?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  delivered_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  strain_id?: number;
  quantity: number;
  price: number;
  total: number;
  product?: Product;
  strain?: Strain;
}