import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import './Cart.css';

const API_URL = import.meta.env.VITE_API_URL;

const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;

const Checkout = () => {
  const { items, total, clearCart } = useContext(CartContext);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [fulfillment, setFulfillment] = useState('pickup');
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const handlePlaceOrder = async () => {
    if (fulfillment === 'delivery' && !address.trim()) {
      setAddressError('Please enter the address we should deliver to.');
      return;
    }

    setPlacing(true);
    setError('');
    setAddressError('');

    try {
      const bookingItems = items.map((item) => ({
        refId: item.menuItemId,
        name: item.name,
        qty: item.qty,
        unitPrice: item.price,
      }));

      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'food',
          items: bookingItems,
          fulfillment,
          address: fulfillment === 'delivery' ? address.trim() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'We could not place your order. Please try again.');
      }

      clearCart();
      navigate('/bookings');
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container bag-page checkout-page">
        <div className="bag-empty">
          <div className="bag-empty-mark" aria-hidden="true">🍽</div>
          <h1>Nothing to check out</h1>
          <p>Your cart is empty. Add a few dishes first.</p>
          <Link to="/restaurants" className="bag-empty-link">Browse restaurants</Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="container bag-page checkout-page">
        <div className="bag-empty">
          <div className="bag-empty-mark" aria-hidden="true">🔒</div>
          <h1>Log in to place your order</h1>
          <p>Your cart will be waiting for you when you come back.</p>
          <Link to="/login" className="bag-empty-link">Log in</Link>
        </div>
      </div>
    );
  }

  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);
  const restaurantName = items[0].restaurantName;

  return (
    <div className="container bag-page checkout-page">
      <header className="bag-header">
        <Link to="/cart" className="detail-back checkout-back">← Back to cart</Link>
        <h1>Checkout</h1>
        <p>
          Ordering from <strong>{restaurantName}</strong>
        </p>
      </header>

      <div className="bag-layout">
        <div className="checkout-main">
          <section className="checkout-section">
            <h2>How would you like your order?</h2>

            <div className="fulfil-options" role="radiogroup" aria-label="Pickup or delivery">
              <label className={`fulfil-option ${fulfillment === 'pickup' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="fulfillment"
                  value="pickup"
                  className="fulfil-radio"
                  checked={fulfillment === 'pickup'}
                  onChange={(e) => setFulfillment(e.target.value)}
                />
                <span className="fulfil-body">
                  <span className="fulfil-title">Pickup</span>
                  <span className="fulfil-desc">Collect your order from {restaurantName}.</span>
                </span>
              </label>

              <label className={`fulfil-option ${fulfillment === 'delivery' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="fulfillment"
                  value="delivery"
                  className="fulfil-radio"
                  checked={fulfillment === 'delivery'}
                  onChange={(e) => setFulfillment(e.target.value)}
                />
                <span className="fulfil-body">
                  <span className="fulfil-title">Delivery</span>
                  <span className="fulfil-desc">Have it brought to your address.</span>
                </span>
              </label>
            </div>
          </section>

          {fulfillment === 'delivery' && (
            <section className="checkout-section">
              <h2>Delivery address</h2>
              <div className="checkout-field">
                <label htmlFor="address">Street address</label>
                <input
                  id="address"
                  type="text"
                  autoComplete="street-address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setAddressError('');
                  }}
                  placeholder="House number, street, area"
                  aria-invalid={!!addressError}
                  aria-describedby={addressError ? 'address-error' : undefined}
                />
                {addressError && (
                  <p id="address-error" className="checkout-field-error" role="alert">
                    {addressError}
                  </p>
                )}
              </div>
            </section>
          )}

          <section className="checkout-section">
            <h2>Payment</h2>
            <p className="checkout-payment-note">
              Placing your order reserves it. You'll confirm payment from My Bookings right after.
            </p>
          </section>
        </div>

        <aside className="bag-summary checkout-summary">
          <h3>Order summary</h3>

          <ul className="checkout-lines">
            {items.map((item) => (
              <li key={item.menuItemId}>
                <span>{item.qty} × {item.name}</span>
                <span>{naira(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="bag-summary-total">
            <span>Total</span>
            <span>{naira(total)}</span>
          </div>

          {error && <p className="checkout-error" role="alert">{error}</p>}

          <button
            type="button"
            className="bag-checkout"
            onClick={handlePlaceOrder}
            disabled={placing}
            aria-busy={placing}
            aria-live="polite"
          >
            {placing ? 'Processing order...' : `Place order · ${naira(total)}`}
          </button>

          <Link to="/cart" className="bag-continue">
            Edit cart ({itemCount} item{itemCount > 1 ? 's' : ''})
          </Link>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
