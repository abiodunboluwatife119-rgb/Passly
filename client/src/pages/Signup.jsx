import { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const API_URL = import.meta.env.VITE_API_URL;
const headlines = ['night', 'road', 'table'];

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeadlineIndex((current) => (current + 1) % headlines.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, []);

  const requirements = [
    { label: '8 characters', valid: password.length >= 8 },
    { label: 'One letter', valid: /[A-Za-z]/.test(password) },
    { label: 'One number', valid: /\d/.test(password) },
  ];
  const passwordValid = requirements.every((requirement) => requirement.valid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordValid) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');

      signup(data.user, data.token);
      setSuccess(true);
      window.setTimeout(() => navigate('/'), 650);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-shell" aria-label="Passly account signup">
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
            <p className="eyebrow">Start somewhere good</p>
            <h2>Create your account</h2>
            <p>One account for every plan.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <p className="auth-error" role="alert">{error}</p>}

            <div className="field-group">
              <label htmlFor="signup-name">Name</label>
              <input id="signup-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            </div>

            <div className="field-group">
              <label htmlFor="signup-email">Email</label>
              <input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>

            <div className="field-group">
              <label htmlFor="signup-password">Password</label>
              <div className="password-wrap">
                <input id="signup-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoComplete="new-password" />
                <button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <ul className="password-checklist" aria-label="Password requirements">
                {requirements.map((requirement) => (
                  <li className={requirement.valid ? 'is-valid' : ''} key={requirement.label}>
                    <span aria-hidden="true">{requirement.valid ? '✓' : '○'}</span>{requirement.label}
                  </li>
                ))}
              </ul>
            </div>

            <button className={`auth-submit ${success ? 'is-success' : ''}`} type="submit" disabled={loading || success || !passwordValid}>
              <span>{success ? 'Welcome to Passly' : loading ? 'Creating account…' : 'Create account'}</span>
              <span aria-hidden="true">{success ? '✓' : '↗'}</span>
            </button>

            <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Signup;