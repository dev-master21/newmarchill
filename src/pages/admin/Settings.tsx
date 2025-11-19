import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Store, 
  Bell, 
  Shield, 
  Save,
  DollarSign,
  Truck,
  Hash
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import toast from 'react-hot-toast';

const AdminSettings: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('store');
  const [settings, setSettings] = useState({
    // Store Settings
    storeName: 'Chillium',
    storeEmail: 'support@chillium.com',
    storePhone: '+66 98 765 4321',
    storeAddress: '123/45 Sukhumvit Rd, Bangkok 10110',
    currency: 'THB',
    timezone: 'Asia/Bangkok',
    
    // Delivery Settings
    standardDeliveryFee: 100,
    expressDeliveryFee: 200,
    freeDeliveryThreshold: 2500,
    deliveryTimeStandard: '2-3 business days',
    deliveryTimeExpress: 'Next business day',
    
    // Order Settings
    minOrderAmount: 500,
    maxOrderAmount: 50000,
    orderNumberPrefix: 'CHI',
    autoConfirmOrders: false,
    
    // Inventory Settings
    lowStockThreshold: 10,
    enableStockTracking: true,
    hideOutOfStock: false,
    
    // Notification Settings
    orderNotifications: true,
    lowStockNotifications: true,
    newUserNotifications: true,
    paymentNotifications: true,
    
    // Security Settings
    requireEmailVerification: false,
    requirePhoneVerification: false,
    passwordMinLength: 6,
    sessionTimeout: 7,
  });

  const handleSave = () => {
    // Here you would typically save to backend
    toast.success('Settings saved successfully');
  };

  const tabs = [
    { id: 'store', label: 'Store Info', icon: Store },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'orders', label: 'Orders', icon: DollarSign },
    { id: 'inventory', label: 'Inventory', icon: Hash },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-darker">
      <div className="flex">
        <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <div className="flex-1 ml-64">
          {/* Header */}
          <div className="glass-dark border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold gradient-text">Settings</h1>
                <p className="text-gray-400 mt-1">Configure your store settings</p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                className="px-6 py-3 gradient-primary text-white rounded-xl font-semibold flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </motion.button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex gap-6">
              {/* Tabs */}
              <div className="w-64">
                <div className="glass-dark rounded-2xl p-4">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <motion.button
                        key={tab.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border border-primary/30'
                            : 'hover:bg-white/10 text-gray-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-dark rounded-2xl p-8"
                >
                  {/* Store Info */}
                  {activeTab === 'store' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold mb-6">Store Information</h3>
                      
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Store Name</label>
                        <input
                          type="text"
                          value={settings.storeName}
                          onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Email</label>
                          <input
                            type="email"
                            value={settings.storeEmail}
                            onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Phone</label>
                          <input
                            type="tel"
                            value={settings.storePhone}
                            onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Address</label>
                        <textarea
                          value={settings.storeAddress}
                          onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 resize-none"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Currency</label>
                          <select
                            value={settings.currency}
                            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50"
                          >
                            <option value="THB">THB (฿)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Timezone</label>
                          <select
                            value={settings.timezone}
                            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50"
                          >
                            <option value="Asia/Bangkok">Asia/Bangkok</option>
                            <option value="Asia/Tokyo">Asia/Tokyo</option>
                            <option value="Europe/London">Europe/London</option>
                            <option value="America/New_York">America/New_York</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delivery Settings */}
                  {activeTab === 'delivery' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold mb-6">Delivery Settings</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Standard Delivery Fee</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">฿</span>
                            <input
                              type="number"
                              value={settings.standardDeliveryFee}
                              onChange={(e) => setSettings({ ...settings, standardDeliveryFee: parseInt(e.target.value) })}
                              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Express Delivery Fee</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">฿</span>
                            <input
                              type="number"
                              value={settings.expressDeliveryFee}
                              onChange={(e) => setSettings({ ...settings, expressDeliveryFee: parseInt(e.target.value) })}
                              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Free Delivery Threshold</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">฿</span>
                          <input
                            type="number"
                            value={settings.freeDeliveryThreshold}
                            onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: parseInt(e.target.value) })}
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Orders above this amount get free delivery</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Standard Delivery Time</label>
                          <input
                            type="text"
                            value={settings.deliveryTimeStandard}
                            onChange={(e) => setSettings({ ...settings, deliveryTimeStandard: e.target.value })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Express Delivery Time</label>
                          <input
                            type="text"
                            value={settings.deliveryTimeExpress}
                            onChange={(e) => setSettings({ ...settings, deliveryTimeExpress: e.target.value })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notification Settings */}
                  {activeTab === 'notifications' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold mb-6">Notification Settings</h3>
                      
                      <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                          <div>
                            <p className="font-medium">Order Notifications</p>
                            <p className="text-sm text-gray-400">Receive alerts for new orders</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.orderNotifications}
                            onChange={(e) => setSettings({ ...settings, orderNotifications: e.target.checked })}
                            className="w-5 h-5 rounded accent-primary"
                          />
                        </label>
                        
                        <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                          <div>
                            <p className="font-medium">Low Stock Alerts</p>
                            <p className="text-sm text-gray-400">Get notified when products are running low</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.lowStockNotifications}
                            onChange={(e) => setSettings({ ...settings, lowStockNotifications: e.target.checked })}
                            className="w-5 h-5 rounded accent-primary"
                          />
                        </label>
                        
                        <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                          <div>
                            <p className="font-medium">New User Notifications</p>
                            <p className="text-sm text-gray-400">Alert when new users register</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.newUserNotifications}
                            onChange={(e) => setSettings({ ...settings, newUserNotifications: e.target.checked })}
                            className="w-5 h-5 rounded accent-primary"
                          />
                        </label>
                        
                        <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                          <div>
                            <p className="font-medium">Payment Notifications</p>
                            <p className="text-sm text-gray-400">Receive payment status updates</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.paymentNotifications}
                            onChange={(e) => setSettings({ ...settings, paymentNotifications: e.target.checked })}
                            className="w-5 h-5 rounded accent-primary"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;