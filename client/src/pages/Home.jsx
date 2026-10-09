import { useState, useEffect, useMemo, useRef, useCallback, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { AuthContext } from '../context/AuthContext';
import './Home.css';
import adminScreenshot from '../assets/admin.png';
import carImage from '../assets/car.jpg';
import eventsImage from '../assets/events.jpg';
import foodImage from '../assets/food.jpg';
import heroVideo from '../assets/hero.mp4';

const API_URL = import.meta.env.VITE_API_URL;
const DAY_MS = 86400000;
const ROTATING_WORDS = ['everything.', 'the night.', 'the road.', 'the table.'];
const MENU_RESTAURANT_LIMIT = 6;

const HOW_STEPS = {
  customers: [
    {
      title: 'Find something',
      text: 'Browse events, cars and restaurants, or use the search at the top of the page.',
    },
    {
      title: 'Book and pay',
      text: 'Pick your tickets, dates or dishes, check the full total, and place your order.',
    },
    {
      title: 'Show your pass',
      text: 'Every booking becomes a ticket with a QR code and a unique code in My Bookings.',
    },
  ],
  vendors: [
    {
      title: 'Apply',
      text: 'Tell us about your business. An admin reviews every application.',
    },
    {
      title: 'List and photograph',
      text: 'Create events, cars or a restaurant menu, and add photos that sell.',
    },
    {
      title: 'Scan and track',
      text: 'Verify tickets at the door and watch bookings and revenue on your dashboard.',
    },
  ],
};

const FAQS = [
  {
    question: 'How do tickets work?',
    answer:
      'Once a booking is paid, Passly creates a ticket with a unique code and a QR code. You find it under My Bookings and show it at the door or on pickup.',
  },
  {
    question: 'What happens if a ticket is scanned twice?',
    answer:
      'The first scan marks the ticket as used. Any later scan shows that it was already used, along with the time of the first scan.',
  },
  {
    question: 'Is real money charged?',
    answer:
      'No. Payments in this version are simulated, so you can try the full booking flow safely.',
  },
  {
    question: 'Can I book an event, a car and a meal in one go?',
    answer:
      'Each one is its own booking, but they all live in one account and one My Bookings page.',
  },
  {
    question: 'How do I become a vendor?',
    answer:
      'Open Become a Vendor, tell us about your business, and an admin will review your application. Once approved, your dashboard unlocks.',
  },
];

const naira = (value) => `₦${Number(value || 0).toLocaleString()}`;

const localMidnight = (value) => new Date(`${String(value).slice(0, 10)}T00:00:00`);

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const daysUntil = (value) => Math.round((localMidnight(value) - startOfToday()) / DAY_MS);

const countdownLabel = (days) => {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
};

const formatEventDate = (value) =>
  localMidnight(value).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

const cheapestSeat = (event) => {
  const open = (event.ticketTypes || []).filter((ticket) => ticket.capacity - (ticket.sold || 0) > 0);
  return open.length ? Math.min(...open.map((ticket) => ticket.price)) : null;
};

const asList = async (response) => {
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

const usePrefersReducedMotion = () => {
  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  return reduced;
};

const useInView = (threshold = 0.2) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
};

const Reveal = ({ children, className = '', delay = 0 }) => {
  const [ref, inView] = useInView(0.12);
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const Rotator = ({ words }) => {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced) return undefined;
    const timer = setInterval(() => setIndex((current) => (current + 1) % words.length), 2600);
    return () => clearInterval(timer);
  }, [reduced, words.length]);

  return (
    <span className="rotator" aria-hidden="true">
      <span key={index} className="rotator-word">{words[index]}</span>
    </span>
  );
};

const CountUp = ({ value, suffix = '' }) => {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView(0.4);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;

    if (reduced || value === 0) {
      const frame = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(frame);
    }

    const start = performance.now();
    const duration = 1100;
    let frame;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, reduced]);

  return <span ref={ref}>{shown}{suffix}</span>;
};

