import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import CartItem from './CartItem';

const CartDrawer: React.FC = () => {
  const { isOpen, toggleCart, items, getTotalPrice, clearCart } = useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-darker border-l border-white/10 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                  <span>Your Cart</span>
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleCart}
                  className="w-10 h-10 rounded-full glass-dark flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
                    <ShoppingBag className="w-12 h-12 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
                  <p className="text-gray-400 mb-6">Add some products to get started</p>
                  <Link to="/catalog" onClick={toggleCart}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 gradient-primary text-white rounded-xl"
                    >
                      Browse Products
                    </motion.button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <CartItem key={`${item.id}-${item.strain}`} item={item} index={index} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-white/10 space-y-4">
                {/* Clear Cart */}
                <button
                  onClick={clearCart}
                  className="w-full py-2 text-sm text-gray-400 hover:text-red-400 transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Cart</span>
                </button>

                {/* Total */}
                <div className="glass-dark p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="font-semibold">฿{getTotalPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Delivery</span>
                    <span className="text-sm text-gray-500">Calculated at checkout</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      ฿{getTotalPrice().toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Link to="/checkout" onClick={toggleCart}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 gradient-primary text-white font-semibold rounded-xl flex items-center justify-center space-x-2 hover:shadow-[0_0_30px_rgba(35,192,219,0.5)] transition-all duration-300"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;