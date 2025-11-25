import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Loader,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Users,
  Package,
  Info
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AnimatedBackground from '../../components/common/AnimatedBackground';
import promoCodeService from '../../services/promocode.service';
import productService from '../../services/product.service';
import { PromoCode } from '../../types/promo.types';
import { Product } from '../../types';
import toast from 'react-hot-toast';

const PromoCodeForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEdit);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  
const [formData, setFormData] = useState<Partial<PromoCode>>({
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 0,
  discount_value_rub: 0,
  discount_value_usd: 0,
  min_order_amount: 0,
  usage_limit: undefined,
  valid_from: new Date().toISOString().split('T')[0],
  valid_until: undefined,
  is_active: true,
  products: []
});

  useEffect(() => {
    loadProducts();
    if (isEdit) {
      loadPromoCode();
    }
  }, [id]);

    const loadProducts = async () => {
      try {
        console.log('Loading products...');
        const data = await productService.getAllProducts();
        console.log('Products loaded:', data.length, 'products');
        console.log('First product:', data[0]);
        setProducts(data);
        
        if (data.length === 0) {
          toast.error('No products available. Please add products first.');
        }
      } catch (error) {
        console.error('Failed to load products:', error);
        toast.error('Failed to load products');
      }
    };

  const loadPromoCode = async () => {
    try {
      const data = await promoCodeService.getPromoCode(parseInt(id!));
      setFormData({
        ...data,
        valid_from: data.valid_from ? new Date(data.valid_from).toISOString().split('T')[0] : '',
        valid_until: data.valid_until ? new Date(data.valid_until).toISOString().split('T')[0] : undefined,
        usage_limit: data.usage_limit || undefined
      });
    } catch (error) {
      toast.error('Failed to load promo code');
      navigate('/admin/promo-codes');
    } finally {
      setIsLoadingData(false);
    }
  };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
    
      // Validation
      if (!formData.code || formData.code.trim() === '') {
        toast.error('Code is required');
        return;
      }

      // ИСПРАВЛЕНО: проверка на undefined
      if (!formData.discount_value || formData.discount_value <= 0) {
        toast.error('Discount value must be greater than 0');
        return;
      }

      // ИСПРАВЛЕНО: проверка на undefined
      if (formData.discount_type === 'percentage' && formData.discount_value && formData.discount_value > 100) {
        toast.error('Percentage discount cannot exceed 100%');
        return;
      }

      if (!formData.valid_from) {
        toast.error('Valid from date is required');
        return;
      }

      setIsLoading(true);

      try {
        const submitData = {
          ...formData,
          code: formData.code.toUpperCase().trim(),
          usage_limit: formData.usage_limit || undefined // ИСПРАВЛЕНО: undefined вместо null
        };

        if (isEdit) {
          await promoCodeService.updatePromoCode(parseInt(id!), submitData);
          toast.success('Promo code updated successfully');
        } else {
          await promoCodeService.createPromoCode(submitData);
          toast.success('Promo code created successfully');
        }

        navigate('/admin/promo-codes');
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to save promo code');
      } finally {
        setIsLoading(false);
      }
    };

  const handleProductToggle = (productId: string) => {
    const id = parseInt(productId);
    const currentProducts = formData.products || [];
    
    if (currentProducts.includes(id)) {
      setFormData({
        ...formData,
        products: currentProducts.filter(p => p !== id)
      });
    } else {
      setFormData({
        ...formData,
        products: [...currentProducts, id]
      });
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      <div className="flex relative z-10">
        <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
          {/* Header */}
          <div className="glass-dark border-b border-white/10 p-6">
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
                <h1 className="text-3xl font-bold gradient-text">
                  {isEdit ? 'Edit Promo Code' : 'Create Promo Code'}
                </h1>
                <p className="text-gray-400 mt-1">
                  {isEdit ? 'Update promo code details' : 'Add a new promotional discount code'}
                </p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-dark rounded-2xl p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Basic Information</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Promo Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) => setFormData({
                          ...formData, 
                          code: e.target.value.toUpperCase()
                        })}
                        placeholder="SUMMER2024"
                        className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 
                                 focus:border-primary/50 transition-colors uppercase"
                        maxLength={20}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Unique code that customers will use
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Summer sale - 20% off all products"
                        rows={3}
                        className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 
                                 focus:border-primary/50 transition-colors resize-none"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                        className="w-5 h-5 rounded"
                      />
                      <label htmlFor="is_active" className="text-sm font-medium">
                        Active (customers can use this code)
                      </label>
                    </div>
                  </div>
                </motion.div>
                
                {/* Discount Settings */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-dark rounded-2xl p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Percent className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Discount Settings</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Discount Type *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, discount_type: 'percentage'})}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            formData.discount_type === 'percentage'
                              ? 'border-primary bg-primary/20'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          <Percent className={`w-6 h-6 mx-auto mb-2 ${
                            formData.discount_type === 'percentage' ? 'text-primary' : 'text-gray-400'
                          }`} />
                          <div className="text-sm font-medium">Percentage</div>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, discount_type: 'fixed'})}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            formData.discount_type === 'fixed'
                              ? 'border-primary bg-primary/20'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          <DollarSign className={`w-6 h-6 mx-auto mb-2 ${
                            formData.discount_type === 'fixed' ? 'text-primary' : 'text-gray-400'
                          }`} />
                          <div className="text-sm font-medium">Fixed Amount</div>
                        </button>
                      </div>
                    </div>
                    
