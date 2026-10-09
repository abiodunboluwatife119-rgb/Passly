import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { AuthContext } from '../context/AuthContext';
import './Bookings.css';

const API_URL = import.meta.env.VITE_API_URL;

const TYPE_LABELS = { event: 'Event ticket', car: 'Car rental pass', food: 'Food order pass' };

const STATUS_COPY = {
  valid: { label: 'Valid', tone: 'paid', note: 'Show this code at the door or on pickup.' },
  used: { label: 'Used', tone: 'pending', note: 'This ticket has already been scanned.' },
  cancelled: { label: 'Cancelled', tone: 'cancelled', note: 'This ticket is no longer valid.' },
};

const TicketSkeleton = () => (
  <div className="container ticket-page" aria-busy="true" aria-label="Loading ticket">
    <div className="bk-skeleton tk-skeleton" />
  </div>
);

const TicketView = () => {
  const { code } = useParams();
  const { token } = useContext(AuthContext);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/tickets/${code}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 404) throw new Error('We could not find a ticket with that code.');
        if (!res.ok) throw new Error('We could not load this ticket. Please try again.');
        setTicket(await res.json());
      } catch (err) {
        setError(err.message || 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [code, token]);

  useEffect(() => {
    document.title = `Ticket ${code} · Passly`;
    return () => {
      document.title = 'Passly';
    };
  }, [code]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(ticket.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; the code is still visible on screen
    }
  };

  if (loading) return <TicketSkeleton />;

  if (error) {
    return (
      <div className="container">
        <div className="bk-state">
          <h2>Ticket unavailable</h2>
          <p>{error}</p>
          <Link to="/bookings" className="bk-state-btn">Back to my bookings</Link>
        </div>
      </div>
    );
  }

  const status = STATUS_COPY[ticket.status] || {
    label: ticket.status,
    tone: 'cancelled',
    note: '',
  };
  const inactive = ticket.status !== 'valid';
  const typeLabel = TYPE_LABELS[ticket.type] || 'Ticket';
  const tierName = ticket.metadata?.ticketTypeName;

  return (
    <div className="container ticket-page">
      <div className="tk-wrap">
        <Link to="/bookings" className="detail-back tk-back">← My bookings</Link>

        <div className={`tk ${inactive ? 'tk-inactive' : ''}`}>
          <div className="tk-main">
            <span className="tk-brand">Passly</span>
            <p className="tk-type">{typeLabel}</p>
            <h1 className="tk-title">{tierName || ticket.type.toUpperCase()}</h1>

            <span className={`ticket-status-badge status-${status.tone}`}>{status.label}</span>

            {ticket.usedAt && (
              <p className="tk-used">Scanned {new Date(ticket.usedAt).toLocaleString('en-GB')}</p>
            )}
          </div>

          <div className="tk-tear" aria-hidden="true" />

          <div className="tk-stub">
            <div className="tk-qr">
              <QRCodeSVG
                value={ticket.code}
                size={160}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#2C2520"
                title={`QR code for ticket ${ticket.code}`}
              />
              {inactive && <span className="tk-qr-veil">{status.label}</span>}
            </div>

            <p className="tk-code">{ticket.code}</p>
            <button type="button" className="tk-copy" onClick={copyCode}>
              {copied ? 'Copied ✓' : 'Copy code'}
            </button>
            {status.note && <p className="tk-note">{status.note}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketView;