import Event from '../models/Event.js';
import Booking from '../models/Booking.js';

const EVENT_FIELDS = ['title', 'description', 'date', 'venue', 'category', 'images', 'status'];
const STATUSES = ['published', 'draft'];

const pick = (source, fields) =>
  fields.reduce((result, field) => {
    if (source[field] !== undefined) result[field] = source[field];
    return result;
  }, {});

const mergeTicketTypes = (existing, incoming) => {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return { error: 'Add at least one ticket type' };
  }

  const result = [];

  for (const ticket of incoming) {
    const name = String(ticket.name || '').trim();
    const price = Number(ticket.price);
    const capacity = Number(ticket.capacity);

    if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(capacity) || capacity < 1) {
      return { error: 'Each ticket type needs a name, a price and a capacity of at least 1' };
    }

    if (ticket._id) {
      const current = existing.find((item) => item._id.toString() === String(ticket._id));
      if (!current) {
        return { error: 'One of the ticket types could not be found' };
      }
      const sold = current.sold || 0;
      if (capacity < sold) {
        return { error: `${current.name} already has ${sold} sold, so its capacity cannot be lower than that` };
      }
      result.push({ _id: current._id, name, price, capacity, sold });
    } else {
      result.push({ name, price, capacity, sold: 0 });
    }
  }

  const keptIds = new Set(result.filter((item) => item._id).map((item) => item._id.toString()));
  const removedWithSales = existing.find(
    (item) => !keptIds.has(item._id.toString()) && (item.sold || 0) > 0
  );
  if (removedWithSales) {
    return { error: `${removedWithSales.name} has sold tickets and cannot be removed` };
  }

  return { ticketTypes: result };
};

export const getEvents = async (req, res) => {
  try {
    const { category, sort } = req.query;

    let filter = { status: 'published' };
    if (category) {
      filter.category = category;
    }

    let query = Event.find(filter);

    if (sort === 'date') {
      query = query.sort({ date: 1 });
    } else if (sort === 'newest') {
      query = query.sort({ createdAt: -1 });
    }

    const events = await query;
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ vendorId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const data = pick(req.body, EVENT_FIELDS);

    if (data.status && !STATUSES.includes(data.status)) {
      return res.status(400).json({ message: 'Status must be published or draft' });
    }

    const merged = mergeTicketTypes([], req.body.ticketTypes);
    if (merged.error) {
      return res.status(400).json({ message: merged.error });
    }

    const event = await Event.create({
      ...data,
      ticketTypes: merged.ticketTypes,
      vendorId: req.user.id,
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.vendorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this event' });
    }

    const updates = pick(req.body, EVENT_FIELDS);

    if (updates.status && !STATUSES.includes(updates.status)) {
      return res.status(400).json({ message: 'Status must be published or draft' });
    }

    if (req.body.ticketTypes !== undefined) {
      const merged = mergeTicketTypes(event.ticketTypes, req.body.ticketTypes);
      if (merged.error) {
        return res.status(400).json({ message: merged.error });
      }
      event.ticketTypes = merged.ticketTypes;
    }

    event.set(updates);
    await event.save();

    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.vendorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    const activeBookings = await Booking.countDocuments({
      'items.refId': event._id,
      status: { $in: ['paid', 'pending'] },
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        message: `This event has ${activeBookings} active booking${activeBookings === 1 ? '' : 's'}, so it cannot be deleted. Move it to draft to hide it instead.`,
      });
    }

    await event.deleteOne();
    res.status(200).json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};