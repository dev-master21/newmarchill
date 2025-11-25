import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users as UsersIcon, 
  Search, 
  Mail, 
  TrendingUp,
  Ban,
  CheckCircle,
  XCircle,
  Star,
  Phone,
  Calendar,
  ShoppingBag,
  DollarSign,
  Filter,
  X,
  Send,
  User as UserIcon,
  Shield,
  Clock,
  Package,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import adminService from '../../services/admin.service';
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  username?: string;
  telegram_id?: number;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  role: 'customer' | 'admin';
  points: number;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    fetchUsers();
  }, [currentPage, selectedRole, selectedStatus]);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers({
        page: currentPage,
        limit: 20,
        search: searchQuery,
        role: selectedRole !== 'ALL' ? selectedRole : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus.toLowerCase() : undefined
      });
      
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const stats = await adminService.getUserStatistics();
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to load user statistics');
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  const handleViewUser = async (user: User) => {
    try {
      const details = await adminService.getUserById(user.id);
      setUserDetails(details);
      setSelectedUser(user);
    } catch (error) {
      toast.error('Failed to load user details');
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await adminService.updateUser(userId, { is_active: !currentStatus });
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
        setUserDetails(null);
      }
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleUpdateRole = async (userId: number, newRole: 'customer' | 'admin') => {
    try {
      await adminService.updateUser(userId, { role: newRole });
      toast.success('User role updated successfully');
      fetchUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
        setUserDetails(null);
      }
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Bronze': return 'from-orange-600 to-orange-700';
      case 'Silver': return 'from-gray-400 to-gray-500';
      case 'Gold': return 'from-yellow-500 to-amber-600';
      case 'Platinum': return 'from-purple-500 to-purple-600';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  const getRegistrationMethod = (user: User) => {
    if (user.telegram_id) {
      return { method: 'Telegram', icon: Send, color: 'text-blue-400' };
    } else if (user.email) {
      return { method: 'Email', icon: Mail, color: 'text-green-400' };
    }
    return { method: 'Unknown', icon: UserIcon, color: 'text-gray-400' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statCards = [
    {
      title: 'Total Users',
      value: userStats?.total_users || 0,
      icon: UsersIcon,
      gradient: 'from-blue-400 to-cyan-600',
      subtext: `${userStats?.active_users || 0} active`
    },
    {
      title: 'New This Month',
      value: userStats?.new_users_30d || 0,
      icon: TrendingUp,
      gradient: 'from-purple-400 to-pink-600',
      subtext: 'Last 30 days'
    },
    {
      title: 'Telegram Users',
      value: userStats?.telegram_users || 0,
      icon: Send,
      gradient: 'from-blue-500 to-blue-600',
      subtext: `${userStats?.email_users || 0} email users`
    },
    {
      title: 'Admin Users',
      value: userStats?.admins || 0,
      icon: Shield,
      gradient: 'from-yellow-400 to-orange-600',
      subtext: `${userStats?.customers || 0} customers`
    }
  ];

  return (
    <div className="min-h-screen bg-darker">
      <div className="flex">
        <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
          {/* Header */}
          <div className="glass-dark border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold gradient-text">Users Management</h1>
                <p className="text-gray-400 mt-1">Manage customer accounts and permissions</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-dark p-6 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Filters and Search */}
            <div className="glass-dark p-6 rounded-2xl mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search by name, email, phone, username..."
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                  {(selectedRole !== 'ALL' || selectedStatus !== 'ALL') && (
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                  )}
                </button>

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  className="px-8 py-3 bg-gradient-to-r from-primary to-secondary rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Search
                </button>
              </div>

              {/* Filter Options */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Role Filter */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Role</label>
                        <select
                          value={selectedRole}
                          onChange={(e) => {
                            setSelectedRole(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="ALL">All Roles</option>
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Status</label>
                        <select
                          value={selectedStatus}
                          onChange={(e) => {
                            setSelectedStatus(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="ALL">All Status</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Users Table */}
            <div className="glass-dark rounded-2xl overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                  <p className="text-gray-400 mt-4">Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="p-12 text-center">
                  <UsersIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">User</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Contact</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Registration</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Role & Level</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Orders</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, index) => {
                        const regMethod = getRegistrationMethod(user);
                        const RegIcon = regMethod.icon;
                        
                        return (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            {/* User Info */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                                  {user.name[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold">{user.name}</p>
                                  <p className="text-xs text-gray-400">ID: {user.id}</p>
                                </div>
                              </div>
                            </td>

                            {/* Contact */}
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                {user.email && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-300">{user.email}</span>
                                  </div>
                                )}
                                {user.phone && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-300">{user.phone}</span>
                                  </div>
                                )}
                                {user.telegram_username && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Send className="w-4 h-4 text-blue-400" />
                                    <span className="text-gray-300">@{user.telegram_username}</span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Registration Method & Date */}
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <RegIcon className={`w-4 h-4 ${regMethod.color}`} />
                                  <span className="text-sm">{regMethod.method}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(user.created_at)}</span>
                                </div>
                              </div>
                            </td>

                            {/* Role & Level */}
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold ${
                                  user.role === 'admin' 
                                    ? 'bg-yellow-500/20 text-yellow-400' 
                                    : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                                  {user.role}
                                </span>
                                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r ${getLevelColor(user.level)}`}>
                                  <Star className="w-3 h-3" />
                                  {user.level}
                                </div>
                                <p className="text-xs text-gray-400">{user.points} pts</p>
                              </div>
                            </td>

                            {/* Orders */}
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <ShoppingBag className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm font-semibold">{user.total_orders}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-green-400" />
                                  <span className="text-sm text-green-400">฿{user.total_spent.toFixed(2)}</span>
                                </div>
                                {user.last_order_date && (
                                  <p className="text-xs text-gray-400">
                                    Last: {formatDate(user.last_order_date)}
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              {user.is_active ? (
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-semibold">
                                  <CheckCircle className="w-4 h-4" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-semibold">
                                  <XCircle className="w-4 h-4" />
                                  Inactive
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleViewUser(user)}
                                  className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    user.is_active
                                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                                      : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                                  }`}
                                  title={user.is_active ? 'Deactivate' : 'Activate'}
                                >
                                  {user.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-6 border-t border-white/10">
                  <p className="text-sm text-gray-400">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-4 py-2 bg-white/5 rounded-lg">
                      {currentPage}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && userDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setSelectedUser(null);
              setUserDetails(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-dark rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
                    {selectedUser.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedUser.name}</h2>
                    <p className="text-gray-400">User ID: {selectedUser.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setUserDetails(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* User Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                  
                  {selectedUser.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="text-sm">{selectedUser.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedUser.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Phone</p>
                        <p className="text-sm">{selectedUser.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedUser.telegram_username && (
                    <div className="flex items-center gap-3">
                      <Send className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-xs text-gray-400">Telegram</p>
                        <p className="text-sm">@{selectedUser.telegram_username}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedUser.username && (
                    <div className="flex items-center gap-3">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Username</p>
                        <p className="text-sm">{selectedUser.username}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Account Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                  
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-xs text-gray-400">Role</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          selectedUser.role === 'admin' 
                            ? 'bg-yellow-500/20 text-yellow-400' 
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {selectedUser.role}
                        </span>
                        {selectedUser.role === 'customer' && (
                          <button
                            onClick={() => handleUpdateRole(selectedUser.id, 'admin')}
                            className="text-xs text-primary hover:underline"
                          >
                            Make Admin
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-xs text-gray-400">Level & Points</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r ${getLevelColor(selectedUser.level)}`}>
                          {selectedUser.level}
                        </span>
                        <span className="text-sm">{selectedUser.points} points</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Member Since</p>
                      <p className="text-sm">{formatDateTime(selectedUser.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Last Updated</p>
                      <p className="text-sm">{formatDateTime(selectedUser.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="glass-dark p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-8 h-8 text-blue-400" />
                    <div>
                      <p className="text-xs text-gray-400">Total Orders</p>
                      <p className="text-2xl font-bold">{selectedUser.total_orders}</p>
                    </div>
                  </div>
                </div>
                
                <div className="glass-dark p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="text-xs text-gray-400">Total Spent</p>
                      <p className="text-2xl font-bold text-green-400">฿{selectedUser.total_spent.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="glass-dark p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Package className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="text-xs text-gray-400">Avg Order Value</p>
                      <p className="text-2xl font-bold text-purple-400">
                        ฿{selectedUser.total_orders > 0 
                          ? (selectedUser.total_spent / selectedUser.total_orders).toFixed(2)
                          : '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              {userDetails.recentOrders && userDetails.recentOrders.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                  <div className="space-y-2">
                    {userDetails.recentOrders.map((order: any) => (
                      <div key={order.id} className="glass-dark p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{order.order_number}</p>
                          <p className="text-sm text-gray-400">{formatDateTime(order.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                            order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {order.status}
                          </span>
                          <p className="font-bold">฿{order.total}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => handleToggleUserStatus(selectedUser.id, selectedUser.is_active)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                    selectedUser.is_active
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {selectedUser.is_active ? <Ban className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                  {selectedUser.is_active ? 'Deactivate Account' : 'Activate Account'}
                </button>
                
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setUserDetails(null);
                  }}
                  className="flex-1 py-3 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;