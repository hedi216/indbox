const db = require('./db');

function updateActivities() {
  console.log('🗑️  Clearing existing activities...');

  // Clear existing activities
  db.prepare('DELETE FROM activities').run();

  console.log('🌱 Adding new activities...');

  const insertActivity = db.prepare(`
    INSERT INTO activities (name, description, category, price, duration, maxParticipants, image, difficulty, location, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();

  const activities = [
    // 1. Parasailing - 1 Person
    [
      'Parasailing (1 Person)',
      '🎈 Soar high above the crystal-clear waters and enjoy breathtaking aerial views of the coastline. Includes FREE pickup 🚐',
      'Water Sports',
      25,
      0.5,
      1,
      'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=800&q=80',
      'Beginner',
      'Main Beach',
      1,
      now,
      now
    ],

    // 2. Parasailing - 2 Persons
    [
      'Parasailing (2 Persons)',
      '🎈 Soar high above the crystal-clear waters and enjoy breathtaking aerial views of the coastline. Includes FREE pickup 🚐. Experience the thrill together!',
      'Water Sports',
      30,
      0.5,
      2,
      'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=800&q=80',
      'Beginner',
      'Main Beach',
      1,
      now,
      now
    ],

    // 3. Jet Ski - 1 Person (10 Minutes)
    [
      'Jet Ski (1 Person - 10 min)',
      '🚤 Experience the thrill of high-speed water adventure! Extra time available on request. Includes FREE pickup 🚐',
      'Water Sports',
      25,
      0.17,
      1,
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      'Beginner',
      'Main Beach',
      1,
      now,
      now
    ],

    // 4. Jet Ski - 2 Persons (10 Minutes)
    [
      'Jet Ski (2 Persons - 10 min)',
      '🚤 Experience the thrill of high-speed water adventure together! Extra time available on request. Includes FREE pickup 🚐',
      'Water Sports',
      30,
      0.17,
      2,
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      'Beginner',
      'Main Beach',
      1,
      now,
      now
    ],

    // 5. Water Inflatables (Banana & Big Mable)
    [
      'Water Inflatables (Banana & Big Mable)',
      '🍌 Hold on tight for a fun-filled ride on our banana boat and Big Mable! Perfect for thrill-seekers. Includes FREE pickup 🚐',
      'Water Sports',
      10,
      0.5,
      1,
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      'Beginner',
      'Main Beach',
      1,
      now,
      now
    ],

    // 6. Quad Bike Ride - 1 Person
    [
      'Quad Bike - Forest Adventure (1 Person)',
      '🛻 1h 20min forest adventure ride. Includes a short pause on the road (pause not included in price). Includes FREE pickup 🚐',
      'Land Adventures',
      20,
      1.33,
      1,
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
      'Intermediate',
      'Forest Trail',
      1,
      now,
      now
    ],

    // 7. Quad Bike Ride - 2 Persons
    [
      'Quad Bike - Forest Adventure (2 Persons)',
      '🛻 1h 20min forest adventure ride on the same quad. Includes a short pause on the road (pause not included in price). Includes FREE pickup 🚐',
      'Land Adventures',
      25,
      1.33,
      2,
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
      'Intermediate',
      'Forest Trail',
      1,
      now,
      now
    ],

    // 8. Berber Traditional Camel & Horse Carriage Ride
    [
      'Berber Camel & Horse Carriage Ride',
      '🐪🐴 2h unique Berber-style traditional ride. Includes a stop at a traditional café (consumption not included) & FREE traditional bread with olive oil. Includes FREE pickup 🚐',
      'Traditional Experiences',
      20,
      2,
      1,
      'https://images.unsplash.com/photo-1542731965-02c7c6ad2772?w=800&q=80',
      'Beginner',
      'Traditional Village',
      1,
      now,
      now
    ],

    // 9. Private Horse Beach Ride
    [
      'Private Horse Beach Ride (Sunrise/Sunset)',
      '🏖️🌅 1-hour private beach ride at sunrise or sunset. An unforgettable romantic experience. Includes FREE pickup 🚐',
      'Traditional Experiences',
      20,
      1,
      1,
      'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&q=80',
      'Beginner',
      'Private Beach',
      1,
      now,
      now
    ],

    // 10. Catamaran Private VIP Dolphin Trip (2h)
    [
      'Catamaran VIP Dolphin Trip (2h)',
      '⛵ Private VIP trip with possibility to see dolphins. Includes FREE soft drinks & fruits. Morning, afternoon, or sunset ride. Max 15 persons. Includes FREE pickup 🚐',
      'Boat Trips',
      150,
      2,
      15,
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      'Beginner',
      'Marina',
      1,
      now,
      now
    ],

    // 11. Catamaran Private VIP Dolphin Trip (4h)
    [
      'Catamaran VIP Dolphin Trip (4h)',
      '⛵ Extended private VIP trip with possibility to see dolphins. Includes FREE soft drinks & fruits. Morning, afternoon, or sunset ride. Max 15 persons. Includes FREE pickup 🚐',
      'Boat Trips',
      300,
      4,
      15,
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      'Beginner',
      'Marina',
      1,
      now,
      now
    ],

    // 12. Catamaran Private VIP Dolphin Trip (6h)
    [
      'Catamaran VIP Dolphin Trip (6h)',
      '⛵ Full day private VIP trip with possibility to see dolphins. Includes FREE soft drinks & fruits. Morning, afternoon, or sunset ride. Max 15 persons. Includes FREE pickup 🚐',
      'Boat Trips',
      450,
      6,
      15,
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      'Beginner',
      'Marina',
      1,
      now,
      now
    ],

    // 13. Fishing Boat Private Trip (2h)
    [
      'Fishing Boat Private Trip (2h)',
      '🎣 Private fishing adventure with possibility to see dolphins. Includes FREE soft drinks & fruits. Morning, afternoon, or sunset. Max 15 persons. Includes FREE pickup 🚐',
      'Boat Trips',
      150,
      2,
      15,
      'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=800&q=80',
      'Beginner',
      'Marina',
      1,
      now,
      now
    ],

    // 14. Fishing Boat Private Trip (4h)
    [
      'Fishing Boat Private Trip (4h)',
      '🎣 Extended private fishing adventure with possibility to see dolphins. Includes FREE soft drinks & fruits. Morning, afternoon, or sunset. Max 15 persons. Includes FREE pickup 🚐',
      'Boat Trips',
      300,
      4,
      15,
      'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=800&q=80',
      'Beginner',
      'Marina',
      1,
      now,
      now
    ],

    // 15. Fishing Boat Private Trip (6h)
    [
      'Fishing Boat Private Trip (6h)',
      '🎣 Full day private fishing adventure with possibility to see dolphins. Includes FREE soft drinks & fruits. Morning, afternoon, or sunset. Max 15 persons. Includes FREE pickup 🚐',
      'Boat Trips',
      450,
      6,
      15,
      'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=800&q=80',
      'Beginner',
      'Marina',
      1,
      now,
      now
    ],

    // 16. Glass Bottom Boat (2h)
    [
      'Glass Bottom Boat - Underwater Adventure (2h)',
      '🌊 See underwater life without getting wet! Includes FREE soft drinks & fruits. Possibility to see dolphins. Max 15 persons. Includes FREE pickup 🚐',
      'Boat Trips',
      150,
      2,
      15,
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      'Beginner',
      'Marina',
      1,
      now,
      now
    ],

    // 17. Glass Bottom Boat (4h)
    [
      'Glass Bottom Boat - Underwater Adventure (4h)',
      '🌊 Extended underwater viewing experience! Includes FREE soft drinks & fruits. Possibility to see dolphins. Max 15 persons. Includes FREE pickup 🚐',
      'Boat Trips',
      300,
      4,
      15,
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      'Beginner',
      'Marina',
      1,
      now,
      now
    ],

    // 18. Glass Bottom Boat (6h)
    [
      'Glass Bottom Boat - Underwater Adventure (6h)',
      '🌊 Full day underwater viewing experience! Includes FREE soft drinks & fruits. Possibility to see dolphins. Max 15 persons. Includes FREE pickup 🚐',
      'Boat Trips',
      450,
      6,
      15,
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      'Beginner',
      'Marina',
      1,
      now,
      now
    ],

    // 19. Karting Ride Sousse (16 min)
    [
      'Karting Ride Sousse (16 min)',
      '🏎️ Feel the adrenaline rush on our professional karting track! Perfect for speed enthusiasts. Includes FREE pickup 🚐',
      'Land Adventures',
      25,
      0.27,
      1,
      'https://images.unsplash.com/photo-1576514593596-a8c8d57fdb24?w=800&q=80',
      'Intermediate',
      'Sousse Karting Track',
      1,
      now,
      now
    ],

    // 20. Karting Ride Sousse (24 min)
    [
      'Karting Ride Sousse (24 min)',
      '🏎️ Extended karting session on our professional track! More time to perfect your racing skills. Includes FREE pickup 🚐',
      'Land Adventures',
      35,
      0.4,
      1,
      'https://images.unsplash.com/photo-1576514593596-a8c8d57fdb24?w=800&q=80',
      'Intermediate',
      'Sousse Karting Track',
      1,
      now,
      now
    ],

    // 21. Scuba Diving
    [
      'Scuba Diving Adventure',
      '🤿 Total duration: 1h 45min (45min-1h diving at 4-6m depth). Includes 20min boat tour. Professional photo session available. Includes FREE pickup 🚐',
      'Diving',
      30,
      1.75,
      1,
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      'Intermediate',
      'Diving Center',
      1,
      now,
      now
    ],

    // 22. Pirate Boat Trip Sousse
    [
      'Pirate Boat Trip Sousse',
      '🏴‍☠️ 2-hour pirate-themed adventure! Includes FREE fruits, soft drinks & lunch. Morning or afternoon ride. Includes FREE pickup 🚐',
      'Boat Trips',
      20,
      2,
      1,
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      'Beginner',
      'Sousse Marina',
      1,
      now,
      now
    ],

    // 23. Full Day Pirate Boat to Kuriat Island (Monastir)
    [
      'Pirate Boat to Kuriat Island (Full Day)',
      '🏴‍☠️ 9am-5pm adventure to Kuriat Island! FREE fruits, soft drinks, lunch (chicken/fish), pirate animation, island stay. See dolphins & sea turtles, deep sea swim. Includes FREE pickup 🚐',
      'Boat Trips',
      35,
      8,
      1,
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      'Beginner',
      'Monastir Marina',
      1,
      now,
      now
    ],

    // 24. Morning Dolphin Ride - Jet Ski (Mahdia)
    [
      'Morning Dolphin Ride - Jet Ski (Mahdia)',
      '🐬 1-hour dolphin watching on jet ski (single or double). Early morning magic: 9am-10am or 10am-11am. Mahdia only. Includes FREE pickup 🚐',
      'Water Sports',
      120,
      1,
      2,
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      'Intermediate',
      'Mahdia Beach',
      1,
      now,
      now
    ],

    // 25. Morning Dolphin Ride - Boat (Mahdia)
    [
      'Morning Dolphin Ride - Boat (Mahdia)',
      '🐬 1-hour dolphin watching on boat. Early morning magic: 9am-10am or 10am-11am. Mahdia only. Includes FREE pickup 🚐',
      'Boat Trips',
      30,
      1,
      1,
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      'Beginner',
      'Mahdia Marina',
      1,
      now,
      now
    ],

    // 26-31: Excursions
    [
      'Tunis/Carthage/Sidi Bou Said/Bardo - Full Day',
      '🏛️ Full day cultural tour with VIP car & private guide. Explore ancient Carthage, blue & white Sidi Bou Said, Bardo Museum treasures. Includes FREE pickup 🚐',
      'Excursions',
      60,
      8,
      1,
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80',
      'Beginner',
      'Tunis Region',
      1,
      now,
      now
    ],

    [
      'Kairouan & El Jem Coliseum - Half Day',
      '🏛️ Half day historical tour with VIP car & private guide. Visit holy Kairouan & magnificent El Jem Roman Coliseum. Includes FREE pickup 🚐',
      'Excursions',
      45,
      4,
      1,
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80',
      'Beginner',
      'Kairouan & El Jem',
      1,
      now,
      now
    ],

    [
      'Takrouna Mountain Village & Hergla - Half Day',
      '⛰️ Half day scenic tour with VIP car & private guide. Explore traditional mountain village Takrouna & pristine Hergla beaches. Includes FREE pickup 🚐',
      'Excursions',
      30,
      4,
      1,
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
      'Beginner',
      'Takrouna & Hergla',
      1,
      now,
      now
    ],

    [
      'Monastir Ribat & Sousse Medina - Half Day',
      '🕌 Half day cultural tour with VIP car & private guide. Discover historic Monastir fortress & vibrant Sousse Medina. Includes FREE pickup 🚐',
      'Excursions',
      45,
      4,
      1,
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80',
      'Beginner',
      'Monastir & Sousse',
      1,
      now,
      now
    ],

    [
      'Mahdia Medina & Crystal Beaches - Half Day',
      '🏖️ Half day relaxation tour with VIP car & private guide. Explore charming Mahdia Medina & swim at crystal-clear beaches. Includes FREE pickup 🚐',
      'Excursions',
      30,
      4,
      1,
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      'Beginner',
      'Mahdia',
      1,
      now,
      now
    ],

    [
      'Friguia African Zoo - Half Day',
      '🦁 Half day wildlife adventure with VIP car & private guide. Meet African animals in Tunisia\'s premier zoo. Perfect for families! Includes FREE pickup 🚐',
      'Excursions',
      30,
      4,
      1,
      'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800&q=80',
      'Beginner',
      'Friguia Zoo',
      1,
      now,
      now
    ]
  ];

  for (const activity of activities) {
    insertActivity.run(...activity);
  }

  console.log(`✅ Successfully added ${activities.length} activities!`);
  console.log('🎉 Activity update completed!');
}

// Run the update
try {
  updateActivities();
} catch (error) {
  console.error('❌ Error updating activities:', error);
}
