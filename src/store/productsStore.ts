import { create } from 'zustand';
import type { Product } from '../types';
import api from '../services/api';

interface ProductsStore {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  selectedCategory: string | null;
  searchQuery: string;
  fetchProducts: () => Promise<void>;
  getProductBySlug: (slug: string) => Product | undefined;
  searchProducts: (query: string) => Product[];
  setSelectedCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useProductsStore = create<ProductsStore>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  selectedCategory: null,
  searchQuery: '',

  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/products');
      const { products } = response.data;
      
      // Transform backend data to match frontend types
      const transformedProducts: Product[] = products.map((product: any) => {
        console.log('Raw product from backend:', product.id, {
          gallery_type: typeof product.gallery,
          gallery_value: product.gallery,
          gallery_length: Array.isArray(product.gallery) ? product.gallery.length : 'not array'
        });

        // Парсим gallery - бэкенд уже возвращает распарсенный массив
        let gallery: string[] = [];
        if (product.gallery) {
          // Если уже массив - используем его
          if (Array.isArray(product.gallery)) {
            gallery = product.gallery.filter((img: any) => img && typeof img === 'string');
          } 
          // Если строка - парсим JSON
          else if (typeof product.gallery === 'string' && product.gallery.trim() !== '') {
            try {
              const parsed = JSON.parse(product.gallery);
              if (Array.isArray(parsed)) {
                gallery = parsed.filter(img => img && typeof img === 'string');
              }
            } catch (e) {
              console.error('Failed to parse gallery for product:', product.id, product.gallery, e);
              gallery = [];
            }
          }
        }

        console.log('Parsed gallery for product', product.id, ':', gallery);

        // Парсим features
        let features: string[] = [];
        if (product.features) {
          if (Array.isArray(product.features)) {
            features = product.features;
          } else if (typeof product.features === 'string' && product.features.trim() !== '') {
            try {
              const parsed = JSON.parse(product.features);
              if (Array.isArray(parsed)) {
                features = parsed;
              }
            } catch (e) {
              console.error('Failed to parse features for product:', product.id, e);
              features = [];
            }
          }
        }

        // Форматируем size - добавляем 'g' если его нет
        let formattedSize = product.size || '';
        if (formattedSize && !formattedSize.toLowerCase().endsWith('g')) {
          formattedSize = formattedSize + 'g';
        }

        return {
          id: product.id.toString(),
          name: product.name,
          slug: product.slug,
          type: product.type,
          category: product.category || product.category_name || 'Unknown',
          category_id: product.category_id,
          category_name: product.category_name,
          productCategory: product.product_category,
          product_category: product.product_category,
          strains: product.strains || [],
          price: product.price,
          price_rub: product.price_rub,  // ДОБАВЛЕНО
          price_usd: product.price_usd,  // ДОБАВЛЕНО
          originalPrice: product.original_price,
          discount: product.discount,
          sizes: product.sizes || ['1g', '3g', '5g'],
          size: formattedSize,
          image: product.image,
          images: product.images || [product.image],
          gallery: gallery,
          description: product.description,
          features: features,
          stock: product.stock_quantity || 0,
          inStock: product.stock_quantity > 0,
          rating: product.rating || 4.8,
          reviews: product.reviews || 0,
          thc: product.thc,
          cbd: product.cbd,
          model_3d: product.model_3d,
        };
      });
      
      set({ products: transformedProducts, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch products:', error);
      set({ error: 'Failed to load products', isLoading: false });
    }
  },

  getProductBySlug: (slug: string) => {
    const { products } = get();
    return products.find(product => product.slug === slug);
  },

  searchProducts: (query: string) => {
    const { products } = get();
    if (!query) return products;

    const lowerQuery = query.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.description.toLowerCase().includes(lowerQuery) ||
      product.type.toLowerCase().includes(lowerQuery)
    );
  },
}));