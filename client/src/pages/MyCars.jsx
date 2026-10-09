import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import './Dashboard.css';
import './Manage.css';

const API_URL = import.meta.env.VITE_API_URL;

const emptyForm = {
  make: '',
  model: '',
  year: '',
  pricePerDay: '',
  location: '',
  description: '',
  transmission: 'automatic',
  seats: '',
  available: true,
};

const MyCars = () => {
  const { token } = useContext(AuthContext);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [currentImage, setCurrentImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [actionError, setActionError] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const formRef = useRef(null);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchMyCars = async () => {
    try {
      const res = await fetch(`${API_URL}/cars/mine`, { headers: authHeaders });
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

  const setField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setCurrentImage('');
    setImageFile(null);
    setFormError('');
    setFileKey((k) => k + 1);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setCurrentImage('');
    setImageFile(null);
    setFormError('');
    setFileKey((k) => k + 1);
    setShowForm(true);
  };

  const startEdit = (car) => {
    setEditingId(car._id);
    setForm({
      make: car.make,
      model: car.model,
      year: String(car.year),
      pricePerDay: String(car.pricePerDay),
      location: car.location,
      description: car.description || '',
      transmission: car.transmission,
      seats: String(car.seats),
      available: car.available,
    });
    setCurrentImage(car.images?.[0] || '');
    setImageFile(null);
    setFormError('');
    setActionError('');
    setFileKey((k) => k + 1);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}/uploads/image`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });
    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const imageUrl = imageFile ? await uploadImage(imageFile) : '';

      const payload = {
        make: form.make,
        model: form.model,
        year: Number(form.year),
        pricePerDay: Number(form.pricePerDay),
        location: form.location,
        description: form.description.trim(),
        transmission: form.transmission,
        seats: Number(form.seats),
        available: form.available,
      };

      if (imageUrl) {
        payload.images = [imageUrl];
      } else if (!editingId) {
        payload.images = [];
      }

      const res = await fetch(
        editingId ? `${API_URL}/cars/${editingId}` : `${API_URL}/cars`,
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save car');
      }

      closeForm();
      fetchMyCars();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAvailability = async (car) => {
    setTogglingId(car._id);
    setActionError('');
    try {
      const res = await fetch(`${API_URL}/cars/${car._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ available: !car.available }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Could not update availability');
      }
      await fetchMyCars();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setActionError('');
    try {
      const res = await fetch(`${API_URL}/cars/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Could not delete this car');
      }
      if (editingId === deleteTarget._id) closeForm();
      setDeleteTarget(null);
      await fetchMyCars();
    } catch (err) {
      setActionError(err.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="container"><p>Loading your cars...</p></div>;
  if (error) return <div className="container"><p>{error}</p></div>;

  return (
    <div className="container dashboard-page">
      <header className="dashboard-management-header">
        <div>
          <p className="dashboard-eyebrow">FLEET MANAGEMENT</p>
          <h1>My Cars</h1>
          <p>Manage your vehicles, rental rates, and availability.</p>
        </div>
        <span className="dashboard-listing-count">
          {cars.length} {cars.length === 1 ? 'vehicle' : 'vehicles'}
        </span>
      </header>

      {actionError && <p className="manage-error" role="alert">{actionError}</p>}

      <button className="dashboard-toggle-btn" onClick={showForm ? closeForm : openCreate}>
        {showForm ? 'Cancel' : '+ Add New Car'}
      </button>

      {showForm && (
        <form className="dashboard-form" onSubmit={handleSubmit} ref={formRef}>
          <h2 className="form-title">{editingId ? 'Edit car' : 'Add a new car'}</h2>
          {formError && <p style={{ color: 'var(--color-error)' }}>{formError}</p>}

          <label>Make</label>
          <input value={form.make} onChange={setField('make')} required />

          <label>Model</label>
          <input value={form.model} onChange={setField('model')} required />

          <label>Year</label>
          <input type="number" value={form.year} onChange={setField('year')} required />

          <label>Price per day (₦)</label>
          <input type="number" value={form.pricePerDay} onChange={setField('pricePerDay')} required />

          <label>Location</label>
          <input value={form.location} onChange={setField('location')} required />

          <label>Description (optional)</label>
          <textarea
            value={form.description}
            onChange={setField('description')}
            maxLength={1000}
            placeholder="Condition, features, mileage, pickup notes"
          />

          <label>Transmission</label>
          <select value={form.transmission} onChange={setField('transmission')}>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </select>

          <label>Seats</label>
          <input type="number" value={form.seats} onChange={setField('seats')} required />

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) => setForm((prev) => ({ ...prev, available: e.target.checked }))}
            />
            Available for rent
          </label>

          <label>Photo</label>
          {currentImage && (
            <div className="form-photo">
              <img src={currentImage} alt="Current car" />
              <span>Choose a new file below to replace this photo.</span>
            </div>
          )}
          <input
            key={fileKey}
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
          />

          <button className="dashboard-submit-btn" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : editingId ? 'Save changes' : 'Add Car'}
          </button>
        </form>
      )}

      {cars.length === 0 ? (
        <div className="dashboard-listing-empty">
          <h2>No vehicles yet</h2>
          <p>Add your first car to make it available for rental on Passly.</p>
        </div>
      ) : (
        <div className="dashboard-item-grid">
          {cars.map((car) => (
            <div key={car._id} className="dashboard-item-card">
              {car.images?.[0] && <img src={car.images[0]} alt={`${car.make} ${car.model}`} />}
              <div className="dashboard-item-body">
                <h3>{car.make} {car.model} ({car.year})</h3>
                <p>{car.location} — ₦{car.pricePerDay.toLocaleString()}/day</p>
                {car.description && <p className="item-desc">{car.description}</p>}
                <span className={`dashboard-status ${car.available ? 'dashboard-status-available' : 'dashboard-status-unavailable'}`}>
                  {car.available ? 'Available' : 'Unavailable'}
                </span>

                <div className="manage-actions">
                  <button type="button" className="manage-btn" onClick={() => startEdit(car)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="manage-btn"
                    onClick={() => toggleAvailability(car)}
                    disabled={togglingId === car._id}
                  >
                    {car.available ? 'Mark unavailable' : 'Mark available'}
                  </button>
                  <button
                    type="button"
                    className="manage-btn manage-btn-danger"
                    onClick={() => setDeleteTarget(car)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this car?"
          message={`${deleteTarget.make} ${deleteTarget.model} will be removed from Passly. Existing bookings are kept, but this car will no longer count in your sales totals.`}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default MyCars;