import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Trash2, 
  Tag, 
  Package,
  Plus,
  Minus,
  X,
  CheckCircle,
  Sparkles,
  MessageCircle,
  Phone,
  Send,
  AlertCircle,
  Loader,
  Info,
  Leaf,
  LogIn,
  MapPin
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useCurrencyStore } from '../store/currencyStore';
import { formatPrice, getPriceForCurrency } from '../utils/currency';
import AnimatedBackground from '../components/common/AnimatedBackground';
import MapModal from '../components/map/MapModal';
import api from '../services/api';
import toast from 'react-hot-toast';

// Иконки для способов связи
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
  </svg>
);

interface ContactMethod {
  type: 'whatsapp' | 'telegram' | 'phone';
  enabled: boolean;
}

interface StrainInfo {
  name: string;
  type: string;
  description?: string;
  thc_content?: string;
  cbd_content?: string;
  terpenes?: string;
  aroma_taste?: string;
  effects?: string;
}

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { currency } = useCurrencyStore();

  const [promoCode, setPromoCode] = useState('');
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedStrainInfo, setSelectedStrainInfo] = useState<StrainInfo | null>(null);
  const [showStrainModal, setShowStrainModal] = useState(false);
  const [loadingStrain, setLoadingStrain] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [contactMethods, setContactMethods] = useState<ContactMethod[]>([
    { type: 'whatsapp', enabled: false },
    { type: 'telegram', enabled: false },
    { type: 'phone', enabled: false }
  ]);
  
  const [contactInfo, setContactInfo] = useState({
    whatsapp: '',
    telegram: '',
    phone: ''
  });

  // Новые состояния для адреса и карты
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCoordinates, setDeliveryCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);

  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>('');

  // Проверка авторизации при загрузке
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const token = localStorage.getItem('token');
    console.log('=== CART AUTH CHECK ===');
    console.log('User:', user);
    console.log('Token exists:', !!token);
    console.log('Is authenticated:', isAuthenticated);
    console.log('=====================');
  }, [user, isAuthenticated]);

  const subtotal = items.reduce((sum, item) => {
    const price = getPriceForCurrency(item.product, currency);
    return sum + price * item.quantity;
  }, 0);
  const discountAmount = subtotal * discount;
  const total = subtotal - discountAmount;
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Функция для извлечения координат из ссылки Google Maps
  const extractCoordinatesFromGoogleMapsUrl = (url: string): { lat: number; lng: number } | null => {
    try {
      const patterns = [
        /@(-?\d+\.\d+),(-?\d+\.\d+)/,
        /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
        /\/place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/,
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return {
            lat: parseFloat(match[1]),
            lng: parseFloat(match[2])
          };
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  // Обработка выбора локации на карте
  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setDeliveryAddress(location.address);
    setDeliveryCoordinates({ lat: location.lat, lng: location.lng });
    toast.success('Location selected!');
  };

  // Обработка ввода адреса
  const handleAddressInputChange = (value: string) => {
    setDeliveryAddress(value);
    
    if (value.includes('google.com/maps') || value.includes('goo.gl/maps')) {
      const coords = extractCoordinatesFromGoogleMapsUrl(value);
      if (coords) {
        setDeliveryCoordinates(coords);
        toast.success('Coordinates extracted from Google Maps link!');
      }
    }
  };

  const handleApplyPromo = async () => {
    const code = promoCode.toUpperCase().trim();

    if (!code) {
      toast.error('Please enter a promo code');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsValidatingPromo(true);

    try {
      const productIds = items.map(item => parseInt(item.product.id));

      const response = await api.post('/admin/promo-codes/validate', {
        code,
        cart_total: subtotal,
        product_ids: productIds,
        currency: currency
      });

      if (response.data.valid) {
        setIsPromoApplied(true);
        setAppliedPromoCode(code);
        setDiscount(response.data.discount / subtotal);
        toast.success(`Promo code applied! Save ฿${response.data.discount.toLocaleString()} 🎉`);
      } else {
        toast.error(response.data.message || 'Invalid promo code');
      }
    } catch (error: any) {
      console.error('Promo validation error:', error);
      toast.error(error.response?.data?.message || 'Failed to validate promo code');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const toggleContactMethod = (type: 'whatsapp' | 'telegram' | 'phone') => {
    setContactMethods(prev => 
      prev.map(method => 
        method.type === type ? { ...method, enabled: !method.enabled } : method
      )
    );
  };

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return <WhatsAppIcon />;
      case 'telegram':
        return <TelegramIcon />;
      case 'phone':
        return <Phone className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getContactColor = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return 'from-green-500 to-green-600';
      case 'telegram':
        return 'from-blue-500 to-blue-600';
      case 'phone':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const handleShowStrainInfo = async (strainName: string) => {
    setLoadingStrain(true);
    setShowStrainModal(true);

    try {
      const response = await api.get('/admin/strains');
      const strains = response.data.strains || response.data;
      const strain = strains.find((s: any) => s.name === strainName);

      if (strain) {
        setSelectedStrainInfo(strain);
      } else {
        setSelectedStrainInfo({
          name: strainName,
          type: 'Unknown',
          description: 'No additional information available for this strain.'
        });
      }
    } catch (error) {
      console.error('Failed to load strain info:', error);
      setSelectedStrainInfo({
        name: strainName,
        type: 'Unknown',
        description: 'Could not load strain information. Please try again later.'
      });
    } finally {
      setLoadingStrain(false);
    }
  };

  const validateOrder = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return false;
    }

    if (!isAuthenticated || !user) {
      setShowLoginModal(true);
      return false;
    }

    const enabledMethods = contactMethods.filter(m => m.enabled);
    if (enabledMethods.length === 0) {
      toast.error('Please select at least one contact method');
      return false;
    }

    for (const method of enabledMethods) {
      const value = contactInfo[method.type];
      if (!value || value.trim() === '') {
        toast.error(`Please enter your ${method.type} contact`);
        return false;
      }
    }

    // Проверка адреса
    if (!deliveryAddress || deliveryAddress.trim() === '') {
      toast.error('Please enter your delivery address');
      return false;
    }

    return true;
  };

  const canPlaceOrder = () => {
    if (!isAuthenticated || !user) return false;
    
    const enabledMethods = contactMethods.filter(m => m.enabled);
    if (enabledMethods.length === 0) return false;
    
    for (const method of enabledMethods) {
      const value = contactInfo[method.type];
      if (!value || value.trim() === '') return false;
    }

    // Проверка адреса
    if (!deliveryAddress || deliveryAddress.trim() === '') return false;
    
    return items.length > 0;
  };

const handlePlaceOrder = async () => {
  if (!validateOrder()) return;

  setIsProcessing(true);

  try {
    const enabledContacts = contactMethods
      .filter(m => m.enabled)
      .map(m => ({
        type: m.type,
        value: contactInfo[m.type]
      }));
    
    const orderData = {
      items: items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: getPriceForCurrency(item.product, currency),
        type: item.product.type,
        strain: item.strain,
        size: item.product.size
      })),
      subtotal,
      discount_amount: discountAmount,
      delivery_fee: 0,
      total,
      currency: currency,
      promo_code: isPromoApplied ? appliedPromoCode : undefined,
      contact_methods: enabledContacts,
      delivery_address: deliveryAddress,
      delivery_city: '',
      delivery_postal_code: '',
      delivery_country: 'Thailand',
      delivery_coordinates: deliveryCoordinates ? {
        lat: deliveryCoordinates.lat,
        lng: deliveryCoordinates.lng,
        googleMapsLink: `https://www.google.com/maps?q=${deliveryCoordinates.lat},${deliveryCoordinates.lng}`
      } : null,
      gift_message: null,
      notes: null
    };
  
    // Create order in database (will also send Telegram notification)
    const response = await api.post('/orders', orderData);
  
    if (response.data.success) {
      setShowSuccess(true);
      
      toast.success('Order placed successfully!');
      
      setTimeout(() => {
        clearCart();
        navigate('/');
      }, 3000);
    } else {
      throw new Error(response.data.message || 'Failed to create order');
    }
  
  } catch (error: any) {
    console.error('Order error:', error);
    toast.error(error.response?.data?.message || error.message || 'Failed to place order. Please try again.');
  } finally {
    setIsProcessing(false);
  }
};

  const getStrainTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'sativa':
        return 'from-yellow-400 to-orange-500';
      case 'indica':
        return 'from-purple-400 to-indigo-600';
      case 'hybrid':
        return 'from-green-400 to-teal-500';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen relative bg-black">
      <AnimatedBackground />
      
      {/* Map Modal */}
      <MapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onSelectLocation={handleLocationSelect}
        initialLocation={deliveryCoordinates || undefined}
      />
      
      {/* Login Required Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowLoginModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-dark p-8 rounded-3xl max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <LogIn className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Login Required</h3>
                <p className="text-gray-400">
                  You need to be logged in to place an order. Please login or create an account to continue.
                </p>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/login', { state: { from: '/cart' } })}
                  className="w-full py-3 bg-gradient-to-r from-primary to-secondary rounded-xl font-semibold transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register', { state: { from: '/cart' } })}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors"
                >
                  Create Account
                </button>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Strain Info Modal */}
      <AnimatePresence>
        {showStrainModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowStrainModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-dark p-6 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              {loadingStrain ? (
                <div className="text-center py-12">
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-gray-400">Loading strain information...</p>
                </div>
              ) : selectedStrainInfo ? (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getStrainTypeColor(selectedStrainInfo.type)} flex items-center justify-center`}>
                        <Leaf className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedStrainInfo.name}</h2>
                        <p className="text-gray-400">{selectedStrainInfo.type}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowStrainModal(false)}
                      className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {selectedStrainInfo.description && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Description</h3>
                        <p className="text-white">{selectedStrainInfo.description}</p>
                      </div>
                    )}

                    {(selectedStrainInfo.thc_content || selectedStrainInfo.cbd_content) && (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedStrainInfo.thc_content && (
                          <div className="glass-dark p-4 rounded-xl">
                            <div className="text-sm text-gray-400 mb-1">THC Content</div>
                            <div className="text-xl font-bold text-green-400">{selectedStrainInfo.thc_content}</div>
                          </div>
                        )}
                        {selectedStrainInfo.cbd_content && (
                          <div className="glass-dark p-4 rounded-xl">
                            <div className="text-sm text-gray-400 mb-1">CBD Content</div>
                            <div className="text-xl font-bold text-blue-400">{selectedStrainInfo.cbd_content}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedStrainInfo.terpenes && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Terpenes</h3>
                        <p className="text-white">{selectedStrainInfo.terpenes}</p>
                      </div>
                    )}

                    {selectedStrainInfo.aroma_taste && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Aroma & Taste</h3>
                        <p className="text-white">{selectedStrainInfo.aroma_taste}</p>
                      </div>
                    )}

                    {selectedStrainInfo.effects && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Effects</h3>
                        <p className="text-white">{selectedStrainInfo.effects}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">Strain information not available</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-dark p-8 rounded-3xl max-w-md w-full text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              
              <h3 className="text-2xl font-bold mb-2">Order Placed! 🎉</h3>
              <p className="text-gray-400 mb-6">
                We've received your order and will contact you shortly via your preferred method.
              </p>
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Redirecting to home...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Cart Modal */}
      <AnimatePresence>
        {showClearModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowClearModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-dark p-8 rounded-3xl max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Clear Cart?</h3>
                <p className="text-gray-400">
                  Are you sure you want to remove all items from your cart?
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    clearCart();
                    setShowClearModal(false);
                    toast.success('Cart cleared');
                  }}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-semibold transition-colors"
                >
                  Clear Cart
                </button>
                <button
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 pt-32 pb-24 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/catalog')}
              className="w-12 h-12 rounded-xl glass-dark flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            
            <div>
              <h1 className="text-3xl font-bold gradient-text">Shopping Cart</h1>
              <p className="text-gray-400 text-sm mt-1">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
              </p>
            </div>
          </div>
          
          {items.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowClearModal(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 hover:bg-red-400/10 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </motion.button>
          )}
        </motion.div>

        {/* Auth Warning */}
        {!isAuthenticated && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-orange-400 font-medium">Login required to place order</p>
              <p className="text-orange-400/80 text-sm">Please login or create an account to checkout</p>
            </div>
            <button
              onClick={() => navigate('/login', { state: { from: '/cart' } })}
              className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-xl text-orange-400 font-medium transition-colors"
            >
              Login
            </button>
          </motion.div>
        )}

        {items.length === 0 ? (
          // Empty State
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <ShoppingBag className="w-16 h-16 text-gray-600" />
            </div>
            
            <h2 className="text-3xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-gray-400 mb-8">
              Start shopping to add items to your cart
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/catalog')}
              className="px-8 py-4 bg-gradient-to-r from-primary to-secondary rounded-xl font-semibold"
            >
              Browse Products
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, index) => (
                <motion.div
                  key={`${item.id}-${item.strain}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-dark rounded-2xl p-4 md:p-6 border border-white/10"
                >
                  <div className="flex gap-4">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-lg truncate">{item.product.name}</h3>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeItem(item.id)}
                          className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      </div>
                      
                      {item.strain && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-sm text-gray-400">Strain: {item.strain}</span>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleShowStrainInfo(item.strain!)}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-xs font-medium"
                          >
                            <Info className="w-3 h-3" />
                            <span>Strain Info</span>
                          </motion.button>
                        </div>
                      )}
                      
                      {item.product.size && (
                        <div className="flex items-center gap-2 mb-3">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">Size: {item.product.size}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </motion.button>
                          <span className="w-12 text-center font-semibold">{item.quantity}</span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </motion.button>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {formatPrice(
                              (item.product.price || 0) * item.quantity,
                              (item.product.price_rub || 0) * item.quantity,
                              (item.product.price_usd || 0) * item.quantity,
                              currency
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatPrice(
                              item.product.price,
                              item.product.price_rub,
                              item.product.price_usd,
                              currency
                            )} each
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Summary & Contact */}
            <div className="space-y-6">
              {/* Promo Code */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-dark rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Promo Code</h3>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    disabled={isPromoApplied}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isPromoApplied) {
                        handleApplyPromo();
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-white/5 rounded-xl border border-white/10 focus:border-primary/50 transition-colors disabled:opacity-50 uppercase"
                    maxLength={20}
                  />
                  {isPromoApplied ? (
                    <button
                      onClick={() => {
                        setIsPromoApplied(false);
                        setDiscount(0);
                        setPromoCode('');
                        setAppliedPromoCode('');
                        toast.success('Promo code removed');
                      }}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleApplyPromo}
                      disabled={isValidatingPromo || !promoCode.trim()}
                      className="px-6 py-2 bg-primary/20 text-primary rounded-xl hover:bg-primary/30 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isValidatingPromo ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        'Apply'
                      )}
                    </motion.button>
                  )}
                </div>
                
                {isPromoApplied && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm text-green-400 font-medium">
                        {appliedPromoCode} applied
                      </span>
                      <div className="text-xs text-green-400/80 mt-0.5">
                        Save ฿{discountAmount.toLocaleString()}
                      </div>
                    </div>
                  </motion.div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  Enter your promotional code to receive a discount
                </p>
              </motion.div>

              {/* Contact Methods */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-dark rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Contact Method *</h3>
                </div>
                
                <p className="text-sm text-gray-400 mb-4">
                  Select how we should contact you (choose at least one)
                </p>
                
                <div className="space-y-3 mb-4">
                  {contactMethods.map((method) => (
                    <motion.button
                      key={method.type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleContactMethod(method.type)}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        method.enabled
                          ? 'border-primary bg-primary/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getContactColor(method.type)} flex items-center justify-center text-white`}>
                          {getContactIcon(method.type)}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold capitalize">{method.type}</div>
                          <div className="text-xs text-gray-400">
                            {method.type === 'whatsapp' && 'Message via WhatsApp'}
                            {method.type === 'telegram' && 'Message via Telegram'}
                            {method.type === 'phone' && 'Call or SMS'}
                          </div>
                        </div>
                        {method.enabled && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
                
                <AnimatePresence>
                  {contactMethods.some(m => m.enabled) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 pt-4 border-t border-white/10"
                    >
                      {contactMethods.filter(m => m.enabled).map((method) => (
                        <div key={`input-${method.type}`}>
                          <label className="text-sm text-gray-400 mb-2 block capitalize">
                            {method.type} {method.type === 'whatsapp' || method.type === 'telegram' ? 'Username/Number' : 'Number'}
                          </label>
                          <input
                            type="text"
                            value={contactInfo[method.type]}
                            onChange={(e) => setContactInfo({
                              ...contactInfo,
                              [method.type]: e.target.value
                            })}
                            placeholder={
                              method.type === 'whatsapp' ? '+66 123 456 789' :
                              method.type === 'telegram' ? '@username' :
                              '+66 123 456 789'
                            }
                            className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-primary/50 transition-colors"
                          />
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Delivery Address Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="glass-dark rounded-2xl p-6 border border-white/10"
              >
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Delivery Address *
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Enter address or Google Maps link
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => handleAddressInputChange(e.target.value)}
                        placeholder="Paste Google Maps link or enter address..."
                        className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-primary/50 transition-colors pr-12"
                      />
                      {deliveryCoordinates && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                      )}
                    </div>
                    
                    {deliveryCoordinates && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-xs text-green-400 mt-2 flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Coordinates detected: {deliveryCoordinates.lat.toFixed(4)}, {deliveryCoordinates.lng.toFixed(4)}
                      </motion.p>
                    )}
                  </div>
                  
                  <div className="pt-3 border-t border-white/10">
                    <button
                      onClick={() => setShowMapModal(true)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-primary/20 to-secondary/20 hover:from-primary/30 hover:to-secondary/30 rounded-xl border border-primary/30 transition-all flex items-center justify-center gap-2 group"
                    >
                      <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Select on Map</span>
                    </button>
                    
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Or click here to choose your location on an interactive map
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-dark rounded-2xl p-6 border border-white/10 sticky top-32"
              >
                <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal ({itemCount} items)</span>
                    <span>{formatPrice(subtotal, subtotal, subtotal, currency)}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount</span>
                      <span>-{formatPrice(discountAmount, discountAmount, discountAmount, currency)}</span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-white/10 flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(total, total, total, currency)}</span>
                  </div>
                </div>
                
                <motion.button
                  whileHover={canPlaceOrder() ? { scale: 1.02 } : {}}
                  whileTap={canPlaceOrder() ? { scale: 0.98 } : {}}
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || !canPlaceOrder()}
                  className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
                    canPlaceOrder() && !isProcessing
                      ? 'bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_30px_rgba(35,192,219,0.5)] cursor-pointer'
                      : 'bg-gray-700 cursor-not-allowed opacity-50'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : !isAuthenticated ? (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Login Required</span>
                    </>
                  ) : !canPlaceOrder() ? (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      <span>Complete All Fields</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Place Order</span>
                    </>
                  )}
                </motion.button>
                
                <p className="text-xs text-gray-500 text-center mt-4">
                  {isAuthenticated 
                    ? "We'll contact you via your selected method to confirm your order"
                    : "Please login to place your order"}
                </p>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;