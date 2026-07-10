import { Link } from 'react-router-dom';
import { ShoppingBag, Search, Menu, MapPin, ChevronDown } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  return (
    <header className="main-header">
      {/* Top Main Nav */}
      <div className="nav-top">
        <div className="nav-left">
          <Link to="/" className="nav-brand">
            <ShoppingBag className="brand-icon" size={28} />
            <h1>Shoyo</h1>
          </Link>
          
          <div className="nav-location desktop-only">
            <MapPin size={18} className="location-icon" />
            <div className="location-text">
              <span className="location-label">Deliver to</span>
              <span className="location-value">Select your address</span>
            </div>
          </div>
        </div>

        <div className="nav-search">
          <div className="search-category">
            <span>All</span>
            <ChevronDown size={14} />
          </div>
          <input type="text" placeholder="Search for products, brands and more..." />
          <button className="search-btn">
            <Search size={20} />
          </button>
        </div>

        <div className="nav-right">
          <Link to="/auth" className="nav-account">
            <span className="account-greeting">Hello, sign in</span>
            <span className="account-main">Account & Lists <ChevronDown size={14} /></span>
          </Link>

          <Link to="/orders" className="nav-orders desktop-only">
            <span className="orders-label">Returns</span>
            <span className="orders-main">& Orders</span>
          </Link>

          <Link to="/cart" className="nav-cart">
            <div className="cart-icon-wrapper">
              <ShoppingBag size={28} />
              <span className="cart-badge">0</span>
            </div>
            <span className="cart-label desktop-only">Cart</span>
          </Link>
        </div>
      </div>

      {/* Bottom Sub Nav */}
      <div className="nav-bottom">
        <button className="all-menu-btn">
          <Menu size={20} /> All
        </button>
        <div className="nav-categories">
          <Link to="/categories/electronics">Electronics</Link>
          <Link to="/categories/fashion">Fashion</Link>
          <Link to="/categories/home">Home & Kitchen</Link>
          <Link to="/categories/beauty">Beauty</Link>
          <Link to="/categories/sports">Sports</Link>
          <Link to="/deals">Today's Deals</Link>
          <Link to="/new">New Releases</Link>
        </div>
      </div>
    </header>
  );
}
