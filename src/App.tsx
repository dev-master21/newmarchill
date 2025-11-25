import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
import { useProductsStore } from './store/productsStore';
import AgeVerification from './components/common/AgeVerification';
import Loader from './components/common/Loader';
import BottomNav from './components/common/BottomNav';
import TopNav from './components/common/TopNav';
import Noise from './components/common/Noise';
import PrivateRoute from './components/common/PrivateRoute';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductPage from './pages/ProductPage';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import TelegramCallback from './pages/TelegramCallback';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminSettings from './pages/admin/Settings';
import AdminStrains from './pages/admin/Strains';
import AdminRoute from './components/common/AdminRoute';
import NewProduct from './pages/admin/NewProduct';
import EditProduct from './pages/admin/EditProduct';
import AdminPromoCodes from './pages/admin/PromoCodes';
import PromoCodeForm from './pages/admin/PromoCodeForm';
import PromoCodeDetail from './pages/admin/PromoCodeDetail';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const { checkAuth, isAuthenticated } = useAuthStore();
  const { fetchCart } = useCartStore();
  const { fetchProducts } = useProductsStore();

  useEffect(() => {
    const init = async () => {
      // Check age verification
      const verified = localStorage.getItem('ageVerified') === 'true';
      setIsAgeVerified(verified);
      
      // Check authentication
      await checkAuth();
      
      // Fetch products
      await fetchProducts();
      
      // Fetch cart if authenticated
      if (isAuthenticated) {
        await fetchCart();
      }
      
      setIsLoading(false);
    };
    
    init();
  }, [checkAuth, fetchProducts, fetchCart, isAuthenticated]);

  const handleAgeVerification = () => {
    setIsAgeVerified(true);
    localStorage.setItem('ageVerified', 'true');
  };

  if (isLoading) {
    return <Loader />;
  }

  if (!isAgeVerified) {
    return <AgeVerification onVerify={handleAgeVerification} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-black">
        <Noise />
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: 'rgba(0, 0, 0, 0.9)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
            },
          }}
        />
        
        <TopNav />
        
        <main className="pb-16 md:pb-0">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/telegram-callback" element={<TelegramCallback />} />
            <Route path="/admin/promo-codes" element={<AdminRoute><AdminPromoCodes /></AdminRoute>} />
            <Route path="/admin/promo-codes/new" element={<AdminRoute><PromoCodeForm /></AdminRoute>} />
            <Route path="/admin/promo-codes/:id" element={<AdminRoute><PromoCodeDetail /></AdminRoute>} />
            <Route path="/admin/promo-codes/:id/edit" element={<AdminRoute><PromoCodeForm /></AdminRoute>} />
            {/* Protected routes */}
            <Route path="/cart" element={
              <PrivateRoute>
                <Cart />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/checkout" element={
              <PrivateRoute>
                <Checkout />
              </PrivateRoute>
            } />
            
            {/* Admin routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/products" element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            } />
            <Route path="/admin/products/new" element={
              <AdminRoute>
                <NewProduct />
              </AdminRoute>
            } />
            <Route path="/admin/products/edit/:id" element={
              <AdminRoute>
                <EditProduct />
              </AdminRoute>
            } />
            <Route path="/admin/strains" element={
              <AdminRoute>
                <AdminStrains />
              </AdminRoute>
            } />
            <Route path="/admin/orders" element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            } />
            <Route path="/admin/settings" element={
              <AdminRoute>
                <AdminSettings />
              </AdminRoute>
            } />
          </Routes>
        </main>
        
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;