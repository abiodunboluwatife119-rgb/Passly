import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL;

const MyCars = () => {
  const { token } = useContext(AuthContext);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [location, setLocation] = useState('');
  const [transmission, setTransmission] = useState('automatic');
  const [seats, setSeats] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchMyCars = async () => {
    try {
      const res = await fetch(`${API_URL}/cars/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load your cars');
      const data = await res.json();
      setCars(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCars();
  }, [token]);

  const resetForm = () => {
    setMake('');
    setModel('');
    setYear('');
    setPricePerDay('');
    setLocation('');
    setTransmission('automatic');
    setSeats('');
    setImageFile(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      let imageUrl = '';

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const uploadRes = await fetch(`${API_URL}/uploads/image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!uploadRes.ok) throw new Error('Image upload failed');
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const res = await fetch(`${API_URL}/cars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          make,
          model,
          year: Number(year),
          pricePerDay: Number(pricePerDay),
          location,
          transmission,
          seats: Number(seats),
          images: imageUrl ? [imageUrl] : [],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create car');
      }

      resetForm();
      fetchMyCars();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container"><p>Loading your cars...</p></div>;
  if (error) return <div className="container"><p>{error}</p></div>;

  return (
    <div className="container dashboard-page">
      <h1>My Cars</h1>

      <button className="dashboard-toggle-btn" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Add New Car'}
      </button>

      {showForm && (
        <form className="dashboard-form" onSubmit={handleSubmit}>
          {formError && <p style={{ color: 'var(--color-error)' }}>{formError}</p>}

          <label>Make</label>
          <input value={make} onChange={(e) => setMake(e.target.value)} required />

          <label>Model</label>
          <input value={model} onChange={(e) => setModel(e.target.value)} required />

          <label>Year</label>
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)} required />

          <label>Price per day (₦)</label>
          <input type="number" value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} required />

          <label>Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} required />

          <label>Transmission</label>
          <select value={transmission} onChange={(e) => setTransmission(e.target.value)}>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </select>

          <label>Seats</label>
          <input type="number" value={seats} onChange={(e) => setSeats(e.target.value)} required />

          <label>Photo</label>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />

          <button className="dashboard-submit-btn" type="submit" disabled={submitting}>
            {submitting ? 'Adding car...' : 'Add Car'}
          </button>
        </form>
      )}

      {cars.length === 0 ? (
        <p>You haven't added any cars yet.</p>
      ) : (
        <div className="dashboard-item-grid">
          {cars.map((car) => (
            <div key={car._id} className="dashboard-item-card">
              {car.images?.[0] && <img src={car.images[0]} alt={`${car.make} ${car.model}`} />}
              <div className="dashboard-item-body">
                <h3>{car.make} {car.model} ({car.year})</h3>
                <p>{car.location} — ₦{car.pricePerDay.toLocaleString()}/day</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCars;