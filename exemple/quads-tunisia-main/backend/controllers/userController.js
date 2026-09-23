const db = require('../database/db');

// Get all users
exports.getAllUsers = (req, res) => {
  try {
    const { role, isActive } = req.query;
    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (isActive !== undefined) {
      query += ' AND isActive = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    const users = db.prepare(query).all(...params);

    // Remove passwords from response
    const usersWithoutPasswords = users.map(u => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });

    res.json({ success: true, data: usersWithoutPasswords, count: usersWithoutPasswords.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single user
exports.getUser = (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create user
exports.createUser = (req, res) => {
  try {
    const { name, email, password, phone, role, isActive } = req.body;

    // Check if email already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const stmt = db.prepare(`
      INSERT INTO users (name, email, password, phone, role, isActive, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      email,
      password, // In production, hash with bcrypt
      phone || '',
      role || 'customer',
      isActive !== undefined ? (isActive ? 1 : 0) : 1,
      new Date().toISOString()
    );

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user
exports.updateUser = (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, password, phone, role, isActive } = req.body;

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
    }

    // Build update query based on provided fields
    let updateFields = [];
    let params = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      params.push(name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      params.push(email);
    }
    if (password !== undefined && password !== '') {
      updateFields.push('password = ?');
      params.push(password); // In production, hash with bcrypt
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      params.push(phone);
    }
    if (role !== undefined) {
      updateFields.push('role = ?');
      params.push(role);
    }
    if (isActive !== undefined) {
      updateFields.push('isActive = ?');
      params.push(isActive ? 1 : 0);
    }

    if (updateFields.length > 0) {
      params.push(req.params.id);
      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      db.prepare(query).run(...params);
    }

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete user
exports.deleteUser = (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin');
      if (adminCount.count <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin user'
        });
      }
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user statistics
exports.getUserStats = (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users').all();

    const totalUsers = users.length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const customerUsers = users.filter(u => u.role === 'customer').length;
    const activeUsers = users.filter(u => u.isActive === 1).length;

    // New users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = users.filter(u =>
      new Date(u.createdAt) >= thirtyDaysAgo
    ).length;

    res.json({
      success: true,
      data: {
        totalUsers,
        adminUsers,
        customerUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        newUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
