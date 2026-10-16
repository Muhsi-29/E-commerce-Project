import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShoppingBag, Search, Menu, MapPin, ChevronDown, LogOut, Package, Heart, User, Store, ShieldCheck, ExternalLink, Tag, LayoutGrid,
  Truck, RotateCcw, TicketPercent, Megaphone,
} from 'lucide-react';
import { api } from '../api.ts';
import { ADMIN_URL } from '../config.ts';
import { useAuth } from '../context/auth.ts';
import { useCart } from '../context/cart.ts';
import { useStoreConfig } from '../context/storeConfig.ts';
import { useWishlist } from '../context/wishlist.ts';
import type { Category, Coupon, Product } from '../types.ts';
import { formatPrice } from '../utils/format.ts';
import { getPincode, isValidPincode, PINCODE_EVENT, savePincode } from '../utils/pincode.ts';
import ProductImage from './ProductImage.tsx';
import './Navbar.css';

type SuggestedProduct = Pick<Product, 'id' | 'title' | 'image' | 'price' | 'category' | 'brand'>;

interface Suggestions {
  query: string; // The text these suggestions are for
  products: SuggestedProduct[];
  brands: string[];
  categories: string[];
}

interface SuggestionOption {
  key: string;
  to: string;
  kind: 'product' | 'brand' | 'category' | 'search';
  label: string;
  product?: SuggestedProduct;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { ids: wishlistIds } = useWishlist();
  const config = useStoreConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pincode, setPincode] = useState(getPincode);
  const [pincodeOpen, setPincodeOpen] = useState(false);
  const [pincodeDraft, setPincodeDraft] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const pincodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/products/categories').then(res => setCategories(res.data.data)).catch(() => {});
    api.get('/coupons').then(res => setCoupons(res.data.data)).catch(() => {});
  }, []);

  // Once the offers bar has scrolled away, the header sits flat against the top of the window
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 36);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  // On the products page, show the current search in the search box; elsewhere, start empty
  useEffect(() => {
    const onProducts = location.pathname === '/products';
    setQuery(onProducts ? searchParams.get('q') ?? '' : '');
    setSearchCategory(onProducts ? searchParams.get('category') ?? '' : '');
  }, [location.pathname, searchParams]);

  // Close menus when changing page
  useEffect(() => {
    setMenuOpen(false);
    setPincodeOpen(false);
    setSuggestOpen(false);
  }, [location]);

  // ...and when clicking elsewhere
  useEffect(() => {
    if (!menuOpen && !pincodeOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
      if (!pincodeRef.current?.contains(e.target as Node)) setPincodeOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen, pincodeOpen]);

  // The PIN code can also be changed on a product page
  useEffect(() => {
    const update = () => setPincode(getPincode());
    window.addEventListener(PINCODE_EVENT, update);
    return () => window.removeEventListener(PINCODE_EVENT, update);
  }, []);

  // Search suggestions, fetched shortly after the shopper stops typing
  const trimmed = query.trim();
  useEffect(() => {
    if (trimmed.length < 2) return;
    let active = true;
    const timer = setTimeout(() => {
      api.get('/products/suggest', { params: { q: trimmed } })
        .then(res => { if (active) setSuggestions({ query: trimmed, ...res.data.data }); })
        .catch(() => {});
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [trimmed]);

  const current = suggestions && suggestions.query === trimmed && trimmed.length >= 2 ? suggestions : null;
  const options: SuggestionOption[] = current ? [
    ...current.products.map(p => ({ key: `p${p.id}`, to: `/products/${p.id}`, kind: 'product' as const, label: p.title, product: p })),
    ...current.brands.map(b => ({ key: `b${b}`, to: `/products?brand=${encodeURIComponent(b)}`, kind: 'brand' as const, label: b })),
    ...current.categories.map(c => ({ key: `c${c}`, to: `/products?category=${encodeURIComponent(c)}`, kind: 'category' as const, label: c })),
    { key: 'search', to: `/products?q=${encodeURIComponent(trimmed)}`, kind: 'search' as const, label: trimmed },
  ] : [];
  const showSuggestions = suggestOpen && options.length > 0;

  const search = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (trimmed) params.set('q', trimmed);
    if (searchCategory) params.set('category', searchCategory);
    const queryString = params.toString();
    setSuggestOpen(false);
    navigate(queryString ? `/products?${queryString}` : '/products');
  };

  const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && options[activeIndex]) {
      e.preventDefault();
      setSuggestOpen(false);
      navigate(options[activeIndex].to);
    } else if (e.key === 'Escape') {
      setSuggestOpen(false);
    }
  };

  const savePin = (e: FormEvent) => {
    e.preventDefault();
    const value = pincodeDraft.trim();
    if (!isValidPincode(value)) {
      setPincodeError('Enter a valid 6-digit PIN code');
      return;
    }
    savePincode(value);
    setPincodeOpen(false);
  };

  const signOut = () => {
    logout();
    navigate('/');
  };

  // The offers bar lines are set in the admin panel; an icon is picked from what each line is about
  const iconFor = (text: string) =>
    /code|coupon|% off|₹\d+ off/i.test(text) ? TicketPercent
      : /deliver|shipping/i.test(text) ? Truck
      : /return|refund/i.test(text) ? RotateCcw
      : /sell|store/i.test(text) ? Store
      : Megaphone;
  const offers = config.announcements.length > 0
    ? config.announcements.map(text => ({ icon: iconFor(text), text }))
    : [
      { icon: Truck, text: `Free delivery on orders over ${formatPrice(config.delivery.freeThreshold)}` },
      ...coupons.slice(0, 2).map(c => ({ icon: TicketPercent, text: `Use code ${c.code}: ${c.description}` })),
      { icon: RotateCcw, text: `${config.returnWindowDays}-day easy returns` },
    ];
  const onProducts = location.pathname === '/products';
  const currentCategory = onProducts ? searchParams.get('category') ?? '' : '';
  const currentSort = onProducts ? searchParams.get('sort') ?? '' : '';

  const firstName = user?.name.split(' ')[0];
  const seller = user?.seller;
  const hasStore = seller?.status === 'APPROVED' || seller?.status === 'SUSPENDED';

  return (
    <>
      <div className="announce-bar">
        <div className="announce-marquee" aria-label="Offers">
          {/* The list is shown twice so the scroll can loop without a gap; screen readers get it once */}
          {[0, 1].map(copy => (
            <ul key={copy} className="announce-track" aria-hidden={copy === 1 ? 'true' : undefined}>
              {offers.map(offer => (
                <li key={offer.text}><offer.icon size={15} /> {offer.text}</li>
              ))}
            </ul>
          ))}
        </div>
        <nav className="announce-links desktop-only" aria-label="Help">
          <Link to="/sell">Sell on Shoyo</Link>
          <Link to="/help/shipping">Help</Link>
          <Link to="/orders">Track order</Link>
        </nav>
      </div>

      <header className={`main-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-top">
          <div className="nav-left">
            <Link to="/" className="nav-brand">
              <ShoppingBag className="brand-icon" size={28} />
              <h1>Shoyo</h1>
            </Link>

            <div className="nav-location-wrap desktop-only" ref={pincodeRef}>
              <button
                className="nav-location"
                onClick={() => { setPincodeDraft(pincode); setPincodeError(''); setPincodeOpen(open => !open); }}
                aria-expanded={pincodeOpen}
              >
                <MapPin size={18} className="location-icon" />
                <span className="location-text">
                  <span className="location-label">{pincode ? `Deliver to ${firstName ?? 'you'}` : 'Delivering to'}</span>
                  <span className="location-value">{pincode || 'Enter PIN code'}</span>
                </span>
              </button>
              {pincodeOpen && (
                <form className="pincode-popover" onSubmit={savePin}>
                  <strong>Choose your location</strong>
                  <span className="muted small">Delivery dates and charges depend on where you are.</span>
                  <div className="pincode-row">
                    <input
                      className="input-field" inputMode="numeric" maxLength={6} placeholder="6-digit PIN code" autoFocus
                      value={pincodeDraft} onChange={e => { setPincodeDraft(e.target.value.replace(/\D/g, '')); setPincodeError(''); }}
                      aria-label="PIN code"
                    />
                    <button type="submit" className="btn btn-primary btn-sm btn-inline">Apply</button>
                  </div>
                  {pincodeError && <span className="field-error">{pincodeError}</span>}
                </form>
              )}
            </div>
          </div>

          <form className="nav-search" onSubmit={search} role="search">
            <label className="search-category">
              <select value={searchCategory} onChange={e => setSearchCategory(e.target.value)} aria-label="Search in category">
                <option value="">All</option>
                {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <ChevronDown size={14} />
            </label>
            <input
              type="search"
              placeholder="Search for products, brands and more..."
              value={query}
              onChange={e => { setQuery(e.target.value); setSuggestOpen(true); setActiveIndex(-1); }}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => setSuggestOpen(false)}
              onKeyDown={onSearchKey}
              role="combobox"
              aria-label="Search products"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              aria-controls="search-suggestions"
              aria-activedescendant={showSuggestions && activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
            />
            <button type="submit" className="search-btn" aria-label="Search">
              <Search size={20} />
            </button>

            {showSuggestions && (
              <ul className="search-suggestions" id="search-suggestions" role="listbox">
                {options.map((option, i) => (
                  <li
                    key={option.key}
                    id={`suggestion-${i}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    className={`suggestion ${i === activeIndex ? 'active' : ''} ${option.kind}`}
                    onMouseDown={e => e.preventDefault()} // Keep focus so the click lands before the list closes
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => { setSuggestOpen(false); navigate(option.to); }}
                  >
                    {option.kind === 'product' && option.product && (
                      <>
                        <div className="suggestion-thumb"><ProductImage product={option.product} /></div>
                        <span className="suggestion-label">{option.label}</span>
                        <span className="suggestion-price">{formatPrice(option.product.price)}</span>
                      </>
                    )}
                    {option.kind === 'brand' && <><Tag size={16} /><span className="suggestion-label">{option.label}</span><span className="suggestion-kind">Brand</span></>}
                    {option.kind === 'category' && <><LayoutGrid size={16} /><span className="suggestion-label">{option.label}</span><span className="suggestion-kind">Category</span></>}
                    {option.kind === 'search' && <><Search size={16} /><span className="suggestion-label">Search for "{option.label}"</span></>}
                  </li>
                ))}
              </ul>
            )}
          </form>

          <div className="nav-right">
            {user ? (
              <div className="nav-account-menu" ref={menuRef}>
                <button className="nav-account" onClick={() => setMenuOpen(open => !open)} aria-expanded={menuOpen}>
                  <span className="account-greeting">Hello, {firstName}</span>
                  <span className="account-main">Account & Lists <ChevronDown size={14} /></span>
                </button>
                {menuOpen && (
                  <div className="account-dropdown">
                    <div className="dropdown-user">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                    <Link to="/account"><User size={16} /> Your account</Link>
                    <Link to="/orders"><Package size={16} /> Your orders</Link>
                    <Link to="/wishlist"><Heart size={16} /> Wishlist</Link>
                    <Link to="/account/addresses"><MapPin size={16} /> Addresses</Link>
                    <div className="dropdown-divider" />
                    {hasStore && <Link to="/seller"><Store size={16} /> Seller dashboard</Link>}
                    {!hasStore && user.role !== 'ADMIN' && (
                      <Link to="/sell"><Store size={16} /> {seller ? 'Seller application' : 'Sell on Shoyo'}</Link>
                    )}
                    {user.role === 'ADMIN' && (
                      <a href={ADMIN_URL}><ShieldCheck size={16} /> Admin panel <ExternalLink size={12} /></a>
                    )}
                    <button onClick={signOut}><LogOut size={16} /> Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/auth" className="nav-account">
                <span className="account-greeting">Hello, sign in</span>
                <span className="account-main">Account & Lists <ChevronDown size={14} /></span>
              </Link>
            )}

            <Link to="/orders" className="nav-orders desktop-only">
              <span className="orders-label">Returns</span>
              <span className="orders-main">& Orders</span>
            </Link>

            <Link to="/wishlist" className="nav-wishlist desktop-only" aria-label={`Wishlist, ${wishlistIds.size} items`}>
              <Heart size={24} />
              {wishlistIds.size > 0 && <span className="wishlist-badge">{wishlistIds.size > 99 ? '99+' : wishlistIds.size}</span>}
            </Link>

            <Link to="/cart" className="nav-cart" aria-label={`Cart, ${count} items`}>
              <div className="cart-icon-wrapper">
                <ShoppingBag size={28} />
                <span className="cart-badge">{count > 99 ? '99+' : count}</span>
              </div>
              <span className="cart-label desktop-only">Cart</span>
            </Link>
          </div>
        </div>

        <div className="nav-bottom">
          <Link to="/products" className="all-menu-btn">
            <Menu size={20} /> All
          </Link>
          <div className="nav-categories">
            <Link to="/products?sort=discount" className={currentSort === 'discount' && !currentCategory ? 'active' : ''}>Today's Deals</Link>
            {categories.map(c => (
              <Link
                key={c.name}
                to={`/products?category=${encodeURIComponent(c.name)}`}
                className={currentCategory.toLowerCase() === c.name.toLowerCase() ? 'active' : ''}
              >
                {c.name}
              </Link>
            ))}
            <Link to="/products?sort=newest" className={currentSort === 'newest' && !currentCategory ? 'active' : ''}>New Releases</Link>
            <Link to="/contact">Customer Service</Link>
          </div>
        </div>
      </header>
    </>
  );
}
