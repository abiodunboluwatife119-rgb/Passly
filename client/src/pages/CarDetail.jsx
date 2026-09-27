import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Detail.css';

const API_URL = import.meta.env.VITE_API_URL;

const CarDetail = () => {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const res = await fetch(`${API_URL}/cars/${id}`);
        if (!res.ok) throw new Error('Car not found');
        const data = await res.json();
        setCar(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
  }, [id]);

  const calculateDays = () => {
    if (!pickupDate || !returnDate) return 0;
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const days = calculateDays();
  const total = days * (car?.pricePerDay || 0);

  const handleBookNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (days <= 0) {
      setBookingError('Please select a valid pickup and return date');
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
          {car.images?.[0] && (
            <div className="detail-image">
              <img src={car.images[0]} alt={`${car.make} ${car.model}`} />
            </div>
          )}
          <div className="detail-info">
            <h1>{car.make} {car.model} ({car.year})</h1>
            <p>{car.location}</p>
            <p>{car.transmission}, {car.seats} seats</p>
            <p>₦{car.pricePerDay.toLocaleString()}/day</p>
          </div>
        </div>

        <div className="booking-box">
          <h3>Book this car</h3>

          <label>Pickup date</label>
          <input
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
          />

          <label>Return date</label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />

          {days > 0 && (
            <p className="booking-total">{days} day{days > 1 ? 's' : ''} — Total: ₦{total.toLocaleString()}</p>
          )}
          {bookingError && <p className="booking-error">{bookingError}</p>}

          <button className="booking-submit" onClick={handleBookNow} disabled={booking}>
            {booking ? 'Booking...' : 'Book Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarDetail;