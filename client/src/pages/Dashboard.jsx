import { useCallback, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import VendorSales from '../components/VendorSales';
import './Dashboard.css';
import './DashboardActions.css';

const API_URL = import.meta.env.VITE_API_URL;

const greetingFor = (hour) => {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

const hasPhoto = (item) => Array.isArray(item.images) && item.images.length > 0;

const DashboardSkeleton = () => (
  <div aria-busy="true" aria-label="Fetching your dashboard details">
    <p role="status" aria-live="polite">Fetching details...</p>
    <div className="dash-skeleton dash-skeleton-stats" />
    <div className="dash-skeleton dash-skeleton-panels" />
    <div className="dash-skeleton dash-skeleton-list" />
  </div>
);

const Dashboard = () => {
  const { token, user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [cars, setCars] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hour, setHour] = useState(() => new Date().getHours());

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
      setError('');
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(fetchListings);
  }, [fetchListings]);

  useEffect(() => {
    document.title = 'Vendor dashboard · Passly';
    return () => {
      document.title = 'Passly';
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setHour(new Date().getHours()), 60000);
    return () => clearInterval(timer);
  }, []);

  const retry = () => {
    setLoading(true);
    setError('');
    fetchListings();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const publishedEvents = events.filter((event) => event.status === 'published').length;
  const draftEvents = events.filter((event) => event.status === 'draft').length;
  const availableCars = cars.filter((car) => car.available).length;
  const unavailableCars = cars.length - availableCars;
  const menuItemCount = restaurants.reduce(
    (total, restaurant) => total + (restaurant.menuItems?.length || 0),
    0
  );

  const attention = [];

  events.forEach((event) => {
    if (event.status === 'published' && new Date(event.date) < today) {
      attention.push({
        key: `past-${event._id}`,
        title: event.title,
        message: 'This event has already happened but is still published.',
        path: '/dashboard/events',
      });
    }
    if (event.status === 'draft') {
      attention.push({
        key: `draft-${event._id}`,
        title: event.title,
        message: 'Still a draft, so customers cannot see it yet.',
        path: '/dashboard/events',
      });
    }
    if (!hasPhoto(event)) {
      attention.push({
        key: `photo-event-${event._id}`,
        title: event.title,
        message: 'Add a photo so it stands out in the listings.',
        path: '/dashboard/events',
      });
    }
  });

  cars.forEach((car) => {
    if (!hasPhoto(car)) {
      attention.push({
        key: `photo-car-${car._id}`,
        title: `${car.make} ${car.model}`,
        message: 'Add a photo so renters can see the car.',
        path: '/dashboard/cars',
      });
    }
  });

  restaurants.forEach((restaurant) => {
    if (!hasPhoto(restaurant)) {
      attention.push({
        key: `photo-restaurant-${restaurant._id}`,
        title: restaurant.name,
        message: 'Add a photo to make the restaurant page inviting.',
        path: '/dashboard/restaurants',
      });
    }
    if (!restaurant.menuItems || restaurant.menuItems.length === 0) {
      attention.push({
        key: `menu-${restaurant._id}`,
        title: restaurant.name,
        message: 'There are no dishes on the menu yet.',
        path: '/dashboard/restaurants',
      });
    }
  });

  const visibleAttention = attention.slice(0, 6);
  const hiddenAttention = attention.length - visibleAttention.length;

  const allListings = [
    ...events.map((event) => ({
      id: event._id,
      name: event.title,
      type: 'Event',
      image: event.images?.[0],
      status: event.status,
      updatedAt: event.updatedAt || event.createdAt,
      path: '/dashboard/events',
    })),
    ...cars.map((car) => ({
      id: car._id,
      name: `${car.make} ${car.model}`,
      type: 'Car',
      image: car.images?.[0],
      status: car.available ? 'available' : 'unavailable',
      updatedAt: car.updatedAt || car.createdAt,
      path: '/dashboard/cars',
    })),
    ...restaurants.map((restaurant) => ({
      id: restaurant._id,
      name: restaurant.name,
      type: 'Restaurant',
      image: restaurant.images?.[0],
      status: null,
      updatedAt: restaurant.updatedAt || restaurant.createdAt,
      path: '/dashboard/restaurants',
    })),
  ];

  const withPhoto = allListings.filter((listing) => listing.image).length;
  const photoPercent = allListings.length
    ? Math.round((withPhoto / allListings.length) * 100)
    : 0;

  const recentListings = allListings
    .filter((listing) => listing.updatedAt)
    .sort((first, second) => new Date(second.updatedAt) - new Date(first.updatedAt))
    .slice(0, 5);

  const firstName = user?.name ? user.name.split(' ')[0] : '';
  const greeting = greetingFor(hour);

  return (
    <div className="container dashboard-page">
      <div className="dash-top">
        <header className="dashboard-header">
          <p className="dashboard-eyebrow">VENDOR WORKSPACE</p>
          <h1>{firstName ? `${greeting}, ${firstName}` : greeting}</h1>
          <p>
            {loading || error
              ? 'Keep your events, vehicles, and restaurant information up to date.'
              : `You have ${plural(events.length, 'event')}, ${plural(cars.length, 'car')} and ${plural(restaurants.length, 'restaurant')} on Passly.`}
          </p>
        </header>

        <Link to="/verify" className="dash-scan-btn">
          Scan tickets
        </Link>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="dash-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={retry}>Try again</button>
        </div>
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

          <VendorSales />

          <div className="dash-panels">
            <section className="dash-panel" aria-labelledby="dash-attention-title">
              <div className="dash-panel-head">
                <h2 id="dash-attention-title">Needs attention</h2>
                {attention.length > 0 && (
                  <span className="dash-count">{attention.length}</span>
                )}
              </div>

              {visibleAttention.length === 0 ? (
                <div className="dash-ok">
                  <span className="dash-ok-mark" aria-hidden="true">✓</span>
                  <div>
                    <strong>Everything looks good</strong>
                    <p>Your listings are published, up to date and have photos.</p>
                  </div>
                </div>
              ) : (
                <ul className="dash-attention-list">
                  {visibleAttention.map((item) => (
                    <li key={item.key}>
                      <Link to={item.path} className="dash-attention-item">
                        <span className="dash-attention-dot" aria-hidden="true" />
                        <span className="dash-attention-text">
                          <strong>{item.title}</strong>
                          <span>{item.message}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {hiddenAttention > 0 && (
                <p className="dash-more">And {hiddenAttention} more to review.</p>
              )}
            </section>

            <section className="dash-panel" aria-labelledby="dash-health-title">
              <div className="dash-panel-head">
                <h2 id="dash-health-title">Photo coverage</h2>
              </div>

              <p className="dash-health-figure">{photoPercent}%</p>
              <div
                className="dash-bar"
                role="progressbar"
                aria-valuenow={photoPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Listings with a photo"
              >
                <span style={{ width: `${photoPercent}%` }} />
              </div>
              <p className="dash-health-note">
                {allListings.length === 0
                  ? 'Create a listing to start tracking this.'
                  : `${withPhoto} of ${plural(allListings.length, 'listing')} ${withPhoto === 1 ? 'has' : 'have'} a photo. Listings with photos look far more trustworthy.`}
              </p>
            </section>
          </div>

          <section className="dashboard-create-section" aria-labelledby="dashboard-create-title">
            <div className="dashboard-create-heading">
              <div>
                <p className="dashboard-eyebrow">ADD TO PASSLY</p>
                <h2 id="dashboard-create-title">What would you like to add?</h2>
              </div>
              <p>Create a new listing for your Passly page.</p>
            </div>

            <nav className="dashboard-create-grid" aria-label="Create a listing">
              <Link to="/dashboard/events" className="dashboard-create-card dashboard-create-event">
                <span className="dashboard-create-category">Events</span>
                <span className="dashboard-create-plus" aria-hidden="true">+</span>
                <span className="dashboard-create-copy">
                  <strong>Create an event</strong>
                  <span>{events.length} event{events.length === 1 ? '' : 's'} · {publishedEvents} published · {draftEvents} draft{draftEvents === 1 ? '' : 's'}</span>
                </span>
                <span className="dashboard-create-note">Add a concert, comedy show, festival, or other experience.</span>
                <span className="dashboard-create-arrow" aria-hidden="true">↗</span>
              </Link>
              <Link to="/dashboard/cars" className="dashboard-create-card dashboard-create-car">
                <span className="dashboard-create-category">Cars</span>
                <span className="dashboard-create-plus" aria-hidden="true">+</span>
                <span className="dashboard-create-copy">
                  <strong>Add a car</strong>
                  <span>{cars.length} car{cars.length === 1 ? '' : 's'} · {availableCars} available</span>
                </span>
                <span className="dashboard-create-note">List a vehicle with its price, photos, and availability.</span>
                <span className="dashboard-create-arrow" aria-hidden="true">↗</span>
              </Link>
              <Link to="/dashboard/restaurants" className="dashboard-create-card dashboard-create-restaurant">
                <span className="dashboard-create-category">Restaurants</span>
                <span className="dashboard-create-plus" aria-hidden="true">+</span>
                <span className="dashboard-create-copy">
                  <strong>Add a restaurant</strong>
                  <span>{restaurants.length} restaurant{restaurants.length === 1 ? '' : 's'} · {menuItemCount} menu item{menuItemCount === 1 ? '' : 's'}</span>
                </span>
                <span className="dashboard-create-note">Set up your restaurant and add its menu.</span>
                <span className="dashboard-create-arrow" aria-hidden="true">↗</span>
              </Link>
            </nav>
          </section>

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
              <ul className="dash-recent-list">
                {recentListings.map((listing) => (
                  <li key={`${listing.type}-${listing.id}`}>
                    <Link to={listing.path} className="dash-recent-row">
                      {listing.image ? (
                        <img src={listing.image} alt="" className="dash-thumb" />
                      ) : (
                        <span className="dash-thumb dash-thumb-empty" aria-hidden="true">
                          {listing.name.charAt(0)}
                        </span>
                      )}
                      <span className="dash-recent-main">
                        <strong>{listing.name}</strong>
                        <span>
                          {listing.type} · Updated{' '}
                          <time dateTime={new Date(listing.updatedAt).toISOString()}>
                            {formatDate(listing.updatedAt)}
                          </time>
                        </span>
                      </span>
                      {listing.status && (
                        <span className={`dashboard-status dashboard-status-${listing.status}`}>
                          {listing.status}
                        </span>
                      )}
                    </Link>
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
