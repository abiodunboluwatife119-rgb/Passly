import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Bookings.css';

const API_URL = import.meta.env.VITE_API_URL;

const MyBookings = () => {
  const { token } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingId, setPayingId] = useState(null);

  const fetchData = async () => {
    try {
      const [bookingsRes, ticketsRes] = await Promise.all([
        fetch(`${API_URL}/bookings/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/tickets/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!bookingsRes.ok) throw new Error('Failed to load bookings');
      if (!ticketsRes.ok) throw new Error('Failed to load tickets');

      const bookingsData = await bookingsRes.json();
      const ticketsData = await ticketsRes.json();

      setBookings(bookingsData);
      setTickets(ticketsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handlePay = async (bookingId) => {
    setPayingId(bookingId);
    try {
      const res = await fetch(`${API_URL}/payments/mock-success`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId }),
      });
      if (!res.ok) throw new Error('Payment failed');
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setPayingId(null);
    }
  };

  const findTicketForBooking = (bookingId) => {
    return tickets.find((t) => t.bookingId === bookingId);
  };

  if (loading) return <div className="container"><p>Loading your bookings...</p></div>;
  if (error) return <div className="container"><p>{error}</p></div>;

  return (
    <div className="container bookings-page">
      <h1>My Bookings</h1>
      {bookings.length === 0 ? (
        <p>You have no bookings yet.</p>
      ) : (
        bookings.map((booking) => {
          const ticket = findTicketForBooking(booking._id);
          return (
            <div key={booking._id} className="booking-card">
              <h3>{booking.items[0]?.name}{booking.items.length > 1 ? ` +${booking.items.length - 1} more` : ''}</h3>
              <p>Total: ₦{booking.totalAmount.toLocaleString()}</p>
              <span className={`booking-status status-${booking.status}`}>{booking.status}</span>

              {booking.status === 'pending' && (
                <div>
                  <button
                    className="booking-action-btn booking-pay-btn"
                    onClick={() => handlePay(booking._id)}
                    disabled={payingId === booking._id}
                  >
                    {payingId === booking._id ? 'Processing...' : 'Complete Payment'}
                  </button>
                </div>
              )}

              {booking.status === 'paid' && ticket && (
                <div>
                  <Link to={`/tickets/${ticket.code}`} className="booking-view-ticket">
                    View Ticket →
                  </Link>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default MyBookings;