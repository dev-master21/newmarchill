import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ChevronLeft, ChevronRight, Camera, Box, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { toast } from 'sonner';
import Product3DCarousel from './Product3DCarousel';
import { useCurrencyStore } from '../../store/currencyStore';
import { formatPrice } from '../../utils/currency';

interface ProductCardProps {
  product: Product;
  index: number;
}

// Функция для получения пути thumbnail
const getThumbnailPath = (imagePath: string): string => {
  if (!imagePath) return imagePath;
  
  const ext = imagePath.substring(imagePath.lastIndexOf('.'));
  const nameWithoutExt = imagePath.substring(0, imagePath.lastIndexOf('.'));
  return `${nameWithoutExt}_thumb${ext}`;
};

export default function ProductCard({ product, index }: ProductCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'photos' | '3d'>('photos');
  const [imageError, setImageError] = useState<Set<number>>(new Set());
  const { addItem } = useCartStore();
  const { currency } = useCurrencyStore();
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const minSwipeDistance = 50;

  const allImages = useMemo(() => {
    const images: string[] = [];
    
    if (product.image) {
      images.push(product.image);
    }
    
    if (product.gallery && Array.isArray(product.gallery) && product.gallery.length > 0) {
      const validGalleryImages = product.gallery.filter(
        img => img && typeof img === 'string' && img.trim() !== ''
      );
      images.push(...validGalleryImages);
    }
    
    return images.filter(img => img && img.trim() !== '');
  }, [product.image, product.gallery]);

  const typeColors = {
    WHITE: 'from-gray-200 to-white',
    BLACK: 'from-gray-700 to-black',
    CYAN: 'from-cyan-400 to-blue-500'
  };

  const typeBgGradients = {
    WHITE: 'from-gray-100/20 to-white/10',
    BLACK: 'from-gray-800/20 to-black/10',
    CYAN: 'from-cyan-400/20 to-blue-500/10'
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.inStock) {
      toast.error('Product is out of stock');
      return;
    }

    addItem(product, 1, product.strains?.[0]);
    toast.success('Added to cart');
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/product/${product.slug}`);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => 
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => 
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };

  const toggleViewMode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setViewMode(prev => prev === 'photos' ? '3d' : 'photos');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (viewMode === '3d') return;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (viewMode === '3d') return;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (viewMode === '3d') return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentImageIndex(prev => 
        prev === allImages.length - 1 ? 0 : prev + 1
      );
    } else if (isRightSwipe) {
      setCurrentImageIndex(prev => 
        prev === 0 ? allImages.length - 1 : prev - 1
      );
    }
  };

  const handleImageError = (imgIndex: number) => {
    setImageError(prev => new Set(prev).add(imgIndex));
  };

  const getImageSrc = (imagePath: string, imgIndex: number) => {
    // Если thumbnail не загрузился - используем оригинал
    if (imageError.has(imgIndex)) {
      return imagePath;
    }
    // Иначе используем thumbnail
    return getThumbnailPath(imagePath);
  };

  const getProductType = () => {
    const category = product.productCategory || product.product_category || '';
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory.includes('bag')) return 'plastic-bags';
    if (lowerCategory.includes('box')) return 'boxes';
    if (lowerCategory.includes('nano')) return 'nano-blunts';
    if (lowerCategory.includes('big')) return 'big-blunts';
    
    return 'boxes';
  };

  const strainType = (product.type.toLowerCase() === 'cyan' ? 'cyan' : 
                      product.type.toLowerCase() === 'white' ? 'white' : 
                      'black') as 'cyan' | 'white' | 'black';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative h-full"
    >
      <div className="relative h-full bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-500">
        <motion.div
          animate={{
            opacity: isHovered ? 0.15 : 0.05,
            scale: isHovered ? 1.2 : 1,
          }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 pointer-events-none"
        >
          <div 
            className={`absolute inset-0 bg-gradient-to-br ${typeBgGradients[product.type]} blur-xl`}
          />
        </motion.div>

        <div 
          className="relative aspect-square overflow-hidden bg-black/20"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait">
            {viewMode === 'photos' ? (
              <motion.div
                key="photos"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full"
              >
                {/* Изображения с плавным переходом */}
                <div className="relative w-full h-full">
                  <AnimatePresence mode="wait">
                    {allImages.length > 0 && (
                      <motion.img
                        key={currentImageIndex}
                        src={getImageSrc(allImages[currentImageIndex], currentImageIndex)}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: isHovered ? 1.05 : 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ 
                          opacity: { duration: 0.3 },
                          scale: { duration: 0.6 }
                        }}
                        loading="lazy"
                        onError={() => handleImageError(currentImageIndex)}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center 
                      opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 hover:bg-black/70"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center 
                      opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 hover:bg-black/70"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {allImages.map((_, idx) => (
                        <motion.div
                          key={idx}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentImageIndex
                              ? 'w-6 bg-white'
                              : 'w-1.5 bg-white/40'
                          }`}
                          animate={{
                            scale: idx === currentImageIndex ? 1 : 0.8
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="3d"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full"
              >
                <Product3DCarousel
                  productType={getProductType()}
                  strainType={strainType}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute top-3 left-3 flex gap-2 z-20">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleViewMode}
              className={`px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5 text-xs font-medium transition-all ${
                viewMode === 'photos'
                  ? 'bg-white/90 text-black'
                  : 'bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Photos</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleViewMode}
              className={`px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5 text-xs font-medium transition-all ${
                viewMode === '3d'
                  ? 'bg-white/90 text-black'
                  : 'bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>3D</span>
            </motion.button>
          </div>

          <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
            {product.discount && (
              <div className="px-2 py-1 rounded-lg bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold">
                -{product.discount}%
              </div>
            )}
            <div 
              className={`px-2 py-1 rounded-lg backdrop-blur-sm text-xs font-semibold bg-gradient-to-r ${typeColors[product.type]}`}
            >
              <span className={product.type === 'WHITE' ? 'text-black' : 'text-white'}>
                {product.type}
              </span>
            </div>
          </div>

          <motion.div
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: isHovered ? 1 : 0, 
              y: isHovered ? 0 : 20 
            }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-4 right-4 flex gap-2 z-20"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleQuickAdd}
              disabled={!product.inStock}
              className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-lg ${
                product.inStock
                  ? 'bg-primary/80 hover:bg-primary text-black'
                  : 'bg-gray-500/50 cursor-not-allowed text-gray-400'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {product.category}
            </span>
            {product.size && (
              <span className="text-xs text-gray-500 font-medium">
                {product.size}
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
            {product.name}
          </h3>

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {formatPrice(product.price, product.price_rub, product.price_usd, currency)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    ฿{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              <div className={`text-xs font-medium mt-1 ${
                product.inStock ? 'text-green-400' : 'text-red-400'
              }`}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleViewDetails}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary/80 to-blue-500/80 hover:from-primary hover:to-blue-500 text-white text-sm font-semibold transition-all shadow-lg hover:shadow-primary/50"
            >
              <span>Details</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}