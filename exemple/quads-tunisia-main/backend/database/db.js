const Database = require('better-sqlite3');
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'aquasports.db');
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      phone TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      lastLogin TEXT
    )
  `);

  // Activities table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      duration REAL NOT NULL,
      maxParticipants INTEGER NOT NULL,
      image TEXT,
      isActive INTEGER DEFAULT 1,
      difficulty TEXT DEFAULT 'Beginner',
      location TEXT,
      pricingOptions TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add pricingOptions column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE activities ADD COLUMN pricingOptions TEXT`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Add timeSlots column (JSON array of strings, e.g. ["09:00 - 10:00", "10:00 - 11:00"])
  try {
    db.exec(`ALTER TABLE activities ADD COLUMN timeSlots TEXT`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Bookings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activityId INTEGER NOT NULL,
      activityName TEXT NOT NULL,
      customerName TEXT NOT NULL,
      customerEmail TEXT NOT NULL,
      customerPhone TEXT NOT NULL,
      date TEXT NOT NULL,
      participants INTEGER DEFAULT 1,
      totalPrice REAL NOT NULL,
      status TEXT DEFAULT 'Pending',
      paymentStatus TEXT DEFAULT 'Unpaid',
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (activityId) REFERENCES activities(id) ON DELETE CASCADE
    )
  `);

  // Reviews/Comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activityId INTEGER NOT NULL,
      customerName TEXT NOT NULL,
      customerEmail TEXT,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      isApproved INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (activityId) REFERENCES activities(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Database tables created successfully');
}

// Initialize database
initializeDatabase();

module.exports = db;
