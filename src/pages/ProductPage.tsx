import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Camera,
  Box,
  X,
  Plus,
  Minus,
  ArrowLeft,
  Sparkles,
  Leaf,
  Wind,
  Sun,
  CheckCircle,
  Flower2,
  Droplets,
  Brain,
  Activity
} from 'lucide-react';
import { useProductsStore } from '../store/productsStore';
import { useCartStore } from '../store/cartStore';
import { useCurrencyStore } from '../store/currencyStore';
import { formatPrice } from '../utils/currency';
import { toast } from 'sonner';
import api from '../services/api';
import AnimatedBackground from '../components/common/AnimatedBackground';
import Product3DCarousel from '../components/products/Product3DCarousel';
import type { Product } from '../types';

interface Strain {
  id: number;
  name: string;
  description: string;
  effects: string;
  flavors: string;
  thc_content: string;
  cbd_content: string;
  type: string;
  terpenes: string;
  aroma_taste: string;
}

const getThumbnailPath = (imagePath: string): string => {
  if (!imagePath) return imagePath;
  const ext = imagePath.substring(imagePath.lastIndexOf('.'));
  const nameWithoutExt = imagePath.substring(0, imagePath.lastIndexOf('.'));
  return `${nameWithoutExt}_thumb${ext}`;
};

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { products, getProductBySlug, fetchProducts } = useProductsStore();
  const { addItem } = useCartStore();
  const { currency } = useCurrencyStore();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'photos' | '3d'>('photos');
  const [availableStrains, setAvailableStrains] = useState<Strain[]>([]);
  const [selectedStrain, setSelectedStrain] = useState<Strain | null>(null);
  const [tempStrain, setTempStrain] = useState<Strain | null>(null);
  const [strainModalOpen, setStrainModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState<Set<number>>(new Set());

  const allImages = product ? [
    product.image,
    ...(product.gallery && Array.isArray(product.gallery) ? product.gallery : [])
  ].filter(Boolean) : [];

  useEffect(() => {
    loadProduct();
  }, [slug]);

  const loadProduct = async () => {
    if (!slug) return;
    
    setLoading(true);
    try {
      if (products.length === 0) {
        await fetchProducts();
      }

      let foundProduct = getProductBySlug(slug);
      
      if (!foundProduct) {
        const response = await api.get(`/products/${slug}`);
        foundProduct = response.data.product;
      }

      if (foundProduct) {
        setProduct(foundProduct);
        await loadStrains(foundProduct);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const loadStrains = async (productData: Product) => {
    try {
      const response = await api.get(`/products/${productData.id}/strains`);
      const strains = response.data.strains || [];
      
      setAvailableStrains(strains);
      
      if (strains.length > 0) {
        setSelectedStrain(strains[0]);
      }
    } catch (error) {
      console.error('Failed to load strains:', error);
      setAvailableStrains([]);
    }
  };

  const handleStrainClick = (strain: Strain) => {
    setTempStrain(strain);
    setStrainModalOpen(true);
  };

  const handleStrainSelect = (strain: Strain) => {
    setSelectedStrain(strain);
    setStrainModalOpen(false);
    toast.success(`${strain.name} selected`);
  };

  const handleAddToCart = () => {
    if (!product) return;
  
    if (!selectedStrain && availableStrains.length > 0) {
      toast.error('Please select a strain');
      return;
    }
  
    // ИСПРАВЛЕНО: передаем ID сорта вместо названия
    addItem(product, quantity, selectedStrain?.id?.toString());
    toast.success(`${product.name} added to cart!`);
  };

  const handleImageError = (imgIndex: number) => {
    setImageError(prev => new Set(prev).add(imgIndex));
  };

  const getImageSrc = (imagePath: string, imgIndex: number) => {
    if (imageError.has(imgIndex)) {
      return imagePath;
    }
    return getThumbnailPath(imagePath);
  };

  const getProductType = () => {
    if (!product) return 'boxes';
    const category = product.productCategory || product.product_category || '';
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory.includes('bag')) return 'plastic-bags';
    if (lowerCategory.includes('box')) return 'boxes';
    if (lowerCategory.includes('nano')) return 'nano-blunts';
    if (lowerCategory.includes('big')) return 'big-blunts';
    
    return 'boxes';
  };

  const strainType = product ? (
    product.type.toLowerCase() === 'cyan' ? 'cyan' : 
    product.type.toLowerCase() === 'white' ? 'white' : 
    'black'
  ) as 'cyan' | 'white' | 'black' : 'cyan';

  const typeColors = {
    WHITE: 'from-gray-100 to-white',
    BLACK: 'from-gray-800 to-black',
    CYAN: 'from-cyan-400 to-blue-500'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <button
            onClick={() => navigate('/catalog')}
            className="text-primary hover:underline"
          >
            Return to catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-black">
      <AnimatedBackground />
      
      {/* Back Button */}
      <div className="fixed top-24 left-4 z-30">
        <motion.button
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/catalog')}
          className="flex items-center gap-2 px-4 py-2 glass-dark rounded-xl hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden md:inline">Back to Catalog</span>
        </motion.button>
      </div>

      <div className="container mx-auto px-4 pt-32 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left: Images */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="sticky top-32">
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10">
                <AnimatePresence mode="wait">
                  {viewMode === 'photos' ? (
                    <motion.div
                      key="photos"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative w-full h-full"
                    >
                      <AnimatePresence mode="wait">
                        {allImages.length > 0 && (
                          <motion.img
                            key={selectedImageIndex}
                            src={getImageSrc(allImages[selectedImageIndex], selectedImageIndex)}
                            alt={product.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4 }}
                            onError={() => handleImageError(selectedImageIndex)}
                          />
                        )}
                      </AnimatePresence>

                      {allImages.length > 1 && (
                        <>
                          <button
                            onClick={() => setSelectedImageIndex(prev => 
                              prev === 0 ? allImages.length - 1 : prev - 1
                            )}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                          >
                            <ChevronLeft className="w-6 h-6 text-white" />
                          </button>
                          <button
                            onClick={() => setSelectedImageIndex(prev => 
                              prev === allImages.length - 1 ? 0 : prev + 1
                            )}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                          >
                            <ChevronRight className="w-6 h-6 text-white" />
                          </button>
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="3d"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative w-full h-full"
                    >
                      <Product3DCarousel
                        productType={getProductType()}
                        strainType={strainType}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* View Mode Toggle */}
                <div className="absolute top-4 left-4 flex gap-2 z-20">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('photos')}
                    className={`px-4 py-2 rounded-xl backdrop-blur-md flex items-center gap-2 font-medium transition-all ${
                      viewMode === 'photos'
                        ? 'bg-white/90 text-black'
                        : 'bg-black/50 text-white hover:bg-black/70'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Photos</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('3d')}
                    className={`px-4 py-2 rounded-xl backdrop-blur-md flex items-center gap-2 font-medium transition-all ${
                      viewMode === '3d'
                        ? 'bg-white/90 text-black'
                        : 'bg-black/50 text-white hover:bg-black/70'
                    }`}
                  >
                    <Box className="w-4 h-4" />
                    <span>3D</span>
                  </motion.button>
                </div>

                {/* Thumbnails */}
                {viewMode === 'photos' && allImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {allImages.map((_, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-3 h-3 rounded-full transition-all ${
                          idx === selectedImageIndex
                            ? 'bg-white w-8'
                            : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right: Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-lg text-sm font-semibold bg-gradient-to-r ${typeColors[product.type]}`}>
                  <span className={product.type === 'WHITE' ? 'text-black' : 'text-white'}>
                    {product.type}
                  </span>
                </span>
                {product.size && (
                  <span className="text-gray-400 text-sm">{product.size}</span>
                )}
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                {product.name}
              </h1>

              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-white">
                    {formatPrice(product.price, product.price_rub, product.price_usd, currency)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(product.originalPrice, product.originalPrice, product.originalPrice, currency)}
                    </span>
                  )}
                </div>
                
                <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  product.inStock ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </div>
              </div>
            </div>

            {/* Available Strains */}
            {availableStrains.length > 0 && (
              <div className="glass-dark rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-primary" />
                    Available Strains
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableStrains.map((strain) => (
                    <motion.button
                      key={strain.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStrainClick(strain)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedStrain?.id === strain.id
                          ? 'border-primary bg-primary/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="font-semibold text-white mb-1">{strain.name}</div>
                      <div className="text-sm text-gray-400">{strain.type}</div>
                      {strain.thc_content && (
                        <div className="text-xs text-primary mt-2">THC: {strain.thc_content}</div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Key Features */}
            {product.features && Array.isArray(product.features) && product.features.length > 0 && (
              <div className="glass-dark rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Key Features
                </h3>
                <div className="space-y-3">
                  {product.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 text-gray-300"
                    >
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="glass-dark rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </motion.button>
                  <span className="text-2xl font-bold text-white w-12 text-center">{quantity}</span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </motion.button>
                </div>

                <div className="flex-1 text-right">
                  <div className="text-sm text-gray-400 mb-1">Total</div>
                  <div className="text-2xl font-bold text-primary">
                    {formatPrice(
                      product.price * quantity,
                      product.price_rub * quantity,
                      product.price_usd * quantity,
                      currency
                    )}
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/30"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Add to Cart</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Strain Info Modal */}
      <StrainInfoModal
        strain={tempStrain}
        isOpen={strainModalOpen}
        onClose={() => setStrainModalOpen(false)}
        onSelect={handleStrainSelect}
      />
    </div>
  );
}

// Strain Info Modal Component
interface StrainInfoModalProps {
  strain: Strain | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (strain: Strain) => void;
}

function StrainInfoModal({ strain, isOpen, onClose, onSelect }: StrainInfoModalProps) {
  if (!strain) return null;

  const strainTypeColors = {
    Sativa: 'from-yellow-400 to-orange-500',
    Indica: 'from-purple-400 to-indigo-600',
    Hybrid: 'from-green-400 to-teal-500'
  };

  const gradient = strainTypeColors[strain.type as keyof typeof strainTypeColors] || strainTypeColors.Hybrid;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-dark rounded-3xl border border-white/20 pointer-events-auto"
            >
              {/* Header */}
              <div className={`relative p-8 bg-gradient-to-br ${gradient} rounded-t-3xl`}>
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                
                <div className="flex items-center gap-3 mb-2">
                  <Leaf className="w-8 h-8 text-white" />
                  <span className="px-3 py-1 rounded-lg bg-black/30 text-white text-sm font-semibold">
                    {strain.type}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-white">{strain.name}</h2>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Description */}
                {strain.description && (
                  <div>
                    <p className="text-gray-300 leading-relaxed">{strain.description}</p>
                  </div>
                )}

                {/* THC & CBD */}
                <div className="grid grid-cols-2 gap-4">
                  {strain.thc_content && (
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-gray-400">THC Content</span>
                      </div>
                      <div className="text-2xl font-bold text-green-400">{strain.thc_content}</div>
                    </div>
                  )}
                  {strain.cbd_content && (
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Droplets className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-gray-400">CBD Content</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-400">{strain.cbd_content}</div>
                    </div>
                  )}
                </div>

                {/* Effects */}
                {strain.effects && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-primary" />
                      Effects
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {strain.effects.split(',').map((effect, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm"
                        >
                          {effect.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flavors */}
                {strain.flavors && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Sun className="w-5 h-5 text-primary" />
                      Flavors
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {strain.flavors.split(',').map((flavor, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm"
                        >
                          {flavor.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Terpenes */}
                {strain.terpenes && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Flower2 className="w-5 h-5 text-primary" />
                      Terpenes
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {strain.terpenes.split(',').map((terpene, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-sm"
                        >
                          {terpene.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Aroma & Taste */}
                {strain.aroma_taste && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Wind className="w-5 h-5 text-primary" />
                      Aroma & Taste
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {strain.aroma_taste.split(',').map((aroma, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm"
                        >
                          {aroma.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Select Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(strain)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/30"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Select</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}