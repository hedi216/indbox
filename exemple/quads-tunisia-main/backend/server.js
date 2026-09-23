const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize database and seed data
const db = require('./database/db');
const { seedDatabase } = require('./database/seed');

const app = express();
const PORT = process.env.PORT || 5000;

// Seed database with initial data
seedDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activities');
const bookingRoutes = require('./routes/bookings');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');

// Base routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Quads Tunisia API with SQLite Database' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), database: 'SQLite' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   🌊 Quads Tunisia API Server Started 🌊    ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║  Server: http://localhost:${PORT}            ║`);
  console.log(`║  Database: SQLite (Persistent)             ║`);
  console.log(`║  API Endpoints: /api/*                     ║`);
  console.log('╚════════════════════════════════════════════╝');
});
