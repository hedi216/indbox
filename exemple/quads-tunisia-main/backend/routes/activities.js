const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/', activityController.getAllActivities);
router.get('/:id', activityController.getActivity);

// Admin only routes
router.post('/', authenticate, isAdmin, activityController.createActivity);
router.put('/:id', authenticate, isAdmin, activityController.updateActivity);
router.delete('/:id', authenticate, isAdmin, activityController.deleteActivity);

module.exports = router;
