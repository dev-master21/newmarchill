import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package } from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import { useProductsStore } from '../store/productsStore';

type StrainFilter = 'ALL' | 'CYAN' | 'WHITE' | 'BLACK';

const Catalog: React.FC = () => {
  const { products, fetchProducts } = useProductsStore();
  const [selectedFilter, setSelectedFilter] = useState<StrainFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      await fetchProducts();
      setIsLoading(false);
    };
    
    loadProducts();
    window.scrollTo(0, 0);
  }, [fetchProducts]);

  // Фильтруем продукты по выбранной категории
  const filteredProducts = selectedFilter === 'ALL' 
    ? products 
    : products.filter(product => product.type === selectedFilter);

  // Информация о категориях для кнопок фильтра
  const filterButtons = [
    {
      id: 'ALL' as StrainFilter,
      name: 'All Products',
      gradient: 'from-gray-600 to-gray-800',
      hoverGlow: 'rgba(156, 163, 175, 0.3)'
    },
    {
      id: 'CYAN' as StrainFilter,
      name: 'Cyan Edition',
      subtitle: 'Hybrid Strains',
      gradient: 'from-cyan-400 to-blue-600',
      hoverGlow: 'rgba(6, 182, 212, 0.4)'
    },
    {
      id: 'WHITE' as StrainFilter,
      name: 'White Edition',
      subtitle: 'Sativa Strains',
      gradient: 'from-gray-100 to-white',
      hoverGlow: 'rgba(255, 255, 255, 0.3)',
      isDark: false
    },
    {
      id: 'BLACK' as StrainFilter,
      name: 'Black Edition',
      subtitle: 'Indica Strains',
      gradient: 'from-gray-700 to-black',
      hoverGlow: 'rgba(120, 120, 120, 0.3)'
    }
  ];

  return (
    <div className="min-h-screen bg-black pt-24 lg:pt-28 pb-24">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-6xl font-bold mb-4">
            <span className="text-white">Product </span>
            <span className="gradient-text">Catalog</span>
          </h1>
          <p className="text-xl text-gray-400">
            Choose strain category
          </p>
        </motion.div>

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {filterButtons.map((filter, index) => {
            const isSelected = selectedFilter === filter.id;
            const isWhite = filter.isDark === false;
            
            return (
              <motion.button
                key={filter.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedFilter(filter.id)}
                className="relative group"
              >
                {/* Background gradient */}
                <div 
                  className={`relative px-6 py-4 rounded-2xl border-2 transition-all duration-300 min-w-[160px] ${
                    isSelected
                      ? 'border-transparent shadow-xl'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  style={{
                    background: isSelected 
                      ? `linear-gradient(to right, var(--tw-gradient-stops))` 
                      : 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  {isSelected && (
                    <div 
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${filter.gradient}`}
                      style={{ zIndex: -1 }}
                    />
                  )}
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <p className={`font-bold text-sm lg:text-base transition-colors ${
                      isSelected
                        ? isWhite ? 'text-black' : 'text-white'
                        : 'text-gray-400 group-hover:text-white'
                    }`}>
                      {filter.name}
                    </p>
                    {filter.subtitle && (
                      <p className={`text-xs mt-1 transition-colors ${
                        isSelected
                          ? isWhite ? 'text-black/60' : 'text-white/60'
                          : 'text-gray-500 group-hover:text-gray-400'
                      }`}>
                        {filter.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Glow effect */}
                  {isSelected && (
                    <motion.div
                      layoutId="filterGlow"
                      className="absolute inset-0 rounded-2xl -z-10"
                      style={{
                        boxShadow: `0 0 40px ${filter.hoverGlow}`
                      }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <p className="text-gray-400">
            <span className="text-white font-semibold">{filteredProducts.length}</span>
            {' '}{filteredProducts.length === 1 ? 'product' : 'products'}
            {selectedFilter !== 'ALL' && (
              <span className="text-primary ml-2">
                in {filterButtons.find(f => f.id === selectedFilter)?.name}
              </span>
            )}
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedFilter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredProducts.map((product, index) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  index={index} 
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Empty State */}
        {!isLoading && filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-2 text-white">No products found</h3>
            <p className="text-gray-400 mb-6">
              {selectedFilter === 'ALL' 
                ? 'No products available at the moment'
                : `No products in ${filterButtons.find(f => f.id === selectedFilter)?.name} yet`
              }
            </p>
            {selectedFilter !== 'ALL' && (
              <button
                onClick={() => setSelectedFilter('ALL')}
                className="px-6 py-3 gradient-primary text-white font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(35,192,219,0.5)] transition-all duration-300"
              >
                Show all products
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Catalog;