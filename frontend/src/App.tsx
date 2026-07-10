import { Routes, Route, Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import AuthPage from './pages/AuthPage';
import AdminAuthPage from './pages/AdminAuthPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <div className="app-container">
      {/* Premium eCommerce Navbar */}
      <Navbar />

      {/* Main Content Area Routing */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/admin/login" element={<AdminAuthPage />} />
          <Route path="*" element={<div className="not-found">Page Coming Soon...</div>} />
        </Routes>
      </main>

      {/* Premium Footer */}
      <Footer />
    </div>
  );
}

function Home() {
  return (
    <div className="hero-section">
      <div className="hero-content">
        <h2 className="hero-badge">New Arrival 2026</h2>
        <h1 className="hero-title">Discover the Future of Style.</h1>
        <p className="hero-subtitle">
          Explore our premium collection of meticulously crafted products designed for the modern lifestyle.
        </p>
        <div className="hero-actions">
          <Link to="/products" className="btn btn-primary">
            Shop Collection <ShoppingBag size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default App;
