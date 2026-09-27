import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './Cart.css';

const Cart = () => {
  const { items, removeFromCart, updateQty, total } = useContext(CartContext);
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container cart-page">
        <h1>Your Cart</h1>
        <div className="cart-empty">
          <p>Your cart is empty.</p>
          <Link to="/restaurants">Browse restaurants</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <h1>Your Cart</h1>
      <p className="cart-restaurant-label">From: {items[0].restaurantName}</p>

      {items.map((item) => (
        <div key={item.menuItemId} className="cart-item">
          <div>
            <p className="cart-item-name">{item.name}</p>
            <p className="cart-item-price">₦{item.price.toLocaleString()} each</p>
          </div>
          <div className="cart-item-controls">
            <button onClick={() => updateQty(item.menuItemId, item.qty - 1)}>-</button>
            <span>{item.qty}</span>
            <button onClick={() => updateQty(item.menuItemId, item.qty + 1)}>+</button>
            <button className="cart-item-remove" onClick={() => removeFromCart(item.menuItemId)}>
              Remove
            </button>
          </div>
        </div>
      ))}

      <div className="cart-total">
        <span>Total</span>
        <span>₦{total.toLocaleString()}</span>
      </div>

      <button className="cart-checkout-btn" onClick={() => navigate('/checkout')}>
        Proceed to Checkout
      </button>
    </div>
  );
};

export default Cart;