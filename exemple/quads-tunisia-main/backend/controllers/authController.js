const db = require('../database/db');

// Login
exports.login = (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password (in production, use bcrypt.compare)
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    db.prepare('UPDATE users SET lastLogin = ? WHERE id = ?').run(new Date().toISOString(), user.id);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        // In production, generate a JWT token here
        token: `mock-token-${user.id}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Register
exports.register = (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Create new user
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password, phone, role, isActive, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      email,
      password, // In production, hash with bcrypt
      phone || '',
      'customer',
      1,
      new Date().toISOString()
    );

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token: `mock-token-${newUser.id}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify token (mock implementation)
exports.verifyToken = (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token || !token.startsWith('mock-token-')) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const userId = token.replace('mock-token-', '');
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, data: { user: userWithoutPassword } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
