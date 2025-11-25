import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, X, Leaf, Package } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import type { CartItem as CartItemType } from '../../types';
import toast from 'react-hot-toast';
import { ProductType } from '../../types';
import { useCurrencyStore } from '../../store/currencyStore';
import { formatPrice, getPriceForCurrency } from '../../utils/currency';
interface CartItemProps {
  item: CartItemType;
  index: number;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeItem } = useCartStore();
  const [isRemoving, setIsRemoving] = useState(false);
const { currency } = useCurrencyStore();
const itemPrice = getPriceForCurrency(item.product, currency);
  const typeColors: Record<ProductType, {
    gradient: string;
    bg: string;
    text: string;
    icon: string;
    iconBg: string;
  }> = {
    WHITE: {
      gradient: 'from-gray-100 to-white',
      bg: 'from-gray-100/20 to-white/10',
      text: 'text-black',
      icon: '⚡',
      iconBg: 'from-gray-100 to-white'
    },
    BLACK: {
      gradient: 'from-gray-900 to-black',
      bg: 'from-gray-900/20 to-black/10',
      text: 'text-white',
      icon: '🌙',
      iconBg: 'from-gray-900 to-black'
    },
    CYAN: {
      gradient: 'from-cyan-400 to-primary',
      bg: 'from-cyan-400/20 to-primary/10',
      text: 'text-white',
      icon: '✨',
      iconBg: 'from-cyan-400 to-primary'
    },
  };

  const currentType = typeColors[item.type as ProductType];

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      removeItem(item.id, item.strain);
      toast.success('Item removed from cart', {
        style: {
          borderRadius: '12px',
          background: '#18181B',
          color: '#fff',
          border: '1px solid rgba(35, 192, 219, 0.3)',
        },
      });
    }, 300);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemove();
    } else {
      updateQuantity(item.id, newQuantity);
    }
  };

  return (
    <AnimatePresence>
      {!isRemoving && (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
          transition={{ duration: 0.3 }}
          whileHover={{ y: -5 }}
          className="glass-dark p-6 rounded-2xl relative overflow-hidden group"
        >
          {/* Background gradient effect */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br ${currentType.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          />
          
          {/* Animated border */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: `linear-gradient(45deg, transparent 30%, rgba(35, 192, 219, 0.1) 50%, transparent 70%)`,
            }}
            animate={{
              backgroundPosition: ['0% 0%', '200% 200%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          
          <div className="relative z-10 flex gap-4">
            {/* Image with hover effect */}
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 flex-shrink-0"
            >
              <img
                src={item.image || '/placeholder.jpg'}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.jpg';
                }}
              />
              
              {/* Type badge */}
              <div className={`absolute top-2 left-2 w-8 h-8 rounded-full bg-gradient-to-br ${currentType.iconBg} flex items-center justify-center shadow-lg`}>
                <span className="text-sm">{currentType.icon}</span>
              </div>
            </motion.div>

            {/* Info */}
            <div className="flex-1">
              {/* Name and Remove */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-lg mb-1">{item.name}</h4>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-gradient-to-r ${currentType.gradient} ${currentType.text} font-medium`}>
                      <Package className="w-3 h-3" />
                      {item.type}
                    </span>
                    {item.strain && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <Leaf className="w-3 h-3 text-primary" />
                        {item.strain}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Remove Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRemove}
                  className="w-8 h-8 rounded-full hover:bg-red-500/10 flex items-center justify-center transition-colors group/remove"
                >
                  <X className="w-4 h-4 text-gray-400 group-hover/remove:text-red-400 transition-colors" />
                </motion.button>
              </div>

              {/* Size */}
              <p className="text-sm text-gray-500 mb-3">Size: {item.size}</p>

              {/* Price and Quantity */}
              <div className="flex items-center justify-between">
                {/* Quantity controls */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleQuantityChange(item.quantity - 1)}
                    className="w-8 h-8 rounded-lg glass-dark flex items-center justify-center hover:bg-white/10 transition-colors group/minus"
                  >
                    <Minus className="w-4 h-4 group-hover/minus:text-primary transition-colors" />
                  </motion.button>
                  
                  <motion.span
                    key={item.quantity}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-12 text-center font-semibold text-lg"
                  >
                    {item.quantity}
                  </motion.span>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleQuantityChange(item.quantity + 1)}
                    className="w-8 h-8 rounded-lg glass-dark flex items-center justify-center hover:bg-white/10 transition-colors group/plus"
                  >
                    <Plus className="w-4 h-4 group-hover/plus:text-primary transition-colors" />
                  </motion.button>
                </div>

                {/* Price */}
                <div className="text-right">
<motion.p
  key={itemPrice * item.quantity}
  initial={{ scale: 1.2, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  className="text-xl font-bold gradient-text"
>
  {formatPrice(
    itemPrice * item.quantity,
    itemPrice * item.quantity,
    itemPrice * item.quantity,
    currency
  )}
</motion.p>
<p className="text-xs text-gray-500">
  {formatPrice(
    item.product.price,
    item.product.price_rub,
    item.product.price_usd,
    currency
  )} each
</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hover effect sparkles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary rounded-full"
                style={{
                  left: `${20 + i * 30}%`,
                  bottom: '20%',
                }}
                animate={{
                  y: [-10, -40],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartItem;