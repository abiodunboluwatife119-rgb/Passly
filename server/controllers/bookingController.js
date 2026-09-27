import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import Car from '../models/Car.js';
import MenuItem from '../models/MenuItem.js';

// @route  POST /api/bookings
// @access Protected
export const createBooking = async (req, res) => {
  try {
    const { type, items, fulfillment, address } = req.body;

    if (!type || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing booking type or items' });
    }

    if (type === 'event') {
      const item = items[0];
      const event = await Event.findById(item.refId);

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      const ticketType = event.ticketTypes.id(item.ticketTypeId);
      if (!ticketType) {
        return res.status(404).json({ message: 'Ticket type not found' });
      }

      const available = ticketType.capacity - ticketType.sold;
      if (item.qty > available) {
        return res.status(400).json({ message: `Only ${available} tickets left for ${ticketType.name}` });
      }

      const totalAmount = ticketType.price * item.qty;

      const booking = await Booking.create({
        userId: req.user.id,
        type: 'event',
        items: [
          {
            refId: event._id,
            name: `${event.title} — ${ticketType.name}`,
            qty: item.qty,
            unitPrice: ticketType.price,
            meta: { ticketTypeId: ticketType._id, ticketTypeName: ticketType.name },
          },
        ],
        totalAmount,
        status: 'pending',
      });

      return res.status(201).json(booking);
    }

    if (type === 'car') {
      const item = items[0];
      const car = await Car.findById(item.refId);

      if (!car) {
        return res.status(404).json({ message: 'Car not found' });
      }

      if (!car.available) {
        return res.status(400).json({ message: 'Car is not available' });
      }

      const { pickupDate, returnDate } = item.meta || {};
      if (!pickupDate || !returnDate) {
        return res.status(400).json({ message: 'Pickup and return dates are required' });
      }

      const days = Math.ceil(
        (new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)
      );

      if (days <= 0) {
        return res.status(400).json({ message: 'Return date must be after pickup date' });
      }

      const totalAmount = car.pricePerDay * days;

      const booking = await Booking.create({
        userId: req.user.id,
        type: 'car',
        items: [
          {
            refId: car._id,
            name: `${car.make} ${car.model} (${days} day${days > 1 ? 's' : ''})`,
            qty: days,
            unitPrice: car.pricePerDay,
            meta: { pickupDate, returnDate },
          },
        ],
        totalAmount,
        status: 'pending',
      });

      return res.status(201).json(booking);
    }

    if (type === 'food') {
      if (!fulfillment) {
        return res.status(400).json({ message: 'Fulfillment method is required' });
      }
      if (fulfillment === 'delivery' && !address) {
        return res.status(400).json({ message: 'Delivery address is required' });
      }

      let totalAmount = 0;
      const validatedItems = [];

      for (const item of items) {
        const menuItem = await MenuItem.findById(item.refId);
        if (!menuItem) {
          return res.status(404).json({ message: `Menu item not found: ${item.refId}` });
        }
        if (!menuItem.available) {
          return res.status(400).json({ message: `${menuItem.name} is currently unavailable` });
        }

        const lineTotal = menuItem.price * item.qty;
        totalAmount += lineTotal;

        validatedItems.push({
          refId: menuItem._id,
          name: menuItem.name,
          qty: item.qty,
          unitPrice: menuItem.price,
        });
      }

      const booking = await Booking.create({
        userId: req.user.id,
        type: 'food',
        items: validatedItems,
        totalAmount,
        status: 'pending',
        fulfillment,
        address: fulfillment === 'delivery' ? address : undefined,
      });

      return res.status(201).json(booking);
    }

    return res.status(400).json({ message: `Booking type "${type}" not yet supported` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route  GET /api/bookings/me
// @access Protected
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route  GET /api/bookings/:id
// @access Protected
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.status(200).json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route  PATCH /api/bookings/:id/cancel
// @access Protected
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};