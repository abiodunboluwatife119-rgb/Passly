import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './Cart.css';

const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;

const Cart = () => {
  const { items, removeFromCart, updateQty, total } = useContext(CartContext);
  const navigate = useNavigate();
  const [updatingItem, setUpdatingItem] = useState(null);
  const [openingCheckout, setOpeningCheckout] = useState(false);

  const handleUpdateQty = (itemId, nextQty) => {
    setUpdatingItem(itemId);
    setTimeout(() => {
      updateQty(itemId, nextQty);
      setUpdatingItem(null);
    }, 600);
  };

  const handleRemove = (itemId) => {
    setUpdatingItem(itemId);
    setTimeout(() => {
      removeFromCart(itemId);
      setUpdatingItem(null);
    }, 600);
  };

  const handleCheckout = () => {
    setOpeningCheckout(true);
    setTimeout(() => navigate('/checkout'), 300);
  };

  if (items.length === 0) {
    return (
      <div className="container bag-page">
        <div className="bag-empty">
          <div className="bag-empty-mark" aria-hidden="true">🍽</div>
          <h1>Your cart is empty</h1>
          <p>Browse restaurants and add a few dishes to get started.</p>
          <Link to="/restaurants" className="bag-empty-link">Browse restaurants</Link>
        </div>
      </div>
    );
  }

  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);
  const restaurantName = items[0].restaurantName;

  return (
    <div className="container bag-page">
      <header className="bag-header">
        <h1>Your cart</h1>
        <p>
          {itemCount} item{itemCount > 1 ? 's' : ''} from <strong>{restaurantName}</strong>
        </p>
      </header>

      <div className="bag-layout">
        <ul className="bag-list">
          {items.map((item) => (
            <li key={item.menuItemId} className="bag-item bag-item-card">
              {item.image ? (
                <img src={item.image} alt="" className="bag-item-image" />
              ) : (
                <div className="bag-item-image bag-item-image-empty" aria-hidden="true">
                  {item.name.charAt(0)}
                </div>
              )}

              <div className="bag-item-main">
                <div className="bag-item-top">
                  <h3>{item.name}</h3>
                  <span className="bag-item-line">{naira(item.price * item.qty)}</span>
                </div>
                <p className="bag-item-unit">{naira(item.price)} each</p>

                <div className="bag-item-bottom">
                  <div className="bag-stepper">
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(item.menuItemId, item.qty - 1)}
                      disabled={item.qty <= 1}
                      aria-label={`Decrease ${item.name}`}
                    >
                      −
                    </button>
                    <span aria-live="polite">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(item.menuItemId, item.qty + 1)}
                      aria-label={`Increase ${item.name}`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="bag-remove"
                    onClick={() => handleRemove(item.menuItemId)}
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="bag-summary bag-summary-card">
          <h3>Order summary</h3>
          {updatingItem && (
            <p role="status" aria-live="polite">Updating cart...</p>
          )}

          <div className="bag-summary-row">
            <span>Items ({itemCount})</span>
            <span>{naira(total)}</span>
          </div>
          <p className="bag-summary-note">
            You'll choose pickup or delivery on the next step.
          </p>

          <div className="bag-summary-total">
            <span>Total</span>
            <span>{naira(total)}</span>
          </div>

          <button
            type="button"
            className="bag-checkout"
            onClick={handleCheckout}
            disabled={openingCheckout || !!updatingItem}
            aria-busy={openingCheckout}
            aria-live="polite"
          >
            {openingCheckout ? 'Opening checkout...' : 'Proceed to checkout'}
          </button>

          <Link to="/restaurants" className="bag-continue">Continue browsing</Link>
        </aside>
      </div>
    </div>
  );
};

export default Cart;