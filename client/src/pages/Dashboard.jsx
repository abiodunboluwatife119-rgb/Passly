import { useCallback, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL;

const Dashboard = () => {
  const { token } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [cars, setCars] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchListings = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [eventsResponse, carsResponse, restaurantsResponse] = await Promise.all([
        fetch(`${API_URL}/events/mine`, { headers }),
        fetch(`${API_URL}/cars/mine`, { headers }),
        fetch(`${API_URL}/restaurants/mine`, { headers }),
      ]);

      if (!eventsResponse.ok || !carsResponse.ok || !restaurantsResponse.ok) {
        throw new Error('Could not load your listings. Please refresh and try again.');
      }

      const [eventsData, carsData, restaurantsData] = await Promise.all([
        eventsResponse.json(),
        carsResponse.json(),
        restaurantsResponse.json(),
      ]);

      setEvents(eventsData);
      setCars(carsData);
      setRestaurants(restaurantsData);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(fetchListings);
  }, [fetchListings]);

  const publishedEvents = events.filter((event) => event.status === 'published').length;
  const draftEvents = events.filter((event) => event.status === 'draft').length;
  const availableCars = cars.filter((car) => car.available).length;
  const unavailableCars = cars.length - availableCars;
  const menuItemCount = restaurants.reduce(
    (total, restaurant) => total + (restaurant.menuItems?.length || 0),
    0
  );

  const recentListings = [
    ...events.map((event) => ({
      id: event._id,
      name: event.title,
      type: 'Event',
      updatedAt: event.updatedAt || event.createdAt,
    })),
    ...cars.map((car) => ({
      id: car._id,
      name: `${car.make} ${car.model}`,
      type: 'Car',
      updatedAt: car.updatedAt || car.createdAt,
    })),
    ...restaurants.map((restaurant) => ({
      id: restaurant._id,
      name: restaurant.name,
      type: 'Restaurant',
      updatedAt: restaurant.updatedAt || restaurant.createdAt,
    })),
  ]
    .filter((listing) => listing.updatedAt)
    .sort((first, second) => new Date(second.updatedAt) - new Date(first.updatedAt))
    .slice(0, 5);

  const formatUpdatedAt = (value) => new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(value));

  return (
    <div className="container dashboard-page">
      <header className="dashboard-header">
        <p className="dashboard-eyebrow">VENDOR WORKSPACE</p>
        <h1>Manage your listings</h1>
        <p>Keep your events, vehicles, and restaurant information up to date.</p>
      </header>

      {loading ? (
        <p className="dashboard-data-message" role="status">Loading your listing overview...</p>
      ) : error ? (
        <p className="dashboard-data-message dashboard-data-error" role="alert">{error}</p>
      ) : (
        <>
          <section className="dashboard-overview" aria-label="Listing overview">
            <article className="dashboard-overview-item">
              <span className="dashboard-overview-label">Events</span>
              <strong>{events.length}</strong>
              <span className="dashboard-overview-detail">
                {publishedEvents} published · {draftEvents} drafts
              </span>
            </article>
            <article className="dashboard-overview-item">
              <span className="dashboard-overview-label">Cars</span>
              <strong>{cars.length}</strong>
              <span className="dashboard-overview-detail">
                {availableCars} available · {unavailableCars} unavailable
              </span>
            </article>
            <article className="dashboard-overview-item">
              <span className="dashboard-overview-label">Restaurants</span>
              <strong>{restaurants.length}</strong>
              <span className="dashboard-overview-detail">
                {menuItemCount} menu {menuItemCount === 1 ? 'item' : 'items'} across your listings
              </span>
            </article>
          </section>

      <nav className="dashboard-nav" aria-label="Manage your listings">
        <Link to="/dashboard/events" className="dashboard-nav-card">
          <span className="dashboard-card-index">01</span>
          <span className="dashboard-nav-copy">
            <strong>Events</strong>
            <span>Create events, set ticket options, and update event details.</span>
          </span>
        </Link>
        <Link to="/dashboard/cars" className="dashboard-nav-card">
          <span className="dashboard-card-index">02</span>
          <span className="dashboard-nav-copy">
            <strong>Cars</strong>
            <span>Manage your vehicles, rental prices, and availability details.</span>
          </span>
        </Link>
        <Link to="/dashboard/restaurants" className="dashboard-nav-card">
          <span className="dashboard-card-index">03</span>
          <span className="dashboard-nav-copy">
            <strong>Restaurants</strong>
            <span>Update restaurant details and manage your food menu.</span>
          </span>
        </Link>
      </nav>

          <section className="dashboard-recent" aria-labelledby="dashboard-recent-title">
            <div className="dashboard-recent-heading">
              <div>
                <p className="dashboard-eyebrow">YOUR CATALOG</p>
                <h2 id="dashboard-recent-title">Recently updated</h2>
              </div>
              <span>{recentListings.length} latest</span>
            </div>
            {recentListings.length === 0 ? (
              <p className="dashboard-recent-empty">
                Your recent listings will appear here after you create one.
              </p>
            ) : (
              <ul className="dashboard-recent-list">
                {recentListings.map((listing) => (
                  <li key={`${listing.type}-${listing.id}`}>
                    <span className="dashboard-recent-type">{listing.type}</span>
                    <strong>{listing.name}</strong>
                    <time dateTime={new Date(listing.updatedAt).toISOString()}>
                      {formatUpdatedAt(listing.updatedAt)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;