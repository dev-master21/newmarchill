// src/pages/Profile.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Package, 
  Award, 
  Settings, 
  LogOut, 
  Edit2, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Heart,
  Shield,
  CreditCard,
  Gift,
  Star,
  Zap,
  Trophy,
  Check,
  Clock,
  Lock,
  Smartphone,
  ChevronRight,
  Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AnimatedBackground from '../components/common/AnimatedBackground';
import authService from '../services/auth.service';
import orderService from '../services/order.service';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  
  // User data state - инициализируем из store
  const [userData, setUserData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    postal_code: user?.postal_code || '',
    country: user?.country || 'Thailand',
    points: user?.points || 0,
    level: user?.level || 'Bronze',
    avatar: user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U',
    created_at: user?.created_at || new Date().toISOString()
  });

  // Temporary edit state
  const [editData, setEditData] = useState({ ...userData });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Загружаем данные пользователя при монтировании
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    loadUserData();
    loadAchievements();
    loadRecentOrders();
  }, [user]);

  // Обновляем аватар при изменении имени
  useEffect(() => {
    if (editData.name) {
      const newAvatar = editData.name.split(' ').map(n => n[0]).join('').toUpperCase();
      setEditData(prev => ({ ...prev, avatar: newAvatar }));
    }
  }, [editData.name]);

  // Загрузка данных профиля
  const loadUserData = async () => {
    try {
      const profileData = await authService.getProfile();
      const updatedData = {
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        city: profileData.city || '',
        postal_code: profileData.postal_code || '',
        country: profileData.country || 'Thailand',
        points: profileData.points || 0,
        level: profileData.level || 'Bronze',
        avatar: profileData.name ? profileData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U',
        created_at: profileData.created_at || new Date().toISOString()
      };
      setUserData(updatedData);
      setEditData(updatedData);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  // Загрузка достижений
  const loadAchievements = async () => {
    try {
      const data = await authService.getAchievements();
      setAchievements(data);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  };

  // Загрузка последних заказов
  const loadRecentOrders = async () => {
    try {
      const { orders } = await orderService.getOrders({ limit: 5 });
      setRecentOrders(orders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  // Рассчитываем прогресс до следующего уровня
  const calculateProgress = () => {
    const levels = {
      Bronze: { min: 0, max: 2000 },
      Silver: { min: 2000, max: 5000 },
      Gold: { min: 5000, max: 10000 },
      Platinum: { min: 10000, max: 99999 }
    };

    const currentLevel = levels[userData.level as keyof typeof levels];
    if (!currentLevel) return { progress: 0, nextLevel: 'Silver', pointsToNext: 2000 };

    const progress = ((userData.points - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100;
    const nextLevel = userData.level === 'Platinum' ? 'Platinum' : 
                     userData.level === 'Gold' ? 'Platinum' :
                     userData.level === 'Silver' ? 'Gold' : 'Silver';
    const pointsToNext = currentLevel.max - userData.points;

    return { progress: Math.min(progress, 100), nextLevel, pointsToNext };
  };

  const { progress, nextLevel, pointsToNext } = calculateProgress();

  // Функция для начала редактирования
  const handleStartEditing = () => {
    setIsEditing(true);
    // Если находимся не на вкладке Overview, переключаемся на неё
    if (activeTab !== 'overview') {
      setActiveTab('overview');
    }
  };

  // Сохранение профиля
  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        name: editData.name,
        phone: editData.phone,
        address: editData.address,
        city: editData.city,
        postal_code: editData.postal_code,
        country: editData.country
      });
      
      setUserData(editData);
      setIsEditing(false);
      toast.success('Profile updated successfully!', {
        style: {
          borderRadius: '12px',
          background: '#18181B',
          color: '#fff',
          border: '1px solid rgba(35, 192, 219, 0.3)',
        },
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile', {
        style: {
          borderRadius: '12px',
          background: '#18181B',
          color: '#fff',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData({ ...userData });
    setIsEditing(false);
  };

  // Смена пароля
  const handlePasswordChange = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast.error('Passwords do not match!', {
        style: {
          borderRadius: '12px',
          background: '#18181B',
          color: '#fff',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        },
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await authService.changePassword(passwordData.current, passwordData.new);
      setShowPasswordModal(false);
      setPasswordData({ current: '', new: '', confirm: '' });
      toast.success('Password changed successfully!', {
        style: {
          borderRadius: '12px',
          background: '#18181B',
          color: '#fff',
          border: '1px solid rgba(35, 192, 219, 0.3)',
        },
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to change password', {
        style: {
          borderRadius: '12px',
          background: '#18181B',
          color: '#fff',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully!', {
      style: {
        borderRadius: '12px',
        background: '#18181B',
        color: '#fff',
        border: '1px solid rgba(35, 192, 219, 0.3)',
      },
    });
  };

  // Форматирование даты регистрации
  const formatJoinDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleEnable2FA = () => {
    if (verificationCode === '123456') { // Simulated verification
      setTwoFAEnabled(true);
      setShow2FAModal(false);
      setVerificationCode('');
      toast.success('Two-factor authentication enabled!', {
        style: {
          borderRadius: '12px',
          background: '#18181B',
          color: '#fff',
          border: '1px solid rgba(35, 192, 219, 0.3)',
        },
      });
    } else {
      toast.error('Invalid verification code', {
        style: {
          borderRadius: '12px',
          background: '#18181B',
          color: '#fff',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        },
      });
    }
  };

  // Achievement Icons
  const achievementIcons: Record<string, any> = {
    'First Purchase': Package,
    'Gold Member': Award,
    'Loyal Customer': Heart,
    'Big Spender': CreditCard,
    'Early Adopter': Clock,
    'Verified': Shield,
    'Referrer': Gift,
    'VIP': Star
  };

  // Tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const statusColors: Record<string, string> = {
    delivered: 'from-green-500 to-emerald-600',
    processing: 'from-yellow-500 to-orange-600',
    shipped: 'from-blue-500 to-cyan-600',
    pending: 'from-gray-500 to-gray-600',
    cancelled: 'from-red-500 to-rose-600'
  };

  // Если пользователь не авторизован
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Gradient Overlays */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
      
      <div className="relative z-10 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Compact Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-bold gradient-text">My Account</h1>
            <p className="text-sm text-gray-400 mt-1">Manage your profile and rewards</p>
          </motion.div>

          {/* Compact User Card */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-effect p-5 mb-6 relative overflow-hidden"
          >
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
            
            <div className="relative flex items-center gap-4">
              {/* Compact Avatar */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {isEditing ? editData.avatar : userData.avatar}
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-[10px] font-bold text-white shadow-md"
                >
                  {userData.level}
                </motion.div>
              </motion.div>
              
              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{userData.name}</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleStartEditing}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </motion.button>
                </div>
                <p className="text-sm text-gray-400">{userData.email}</p>
                
                {/* Compact Progress */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Progress to {nextLevel}</span>
                    <span className="text-xs font-bold text-primary">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-primary to-secondary relative"
                    >
                      <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      />
                    </motion.div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{pointsToNext} points to next level</p>
                </div>
              </div>
              
              {/* Compact Stats */}
              <div className="flex gap-3">
                <div className="text-center">
                  <motion.p 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.3 }}
                    className="text-xl font-bold gradient-text"
                  >
                    {userData.points}
                  </motion.p>
                  <p className="text-xs text-gray-500">Points</p>
                </div>
                <div className="text-center">
                  <motion.p 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.4 }}
                    className="text-xl font-bold"
                  >
                    {recentOrders.length}
                  </motion.p>
                  <p className="text-xs text-gray-500">Orders</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Compact Tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-2 mb-4 overflow-x-auto no-scrollbar"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                      : 'hover:bg-white/10 text-gray-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium hidden sm:block">{tab.label}</span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              >
                {/* Contact Info - Compact */}
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="glass-effect p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Contact Information
                    </h3>
                    {!isEditing && (
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                      </motion.button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {/* Name field - теперь редактируемое */}
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0 }}
                      className="group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs text-gray-500">Name</span>
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary/50 transition-colors text-sm"
                          placeholder="Your name"
                        />
                      ) : (
                        <p className="text-sm pl-5 group-hover:text-primary transition-colors">{userData.name}</p>
                      )}
                    </motion.div>

                    {[
                      { icon: Mail, label: 'Email', value: userData.email, key: 'email' },
                      { icon: Phone, label: 'Phone', value: userData.phone || 'Not provided', key: 'phone' },
                      { icon: MapPin, label: 'Address', value: userData.address || 'Not provided', key: 'address' },
                    ].map((item, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (index + 1) * 0.1 }}
                        className="group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <item.icon className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-xs text-gray-500">{item.label}</span>
                        </div>
                        {isEditing ? (
                          <input
                            type={item.key === 'email' ? 'email' : 'text'}
                            value={editData[item.key as keyof typeof editData]}
                            onChange={(e) => setEditData({ ...editData, [item.key]: e.target.value })}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary/50 transition-colors text-sm"
                            disabled={item.key === 'email'} // Email нельзя менять
                            placeholder={item.key === 'phone' ? 'Phone number' : item.key === 'address' ? 'Address' : ''}
                          />
                        ) : (
                          <p className="text-sm pl-5 group-hover:text-primary transition-colors">{item.value}</p>
                        )}
                      </motion.div>
                    ))}
                    
                    {/* Additional fields when editing */}
                    {isEditing && (
                      <>
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                          className="group"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-xs text-gray-500">City</span>
                          </div>
                          <input
                            type="text"
                            value={editData.city}
                            onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary/50 transition-colors text-sm"
                            placeholder="City"
                          />
                        </motion.div>
                        
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 }}
                          className="group"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-xs text-gray-500">Postal Code</span>
                          </div>
                          <input
                            type="text"
                            value={editData.postal_code}
                            onChange={(e) => setEditData({ ...editData, postal_code: e.target.value })}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary/50 transition-colors text-sm"
                            placeholder="Postal Code"
                          />
                        </motion.div>
                      </>
                    )}
                    
                    <div className="flex items-center gap-2 mb-1 mt-4">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs text-gray-500">Member Since</span>
                    </div>
                    <p className="text-sm pl-5">{formatJoinDate(userData.created_at)}</p>
                  </div>
                  
                  {/* Edit Actions */}
                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2 mt-4"
                    >
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className="flex-1 py-2 gradient-primary text-white text-sm font-medium rounded-lg disabled:opacity-50"
                      >
                        {isLoading ? <Loader className="w-4 h-4 mx-auto animate-spin" /> : 'Save Changes'}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCancelEdit}
                        className="flex-1 py-2 bg-white/10 text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
                      >
                        Cancel
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>

                {/* Achievements - Compact */}
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="glass-effect p-5"
                >
                  <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 text-primary" />
                    Achievements
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {achievements.slice(0, 6).map((achievement, index) => {
                      const Icon = achievementIcons[achievement.achievement_type] || Award;
                      return (
                        <motion.div
                          key={index}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.1 }}
                          className="relative group"
                        >
                          <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center hover:from-primary/30 hover:to-secondary/30 transition-all">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-black/90 px-2 py-1 rounded text-xs whitespace-nowrap">
                              {achievement.achievement_type}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-4">
                    {achievements.length} of 12 achievements unlocked
                  </p>
                </motion.div>
              </motion.div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-3"
              >
                {recentOrders.length > 0 ? (
                  recentOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                      className="glass-effect p-4 cursor-pointer"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{order.order_number}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">฿{order.total.toFixed(2)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${statusColors[order.status] || statusColors.pending} text-white`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">No orders yet</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/catalog')}
                      className="mt-4 px-6 py-2 gradient-primary text-white rounded-lg text-sm"
                    >
                      Start Shopping
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Rewards Tab */}
            {activeTab === 'rewards' && (
              <motion.div
                key="rewards"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="glass-effect p-5"
                >
                  <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-primary" />
                    Points Balance
                  </h3>
                  <p className="text-3xl font-bold gradient-text mb-2">{userData.points}</p>
                  <p className="text-sm text-gray-400">Available Points</p>
                  
                  <div className="mt-4 p-3 bg-primary/10 rounded-xl">
                    <p className="text-xs text-primary font-medium">Next Milestone</p>
                    <p className="text-sm font-bold">{nextLevel} - {pointsToNext} points away</p>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="glass-effect p-5"
                >
                  <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
                    <Gift className="w-4 h-4 text-primary" />
                    Benefits
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-3 h-3 text-green-500" />
                      <span>Free delivery on orders over ฿1,500</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-3 h-3 text-green-500" />
                      <span>Exclusive member discounts</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-3 h-3 text-green-500" />
                      <span>Early access to new products</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-3 h-3 text-green-500" />
                      <span>Birthday rewards</span>
                    </li>
                  </ul>
                </motion.div>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Security Settings */}
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="glass-effect p-5"
                >
                  <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-primary" />
                    Security
                  </h3>
                  
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ x: 5 }}
                      onClick={() => setShowPasswordModal(true)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4 text-gray-400" />
                        <div className="text-left">
                          <p className="text-sm font-medium">Change Password</p>
                          <p className="text-xs text-gray-500">Update your account password</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ x: 5 }}
                      onClick={() => setShow2FAModal(true)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-4 h-4 text-gray-400" />
                        <div className="text-left">
                          <p className="text-sm font-medium">Two-Factor Authentication</p>
                          <p className="text-xs text-gray-500">
                            {twoFAEnabled ? 'Enabled' : 'Add extra security to your account'}
                          </p>
                        </div>
                      </div>
                      {twoFAEnabled ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-500">Active</span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </motion.button>
                  </div>
                </motion.div>

                {/* Logout Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all flex items-center justify-center gap-2 text-red-500"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Sign Out</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-dark p-6 rounded-2xl max-w-md w-full"
            >
              <h3 className="text-xl font-bold mb-4">Change Password</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.current}
                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">New Password</label>
                  <input
                    type="password"
                    value={passwordData.new}
                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePasswordChange}
                  disabled={isLoading}
                  className="flex-1 py-3 gradient-primary text-white font-medium rounded-xl disabled:opacity-50"
                >
                  {isLoading ? <Loader className="w-4 h-4 mx-auto animate-spin" /> : 'Update Password'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-3 bg-white/10 font-medium rounded-xl hover:bg-white/20 transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2FA Modal */}
      <AnimatePresence>
        {show2FAModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShow2FAModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-dark p-6 rounded-2xl max-w-md w-full"
            >
              <h3 className="text-xl font-bold mb-4">Enable Two-Factor Authentication</h3>
              
              <div className="text-center mb-6">
                <div className="w-32 h-32 mx-auto mb-4 bg-white p-4 rounded-xl">
                  {/* QR Code placeholder */}
                  <div className="w-full h-full bg-gray-300 rounded"></div>
                </div>
                <p className="text-sm text-gray-400">
                  Scan this QR code with your authenticator app
                </p>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEnable2FA}
                  className="flex-1 py-3 gradient-primary text-white font-medium rounded-xl"
                >
                  Enable 2FA
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShow2FAModal(false)}
                  className="flex-1 py-3 bg-white/10 font-medium rounded-xl hover:bg-white/20 transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;