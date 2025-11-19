import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  Sparkles
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AnimatedBackground from '../../components/common/AnimatedBackground';
import productService from '../../services/product.service';
import categoryService from '../../services/category.service';
import strainService, { Strain } from '../../services/strain.service';
import toast from 'react-hot-toast';

const productCategories = [
  { id: 'plastic-bags', name: 'Plastic Bags', icon: Package },
  { id: 'boxes', name: 'Boxes with Tubes', icon: Box },
  { id: 'nano-blunts', name: 'Nano Blunts', icon: Cigarette },
  { id: 'hash-rosin', name: 'HASH/ROSIN', icon: Hash },
  { id: 'big-blunts', name: 'Big Blunts', icon: Sparkles }
];

const NewProduct: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [_categories, setCategories] = useState<any[]>([]);
  const [strains, setStrains] = useState<Strain[]>([]);
  const [selectedStrain, setSelectedStrain] = useState<number | null>(null);
  const [strainTemplateApplied, setStrainTemplateApplied] = useState(false);
  
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
    strains: [] as number[], // ВОССТАНОВЛЕНО: множественный выбор сортов
    strain_id: null as number | null,
    is_active: true,
    // ВОССТАНОВЛЕНО: поля из сорта
    terpenes: '',
    aroma_taste: '',
    effects: ''
  });
  
  const [images, setImages] = useState({
    main: null as File | null,
    gallery: [] as File[]
  });
  
  const [previews, setPreviews] = useState({
    main: '',
    gallery: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesData, strainsData] = await Promise.all([
        categoryService.getCategories(),
        strainService.getStrains()
      ]);
      setCategories(categoriesData);
      setStrains(strainsData);
    } catch (error) {
      toast.error('Failed to load data');
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
  
  // ВОССТАНОВЛЕНО: функция выбора сорта с шаблоном
  const handleStrainSelect = async (strainId: number) => {
    if (strainId === selectedStrain) return;
    
    setSelectedStrain(strainId);
    setFormData({ ...formData, strain_id: strainId });
    
    if (!strainTemplateApplied) {
      const shouldApplyTemplate = window.confirm(
        'Do you want to apply this strain template? This will update THC, CBD, terpenes, aroma, and effects fields.'
      );
      
      if (shouldApplyTemplate) {
        await applyStrainTemplate(strainId);
      }
    }
  };

  // ВОССТАНОВЛЕНО: функция применения шаблона сорта
  const applyStrainTemplate = async (strainId: number) => {
    try {
      const strain = strains.find(s => s.id === strainId);
      if (strain) {
        setFormData(prev => ({
          ...prev,
          thc: strain.thc_content || prev.thc,
          cbd: strain.cbd_content || prev.cbd,
          terpenes: strain.terpenes || prev.terpenes,
          aroma_taste: strain.aroma_taste || prev.aroma_taste,
          effects: strain.effects || prev.effects
        }));
        setStrainTemplateApplied(true);
        toast.success('Strain template applied');
      }
    } catch (error) {
      toast.error('Failed to apply strain template');
    }
  };

  // ДОБАВЛЕНО: функция для множественного выбора сортов
  const handleStrainToggle = (strainId: number) => {
    setFormData(prev => ({
      ...prev,
      strains: prev.strains.includes(strainId)
        ? prev.strains.filter(id => id !== strainId)
        : [...prev.strains, strainId]
    }));
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImages({ ...images, main: file });
      setPreviews({ ...previews, main: URL.createObjectURL(file) });
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      setImages({ ...images, gallery: [...images.gallery, ...files] });
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviews({ ...previews, gallery: [...previews.gallery, ...newPreviews] });
    }
  };

  const removeGalleryImage = (index: number) => {
    const newGallery = [...images.gallery];
    newGallery.splice(index, 1);
    
    const newPreviews = [...previews.gallery];
    newPreviews.splice(index, 1);
    
    setImages({ ...images, gallery: newGallery });
    setPreviews({ ...previews, gallery: newPreviews });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!images.main) {
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
      
      // Добавляем все поля
      Object.keys(formData).forEach(key => {
        if (key === 'features') {
          // Фильтруем пустые features
          const validFeatures = formData.features.filter(f => f.trim() !== '');
          data.append(key, JSON.stringify(validFeatures));
        } else if (key === 'strains') {
          data.append(key, JSON.stringify(formData.strains));
        } else if (key === 'strain_id' && formData.strain_id) {
          data.append(key, formData.strain_id.toString());
        } else if (formData[key as keyof typeof formData] !== null) {
          data.append(key, String(formData[key as keyof typeof formData]));
        }
      });
      
      // Добавляем изображения
      data.append('image', images.main);
      images.gallery.forEach((file) => {
        data.append('gallery', file);
      });
      
      await productService.createProduct(data);
      toast.success('Product created successfully!');
      navigate('/admin/products');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  // НОВОЕ: Получаем отфильтрованные сорта для отображения
  const filteredStrains = getFilteredStrains();

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
                onClick={() => navigate('/admin/products')}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              
              <div>
                <h1 className="text-3xl font-bold gradient-text">Add New Product</h1>
                <p className="text-gray-400 mt-1">Create a new product listing</p>
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
                        <label className="block text-sm font-medium mb-2">Product Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                                   focus:border-primary/50 transition-colors"
                          placeholder="Enter product name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Type *</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value})}
                          className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                                   focus:border-primary/50 transition-colors"
                        >
                          <option value="WHITE">WHITE</option>
                          <option value="BLACK">BLACK</option>
                          <option value="CYAN">CYAN</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Product Type *</label>
                        <div className="grid grid-cols-2 gap-2">
                          {productCategories.map((cat) => {
                            const Icon = cat.icon;
                            return (
                              <motion.button
                                key={cat.id}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setFormData({...formData, product_category: cat.id})}
                                className={`p-3 rounded-xl border transition-colors flex items-center gap-2
                                  ${formData.product_category === cat.id 
                                    ? 'bg-primary/20 border-primary' 
                                    : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                              >
                                <Icon className="w-4 h-4" />
                                <span className="text-sm">{cat.name}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                      
<div className="space-y-4">
  <div className="grid grid-cols-3 gap-4">
    <div>
      <label className="block text-sm font-medium mb-2 flex items-center gap-1">
        Price (THB) *
        <span className="text-primary">฿</span>
      </label>
      <input
        type="number"
        required
        step="0.01"
        value={formData.price}
        onChange={(e) => setFormData({...formData, price: e.target.value})}
        className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                 focus:border-primary/50 transition-colors"
        placeholder="0.00"
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium mb-2 flex items-center gap-1">
        Price (RUB) *
        <span className="text-primary">₽</span>
      </label>
      <input
        type="number"
        required
        step="0.01"
        value={formData.price_rub}
        onChange={(e) => setFormData({...formData, price_rub: e.target.value})}
        className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                 focus:border-primary/50 transition-colors"
        placeholder="0.00"
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium mb-2 flex items-center gap-1">
        Price (USD) *
        <span className="text-primary">$</span>
      </label>
      <input
        type="number"
        required
        step="0.01"
        value={formData.price_usd}
        onChange={(e) => setFormData({...formData, price_usd: e.target.value})}
        className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                 focus:border-primary/50 transition-colors"
        placeholder="0.00"
      />
    </div>
  </div>
  
  <div>
    <label className="block text-sm font-medium mb-2">Stock Quantity</label>
    <input
      type="number"
      value={formData.stock}
      onChange={(e) => setFormData({...formData, stock: e.target.value})}
      className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
               focus:border-primary/50 transition-colors"
      placeholder="0"
    />
  </div>
</div>
                    </div>
                  </motion.div>
                  
                  {/* Strain Selection - ВОССТАНОВЛЕНО */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-dark rounded-2xl p-6"
                  >
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Cigarette className="w-5 h-5 text-primary" />
                      Strain Template (Optional)
                    </h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Select Strain as Template</label>
                        <select
                          value={selectedStrain || ''}
                          onChange={(e) => handleStrainSelect(Number(e.target.value))}
                          className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                                   focus:border-primary/50 transition-colors"
                        >
                          <option value="">No strain selected</option>
                          {strains.map(strain => (
                            <option key={strain.id} value={strain.id}>
                              {strain.name} ({strain.type || 'N/A'})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">
                          Select a strain to auto-fill THC, CBD, terpenes, and effects
                        </p>
                      </div>
                      
                      {selectedStrain && (
                        <motion.button
                          type="button"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => applyStrainTemplate(selectedStrain)}
                          className="w-full py-2 px-4 bg-primary/20 text-primary rounded-xl 
                                   border border-primary/50 hover:bg-primary/30 transition-colors"
                        >
                          Re-apply Strain Template
                        </motion.button>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">THC Content</label>
                        <input
                          type="text"
                          value={formData.thc}
                          onChange={(e) => setFormData({...formData, thc: e.target.value})}
                          className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                                   focus:border-primary/50 transition-colors"
                          placeholder="e.g., 25%"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">CBD Content</label>
                        <input
                          type="text"
                          value={formData.cbd}
                          onChange={(e) => setFormData({...formData, cbd: e.target.value})}
                          className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                                   focus:border-primary/50 transition-colors"
                          placeholder="e.g., <0.3%"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Terpenes</label>
                        <input
                          type="text"
                          value={formData.terpenes}
                          onChange={(e) => setFormData({...formData, terpenes: e.target.value})}
                          className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                                   focus:border-primary/50 transition-colors"
                          placeholder="e.g., Myrcene, Caryophyllene, Limonene"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Aroma & Taste</label>
                        <input
                          type="text"
                          value={formData.aroma_taste}
                          onChange={(e) => setFormData({...formData, aroma_taste: e.target.value})}
                          className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                                   focus:border-primary/50 transition-colors"
                          placeholder="e.g., Citrus, diesel, fuel"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Effects</label>
                        <textarea
                          value={formData.effects}
                          onChange={(e) => setFormData({...formData, effects: e.target.value})}
                          rows={3}
                          className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                                   focus:border-primary/50 transition-colors resize-none"
                          placeholder="e.g., Euphoric, Relaxed, Creative, Uplifting"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* ДОБАВЛЕНО: Available Strains для выбора */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="glass-dark rounded-2xl p-6"
                  >
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Available Strains for Product
                    </h2>
                                      
                    {/* НОВОЕ: Информация о типе сорта */}
                    <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm text-primary">
                        {formData.type === 'WHITE' && '🌿 Sativa strains available for WHITE products'}
                        {formData.type === 'BLACK' && '🌙 Indica strains available for BLACK products'}
                        {formData.type === 'CYAN' && '⚡ Hybrid strains available for CYAN products'}
                      </p>
                    </div>
                                      
                    <div>
                      <label className="block text-sm font-medium mb-3">
                        Select which strains customers can choose
                      </label>
                                      
                      {filteredStrains.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <p>No {formData.type === 'WHITE' ? 'Sativa' : formData.type === 'BLACK' ? 'Indica' : 'Hybrid'} strains available.</p>
                          <p className="text-sm mt-2">Create strains in the Strains Management section first.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                          {filteredStrains.map(strain => (
                            <label
                              key={strain.id}
                              className={`p-3 rounded-xl border cursor-pointer transition-all ${
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
                              <div className="text-sm font-medium">{strain.name}</div>
                              <div className="text-xs text-gray-400">{strain.type || 'N/A'}</div>
                            </label>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        These strains will be available for selection on product page
                      </p>
                    </div>
                  </motion.div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-6">
                  {/* Images */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-dark rounded-2xl p-6"
                  >
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-primary" />
                      Product Images
                    </h2>
                    
                    <div className="space-y-4">
                      {/* Main Image */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Main Image *</label>
                        <div className="border-2 border-dashed border-white/20 rounded-xl p-4 
                                      hover:border-primary/50 transition-colors">
                          {previews.main ? (
                            <div className="relative">
                              <img src={previews.main} alt="Preview" 
                                   className="w-full h-48 object-cover rounded-lg" />
                              <button
                                type="button"
                                onClick={() => {
                                  setImages({...images, main: null});
                                  setPreviews({...previews, main: ''});
                                }}
                                className="absolute top-2 right-2 p-1 bg-red-500 rounded-lg 
                                         hover:bg-red-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer block">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleMainImageChange}
                                className="hidden"
                              />
                              <div className="text-center py-8">
                                <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                <p className="text-gray-400">Click to upload main image</p>
                              </div>
                            </label>
                          )}
                        </div>
                      </div>
                      
                      {/* Gallery */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Gallery Images</label>
                        <div className="grid grid-cols-3 gap-2">
                          {previews.gallery.map((preview, index) => (
                            <div key={index} className="relative">
                              <img src={preview} alt={`Gallery ${index + 1}`}
                                   className="w-full h-24 object-cover rounded-lg" />
                              <button
                                type="button"
                                onClick={() => removeGalleryImage(index)}
                                className="absolute top-1 right-1 p-0.5 bg-red-500 rounded 
                                         hover:bg-red-600 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleGalleryChange}
                              className="hidden"
                            />
                            <div className="w-full h-24 border-2 border-dashed border-white/20 
                                          rounded-lg flex items-center justify-center 
                                          hover:border-primary/50 transition-colors">
                              <Plus className="w-6 h-6 text-gray-400" />
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* ДОБАВЛЕНО: Key Features */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-dark rounded-2xl p-6"
                  >
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Key Features
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        {formData.features.map((feature, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={feature}
                              onChange={(e) => handleFeatureChange(index, e.target.value)}
                              className="flex-1 px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                                       focus:border-primary/50 transition-colors"
                              placeholder="e.g., Name: Zip-lock 3.5 g"
                            />
                            {formData.features.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeFeature(index)}
                                className="p-2 rounded-xl hover:bg-red-500/20 text-red-400 
                                         transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={addFeature}
                          className="w-full py-2 rounded-xl border border-dashed border-white/20 
                                   hover:border-primary/50 transition-colors flex items-center 
                                   justify-center gap-2 text-gray-400 hover:text-white"
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
                  
                  {/* Additional Info */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-dark rounded-2xl p-6"
                  >
                    <h2 className="text-xl font-bold mb-4">Additional Information</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Size</label>
                        <input
                          type="text"
                          value={formData.size}
                          onChange={(e) => setFormData({...formData, size: e.target.value})}
                          className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                                   focus:border-primary/50 transition-colors"
                          placeholder="e.g., 1g, 3g, 5g"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">3D Model Filename</label>
                        <input
                          type="text"
                          value={formData.model_3d}
                          onChange={(e) => setFormData({...formData, model_3d: e.target.value})}
                          className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                                   focus:border-primary/50 transition-colors"
                          placeholder="e.g., plastic-bags-white.glb"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          rows={4}
                          className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                                   focus:border-primary/50 transition-colors resize-none"
                          placeholder="Product description..."
                        />
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                          className="w-4 h-4 rounded"
                        />
                        <label htmlFor="is_active" className="text-sm">
                          Product is active and visible
                        </label>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-gradient-to-r from-primary to-secondary 
                             rounded-xl font-semibold flex items-center justify-center gap-2
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Create Product
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewProduct;