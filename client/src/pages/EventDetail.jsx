import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Detail.css';

const API_URL = import.meta.env.VITE_API_URL;
const MAX_PER_BOOKING = 10;

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const DetailSkeleton = () => (
  <div className="container">
    <p role="status" aria-live="polite">Fetching details...</p>
    <div className="detail-layout" aria-busy="true" aria-label="Fetching details">
      <div>
        <div className="skeleton skeleton-image" />
        <div className="skeleton skeleton-line skeleton-title" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />
      </div>
      <div className="skeleton skeleton-box" />
    </div>
  </div>
);

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
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/events/${id}`);
        if (!res.ok) throw new Error('We could not find that event.');
        const data = await res.json();
        setEvent(data);
        const firstAvailable = data.ticketTypes?.find((t) => t.capacity - t.sold > 0);
        setSelectedTicketId((firstAvailable || data.ticketTypes?.[0])?._id || '');
      } catch (err) {
        setError(err.message || 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (event) document.title = `${event.title} · Passly`;
    return () => {
      document.title = 'Passly';
    };
  }, [event]);

  const selectedTicket = event?.ticketTypes?.find((t) => t._id === selectedTicketId);
  const remaining = selectedTicket ? selectedTicket.capacity - selectedTicket.sold : 0;
  const maxQty = Math.max(1, Math.min(remaining, MAX_PER_BOOKING));
  const total = selectedTicket ? selectedTicket.price * qty : 0;
  const isPast = event ? new Date(event.date) < new Date(new Date().toDateString()) : false;
  const soldOut = !!selectedTicket && remaining <= 0;
  const cannotBook = isPast || soldOut || !selectedTicket;

  const selectTicket = (ticketId) => {
    setSelectedTicketId(ticketId);
    setQty(1);
    setBookingError('');
  };

  const changeQty = (delta) => {
    setQty((q) => Math.min(maxQty, Math.max(1, q + delta)));
  };

  const handleBookNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (cannotBook || qty < 1) return;

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
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Booking failed. Please try again.');
      }
      navigate('/bookings');
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="container">
        <div className="detail-state">
          <h2>Event unavailable</h2>
          <p>{error}</p>
          <Link to="/events" className="detail-state-link">Back to events</Link>
        </div>
      </div>
    );
  }

  const buttonLabel = isPast
    ? 'Event has ended'
    : soldOut
    ? 'Sold out'
    : booking
    ? 'Booking...'
    : user
    ? 'Book Now'
    : 'Log in to book';

  return (
    <div className="container">
      <Link to="/events" className="detail-back">← All events</Link>

      <div className="detail-layout">
        <div>
          {event.images?.[0] ? (
            <div className="detail-image">
              <img src={event.images[0]} alt={event.title} />
            </div>
          ) : (
            <div className="detail-image detail-image-placeholder" aria-hidden="true">
              <span>{event.title.charAt(0)}</span>
            </div>
          )}

          <div className="detail-info">
            <div className="detail-badges">
              {event.category && <span className="detail-badge">{event.category}</span>}
              {isPast && <span className="detail-badge detail-badge-muted">Ended</span>}
            </div>
            <h1>{event.title}</h1>

            <div className="detail-meta">
              <div className="detail-meta-row">
                <span className="detail-meta-label">Date</span>
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="detail-meta-row">
                <span className="detail-meta-label">Venue</span>
                <span>{event.venue?.trim()}</span>
              </div>
            </div>

            <h2 className="detail-section-title">About this event</h2>
            <p className="detail-description">{event.description}</p>
          </div>
        </div>

        <aside className="booking-box">
          <h3>Select tickets</h3>

          <div className="tier-list" role="radiogroup" aria-label="Ticket type">
            {event.ticketTypes.map((ticket) => {
              const left = ticket.capacity - ticket.sold;
              const selected = ticket._id === selectedTicketId;
              return (
                <button
                  key={ticket._id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`tier-card ${selected ? 'selected' : ''}`}
                  disabled={left <= 0}
                  onClick={() => selectTicket(ticket._id)}
                >
                  <span className="tier-name">{ticket.name}</span>
                  <span className="tier-price">₦{ticket.price.toLocaleString()}</span>
                  <span className={`tier-left ${left > 0 && left <= 5 ? 'low' : ''}`}>
                    {left <= 0 ? 'Sold out' : left <= 5 ? `Only ${left} left` : `${left} available`}
                  </span>
                </button>
              );
            })}
          </div>

          <label>Quantity</label>
          <div className="qty-stepper">
            <button type="button" onClick={() => changeQty(-1)} disabled={qty <= 1 || cannotBook} aria-label="Decrease quantity">−</button>
            <span aria-live="polite">{qty}</span>
            <button type="button" onClick={() => changeQty(1)} disabled={qty >= maxQty || cannotBook} aria-label="Increase quantity">+</button>
          </div>

          {selectedTicket && (
            <div className="booking-summary">
              <span>{qty} × {selectedTicket.name}</span>
              <span className="booking-total">₦{total.toLocaleString()}</span>
            </div>
          )}

          {bookingError && <p className="booking-error" role="alert">{bookingError}</p>}

          <button
            className="booking-submit"
            onClick={handleBookNow}
            disabled={booking || cannotBook}
          >
            {buttonLabel}
          </button>

          {!user && !cannotBook && (
            <p className="booking-hint">You'll be asked to log in before booking.</p>
          )}
        </aside>
      </div>
    </div>
  );
};

export default EventDetail;