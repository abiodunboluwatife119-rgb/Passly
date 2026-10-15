import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Bookings.css';

const API_URL = import.meta.env.VITE_API_URL;

const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;

const TYPE_LABELS = { event: 'Event', car: 'Car rental', food: 'Food order' };

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'paid', label: 'Paid' },
  { key: 'cancelled', label: 'Cancelled' },
];

const formatPlaced = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

const formatInputDate = (str) =>
  new Date(`${str}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

const BookingsSkeleton = () => (
  <div aria-busy="true" aria-label="Loading your bookings">
    {[1, 2, 3].map((n) => (
      <div key={n} className="bk-skeleton" />
    ))}
  </div>
);

const MyBookings = () => {
  const { token } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingId, setPayingId] = useState(null);
  const [payError, setPayError] = useState({ id: null, message: '' });
  const [filter, setFilter] = useState('all');

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

      if (!bookingsRes.ok) throw new Error('We could not load your bookings.');
      if (!ticketsRes.ok) throw new Error('We could not load your tickets.');

      setBookings(await bookingsRes.json());
      setTickets(await ticketsRes.json());
      setError('');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'My bookings · Passly';
    return () => {
      document.title = 'Passly';
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, [token]);

  const retry = () => {
    setLoading(true);
    setError('');
    fetchData();
  };

  const handlePay = async (bookingId) => {
    setPayingId(bookingId);
    setPayError({ id: null, message: '' });
    try {
      const res = await fetch(`${API_URL}/payments/mock-success`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Payment failed. Please try again.');
      }
      await fetchData();
    } catch (err) {
      setPayError({ id: bookingId, message: err.message });
    } finally {
      setPayingId(null);
    }
  };

  const findTicketForBooking = (bookingId) => tickets.find((t) => t.bookingId === bookingId);

  // Newest first when we have timestamps
  const sorted = [...bookings].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  const counts = sorted.reduce(
    (acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    },
    { all: sorted.length }
  );
  const visible = filter === 'all' ? sorted : sorted.filter((b) => b.status === filter);

  const renderDetails = (booking) => {
    const items = booking.items || [];

    if (booking.type === 'food') {
      return (
        <>
          <ul className="booking-items">
            {items.map((item, i) => (
              <li key={i}>
                <span>{item.qty} × {item.name}</span>
                {item.unitPrice != null && <span>{naira(item.unitPrice * item.qty)}</span>}
              </li>
            ))}
          </ul>
          {booking.fulfillment && (
            <p className="booking-detail">
              {booking.fulfillment === 'delivery'
                ? `Delivery${booking.address ? ` to ${booking.address}` : ''}`
                : 'Pickup'}
            </p>
          )}
        </>
      );
    }

    if (booking.type === 'car') {
      const meta = items[0]?.meta;
      if (meta?.pickupDate && meta?.returnDate) {
        return (
          <p className="booking-detail">
            {formatInputDate(meta.pickupDate)} → {formatInputDate(meta.returnDate)}
          </p>
        );
      }
      return null;
    }

    if (booking.type === 'event') {
      const totalQty = items.reduce((sum, i) => sum + (i.qty || 0), 0);
      if (totalQty > 0) {
        return (
          <p className="booking-detail">
            {totalQty} ticket{totalQty > 1 ? 's' : ''}
          </p>
        );
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="container bookings-page">
        <h1>My bookings</h1>
        <p role="status" aria-live="polite">Fetching details...</p>
        <BookingsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container bookings-page">
        <h1>My bookings</h1>
        <div className="bk-state">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button type="button" className="bk-state-btn" onClick={retry}>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container bookings-page">
      <h1>My bookings</h1>

      {bookings.length === 0 ? (
        <div className="bk-state">
          <div className="bk-state-mark" aria-hidden="true">🎟</div>
          <h2>No bookings yet</h2>
          <p>Book an event, rent a car or order food, and it will show up here.</p>
          <div className="bk-state-links">
            <Link to="/events" className="bk-state-btn">Events</Link>
            <Link to="/cars" className="bk-state-btn">Cars</Link>
            <Link to="/restaurants" className="bk-state-btn">Food</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="bk-filters" role="tablist" aria-label="Filter bookings">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={filter === f.key}
                className={`bk-filter ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                <span className="bk-filter-count">{counts[f.key] || 0}</span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="bk-none">No {filter} bookings.</p>
          ) : (
            visible.map((booking) => {
              const ticket = findTicketForBooking(booking._id);
              const items = booking.items || [];
              const title =
                (items[0]?.name || TYPE_LABELS[booking.type] || 'Booking') +
                (items.length > 1 && booking.type !== 'food' ? ` +${items.length - 1} more` : '');
              const paying = payingId === booking._id;

              return (
                <article key={booking._id} className={`booking-card booking-card-${booking.type}`}>
                  <div className="booking-card-head">
                    <div className="booking-card-heading">
                      <span className="booking-type">
                        <span className="booking-type-mark" aria-hidden="true">
                          {booking.type === 'food' ? 'FOOD' : booking.type === 'car' ? 'RIDE' : 'PASS'}
                        </span>
                        {TYPE_LABELS[booking.type] || 'Booking'}
                        {booking.createdAt && ` · ${formatPlaced(booking.createdAt)}`}
                      </span>
                      <h3>
                        {booking.type === 'food'
                          ? `${items.length} dish${items.length > 1 ? 'es' : ''} ordered`
                          : title}
                      </h3>
                    </div>
                    <span className={`booking-status status-${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>

                  {renderDetails(booking)}

                  <div className="booking-card-foot">
                    <div className="booking-amount">
                      <span>Total</span>
                      <strong>{naira(booking.totalAmount)}</strong>
                    </div>

                    <div className="booking-actions">
                      {booking.status === 'pending' && (
                        <button
                          type="button"
                          className="booking-action-btn booking-pay-btn"
                          onClick={() => handlePay(booking._id)}
                          disabled={paying}
                        >
                          {paying ? 'Processing...' : 'Complete payment'}
                        </button>
                      )}

                      {booking.status === 'paid' && ticket && (
                        <Link to={`/tickets/${ticket.code}`} className="booking-view-ticket">
                          View ticket →
                        </Link>
                      )}
                    </div>
                  </div>

                  {payError.id === booking._id && (
                    <p className="booking-pay-error" role="alert">{payError.message}</p>
                  )}
                </article>
              );
            })
          )}
        </>
      )}
    </div>
  );
};

export default MyBookings;
