import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import './Cart.css';

const API_URL = import.meta.env.VITE_API_URL;

const Checkout = () => {
  const { items, total, clearCart } = useContext(CartContext);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [fulfillment, setFulfillment] = useState('pickup');
  const [address, setAddress] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const handlePlaceOrder = async () => {
    if (fulfillment === 'delivery' && !address.trim()) {
      setError('Please enter a delivery address');
      return;
    }

    setPlacing(true);
    setError('');

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
          address: fulfillment === 'delivery' ? address : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to place order');
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
      <div className="container checkout-page">
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="container checkout-page">
      <h1>Checkout</h1>

      <div className="checkout-summary">
        {items.map((item) => (
          <div key={item.menuItemId} className="checkout-summary-row">
            <span>{item.qty}x {item.name}</span>
            <span>₦{(item.price * item.qty).toLocaleString()}</span>
          </div>
        ))}
        <div className="checkout-summary-row" style={{ fontWeight: 600, marginTop: 8 }}>
          <span>Total</span>
          <span>₦{total.toLocaleString()}</span>
        </div>
      </div>

      <h3>Delivery or Pickup?</h3>
      <div className="checkout-fulfillment">
        <label>
          <input
            type="radio"
            value="pickup"
            checked={fulfillment === 'pickup'}
            onChange={(e) => setFulfillment(e.target.value)}
          />
          Pickup
        </label>
        <label>
          <input
            type="radio"
            value="delivery"
            checked={fulfillment === 'delivery'}
            onChange={(e) => setFulfillment(e.target.value)}
          />
          Delivery
        </label>
      </div>

      {fulfillment === 'delivery' && (
        <div className="checkout-address">
          <label>Delivery Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your address"
          />
        </div>
      )}

      {error && <p style={{ color: 'var(--color-error)' }}>{error}</p>}

      <button className="checkout-pay-btn" onClick={handlePlaceOrder} disabled={placing}>
        {placing ? 'Placing order...' : 'Pay'}
      </button>
    </div>
  );
};

export default Checkout;