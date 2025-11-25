import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Package, 
  Upload, 
  X, 
  Plus, 
  Loader,
  Image as ImageIcon,
  Save,
  ArrowLeft,
  Box,
  Hash,
  Cigarette,
  Sparkles,
  Flower2,
  Check
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AnimatedBackground from '../../components/common/AnimatedBackground';
import productService from '../../services/product.service';
import categoryService from '../../services/category.service';
import strainService, { Strain } from '../../services/strain.service';
import api from '../../services/api';
import toast from 'react-hot-toast';

// SVG placeholder как data URL
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23374151"/%3E%3Cg transform="translate(200,200)"%3E%3Crect x="-30" y="-40" width="60" height="50" fill="%236B7280" rx="4"/%3E%3Cpath d="M -40 10 L 0 50 L 40 10 Z" fill="%236B7280"/%3E%3Ccircle cx="0" cy="-15" r="8" fill="%234B5563"/%3E%3C/g%3E%3Ctext x="200" y="320" font-family="Arial" font-size="14" fill="%236B7280" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';

const productCategories = [
  { id: 'plastic-bags', name: 'Plastic Bags', icon: Package },
  { id: 'boxes', name: 'Boxes with Tubes', icon: Box },
  { id: 'nano-blunts', name: 'Nano Blunts', icon: Cigarette },
  { id: 'hash-rosin', name: 'HASH/ROSIN', icon: Hash },
  { id: 'big-blunts', name: 'Big Blunts', icon: Sparkles }
];

