import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  Package,
  DollarSign,
  Clock,
  User,
  Phone,
  MapPin,
  Calendar,
  Truck,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import adminService from '../../services/admin.service';
import toast from 'react-hot-toast';

interface Order {
  id: number;
  order_number: string;
  user_id: number;
  user_name: string;
  user_email: string;
  user_phone?: string;
  user_telegram?: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total: number;
  currency: string;
  delivery_method: string;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_postal_code: string;
  delivery_country: string;
  gift_message?: string;
  notes?: string;
  tracking_number?: string;
  items_count: number;
  created_at: string;
  updated_at: string;
}

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [orderStats, setOrderStats] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, selectedStatus]);

  useEffect(() => {
    fetchOrderStats();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await adminService.getOrders({
        page: currentPage,
        limit: 20,
        search: searchQuery,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined
      });

      setOrders(data.orders);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStats = async () => {
    try {
      const stats = await adminService.getOrderStatistics();
      setOrderStats(stats);
    } catch (error) {
      console.error('Failed to load order statistics');
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchOrders();
  };

  const handleViewOrder = async (order: Order) => {
    try {
      const details = await adminService.getOrderById(order.id);
      setOrderDetails(details.order);
      setSelectedOrder(order);
    } catch (error) {
      toast.error('Failed to load order details');
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await adminService.updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated successfully');
      fetchOrders();
      fetchOrderStats();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
        setOrderDetails(null);
      }
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      await adminService.deleteOrder(orderToDelete);
      toast.success('Order deleted successfully');
      setShowDeleteConfirm(false);
      setOrderToDelete(null);
      fetchOrders();
      fetchOrderStats();
      if (selectedOrder?.id === orderToDelete) {
        setSelectedOrder(null);
        setOrderDetails(null);
      }
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'processing':
        return 'bg-blue-500/20 text-blue-400';
      case 'shipped':
        return 'bg-purple-500/20 text-purple-400';
      case 'delivered':
        return 'bg-green-500/20 text-green-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'New';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Completed';
      case 'cancelled':
        return 'Not Relevant';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statCards = [
    {
      title: 'Total Orders',
      value: orderStats?.total_orders || 0,
      icon: ShoppingBag,
      gradient: 'from-blue-400 to-cyan-600',
      subtext: `${orderStats?.orders_today || 0} today`
    },
    {
      title: 'New Orders',
      value: orderStats?.pending_orders || 0,
      icon: Clock,
      gradient: 'from-yellow-400 to-orange-600',
      subtext: 'Require processing'
    },
    {
      title: 'Completed',
      value: orderStats?.delivered_orders || 0,
      icon: CheckCircle,
      gradient: 'from-green-400 to-emerald-600',
      subtext: 'Successfully delivered'
    },
    {
      title: 'Total Revenue',
      value: `฿${orderStats?.total_revenue?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      gradient: 'from-purple-400 to-pink-600',
      subtext: `฿${orderStats?.revenue_30d?.toFixed(2) || '0.00'} last 30 days`
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
                <h1 className="text-3xl font-bold gradient-text">Orders Management</h1>
                <p className="text-gray-400 mt-1">View and manage all orders</p>
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
                      placeholder="Search by order number, customer name, email, phone..."
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
                  {selectedStatus !== 'ALL' && (
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
                    <div className="pt-4 mt-4 border-t border-white/10">
                      <label className="block text-sm text-gray-400 mb-2">Order Status</label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => {
                          setSelectedStatus(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="pending">New</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Completed</option>
                        <option value="cancelled">Not Relevant</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Orders Table */}
            <div className="glass-dark rounded-2xl overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                  <p className="text-gray-400 mt-4">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="p-12 text-center">
                  <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No orders found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Order</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Customer</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Total</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, index) => (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          {/* Order Info */}
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold">{order.order_number}</p>
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <Package className="w-3 h-3" />
                                {order.items_count} item(s)
                              </p>
                            </div>
                          </td>

                          {/* Customer */}
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold">{order.user_name}</p>
                              {order.user_email && (
                                <p className="text-xs text-gray-400">{order.user_email}</p>
                              )}
                            </div>
                          </td>

                          {/* Date */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>{formatDate(order.created_at)}</span>
                            </div>
                          </td>

                          {/* Total */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-400" />
                              <span className="font-bold text-green-400">
                                ฿{order.total.toFixed(2)}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold ${getStatusColor(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewOrder(order)}
                                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {order.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'delivered')}
                                  className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                                  title="Complete"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                                  className="p-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors"
                                  title="Not Relevant"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setOrderToDelete(order.id);
                                  setShowDeleteConfirm(true);
                                }}
                                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
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

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && orderDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setSelectedOrder(null);
              setOrderDetails(null);
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
                <div>
                  <h2 className="text-2xl font-bold">Order {orderDetails.order_number}</h2>
                  <p className="text-gray-400 mt-1">ID: {orderDetails.id}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setOrderDetails(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Status and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="glass-dark p-4 rounded-xl">
                  <p className="text-sm text-gray-400 mb-2">Order Status</p>
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold ${getStatusColor(orderDetails.status)}`}>
                    {getStatusLabel(orderDetails.status)}
                  </span>
                </div>
                <div className="glass-dark p-4 rounded-xl">
                  <p className="text-sm text-gray-400 mb-2">Created At</p>
                  <p className="font-semibold">{formatDate(orderDetails.created_at)}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
                <div className="glass-dark p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Name</p>
                      <p className="font-semibold">{orderDetails.user_name}</p>
                    </div>
                  </div>
                  {orderDetails.user_email && (
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="font-semibold">{orderDetails.user_email}</p>
                      </div>
                    </div>
                  )}
                  {orderDetails.user_phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Phone</p>
                        <p className="font-semibold">{orderDetails.user_phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Delivery Information</h3>
                <div className="glass-dark p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Recipient</p>
                      <p className="font-semibold">{orderDetails.delivery_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Phone</p>
                      <p className="font-semibold">{orderDetails.delivery_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-400">Delivery Address</p>
                      <p className="font-semibold">
                        {orderDetails.delivery_address}, {orderDetails.delivery_city}
                        {orderDetails.delivery_postal_code && `, ${orderDetails.delivery_postal_code}`}
                        {orderDetails.delivery_country && `, ${orderDetails.delivery_country}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Delivery Method</p>
                      <p className="font-semibold capitalize">{orderDetails.delivery_method}</p>
                    </div>
                  </div>
                  {orderDetails.gift_message && (
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-xs text-gray-400">Gift Message</p>
                        <p className="font-semibold">{orderDetails.gift_message}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                <div className="space-y-3">
                  {orderDetails.items.map((item: any) => (
                    <div key={item.id} className="glass-dark p-4 rounded-xl flex items-center gap-4">
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{item.product_name}</p>
                        {item.strain_name && (
                          <p className="text-sm text-gray-400">Strain: {item.strain_name}</p>
                        )}
                        <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400">฿{item.total.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">฿{item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="glass-dark p-4 rounded-xl mb-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="font-semibold">฿{orderDetails.subtotal.toFixed(2)}</span>
                </div>
                {orderDetails.discount_amount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>-฿{orderDetails.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Delivery</span>
                  <span className="font-semibold">฿{orderDetails.delivery_fee.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-green-400">฿{orderDetails.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                {orderDetails.status === 'pending' && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(orderDetails.id, 'delivered');
                      setSelectedOrder(null);
                      setOrderDetails(null);
                    }}
                    className="flex-1 py-3 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Complete Order
                  </button>
                )}
                {orderDetails.status !== 'cancelled' && orderDetails.status !== 'delivered' && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(orderDetails.id, 'cancelled');
                      setSelectedOrder(null);
                      setOrderDetails(null);
                    }}
                    className="flex-1 py-3 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Not Relevant
                  </button>
                )}
                <button
                  onClick={() => {
                    setOrderToDelete(orderDetails.id);
                    setShowDeleteConfirm(true);
                  }}
                  className="flex-1 py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Order
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => {
              setShowDeleteConfirm(false);
              setOrderToDelete(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-dark rounded-2xl p-8 max-w-md w-full"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-500/20 rounded-xl">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Delete Order?</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setOrderToDelete(null);
                  }}
                  className="flex-1 py-3 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteOrder}
                  className="flex-1 py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl font-semibold transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;