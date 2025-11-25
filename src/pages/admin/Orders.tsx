import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Eye,
  Package,
  User,
  MapPin
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import orderService from '../../services/order.service';
import toast from 'react-hot-toast';

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const fetchOrders = async () => {
    try {
      const filters: any = {};
      if (selectedStatus !== 'ALL') {
        filters.status = selectedStatus;
      }
      
      const data = await orderService.getAllOrders(filters);
      setOrders(data.orders);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus, trackingNumber);
      toast.success('Order status updated');
      fetchOrders();
      setSelectedOrder(null);
      setTrackingNumber('');
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handlePaymentStatusChange = async (orderId: string, paymentStatus: string) => {
    try {
      await orderService.updatePaymentStatus(orderId, paymentStatus);
      toast.success('Payment status updated');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-500';
      case 'processing': return 'bg-blue-500/20 text-blue-500';
      case 'shipped': return 'bg-purple-500/20 text-purple-500';
      case 'delivered': return 'bg-green-500/20 text-green-500';
      case 'cancelled': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'paid': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'refunded': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const statusOptions = ['ALL', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-darker">
      <div className="flex">
        <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <div className="flex-1 ml-64">
          {/* Header */}
          <div className="glass-dark border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold gradient-text">Orders</h1>
                <p className="text-gray-400 mt-1">Manage customer orders</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-400">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
              </div>
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
                  placeholder="Search by order number, customer..."
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2 flex-wrap">
                {statusOptions.map(status => (
                  <motion.button
                    key={status}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      selectedStatus === status
                        ? 'gradient-primary text-white'
                        : 'glass-dark hover:bg-white/10'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
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
                        <th className="text-left p-4 text-gray-400 font-medium">Order</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Customer</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Total</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Payment</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Date</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{order.order_number}</p>
                              <p className="text-sm text-gray-400">{order.item_count} items</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{order.user_name || 'Guest'}</p>
                              <p className="text-sm text-gray-400">{order.user_email}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="font-bold">฿{order.total.toLocaleString()}</p>
                            {order.discount_amount > 0 && (
                              <p className="text-sm text-green-400">-฿{order.discount_amount}</p>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`text-sm font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                              {order.payment_status}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString()}</p>
                          </td>
                          <td className="p-4">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setSelectedOrder(order)}
                              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            >
                              <Eye className="w-4 h-4 text-gray-400" />
                            </motion.button>
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

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-dark p-8 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold">{selectedOrder.order_number}</h3>
                  <p className="text-gray-400">Placed on {new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div className="glass-dark p-6 rounded-2xl">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Customer Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Name</p>
                      <p className="font-medium">{selectedOrder.delivery_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="font-medium">{selectedOrder.user_email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Phone</p>
                      <p className="font-medium">{selectedOrder.delivery_phone}</p>
                    </div>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="glass-dark p-6 rounded-2xl">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Delivery Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Address</p>
                      <p className="font-medium">{selectedOrder.delivery_address}</p>
                      <p className="text-sm">{selectedOrder.delivery_city}, {selectedOrder.delivery_postal_code}</p>
                      <p className="text-sm">{selectedOrder.delivery_country}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Method</p>
                      <p className="font-medium capitalize">{selectedOrder.delivery_method} Delivery</p>
                    </div>
                    {selectedOrder.tracking_number && (
                      <div>
                        <p className="text-sm text-gray-400">Tracking Number</p>
                        <p className="font-medium">{selectedOrder.tracking_number}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="mt-6 glass-dark p-6 rounded-2xl">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Order Summary
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal</span>
                    <span>฿{selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount</span>
                      <span>-฿{selectedOrder.discount_amount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Delivery Fee</span>
                    <span>฿{selectedOrder.delivery_fee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-3 border-t border-white/10">
                    <span>Total</span>
                    <span className="gradient-text">฿{selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div className="mt-6 space-y-4">
                <h4 className="font-semibold">Update Order Status</h4>
                
                {selectedOrder.status === 'processing' && (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Tracking Number</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  {selectedOrder.status === 'pending' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStatusChange(selectedOrder.id, 'processing')}
                      className="px-4 py-2 bg-blue-500/20 text-blue-500 rounded-xl font-medium hover:bg-blue-500/30"
                    >
                      Mark as Processing
                    </motion.button>
                  )}
                  
                  {selectedOrder.status === 'processing' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStatusChange(selectedOrder.id, 'shipped')}
                      className="px-4 py-2 bg-purple-500/20 text-purple-500 rounded-xl font-medium hover:bg-purple-500/30"
                    >
                      Mark as Shipped
                    </motion.button>
                  )}
                  
                  {selectedOrder.status === 'shipped' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStatusChange(selectedOrder.id, 'delivered')}
                      className="px-4 py-2 bg-green-500/20 text-green-500 rounded-xl font-medium hover:bg-green-500/30"
                    >
                      Mark as Delivered
                    </motion.button>
                  )}
                  
                  {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStatusChange(selectedOrder.id, 'cancelled')}
                      className="px-4 py-2 bg-red-500/20 text-red-500 rounded-xl font-medium hover:bg-red-500/30"
                    >
                      Cancel Order
                    </motion.button>
                  )}
                </div>

                {/* Payment Status */}
                {selectedOrder.payment_status === 'pending' && (
                  <div className="flex gap-2 pt-4 border-t border-white/10">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePaymentStatusChange(selectedOrder.id, 'paid')}
                      className="px-4 py-2 bg-green-500/20 text-green-500 rounded-xl font-medium hover:bg-green-500/30"
                    >
                      Mark as Paid
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePaymentStatusChange(selectedOrder.id, 'failed')}
                      className="px-4 py-2 bg-red-500/20 text-red-500 rounded-xl font-medium hover:bg-red-500/30"
                    >
                      Payment Failed
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedOrder(null)}
                className="w-full mt-6 py-3 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition-colors"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;