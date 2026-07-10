import { useState } from 'react';
import { api } from '../api.ts';
import './AuthPage.css';

// Using the generated brand illustration
import authBg from '../assets/auth-bg.png';

export default function AuthPage() {
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
        // Login API Call
        const res = await api.post('/auth/login', { email, password });
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
          alert('Login Successful!');
          window.location.href = '/';
        }
      } else {
        // Register API Call
        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match');
          setLoading(false);
          return;
        }
        const res = await api.post('/auth/register', { name, email, password });
        if (res.data.status === 'success') {
          alert('Registration successful! Please login.');
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
    <div className="auth-container">
      {/* Left side: Brand Imagery */}
      <div className="auth-visual">
        <img src={authBg} alt="Brand aesthetic" className="auth-bg-img" />
        <div className="auth-visual-overlay">
          <h2>Elevate your everyday.</h2>
          <p>Join the community and discover a world of premium products.</p>
        </div>
      </div>

      {/* Right side: Form Card */}
      <div className="auth-form-section">
        <div className="auth-card">
          <div className="auth-header">
            <h2>{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
            <p>
              {isLogin
                ? 'Enter your details to access your account.'
                : 'Join us today to get started.'}
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
              Register
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
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label className="input-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="input-field"
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
                className="input-field"
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
                  className="input-field"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {isLogin && (
              <div className="auth-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot-password">Forgot Password?</a>
              </div>
            )}

            {!isLogin && (
              <div className="auth-options">
                <label className="remember-me">
                  <input type="checkbox" required />
                  <span>I agree to the Terms & Conditions</span>
                </label>
              </div>
            )}

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>

            {isLogin && (
              <div className="auth-social">
                <div className="divider">
                  <span>or continue with</span>
                </div>
                <div className="social-buttons">
                  <button type="button" className="btn-social">Google</button>
                  <button type="button" className="btn-social">Facebook</button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
