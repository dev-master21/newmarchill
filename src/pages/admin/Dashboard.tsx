import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  AlertCircle,
  DollarSign,
  Activity,
  Clock,
  ArrowUp,
  ArrowDown,
  Settings,
  LogOut
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import adminService from '../../services/admin.service';
import AnimatedBackground from '../../components/common/AnimatedBackground';
import AdminSidebar from '../../components/admin/AdminSidebar';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: `฿${stats?.statistics?.orders?.total_revenue?.toLocaleString() || '0'}`,
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      gradient: 'from-green-400 to-emerald-600'
    },
    {
      title: 'Total Orders',
      value: stats?.statistics?.orders?.total_orders || '0',
      change: `${stats?.statistics?.orders?.orders_today || '0'} today`,
      trend: 'up',
      icon: ShoppingBag,
      gradient: 'from-blue-400 to-cyan-600'
    },
    {
      title: 'Active Users',
      value: stats?.statistics?.users?.total_users || '0',
      change: `+${stats?.statistics?.users?.new_users_30d || '0'} this month`,
      trend: 'up',
      icon: Users,
      gradient: 'from-purple-400 to-pink-600'
    },
    {
      title: 'Low Stock Items',
      value: stats?.statistics?.products?.low_stock_products || '0',
      change: 'products',
      trend: stats?.statistics?.products?.low_stock_products > 0 ? 'down' : 'neutral',
      icon: AlertCircle,
      gradient: 'from-yellow-400 to-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-darker relative">
      <AnimatedBackground />
      
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        {/* Main Content */}
        <div className="flex-1 ml-64">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-dark border-b border-white/10 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
                <p className="text-gray-400 mt-1">Welcome back, {user?.name}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/admin/settings')}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Settings className="w-5 h-5 text-gray-400" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <LogOut className="w-5 h-5 text-gray-400" />
                </motion.button>
              </div>
            </div>
          </motion.header>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full"
                />
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -5 }}
                        className="glass-dark p-6 rounded-2xl relative overflow-hidden group"
                      >
                        {/* Background gradient */}
                        <motion.div
                          className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
                        />
                        
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            
                            {stat.trend !== 'neutral' && (
                              <div className={`flex items-center gap-1 text-sm ${
                                stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {stat.trend === 'up' ? (
                                  <ArrowUp className="w-4 h-4" />
                                ) : (
                                  <ArrowDown className="w-4 h-4" />
                                )}
                                <span>{stat.change}</span>
                              </div>
                            )}
                          </div>
                          
                          <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
                          <p className="text-gray-400 text-sm">{stat.title}</p>
                          
                          {stat.trend === 'neutral' && (
                            <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Recent Orders & Top Products */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Orders */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-dark rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Recent Orders
                      </h2>
                      <Link
                        to="/admin/orders"
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        View All
                      </Link>
                    </div>
                    
                    <div className="space-y-4">
                      {stats?.recentOrders?.slice(0, 5).map((order: any, index: number) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.05 }}
                          className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <div>
                            <p className="font-medium">{order.order_number}</p>
                            <p className="text-sm text-gray-400">{order.user_name || 'Guest'}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold">฿{order.total.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">{order.status}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Top Products */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-dark rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Top Products
                      </h2>
                      <Link
                        to="/admin/products"
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        View All
                      </Link>
                    </div>
                    
                    <div className="space-y-4">
                      {stats?.topProducts?.map((product: any, index: number) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.05 }}
                          className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image || '/placeholder.jpg'}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-400">{product.total_sold} sold</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm font-medium text-primary">{product.order_count} orders</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <Link
                    to="/admin/products/new"
                    className="glass-dark p-6 rounded-2xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">Add Product</h3>
                        <p className="text-sm text-gray-400">Create new product listing</p>
                      </div>
                    </div>
                  </Link>
                  
                  <Link
                    to="/admin/orders?status=pending"
                    className="glass-dark p-6 rounded-2xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-600 shadow-lg">
                        <Activity className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">Pending Orders</h3>
                        <p className="text-sm text-gray-400">{stats?.statistics?.orders?.pending_orders || 0} orders waiting</p>
                      </div>
                    </div>
                  </Link>
                  
                  <Link
                    to="/admin/inventory"
                    className="glass-dark p-6 rounded-2xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-red-400 to-pink-600 shadow-lg">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">Low Stock Alert</h3>
                        <p className="text-sm text-gray-400">Check inventory levels</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;