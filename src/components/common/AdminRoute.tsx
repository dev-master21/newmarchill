import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Loader from './Loader';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading, refreshUserData } = useAuthStore();

  useEffect(() => {
    // Обновляем данные пользователя при каждом заходе на админ-страницу
    if (isAuthenticated && !isLoading) {
      refreshUserData();
    }
  }, [isAuthenticated, isLoading]);

  // Логируем для отладки
  console.log('AdminRoute check:', { isAuthenticated, isLoading, userRole: user?.role });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== 'admin') {
    console.log('Access denied: user role is', user?.role, 'expected: admin');
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default AdminRoute;