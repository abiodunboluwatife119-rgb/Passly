import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './Detail.css';

const API_URL = import.meta.env.VITE_API_URL;

const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;
const cartItemId = (i) => i.menuItemId ?? i._id ?? i.id;
const cartItemQty = (i) => i.qty ?? i.quantity ?? 1;
const cartItemPrice = (i) => i.price ?? 0;

const DetailSkeleton = () => (
  <div className="container">
    <p role="status" aria-live="polite">Fetching details...</p>
    <div className="detail-layout" aria-busy="true" aria-label="Fetching details">
      <div>
        <div className="skeleton skeleton-image" />
        <div className="skeleton skeleton-line skeleton-title" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />
      </div>
      <div className="skeleton skeleton-box" />
    </div>
  </div>
);

const RestaurantDetail = () => {
  const { id } = useParams();
  const { items, addToCart, clearCart } = useContext(CartContext);

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pendingItem, setPendingItem] = useState(null);
  const [justAddedId, setJustAddedId] = useState(null);
  const addedTimer = useRef(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/restaurants/${id}`);
        if (!res.ok) throw new Error('We could not find that restaurant.');
        const data = await res.json();
        setRestaurant(data);
      } catch (err) {
        setError(err.message || 'Something went wrong. Please try again.');
      } finally {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [id]);

  useEffect(() => {
    if (restaurant) document.title = `${restaurant.name} · Passly`;
    return () => {
      document.title = 'Passly';
    };
  }, [restaurant]);

  useEffect(() => {
    if (!pendingItem) return;
    const onKey = (e) => e.key === 'Escape' && setPendingItem(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingItem]);

  useEffect(() => () => clearTimeout(addedTimer.current), []);

  const flashAdded = (menuItemId) => {
    setJustAddedId(menuItemId);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setJustAddedId(null), 1200);
  };

  const doAdd = (menuItem) => {
    addToCart(menuItem, restaurant._id, restaurant.name);
    flashAdded(menuItem._id);
  };

  const handleAdd = (menuItem) => {
    const cartHasOtherRestaurant =
      items.length > 0 && items[0].restaurantId !== restaurant._id;
    if (cartHasOtherRestaurant) {
      setPendingItem(menuItem);
      return;
    }
    doAdd(menuItem);
  };

  const confirmSwitch = () => {
    clearCart();
    doAdd(pendingItem);
    setPendingItem(null);
  };

  const qtyInCart = (menuItem) => {
    const match = items.find((i) => cartItemId(i) === menuItem._id);
    return match ? cartItemQty(match) : 0;
  };

  const cartCount = items.reduce((sum, i) => sum + cartItemQty(i), 0);
  const cartTotal = items.reduce((sum, i) => sum + cartItemPrice(i) * cartItemQty(i), 0);
  const cartIsHere = items.length > 0 && items[0].restaurantId === restaurant?._id;

  if (loading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="container">
        <div className="detail-state">
          <h2>Restaurant unavailable</h2>
          <p>{error}</p>
          <Link to="/restaurants" className="detail-state-link">Back to restaurants</Link>
        </div>
      </div>
    );
  }

  const menuItems = restaurant.menuItems || [];

  return (
    <div className="container">
      <Link to="/restaurants" className="detail-back">← All restaurants</Link>

      <div className="detail-layout">
        <div>
          {restaurant.images?.[0] ? (
            <div className="detail-image">
              <img src={restaurant.images[0]} alt={restaurant.name} />
            </div>
          ) : (
            <div className="detail-image detail-image-placeholder" aria-hidden="true">
              <span>{restaurant.name.charAt(0)}</span>
            </div>
          )}

          <div className="detail-info">
            <div className="detail-badges">
              {restaurant.cuisine && <span className="detail-badge">{restaurant.cuisine}</span>}
            </div>
            <h1>{restaurant.name}</h1>

            {restaurant.location && (
              <div className="detail-meta">
                <div className="detail-meta-row">
                  <span className="detail-meta-label">Location</span>
                  <span>{restaurant.location}</span>
                </div>
              </div>
            )}

            {restaurant.description && (
              <p className="detail-description">{restaurant.description}</p>
            )}
          </div>

          <section className="menu-section" aria-labelledby="menu-title">
            <div className="menu-section-head">
              <h2 id="menu-title">Menu</h2>
              {menuItems.length > 0 && (
                <span>{menuItems.length} dish{menuItems.length > 1 ? 'es' : ''}</span>
              )}
            </div>

            {menuItems.length === 0 ? (
              <div className="menu-empty">
                <p>This restaurant hasn't added any dishes yet.</p>
                <Link to="/restaurants">Browse other restaurants</Link>
              </div>
            ) : (
              <ul className="dish-list">
                {menuItems.map((item) => {
                  const inCart = qtyInCart(item);
                  const added = justAddedId === item._id;
                  return (
                    <li key={item._id} className="dish">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="dish-image" />
                      ) : (
                        <div className="dish-image dish-image-empty" aria-hidden="true">
                          {item.name.charAt(0)}
                        </div>
                      )}
                      <div className="dish-info">
                        <h3>{item.name}</h3>
                        {item.description && <p className="dish-desc">{item.description}</p>}
                        <span className="dish-price">{naira(item.price)}</span>
                      </div>
                      <div className="dish-actions">
                        {inCart > 0 && <span className="dish-incart">{inCart} in cart</span>}
                        <button
                          type="button"
                          className={`dish-add ${added ? 'added' : ''}`}
                          onClick={() => handleAdd(item)}
                          aria-label={`Add ${item.name} to cart`}
                        >
                          {added ? 'Added ✓' : 'Add'}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="booking-box">
          <h3>Your order</h3>

          {cartCount === 0 ? (
            <p className="order-empty">
              Your cart is empty. Add dishes from the menu and they'll appear here.
            </p>
          ) : (
            <>
              {!cartIsHere && (
                <p className="order-note">
                  Your cart has items from <strong>{items[0].restaurantName}</strong>.
                </p>
              )}
              <ul className="order-lines">
                {items.map((i) => (
                  <li key={cartItemId(i)}>
                    <span>{cartItemQty(i)} × {i.name}</span>
                    <span>{naira(cartItemPrice(i) * cartItemQty(i))}</span>
                  </li>
                ))}
              </ul>
              <div className="booking-summary">
                <span>Subtotal</span>
                <span className="booking-total">{naira(cartTotal)}</span>
              </div>
              <Link to="/cart" className="booking-submit order-cta">View cart</Link>
            </>
          )}
        </aside>
      </div>

      {cartCount > 0 && (
        <>
          <div className="cart-bar-spacer" />
          <Link to="/cart" className="cart-bar">
            <span>{cartCount} item{cartCount > 1 ? 's' : ''} · {naira(cartTotal)}</span>
            <span>View cart →</span>
          </Link>
        </>
      )}

      {pendingItem && (
        <div className="modal-backdrop" onClick={() => setPendingItem(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="switch-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="switch-title">Start a new order?</h3>
            <p>
              Your cart has items from <strong>{items[0].restaurantName}</strong>. You can only
              order from one restaurant at a time, so adding this dish will clear your current cart.
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-btn" onClick={() => setPendingItem(null)} autoFocus>
                Keep my cart
              </button>
              <button type="button" className="modal-btn modal-btn-primary" onClick={confirmSwitch}>
                Clear and add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetail;