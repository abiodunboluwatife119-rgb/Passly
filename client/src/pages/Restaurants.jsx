import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Listings.css';

const API_URL = import.meta.env.VITE_API_URL;

const Restaurants = () => {
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [searched, setSearched] = useState(false);

  const [dishQuery, setDishQuery] = useState('');
  const [dishResults, setDishResults] = useState(null);
  const [dishSearching, setDishSearching] = useState(false);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch(`${API_URL}/restaurants`);
        if (!res.ok) throw new Error('Failed to load restaurants');
        const data = await res.json();
        setAllRestaurants(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearched(true);
    setDishResults(null);
    if (!cuisineFilter.trim()) {
      setRestaurants(allRestaurants);
      return;
    }
    const filtered = allRestaurants.filter((restaurant) =>
      restaurant.cuisine.toLowerCase().includes(cuisineFilter.trim().toLowerCase())
    );
    setRestaurants(filtered);
  };

  const handleDishSearch = async (e) => {
    e.preventDefault();
    if (!dishQuery.trim()) return;
    setDishSearching(true);
    setSearched(false);
    try {
      const res = await fetch(`${API_URL}/menu/search?search=${encodeURIComponent(dishQuery.trim())}`);
      const data = await res.json();
      setDishResults(data);
    } catch (err) {
      setDishResults([]);
    } finally {
      setDishSearching(false);
    }
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (error) return <div className="container"><p>{error}</p></div>;

  return (
    <div className="container">
      <section className="hero-section">
        <h1>Find a restaurant</h1>
        <p>Search by cuisine, or search for a specific dish across all restaurants.</p>

        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="What are you craving? (e.g. Nigerian)"
            value={cuisineFilter}
            onChange={(e) => setCuisineFilter(e.target.value)}
          />
          <button type="submit">Search Restaurants</button>
        </form>

        <form className="search-form" onSubmit={handleDishSearch} style={{ marginTop: 12 }}>
          <input
            type="text"
            placeholder="Search a dish (e.g. Jollof Rice)"
            value={dishQuery}
            onChange={(e) => setDishQuery(e.target.value)}
          />
          <button type="submit" disabled={dishSearching}>
            {dishSearching ? 'Searching...' : 'Search Dishes'}
          </button>
        </form>
      </section>

      {dishResults && (
        <section className="results-section">
          <h2>Dish Results</h2>
          {dishResults.length === 0 ? (
            <p>No dishes found matching "{dishQuery}".</p>
          ) : (
            <div className="card-grid">
              {dishResults.map((item) => (
                <Link key={item._id} to={`/restaurants/${item.restaurantId?._id}`} className="card">
                  {item.image && <img src={item.image} alt={item.name} />}
                  <div className="card-body">
                    <h3>{item.name}</h3>
                    <p>₦{item.price.toLocaleString()}</p>
                    <p>From: {item.restaurantId?.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {searched && (
        <section className="results-section">
          <h2>Restaurants</h2>
          {restaurants.length === 0 ? (
            <p>No restaurants found for that cuisine.</p>
          ) : (
            <div className="card-grid">
              {restaurants.map((restaurant) => (
                <Link key={restaurant._id} to={`/restaurants/${restaurant._id}`} className="card">
                  {restaurant.images?.[0] && <img src={restaurant.images[0]} alt={restaurant.name} />}
                  <div className="card-body">
                    <h3>{restaurant.name}</h3>
                    <p>{restaurant.cuisine} — {restaurant.location}</p>
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

export default Restaurants;