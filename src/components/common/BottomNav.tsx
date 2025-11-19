import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ShoppingBag, User, Grid3X3 } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const cartItems = useCartStore((state) => state.items);
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Grid3X3, label: 'Catalog', path: '/catalog' },
    { icon: ShoppingBag, label: 'Cart', path: '/cart', badge: itemCount },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-2xl border-t border-white/5 lg:hidden safe-bottom z-40">
      <div className="flex justify-around items-center py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center p-2 tap-highlight-transparent group"
            >
              {/* Ripple effect on tap */}
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="relative"
              >
                {/* Glow effect for active */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1.5, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                    />
                  )}
                </AnimatePresence>
                
                {/* Icon container */}
                <motion.div
                  className={`relative p-2 rounded-full transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-br from-primary to-secondary shadow-lg' 
                      : 'group-hover:bg-white/10'
                  }`}
                  animate={{
                    rotate: isActive ? [0, -10, 10, -10, 0] : 0,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut",
                  }}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                    }`}
                  />
                  
                  {/* Badge for cart */}
                  <AnimatePresence>
                    {item.badge !== undefined && item.badge > 0 && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-gradient-to-r from-red-500 to-red-600 text-xs text-white rounded-full flex items-center justify-center font-bold shadow-lg"
                      >
                        <motion.span
                          key={item.badge}
                          initial={{ scale: 1.5 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </motion.span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
              
              {/* Label */}
              <motion.span
                className={`text-[10px] mt-1 transition-all duration-300 ${
                  isActive 
                    ? 'text-primary font-medium' 
                    : 'text-gray-500 group-hover:text-gray-400'
                }`}
                animate={{
                  y: isActive ? -2 : 0,
                }}
              >
                {item.label}
              </motion.span>
              
              {/* Active indicator dot */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  />
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;