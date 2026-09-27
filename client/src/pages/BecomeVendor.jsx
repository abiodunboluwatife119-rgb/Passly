import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL;

const BecomeVendor = () => {
  const { token, user } = useContext(AuthContext);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('event');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchMyApplication = async () => {
    try {
      const res = await fetch(`${API_URL}/vendor-applications/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setApplication(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyApplication();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/vendor-applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ businessName, businessType, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit application');
      }

      setApplication(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;

  if (user.role === 'vendor' || user.role === 'admin') {
    return (
      <div className="container dashboard-page">
        <h1>Become a Vendor</h1>
        <p>You already have vendor access.</p>
      </div>
    );
  }

  if (application && application.status === 'pending') {
    return (
      <div className="container dashboard-page">
        <h1>Become a Vendor</h1>
        <p>Your application is under review. We'll notify you once it's been processed.</p>
        <p>Submitted: {new Date(application.createdAt).toLocaleDateString()}</p>
      </div>
    );
  }

  if (application && application.status === 'rejected') {
    return (
      <div className="container dashboard-page">
        <h1>Become a Vendor</h1>
        <p>Your previous application was not approved. You're welcome to apply again with more details.</p>
      </div>
    );
  }

  return (
    <div className="container dashboard-page">
      <h1>Become a Vendor</h1>
      <p>Tell us about your business, and our team will review your application.</p>

      <form className="dashboard-form" onSubmit={handleSubmit}>
        {error && <p style={{ color: 'var(--color-error)' }}>{error}</p>}

        <label>Business Name</label>
        <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />

        <label>What will you list?</label>
        <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
          <option value="event">Events</option>
          <option value="car">Car Rentals</option>
          <option value="restaurant">Restaurant / Food</option>
        </select>

        <label>Tell us about your business</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <button className="dashboard-submit-btn" type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
};

export default BecomeVendor;