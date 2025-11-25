import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  ArrowRight,
  CreditCard, 
  Truck, 
  MapPin, 
  Phone, 
  Mail, 
  AlertCircle, 
  Check, 
  User,
  Home,
  Calendar,
  Shield,
  Gift,
  Sparkles,
  Clock,
  Package,
  ChevronRight,
  Globe,
  Building,
  Hash,
  Lock,
  Zap,
  Star,
  TrendingUp
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import AnimatedBackground from '../components/common/AnimatedBackground';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedCards] = useState([
    { id: 1, last4: '4242', brand: 'Visa', exp: '12/25' },
    { id: 2, last4: '5555', brand: 'Mastercard', exp: '08/26' }
  ]);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express'>('standard');
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const [formData, setFormData] = useState({
    // Contact Info
    email: '',
    phone: '',
    
    // Delivery Info
    fullName: '',
    address: '',
    apartment: '',
    city: '',
    postalCode: '',
    country: 'Thailand',
    
    // Payment
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    
    // Additional
    saveInfo: true,
    newsletter: false,
    giftMessage: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const deliveryFee = deliveryMethod === 'express' ? 200 : 100;
  const subtotal = getTotalPrice();
  const total = subtotal + deliveryFee;
  const points = Math.floor(total * 0.1); // 10% of total as reward points

  const validateField = (name: string, value: string) => {
    let error = '';
    
    switch (name) {
      case 'email':
        if (!value) error = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'Invalid email';
        break;
      case 'phone':
        if (!value) error = 'Phone is required';
        else if (!/^\+?\d{9,}$/.test(value.replace(/\s/g, ''))) error = 'Invalid phone number';
        break;
      case 'fullName':
        if (!value) error = 'Full name is required';
        break;
      case 'address':
        if (!value) error = 'Address is required';
        break;
      case 'city':
        if (!value) error = 'City is required';
        break;
      case 'postalCode':
        if (!value) error = 'Postal code is required';
        else if (!/^\d{5}$/.test(value)) error = 'Invalid postal code';
        break;
      case 'cardNumber':
        if (!selectedCard && !value) error = 'Card number is required';
        else if (!selectedCard && !/^\d{16}$/.test(value.replace(/\s/g, ''))) error = 'Invalid card number';
        break;
      case 'expiryDate':
        if (!selectedCard && !value) error = 'Expiry date is required';
        else if (!selectedCard && !/^\d{2}\/\d{2}$/.test(value)) error = 'Use MM/YY format';
        break;
      case 'cvv':
        if (!value) error = 'CVV is required';
        else if (!/^\d{3,4}$/.test(value)) error = 'Invalid CVV';
        break;
      case 'cardName':
        if (!selectedCard && !value) error = 'Cardholder name is required';
        break;
    }
    
    setFormErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    
    if (touchedFields[name]) {
      validateField(name, value);
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const canProceedToNext = () => {
    switch (step) {
      case 1:
        return formData.email && formData.phone && !formErrors.email && !formErrors.phone;
      case 2:
        return formData.fullName && formData.address && formData.city && formData.postalCode;
      case 3:
        return (selectedCard || (formData.cardNumber && formData.expiryDate && formData.cardName)) && formData.cvv;
      default:
        return false;
    }
  };

  const handleSubmitOrder = async () => {
    setIsProcessing(true);
    
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setShowSuccessModal(true);
    clearCart();
  };

  const handleSuccessClose = () => {
    navigate('/profile');
  };

  const steps = [
    { id: 1, name: 'Contact', icon: Mail, description: 'Your information' },
    { id: 2, name: 'Delivery', icon: Truck, description: 'Shipping address' },
    { id: 3, name: 'Payment', icon: CreditCard, description: 'Payment method' },
  ];

  const deliveryOptions = [
    {
      id: 'standard',
      name: 'Standard Delivery',
      time: '2-3 business days',
      price: 100,
      icon: Truck,
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: 'express',
      name: 'Express Delivery',
      time: 'Next business day',
      price: 200,
      icon: Zap,
      color: 'from-yellow-400 to-orange-500'
    }
  ];

  const benefits = [
    { icon: Shield, text: 'Secure Payment', color: 'text-blue-400' },
    { icon: Package, text: 'Discreet Packaging', color: 'text-green-400' },
    { icon: Clock, text: 'Fast Processing', color: 'text-yellow-400' },
    { icon: Gift, text: `Earn ${points} Points`, color: 'text-purple-400' },
  ];

  if (items.length === 0 && !showSuccessModal) {
    return (
      <motion.div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackground />
        <div className="text-center relative z-10">
          <Package className="w-24 h-24 mx-auto mb-6 text-gray-600" />
          <h2 className="text-3xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-gray-400 mb-8">Add some items before checkout</p>
          <button
            onClick={() => navigate('/catalog')}
            className="px-8 py-4 gradient-primary text-white rounded-2xl font-semibold hover:shadow-[0_0_30px_rgba(35,192,219,0.5)] transition-all"
          >
            Browse Products
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen relative"
    >
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Gradient Overlays */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-tr from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
      
      {/* Floating particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: -20,
            }}
            transition={{
              duration: Math.random() * 30 + 20,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
              delay: Math.random() * 10,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Cart</span>
            </button>
            
            <h1 className="text-4xl md:text-5xl font-bold gradient-text flex items-center gap-3">
              <Shield className="w-10 h-10" />
              Secure Checkout
            </h1>
            <p className="text-gray-400 mt-2">Complete your order in just a few steps</p>
          </motion.div>

          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-800">
                <motion.div
                  className="h-full gradient-primary"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              
              {/* Steps */}
              <div className="relative flex justify-between">
                {steps.map((s, index) => {
                  const Icon = s.icon;
                  const isActive = step >= s.id;
                  const isCurrent = step === s.id;
                  const isPast = step > s.id;
                  
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col items-center"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          isActive
                            ? 'gradient-primary text-white shadow-lg'
                            : 'bg-gray-800 text-gray-500'
                        }`}
                      >
                        {isPast ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                        
                        {/* Pulse animation for current step */}
                        {isCurrent && (
                          <motion.div
                            className="absolute inset-0 rounded-full gradient-primary"
                            animate={{
                              scale: [1, 1.3, 1],
                              opacity: [0.5, 0, 0.5],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                            }}
                          />
                        )}
                      </motion.div>
                      
                      <div className="mt-2 text-center">
                        <p className={`text-sm font-medium ${
                          isActive ? 'text-white' : 'text-gray-500'
                        }`}>
                          {s.name}
                        </p>
                        <p className="text-xs text-gray-600 hidden md:block">{s.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.text}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="glass-dark rounded-xl p-4 text-center group"
                >
                  <Icon className={`w-6 h-6 ${benefit.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                  <p className="text-xs text-gray-300">{benefit.text}</p>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-dark rounded-3xl p-8 relative overflow-hidden"
                >
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl" />
                  
                  {/* Step 1: Contact Information */}
                  {step === 1 && (
                    <motion.div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                          <Mail className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-semibold">Contact Information</h3>
                          <p className="text-sm text-gray-400">We'll use this to send order updates</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            placeholder="john.doe@example.com"
                            className={`w-full pl-12 pr-4 py-4 bg-white/5 border rounded-xl focus:outline-none transition-all ${
                              formErrors.email && touchedFields.email
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-white/10 focus:border-primary/50'
                            }`}
                          />
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                          {formData.email && !formErrors.email && (
                            <Check className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                          )}
                        </div>
                        {formErrors.email && touchedFields.email && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone Number
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            placeholder="+66 98 765 4321"
                            className={`w-full pl-12 pr-4 py-4 bg-white/5 border rounded-xl focus:outline-none transition-all ${
                              formErrors.phone && touchedFields.phone
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-white/10 focus:border-primary/50'
                            }`}
                          />
                          <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                          {formData.phone && !formErrors.phone && (
                            <Check className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                          )}
                        </div>
                        {formErrors.phone && touchedFields.phone && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                        )}
                      </div>
                      
                      {/* Newsletter opt-in */}
                      <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                        <input
                          type="checkbox"
                          name="newsletter"
                          checked={formData.newsletter}
                          onChange={handleInputChange}
                          className="w-5 h-5 rounded accent-primary"
                        />
                        <div className="flex-1">
                          <p className="font-medium">Subscribe to newsletter</p>
                          <p className="text-sm text-gray-400">Get exclusive offers and product updates</p>
                        </div>
                        <Sparkles className="w-5 h-5 text-primary" />
                      </label>
                      
                      {/* Age Verification */}
                      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-primary font-medium">Age Verification Required</p>
                            <p className="text-xs text-gray-300 mt-1">
                              Valid ID will be required upon delivery to verify you are 21+
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Delivery Information */}
                  {step === 2 && (
                    <motion.div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                          <Truck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-semibold">Delivery Information</h3>
                          <p className="text-sm text-gray-400">Where should we deliver your order?</p>
                        </div>
                      </div>
                      
                      {/* Delivery Method */}
                      <div>
                        <label className="text-sm text-gray-400 mb-3 block">Delivery Method</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {deliveryOptions.map((option) => {
                            const Icon = option.icon;
                            const isSelected = deliveryMethod === option.id;
                            
                            return (
                              <motion.button
                                key={option.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setDeliveryMethod(option.id as 'standard' | 'express')}
                                className={`relative p-6 rounded-xl border-2 transition-all ${
                                  isSelected
                                    ? 'border-primary bg-primary/10'
                                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                                }`}
                              >
                                {isSelected && (
                                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                )}
                                
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-3`}>
                                  <Icon className="w-6 h-6 text-white" />
                                </div>
                                
                                <h4 className="font-semibold mb-1">{option.name}</h4>
                                <p className="text-sm text-gray-400 mb-2">{option.time}</p>
                                <p className="text-lg font-bold gradient-text">฿{option.price}</p>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Full Name
                          </label>
                          <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            placeholder="John Doe"
                            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                            <Home className="w-4 h-4" />
                            Street Address
                          </label>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            placeholder="123/45 Sukhumvit Rd"
                            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Apartment, suite, etc. (optional)
                          </label>
                          <input
                            type="text"
                            name="apartment"
                            value={formData.apartment}
                            onChange={handleInputChange}
                            placeholder="Apartment 4B"
                            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            City
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            placeholder="Bangkok"
                            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            Postal Code
                          </label>
                          <input
                            type="text"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            placeholder="10110"
                            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Country
                          </label>
                          <div className="relative">
                            <select
                              name="country"
                              value={formData.country}
                              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                            >
                              <option value="Thailand">Thailand</option>
                              <option value="USA">United States</option>
                              <option value="UK">United Kingdom</option>
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 transform -translate-y-1/2 rotate-90 w-5 h-5 text-gray-500 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Save info */}
                      <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                        <input
                          type="checkbox"
                          name="saveInfo"
                          checked={formData.saveInfo}
                          onChange={handleInputChange}
                          className="w-5 h-5 rounded accent-primary"
                        />
                        <div className="flex-1">
                          <p className="font-medium">Save delivery information</p>
                          <p className="text-sm text-gray-400">For faster checkout next time</p>
                        </div>
                        <Shield className="w-5 h-5 text-primary" />
                      </label>
                      
                      {/* Gift Message */}
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                          <Gift className="w-4 h-4" />
                          Gift Message (optional)
                        </label>
                        <textarea
                          name="giftMessage"
                          value={formData.giftMessage}
                          onChange={handleInputChange}
                          placeholder="Add a personal message to your order..."
                          rows={3}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors resize-none"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Payment */}
                  {step === 3 && (
                    <motion.div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-semibold">Payment Information</h3>
                          <p className="text-sm text-gray-400">All transactions are secure and encrypted</p>
                        </div>
                      </div>
                      
                      {/* Saved Cards */}
                      {savedCards.length > 0 && (
                        <div>
                          <label className="text-sm text-gray-400 mb-3 block">Saved Cards</label>
                          <div className="space-y-3">
                            {savedCards.map((card) => (
                              <motion.button
                                key={card.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedCard(card.id)}
                                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                                  selectedCard === card.id
                                    ? 'border-primary bg-primary/10'
                                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                                }`}
                              >
                                <CreditCard className="w-6 h-6 text-gray-400" />
                                <div className="flex-1 text-left">
                                  <p className="font-medium">{card.brand} •••• {card.last4}</p>
                                  <p className="text-sm text-gray-400">Expires {card.exp}</p>
                                </div>
                                {selectedCard === card.id && (
                                  <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                )}
                              </motion.button>
                            ))}
                          </div>
                          
                          <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-800"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                              <span className="px-4 bg-darker text-gray-400">Or pay with new card</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* New Card Form */}
                      <motion.div
                        animate={{ opacity: selectedCard ? 0.5 : 1 }}
                        className={selectedCard ? 'pointer-events-none' : ''}
                      >
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Card Number
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="cardNumber"
                              value={formData.cardNumber}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\s/g, '');
                                if (value.length <= 16 && /^\d*$/.test(value)) {
                                  const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                                  handleInputChange({
                                    ...e,
                                    target: { ...e.target, value: formatted }
                                  });
                                }
                              }}
                              onBlur={handleInputBlur}
                              placeholder="1234 5678 9012 3456"
                              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                              disabled={!!selectedCard}
                            />
                            <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Expiry Date
                            </label>
                            <input
                              type="text"
                              name="expiryDate"
                              value={formData.expiryDate}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 4) {
                                  const formatted = value.length >= 2 
                                    ? `${value.slice(0, 2)}/${value.slice(2)}` 
                                    : value;
                                  handleInputChange({
                                    ...e,
                                    target: { ...e.target, value: formatted }
                                  });
                                }
                              }}
                              onBlur={handleInputBlur}
                              placeholder="MM/YY"
                              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                              disabled={!!selectedCard}
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                              <Lock className="w-4 h-4" />
                              CVV
                            </label>
                            <input
                              type="text"
                              name="cvv"
                              value={formData.cvv}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 4) {
                                  handleInputChange(e);
                                }
                              }}
                              onBlur={handleInputBlur}
                              placeholder="123"
                              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            name="cardName"
                            value={formData.cardName}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            placeholder="JOHN DOE"
                            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors uppercase"
                            disabled={!!selectedCard}
                          />
                        </div>
                      </motion.div>
                      
                      {/* Security Badge */}
                      <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                        <Shield className="w-5 h-5 text-green-500" />
                        <p className="text-sm text-green-400">Your payment info is encrypted and secure</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex gap-4 mt-8 relative z-10">
                    {step > 1 && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStep(step - 1)}
                        disabled={isProcessing}
                        className="flex-1 py-4 glass-dark text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300"
                      >
                        Back
                      </motion.button>
                    )}
                    
                    {step < 3 ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStep(step + 1)}
                        disabled={!canProceedToNext()}
                        className="flex-1 py-4 gradient-primary text-white font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(35,192,219,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                      >
                        Continue
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmitOrder}
                        disabled={isProcessing || !canProceedToNext()}
                        className="flex-1 py-4 gradient-primary text-white font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(35,192,219,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                      >
                        {isProcessing ? (
                          <div className="flex items-center justify-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Sparkles className="w-5 h-5" />
                            </motion.div>
                            <span>Processing...</span>
                          </div>
                        ) : (
                          <span>Complete Order • ฿{total.toLocaleString()}</span>
                        )}
                        
                        {/* Loading bar */}
                        {isProcessing && (
                          <motion.div
                            className="absolute bottom-0 left-0 h-1 bg-white/30"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 3 }}
                          />
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Order Summary - Sticky Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:sticky lg:top-8 h-fit space-y-6"
            >
              {/* Summary Card */}
              <div className="glass-dark p-6 rounded-2xl space-y-6 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full filter blur-3xl" />
                
                <h3 className="text-xl font-semibold relative z-10 flex items-center gap-2">
                  <Package className="w-6 h-6 text-primary" />
                  Order Summary
                </h3>
                
                {/* Items */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto relative z-10">
                  {items.map((item) => (
                    <motion.div
                      key={`${item.id}-${item.strain}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 p-3 rounded-xl bg-white/5"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {item.quantity}x • {item.strain || item.type}
                        </p>
                        <p className="text-sm font-semibold mt-1">฿{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Totals */}
                <div className="space-y-3 pt-4 border-t border-white/10 relative z-10">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal</span>
                    <span>฿{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-2">
                      {deliveryMethod === 'express' ? (
                        <Zap className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <Truck className="w-4 h-4 text-blue-500" />
                      )}
                      Delivery
                    </span>
                    <span>฿{deliveryFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tax</span>
                    <span>Included</span>
                  </div>
                  
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg">Total</span>
                      <div className="text-right">
                        <p className="text-3xl font-bold gradient-text">
                          ฿{total.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Including all taxes
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Points Earned */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-medium">Points Earned</span>
                    </div>
                    <span className="text-sm font-bold text-yellow-500">+{points}</span>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-dark p-6 rounded-2xl"
              >
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Shop with Confidence
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-sm text-gray-300">SSL Encrypted Checkout</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-300">Secure Payment Processing</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Package className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className="text-sm text-gray-300">Discreet Packaging</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-yellow-500" />
                    </div>
                    <p className="text-sm text-gray-300">Track Your Order</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-dark p-8 rounded-3xl max-w-md w-full text-center relative overflow-hidden"
            >
              {/* Confetti animation */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-primary rounded-full"
                    initial={{
                      x: '50%',
                      y: '50%',
                    }}
                    animate={{
                      x: `${Math.random() * 100}%`,
                      y: '-100%',
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.05,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </div>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-24 h-24 mx-auto mb-6 rounded-full gradient-primary flex items-center justify-center"
              >
                <Check className="w-12 h-12 text-white" />
              </motion.div>
              
              <h2 className="text-3xl font-bold mb-4">Order Confirmed!</h2>
              <p className="text-gray-400 mb-6">
                Thank you for your order. We'll send you tracking information once your order ships.
              </p>
              
              <div className="glass-dark p-4 rounded-xl mb-6">
                <p className="text-sm text-gray-400 mb-1">Order Number</p>
                <p className="text-xl font-mono font-bold gradient-text">#CHI-2024-{Math.floor(Math.random() * 1000)}</p>
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-8">
                <Star className="w-5 h-5 text-yellow-500" />
                <p className="text-sm">You earned <span className="font-bold text-yellow-500">{points} points</span> with this order!</p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSuccessClose}
                className="w-full py-4 gradient-primary text-white font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(35,192,219,0.5)] transition-all"
              >
                View Order Details
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Checkout;