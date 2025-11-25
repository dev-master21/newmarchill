import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users as UsersIcon, 
  Search, 
  Mail, 
  Award,
  TrendingUp,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Star
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import adminService from '../../services/admin.service';
import userService from '../../services/user.service';
import toast from 'react-hot-toast';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, [selectedRole]);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers();
      let filteredUsers = data.users;
      
      if (selectedRole !== 'ALL') {
        filteredUsers = filteredUsers.filter((user: any) => user.role === selectedRole);
      }
      
      setUsers(filteredUsers);
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

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await userService.update(userId, { is_active: !currentStatus });
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
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

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.includes(searchQuery)
  );

  const statCards = [
    {
      title: 'Total Users',
      value: userStats?.total_users || 0,
      icon: UsersIcon,
      gradient: 'from-blue-400 to-cyan-600'
    },
    {
      title: 'Active Users',
      value: userStats?.active_users || 0,
      icon: CheckCircle,
      gradient: 'from-green-400 to-emerald-600'
    },
    {
      title: 'New This Month',
      value: userStats?.new_users_30d || 0,
      icon: TrendingUp,
      gradient: 'from-purple-400 to-pink-600'
    },
    {
      title: 'Admin Users',
      value: userStats?.admins || 0,
      icon: Award,
      gradient: 'from-yellow-400 to-orange-600'
    }
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
                <h1 className="text-3xl font-bold gradient-text">Users</h1>
                <p className="text-gray-400 mt-1">Manage customer accounts</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">{stat.title}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Role Filter */}
              <div className="flex gap-2">
                {['ALL', 'customer', 'admin'].map(role => (
                  <motion.button
                    key={role}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedRole(role)}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      selectedRole === role
                        ? 'gradient-primary text-white'
                        : 'glass-dark hover:bg-white/10'
                    }`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full"
                />
              </div>
            ) : (
              <div className="glass-dark rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-gray-400 font-medium">User</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Contact</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Level</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Points</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Role</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Joined</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-gray-400">ID: {user.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="text-sm">{user.email}</p>
                              {user.phone && (
                                <p className="text-sm text-gray-400">{user.phone}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getLevelColor(user.level)}`}>
                              {user.level}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="font-semibold">{user.points}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' 
                                ? 'bg-purple-500/20 text-purple-500' 
                                : 'bg-blue-500/20 text-blue-500'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`flex items-center gap-1 text-sm ${
                              user.is_active ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {user.is_active ? (
                                <><CheckCircle className="w-4 h-4" /> Active</>
                              ) : (
                                <><XCircle className="w-4 h-4" /> Inactive</>
                              )}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setSelectedUser(user)}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                              >
                                <Edit className="w-4 h-4 text-gray-400" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                              >
                                {user.is_active ? (
                                  <Ban className="w-4 h-4 text-red-400" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                )}
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-dark p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-2xl">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{selectedUser.name}</h3>
                    <p className="text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getLevelColor(selectedUser.level)}`}>
                  {selectedUser.level}
                </span>
              </div>

              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-dark p-6 rounded-2xl">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    {selectedUser.phone && (
                      <div>
                        <p className="text-sm text-gray-400">Phone</p>
                        <p className="font-medium">{selectedUser.phone}</p>
                      </div>
                    )}
                    {selectedUser.address && (
                      <div>
                        <p className="text-sm text-gray-400">Address</p>
                        <p className="font-medium">{selectedUser.address}</p>
                        {selectedUser.city && (
                          <p className="text-sm">{selectedUser.city}, {selectedUser.postal_code}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="glass-dark p-6 rounded-2xl">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Account Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Member Since</p>
                      <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Points</p>
                      <p className="font-medium text-xl gradient-text">{selectedUser.points}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Account Status</p>
                      <p className={`font-medium ${selectedUser.is_active ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedUser.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Role</p>
                      <p className="font-medium capitalize">{selectedUser.role}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleToggleUserStatus(selectedUser.id, selectedUser.is_active)}
                  className={`flex-1 py-3 rounded-xl font-semibold ${
                    selectedUser.is_active
                      ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                      : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                  }`}
                >
                  {selectedUser.is_active ? 'Deactivate Account' : 'Activate Account'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-3 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition-colors"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;