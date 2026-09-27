import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './AdminPanel.css';

const API_URL = import.meta.env.VITE_API_URL;

const AdminPanel = () => {
  const { token } = useContext(AuthContext);
  const [tab, setTab] = useState('applications');
  const [userQuery, setUserQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [usersRes, appsRes] = await Promise.all([
        fetch(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/vendor-applications?status=pending`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!usersRes.ok) throw new Error('Failed to load users');
      if (!appsRes.ok) throw new Error('Failed to load applications');

      setUsers(await usersRes.json());
      setApplications(await appsRes.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(fetchAll);
  }, [fetchAll]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApprove = async (id) => {
    await fetch(`${API_URL}/vendor-applications/${id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchAll();
  };

  const handleReject = async (id) => {
    await fetch(`${API_URL}/vendor-applications/${id}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchAll();
  };

  const filteredUsers = users.filter((user) => {
    const query = userQuery.trim().toLowerCase();
    const matchesQuery = `${user.name} ${user.email}`.toLowerCase().includes(query);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (error) return <div className="container"><p>{error}</p></div>;

  return (
    <div className="container admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">PASSLY OPERATIONS</p>
          <h1>Admin Panel</h1>
          <p className="admin-intro">Review vendor requests and manage platform accounts.</p>
        </div>
        <button className="admin-refresh-btn" onClick={fetchAll}>
          Refresh data
        </button>
      </header>

      <section className="admin-metrics" aria-label="Platform overview">
        <div className="admin-metric">
          <span>Total users</span>
          <strong>{users.length}</strong>
        </div>
        <div className="admin-metric">
          <span>Approved vendors</span>
          <strong>{users.filter((user) => user.role === 'vendor').length}</strong>
        </div>
        <div className="admin-metric">
          <span>Pending applications</span>
          <strong>{applications.length}</strong>
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
          Vendor applications <span className="admin-tab-count">{applications.length}</span>
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
            <span className="admin-pending-label">{applications.length} awaiting review</span>
          </div>
          {applications.length === 0 ? (
            <div className="admin-empty-state">
              <h3>You’re all caught up</h3>
              <p>New vendor applications will appear here for review.</p>
            </div>
          ) : (
            <div className="admin-app-list">
              {applications.map((app) => (
                <article key={app._id} className="admin-app-card">
                  <div className="admin-app-card-heading">
                    <div>
                      <h3>{app.businessName}</h3>
                      <span className="admin-business-type">{app.businessType}</span>
                    </div>
                    <span className="admin-status-badge">Pending review</span>
                  </div>
                  <div className="admin-applicant">
                    <span>Applicant</span>
                    <strong>{app.userId?.name || 'Unknown applicant'}</strong>
                    <a href={`mailto:${app.userId?.email}`}>{app.userId?.email}</a>
                  </div>
                  <p className="admin-app-description">{app.description}</p>
                  <div className="admin-app-actions">
                    <button className="admin-approve-btn" onClick={() => handleApprove(app._id)}>
                      Approve
                    </button>
                    <button className="admin-reject-btn" onClick={() => handleReject(app._id)}>
                      Reject
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
                  <th>Role</th>
                  <th>Change role</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="admin-user-name">{user.name}</td>
                    <td>{user.email}</td>
                    <td><span className={`role-badge role-${user.role}`}>{user.role}</span></td>
                    <td>
                      <select
                        aria-label={`Change role for ${user.name}`}
                        value={user.role}
                        onChange={(event) => handleRoleChange(user._id, event.target.value)}
                      >
                        <option value="user">User</option>
                        <option value="vendor">Vendor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <p className="admin-table-empty">No users match those filters.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminPanel;