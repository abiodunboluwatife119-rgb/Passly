import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';

export const getRestaurants = async (req, res) => {
  try {
    const { cuisine } = req.query;
    let filter = {};
    if (cuisine) {
      filter.cuisine = cuisine;
    }
    const restaurants = await Restaurant.find(filter);
    res.status(200).json(restaurants);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getMyRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ vendorId: req.user.id }).sort({ createdAt: -1 });
    const withMenus = await Promise.all(
      restaurants.map(async (restaurant) => {
        const menuItems = await MenuItem.find({ restaurantId: restaurant._id });
        return { ...restaurant.toObject(), menuItems };
      })
    );
    res.status(200).json(withMenus);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    const menuItems = await MenuItem.find({ restaurantId: restaurant._id, available: true });
    res.status(200).json({ ...restaurant.toObject(), menuItems });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const createRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.create({
      ...req.body,
      vendorId: req.user.id,
    });
    res.status(201).json(restaurant);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const addMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.vendorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to add items to this restaurant' });
    }
    const menuItem = await MenuItem.create({
      ...req.body,
      restaurantId: restaurant._id,
    });
    res.status(201).json(menuItem);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    const restaurant = await Restaurant.findById(menuItem.restaurantId);
    if (restaurant.vendorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this menu item' });
    }
    const updated = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    const restaurant = await Restaurant.findById(menuItem.restaurantId);
    if (restaurant.vendorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this menu item' });
    }
    await menuItem.deleteOne();
    res.status(200).json({ message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const searchMenuItems = async (req, res) => {
  try {
    const { search } = req.query;
    if (!search || !search.trim()) {
      return res.status(400).json({ message: 'A search term is required' });
    }
    const items = await MenuItem.find({
      name: { $regex: search.trim(), $options: 'i' },
      available: true,
    }).populate('restaurantId', 'name cuisine location');
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};