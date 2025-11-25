import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertCircle,
  Package
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AnimatedBackground from '../../components/common/AnimatedBackground';
import productService from '../../services/product.service';
import toast from 'react-hot-toast';
import { useCurrencyStore } from '../../store/currencyStore';
import { formatPrice } from '../../utils/currency';

// SVG placeholder как data URL
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23374151"/%3E%3Cg transform="translate(200,200)"%3E%3Crect x="-30" y="-40" width="60" height="50" fill="%236B7280" rx="4"/%3E%3Cpath d="M -40 10 L 0 50 L 40 10 Z" fill="%236B7280"/%3E%3Ccircle cx="0" cy="-15" r="8" fill="%234B5563"/%3E%3C/g%3E%3Ctext x="200" y="320" font-family="Arial" font-size="14" fill="%236B7280" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';

const AdminProducts: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
const { currency } = useCurrencyStore();

  useEffect(() => {
    fetchProducts();
  }, [selectedType]);

  const fetchProducts = async () => {
    try {
      const filters: any = {};
      if (selectedType !== 'ALL') {
        filters.type = selectedType;
      }
      
      const data = await productService.getProducts(filters);
      setProducts(data.products);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await productService.deleteProduct(id.toString());
      toast.success('Product deleted successfully');
      setShowDeleteModal(null);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleEdit = (productId: number) => {
    navigate(`/admin/products/edit/${productId}`);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-500 bg-red-500/20';
    if (stock <= 10) return 'text-yellow-500 bg-yellow-500/20';
    return 'text-green-500 bg-green-500/20';
  };

  const getImageUrl = (image: string | null, productId: string) => {
    // Если уже была ошибка с этим изображением, сразу возвращаем placeholder
    if (imageErrors.has(productId)) {
      return PLACEHOLDER_IMAGE;
    }
    
    if (!image) return PLACEHOLDER_IMAGE;
    
    // Если картинка уже с полным путем (http/https)
    if (image.startsWith('http')) return image;
    
    // Если картинка с относительным путем
    return image;
  };

  const handleImageError = (productId: string) => {
    setImageErrors(prev => new Set(prev).add(productId));
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
                <h1 className="text-3xl font-bold gradient-text">Products</h1>
                <p className="text-gray-400 mt-1">Manage your product inventory</p>
              </div>
              
              <Link
                to="/admin/products/new"
                className="flex items-center gap-2 px-4 py-2 gradient-primary rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Type Filter */}
              <div className="flex gap-2">
                {['ALL', 'WHITE', 'BLACK', 'CYAN'].map(type => (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedType(type)}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      selectedType === type
                        ? 'gradient-primary text-white'
                        : 'glass-dark hover:bg-white/10'
                    }`}
                  >
                    {type}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-gray-400">Try adjusting your filters or add a new product</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => {
                  const productKey = `product-${product.id}`;
                  const imageUrl = getImageUrl(product.image, productKey);
                  
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-dark rounded-2xl overflow-hidden group"
                    >
                      <div className="aspect-square relative overflow-hidden bg-gray-800">
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={() => handleImageError(productKey)}
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            product.type === 'WHITE' ? 'bg-gray-200 text-gray-800' :
                            product.type === 'BLACK' ? 'bg-gray-900 text-white' :
                            'bg-cyan-500 text-white'
                          }`}>
                            {product.type}
                          </span>
                          {product.product_category && (
                            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-500 text-white">
                              {product.product_category}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {product.description || 'No description'}
                        </p>
                        
<div className="flex items-center justify-between mb-4">
  <div className="flex flex-col">
    <span className="text-2xl font-bold text-primary">
      {formatPrice(
        product.price || 0,
        product.price_rub || 0,
        product.price_usd || 0,
        currency
      )}
    </span>
    <span className="text-xs text-gray-500">
      {currency === 'RUB' && product.price_rub && `₽${product.price_rub}`}
      {currency === 'USD' && product.price_usd && `$${product.price_usd}`}
      {currency === 'THB' && product.price && `฿${product.price}`}
    </span>
  </div>
  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStockColor(product.stock || 0)}`}>
    Stock: {product.stock || 0}
  </span>
</div>
                        
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEdit(product.id)}
                            className="flex-1 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors flex items-center justify-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowDeleteModal(product.id)}
                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-dark rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-red-500/20">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Delete Product</h3>
                  <p className="text-gray-400 text-sm">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this product? All related data will be permanently removed.
              </p>
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDelete(showDeleteModal)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                >
                  Delete Product
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 py-3 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition-colors"
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

export default AdminProducts;