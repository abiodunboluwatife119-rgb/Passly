import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

const naira = (value) => `₦${Number(value || 0).toLocaleString()}`;

const TYPE_LABELS = { event: 'Event', car: 'Car rental', food: 'Food order' };

const VERTICALS = [
  { key: 'event', label: 'Events' },
  { key: 'car', label: 'Cars' },
  { key: 'food', label: 'Food' },
];

const longDay = (key) =>
  new Date(`${key}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

const dayNumber = (key) => new Date(`${key}T00:00:00`).getDate();

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const recentTitle = (booking) => {
  if (booking.type === 'food') {
    return `${booking.itemCount} dish${booking.itemCount === 1 ? '' : 'es'} ordered`;
  }
  return booking.name || TYPE_LABELS[booking.type] || 'Booking';
};

const VendorSales = () => {
  const { token } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/bookings/vendor`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('We could not load your sales right now.');
      setData(await res.json());
      setError('');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  const retry = () => {
    setLoading(true);
    setError('');
    load();
  };

  if (loading) {
    return (
      <section className="sales" aria-busy="true" aria-label="Loading sales">
        <div className="dash-skeleton dash-skeleton-sales" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="sales">
        <div className="dash-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={retry}>Try again</button>
        </div>
      </section>
    );
  }

  const { summary, byType, trend, recent } = data;
  const maxRevenue = Math.max(...trend.map((day) => day.revenue), 1);
  const trendRevenue = trend.reduce((sum, day) => sum + day.revenue, 0);

  return (
    <section className="sales" aria-labelledby="sales-title">
      <div className="sales-head">
        <div>
          <p className="dashboard-eyebrow">SALES</p>
          <h2 id="sales-title">Bookings and revenue</h2>
        </div>
      </div>

      <div className="sales-stats">
        <article className="sales-stat">
          <span className="sales-stat-label">Revenue</span>
          <strong>{naira(summary.revenue)}</strong>
          <span className="sales-stat-note">
            From {summary.paid} paid booking{summary.paid === 1 ? '' : 's'}
          </span>
        </article>
        <article className="sales-stat">
          <span className="sales-stat-label">Total bookings</span>
          <strong>{summary.totalBookings}</strong>
          <span className="sales-stat-note">{summary.cancelled} cancelled</span>
        </article>
        <article className="sales-stat">
          <span className="sales-stat-label">Awaiting payment</span>
          <strong>{summary.pending}</strong>
          <span className="sales-stat-note">{naira(summary.pendingValue)} pending</span>
        </article>
        <article className="sales-stat">
          <span className="sales-stat-label">Average order</span>
          <strong>{naira(summary.averageOrder)}</strong>
          <span className="sales-stat-note">Across paid bookings</span>
        </article>
      </div>

      {summary.totalBookings === 0 ? (
        <div className="sales-empty">
          <strong>No bookings yet</strong>
          <p>When customers book your events, cars or menu, they will show up here.</p>
        </div>
      ) : (
        <>
          <div className="sales-panels">
            <div className="dash-panel">
              <div className="dash-panel-head">
                <h3>Last 14 days</h3>
                <span className="sales-panel-total">{naira(trendRevenue)}</span>
              </div>
              <div
                className="sales-bars"
                role="img"
                aria-label={`Revenue over the last 14 days, ${naira(trendRevenue)} in total`}
              >
                {trend.map((day) => (
                  <div
                    key={day.date}
                    className="sales-bar-col"
                    title={`${longDay(day.date)}: ${naira(day.revenue)}, ${day.bookings} booking${day.bookings === 1 ? '' : 's'}`}
                  >
                    <div className="sales-bar-track">
                      <span
                        className={`sales-bar ${day.revenue === 0 ? 'sales-bar-empty' : ''}`}
                        style={{
                          height: day.revenue === 0 ? undefined : `${Math.max((day.revenue / maxRevenue) * 100, 4)}%`,
                        }}
                      />
                    </div>
                    <span className="sales-bar-label">{dayNumber(day.date)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="dash-panel">
              <div className="dash-panel-head">
                <h3>By category</h3>
              </div>
              <ul className="sales-split">
                {VERTICALS.map((vertical) => {
                  const totals = byType[vertical.key];
                  const share = summary.revenue
                    ? Math.round((totals.revenue / summary.revenue) * 100)
                    : 0;
                  return (
                    <li key={vertical.key}>
                      <div className="sales-split-row">
                        <strong>{vertical.label}</strong>
                        <span>{naira(totals.revenue)}</span>
                      </div>
                      <div className="dash-bar">
                        <span style={{ width: `${share}%` }} />
                      </div>
                      <p className="sales-split-note">
                        {totals.bookings} paid booking{totals.bookings === 1 ? '' : 's'}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="dash-panel sales-recent">
            <div className="dash-panel-head">
              <h3>Recent bookings</h3>
            </div>
            <ul className="sales-recent-list">
              {recent.map((booking) => (
                <li key={booking._id} className="sales-recent-row">
                  <span className="sales-recent-main">
                    <strong>{recentTitle(booking)}</strong>
                    <span>
                      {TYPE_LABELS[booking.type] || 'Booking'} · {formatDate(booking.createdAt)}
                    </span>
                  </span>
                  <span className="sales-recent-amount">{naira(booking.totalAmount)}</span>
                  <span className={`sales-pill sales-pill-${booking.status}`}>{booking.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
};

export default VendorSales;