import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import adminScreenshot from '../assets/admin.png';
import carImage from '../assets/car.jpg';
import eventsImage from '../assets/events.jpg';
import foodImage from '../assets/food.jpg';
import heroVideo from '../assets/hero.mp4';

const API_URL = import.meta.env.VITE_API_URL;

const Home = () => {
  const [events, setEvents] = useState([]);
  const [cars, setCars] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const [eventsRes, carsRes, restaurantsRes] = await Promise.all([
          fetch(`${API_URL}/events`),
          fetch(`${API_URL}/cars`),
          fetch(`${API_URL}/restaurants`),
        ]);
        const eventsData = await eventsRes.json();
        const carsData = await carsRes.json();
        const restaurantsData = await restaurantsRes.json();
        setEvents(eventsData.slice(0, 3));
        setCars(carsData.slice(0, 3));
        setRestaurants(restaurantsData.slice(0, 3));
      } catch (err) {
        console.error('Failed to load featured content', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="container">
      <section className="home-hero">
        <div className="home-hero-content">
          <h1>Your pass to <span>everything.</span></h1>
          <p>Book events, rent cars, and order food in one place.</p>
        </div>
        <video
          className="home-hero-video"
          controls
          autoPlay
          loop
          muted
          playsInline
          src={heroVideo}
        />
      </section>

      <div className="category-grid">
        <Link to="/events" className="category-card">
          <h3>Events</h3>
          <p>Concerts, festivals, and shows</p>
        </Link>
        <Link to="/cars" className="category-card">
          <h3>Cars</h3>
          <p>Rent a ride for any occasion</p>
        </Link>
        <Link to="/restaurants" className="category-card">
          <h3>Food</h3>
          <p>Order from your favorite spots</p>
        </Link>
      </div>

      <section className="verticals-showcase">
        <div className="verticals-grid">
          <div className="vertical-panel">
            <div
              className="vertical-panel-bg events-bg"
              style={{ backgroundImage: `url(${eventsImage})` }}
            ></div>
            <div className="vertical-panel-overlay"></div>
            <div className="vertical-panel-content">
              <h3>Events</h3>
              <p>Live concerts, festivals, and shows near you.</p>
              <Link to="/events">Browse Events →</Link>
            </div>
          </div>
          <div className="vertical-panel">
            <div
              className="vertical-panel-bg cars-bg"
              style={{ backgroundImage: `url(${carImage})` }}
            ></div>
            <div className="vertical-panel-overlay"></div>
            <div className="vertical-panel-content">
              <h3>Cars</h3>
              <p>Rent the right ride, whenever you need it.</p>
              <Link to="/cars">Browse Cars →</Link>
            </div>
          </div>
          <div className="vertical-panel">
            <div
              className="vertical-panel-bg food-bg"
              style={{ backgroundImage: `url(${foodImage})` }}
            ></div>
            <div className="vertical-panel-overlay"></div>
            <div className="vertical-panel-content">
              <h3>Food</h3>
              <p>Order from restaurants you'll love.</p>
              <Link to="/restaurants">Browse Food →</Link>
            </div>
          </div>
        </div>
      </section>

        {/* Product screenshots */}
      <section className="showcase-section">
        <h2>See it in action</h2>
        <div className="showcase-scroll">
          <div className="showcase-item">
            <div className="showcase-item-frame">Events listing</div>
            <p>Browse live events</p>
          </div>
          <div className="showcase-item">
            <div className="showcase-item-frame">Digital ticket</div>
            <p>Get your instant pass</p>
          </div>
          <div className="showcase-item">
            <div className="showcase-item-frame">Vendor dashboard</div>
            <p>Manage your listings</p>
          </div>
          <div className="showcase-item">
            <div className="showcase-item-frame">
              <img src={adminScreenshot} alt="Passly admin panel" />
            </div>
            <p>Full platform control</p>
          </div>
        </div>
      </section>

      <section className="home-section">
        <h2>Why Passly</h2>
        <div className="why-grid">
          <div>
            <h4>One app, everything booked</h4>
            <p>Events, car rentals, and food — no need for three different apps.</p>
          </div>
          <div>
            <h4>Instant digital passes</h4>
            <p>Every booking generates a real ticket with a unique code — no paper, no waiting.</p>
          </div>
          <div>
            <h4>Secure by design</h4>
            <p>Your bookings and payments are protected — only you can see or manage your own tickets.</p>
          </div>
        </div>
      </section>

      {!loading && (
        <>
          <section className="home-section">
            <h2>Featured Events</h2>
            {events.length === 0 ? (
              <p>No events yet.</p>
            ) : (
              <div className="featured-grid">
                {events.map((event) => (
                  <Link key={event._id} to={`/events/${event._id}`} className="featured-card">
                    <h4>{event.title}</h4>
                    <p>{event.venue}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="home-section">
            <h2>Popular Cars</h2>
            {cars.length === 0 ? (
              <p>No cars yet.</p>
            ) : (
              <div className="featured-grid">
                {cars.map((car) => (
                  <Link key={car._id} to={`/cars/${car._id}`} className="featured-card">
                    <h4>{car.make} {car.model}</h4>
                    <p>₦{car.pricePerDay.toLocaleString()}/day</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="home-section">
            <h2>Featured Restaurants</h2>
            {restaurants.length === 0 ? (
              <p>No restaurants yet.</p>
            ) : (
              <div className="featured-grid">
                {restaurants.map((restaurant) => (
                  <Link key={restaurant._id} to={`/restaurants/${restaurant._id}`} className="featured-card">
                    <h4>{restaurant.name}</h4>
                    <p>{restaurant.cuisine}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default Home;