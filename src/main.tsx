import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import CartDrawer from './components/cart/CartDrawer';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <CartDrawer />
  </React.StrictMode>
);