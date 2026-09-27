import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL;

const MyRestaurants = () => {
  const { token } = useContext(AuthContext);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [menuForms, setMenuForms] = useState({});

  const fetchMyRestaurants = async () => {
    try {
      const res = await fetch(`${API_URL}/restaurants/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load your restaurants');
      const data = await res.json();
      setRestaurants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRestaurants();
  }, [token]);

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      let imageUrl = '';

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const uploadRes = await fetch(`${API_URL}/uploads/image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!uploadRes.ok) throw new Error('Image upload failed');
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const res = await fetch(`${API_URL}/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          cuisine,
          location,
          images: imageUrl ? [imageUrl] : [],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create restaurant');
      }

      setName('');
      setCuisine('');
      setLocation('');
      setImageFile(null);
      setShowForm(false);
      fetchMyRestaurants();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMenuForm = (restaurantId) => {
    setMenuForms((prev) => ({
      ...prev,
      [restaurantId]: prev[restaurantId]
        ? null
        : { name: '', price: '', imageFile: null, submitting: false, error: '' },
    }));
  };

  const updateMenuFormField = (restaurantId, field, value) => {
    setMenuForms((prev) => ({
      ...prev,
      [restaurantId]: { ...prev[restaurantId], [field]: value },
    }));
  };

  const handleAddMenuItem = async (e, restaurantId) => {
    e.preventDefault();
    const form = menuForms[restaurantId];

    updateMenuFormField(restaurantId, 'submitting', true);
    updateMenuFormField(restaurantId, 'error', '');

    try {
      let imageUrl = '';

      if (form.imageFile) {
        const formData = new FormData();
        formData.append('image', form.imageFile);

        const uploadRes = await fetch(`${API_URL}/uploads/image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!uploadRes.ok) throw new Error('Image upload failed');
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const res = await fetch(`${API_URL}/restaurants/${restaurantId}/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          price: Number(form.price),
          image: imageUrl || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to add menu item');
      }

      setMenuForms((prev) => ({ ...prev, [restaurantId]: null }));
      fetchMyRestaurants();
    } catch (err) {
      updateMenuFormField(restaurantId, 'error', err.message);
      updateMenuFormField(restaurantId, 'submitting', false);
    }
  };

  if (loading) return <div className="container"><p>Loading your restaurants...</p></div>;
  if (error) return <div className="container"><p>{error}</p></div>;

  return (
    <div className="container dashboard-page">
      <h1>My Restaurants</h1>

      <button className="dashboard-toggle-btn" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Add New Restaurant'}
      </button>

      {showForm && (
        <form className="dashboard-form" onSubmit={handleCreateRestaurant}>
          {formError && <p style={{ color: 'var(--color-error)' }}>{formError}</p>}

          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />

          <label>Cuisine</label>
          <input value={cuisine} onChange={(e) => setCuisine(e.target.value)} required />

          <label>Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} required />

          <label>Photo</label>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />

          <button className="dashboard-submit-btn" type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Restaurant'}
          </button>
        </form>
      )}

      {restaurants.length === 0 ? (
        <p>You haven't added any restaurants yet.</p>
      ) : (
        <div className="dashboard-item-grid">
          {restaurants.map((restaurant) => (
            <div key={restaurant._id} className="dashboard-item-card">
              {restaurant.images?.[0] && (
                <img src={restaurant.images[0]} alt={restaurant.name} />
              )}
              <div className="dashboard-item-body">
                <h3>{restaurant.name}</h3>
                <p>{restaurant.cuisine} — {restaurant.location}</p>

                {restaurant.menuItems.length > 0 && (
                  <div className="dashboard-menu-list">
                    {restaurant.menuItems.map((item) => (
                      <div key={item._id} className="dashboard-menu-item">
                        {item.image && <img src={item.image} alt={item.name} />}
                        <span>{item.name} — ₦{item.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  className="dashboard-menu-form-btn"
                  onClick={() => toggleMenuForm(restaurant._id)}
                >
                  {menuForms[restaurant._id] ? 'Cancel' : '+ Add Menu Item'}
                </button>

                {menuForms[restaurant._id] && (
                  <form
                    className="dashboard-mini-form"
                    onSubmit={(e) => handleAddMenuItem(e, restaurant._id)}
                  >
                    {menuForms[restaurant._id].error && (
                      <p style={{ color: 'var(--color-error)', fontSize: '0.82rem' }}>
                        {menuForms[restaurant._id].error}
                      </p>
                    )}
                    <input
                      placeholder="Item name"
                      value={menuForms[restaurant._id].name}
                      onChange={(e) => updateMenuFormField(restaurant._id, 'name', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={menuForms[restaurant._id].price}
                      onChange={(e) => updateMenuFormField(restaurant._id, 'price', e.target.value)}
                      required
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        updateMenuFormField(restaurant._id, 'imageFile', e.target.files[0])
                      }
                    />
                    <button
                      className="dashboard-submit-btn"
                      type="submit"
                      disabled={menuForms[restaurant._id].submitting}
                    >
                      {menuForms[restaurant._id].submitting ? 'Adding...' : 'Add Item'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRestaurants;