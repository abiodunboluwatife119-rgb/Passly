import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL;

const MyEvents = () => {
  const { token } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [category, setCategory] = useState('');
  const [ticketTypes, setTicketTypes] = useState([{ name: '', price: '', capacity: '' }]);
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchMyEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/events/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load your events');
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, [token]);

  const handleTicketChange = (index, field, value) => {
    const updated = [...ticketTypes];
    updated[index][field] = value;
    setTicketTypes(updated);
  };

  const addTicketRow = () => {
    setTicketTypes([...ticketTypes, { name: '', price: '', capacity: '' }]);
  };

  const removeTicketRow = (index) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setVenue('');
    setCategory('');
    setTicketTypes([{ name: '', price: '', capacity: '' }]);
    setImageFile(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const cleanedTickets = ticketTypes
      .filter((t) => t.name && t.price && t.capacity)
      .map((t) => ({
        name: t.name,
        price: Number(t.price),
        capacity: Number(t.capacity),
      }));

    if (cleanedTickets.length === 0) {
      setFormError('Add at least one valid ticket type');
      return;
    }

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

      const res = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          date,
          venue,
          category,
          ticketTypes: cleanedTickets,
          images: imageUrl ? [imageUrl] : [],
          status: 'published',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create event');
      }

      resetForm();
      fetchMyEvents();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container"><p>Loading your events...</p></div>;
  if (error) return <div className="container"><p>{error}</p></div>;

  return (
    <div className="container dashboard-page">
      <h1>My Events</h1>

      <button className="dashboard-toggle-btn" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Create New Event'}
      </button>

      {showForm && (
        <form className="dashboard-form" onSubmit={handleSubmit}>
          {formError && <p style={{ color: 'var(--color-error)' }}>{formError}</p>}

          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />

          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />

          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />

          <label>Venue</label>
          <input value={venue} onChange={(e) => setVenue(e.target.value)} required />

          <label>Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} required />

          <label>Photo</label>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />

          <label>Ticket Types</label>
          {ticketTypes.map((ticket, index) => (
            <div key={index} className="ticket-row">
              <input
                placeholder="Name"
                value={ticket.name}
                onChange={(e) => handleTicketChange(index, 'name', e.target.value)}
              />
              <input
                type="number"
                placeholder="Price"
                value={ticket.price}
                onChange={(e) => handleTicketChange(index, 'price', e.target.value)}
              />
              <input
                type="number"
                placeholder="Capacity"
                value={ticket.capacity}
                onChange={(e) => handleTicketChange(index, 'capacity', e.target.value)}
              />
              {ticketTypes.length > 1 && (
                <button type="button" onClick={() => removeTicketRow(index)}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" className="dashboard-add-row-btn" onClick={addTicketRow}>
            + Add Ticket Type
          </button>

          <button className="dashboard-submit-btn" type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      )}

      {events.length === 0 ? (
        <p>You haven't created any events yet.</p>
      ) : (
        <div className="dashboard-item-grid">
          {events.map((event) => (
            <div key={event._id} className="dashboard-item-card">
              {event.images?.[0] && <img src={event.images[0]} alt={event.title} />}
              <div className="dashboard-item-body">
                <h3>{event.title}</h3>
                <p>{event.venue} — {new Date(event.date).toLocaleDateString()}</p>
                <p>Status: {event.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEvents;