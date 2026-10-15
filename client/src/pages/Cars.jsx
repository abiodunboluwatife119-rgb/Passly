import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Listings.css';
import './PagePatterns.css';

const API_URL = import.meta.env.VITE_API_URL;

const Cars = () => {
  const [allCars, setAllCars] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const res = await fetch(`${API_URL}/cars`);
        if (!res.ok) throw new Error('Failed to load cars');
        const data = await res.json();
        setAllCars(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCars();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    setSearched(true);

    await new Promise((resolve) => setTimeout(resolve, 700));

    if (!locationFilter.trim()) {
      setCars(allCars);
      setSearching(false);
      return;
    }
    const filtered = allCars.filter((car) =>
      car.location.toLowerCase().includes(locationFilter.trim().toLowerCase())
    );
    setCars(filtered);
    setSearching(false);
  };

  if (loading) return <div className="container cars-page"><p>Loading...</p></div>;
  if (error) return <div className="container cars-page"><p>{error}</p></div>;

  return (
    <div className="container cars-page">
      <section className="hero-section">
        <h1>Find your ride</h1>
        <p>Search available cars by location.</p>
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Where do you need a car? (e.g. Lagos)"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />
          <button type="submit" disabled={searching}>
            {searching ? 'Fetching details...' : 'Search'}
          </button>
        </form>
      </section>

      {searching && (
        <p className="listing-loading" role="status" aria-live="polite">
          Fetching details...
        </p>
      )}

      {searched && !searching && (
        <section className="results-section">
          <h2>Available Cars</h2>
          {cars.length === 0 ? (
            <p>No cars found for that location.</p>
          ) : (
            <div className="card-grid">
              {cars.map((car) => (
                <Link key={car._id} to={`/cars/${car._id}`} className="card">
                  {car.images?.[0] && <img src={car.images[0]} alt={`${car.make} ${car.model}`} />}
                  <div className="card-body">
                    <h3>{car.make} {car.model} ({car.year})</h3>
                    <p>{car.location} — ₦{car.pricePerDay.toLocaleString()}/day</p>
                    <p>{car.transmission}, {car.seats} seats</p>
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

export default Cars;
