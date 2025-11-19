import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Tag,
  Users,
  TrendingUp,
  Calendar,
  Percent,
  DollarSign,
  Check,
  X,
  Eye,
  Copy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AnimatedBackground from '../../components/common/AnimatedBackground';
import promoCodeService from '../../services/promocode.service';
import { PromoCode } from '../../types/promo.types';
import toast from 'react-hot-toast';

const AdminPromoCodes: React.FC = () => {
  const navigate = useNavigate();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const data = await promoCodeService.getPromoCodes();
      setPromoCodes(data);
    } catch (error) {
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await promoCodeService.deletePromoCode(id);
      toast.success('Promo code deleted successfully');
      setShowDeleteModal(null);
      fetchPromoCodes();
    } catch (error) {
      toast.error('Failed to delete promo code');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const filteredPromoCodes = promoCodes.filter(promo => {
    const matchesSearch = promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          promo.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterActive === 'all') return matchesSearch;
    if (filterActive === 'active') return matchesSearch && promo.is_active;
    if (filterActive === 'inactive') return matchesSearch && !promo.is_active;
    
    return matchesSearch;
  });

  const getDiscountDisplay = (promo: PromoCode) => {
    if (promo.discount_type === 'percentage') {
      return `${promo.discount_value}%`;
    }
    return `฿${promo.discount_value}`;
  };

  const isExpired = (promo: PromoCode) => {
    if (!promo.valid_until) return false;
    return new Date(promo.valid_until) < new Date();
  };

  const isUsageLimitReached = (promo: PromoCode) => {
    if (!promo.usage_limit) return false;
    return promo.used_count >= promo.usage_limit;
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      <div className="flex relative z-10">
        <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
          {/* Header */}
          <div className="glass-dark border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold gradient-text">Promo Codes</h1>
                <p className="text-gray-400 mt-1">Manage promotional discount codes</p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/admin/promo-codes/new')}
                className="bg-gradient-to-r from-primary to-secondary px-6 py-3 rounded-xl 
                         font-semibold flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Promo Code
              </motion.button>
            </div>
          </div>
          
          <div className="p-6">
            {/* Filters */}
            <div className="glass-dark rounded-2xl p-4 mb-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[300px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search promo codes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/5 rounded-xl border border-white/10 
                               focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterActive('all')}
                    className={`px-4 py-2 rounded-xl transition-colors ${
                      filterActive === 'all'
                        ? 'bg-primary text-white'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterActive('active')}
                    className={`px-4 py-2 rounded-xl transition-colors ${
                      filterActive === 'active'
                        ? 'bg-green-500 text-white'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setFilterActive('inactive')}
                    className={`px-4 py-2 rounded-xl transition-colors ${
                      filterActive === 'inactive'
                        ? 'bg-gray-500 text-white'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>
            </div>
            
            {/* Promo Codes Grid */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredPromoCodes.length === 0 ? (
              <div className="text-center py-20">
                <Tag className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold mb-2">No promo codes found</h3>
                <p className="text-gray-400 mb-6">
                  {searchQuery ? 'Try adjusting your search' : 'Create your first promo code'}
                </p>
                {!searchQuery && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/admin/promo-codes/new')}
                    className="bg-gradient-to-r from-primary to-secondary px-6 py-3 rounded-xl 
                             font-semibold"
                  >
                    Create Promo Code
                  </motion.button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPromoCodes.map((promo, index) => (
                  <motion.div
                    key={promo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-dark rounded-2xl p-6 border border-white/10 hover:border-primary/50 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          promo.discount_type === 'percentage'
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                            : 'bg-gradient-to-br from-blue-500 to-blue-600'
                        }`}>
                          {promo.discount_type === 'percentage' ? (
                            <Percent className="w-6 h-6 text-white" />
                          ) : (
                            <DollarSign className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold">{promo.code}</h3>
                            <button
                              onClick={() => handleCopyCode(promo.code)}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          {promo.description && (
                            <p className="text-xs text-gray-400">{promo.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {promo.is_active && !isExpired(promo) && !isUsageLimitReached(promo) ? (
                          <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-lg bg-gray-500/20 text-gray-400 text-xs flex items-center gap-1">
                            <X className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Discount Info */}
                    <div className="mb-4 p-3 rounded-xl bg-white/5">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {getDiscountDisplay(promo)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {promo.min_order_amount > 0 && `Min order: ฿${promo.min_order_amount}`}
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                        <div>
                          <div className="text-gray-400 text-xs">Uses</div>
                          <div className="font-semibold">
                            {promo.used_count}
                            {promo.usage_limit && `/${promo.usage_limit}`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-green-400" />
                        <div>
                          <div className="text-gray-400 text-xs">Users</div>
                          <div className="font-semibold">{promo.total_users || 0}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Validity Period */}
                    <div className="mb-4 p-3 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                        <Calendar className="w-3 h-3" />
                        Valid Period
                      </div>
                      <div className="text-sm">
                        {new Date(promo.valid_from).toLocaleDateString()}
                        {promo.valid_until && (
                          <> - {new Date(promo.valid_until).toLocaleDateString()}</>
                        )}
                      </div>
                      {isExpired(promo) && (
                        <div className="text-xs text-red-400 mt-1">Expired</div>
                      )}
                    </div>
                    
                    {/* Product Restrictions */}
                    {promo.products && promo.products.length > 0 && (
                      <div className="mb-4 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="text-xs text-blue-400">
                          Applied to {promo.products.length} specific product(s)
                        </div>
                      </div>
                    )}
                    
                    {/* Warnings */}
                    {isUsageLimitReached(promo) && (
                      <div className="mb-4 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <div className="text-xs text-orange-400">Usage limit reached</div>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/admin/promo-codes/${promo.id}`)}
                        className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 rounded-xl 
                                 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/admin/promo-codes/${promo.id}/edit`)}
                        className="flex-1 py-2 px-3 bg-primary/20 text-primary hover:bg-primary/30 
                                 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowDeleteModal(promo.id!)}
                        className="py-2 px-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 
                                 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(null)}
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
                  This action cannot be undone. All usage history will be preserved.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(showDeleteModal)}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-semibold transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPromoCodes;