import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, X } from 'lucide-react';
import { useProductsStore } from '../store/productsStore';
import ProductCard from '../components/products/ProductCard';

const Search: React.FC = () => {
  const { products, searchQuery, setSearchQuery } = useProductsStore();
  const [localQuery, setLocalQuery] = useState(searchQuery);

  const handleSearch = (query: string) => {
    setLocalQuery(query);
    setSearchQuery(query);
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(localQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(localQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(localQuery.toLowerCase())
  );

  const recentSearches = ['Pre Rolls', 'Sativa', 'Hash', 'CBD'];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-6">Search Products</h1>
          
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-500" />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for products, strains, or categories..."
              className="w-full pl-14 pr-12 py-4 text-lg bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-primary/50 transition-colors"
              autoFocus
            />
            {localQuery && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSearch('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </motion.button>
            )}
          </div>
        </motion.div>

        {!localQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-400">Recent Searches</h3>
            <div className="flex flex-wrap gap-3">
              {recentSearches.map((search, index) => (
                <motion.button
                  key={search}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSearch(search)}
                  className="px-4 py-2 glass-dark rounded-full hover:bg-white/10 transition-colors"
                >
                  {search}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {localQuery && (
          <>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-400 mb-6"
            >
              {filteredProducts.length} results for "{localQuery}"
            </motion.p>

            {filteredProducts.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <SearchIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-2xl font-semibold mb-2">No results found</h3>
                <p className="text-gray-400">Try searching with different keywords</p>
              </motion.div>
            )}
          </>
        )}

        {!localQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold mb-6 text-gray-400">Popular Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Flowers', 'Pre-Rolls', 'Concentrates'].map((category, index) => (
                <motion.button
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                  onClick={() => handleSearch(category)}
                  className="glass-dark p-6 rounded-2xl text-left hover:bg-white/5 transition-all"
                >
                  <h4 className="text-lg font-semibold mb-2">{category}</h4>
                  <p className="text-sm text-gray-400">Browse our {category.toLowerCase()} collection</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Search;