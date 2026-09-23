const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, isAdmin } = require('../middleware/auth');

// All booking routes require authentication
router.use(authenticate);

router.get('/', bookingController.getAllBookings);
router.get('/stats', isAdmin, bookingController.getBookingStats);
router.get('/:id', bookingController.getBooking);
router.post('/', bookingController.createBooking);
router.put('/:id', bookingController.updateBooking);
router.delete('/:id', isAdmin, bookingController.deleteBooking);

module.exports = router;
