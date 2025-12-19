// src/components/common/TopNav.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Grid3X3, 
  ShoppingBag, 
  User, 
  Menu, 
  X,
  LogIn,
  Settings,
  Package
} from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useCurrencyStore, Currency } from '../../store/currencyStore';

const TopNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const cartItems = useCartStore((state) => state.items);
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const { currency, setCurrency } = useCurrencyStore();
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Grid3X3, label: 'Catalog', path: '/catalog' },
    { icon: ShoppingBag, label: 'Cart', path: '/cart', badge: itemCount },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`hidden lg:flex fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-black/80 backdrop-blur-2xl shadow-lg border-b border-white/10' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto w-full px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo - УМЕНЬШЕННЫЙ */}
            <Link to="/" className="flex items-center group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.7 }}
                className="flex items-center justify-center"
              >
                <img 
                  src="/logo.svg" 
                  alt="CHILLIUM" 
                  className="h-10 w-auto"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(35, 192, 219, 0.3))' }}
                />
              </motion.div>
            </Link>

            {/* Center Navigation */}
            <div className="flex items-center gap-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative group"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                        isActive
                          ? 'bg-primary/20 text-primary'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      
                      {/* Badge */}
                      {item.badge !== undefined && item.badge > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-red-500 to-red-600 text-xs text-white rounded-full flex items-center justify-center font-bold"
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </motion.span>
                      )}
                    </motion.div>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                      />
                    )}
                  </Link>
                );
              })}
            </div>

{/* Currency Selector */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              {(['THB', 'RUB', 'USD'] as Currency[]).map((curr, index) => (
                <React.Fragment key={curr}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrency(curr)}
                    className={`px-2 py-1 text-sm font-medium transition-colors rounded-lg ${
                      currency === curr
                        ? 'text-primary bg-primary/20'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {curr}
                  </motion.button>
                  {index < 2 && <span className="text-gray-600">|</span>}
                </React.Fragment>
              ))}
            </div>

            {/* User Menu */}
            <div className="relative">
              {isAuthenticated ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-medium">{user?.name}</span>
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full right-0 mt-2 w-56 bg-black/95 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden shadow-2xl"
                      >
                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                        
                        <Link
                          to="/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          <span>Orders</span>
                        </Link>
                        
                        {user?.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Admin Panel</span>
                          </Link>
                        )}
                        
                        <div className="border-t border-white/10 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full"
                          >
                            <LogIn className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-50 w-12 h-12 bg-black/80 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/10"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/95 backdrop-blur-xl"
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex items-center justify-between mb-8">
                <img 
                  src="/logo.svg" 
                  alt="CHILLIUM" 
                  className="h-10 w-auto"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(35, 192, 219, 0.3))' }}
                />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <nav className="flex-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3 mb-2 rounded-xl transition-all ${
                        isActive
                          ? 'bg-primary/20 text-primary'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-lg font-medium">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

            {/* Currency Selector for Mobile */}
              <div className="pb-6 border-b border-white/10 mb-6">
                <p className="text-sm text-gray-400 mb-3">Currency</p>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                  {(['THB', 'RUB', 'USD'] as Currency[]).map((curr, index) => (
                    <React.Fragment key={curr}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrency(curr)}
                        className={`flex-1 px-3 py-2 text-sm font-medium transition-colors rounded-lg ${
                          currency === curr
                            ? 'text-primary bg-primary/20'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {curr === 'THB' ? '฿ THB' : curr === 'RUB' ? '₽ RUB' : '$ USD'}
                      </motion.button>
                      {index < 2 && <span className="text-gray-600">|</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-4 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    >
                      <User className="w-6 h-6" />
                      <span className="text-lg">{user?.name}</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-4 px-4 py-3 mt-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all w-full"
                    >
                      <LogIn className="w-6 h-6" />
                      <span className="text-lg">Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 text-center text-gray-300 hover:text-white transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 mt-2 text-center bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TopNav;