const EditProduct: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [strains, setStrains] = useState<Strain[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'WHITE',
    product_category: '',
    category_id: '',
    description: '',
    price: '',
    price_rub: '',
    price_usd: '',
    stock: '0',
    size: '',
    thc: '',
    cbd: '',
    model_3d: '',
    features: [''],
    strains: [] as number[],
    strain_id: null as number | null,
    is_active: true
  });
  
  const [images, setImages] = useState({
    main: null as File | null,
    gallery: [] as File[],
    keepMain: true,
    keepGallery: true,
    existingGallery: [] as string[]
  });
  
  const [previews, setPreviews] = useState({
    main: '',
    gallery: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [categoriesData, strainsData, productData] = await Promise.all([
        categoryService.getCategories(),
        strainService.getStrains(),
        productService.getProduct(id!)
      ]);
      
      // Загружаем сорта продукта
      let productStrains: any[] = [];
      try {
        const response = await api.get(`/products/${id}/strains`);
        productStrains = response.data.strains || [];
      } catch (error) {
        console.error('Failed to load product strains:', error);
      }
      
      setCategories(categoriesData);
      setStrains(strainsData);
      
      // Парсим features
      let parsedFeatures = [''];
      if (productData.features) {
        if (typeof productData.features === 'string') {
          try {
            parsedFeatures = JSON.parse(productData.features);
          } catch (e) {
            parsedFeatures = [productData.features];
          }
        } else if (Array.isArray(productData.features)) {
          parsedFeatures = productData.features;
        }
      }
      
      if (parsedFeatures.length === 0) {
        parsedFeatures = [''];
      }
      
      // Заполняем форму данными продукта
setFormData({
  name: productData.name || '',
  type: productData.type || 'WHITE',
  product_category: productData.product_category || productData.productCategory || '',
  category_id: productData.category_id?.toString() || '',
  description: productData.description || '',
  price: productData.price?.toString() || '',
  price_rub: productData.price_rub?.toString() || '',
  price_usd: productData.price_usd?.toString() || '',
  stock: productData.stock?.toString() || '0',
        size: productData.size || '',
        thc: productData.thc || '',
        cbd: productData.cbd || '',
        model_3d: productData.model_3d || '',
        features: parsedFeatures,
        strains: productStrains.map((s: any) => s.id),
        strain_id: productData.strain_id || null,
        is_active: productData.is_active !== false
      });
      
      // Устанавливаем превью главного изображения
      if (productData.image) {
        setPreviews(prev => ({ 
          ...prev, 
          main: productData.image
        }));
      }
      
      // Обрабатываем gallery
      let galleryArray: string[] = [];
      if (productData.gallery) {
        if (typeof productData.gallery === 'string') {
          try {
            galleryArray = JSON.parse(productData.gallery);
          } catch (e) {
            console.error('Failed to parse gallery:', e);
            galleryArray = [];
          }
        } else if (Array.isArray(productData.gallery)) {
          galleryArray = productData.gallery;
        }
      }
      
      if (galleryArray && galleryArray.length > 0) {
        setPreviews(prev => ({ 
          ...prev, 
          gallery: galleryArray
        }));
        setImages(prev => ({
          ...prev,
          existingGallery: galleryArray
        }));
      }
      
      setIsLoadingProduct(false);
    } catch (error) {
      console.error('Failed to load product:', error);
      toast.error('Failed to load product data');
      navigate('/admin/products');
    }
  };

  // НОВОЕ: Функция фильтрации сортов в зависимости от типа продукта
  const getFilteredStrains = () => {
    const typeMapping: { [key: string]: string } = {
      'WHITE': 'Sativa',
      'BLACK': 'Indica',
      'CYAN': 'Hybrid'
    };

    const requiredType = typeMapping[formData.type];
    return strains.filter(strain => strain.type === requiredType);
  };

  // НОВОЕ: Очистка выбранных сортов при смене типа продукта
  useEffect(() => {
    if (strains.length === 0) return; // Ждем пока сорта загрузятся
    
    const filteredStrains = getFilteredStrains();
    const filteredStrainIds = filteredStrains.map(s => s.id);
    
    // Убираем сорта, которые не соответствуют новому типу
    const validStrains = formData.strains.filter(id => 
      filteredStrainIds.includes(id)
    );
    
    if (validStrains.length !== formData.strains.length) {
      setFormData(prev => ({
        ...prev,
        strains: validStrains,
        strain_id: validStrains.includes(prev.strain_id!) ? prev.strain_id : null
      }));
    }
  }, [formData.type, strains]);

  // ===== КОНЕЦ ДОБАВЛЕННЫХ ФУНКЦИЙ =====

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImages({ ...images, main: file, keepMain: false });
      setPreviews({ ...previews, main: URL.createObjectURL(file) });
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      setImages({ 
        ...images, 
        gallery: [...images.gallery, ...files], 
        keepGallery: false 
      });
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviews({ ...previews, gallery: [...previews.gallery, ...newPreviews] });
    }
  };

  const removeMainImage = () => {
    setImages({ ...images, main: null, keepMain: false });
    setPreviews({ ...previews, main: '' });
  };

  const removeGalleryImage = (index: number) => {
    const newGallery = [...previews.gallery];
    newGallery.splice(index, 1);
    
    if (index < images.existingGallery.length && images.keepGallery) {
      const newExisting = [...images.existingGallery];
      newExisting.splice(index, 1);
      setImages({ ...images, existingGallery: newExisting, keepGallery: false });
    } else {
      const newFileIndex = index - (images.keepGallery ? images.existingGallery.length : 0);
      const newFiles = [...images.gallery];
      if (newFileIndex >= 0 && newFileIndex < newFiles.length) {
        newFiles.splice(newFileIndex, 1);
        setImages({ ...images, gallery: newFiles });
      }
    }
    
    setPreviews({ ...previews, gallery: newGallery });
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures.length > 0 ? newFeatures : [''] });
  };

  const handleStrainToggle = (strainId: number) => {
    const newStrains = formData.strains.includes(strainId)
      ? formData.strains.filter(id => id !== strainId)
      : [...formData.strains, strainId];
    
    // Если убрали выбранный основной сорт, очищаем его
    if (!newStrains.includes(formData.strain_id!) && formData.strain_id) {
      setFormData({ ...formData, strains: newStrains, strain_id: null });
    } else {
      setFormData({ ...formData, strains: newStrains });
    }
  };

  const handleImageError = (imageId: string) => {
    setImageErrors(prev => new Set(prev).add(imageId));
  };

  const getImageSrc = (src: string, imageId: string) => {
    if (imageErrors.has(imageId)) {
      return PLACEHOLDER_IMAGE;
    }
    return src || PLACEHOLDER_IMAGE;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!previews.main && !images.main) {
      toast.error('Please upload a main image');
      return;
    }
    
    if (!formData.product_category) {
      toast.error('Please select a product type');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const data = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === 'features') {
          // Фильтруем пустые features
          const validFeatures = formData.features.filter(f => f.trim() !== '');
          data.append(key, JSON.stringify(validFeatures));
        } else if (key === 'strains') {
          data.append(key, JSON.stringify(formData.strains));
        } else if (key === 'strain_id') {
          data.append(key, formData.strain_id ? String(formData.strain_id) : '');
        } else {
          data.append(key, String(formData[key as keyof typeof formData]));
        }
      });
      
      // Обработка главного изображения
      if (images.main) {
        data.append('image', images.main);
      } else if (!images.keepMain && !previews.main) {
        data.append('removeImage', 'true');
      }
      
      // Обработка галереи
      if (!images.keepGallery) {
        if (images.gallery.length > 0) {
          images.gallery.forEach((file) => {
            data.append('gallery', file);
          });
        }
        
        if (images.existingGallery.length > 0) {
          data.append('keepExistingGallery', JSON.stringify(images.existingGallery));
        } else if (images.gallery.length === 0) {
          data.append('removeGallery', 'true');
        }
      }
      
      await productService.updateProduct(id!, data);
      toast.success('Product updated successfully!');
      navigate('/admin/products');
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.error || 'Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStrains = getFilteredStrains();

  if (isLoadingProduct) {
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
          <div className="glass-dark border-b border-white/10 p-6">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/admin/products')}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              
              <div>
                <h1 className="text-3xl font-bold gradient-text">Edit Product</h1>
                <p className="text-gray-400 mt-1">Update product information</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Basic Information */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-dark rounded-2xl p-6"
                  >
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      Basic Information
                    </h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Product Name *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                          placeholder="Enter product name"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Strain Type *</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                          required
                        >
                          <option value="WHITE" className="bg-dark">White (Sativa)</option>
                          <option value="BLACK" className="bg-dark">Black (Indica)</option>
                          <option value="CYAN" className="bg-dark">Cyan (Hybrid)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Product Type *</label>
                        <div className="grid grid-cols-2 gap-3">
                          {productCategories.map((cat) => {
                            const Icon = cat.icon;
                            return (
                              <motion.button
                                key={cat.id}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setFormData({ ...formData, product_category: cat.id })}
                                className={`p-3 rounded-xl border transition-all ${
                                  formData.product_category === cat.id
                                    ? 'border-primary bg-primary/20'
                                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                                }`}
                              >
                                <Icon className={`w-5 h-5 mx-auto mb-1 ${
                                  formData.product_category === cat.id ? 'text-primary' : 'text-gray-400'
                                }`} />
                                <p className={`text-xs ${
                                  formData.product_category === cat.id ? 'text-primary' : 'text-gray-400'
                                }`}>
                                  {cat.name}
                                </p>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Category</label>
                        <select
                          value={formData.category_id}
                          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                        >
                          <option value="" className="bg-dark">Select category</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id} className="bg-dark">
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Description</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors resize-none"
                          placeholder="Product description..."
                        />
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Pricing & Inventory */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-dark rounded-2xl p-6"
                  >
                    <h2 className="text-xl font-bold mb-4">Pricing & Inventory</h2>
                    
<div className="space-y-4">
  <div className="grid grid-cols-3 gap-4">
    <div>
      <label className="text-sm text-gray-400 mb-2 block flex items-center gap-1">
        Price (THB) *
        <span className="text-primary">฿</span>
      </label>
      <input
        type="number"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
        placeholder="0"
        step="0.01"
        required
      />
    </div>
    
    <div>
      <label className="text-sm text-gray-400 mb-2 block flex items-center gap-1">
        Price (RUB) *
        <span className="text-primary">₽</span>
      </label>
      <input
        type="number"
        value={formData.price_rub}
        onChange={(e) => setFormData({ ...formData, price_rub: e.target.value })}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
        placeholder="0"
        step="0.01"
        required
      />
    </div>
    
    <div>
      <label className="text-sm text-gray-400 mb-2 block flex items-center gap-1">
        Price (USD) *
        <span className="text-primary">$</span>
      </label>
      <input
        type="number"
        value={formData.price_usd}
        onChange={(e) => setFormData({ ...formData, price_usd: e.target.value })}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
        placeholder="0"
        step="0.01"
        required
      />
    </div>
  </div>
  
  <div>
    <label className="text-sm text-gray-400 mb-2 block">Stock Quantity *</label>
    <input
      type="number"
      value={formData.stock}
      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
      placeholder="0"
      required
    />
  </div>
                      
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Size</label>
                        <input
                          type="text"
                          value={formData.size}
                          onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                          placeholder="e.g. 1g, 3.5g"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">3D Model Filename</label>
                        <input
                          type="text"
                          value={formData.model_3d}
                          onChange={(e) => setFormData({ ...formData, model_3d: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                          placeholder="e.g., plastic-bags-white.glb"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">THC %</label>
                        <input
                          type="text"
                          value={formData.thc}
                          onChange={(e) => setFormData({ ...formData, thc: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                          placeholder="e.g. 18-22%"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">CBD %</label>
                        <input
                          type="text"
                          value={formData.cbd}
                          onChange={(e) => setFormData({ ...formData, cbd: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                          placeholder="e.g. 0.1%"
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-6">
                  {/* Main Image */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-dark rounded-2xl p-6"
                  >
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-primary" />
                      Main Image *
                    </h2>
                    
                    <div className="space-y-4">
                      {previews.main ? (
                        <div className="relative group">
                          <img
                            src={getImageSrc(previews.main, 'main-image')}
                            alt="Main preview"
                            className="w-full h-64 object-cover rounded-xl bg-gray-800"
                            onError={() => handleImageError('main-image')}
                          />
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={removeMainImage}
                            className="absolute top-2 right-2 p-2 bg-red-500/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-gray-800">
                          <Upload className="w-10 h-10 text-gray-400 mb-2" />
                          <span className="text-gray-400">Upload main image</span>
                          <input
                            type="file"
                            onChange={handleMainImageChange}
                            accept="image/*"
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </motion.div>
                  
                  {/* Gallery Images */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-dark rounded-2xl p-6"
                  >
                    <h2 className="text-xl font-bold mb-4">Gallery Images ({previews.gallery.length})</h2>
                    
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {previews.gallery.map((preview, index) => {
                        const galleryId = `gallery-${index}`;
                        return (
                          <div key={index} className="relative group">
                            <img
                              src={getImageSrc(preview, galleryId)}
                              alt={`Gallery ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg bg-gray-800"
                              onError={() => handleImageError(galleryId)}
                            />
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(index)}
                              className="absolute top-1 right-1 p-1 bg-red-500/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                      
                      {previews.gallery.length < 10 && (
                        <label className="flex items-center justify-center h-24 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-gray-800">
                          <Plus className="w-6 h-6 text-gray-400" />
                          <input
                            type="file"
                            onChange={handleGalleryChange}
                            accept="image/*"
                            multiple
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </motion.div>
                  
                    {/* Strains */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="glass-dark rounded-2xl p-6"
                    >
                      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Flower2 className="w-5 h-5 text-primary" />
                        Available Strains
                      </h2>
                                        
                      {/* НОВОЕ: Информация о типе сорта */}
                      <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-sm text-primary">
                          {formData.type === 'WHITE' && '🌿 Sativa strains available for WHITE products'}
                          {formData.type === 'BLACK' && '🌙 Indica strains available for BLACK products'}
                          {formData.type === 'CYAN' && '⚡ Hybrid strains available for CYAN products'}
                        </p>
                      </div>
                                        
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">
                            Select strains available for this product
                          </label>
                                        
                          {filteredStrains.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                              <p>No {formData.type === 'WHITE' ? 'Sativa' : formData.type === 'BLACK' ? 'Indica' : 'Hybrid'} strains available.</p>
                              <p className="text-sm mt-2">Create strains in the Strains Management section first.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                              {filteredStrains.map(strain => (
                                <label
                                  key={strain.id}
                                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                                    formData.strains.includes(strain.id)
                                      ? 'bg-primary/20 border-primary'
                                      : 'bg-white/5 border-white/10 hover:border-white/30'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.strains.includes(strain.id)}
                                    onChange={() => handleStrainToggle(strain.id)}
                                    className="sr-only"
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{strain.name}</p>
                                    {strain.type && (
                                      <p className="text-xs text-gray-400">{strain.type}</p>
                                    )}
                                  </div>
                                  {formData.strains.includes(strain.id) && (
                                    <Check className="w-4 h-4 text-primary" />
                                  )}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {formData.strains.length > 0 && (
                          <div>
                            <label className="text-sm text-gray-400 mb-2 block">
                              Default strain (optional)
                            </label>
                            <select
                              value={formData.strain_id || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                strain_id: e.target.value ? Number(e.target.value) : null
                              })}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                            >
                              <option value="" className="bg-dark">No default strain</option>
                              {filteredStrains
                                .filter(s => formData.strains.includes(s.id))
                                .map(strain => (
                                  <option key={strain.id} value={strain.id} className="bg-dark">
                                    {strain.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  
                  {/* Key Features - ДОБАВЛЕНО */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-dark rounded-2xl p-6"
                  >
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Key Features
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {formData.features.map((feature, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={feature}
                              onChange={(e) => handleFeatureChange(index, e.target.value)}
                              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                              placeholder="e.g., Name: Zip-lock 3.5 g"
                            />
                            {formData.features.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeFeature(index)}
                                className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={addFeature}
                          className="w-full py-3 bg-primary/20 text-primary rounded-xl hover:bg-primary/30 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Feature
                        </button>
                      </div>

                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <p className="text-xs text-blue-300 mb-1">💡 Formatting tips:</p>
                        <ul className="text-xs text-blue-200 space-y-0.5 list-disc list-inside">
                          <li>Use "Label: Value" format</li>
                          <li>Each line = separate feature with checkmark</li>
                          <li>Empty fields are ignored</li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Status */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass-dark rounded-2xl p-6"
                  >
                    <h2 className="text-xl font-bold mb-4">Product Status</h2>
                    
                    <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-5 h-5 rounded accent-primary"
                      />
                      <div>
                        <p className="font-medium">Active</p>
                        <p className="text-sm text-gray-400">Product will be visible to customers</p>
                      </div>
                    </label>
                  </motion.div>
                </div>
              </div>
              
              {/* Submit Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-8 flex gap-4"
              >
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className="flex-1 py-4 gradient-primary text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Update Product
                    </>
                  )}
                </motion.button>
                
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/admin/products')}
                  className="px-8 py-4 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition-colors"
                >
                  Cancel
                </motion.button>
              </motion.div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;