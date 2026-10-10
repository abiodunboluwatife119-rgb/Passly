import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';

const API_URL = import.meta.env.VITE_API_URL;

const Signup = () => {
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const checks = [
    { label: '8 or more characters', met: password.length >= 8 },
    { label: 'At least one letter', met: /[A-Za-z]/.test(password) },
    { label: 'At least one number', met: /\d/.test(password) },
  ];
  const strong = checks.every((check) => check.met);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      signup(data.user, data.token);
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
      title="Create your pass"
      subtitle="One account for tickets, rentals and meals. It takes under a minute."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="auth-error" role="alert">{error}</p>}

        <div className="auth-field">
          <label htmlFor="signup-name">Full name</label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            minLength={8}
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

        <ul className="auth-checks" aria-label="Password requirements">
          {checks.map((check) => (
            <li key={check.label} className={check.met ? 'is-met' : ''}>
              <span className="auth-check" />
              {check.label}
            </li>
          ))}
        </ul>

        <button className={buttonClass} type="submit" disabled={loading || done || !strong}>
          <span>{done ? 'Account created' : loading ? 'Creating account' : 'Create account'}</span>
        </button>
      </form>
    </AuthShell>
  );
};

export default Signup;