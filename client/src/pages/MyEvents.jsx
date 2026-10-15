import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import './Dashboard.css';
import './Manage.css';
import './MyEvents.css';

const API_URL = import.meta.env.VITE_API_URL;

const blankTicket = () => ({ name: '', price: '', capacity: '' });

const emptyForm = {
  title: '',
  description: '',
  date: '',
  venue: '',
  category: '',
  status: 'published',
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const MyEvents = () => {
  const { token } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [tickets, setTickets] = useState([blankTicket()]);
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

  const fetchMyEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/events/mine`, { headers: authHeaders });
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

  const setField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const changeTicket = (index, field, value) => {
    setTickets((prev) =>
      prev.map((ticket, i) => (i === index ? { ...ticket, [field]: value } : ticket))
    );
  };

  const addTicketRow = () => setTickets((prev) => [...prev, blankTicket()]);

  const removeTicketRow = (index) =>
    setTickets((prev) => prev.filter((_, i) => i !== index));

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setTickets([blankTicket()]);
    setCurrentImage('');
    setImageFile(null);
    setFormError('');
    setFileKey((k) => k + 1);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setTickets([blankTicket()]);
    setCurrentImage('');
    setImageFile(null);
    setFormError('');
    setFileKey((k) => k + 1);
    setShowForm(true);
  };

  const startEdit = (event) => {
    setEditingId(event._id);
    setForm({
      title: event.title,
      description: event.description || '',
      date: event.date ? String(event.date).slice(0, 10) : '',
      venue: event.venue || '',
      category: event.category || '',
      status: event.status === 'draft' ? 'draft' : 'published',
    });
    setTickets(
      event.ticketTypes?.length
        ? event.ticketTypes.map((ticket) => ({
            _id: ticket._id,
            name: ticket.name,
            price: String(ticket.price),
            capacity: String(ticket.capacity),
            sold: ticket.sold || 0,
          }))
        : [blankTicket()]
    );
    setCurrentImage(event.images?.[0] || '');
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

    const cleanedTickets = tickets
      .filter((t) => t.name.trim() && t.price !== '' && t.capacity !== '')
      .map((t) => ({
        ...(t._id ? { _id: t._id } : {}),
        name: t.name.trim(),
        price: Number(t.price),
        capacity: Number(t.capacity),
      }));

    if (cleanedTickets.length === 0) {
      setFormError('Add at least one valid ticket type');
      return;
    }

    setSubmitting(true);

    try {
      const imageUrl = imageFile ? await uploadImage(imageFile) : '';

      const payload = {
        title: form.title,
        description: form.description,
        date: form.date,
        venue: form.venue,
        category: form.category,
        status: form.status,
        ticketTypes: cleanedTickets,
      };

      if (imageUrl) {
        payload.images = [imageUrl];
      } else if (!editingId) {
        payload.images = [];
      }

      const res = await fetch(
        editingId ? `${API_URL}/events/${editingId}` : `${API_URL}/events`,
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save event');
      }

      closeForm();
      fetchMyEvents();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (event) => {
    setTogglingId(event._id);
    setActionError('');
    try {
      const res = await fetch(`${API_URL}/events/${event._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ status: event.status === 'published' ? 'draft' : 'published' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Could not update this event');
      }
      await fetchMyEvents();
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
      const res = await fetch(`${API_URL}/events/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Could not delete this event');
      }
      if (editingId === deleteTarget._id) closeForm();
      setDeleteTarget(null);
      await fetchMyEvents();
    } catch (err) {
      setActionError(err.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (loading) return <div className="container"><p>Loading your events...</p></div>;
  if (error) return <div className="container"><p>{error}</p></div>;

  return (
    <div className="container dashboard-page">
      <header className="dashboard-management-header">
        <div>
          <p className="dashboard-eyebrow">EVENT MANAGEMENT</p>
          <h1>My Events</h1>
          <p>Manage your event details, ticket options, and publication status.</p>
        </div>
        <span className="dashboard-listing-count">
          {events.length} {events.length === 1 ? 'event' : 'events'}
        </span>
      </header>

      {actionError && <p className="manage-error" role="alert">{actionError}</p>}

      <button className="dashboard-toggle-btn" onClick={showForm ? closeForm : openCreate}>
        {showForm ? 'Cancel' : '+ Create New Event'}
      </button>

      {showForm && (
        <form className="dashboard-form" onSubmit={handleSubmit} ref={formRef}>
          <h2 className="form-title">{editingId ? 'Edit event' : 'Create a new event'}</h2>
          {formError && <p style={{ color: 'var(--color-error)' }}>{formError}</p>}

          <label>Title</label>
          <input value={form.title} onChange={setField('title')} required />

          <label>Description</label>
          <textarea value={form.description} onChange={setField('description')} required />

          <label>Date</label>
          <input type="date" value={form.date} onChange={setField('date')} required />

          <label>Venue</label>
          <input value={form.venue} onChange={setField('venue')} required />

          <label>Category</label>
          <input value={form.category} onChange={setField('category')} required />

          <label>Visibility</label>
          <select value={form.status} onChange={setField('status')}>
            <option value="published">Published (visible to customers)</option>
            <option value="draft">Draft (hidden from customers)</option>
          </select>

          <label>Photo</label>
          {currentImage && (
            <div className="form-photo">
              <img src={currentImage} alt="Current event" />
              <span>Choose a new file below to replace this photo.</span>
            </div>
          )}
          <input
            key={fileKey}
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
          />

          <label>Ticket Types</label>
          {tickets.map((ticket, index) => (
            <div key={index} className="ticket-row">
              <input
                placeholder="Name"
                value={ticket.name}
                onChange={(e) => changeTicket(index, 'name', e.target.value)}
              />
              <input
                type="number"
                min="0"
                placeholder="Price"
                value={ticket.price}
                onChange={(e) => changeTicket(index, 'price', e.target.value)}
              />
              <input
                type="number"
                min={ticket.sold > 0 ? ticket.sold : 1}
                placeholder="Capacity"
                value={ticket.capacity}
                onChange={(e) => changeTicket(index, 'capacity', e.target.value)}
              />
              {ticket.sold > 0 ? (
                <span className="ticket-sold">{ticket.sold} sold</span>
              ) : (
                tickets.length > 1 && (
                  <button type="button" onClick={() => removeTicketRow(index)}>
                    Remove
                  </button>
                )
              )}
            </div>
          ))}
          <button type="button" className="dashboard-add-row-btn" onClick={addTicketRow}>
            + Add Ticket Type
          </button>

          <button className="dashboard-submit-btn" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : editingId ? 'Save changes' : 'Create Event'}
          </button>
        </form>
      )}

      {events.length === 0 ? (
        <div className="dashboard-listing-empty">
          <h2>No events yet</h2>
          <p>Create your first event to start offering tickets on Passly.</p>
        </div>
      ) : (
        <div className="dashboard-item-grid">
          {events.map((event) => {
            const isPast = new Date(event.date) < today;
            return (
              <article key={event._id} className="dashboard-item-card event-card">
                {event.images?.[0] ? (
                  <div className="event-card-media">
                    <img src={event.images[0]} alt={event.title} />
                    <span className="event-card-category">{event.category}</span>
                  </div>
                ) : (
                  <div className="event-card-media event-card-media-empty" aria-hidden="true">
                    <span>{event.title.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="dashboard-item-body event-card-body">
                  <div className="event-card-heading">
                    <div>
                      <p className="event-card-eyebrow">{event.category || 'Event'}</p>
                      <h3>{event.title}</h3>
                    </div>
                    <span className={`dashboard-status dashboard-status-${event.status}`}>
                      {event.status}
                    </span>
                  </div>
                  <div className="event-card-meta">
                    <span>{event.venue?.trim()}</span>
                    <strong>{formatDate(event.date)}</strong>
                  </div>
                  {isPast && <span className="event-past-tag">Ended</span>}

                  {event.ticketTypes?.length > 0 && (
                    <ul className="item-tickets event-ticket-list">
                      {event.ticketTypes.map((ticket) => (
                        <li key={ticket._id}>
                          <span>{ticket.name}</span>
                          <span>
                            ₦{ticket.price.toLocaleString()} · {ticket.sold || 0}/{ticket.capacity} sold
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="manage-actions event-card-actions">
                    <button type="button" className="manage-btn" onClick={() => startEdit(event)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="manage-btn"
                      onClick={() => toggleStatus(event)}
                      disabled={togglingId === event._id}
                    >
                      {event.status === 'published' ? 'Move to draft' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      className="manage-btn manage-btn-danger"
                      onClick={() => setDeleteTarget(event)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this event?"
          message={`${deleteTarget.title} will be permanently removed from Passly. If it already has bookings, deletion is blocked and you can move it to draft instead.`}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default MyEvents;
