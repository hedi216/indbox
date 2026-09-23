const db = require('../database/db');

// Get all activities
exports.getAllActivities = (req, res) => {
  try {
    const { category, isActive } = req.query;
    let query = 'SELECT * FROM activities WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (isActive !== undefined) {
      query += ' AND isActive = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    const activities = db.prepare(query).all(...params);

    res.json({ success: true, data: activities, count: activities.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single activity
exports.getActivity = (req, res) => {
  try {
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);

    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    res.json({ success: true, data: activity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Normalize pricingOptions to a JSON string (or null) regardless of the
// shape the client sent (array, JSON string, or omitted).
function normalizePricingOptions(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string') {
    try { JSON.parse(value); return value; } catch { return null; }
  }
  if (Array.isArray(value)) return JSON.stringify(value);
  return null;
}

// Create activity
exports.createActivity = (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      duration,
      maxParticipants,
      image,
      difficulty,
      location,
      isActive,
      pricingOptions,
      timeSlots,
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO activities (name, description, category, price, duration, maxParticipants, image, difficulty, location, pricingOptions, timeSlots, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const result = stmt.run(
      name,
      description,
      category,
      price,
      duration,
      maxParticipants,
      image || '',
      difficulty || 'Beginner',
      location || '',
      normalizePricingOptions(pricingOptions),
      normalizePricingOptions(timeSlots),
      isActive !== undefined ? (isActive ? 1 : 0) : 1,
      now,
      now
    );

    const newActivity = db.prepare('SELECT * FROM activities WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: newActivity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update activity
exports.updateActivity = (req, res) => {
  try {
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);

    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    const {
      name,
      description,
      category,
      price,
      duration,
      maxParticipants,
      image,
      difficulty,
      location,
      isActive,
      pricingOptions,
      timeSlots,
    } = req.body;

    const stmt = db.prepare(`
      UPDATE activities
      SET name = ?, description = ?, category = ?, price = ?, duration = ?,
          maxParticipants = ?, image = ?, difficulty = ?, location = ?,
          pricingOptions = ?, timeSlots = ?, isActive = ?, updatedAt = ?
      WHERE id = ?
    `);

    stmt.run(
      name !== undefined ? name : activity.name,
      description !== undefined ? description : activity.description,
      category !== undefined ? category : activity.category,
      price !== undefined ? price : activity.price,
      duration !== undefined ? duration : activity.duration,
      maxParticipants !== undefined ? maxParticipants : activity.maxParticipants,
      image !== undefined ? image : activity.image,
      difficulty !== undefined ? difficulty : activity.difficulty,
      location !== undefined ? location : activity.location,
      pricingOptions !== undefined ? normalizePricingOptions(pricingOptions) : activity.pricingOptions,
      timeSlots !== undefined ? normalizePricingOptions(timeSlots) : activity.timeSlots,
      isActive !== undefined ? (isActive ? 1 : 0) : activity.isActive,
      new Date().toISOString(),
      req.params.id
    );

    const updatedActivity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);

    res.json({ success: true, data: updatedActivity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete activity
exports.deleteActivity = (req, res) => {
  try {
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);

    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);

    res.json({ success: true, message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
