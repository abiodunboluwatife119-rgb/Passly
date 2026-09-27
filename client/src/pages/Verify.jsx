import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './Verify.css';

const API_URL = import.meta.env.VITE_API_URL;

const Verify = () => {
  const { token } = useContext(AuthContext);
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setChecking(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/tickets/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (res.status === 404) {
        setResult({ status: 'NOT_FOUND', message: data.message });
      } else if (!res.ok) {
        throw new Error(data.message || 'Verification failed');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
      setCode('');
    }
  };

  return (
    <div className="container verify-page">
      <h1>Verify Ticket</h1>

      <form className="verify-form" onSubmit={handleVerify}>
        <input
          type="text"
          placeholder="TKT-XXXXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
        />
        <button type="submit" disabled={checking}>
          {checking ? 'Checking...' : 'Verify'}
        </button>
      </form>

      {error && <p style={{ color: 'var(--color-error)', marginTop: 16 }}>{error}</p>}

      {result && (
        <div className="verify-result">
          <p className={`verify-result-status verify-status-${result.status}`}>{result.status}</p>
          <p>{result.message}</p>
          {result.ticket && (
            <div>
              <p>Type: {result.ticket.type}</p>
              <p>Code: {result.ticket.code}</p>
              {result.ticket.usedAt && (
                <p>Used at: {new Date(result.ticket.usedAt).toLocaleString()}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Verify;