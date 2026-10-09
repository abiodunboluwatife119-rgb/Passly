import VendorApplication from '../models/VendorApplication.js';
import User from '../models/User.js';
import { sendEmail, approvedEmail, rejectedEmail } from '../utils/email.js';

export const applyForVendor = async (req, res) => {
  try {
    const { businessName, businessType, description } = req.body;

    if (!businessName || !businessType || !description) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    const existing = await VendorApplication.findOne({
      userId: req.user.id,
      status: 'pending',
    });

    if (existing) {
      return res.status(400).json({ message: 'You already have a pending application' });
    }

    if (req.user.role === 'vendor' || req.user.role === 'admin') {
      return res.status(400).json({ message: 'You already have vendor access' });
    }

    const application = await VendorApplication.create({
      userId: req.user.id,
      businessName,
      businessType,
      description,
    });

    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getMyApplication = async (req, res) => {
  try {
    const application = await VendorApplication.findOne({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json(application || null);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getAllApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const applications = await VendorApplication.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const approveApplication = async (req, res) => {
  try {
    const application = await VendorApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'This application has already been reviewed' });
    }

    const applicant = await User.findById(application.userId).select('name email role');
    if (!applicant) {
      return res.status(404).json({ message: 'The applicant account no longer exists' });
    }

    application.status = 'approved';
    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();
    await application.save();

    await User.updateOne({ _id: applicant._id, role: 'user' }, { role: 'vendor' });

    const emailSent = await sendEmail({
      to: applicant.email,
      ...approvedEmail({ name: applicant.name, businessName: application.businessName }),
    });

    res.status(200).json({ application, emailSent });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const rejectApplication = async (req, res) => {
  try {
    const application = await VendorApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'This application has already been reviewed' });
    }

    const applicant = await User.findById(application.userId).select('name email');
    const note = String(req.body?.note || '').trim().slice(0, 500);

    application.status = 'rejected';
    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();
    application.reviewNote = note;
    await application.save();

    const emailSent = applicant
      ? await sendEmail({
          to: applicant.email,
          ...rejectedEmail({
            name: applicant.name,
            businessName: application.businessName,
            note,
          }),
        })
      : false;

    res.status(200).json({ application, emailSent });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};