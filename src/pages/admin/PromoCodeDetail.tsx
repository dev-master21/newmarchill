import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Package,
  Check,
  X,
  Loader,
  User,
  Clock
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AnimatedBackground from '../../components/common/AnimatedBackground';
import promoCodeService from '../../services/promocode.service';
import productService from '../../services/product.service';
import { PromoCode, PromoCodeStats } from '../../types/promo.types';
import { Product } from '../../types';
import toast from 'react-hot-toast';

const PromoCodeDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState<PromoCode | null>(null);
  const [stats, setStats] = useState<PromoCodeStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

    const loadData = async () => {
      try {
        const [promoData, statsData] = await Promise.all([
          promoCodeService.getPromoCode(parseInt(id!)),
          promoCodeService.getPromoCodeStats(parseInt(id!))
        ]);
        
        setPromoCode(promoData);
        setStats(statsData);
        
        // Загружаем товары если есть ограничения
        if (promoData.products && promoData.products.length > 0) {
          const allProducts = await productService.getAllProducts(); // ИЗМЕНЕНО
          const filteredProducts = allProducts.filter((p: Product) => 
            promoData.products!.includes(parseInt(p.id))
          );
          setProducts(filteredProducts);
        }
      } catch (error) {
        toast.error('Failed to load promo code details');
        navigate('/admin/promo-codes');
      } finally {
        setLoading(false);
      }
    };

  const handleDelete = async () => {
    try {
      await promoCodeService.deletePromoCode(parseInt(id!));
      toast.success('Promo code deleted successfully');
      navigate('/admin/promo-codes');
    } catch (error) {
      toast.error('Failed to delete promo code');
    }
  };

  const getDiscountDisplay = () => {
    if (!promoCode) return '';
    if (promoCode.discount_type === 'percentage') {
      return `${promoCode.discount_value}%`;
    }
    return `฿${promoCode.discount_value}`;
  };

  const isExpired = () => {
    if (!promoCode?.valid_until) return false;
    return new Date(promoCode.valid_until) < new Date();
  };

  const isUsageLimitReached = () => {
    if (!promoCode?.usage_limit) return false;
    return promoCode.used_count >= promoCode.usage_limit;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!promoCode) {
    return null;
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      <div className="flex relative z-10">
        <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
          {/* Header */}
          <div className="glass-dark border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/admin/promo-codes')}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
                
                <div>
                  <h1 className="text-3xl font-bold gradient-text">{promoCode.code}</h1>
                  <p className="text-gray-400 mt-1">{promoCode.description || 'No description'}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/admin/promo-codes/${id}/edit`)}
                  className="px-6 py-3 bg-primary/20 text-primary rounded-xl font-semibold 
                           flex items-center gap-2 hover:bg-primary/30 transition-colors"
                >
                  <Edit className="w-5 h-5" />
                  Edit
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-3 bg-red-500/20 text-red-400 rounded-xl font-semibold 
                           flex items-center gap-2 hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </motion.button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-dark rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      promoCode.discount_type === 'percentage'
                        ? 'bg-green-500/20'
                        : 'bg-blue-500/20'
                    }`}>
                      {promoCode.discount_type === 'percentage' ? (
                        <Percent className="w-5 h-5 text-green-400" />
                      ) : (
                        <DollarSign className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div className="text-sm text-gray-400">Discount</div>
                  </div>
                  <div className="text-2xl font-bold text-primary">{getDiscountDisplay()}</div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-dark rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-sm text-gray-400">Total Uses</div>
                  </div>
                  <div className="text-2xl font-bold">
                    {promoCode.used_count}
                    {promoCode.usage_limit && <span className="text-gray-400">/{promoCode.usage_limit}</span>}
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-dark rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="text-sm text-gray-400">Unique Users</div>
                  </div>
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-dark rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      promoCode.is_active && !isExpired() && !isUsageLimitReached()
                        ? 'bg-green-500/20'
                        : 'bg-gray-500/20'
                    }`}>
                      {promoCode.is_active && !isExpired() && !isUsageLimitReached() ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="text-sm text-gray-400">Status</div>
                  </div>
                  <div className={`text-lg font-bold ${
                    promoCode.is_active && !isExpired() && !isUsageLimitReached()
                      ? 'text-green-400'
                      : 'text-gray-400'
                  }`}>
                    {promoCode.is_active && !isExpired() && !isUsageLimitReached() ? 'Active' : 'Inactive'}
                  </div>
                </motion.div>
              </div>
              
              {/* Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Promo Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass-dark rounded-2xl p-6"
                >
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary" />
                    Promo Details
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Discount Type</div>
                      <div className="font-medium capitalize">{promoCode.discount_type}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Minimum Order Amount</div>
                      <div className="font-medium">
                        {promoCode.min_order_amount > 0 
                          ? `฿${promoCode.min_order_amount}` 
                          : 'No minimum'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Valid Period</div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>
                          {new Date(promoCode.valid_from).toLocaleDateString()}
                          {promoCode.valid_until && (
                            <> - {new Date(promoCode.valid_until).toLocaleDateString()}</>
                          )}
                        </span>
                      </div>
                      {isExpired() && (
                        <div className="text-xs text-red-400 mt-1">Expired</div>
                      )}
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Usage Limit</div>
                      <div className="font-medium">
                        {promoCode.usage_limit || 'Unlimited'}
                      </div>
                      {isUsageLimitReached() && (
                        <div className="text-xs text-orange-400 mt-1">Limit reached</div>
                      )}
                    </div>
                  </div>
                </motion.div>
                
                {/* Product Restrictions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="glass-dark rounded-2xl p-6"
                >
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Product Restrictions
                  </h2>
                  
                  {!promoCode.products || promoCode.products.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Applies to all products</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-400 mb-3">
                        Applies to {products.length} specific product(s)
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {products.map(product => (
                          <div
                            key={product.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800">
                              {product.image && (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{product.name}</div>
                              <div className="text-xs text-gray-400">฿{product.price}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
              
              {/* Usage History */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-dark rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Usage History
                </h2>
                
                {!stats || stats.users.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No usage history yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Used At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.users.map((usage, index) => (
                          <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                  {usage.avatar ? (
                                    <img src={usage.avatar} alt={usage.name} className="w-full h-full rounded-full" />
                                  ) : (
                                    <User className="w-5 h-5 text-white" />
                                  )}
                                </div>
                                <div className="font-medium">{usage.name}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-400">{usage.email}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Clock className="w-4 h-4" />
                                {new Date(usage.used_at).toLocaleString()}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Modal */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteModal(false)}
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
              <h3 className="text-2xl font-bold mb-2">Delete Promo Code?</h3>
              <p className="text-gray-400">
                This action cannot be undone. The promo code "{promoCode.code}" will be permanently deleted.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-semibold transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default PromoCodeDetail;