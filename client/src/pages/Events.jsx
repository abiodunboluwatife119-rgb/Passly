import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Listings.css';

const API_URL = import.meta.env.VITE_API_URL;

const Events = () => {
  const [allEvents, setAllEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/events`);
        if (!res.ok) throw new Error('Failed to load events');
        const data = await res.json();
        setAllEvents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearched(true);
    if (!categoryFilter.trim()) {
      setEvents(allEvents);
      return;
    }
    const filtered = allEvents.filter((event) =>
      event.category.toLowerCase().includes(categoryFilter.trim().toLowerCase())
    );
    setEvents(filtered);
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (error) return <div className="container"><p>{error}</p></div>;

  return (
    <div className="container">
      <section className="hero-section">
        <h1>Find an event</h1>
        <p>Search by category — music, comedy, sports, and more.</p>
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="What kind of event? (e.g. Music)"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </section>

      {searched && (
        <section className="results-section">
          <h2>Events</h2>
          {events.length === 0 ? (
            <p>No events found for that category.</p>
          ) : (
            <div className="card-grid">
              {events.map((event) => (
                <Link key={event._id} to={`/events/${event._id}`} className="card">
                  {event.images?.[0] && <img src={event.images[0]} alt={event.title} />}
                  <div className="card-body">
                    <h3>{event.title}</h3>
                    <p>{event.venue}</p>
                    <p>{new Date(event.date).toLocaleDateString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Events;