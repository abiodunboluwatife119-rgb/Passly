import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Detail.css';

const API_URL = import.meta.env.VITE_API_URL;

const EventDetail = () => {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [qty, setQty] = useState(1);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`${API_URL}/events/${id}`);
        if (!res.ok) throw new Error('Event not found');
        const data = await res.json();
        setEvent(data);
        if (data.ticketTypes.length > 0) {
          setSelectedTicketId(data.ticketTypes[0]._id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const selectedTicket = event?.ticketTypes.find((t) => t._id === selectedTicketId);
  const total = selectedTicket ? selectedTicket.price * qty : 0;

  const handleBookNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedTicket || qty < 1) {
      setBookingError('Please select a valid ticket type and quantity');
      return;
    }
    setBooking(true);
    setBookingError('');
    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'event',
          items: [{ refId: event._id, ticketTypeId: selectedTicket._id, qty }],
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Booking failed');
      }
      navigate('/bookings');
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (error) return <div className="container"><p>{error}</p></div>;

  return (
    <div className="container">
      <div className="detail-layout">
        <div>
          {event.images?.[0] && (
            <div className="detail-image">
              <img src={event.images[0]} alt={event.title} />
            </div>
          )}
          <div className="detail-info">
            <h1>{event.title}</h1>
            <p>{event.venue}</p>
            <p>{new Date(event.date).toLocaleDateString()}</p>
            <p className="detail-description">{event.description}</p>
          </div>
        </div>

        <div className="booking-box">
          <h3>Select Ticket Type</h3>
          <select value={selectedTicketId} onChange={(e) => setSelectedTicketId(e.target.value)}>
            {event.ticketTypes.map((ticket) => (
              <option key={ticket._id} value={ticket._id}>
                {ticket.name} — ₦{ticket.price.toLocaleString()} ({ticket.capacity - ticket.sold} left)
              </option>
            ))}
          </select>

          <label>Quantity</label>
          <input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />

          {selectedTicket && <p className="booking-total">Total: ₦{total.toLocaleString()}</p>}
          {bookingError && <p className="booking-error">{bookingError}</p>}

          <button className="booking-submit" onClick={handleBookNow} disabled={booking}>
            {booking ? 'Booking...' : 'Book Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;