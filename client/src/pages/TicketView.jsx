import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Bookings.css';

const API_URL = import.meta.env.VITE_API_URL;

const TicketView = () => {
  const { code } = useParams();
  const { token } = useContext(AuthContext);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await fetch(`${API_URL}/tickets/${code}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Ticket not found');
        const data = await res.json();
        setTicket(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [code, token]);

  if (loading) return <div className="container"><p>Loading ticket...</p></div>;
  if (error) return <div className="container"><p>{error}</p></div>;

  return (
    <div className="container ticket-page">
      <div className="ticket-card">
        <p>{ticket.metadata?.ticketTypeName || ticket.type.toUpperCase()}</p>
        <h2 className="ticket-code">{ticket.code}</h2>
        <span className={`ticket-status-badge status-${ticket.status === 'valid' ? 'paid' : 'cancelled'}`}>
          {ticket.status}
        </span>
        {ticket.usedAt && <p style={{ marginTop: 12 }}>Used at: {new Date(ticket.usedAt).toLocaleString()}</p>}
      </div>
    </div>
  );
};

export default TicketView;