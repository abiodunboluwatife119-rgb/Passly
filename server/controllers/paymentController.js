import { customAlphabet} from "nanoid";
import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import Payment from '../models/Payment.js';
import Ticket from '../models/Ticket.js';

const generateCode = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
const generateReference = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 12);

export const mockSuccess = async (req, res) => {
    try{
        const {bookingId} = req.body;

        const booking = await Booking.findById(bookingId);

        if(!booking){
            return res.status(404).json({message: 'Booking not found'});
        }
        if (booking.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this booking' });
        }
       if (booking.status !== 'pending') {
            return res.status(400).json({ message: `Booking is already ${booking.status}` });
        }

         const payment = await Payment.create({
      bookingId: booking._id,
      provider: 'mock',
      reference: `PSLY-${generateReference()}`,
      amount: booking.totalAmount,
      status: 'success',
    });

    booking.status = 'paid';
    booking.paymentId = payment._id;
    await booking.save();

    if (booking.type === 'event') {
      const item = booking.items[0];
      const event = await Event.findById(item.refId);
      const ticketType = event.ticketTypes.id(item.meta.ticketTypeId);
      ticketType.sold += item.qty;
      await event.save();
    }

    const ticket = await Ticket.create({
      bookingId: booking._id,
      userId: req.user.id,
      type: booking.type,
      refId: booking.items[0].refId,
      code: `TKT-${generateCode()}`,
      status: 'valid',
      metadata: booking.items[0].meta,
    });

    res.status(200).json({ booking, payment, ticket });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
