import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import './AdminPanel.css';

const API_URL = import.meta.env.VITE_API_URL;

const TYPE_LABELS = {
  event: 'Events',
  car: 'Car rentals',
  restaurant: 'Restaurant and food',
};

const ROLE_LABELS = { user: 'User', vendor: 'Vendor', admin: 'Admin' };

const APP_FILTERS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

const AdminPanel = () => {
  const { token, user } = useContext(AuthContext);
  const myId = user?.id || user?._id;

  const [tab, setTab] = useState('applications');
  const [appFilter, setAppFilter] = useState('pending');
  const [userQuery, setUserQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [notice, setNotice] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const [dialog, setDialog] = useState(null);
  const [dialogNote, setDialogNote] = useState('');
  const [dialogBusy, setDialogBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');

  const noticeTimer = useRef(null);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchAll = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [usersRes, appsRes, eventsRes] = await Promise.all([
        fetch(`${API_URL}/users`, { headers }),
        fetch(`${API_URL}/vendor-applications`, { headers }),
        fetch(`${API_URL}/events`),
      ]);

      if (!usersRes.ok) throw new Error('We could not load the user list.');
      if (!appsRes.ok) throw new Error('We could not load the vendor applications.');
      if (!eventsRes.ok) throw new Error('We could not load the event list.');

      setUsers(await usersRes.json());
      setApplications(await appsRes.json());
      setEvents(await eventsRes.json());
      setLoaded(true);
      setLoadError('');
    } catch (err) {
      setLoadError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(fetchAll);
  }, [fetchAll]);

  useEffect(() => {
    document.title = 'Admin panel · Passly';
    return () => {
      document.title = 'Passly';
    };
  }, []);

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  useEffect(() => {
    if (!dialog) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !dialogBusy) setDialog(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, dialogBusy]);

  const showNotice = (type, text) => {
    setNotice({ type, text });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 7000);
  };

  const retry = () => {
    setLoading(true);
    setLoadError('');
    fetchAll();
  };

  const refresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const saveRole = async (target, newRole) => {
    const res = await fetch(`${API_URL}/users/${target._id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ role: newRole }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Could not change this role.');
    showNotice('success', `${target.name} is now a ${ROLE_LABELS[newRole].toLowerCase()}.`);
  };

  const handleRoleSelect = async (target, newRole) => {
    if (newRole === target.role) return;

    if (newRole === 'admin' || target.role === 'admin') {
      setDialogNote('');
      setDialogError('');
      setDialog({ kind: 'role', user: target, newRole });
      return;
    }

    setSavingId(target._id);
    try {
      await saveRole(target, newRole);
      await fetchAll();
    } catch (err) {
      showNotice('error', err.message);
    } finally {
      setSavingId(null);
    }
  };

  const deleteEvent = async (event) => {
    setDialogBusy(true);
    setDialogError('');

    try {
      const res = await fetch(`${API_URL}/events/${event._id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not delete this event.');

      showNotice('success', `${event.title} was deleted.`);
      setDialog(null);
      await fetchAll();
    } catch (err) {
      setDialogError(err.message);
    } finally {
      setDialogBusy(false);
    }
  };

  const openReview = (kind, app) => {
    setDialogNote('');
    setDialogError('');
    setDialog({ kind, app });
  };

  const submitDialog = async () => {
    if (!dialog) return;
    setDialogBusy(true);
    setDialogError('');

    try {
      if (dialog.kind === 'event-delete') {
        await deleteEvent(dialog.event);
        return;
      }

      if (dialog.kind === 'role') {
        await saveRole(dialog.user, dialog.newRole);
      } else {
        const res = await fetch(
          `${API_URL}/vendor-applications/${dialog.app._id}/${dialog.kind}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify(dialog.kind === 'reject' ? { note: dialogNote.trim() } : {}),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.');

        const verb = dialog.kind === 'approve' ? 'approved' : 'rejected';
        showNotice(
          'success',
          `${dialog.app.businessName} was ${verb}. ${
            data.emailSent
              ? 'The applicant was emailed.'
              : 'The applicant will see the result on their Become a Vendor page. No email was sent.'
          }`
        );
      }

      setDialog(null);
      await fetchAll();
    } catch (err) {
      setDialogError(err.message);
    } finally {
      setDialogBusy(false);
    }
  };

  const counts = applications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0 }
  );

  const visibleApps = applications.filter((app) => app.status === appFilter);

  const filteredUsers = users.filter((entry) => {
    const query = userQuery.trim().toLowerCase();
    const matchesQuery = `${entry.name} ${entry.email}`.toLowerCase().includes(query);
    const matchesRole = roleFilter === 'all' || entry.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  const dialogCopy = () => {
    if (!dialog) return null;

    if (dialog.kind === 'event-delete') {
      return {
        title: 'Delete this event?',
        message: `${dialog.event.title} will be permanently removed. Events with paid or pending bookings cannot be deleted and should be moved to draft instead.`,
        confirm: 'Delete event',
        danger: true,
      };
    }

    if (dialog.kind === 'approve') {
      return {
        title: 'Approve this application?',
        message: `${dialog.app.businessName} will become a vendor and can create listings straight away. ${dialog.app.userId?.name || 'The applicant'} will be notified.`,
        confirm: 'Approve',
        danger: false,
      };
    }

    if (dialog.kind === 'reject') {
      return {
        title: 'Reject this application?',
        message: `${dialog.app.userId?.name || 'The applicant'} will be told it was not approved and can apply again.`,
        confirm: 'Reject',
        danger: true,
      };
    }

    if (dialog.newRole === 'admin') {
      return {
        title: 'Make this user an admin?',
        message: `${dialog.user.name} will be able to manage every account and application on Passly.`,
        confirm: 'Make admin',
        danger: true,
      };
    }

    return {
      title: 'Remove admin access?',
      message: `${dialog.user.name} will become a ${ROLE_LABELS[dialog.newRole].toLowerCase()} and will lose access to this panel.`,
      confirm: 'Change role',
      danger: true,
    };
  };

  if (loading) {
    return (
      <div className="container admin-page" aria-busy="true" aria-label="Fetching admin details">
        <p role="status" aria-live="polite">Fetching details...</p>
        <div className="admin-skeleton admin-skeleton-header" />
        <div className="admin-skeleton admin-skeleton-metrics" />
        <div className="admin-skeleton admin-skeleton-list" />
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="container admin-page">
        <div className="admin-error" role="alert">
          <p>{loadError || 'Something went wrong. Please try again.'}</p>
          <button type="button" onClick={retry}>Try again</button>
        </div>
      </div>
    );
  }

  const copy = dialogCopy();

  return (
    <div className="container admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">PASSLY OPERATIONS</p>
          <h1>Admin Panel</h1>
          <p className="admin-intro">Review vendor requests and manage platform accounts.</p>
        </div>
        <button className="admin-refresh-btn" onClick={refresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh data'}
        </button>
      </header>

      {notice && (
        <div className={`admin-notice admin-notice-${notice.type}`} role="status">
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)}>Dismiss</button>
        </div>
      )}

      {loadError && (
        <div className="admin-notice admin-notice-error" role="alert">
          <span>{loadError}</span>
          <button type="button" onClick={refresh}>Try again</button>
        </div>
      )}

      <section className="admin-metrics" aria-label="Platform overview">
        <div className="admin-metric">
          <span>Total users</span>
          <strong>{users.length}</strong>
        </div>
        <div className="admin-metric">
          <span>Approved vendors</span>
          <strong>{users.filter((entry) => entry.role === 'vendor').length}</strong>
        </div>
        <div className="admin-metric">
          <span>Pending applications</span>
          <strong>{counts.pending}</strong>
        </div>
      </section>

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'applications'}
          className={`admin-tab ${tab === 'applications' ? 'active' : ''}`}
          onClick={() => setTab('applications')}
        >
          Vendor applications <span className="admin-tab-count">{counts.pending}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'events'}
          className={`admin-tab ${tab === 'events' ? 'active' : ''}`}
          onClick={() => setTab('events')}
        >
          Events <span className="admin-tab-count">{events.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'users'}
          className={`admin-tab ${tab === 'users' ? 'active' : ''}`}
          onClick={() => setTab('users')}
        >
          All users <span className="admin-tab-count">{users.length}</span>
        </button>
      </div>

      {tab === 'applications' && (
        <section className="admin-section" role="tabpanel">
          <div className="admin-section-heading">
            <div>
              <h2>Vendor applications</h2>
              <p>Review requests to join Passly as a vendor.</p>
            </div>
            <span className="admin-pending-label">{counts.pending} awaiting review</span>
          </div>

          <div className="admin-filters" role="tablist" aria-label="Filter applications">
            {APP_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                role="tab"
                aria-selected={appFilter === filter.key}
                className={`admin-filter ${appFilter === filter.key ? 'active' : ''}`}
                onClick={() => setAppFilter(filter.key)}
              >
                {filter.label}
                <span className="admin-filter-count">{counts[filter.key]}</span>
              </button>
            ))}
          </div>

          {visibleApps.length === 0 ? (
            <div className="admin-empty-state">
              <h3>
                {appFilter === 'pending'
                  ? 'You’re all caught up'
                  : `No ${appFilter} applications`}
              </h3>
              <p>
                {appFilter === 'pending'
                  ? 'New vendor applications will appear here for review.'
                  : 'Reviewed applications will be listed here.'}
              </p>
            </div>
          ) : (
            <div className="admin-app-list">
              {visibleApps.map((app) => (
                <article key={app._id} className="admin-app-card">
                  <div className="admin-app-card-heading">
                    <span className="admin-avatar" aria-hidden="true">
                      {initials(app.userId?.name)}
                    </span>
                    <div className="admin-app-title">
                      <h3>{app.businessName}</h3>
                      <span className="admin-business-type">
                        {TYPE_LABELS[app.businessType] || app.businessType}
                      </span>
                    </div>
                    <span className={`admin-status-badge admin-status-${app.status}`}>
                      {app.status === 'pending' ? 'Pending review' : app.status}
                    </span>
                  </div>

                  <div className="admin-applicant">
                    <span>Applicant</span>
                    <strong>{app.userId?.name || 'Unknown applicant'}</strong>
                    {app.userId?.email && <a href={`mailto:${app.userId.email}`}>{app.userId.email}</a>}
                  </div>

                  <p className="admin-app-meta">
                    Submitted {formatDate(app.createdAt)}
                    {app.reviewedAt && ` · Reviewed ${formatDate(app.reviewedAt)}`}
                  </p>

                  <p className="admin-app-description">{app.description}</p>

                  {app.reviewNote && (
                    <p className="admin-review-note">
                      <strong>Reviewer note:</strong> {app.reviewNote}
                    </p>
                  )}

                  {app.status === 'pending' && (
                    <div className="admin-app-actions">
                      <button className="admin-approve-btn" onClick={() => openReview('approve', app)}>
                        Approve
                      </button>
                      <button className="admin-reject-btn" onClick={() => openReview('reject', app)}>
                        Reject
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'events' && (
        <section className="admin-section" role="tabpanel">
          <div className="admin-section-heading">
            <div>
              <h2>Published events</h2>
              <p>Remove event uploads from the platform. Events with active bookings are protected.</p>
            </div>
            <span className="admin-pending-label">{events.length} listed</span>
          </div>

          {eventsLoading ? (
            <div className="admin-empty-state"><p>Loading events...</p></div>
          ) : events.length === 0 ? (
            <div className="admin-empty-state">
              <h3>No published events</h3>
              <p>Published vendor events will appear here.</p>
            </div>
          ) : (
            <div className="admin-app-list">
              {events.map((event) => (
                <article key={event._id} className="admin-app-card">
                  <div className="admin-app-card-heading">
                    <div className="admin-app-title">
                      <h3>{event.title}</h3>
                      <span className="admin-business-type">{event.category || 'Event'}</span>
                    </div>
                    <span className="admin-status-badge admin-status-approved">
                      {event.status || 'published'}
                    </span>
                  </div>
                  <div className="admin-applicant">
                    <span>Venue</span>
                    <strong>{event.venue || 'Venue not provided'}</strong>
                  </div>
                  <p className="admin-app-meta">
                    Date: {formatDate(event.date)} · Tickets: {event.ticketTypes?.length || 0}
                  </p>
                  <div className="admin-app-actions">
                    <button
                      type="button"
                      className="admin-dialog-confirm admin-dialog-confirm-danger"
                      onClick={() => {
                        setDialogError('');
                        setDialog({ kind: 'event-delete', event });
                      }}
                    >
                      Delete event
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'users' && (
        <section className="admin-section" role="tabpanel">
          <div className="admin-section-heading">
            <div>
              <h2>User accounts</h2>
              <p>Find accounts and manage their platform roles.</p>
            </div>
          </div>

          <div className="admin-user-tools">
            <label className="admin-search">
              <span className="sr-only">Search users by name or email</span>
              <input
                type="search"
                placeholder="Search name or email"
                value={userQuery}
                onChange={(event) => setUserQuery(event.target.value)}
              />
            </label>
            <label className="admin-role-filter">
              <span className="sr-only">Filter users by role</span>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="all">All roles</option>
                <option value="user">Users</option>
                <option value="vendor">Vendors</option>
                <option value="admin">Admins</option>
              </select>
            </label>
            <span className="admin-result-count">{filteredUsers.length} shown</span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Role</th>
                  <th>Change role</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((entry) => {
                  const isMe = myId && entry._id === myId;
                  return (
                    <tr key={entry._id}>
                      <td data-label="Name" className="admin-user-name">
                        <span className="admin-avatar admin-avatar-small" aria-hidden="true">
                          {initials(entry.name)}
                        </span>
                        <span>
                          {entry.name}
                          {isMe && <em className="admin-you-tag">You</em>}
                        </span>
                      </td>
                      <td data-label="Email">{entry.email}</td>
                      <td data-label="Joined">{formatDate(entry.createdAt) || '-'}</td>
                      <td data-label="Role">
                        <span className={`role-badge role-${entry.role}`}>{entry.role}</span>
                      </td>
                      <td data-label="Change role">
                        <select
                          aria-label={`Change role for ${entry.name}`}
                          value={entry.role}
                          disabled={isMe || savingId === entry._id}
                          onChange={(event) => handleRoleSelect(entry, event.target.value)}
                        >
                          <option value="user">User</option>
                          <option value="vendor">Vendor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <p className="admin-table-empty">No users match those filters.</p>
            )}
          </div>
        </section>
      )}

      {dialog && copy && (
        <div className="admin-dialog-backdrop" onClick={() => !dialogBusy && setDialog(null)}>
          <div
            className="admin-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="admin-dialog-title">{copy.title}</h3>
            <p>{copy.message}</p>

            {dialog.kind === 'reject' && (
              <>
                <label htmlFor="reject-note">Reason (optional)</label>
                <textarea
                  id="reject-note"
                  value={dialogNote}
                  onChange={(e) => setDialogNote(e.target.value)}
                  maxLength={500}
                  placeholder="Shown to the applicant, so they know what to improve"
                />
              </>
            )}

            {dialogError && <p className="admin-dialog-error" role="alert">{dialogError}</p>}

            <div className="admin-dialog-actions">
              <button
                type="button"
                className="admin-dialog-cancel"
                onClick={() => setDialog(null)}
                disabled={dialogBusy}
                autoFocus
              >
                Cancel
              </button>
              <button
                type="button"
                className={`admin-dialog-confirm ${copy.danger ? 'admin-dialog-confirm-danger' : ''}`}
                onClick={submitDialog}
                disabled={dialogBusy}
              >
                {dialogBusy ? 'Saving...' : copy.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
