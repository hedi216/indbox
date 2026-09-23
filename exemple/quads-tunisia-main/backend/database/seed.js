const db = require('./db');

function seedDatabase() {
  // Check if data already exists
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();

  if (userCount.count > 0) {
    console.log('⏭️  Database already seeded, skipping...');
    return;
  }

  console.log('🌱 Seeding database with initial data...');

  // Seed Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role, phone, isActive, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [
    ['Admin User', 'admin@aquasports.com', 'admin123', 'admin', '+1234567800', 1, new Date().toISOString()],
    ['John Smith', 'john.smith@email.com', 'customer123', 'customer', '+1234567890', 1, new Date().toISOString()],
    ['Sarah Johnson', 'sarah.j@email.com', 'customer123', 'customer', '+1234567891', 1, new Date().toISOString()],
    ['Michael Brown', 'mbrown@email.com', 'customer123', 'customer', '+1234567892', 1, new Date().toISOString()],
  ];

  for (const user of users) {
    insertUser.run(...user);
  }
  console.log('✅ Seeded 4 users');

  // Seed Activities
  const insertActivity = db.prepare(`
    INSERT INTO activities (name, description, category, price, duration, maxParticipants, image, difficulty, location, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const activities = [
    [
      'Jet Skiing',
      'Experience the thrill of high-speed water adventure on our top-of-the-line jet skis.',
      'water-sports',
      89.99,
      1,
      2,
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      'Beginner',
      'Main Beach',
      1,
      new Date().toISOString(),
      new Date().toISOString()
    ],
    [
      'Scuba Diving',
      'Explore the underwater world with our certified instructors. Perfect for beginners and experienced divers.',
      'diving',
      149.99,
      3,
      4,
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      'Intermediate',
      'Coral Reef Point',
      1,
      new Date().toISOString(),
      new Date().toISOString()
    ],
    [
      'Parasailing',
      'Soar above the ocean and enjoy breathtaking views of the coastline.',
      'water-sports',
      119.99,
      0.5,
      2,
      'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=800&q=80',
      'Beginner',
      'South Bay',
      1,
      new Date().toISOString(),
      new Date().toISOString()
    ],
    [
      'Snorkeling Tour',
      'Discover vibrant marine life in crystal-clear waters. Equipment provided.',
      'diving',
      59.99,
      2,
      8,
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      'Beginner',
      'Turtle Bay',
      1,
      new Date().toISOString(),
      new Date().toISOString()
    ],
    [
      'Kayaking',
      'Paddle through serene waters and explore hidden coves at your own pace.',
      'water-sports',
      49.99,
      2,
      2,
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
      'Beginner',
      'Mangrove Lagoon',
      1,
      new Date().toISOString(),
      new Date().toISOString()
    ],
    [
      'Sunset Cruise',
      'Relax on a luxury yacht while watching the spectacular sunset over the ocean.',
      'tours',
      199.99,
      2,
      20,
      'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=80',
      'Beginner',
      'Marina Harbor',
      1,
      new Date().toISOString(),
      new Date().toISOString()
    ]
  ];

  for (const activity of activities) {
    insertActivity.run(...activity);
  }
  console.log('✅ Seeded 6 activities');

  // Seed Bookings
  const insertBooking = db.prepare(`
    INSERT INTO bookings (activityId, activityName, customerName, customerEmail, customerPhone, date, participants, totalPrice, status, paymentStatus, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const bookings = [
    [
      1, 'Jet Skiing', 'John Smith', 'john.smith@email.com', '+1234567890',
      tomorrow.toISOString().split('T')[0], 2, 179.98, 'Confirmed', 'Paid',
      new Date().toISOString(), new Date().toISOString()
    ],
    [
      2, 'Scuba Diving', 'Sarah Johnson', 'sarah.j@email.com', '+1234567891',
      nextWeek.toISOString().split('T')[0], 1, 149.99, 'Pending', 'Unpaid',
      new Date().toISOString(), new Date().toISOString()
    ],
    [
      6, 'Sunset Cruise', 'Michael Brown', 'mbrown@email.com', '+1234567892',
      today.toISOString().split('T')[0], 4, 799.96, 'Completed', 'Paid',
      twoDaysAgo.toISOString(), twoDaysAgo.toISOString()
    ],
    [
      3, 'Parasailing', 'Emily Davis', 'emily.d@email.com', '+1234567893',
      tomorrow.toISOString().split('T')[0], 2, 239.98, 'Confirmed', 'Paid',
      new Date().toISOString(), new Date().toISOString()
    ],
    [
      4, 'Snorkeling Tour', 'David Wilson', 'david.w@email.com', '+1234567894',
      nextWeek.toISOString().split('T')[0], 3, 179.97, 'Pending', 'Unpaid',
      new Date().toISOString(), new Date().toISOString()
    ]
  ];

  for (const booking of bookings) {
    insertBooking.run(...booking);
  }
  console.log('✅ Seeded 5 bookings');

  console.log('🎉 Database seeding completed!');
}

module.exports = { seedDatabase };
