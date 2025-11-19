import React from 'react';
import { motion } from 'framer-motion';
import { useProductsStore } from '../../store/productsStore';

const CategoryFilter: React.FC = () => {
  const { selectedCategory, setSelectedCategory } = useProductsStore();

  const categories = [
    { id: 'ALL', label: 'All Products', color: 'from-gray-600 to-gray-700' },
    { id: 'WHITE', label: 'White Edition', color: 'from-gray-100 to-white' },
    { id: 'BLACK', label: 'Black Edition', color: 'from-gray-900 to-black' },
    { id: 'CYAN', label: 'Cyan Edition', color: 'from-cyan-400 to-primary' },
  ] as const;

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {categories.map((category) => (
        <motion.button
          key={category.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedCategory(category.id)}
          className={`relative px-6 py-3 rounded-full font-medium transition-all duration-300 ${
            selectedCategory === category.id
              ? 'text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {/* Background */}
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-r ${category.color} transition-opacity duration-300 ${
              selectedCategory === category.id ? 'opacity-100' : 'opacity-0'
            }`}
          />
          
          {/* Border */}
          <div
            className={`absolute inset-0 rounded-full border transition-colors duration-300 ${
              selectedCategory === category.id
                ? 'border-transparent'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          />
          
          {/* Text */}
          <span className={`relative z-10 ${
            category.id !== 'ALL' && selectedCategory === category.id ? 'text-black' : ''
          }`}>
            {category.label}
          </span>
          
          {/* Glow effect */}
          {selectedCategory === category.id && (
            <motion.div
              layoutId="categoryGlow"
              className="absolute inset-0 rounded-full"
              style={{
                boxShadow: category.id === 'CYAN' 
                  ? '0 0 30px rgba(35, 192, 219, 0.5)' 
                  : '0 0 20px rgba(255, 255, 255, 0.2)'
              }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
};

export default CategoryFilter;