const BookDemo = require('../models/bookDemoModel');
const SuperAdmin = require('../models/superAdminModel');
const { sendAdminDemoNotification } = require('../../utils/mailer');

// ---------------- Submit Book Demo (Public) ----------------
exports.submitBookDemo = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is missing. Make sure you are sending JSON with "Content-Type: application/json" header.',
      });
    }

    const { fullName, email, phoneNumber, message } = req.body;

    if (!fullName || !email || !phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields (fullName, email, phoneNumber, message) are required',
      });
    }

    // 1. Save to Database
    const newDemo = await BookDemo.create({
      fullName,
      email,
      phoneNumber,
      message,
    });

    // 2. Send Email Notifications to Super Admins
    try {
      const admins = await SuperAdmin.findAll({ attributes: ['email'] });
      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await sendAdminDemoNotification(admin.email, {
            fullName,
            email,
            phoneNumber,
            message,
          });
        }
      }
    } catch (emailError) {
      console.error('Failed to send super admin notifications:', emailError);
      // We don't return an error to the user because the data was saved successfully
    }

    res.status(201).json({
      success: true,
      message: 'Demo request submitted successfully and admins notified',
      data: newDemo,
    });
  } catch (error) {
    console.error('Error submitting book demo:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Get Book Demos (Super Admin) ----------------
exports.getBookDemos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await BookDemo.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching book demos:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
