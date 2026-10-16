import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { getErrorMessage } from '../api.ts';
import { useAuth } from '../context/auth.ts';
import './AuthPage.css';

// Using the generated brand illustration
import authBg from '../assets/auth-bg.png';

// Only allow redirects to our own pages (never to another site)
const safeRedirect = (target: string | null) => (target && target.startsWith('/') && !target.startsWith('//') ? target : '/');

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get('redirect'));
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [remember, setRemember] = useState(true);
  const passwordWasReset = searchParams.get('reset') === '1';

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
        await login(email, password, remember);
      } else {
        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match');
          setLoading(false);
          return;
        }
        await register(name, email, password); // Also logs you in
      }
      // Back to where you were going (e.g. checkout), or the home page
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
      setLoading(false);
    }
  };

  // Already logged in: nothing to do here
  if (user && !loading) return <Navigate to={redirectTo} replace />;

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
          {passwordWasReset && isLogin && !errorMsg && <div className="auth-success">Password changed. Log in with your new password.</div>}

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
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                minLength={isLogin ? undefined : 8}
                required
              />
              {!isLogin && <span className="input-hint">At least 8 characters.</span>}
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
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                  <span>Keep me signed in</span>
                </label>
                <Link to="/auth/forgot-password" className="forgot-password">Forgot password?</Link>
              </div>
            )}

            {!isLogin && (
              <div className="auth-options">
                <label className="remember-me">
                  <input type="checkbox" required />
                  <span>I agree to the <Link to="/terms" target="_blank">Terms of use</Link> and <Link to="/privacy" target="_blank">Privacy policy</Link></span>
                </label>
              </div>
            )}

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
