import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Detail.css';

const API_URL = import.meta.env.VITE_API_URL;
const toInputDate = (d) => d.toLocaleDateString('en-CA');

const parseInputDate = (str) => new Date(`${str}T00:00:00`);

const shortDate = (str) =>
  parseInputDate(str).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

const dayAfter = (str) => {
  const d = parseInputDate(str);
  d.setDate(d.getDate() + 1);
  return toInputDate(d);
};

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

const CarDetail = () => {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const today = toInputDate(new Date());

  useEffect(() => {
    const fetchCar = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/cars/${id}`);
        if (!res.ok) throw new Error('We could not find that car.');
        const data = await res.json();
        setCar(data);
      } catch (err) {
        setError(err.message || 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
  }, [id]);

  useEffect(() => {
    if (car) document.title = `${car.make} ${car.model} · Passly`;
    return () => {
      document.title = 'Passly';
    };
  }, [car]);
  let dateError = '';
  if (pickupDate && pickupDate < today) {
    dateError = 'Pickup date cannot be in the past.';
  } else if (pickupDate && returnDate && returnDate <= pickupDate) {
    dateError = 'Return date must be after the pickup date.';
  }

  const days =
    pickupDate && returnDate && !dateError
      ? Math.round((parseInputDate(returnDate) - parseInputDate(pickupDate)) / 86400000)
      : 0;
  const pricePerDay = car?.pricePerDay || 0;
  const total = days * pricePerDay;

  const handlePickupChange = (value) => {
    setPickupDate(value);
    setBookingError('');
    if (returnDate && value && returnDate <= value) setReturnDate('');
  };

  const handleBookNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (days <= 0) return;

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
          type: 'car',
          items: [
            {
              refId: car._id,
              name: `${car.make} ${car.model} (${days} day${days > 1 ? 's' : ''})`,
              qty: days,
              unitPrice: car.pricePerDay,
              meta: { pickupDate, returnDate },
            },
          ],
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
          <h2>Car unavailable</h2>
          <p>{error}</p>
          <Link to="/cars" className="detail-state-link">Back to cars</Link>
        </div>
      </div>
    );
  }

  const images = car.images || [];
  const buttonLabel = booking
    ? 'Booking...'
    : !user
    ? 'Log in to book'
    : days <= 0
    ? 'Select your dates'
    : 'Book Now';

  return (
    <div className="container">
      <Link to="/cars" className="detail-back"> All cars</Link>

      <div className="detail-layout">
        <div>
          {images[0] ? (
            <>
              <div className="detail-image">
                <img src={images[activeImage] || images[0]} alt={`${car.make} ${car.model}`} />
              </div>
              {images.length > 1 && (
                <div className="thumb-row">
                  {images.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      className={`thumb ${i === activeImage ? 'active' : ''}`}
                      onClick={() => setActiveImage(i)}
                      aria-label={`Show photo ${i + 1}`}
                    >
                      <img src={src} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="detail-image detail-image-placeholder" aria-hidden="true">
              <span>{car.make.charAt(0)}</span>
            </div>
          )}

          <div className="detail-info">
            <div className="detail-badges">
              {car.year && <span className="detail-badge">{car.year}</span>}
            </div>
            <h1>{car.make} {car.model}</h1>

            <div className="detail-meta">
              <div className="detail-meta-row">
                <span className="detail-meta-label">Pickup</span>
                <span>{car.location}</span>
              </div>
            </div>

            <h2 className="detail-section-title">Specifications</h2>
            <div className="spec-grid">
              <div className="spec-card">
                <span className="spec-label">Transmission</span>
                <span className="spec-value">{car.transmission}</span>
              </div>
              <div className="spec-card">
                <span className="spec-label">Seats</span>
                <span className="spec-value">{car.seats}</span>
              </div>
              {car.year && (
                <div className="spec-card">
                  <span className="spec-label">Year</span>
                  <span className="spec-value">{car.year}</span>
                </div>
              )}
            </div>

            {car.description && (
              <>
                <h2 className="detail-section-title">About this car</h2>
                <p className="detail-description">{car.description}</p>
              </>
            )}
          </div>
        </div>

        <aside className="booking-box">
          <div className="price-head">
            <strong>₦{pricePerDay.toLocaleString()}</strong>
            <span>/ day</span>
          </div>

          <div className="date-fields">
            <div>
              <label htmlFor="pickup">Pickup date</label>
              <input
                id="pickup"
                type="date"
                min={today}
                value={pickupDate}
                onChange={(e) => handlePickupChange(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="return">Return date</label>
              <input
                id="return"
                type="date"
                min={pickupDate ? dayAfter(pickupDate) : today}
                value={returnDate}
                onChange={(e) => {
                  setReturnDate(e.target.value);
                  setBookingError('');
                }}
              />
            </div>
          </div>

          {dateError ? (
            <p className="booking-error" role="alert">{dateError}</p>
          ) : days === 0 ? (
            <p className="field-hint">Choose your pickup and return dates to see the price.</p>
          ) : null}

          {days > 0 && (
            <div className="price-breakdown">
              <div className="price-breakdown-row">
                <span>{shortDate(pickupDate)} → {shortDate(returnDate)}</span>
              </div>
              <div className="price-breakdown-row">
                <span>₦{pricePerDay.toLocaleString()} × {days} day{days > 1 ? 's' : ''}</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
              <div className="price-breakdown-row price-breakdown-total">
                <span>Total</span>
                <span className="booking-total">₦{total.toLocaleString()}</span>
              </div>
            </div>
          )}

          {bookingError && <p className="booking-error" role="alert">{bookingError}</p>}

          <button
            className="booking-submit"
            onClick={handleBookNow}
            disabled={booking || (!!user && days <= 0)}
          >
            {buttonLabel}
          </button>

          {!user && (
            <p className="booking-hint">You'll be asked to log in before booking.</p>
          )}
        </aside>
      </div>
    </div>
  );
};

export default CarDetail;