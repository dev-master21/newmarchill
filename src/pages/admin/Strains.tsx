import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertCircle,
  Hash,
  Droplet
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AnimatedBackground from '../../components/common/AnimatedBackground';
import strainService, { Strain } from '../../services/strain.service';
import toast from 'react-hot-toast';

const AdminStrains: React.FC = () => {
  const [strains, setStrains] = useState<Strain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingStrain, setEditingStrain] = useState<Strain | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Hybrid' as 'Sativa' | 'Indica' | 'Hybrid',
    thc_content: '',
    cbd_content: '',
    terpenes: '',
    aroma_taste: '',
    effects: ''
  });

  useEffect(() => {
    fetchStrains();
  }, []);

  const fetchStrains = async () => {
    try {
      const data = await strainService.getStrains();
      setStrains(data);
    } catch (error) {
      toast.error('Failed to load strains');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingStrain) {
        await strainService.updateStrain(editingStrain.id!, formData);
        toast.success('Strain updated successfully');
      } else {
        await strainService.createStrain(formData);
        toast.success('Strain created successfully');
      }
      
      setShowModal(false);
      setEditingStrain(null);
      resetForm();
      fetchStrains();
    } catch (error) {
      toast.error('Failed to save strain');
    }
  };

  const handleEdit = (strain: Strain) => {
    setEditingStrain(strain);
    
    // Проверяем и безопасно приводим тип
    let strainType: 'Sativa' | 'Indica' | 'Hybrid' = 'Hybrid';
    if (strain.type === 'Sativa' || strain.type === 'Indica' || strain.type === 'Hybrid') {
      strainType = strain.type;
    }
    
    setFormData({
      name: strain.name,
      description: strain.description || '',
      type: strainType,
      thc_content: strain.thc_content || '',
      cbd_content: strain.cbd_content || '',
      terpenes: strain.terpenes || '',
      aroma_taste: strain.aroma_taste || '',
      effects: strain.effects || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await strainService.deleteStrain(id);
      toast.success('Strain deleted successfully');
      setShowDeleteModal(null);
      fetchStrains();
    } catch (error) {
      toast.error('Failed to delete strain');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'Hybrid',
      thc_content: '',
      cbd_content: '',
      terpenes: '',
      aroma_taste: '',
      effects: ''
    });
  };

  const filteredStrains = strains.filter(strain => {
    const matchesSearch = strain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          strain.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'ALL' || strain.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      <div className="flex relative z-10">
        <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <div className="glass-dark border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold gradient-text">Strains Management</h1>
                <p className="text-gray-400 mt-1">Manage cannabis strains and their properties</p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setEditingStrain(null);
                  resetForm();
                  setShowModal(true);
                }}
                className="bg-gradient-to-r from-primary to-secondary px-6 py-3 rounded-xl 
                         font-semibold flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Strain
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
                      placeholder="Search strains..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/5 rounded-xl border border-white/10 
                               focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>
                
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                           focus:border-primary/50 transition-colors"
                >
                  <option value="ALL">All Types</option>
                  <option value="Sativa">Sativa</option>
                  <option value="Indica">Indica</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>
            
            {/* Strains Grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStrains.map(strain => (
                  <motion.div
                    key={strain.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-dark rounded-2xl p-6 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{strain.name}</h3>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2
                          ${strain.type === 'Sativa' ? 'bg-green-500/20 text-green-400' :
                            strain.type === 'Indica' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-blue-500/20 text-blue-400'}`}>
                          {strain.type || 'Unknown'}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(strain)}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowDeleteModal(strain.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {strain.thc_content && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Hash className="w-4 h-4" />
                          <span>THC: {strain.thc_content}</span>
                        </div>
                      )}
                      
                      {strain.cbd_content && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Droplet className="w-4 h-4" />
                          <span>CBD: {strain.cbd_content}</span>
                        </div>
                      )}
                      
                      {strain.aroma_taste && (
                        <div className="text-gray-400">
                          <span className="font-semibold">Aroma:</span> {strain.aroma_taste}
                        </div>
                      )}
                      
                      {strain.effects && (
                        <div className="text-gray-400">
                          <span className="font-semibold">Effects:</span> {strain.effects}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-dark rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-6">
                {editingStrain ? 'Edit Strain' : 'Add New Strain'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                               focus:border-primary/50 transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                      className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                               focus:border-primary/50 transition-colors"
                    >
                      <option value="Sativa">Sativa</option>
                      <option value="Indica">Indica</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">THC Content</label>
                    <input
                      type="text"
                      placeholder="e.g., 25%"
                      value={formData.thc_content}
                      onChange={(e) => setFormData({...formData, thc_content: e.target.value})}
                      className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                               focus:border-primary/50 transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">CBD Content</label>
                    <input
                      type="text"
                      placeholder="e.g., <0.3%"
                      value={formData.cbd_content}
                      onChange={(e) => setFormData({...formData, cbd_content: e.target.value})}
                      className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                               focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Terpenes</label>
                  <input
                    type="text"
                    placeholder="e.g., Myrcene, Caryophyllene, Limonene"
                    value={formData.terpenes}
                    onChange={(e) => setFormData({...formData, terpenes: e.target.value})}
                    className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                             focus:border-primary/50 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Aroma & Taste</label>
                  <input
                    type="text"
                    placeholder="e.g., Citrus, diesel, fuel"
                    value={formData.aroma_taste}
                    onChange={(e) => setFormData({...formData, aroma_taste: e.target.value})}
                    className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                             focus:border-primary/50 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Effects</label>
                  <textarea
                    placeholder="e.g., Euphoric, Relaxed, Creative, Uplifting"
                    value={formData.effects}
                    onChange={(e) => setFormData({...formData, effects: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                             focus:border-primary/50 transition-colors resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    placeholder="Detailed strain description..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 
                             focus:border-primary/50 transition-colors resize-none"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary 
                             rounded-xl font-semibold"
                  >
                    {editingStrain ? 'Update Strain' : 'Create Strain'}
                  </motion.button>
                  
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 bg-white/10 rounded-xl font-semibold 
                             hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <h3 className="text-xl font-bold">Delete Strain</h3>
                  <p className="text-gray-400 text-sm">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this strain? Products using this strain will not be affected.
              </p>
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDelete(showDeleteModal)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold 
                           hover:bg-red-600 transition-colors"
                >
                  Delete Strain
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 py-3 bg-white/10 rounded-xl font-semibold 
                           hover:bg-white/20 transition-colors"
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

export default AdminStrains;