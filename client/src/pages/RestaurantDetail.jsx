import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './Detail.css';

const API_URL = import.meta.env.VITE_API_URL;

const RestaurantDetail = () => {
  const { id } = useParams();
  const { items, addToCart, clearCart } = useContext(CartContext);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await fetch(`${API_URL}/restaurants/${id}`);
        if (!res.ok) throw new Error('Restaurant not found');
        const data = await res.json();
        setRestaurant(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [id]);

  const handleAddToCart = (menuItem) => {
    const cartHasOtherRestaurant =
      items.length > 0 && items[0].restaurantId !== restaurant._id;

    if (cartHasOtherRestaurant) {
      const confirmed = window.confirm(
        `Your cart has items from ${items[0].restaurantName}. Adding this will clear your current cart. Continue?`
      );
      if (!confirmed) return;
      clearCart();
    }

    addToCart(menuItem, restaurant._id, restaurant.name);
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (error) return <div className="container"><p>{error}</p></div>;

  return (
    <div className="container">
      <div className="detail-layout">
        <div>
          {restaurant.images?.[0] && (
            <div className="detail-image">
              <img src={restaurant.images[0]} alt={restaurant.name} />
            </div>
          )}
          <div className="detail-info">
            <h1>{restaurant.name}</h1>
            <p>{restaurant.cuisine} — {restaurant.location}</p>
          </div>
        </div>

        <div className="booking-box">
          <h3>Menu</h3>
          {restaurant.menuItems.length === 0 ? (
            <p>No menu items yet.</p>
          ) : (
            <div className="menu-list">
              {restaurant.menuItems.map((item) => (
                <div key={item._id} className="menu-item">
                  {item.image && <img src={item.image} alt={item.name} />}
                  <div className="menu-item-info">
                    <h4>{item.name}</h4>
                    <p>₦{item.price.toLocaleString()}</p>
                  </div>
                  <button onClick={() => handleAddToCart(item)}>Add</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;