const SampleTicket = () => {
  const reduced = usePrefersReducedMotion();
  const ticketRef = useRef(null);

  const handleMove = (event) => {
    const node = ticketRef.current;
    if (reduced || !node) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    node.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
  };

  const reset = () => {
    if (ticketRef.current) ticketRef.current.style.transform = '';
  };

  return (
    <div className="sample-wrap" onMouseMove={handleMove} onMouseLeave={reset}>
      <div ref={ticketRef} className="sample-ticket" role="img" aria-label="Sample Passly ticket">
        <div className="sample-main">
          <span className="sample-brand">Passly</span>
          <p className="sample-type">Event ticket</p>
          <h3>VIP</h3>
          <span className="sample-pill">Valid</span>
        </div>
        <div className="sample-tear" />
        <div className="sample-stub">
          <div className="sample-qr">
            <QRCodeSVG value="TKT-SAMPLE" size={120} level="M" bgColor="#FFFFFF" fgColor="#2C2520" />
          </div>
          <p className="sample-code">TKT-SAMPLE</p>
          <span className="sample-tag">Sample ticket</span>
        </div>
      </div>
    </div>
  );
};

const Block = ({ height }) => (
  <div className="home-skeleton" style={{ height }} aria-hidden="true" />
);

const Home = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [cars, setCars] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [myBookings, setMyBookings] = useState([]);
  const [query, setQuery] = useState('');
  const [days, setDays] = useState(3);
  const [audience, setAudience] = useState('customers');

  const loadListings = useCallback(async () => {
    try {
      const [eventsRes, carsRes, restaurantsRes] = await Promise.all([
        fetch(`${API_URL}/events`),
        fetch(`${API_URL}/cars`),
        fetch(`${API_URL}/restaurants`),
      ]);

      if (!eventsRes.ok && !carsRes.ok && !restaurantsRes.ok) {
        throw new Error('Listings unavailable');
      }

      const [eventsData, carsData, restaurantsData] = await Promise.all([
        asList(eventsRes),
        asList(carsRes),
        asList(restaurantsRes),
      ]);

      setEvents(eventsData);
      setCars(carsData);
      setRestaurants(restaurantsData);
      setLoadError(false);
      setLoading(false);

      const details = await Promise.all(
        restaurantsData.slice(0, MENU_RESTAURANT_LIMIT).map((restaurant) =>
          fetch(`${API_URL}/restaurants/${restaurant._id}`)
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null)
        )
      );

      const dishList = details
        .filter(Boolean)
        .flatMap((restaurant) =>
          (restaurant.menuItems || []).map((item) => ({
            ...item,
            restaurantId: restaurant._id,
            restaurantName: restaurant.name,
          }))
        );

      dishList.sort((first, second) => Number(Boolean(second.image)) - Number(Boolean(first.image)));
      setDishes(dishList);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadListings);
  }, [loadListings]);

  useEffect(() => {
    if (!token) {
      Promise.resolve().then(() => setMyBookings([]));
      return undefined;
    }

    let cancelled = false;

    fetch(`${API_URL}/bookings/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        if (!cancelled) setMyBookings(Array.isArray(list) ? list : []);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [token]);

  const retry = () => {
    setLoading(true);
    setLoadError(false);
    loadListings();
  };

  const upcoming = useMemo(
    () =>
      events
        .filter((event) => daysUntil(event.date) >= 0)
        .sort((first, second) => localMidnight(first.date) - localMidnight(second.date)),
    [events]
  );

  const cheapestCar = useMemo(
    () =>
      cars.length
        ? cars.reduce((best, car) => (car.pricePerDay < best.pricePerDay ? car : best), cars[0])
        : null,
    [cars]
  );

  const locations = useMemo(
    () => [
      ...new Set(
        [...cars.map((car) => car.location), ...restaurants.map((restaurant) => restaurant.location)]
          .map((value) => String(value || '').trim())
          .filter(Boolean)
      ),
    ],
    [cars, restaurants]
  );

  const searchResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) return null;

    const matches = (...parts) => parts.filter(Boolean).join(' ').toLowerCase().includes(term);

    const eventHits = events
      .filter((event) => matches(event.title, event.venue, event.category))
      .slice(0, 4)
      .map((event) => ({
        key: `event-${event._id}`,
        to: `/events/${event._id}`,
        title: event.title,
        meta: String(event.venue || '').trim(),
        type: 'Event',
      }));

    const carHits = cars
      .filter((car) => matches(car.make, car.model, car.location, car.transmission))
      .slice(0, 4)
      .map((car) => ({
        key: `car-${car._id}`,
        to: `/cars/${car._id}`,
        title: `${car.make} ${car.model}`,
        meta: `${car.location} · ${naira(car.pricePerDay)} per day`,
        type: 'Car',
      }));

    const restaurantHits = restaurants
      .filter((restaurant) => matches(restaurant.name, restaurant.cuisine, restaurant.location))
      .slice(0, 4)
      .map((restaurant) => ({
        key: `restaurant-${restaurant._id}`,
        to: `/restaurants/${restaurant._id}`,
        title: restaurant.name,
        meta: `${restaurant.cuisine} · ${restaurant.location}`,
        type: 'Restaurant',
      }));

    const dishHits = dishes
      .filter((dish) => matches(dish.name))
      .slice(0, 4)
      .map((dish) => ({
        key: `dish-${dish._id}`,
        to: `/restaurants/${dish.restaurantId}`,
        title: dish.name,
        meta: `${dish.restaurantName} · ${naira(dish.price)}`,
        type: 'Dish',
      }));

    return [...eventHits, ...carHits, ...restaurantHits, ...dishHits];
  }, [query, events, cars, restaurants, dishes]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (searchResults && searchResults.length > 0) navigate(searchResults[0].to);
  };

  const firstName = user?.name ? user.name.split(' ')[0] : '';
  const isVendor = user?.role === 'vendor' || user?.role === 'admin';
  const pendingCount = myBookings.filter((booking) => booking.status === 'pending').length;
  const paidCount = myBookings.filter((booking) => booking.status === 'paid').length;
  const dishSuffix = restaurants.length > MENU_RESTAURANT_LIMIT ? '+' : '';
  const showData = !loading && !loadError;

  const welcome = pendingCount > 0
    ? {
        text: `${pendingCount} booking${pendingCount === 1 ? ' is' : 's are'} waiting for payment.`,
        label: 'Complete payment',
        to: '/bookings',
      }
    : paidCount > 0
    ? {
        text: `${paidCount} active booking${paidCount === 1 ? '' : 's'}. Your tickets are one tap away.`,
        label: 'View my tickets',
        to: '/bookings',
      }
    : { text: 'Ready for your next plan?', label: 'Explore events', to: '/events' };

  return (
    <div className="container home">
      <section className="home-hero">
        <div className="home-hero-content">
          <p className="home-hero-eyebrow">Events · Cars · Food</p>
          <h1 aria-label="Your pass to everything.">
            Your pass to <Rotator words={ROTATING_WORDS} />
          </h1>
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

      {user && (
        <section className="home-welcome" aria-label="Welcome back">
          <div>
            <strong>Welcome back{firstName ? `, ${firstName}` : ''}</strong>
            <p>{welcome.text}</p>
          </div>
          <Link to={welcome.to} className="home-btn home-btn-dark">{welcome.label}</Link>
        </section>
      )}

      <section className="finder" aria-label="Search Passly">
        <form onSubmit={handleSearchSubmit} role="search">
          <label htmlFor="home-search" className="finder-label">Search everything on Passly</label>
          <input
            id="home-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try a venue, a car, a cuisine or a dish"
            autoComplete="off"
          />
        </form>

        {searchResults && (
          <div className="finder-results" aria-live="polite">
            {searchResults.length === 0 ? (
              <p className="finder-empty">
                Nothing matches "{query.trim()}" yet. For a full dish search across every menu, open the{' '}
                <Link to="/restaurants">Food page</Link>.
              </p>
            ) : (
              <>
                <ul>
                  {searchResults.map((result) => (
                    <li key={result.key}>
                      <Link to={result.to} className="finder-row">
                        <span className="finder-type">{result.type}</span>
                        <span className="finder-main">
                          <strong>{result.title}</strong>
                          {result.meta && <span>{result.meta}</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="finder-hint">Press Enter to open the top result.</p>
              </>
            )}
          </div>
        )}
      </section>

      {loadError && (
        <div className="home-notice" role="alert">
          <p>We could not load live listings right now. The server may still be waking up.</p>
          <button type="button" onClick={retry}>Try again</button>
        </div>
      )}

      {loading && <Block height={96} />}

      {showData && (
        <Reveal className="home-stats">
          <div>
            <strong><CountUp value={upcoming.length} /></strong>
            <span>Upcoming events</span>
          </div>
          <div>
            <strong><CountUp value={cars.length} /></strong>
            <span>Cars ready to rent</span>
          </div>
          <div>
            <strong><CountUp value={restaurants.length} /></strong>
            <span>Restaurants</span>
          </div>
          <div>
            <strong><CountUp value={dishes.length} suffix={dishSuffix} /></strong>
            <span>Dishes on menus</span>
          </div>
        </Reveal>
      )}

      <Reveal className="verticals-showcase">
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
              <Link to="/events">Browse Events</Link>
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
              <Link to="/cars">Browse Cars</Link>
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
              <Link to="/restaurants">Browse Food</Link>
            </div>
          </div>
        </div>
      </Reveal>

      {loading && <Block height={300} />}

      {showData && (
        <Reveal className="home-block">
          <div className="home-block-head">
            <div>
              <p className="home-eyebrow">Coming up</p>
              <h2>Next on the calendar</h2>
            </div>
            <Link to="/events" className="home-link">See all events</Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="home-empty">
              <strong>No upcoming events right now</strong>
              <p>New events are added all the time. Check back soon.</p>
            </div>
          ) : (
            <div className="upcoming-scroll">
              {upcoming.slice(0, 8).map((event) => {
                const price = cheapestSeat(event);
                return (
                  <Link key={event._id} to={`/events/${event._id}`} className="upcoming-card">
                    <div className="upcoming-media">
                      {event.images?.[0] ? (
                        <img src={event.images[0]} alt="" />
                      ) : (
                        <span aria-hidden="true">{event.title.charAt(0)}</span>
                      )}
                      <em className="upcoming-chip">{countdownLabel(daysUntil(event.date))}</em>
                    </div>
                    <div className="upcoming-body">
                      <h3>{event.title}</h3>
                      <p>{formatEventDate(event.date)}</p>
                      <p className="upcoming-venue">{String(event.venue || '').trim()}</p>
                      <strong>{price === null ? 'Sold out' : `From ${naira(price)}`}</strong>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Reveal>
      )}

      <section className="home-block story" aria-labelledby="story-title">
        <div className="story-steps">
          <Reveal>
            <p className="home-eyebrow">One account, three worlds</p>
            <h2 id="story-title">One Friday night, one app.</h2>
          </Reveal>

          <Reveal delay={80} className="story-step">
            <span className="story-num">1</span>
            <div>
              <h3>Book the night</h3>
              <p>Pick an event, choose your tier, and check out in seconds.</p>
              <Link to="/events" className="home-link">Browse events</Link>
            </div>
          </Reveal>

          <Reveal delay={160} className="story-step">
            <span className="story-num">2</span>
            <div>
              <h3>Rent the ride</h3>
              <p>Choose your dates and see the full price before you commit.</p>
              <Link to="/cars" className="home-link">Browse cars</Link>
            </div>
          </Reveal>

          <Reveal delay={240} className="story-step">
            <span className="story-num">3</span>
            <div>
              <h3>Order after</h3>
              <p>Order from local restaurants for pickup or delivery.</p>
              <Link to="/restaurants" className="home-link">Browse food</Link>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <p className="story-foot">
              Every booking becomes a pass in My Bookings, one place for all of it.
            </p>
          </Reveal>
        </div>

        <Reveal className="story-visual" delay={120}>
          <SampleTicket />
        </Reveal>
      </section>

      {loading && <Block height={320} />}

      {showData && (
        <div className="duo">
          <Reveal className="tool-card">
            <p className="home-eyebrow">Dish spotlight</p>
            <h2>What people are ordering</h2>

            {dishes.length === 0 ? (
              <div className="home-empty">
                <strong>Menus are being added</strong>
                <p>Browse restaurants to see what is cooking.</p>
                <Link to="/restaurants" className="home-link">Browse restaurants</Link>
              </div>
            ) : (
              <div className="dish-scroll">
                {dishes.slice(0, 8).map((dish) => (
                  <Link key={dish._id} to={`/restaurants/${dish.restaurantId}`} className="dish-card">
                    {dish.image ? (
                      <img src={dish.image} alt="" />
                    ) : (
                      <span className="dish-letter" aria-hidden="true">{dish.name.charAt(0)}</span>
                    )}
                    <strong>{dish.name}</strong>
                    <span>{dish.restaurantName}</span>
                    <em>{naira(dish.price)}</em>
                  </Link>
                ))}
              </div>
            )}
          </Reveal>

          <Reveal className="tool-card" delay={100}>
            <p className="home-eyebrow">Rental calculator</p>
            <h2>How long do you need a car?</h2>

            {!cheapestCar ? (
              <div className="home-empty">
                <strong>No cars available right now</strong>
                <p>Check back soon, or browse the full list.</p>
                <Link to="/cars" className="home-link">Browse cars</Link>
              </div>
            ) : (
              <>
                <label htmlFor="rental-days" className="calc-label">
                  Rental length: <strong>{days} day{days === 1 ? '' : 's'}</strong>
                </label>
                <input
                  id="rental-days"
                  className="calc-range"
                  type="range"
                  min="1"
                  max="14"
                  value={days}
                  onChange={(event) => setDays(Number(event.target.value))}
                />

                <div className="calc-result">
                  <p className="calc-car">
                    {cheapestCar.make} {cheapestCar.model}
                    <span>Cheapest available</span>
                  </p>
                  <p className="calc-sum">
                    {naira(cheapestCar.pricePerDay)} × {days} day{days === 1 ? '' : 's'}
                  </p>
                  <p className="calc-total">{naira(cheapestCar.pricePerDay * days)}</p>
                </div>

                <div className="calc-actions">
                  <Link to={`/cars/${cheapestCar._id}`} className="home-btn home-btn-dark">
                    View this car
                  </Link>
                  <Link to="/cars" className="home-link">Browse all cars</Link>
                </div>
                <p className="calc-note">
                  Dates and availability are confirmed when you book.
                </p>
              </>
            )}
          </Reveal>
        </div>
      )}

      {showData && locations.length > 1 && (
        <section className="ribbon" aria-label="Where Passly listings are today">
          <div className="ribbon-track">
            <div className="ribbon-group">
              {locations.map((place) => (
                <span key={place} className="ribbon-chip">{place}</span>
              ))}
            </div>
            <div className="ribbon-group" aria-hidden="true">
              {locations.map((place) => (
                <span key={`copy-${place}`} className="ribbon-chip">{place}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      <Reveal className="home-block how">
        <p className="home-eyebrow">How it works</p>
        <h2>Simple on both sides</h2>

        <div className="how-tabs" role="tablist" aria-label="Choose your side">
          <button
            type="button"
            role="tab"
            aria-selected={audience === 'customers'}
            className={`how-tab ${audience === 'customers' ? 'active' : ''}`}
            onClick={() => setAudience('customers')}
          >
            For customers
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={audience === 'vendors'}
            className={`how-tab ${audience === 'vendors' ? 'active' : ''}`}
            onClick={() => setAudience('vendors')}
          >
            For vendors
          </button>
        </div>

        <div className="how-panel" role="tabpanel">
          <ol className="how-steps">
            {HOW_STEPS[audience].map((step, index) => (
              <li key={step.title}>
                <span className="how-num">{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          {audience === 'vendors' && (
            <figure className="how-shot">
              <img src={adminScreenshot} alt="Passly admin panel" />
              <figcaption>The admin panel that reviews vendor applications</figcaption>
            </figure>
          )}
        </div>

        <Link
          to={audience === 'customers' ? '/events' : '/become-vendor'}
          className="home-btn home-btn-dark"
        >
          {audience === 'customers' ? 'Start browsing' : 'Become a vendor'}
        </Link>
      </Reveal>

      <Reveal className="home-block faq">
        <p className="home-eyebrow">Questions</p>
        <h2>Good to know</h2>
        <div className="faq-list">
          {FAQS.map((item) => (
            <details key={item.question} className="faq-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </Reveal>

      <Reveal className="closing">
        <h2>Ready when you are.</h2>
        <p>Your next night out, ride and meal are a few taps away.</p>
        <div className="closing-actions">
          <Link to="/events" className="home-btn home-btn-light">Browse Passly</Link>
          <Link to={isVendor ? '/dashboard' : '/become-vendor'} className="home-btn home-btn-outline">
            {isVendor ? 'Open your dashboard' : 'Become a vendor'}
          </Link>
        </div>
      </Reveal>
    </div>
  );
};

export default Home;