import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

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

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      login(data.user, data.token);
      setDone(true);
      setTimeout(() => navigate('/'), 600);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const buttonClass = `auth-submit${loading ? ' is-loading' : ''}${done ? ' is-done' : ''}`;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see your bookings and pick up where you left off."
      footer={
        <>
          New to Passly? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="auth-error" role="alert">{error}</p>}

        <div className="auth-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="auth-toggle"
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <button className={buttonClass} type="submit" disabled={loading || done}>
          <span>{done ? 'Welcome back' : loading ? 'Logging in' : 'Log in'}</span>
        </button>
      </form>
    </AuthShell>
  );
};

export default Login;