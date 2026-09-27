import Car from '../models/Car.js';

export const getCars = async (req, res) => {
  try {
    const { location, type, sort } = req.query;

    let filter = { available: true };
    if (location) {
      filter.location = location;
    }
    if (type) {
      filter.transmission = type;
    }

    let query = Car.find(filter);

    if (sort === 'price') {
      query = query.sort({ pricePerDay: 1 });
    } else if (sort === 'newest') {
      query = query.sort({ createdAt: -1 });
    }

    const cars = await query;
    res.status(200).json(cars);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getMyCars = async (req, res) => {
  try {
    const cars = await Car.find({ vendorId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(cars);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.status(200).json(car);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const createCar = async (req, res) => {
  try {
    const car = await Car.create({
      ...req.body,
      vendorId: req.user.id,
    });
    res.status(201).json(car);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const updateCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car.vendorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this car' });
    }

    const updatedCar = await Car.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedCar);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car.vendorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this car' });
    }

    await car.deleteOne();
    res.status(200).json({ message: 'Car deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};