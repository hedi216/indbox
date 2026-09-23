const db = require('../database/db');

// Get all reviews across all activities (admin moderation queue).
// Joins the activity name so the admin UI can show what's being reviewed.
exports.getAllReviews = (req, res) => {
  try {
    const { approved } = req.query;
    let query = `
      SELECT r.*, a.name AS activityName
      FROM reviews r
      LEFT JOIN activities a ON a.id = r.activityId
      WHERE 1=1
    `;
    const params = [];
    if (approved !== undefined) {
      query += ' AND r.isApproved = ?';
      params.push(approved === 'true' ? 1 : 0);
    }
    query += ' ORDER BY r.createdAt DESC';
    const reviews = db.prepare(query).all(...params);
    res.json({ success: true, data: reviews, count: reviews.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all reviews for an activity
exports.getActivityReviews = (req, res) => {
  try {
    const { activityId } = req.params;
    const { approved } = req.query;

    let query = 'SELECT * FROM reviews WHERE activityId = ?';
    const params = [activityId];

    if (approved !== undefined) {
      query += ' AND isApproved = ?';
      params.push(approved === 'true' ? 1 : 0);
    }

    query += ' ORDER BY createdAt DESC';

    const reviews = db.prepare(query).all(...params);

    res.json({ success: true, data: reviews, count: reviews.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new review
exports.createReview = (req, res) => {
  try {
    const { activityId, customerName, customerEmail, rating, comment } = req.body;

    if (!activityId || !customerName || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: activityId, customerName, rating, comment'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO reviews (activityId, customerName, customerEmail, rating, comment, isApproved, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const result = stmt.run(
      activityId,
      customerName,
      customerEmail || null,
      rating,
      comment,
      0, // Pending until an admin approves it
      now
    );

    const newReview = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: newReview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update review approval status (admin only)
exports.updateReviewApproval = (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    db.prepare('UPDATE reviews SET isApproved = ? WHERE id = ?').run(
      isApproved ? 1 : 0,
      id
    );

    const updatedReview = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);

    res.json({ success: true, data: updatedReview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a review
exports.deleteReview = (req, res) => {
  try {
    const { id } = req.params;

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    db.prepare('DELETE FROM reviews WHERE id = ?').run(id);

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get average rating for an activity
exports.getActivityRating = (req, res) => {
  try {
    const { activityId } = req.params;

    const result = db.prepare(`
      SELECT
        COUNT(*) as totalReviews,
        AVG(rating) as averageRating
      FROM reviews
      WHERE activityId = ? AND isApproved = 1
    `).get(activityId);

    res.json({
      success: true,
      data: {
        totalReviews: result.totalReviews,
        averageRating: result.averageRating ? parseFloat(result.averageRating.toFixed(1)) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
