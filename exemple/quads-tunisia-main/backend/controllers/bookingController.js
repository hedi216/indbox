const db = require('../database/db');

// Get all bookings
exports.getAllBookings = (req, res) => {
  try {
    const { status, date, customerEmail } = req.query;
    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }

    if (customerEmail) {
      // Case-insensitive match so capitalization differences in email don't lose history.
      query += ' AND lower(customerEmail) = lower(?)';
      params.push(customerEmail);
    }

    query += ' ORDER BY createdAt DESC';

    const bookings = db.prepare(query).all(...params);

    res.json({ success: true, data: bookings, count: bookings.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single booking
exports.getBooking = (req, res) => {
  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create booking
exports.createBooking = (req, res) => {
  try {
    const {
      activityId,
      activityName,
      customerName,
      customerEmail,
      customerPhone,
      date,
      participants,
      totalPrice,
      status,
      paymentStatus,
      notes
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO bookings (activityId, activityName, customerName, customerEmail, customerPhone, date, participants, totalPrice, status, paymentStatus, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const result = stmt.run(
      activityId,
      activityName,
      customerName,
      customerEmail,
      customerPhone,
      date,
      participants || 1,
      totalPrice,
      status || 'Pending',
      paymentStatus || 'Unpaid',
      notes || '',
      now,
      now
    );

    const newBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: newBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update booking
exports.updateBooking = (req, res) => {
  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      date,
      participants,
      totalPrice,
      status,
      paymentStatus,
      notes
    } = req.body;

    const stmt = db.prepare(`
      UPDATE bookings
      SET customerName = ?, customerEmail = ?, customerPhone = ?, date = ?,
          participants = ?, totalPrice = ?, status = ?, paymentStatus = ?, notes = ?, updatedAt = ?
      WHERE id = ?
    `);

    stmt.run(
      customerName !== undefined ? customerName : booking.customerName,
      customerEmail !== undefined ? customerEmail : booking.customerEmail,
      customerPhone !== undefined ? customerPhone : booking.customerPhone,
      date !== undefined ? date : booking.date,
      participants !== undefined ? participants : booking.participants,
      totalPrice !== undefined ? totalPrice : booking.totalPrice,
      status !== undefined ? status : booking.status,
      paymentStatus !== undefined ? paymentStatus : booking.paymentStatus,
      notes !== undefined ? notes : booking.notes,
      new Date().toISOString(),
      req.params.id
    );

    const updatedBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);

    res.json({ success: true, data: updatedBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete booking
exports.deleteBooking = (req, res) => {
  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);

    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get booking statistics
exports.getBookingStats = (req, res) => {
  try {
    const bookings = db.prepare('SELECT * FROM bookings').all();

    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === 'Pending').length;
    const confirmedBookings = bookings.filter(b => b.status === 'Confirmed').length;
    const completedBookings = bookings.filter(b => b.status === 'Completed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'Cancelled').length;

    const totalRevenue = bookings
      .filter(b => b.paymentStatus === 'Paid')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    const pendingRevenue = bookings
      .filter(b => b.paymentStatus === 'Unpaid')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    // Recent bookings (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentBookings = bookings.filter(b =>
      new Date(b.createdAt) >= sevenDaysAgo
    ).length;

    // Bookings by activity
    const bookingsByActivity = {};
    bookings.forEach(b => {
      bookingsByActivity[b.activityName] = (bookingsByActivity[b.activityName] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
        pendingRevenue,
        recentBookings,
        bookingsByActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
