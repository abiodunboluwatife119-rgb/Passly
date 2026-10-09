import { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import './Verify.css';

const API_URL = import.meta.env.VITE_API_URL;

const STATUS_INFO = {
  VALID: { label: 'Valid', tone: 'valid', fallback: 'Ticket is valid and has now been marked as used.' },
  USED: { label: 'Already used', tone: 'used', fallback: 'This ticket has already been scanned.' },
  CANCELLED: { label: 'Cancelled', tone: 'bad', fallback: 'This ticket was cancelled.' },
  NOT_FOUND: { label: 'Not found', tone: 'bad', fallback: 'No ticket matches that code.' },
};

const formatTime = (d) =>
  new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const Verify = () => {
  const { token } = useContext(AuthContext);
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [recent, setRecent] = useState([]);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    document.title = 'Verify tickets · Passly';
    inputRef.current?.focus();
    return () => {
      document.title = 'Passly';
    };
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    const submitted = code.trim();
    if (!submitted) return;

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
        body: JSON.stringify({ code: submitted }),
      });

      const data = await res.json().catch(() => ({}));
      let outcome;

      if (res.status === 404) {
        outcome = { status: 'NOT_FOUND', message: data.message };
      } else if (!res.ok) {
        throw new Error(data.message || 'Verification failed. Please try again.');
      } else {
        outcome = data;
      }

      setResult({ ...outcome, submitted });
      setRecent((prev) =>
        [{ code: outcome.ticket?.code || submitted, status: outcome.status, at: Date.now() }, ...prev].slice(0, 5)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
      setCode('');
      inputRef.current?.focus();
    }
  };

  const info = result ? STATUS_INFO[result.status] || { label: result.status, tone: 'bad', fallback: '' } : null;

  return (
    <div className="container verify-page">
      <header className="verify-header">
        <h1>Verify tickets</h1>
        <p>Enter or paste a ticket code. A valid ticket is marked as used as soon as it is checked.</p>
      </header>

      <form className="verify-form" onSubmit={handleVerify}>
        <label htmlFor="ticket-code" className="verify-label">Ticket code</label>
        <div className="verify-row">
          <input
            id="ticket-code"
            ref={inputRef}
            type="text"
            placeholder="TKT-XXXXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            required
          />
          <button type="submit" disabled={checking || !code.trim()}>
            {checking ? 'Checking...' : 'Verify'}
          </button>
        </div>
      </form>

      <div aria-live="polite">
        {error && (
          <p className="verify-error" role="alert">{error}</p>
        )}

        {result && info && (
          <section className={`verify-result verify-${info.tone}`}>
            <p className="verify-result-label">{info.label}</p>
            <p className="verify-result-message">{result.message || info.fallback}</p>

            {result.ticket ? (
              <dl className="verify-details">
                <div>
                  <dt>Type</dt>
                  <dd>{result.ticket.metadata?.ticketTypeName || result.ticket.type}</dd>
                </div>
                <div>
                  <dt>Code</dt>
                  <dd className="verify-mono">{result.ticket.code}</dd>
                </div>
                {result.ticket.usedAt && (
                  <div>
                    <dt>First scanned</dt>
                    <dd>{new Date(result.ticket.usedAt).toLocaleString('en-GB')}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="verify-mono verify-submitted">{result.submitted}</p>
            )}
          </section>
        )}
      </div>

      {recent.length > 0 && (
        <section className="verify-recent">
          <h2>Recent checks</h2>
          <ul>
            {recent.map((r) => {
              const tone = (STATUS_INFO[r.status] || {}).tone || 'bad';
              return (
                <li key={r.at}>
                  <span className="verify-mono">{r.code}</span>
                  <span className={`verify-pill verify-pill-${tone}`}>
                    {(STATUS_INFO[r.status] || {}).label || r.status}
                  </span>
                  <span className="verify-time">{formatTime(r.at)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
};

export default Verify;