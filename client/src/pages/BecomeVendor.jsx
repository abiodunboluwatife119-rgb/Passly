import { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css';
import './BecomeVendor.css';

const API_URL = import.meta.env.VITE_API_URL;

const TYPE_LABELS = {
  event: 'Events',
  car: 'Car rentals',
  restaurant: 'Restaurant and food',
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const BecomeVendor = () => {
  const { token, user } = useContext(AuthContext);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('event');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchMyApplication = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/vendor-applications/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('We could not check your application. Please try again.');
      const data = await res.json();
      setApplication(data);
      setLoadError('');
    } catch (err) {
      setLoadError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(fetchMyApplication);
  }, [fetchMyApplication]);

  useEffect(() => {
    document.title = 'Become a vendor · Passly';
    return () => {
      document.title = 'Passly';
    };
  }, []);

  const retry = () => {
    setLoading(true);
    setLoadError('');
    fetchMyApplication();
  };

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
        body: JSON.stringify({
          businessName: businessName.trim(),
          businessType,
          description: description.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

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

  const hasAccess = user?.role === 'vendor' || user?.role === 'admin';

  if (loading) {
    return (
      <div className="container dashboard-page vendor-apply" aria-busy="true">
        <div className="vendor-skeleton" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container dashboard-page vendor-apply">
        <div className="vendor-banner vendor-banner-error" role="alert">
          <p>{loadError}</p>
          <button type="button" className="vendor-btn" onClick={retry}>Try again</button>
        </div>
      </div>
    );
  }

  if (hasAccess) {
    return (
      <div className="container dashboard-page vendor-apply">
        <h1>Become a Vendor</h1>
        <div className="vendor-banner vendor-banner-success">
          <h2>You have vendor access</h2>
          <p>You can create events, car listings and restaurants from your dashboard.</p>
          <Link to="/dashboard" className="vendor-btn vendor-btn-primary">Open dashboard</Link>
        </div>
      </div>
    );
  }

  if (application && application.status === 'pending') {
    return (
      <div className="container dashboard-page vendor-apply">
        <h1>Become a Vendor</h1>
        <div className="vendor-banner vendor-banner-pending">
          <h2>Your application is under review</h2>
          <p>The result will appear on this page as soon as it has been reviewed.</p>
          <dl className="vendor-summary">
            <div>
              <dt>Business</dt>
              <dd>{application.businessName}</dd>
            </div>
            <div>
              <dt>Listing type</dt>
              <dd>{TYPE_LABELS[application.businessType] || application.businessType}</dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>{formatDate(application.createdAt)}</dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  if (application && application.status === 'approved') {
    return (
      <div className="container dashboard-page vendor-apply">
        <h1>Become a Vendor</h1>
        <div className="vendor-banner vendor-banner-success">
          <h2>Your application was approved</h2>
          <p>
            {application.businessName} is now set up as a vendor. Refresh to activate your
            dashboard and start creating listings.
          </p>
          {application.reviewNote && (
            <p className="vendor-note">
              <strong>Reviewer note:</strong> {application.reviewNote}
            </p>
          )}
          <button
            type="button"
            className="vendor-btn vendor-btn-primary"
            onClick={() => window.location.reload()}
          >
            Refresh and open dashboard
          </button>
        </div>
      </div>
    );
  }

  const rejected = application && application.status === 'rejected';

  return (
    <div className="container dashboard-page vendor-apply">
      <h1>Become a Vendor</h1>

      {rejected && (
        <div className="vendor-banner vendor-banner-error">
          <h2>Your last application was not approved</h2>
          <p>You are welcome to apply again with more detail.</p>
          {application.reviewNote && (
            <p className="vendor-note">
              <strong>Reviewer note:</strong> {application.reviewNote}
            </p>
          )}
        </div>
      )}

      <p className="vendor-intro">
        {rejected
          ? 'Update your details and submit a new application.'
          : 'Tell us about your business, and our team will review your application.'}
      </p>

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
          maxLength={1000}
          required
        />

        <button className="dashboard-submit-btn" type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : rejected ? 'Submit new application' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
};

export default BecomeVendor;