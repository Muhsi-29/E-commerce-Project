import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { ADMIN_URL } from './config.ts';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RequireAuth from './components/RequireAuth';
import PageState from './components/PageState';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import OrdersPage from './pages/OrdersPage';
import InvoicePage from './pages/InvoicePage';
import WishlistPage from './pages/WishlistPage';
import AccountPage from './pages/AccountPage';
import AddressesPage from './pages/AddressesPage';
import AuthPage from './pages/AuthPage';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/PasswordPages';
import SellPage from './pages/SellPage';
import StorePage from './pages/StorePage';
import SellerDashboard from './pages/seller/SellerDashboard';
import InfoPage from './pages/InfoPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';

// Start each new page at the top
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0); // Braces matter: newer browsers return a Promise here, which React would treat as a cleanup function
  }, [pathname]);
  return null;
}

// The admin dashboard is its own app now (the Admin-Panel project); old /admin links point there
function AdminMoved() {
  return (
    <PageState
      icon={<ShieldCheck size={48} strokeWidth={1.5} />}
      title="The admin panel has moved"
      message="Store management now lives in the separate Shoyo Admin app."
      action={<a href={ADMIN_URL} className="btn btn-primary btn-inline">Open the admin panel</a>}
    />
  );
}

function App() {
  return (
    <div className="app-container">
      <ScrollToTop />
      <Navbar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/store/:slug" element={<StorePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/sell" element={<SellPage />} />

          {/* Help and policies */}
          <Route path="/help/shipping" element={<InfoPage topic="shipping" />} />
          <Route path="/help/returns" element={<InfoPage topic="returns" />} />
          <Route path="/privacy" element={<InfoPage topic="privacy" />} />
          <Route path="/terms" element={<InfoPage topic="terms" />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Logged-in shoppers */}
          <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
          <Route path="/checkout/success" element={<RequireAuth><CheckoutSuccessPage /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
          <Route path="/orders/:id/invoice" element={<RequireAuth><InvoicePage /></RequireAuth>} />
          <Route path="/wishlist" element={<RequireAuth><WishlistPage /></RequireAuth>} />
          <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
          <Route path="/account/addresses" element={<RequireAuth><AddressesPage /></RequireAuth>} />

          {/* Sellers */}
          <Route path="/seller" element={<RequireAuth><SellerDashboard /></RequireAuth>} />

          <Route path="/admin/*" element={<AdminMoved />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
