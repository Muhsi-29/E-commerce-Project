import { useState } from 'react';
import { api } from '../api.ts';
import './AdminAuthPage.css';
import authBg from '../assets/auth-bg.png';

export default function AdminAuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        // Admin Login API Call
        const res = await api.post('/auth/admin/login', { email, password });
        if (res.data.token) {
          localStorage.setItem('adminToken', res.data.token);
          alert('Admin Login Successful!');
          window.location.href = '/admin/dashboard'; // Placeholder for future dashboard
        }
      } else {
        // Admin Register API Call
        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match');
          setLoading(false);
          return;
        }
        const res = await api.post('/auth/register', { 
            name, 
            email, 
            password, 
            role: 'ADMIN' // Explicitly pass ADMIN role
        });
        if (res.data.status === 'success') {
          alert('Admin Registration successful! Please login.');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-container">
      {/* Left side: Form Card */}
      <div className="auth-form-section">
        <div className="auth-card">
          <div className="auth-header">
            <h2>{isLogin ? 'Shoyo Admin Portal' : 'Create Admin Account'}</h2>
            <p className="admin-subtitle">
              {isLogin
                ? 'Authorized personnel only.'
                : 'Setup a new administrator.'}
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setErrorMsg(''); }}
            >
              Login
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setErrorMsg(''); }}
            >
              Register Admin
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && <div className="auth-error">{errorMsg}</div>}

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="input-group">
                <label className="input-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  className="input-field admin-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label className="input-label" htmlFor="email">Admin Email</label>
              <input
                id="email"
                type="email"
                className="input-field admin-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input-field admin-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <div className="input-group">
                <label className="input-label" htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="input-field admin-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary auth-submit admin-btn" disabled={loading}>
              {loading ? 'Processing...' : isLogin ? 'Access Dashboard' : 'Create Admin'}
            </button>
          </form>
        </div>
      </div>

      {/* Right side: Visual (Reversed from normal auth page) */}
      <div className="auth-visual">
        <img src={authBg} alt="Brand aesthetic" className="auth-bg-img" />
        <div className="auth-visual-overlay admin-overlay">
          <h2>Command Center.</h2>
          <p>Manage products, oversee orders, and track your metrics.</p>
        </div>
      </div>
    </div>
  );
}
