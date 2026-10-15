import { Fragment, useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import './Dashboard.css';
import './Manage.css';

const API_URL = import.meta.env.VITE_API_URL;

const emptyForm = { name: '', cuisine: '', location: '', description: '' };

const MyRestaurants = () => {
  const { token } = useContext(AuthContext);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [currentImage, setCurrentImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [menuForms, setMenuForms] = useState({});
  const [itemEdits, setItemEdits] = useState({});

  const [actionError, setActionError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const formRef = useRef(null);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchMyRestaurants = async () => {
    try {
      const res = await fetch(`${API_URL}/restaurants/mine`, { headers: authHeaders });
      if (!res.ok) throw new Error('Failed to load your restaurants');
      const data = await res.json();
      setRestaurants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRestaurants();
  }, [token]);

  const setField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}/uploads/image`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });
    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    return data.url;
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setCurrentImage('');
    setImageFile(null);
    setFormError('');
    setFileKey((k) => k + 1);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setCurrentImage('');
    setImageFile(null);
    setFormError('');
    setFileKey((k) => k + 1);
    setShowForm(true);
  };

  const startEdit = (restaurant) => {
    setEditingId(restaurant._id);
    setForm({
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      location: restaurant.location,
      description: restaurant.description || '',
    });
    setCurrentImage(restaurant.images?.[0] || '');
    setImageFile(null);
    setFormError('');
    setActionError('');
    setFileKey((k) => k + 1);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleSaveRestaurant = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const imageUrl = imageFile ? await uploadImage(imageFile) : '';

      const payload = {
        name: form.name,
        cuisine: form.cuisine,
        location: form.location,
        description: form.description.trim(),
      };

      if (imageUrl) {
        payload.images = [imageUrl];
      } else if (!editingId) {
        payload.images = [];
      }

      const res = await fetch(
        editingId ? `${API_URL}/restaurants/${editingId}` : `${API_URL}/restaurants`,
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save restaurant');
      }

      closeForm();
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
    const menuForm = menuForms[restaurantId];

    updateMenuFormField(restaurantId, 'submitting', true);
    updateMenuFormField(restaurantId, 'error', '');

    try {
      const imageUrl = menuForm.imageFile ? await uploadImage(menuForm.imageFile) : '';

      const res = await fetch(`${API_URL}/restaurants/${restaurantId}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          name: menuForm.name,
          price: Number(menuForm.price),
          image: imageUrl || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to add menu item');
      }

      setMenuForms((prev) => ({ ...prev, [restaurantId]: null }));
      fetchMyRestaurants();
    } catch (err) {
      updateMenuFormField(restaurantId, 'error', err.message);
      updateMenuFormField(restaurantId, 'submitting', false);
    }
  };

  const startItemEdit = (item) => {
    setItemEdits((prev) => ({
      ...prev,
      [item._id]: {
        name: item.name,
        price: String(item.price),
        available: item.available !== false,
        imageFile: null,
        submitting: false,
        error: '',
      },
    }));
  };

  const updateItemEdit = (itemId, field, value) => {
    setItemEdits((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  const cancelItemEdit = (itemId) => {
    setItemEdits((prev) => ({ ...prev, [itemId]: null }));
  };

  const handleSaveItem = async (e, item) => {
    e.preventDefault();
    const edit = itemEdits[item._id];

    updateItemEdit(item._id, 'submitting', true);
    updateItemEdit(item._id, 'error', '');

    try {
      const imageUrl = edit.imageFile ? await uploadImage(edit.imageFile) : '';

      const payload = {
        name: edit.name,
        price: Number(edit.price),
        available: edit.available,
      };
      if (imageUrl) payload.image = imageUrl;

      const res = await fetch(`${API_URL}/menu/${item._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update menu item');
      }

      cancelItemEdit(item._id);
      fetchMyRestaurants();
    } catch (err) {
      updateItemEdit(item._id, 'error', err.message);
      updateItemEdit(item._id, 'submitting', false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setActionError('');
    try {
      const url =
        deleteTarget.kind === 'restaurant'
          ? `${API_URL}/restaurants/${deleteTarget.id}`
          : `${API_URL}/menu/${deleteTarget.id}`;

      const res = await fetch(url, { method: 'DELETE', headers: authHeaders });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Could not delete this item');
      }

      if (deleteTarget.kind === 'restaurant' && editingId === deleteTarget.id) closeForm();
      setDeleteTarget(null);
      await fetchMyRestaurants();
    } catch (err) {
      setActionError(err.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="container" role="status" aria-live="polite">
      <p>Fetching details...</p>
    </div>
  );
  if (error) return <div className="container"><p>{error}</p></div>;

  return (
    <div className="container dashboard-page">
      <header className="dashboard-management-header">
        <div>
          <p className="dashboard-eyebrow">RESTAURANT MANAGEMENT</p>
          <h1>My Restaurants</h1>
          <p>Update your restaurant details and keep your menu current.</p>
        </div>
        <span className="dashboard-listing-count">
          {restaurants.length} {restaurants.length === 1 ? 'restaurant' : 'restaurants'}
        </span>
      </header>

      {actionError && <p className="manage-error" role="alert">{actionError}</p>}

      <button className="dashboard-toggle-btn" onClick={showForm ? closeForm : openCreate}>
        {showForm ? 'Cancel' : '+ Add New Restaurant'}
      </button>

      {showForm && (
        <form className="dashboard-form" onSubmit={handleSaveRestaurant} ref={formRef}>
          <h2 className="form-title">{editingId ? 'Edit restaurant' : 'Add a new restaurant'}</h2>
          {formError && <p style={{ color: 'var(--color-error)' }}>{formError}</p>}

          <label>Name</label>
          <input value={form.name} onChange={setField('name')} required />

          <label>Cuisine</label>
          <input value={form.cuisine} onChange={setField('cuisine')} required />

          <label>Location</label>
          <input value={form.location} onChange={setField('location')} required />

          <label>Description (optional)</label>
          <textarea
            value={form.description}
            onChange={setField('description')}
            maxLength={1000}
            placeholder="What makes your restaurant special, opening hours, specialties"
          />

          <label>Photo</label>
          {currentImage && (
            <div className="form-photo">
              <img src={currentImage} alt="Current restaurant" />
              <span>Choose a new file below to replace this photo.</span>
            </div>
          )}
          <input
            key={fileKey}
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
          />

          <button className="dashboard-submit-btn" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : editingId ? 'Save changes' : 'Create Restaurant'}
          </button>
        </form>
      )}

      {restaurants.length === 0 ? (
        <div className="dashboard-listing-empty">
          <h2>No restaurants yet</h2>
          <p>Add your restaurant profile, then build its menu for Passly customers.</p>
        </div>
      ) : (
        <div className="dashboard-item-grid">
          {restaurants.map((restaurant) => (
            <article key={restaurant._id} className="dashboard-item-card restaurant-card">
              {restaurant.images?.[0] ? (
                <div className="restaurant-card-media">
                  <img src={restaurant.images[0]} alt={restaurant.name} />
                  <span className="restaurant-card-kicker">{restaurant.cuisine}</span>
                </div>
              ) : (
                <div className="restaurant-card-media restaurant-card-media-empty" aria-hidden="true">
                  <span>{restaurant.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="dashboard-item-body restaurant-card-body">
                <div className="restaurant-card-heading">
                  <div>
                    <p className="restaurant-card-eyebrow">{restaurant.cuisine}</p>
                    <h3>{restaurant.name}</h3>
                  </div>
                  <span className="restaurant-card-location">{restaurant.location}</span>
                </div>
                {restaurant.description && <p className="item-desc">{restaurant.description}</p>}
                <div className="restaurant-card-summary">
                  <span className="dashboard-status dashboard-status-neutral">
                    {restaurant.menuItems.length} {restaurant.menuItems.length === 1 ? 'menu item' : 'menu items'}
                  </span>
                  <span className="restaurant-card-summary-label">Menu</span>
                </div>

                {restaurant.menuItems.length > 0 && (
                  <div className="dashboard-menu-list restaurant-menu-list">
                    {restaurant.menuItems.map((item) => (
                      <Fragment key={item._id}>
                        <div className="dashboard-menu-item restaurant-menu-row">
                          {item.image ? (
                            <img className="restaurant-menu-thumb" src={item.image} alt="" />
                          ) : (
                            <span className="restaurant-menu-thumb restaurant-menu-thumb-empty" aria-hidden="true">
                              {item.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="menu-item-label restaurant-menu-copy">
                            <strong>{item.name}</strong>
                            <span className="restaurant-menu-price">₦{item.price.toLocaleString()}</span>
                            {item.available === false && (
                              <em className="menu-hidden-tag">Hidden</em>
                            )}
                          </span>
                          <span className="menu-item-actions">
                            <button
                              type="button"
                              className="link-btn"
                              onClick={() =>
                                itemEdits[item._id] ? cancelItemEdit(item._id) : startItemEdit(item)
                              }
                            >
                              {itemEdits[item._id] ? 'Close' : 'Edit'}
                            </button>
                            <button
                              type="button"
                              className="link-btn link-btn-danger"
                              onClick={() =>
                                setDeleteTarget({ kind: 'item', id: item._id, name: item.name })
                              }
                            >
                              Remove
                            </button>
                          </span>
                        </div>

                        {itemEdits[item._id] && (
                          <form className="item-edit" onSubmit={(e) => handleSaveItem(e, item)}>
                            {itemEdits[item._id].error && (
                              <p style={{ color: 'var(--color-error)', fontSize: '0.82rem' }}>
                                {itemEdits[item._id].error}
                              </p>
                            )}
                            <input
                              placeholder="Item name"
                              value={itemEdits[item._id].name}
                              onChange={(e) => updateItemEdit(item._id, 'name', e.target.value)}
                              required
                            />
                            <input
                              type="number"
                              placeholder="Price"
                              value={itemEdits[item._id].price}
                              onChange={(e) => updateItemEdit(item._id, 'price', e.target.value)}
                              required
                            />
                            <label className="checkbox-row">
                              <input
                                type="checkbox"
                                checked={itemEdits[item._id].available}
                                onChange={(e) =>
                                  updateItemEdit(item._id, 'available', e.target.checked)
                                }
                              />
                              Show on menu
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                updateItemEdit(item._id, 'imageFile', e.target.files[0])
                              }
                            />
                            <div className="item-edit-actions">
                              <button
                                className="dashboard-submit-btn"
                                type="submit"
                                disabled={itemEdits[item._id].submitting}
                              >
                                {itemEdits[item._id].submitting ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </form>
                        )}
                      </Fragment>
                    ))}
                  </div>
                )}

                <button
                  className="dashboard-menu-form-btn restaurant-add-menu-btn"
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

                <div className="manage-actions restaurant-card-actions">
                  <button type="button" className="manage-btn" onClick={() => startEdit(restaurant)}>
                    Edit restaurant
                  </button>
                  <button
                    type="button"
                    className="manage-btn manage-btn-danger"
                    onClick={() =>
                      setDeleteTarget({ kind: 'restaurant', id: restaurant._id, name: restaurant.name })
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={deleteTarget.kind === 'restaurant' ? 'Delete this restaurant?' : 'Remove this dish?'}
          message={
            deleteTarget.kind === 'restaurant'
              ? `${deleteTarget.name} and all of its menu items will be removed from Passly. Existing bookings are kept, but this restaurant will no longer count in your sales totals.`
              : `${deleteTarget.name} will be removed from the menu. Existing orders are kept.`
          }
          confirmLabel={deleteTarget.kind === 'restaurant' ? 'Delete' : 'Remove'}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default MyRestaurants;