{formData.discount_type === 'percentage' ? (
  <div>
    <label className="block text-sm font-medium mb-2">
      <Percent className="w-4 h-4 inline mr-2" />
      Discount Percentage *
    </label>
    <div className="relative">
      <input
        type="number"
        required
        min="0"
        max="100"
        step="0.01"
        value={formData.discount_value}
        onChange={(e) => setFormData({
          ...formData, 
          discount_value: parseFloat(e.target.value)
        })}
        className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 
                 focus:border-primary/50 transition-colors pr-12"
        placeholder="0.00"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
        %
      </span>
    </div>
    <p className="text-xs text-gray-500 mt-1">Enter percentage (0-100)</p>
  </div>
) : (
  <>
    {/* Fixed Discount THB */}
    <div>
      <label className="block text-sm font-medium mb-2">
        <DollarSign className="w-4 h-4 inline mr-2" />
        Fixed Discount (THB) *
      </label>
      <div className="relative">
        <input
          type="number"
          required
          min="0"
          step="0.01"
          value={formData.discount_value}
          onChange={(e) => setFormData({
            ...formData, 
            discount_value: parseFloat(e.target.value)
          })}
          className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 
                   focus:border-primary/50 transition-colors pr-12"
          placeholder="0.00"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
          ฿
        </span>
      </div>
    </div>

    {/* Fixed Discount RUB */}
    <div>
      <label className="block text-sm font-medium mb-2">
        <DollarSign className="w-4 h-4 inline mr-2" />
        Fixed Discount (RUB) *
      </label>
      <div className="relative">
        <input
          type="number"
          required
          min="0"
          step="0.01"
          value={formData.discount_value_rub}
          onChange={(e) => setFormData({
            ...formData, 
            discount_value_rub: parseFloat(e.target.value)
          })}
          className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 
                   focus:border-primary/50 transition-colors pr-12"
          placeholder="0.00"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
          ₽
        </span>
      </div>
    </div>

    {/* Fixed Discount USD */}
    <div>
      <label className="block text-sm font-medium mb-2">
        <DollarSign className="w-4 h-4 inline mr-2" />
        Fixed Discount (USD) *
      </label>
      <div className="relative">
        <input
          type="number"
          required
          min="0"
          step="0.01"
          value={formData.discount_value_usd}
          onChange={(e) => setFormData({
            ...formData, 
            discount_value_usd: parseFloat(e.target.value)
          })}
          className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 
                   focus:border-primary/50 transition-colors pr-12"
          placeholder="0.00"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
          $
        </span>
      </div>
    </div>
  </>
)}
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Minimum Order Amount
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.min_order_amount}
                          onChange={(e) => setFormData({
                            ...formData, 
                            min_order_amount: parseFloat(e.target.value)
                          })}
                          className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 
                                   focus:border-primary/50 transition-colors pr-12"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                          ฿
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum cart total required to use this code (0 = no minimum)
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-6">
                {/* Validity Period */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-dark rounded-2xl p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Validity Period</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Valid From *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.valid_from as string}
                        onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                        className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 
                                 focus:border-primary/50 transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Valid Until (Optional)
                      </label>
                      <input
                        type="date"
                        value={formData.valid_until as string || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          valid_until: e.target.value || undefined
                        })}
                        className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 
                                 focus:border-primary/50 transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave empty for no expiration date
                      </p>
                    </div>
                  </div>
                </motion.div>
                
                {/* Usage Limit */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-dark rounded-2xl p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Usage Limit</h2>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Maximum Uses (Optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.usage_limit || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        usage_limit: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      placeholder="Unlimited"
                      className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 
                               focus:border-primary/50 transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Total number of times this code can be used (leave empty for unlimited)
                    </p>
                  </div>
                </motion.div>
                
                {/* Product Restrictions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass-dark rounded-2xl p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Product Restrictions</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-2">
                      <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-400">
                        Leave empty to apply this promo code to all products. 
                        Select specific products to restrict the discount.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Search Products
                      </label>
                      <input
                        type="text"
                        value={searchProduct}
                        onChange={(e) => setSearchProduct(e.target.value)}
                        placeholder="Search by product name..."
                        className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                                 focus:border-primary/50 transition-colors"
                      />
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400 mb-2">
                        {formData.products?.length || 0} product(s) selected
                        {formData.products && formData.products.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, products: []})}
                            className="ml-2 text-red-400 hover:text-red-300"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {filteredProducts.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            No products found
                          </div>
                        ) : (
                          filteredProducts.map(product => (
                            <label
                              key={product.id}
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                formData.products?.includes(parseInt(product.id))
                                  ? 'border-primary bg-primary/10'
                                  : 'border-white/10 bg-white/5 hover:border-white/20'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.products?.includes(parseInt(product.id))}
                                onChange={() => handleProductToggle(product.id)}
                                className="w-4 h-4"
                              />
                              
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
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
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
            
            {/* Submit Buttons */}
            <div className="mt-6 flex gap-4 max-w-4xl mx-auto">
              <button
                type="button"
                onClick={() => navigate('/admin/promo-codes')}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary rounded-xl 
                         font-semibold flex items-center justify-center gap-2 
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {isEdit ? 'Update' : 'Create'} Promo Code
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PromoCodeForm;