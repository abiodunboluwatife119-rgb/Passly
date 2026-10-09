import { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const API_URL = import.meta.env.VITE_API_URL;
const headlines = ['night', 'road', 'table'];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeadlineIndex((current) => (current + 1) % headlines.length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      login(data.user, data.token);
      setSuccess(true);
      window.setTimeout(() => navigate('/'), 650);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-shell" aria-label="Passly sign in">
        <aside className="auth-brand-panel">
          <div className="brand-shape brand-shape-one" />
          <div className="brand-shape brand-shape-two" />
          <div className="brand-shape brand-shape-three" />
          <div className="auth-brand-content">
            <div className="brand-mark">P</div>
            <p className="eyebrow">Passly / access made easy</p>
            <h1>Your pass to the <span key={headlines[headlineIndex]}>{headlines[headlineIndex]}</span></h1>
            <div className="sample-ticket" aria-hidden="true">
              <div className="ticket-top"><span>PASSLY</span><span>№ 0248</span></div>
              <div className="ticket-route"><strong>ANYWHERE</strong><span>→</span><strong>TONIGHT</strong></div>
              <div className="ticket-bottom"><span>ADMIT ONE</span><span>09 / 26</span></div>
            </div>
          </div>
        </aside>

        <div className="auth-card">
          <div className="mobile-brand"><span className="brand-mark">P</span><span>Passly</span></div>
          <div className="auth-heading">
            <p className="eyebrow">Welcome back</p>
            <h2>Sign in to Passly</h2>
            <p>Keep your plans moving.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <p className="auth-error" role="alert">{error}</p>}

            <div className="field-group">
              <label htmlFor="login-email">Email</label>
              <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>

            <div className="field-group">
              <label htmlFor="login-password">Password</label>
              <div className="password-wrap">
                <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                <button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button className={`auth-submit ${success ? 'is-success' : ''}`} type="submit" disabled={loading || success}>
              <span>{success ? 'You’re in' : loading ? 'Signing in…' : 'Sign in'}</span>
              <span aria-hidden="true">{success ? '✓' : '↗'}</span>
            </button>

            <p className="auth-switch">Don't have an account? <Link to="/signup">Sign up</Link></p>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Login;