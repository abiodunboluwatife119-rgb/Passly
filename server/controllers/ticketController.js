import Ticket from '../models/Ticket.js';

export const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getTicketByCode = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ code: req.params.code });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }

    res.status(200).json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const verifyTicket = async (req, res) => {
  try {
    const { code } = req.body;

    const ticket = await Ticket.findOne({ code });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found', status: 'NOT_FOUND' });
    }

    if (ticket.status === 'used') {
      return res.status(200).json({ message: 'Ticket already used', status: 'USED', ticket });
    }

    if (ticket.status === 'cancelled') {
      return res.status(200).json({ message: 'Ticket is cancelled', status: 'CANCELLED', ticket });
    }

    ticket.status = 'used';
    ticket.usedAt = new Date();
    await ticket.save();

    res.status(200).json({ message: 'Ticket verified', status: 'VALID', ticket });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
