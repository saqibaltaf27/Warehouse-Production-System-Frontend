import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconLoader2
} from '@tabler/icons-react';
import './Login.css';

const Login = () => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      await login({ email, password });
    } catch (err) {
      if (!err.response || err.response.status === 404 || err.response.status >= 500) {
        setError('The server is currently unavailable.');
      } else {
        const message = err.response?.data?.message || 'Invalid email or password. Please try again.';
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page-container">
      {/* Left Column: Sign In Form */}
      <section className="login-form-column" aria-label="Sign in form">
        <div className="login-form-inner">
          {/* Brand Logo Badge */}
          <div className="login-brand-header">
            <div className="login-brand-badge">
              <img
                src="/images/ldslogo.png"
                alt="LDS Logo"
                className="login-brand-logo-img"
              />
            </div>
          </div>

          <h1 className="login-main-title">Sign in</h1>

          <form onSubmit={handleSubmit} className="login-form-body" noValidate>
            {error && (
              <div className="login-error-message" role="alert">
                <span>{error}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="login-field-group">
              <label htmlFor="email" className="login-field-label">
                Email Address
              </label>
              <div className="login-field-wrapper">
                <span className="login-field-icon">
                  <IconMail size={18} stroke={1.5} />
                </span>
                <input
                  id="email"
                  type="email"
                  className="login-text-input"
                  placeholder="operator@ldspharma.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="login-field-group">
              <label htmlFor="password" className="login-field-label">
                Password
              </label>
              <div className="login-field-wrapper">
                <span className="login-field-icon">
                  <IconLock size={18} stroke={1.5} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-text-input has-toggle"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <IconEyeOff size={18} stroke={1.6} />
                  ) : (
                    <IconEye size={18} stroke={1.6} />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="login-remember-row">
              <label className="login-remember-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="login-native-checkbox"
                />
                <span className="login-checkbox-text">Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="login-action-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="login-btn-loading-content">
                  <IconLoader2 size={18} className="login-btn-spinner" />
                  <span>Signing in...</span>
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Right Column: Hero Architecture Showcase */}
      <aside className="login-hero-column" aria-label="LDS Overview">
        <div className="login-hero-card">
          <div className="login-hero-image-overlay" />

          {/* Bottom Hero Content */}
          <div className="login-hero-bottom-content">
            <h2 className="login-hero-heading">
              Get your production lifecycle streamlined today
            </h2>
            <p className="login-hero-subtext">
              LDS Production Management System | ViSole Group of Companies
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
};

export default Login;
