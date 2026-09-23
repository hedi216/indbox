const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Admin: list all reviews (optionally filter ?approved=true|false)
router.get('/', reviewController.getAllReviews);

// Get reviews for a specific activity
router.get('/activity/:activityId', reviewController.getActivityReviews);

// Get average rating for an activity
router.get('/activity/:activityId/rating', reviewController.getActivityRating);

// Create a new review
router.post('/', reviewController.createReview);

// Update review approval status
router.patch('/:id/approval', reviewController.updateReviewApproval);

// Delete a review
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
