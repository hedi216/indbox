const db = require('./db');

function seedActivitiesNew() {
  console.log('🗑️  Clearing existing activities...');
  db.prepare('DELETE FROM activities').run();

  console.log('🌱 Adding new activities with pricing options...');

  const insertActivity = db.prepare(`
    INSERT INTO activities (name, description, category, price, duration, maxParticipants, image, difficulty, location, pricingOptions, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();

  // ============================================================
  // SOUSSE & MONASTIR — Same activities available in both locations
  // ============================================================
  const sharedActivities = [
    // 1. Parasailing
    {
      name: 'Parasailing',
      description: '🎈 Soar high above the crystal-clear waters and enjoy breathtaking aerial views of the coastline. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Water Sports',
      price: 25,
      duration: 0.5,
      maxParticipants: 2,
      image: 'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Sousse, Monastir, Mahdia',
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 25 },
        { label: '2 Persons', participants: 2, price: 30 }
      ])
    },

    // 2. Jet Ski
    {
      name: 'Jet Ski (10 Minutes)',
      description: '🚤 Experience the thrill of high-speed water adventure! Extra time available on request. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Water Sports',
      price: 25,
      duration: 0.17,
      maxParticipants: 2,
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Sousse, Monastir, Mahdia',
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 25 },
        { label: '2 Persons', participants: 2, price: 30 }
      ])
    },

    // 3. Water Inflatables
    {
      name: 'Water Inflatables (Banana & Big Mable)',
      description: '🍌 Hold on tight for a fun-filled ride on our banana boat and Big Mable! Perfect for thrill-seekers. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Water Sports',
      price: 10,
      duration: 0.5,
      maxParticipants: 1,
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Sousse, Monastir, Mahdia',
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 10 }
      ])
    },

    // 4. Quad Bike - Forest Adventure
    {
      name: 'Quad Bike - Forest Adventure',
      description: '🏎️ 1h20 forest adventure ride with a short pause on the road. All ages welcome. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Land Adventures',
      price: 20,
      duration: 1.33,
      maxParticipants: 2,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
      difficulty: 'Intermediate',
      location: 'Sousse, Monastir',
      pricingOptions: JSON.stringify([
        { label: '1 Person (Single)', participants: 1, price: 20 },
        { label: '2 Persons (Same Quad)', participants: 2, price: 25 }
      ])
    },

    // 5. Berber Camel & Horse Carriage Ride
    {
      name: 'Berber Camel & Horse Carriage Ride',
      description: '🐪🐴 2h unique Berber-style traditional ride. Includes a stop at a traditional café (consumption not included) & FREE traditional bread with olive oil. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Traditional Experiences',
      price: 20,
      duration: 2,
      maxParticipants: 1,
      image: 'https://images.unsplash.com/photo-1542731965-02c7c6ad2772?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Sousse, Monastir, Mahdia',
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 20 }
      ])
    },

    // 6. Private Horse Beach Ride
    {
      name: 'Private Horse Beach Ride',
      description: '🏖️🌅 1-hour private beach ride at sunrise or sunset. An unforgettable romantic experience. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Traditional Experiences',
      price: 20,
      duration: 1,
      maxParticipants: 1,
      image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Sousse, Monastir',
      pricingOptions: JSON.stringify([
        { label: 'Sunrise Ride', participants: 1, price: 20 },
        { label: 'Sunset Ride', participants: 1, price: 20 }
      ])
    },

    // 7. Karting Ride
    {
      name: 'Karting Ride',
      description: '🏎️ Feel the adrenaline rush on our professional karting track! Perfect for speed enthusiasts. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Land Adventures',
      price: 25,
      duration: 0.27,
      maxParticipants: 1,
      image: 'https://images.unsplash.com/photo-1576514593596-a8c8d57fdb24?w=800&q=80',
      difficulty: 'Intermediate',
      location: 'Sousse, Monastir',
      pricingOptions: JSON.stringify([
        { label: '16 Minutes', duration: 0.27, price: 25 },
        { label: '24 Minutes', duration: 0.4, price: 35 }
      ])
    },

    // 8. Scuba Diving (Try Dive) — £40 per person
    {
      name: 'Scuba Diving Adventure',
      description: '🤿 Total duration: 1h45min. Includes professional briefing for try dive, 20-30min diving at 4-6m depth (one instructor per try diver). Explorations of shipwrecks, caves & various diving sites depending on your licence. Boat tour: 1-2h enjoying coastal landscapes. Optional professional photo session. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Diving',
      price: 40,
      duration: 1.75,
      maxParticipants: 1,
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      difficulty: 'Intermediate',
      location: 'Sousse, Monastir, Mahdia',
      pricingOptions: JSON.stringify([
        { label: 'Per Person', participants: 1, price: 40 }
      ])
    },

    // 9. VIP Quad Ride – Flamingo Lake (Private)
    {
      name: 'VIP Quad Ride – Flamingo Lake (Private)',
      description: '🏎️ 3h high-speed quad adventure with salt lake drifting, café & mini zoo stop. Exclusive VIP private thrill! All ages welcome. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Land Adventures',
      price: 50,
      duration: 3,
      maxParticipants: 2,
      image: 'https://images.unsplash.com/photo-1576514593596-a8c8d57fdb24?w=800&q=80',
      difficulty: 'Intermediate',
      location: 'Sousse, Monastir',
      pricingOptions: JSON.stringify([
        { label: 'Single', participants: 1, price: 50 },
        { label: 'Double', participants: 2, price: 60 }
      ])
    },

  ];

  // ============================================================
  // SOUSSE ONLY
  // ============================================================
  const sousseOnly = [
    // Pirate Boat Trip Sousse
    {
      name: 'Pirate Boat Trip Sousse',
      description: '🏴‍☠️ 2-hour pirate-themed adventure! Includes FREE fruits, soft drinks & lunch. Morning or afternoon ride. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Boat Trips',
      price: 20,
      duration: 2,
      maxParticipants: 1,
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Sousse',
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 20 }
      ])
    },
  ];

  // ============================================================
  // MONASTIR ONLY — Group Catamaran & Glass Boat + Kuriat Island
  // ============================================================
  const monastirOnly = [
    // 14. Monastir Catamaran Group Ride — min 2 persons
    {
      name: 'Catamaran Group Ride (Monastir)',
      description: '⛵ Catamaran group trip. Dolphin spotting, swim stop, soft drinks & fruits. Minimum 2 persons per booking. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Boat Trips',
      price: 80,
      duration: 2,
      maxParticipants: 15,
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Monastir',
      pricingOptions: JSON.stringify([
        { label: 'Per Person (min 2)', participants: 2, price: 80 }
      ])
    },

    // 15. Monastir Glass Bottom Boat (Group) — min 2 persons
    {
      name: 'Glass Bottom Boat Group Ride (Monastir)',
      description: '🌊 Underwater glass boat group ride. See marine life without diving! Minimum 2 persons per booking. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Boat Trips',
      price: 80,
      duration: 2,
      maxParticipants: 15,
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Monastir',
      pricingOptions: JSON.stringify([
        { label: 'Per Person (min 2)', participants: 2, price: 80 }
      ])
    },

    // 16. Pirate Boat to Kuriat Island — Monastir only
    {
      name: 'Pirate Boat to Kuriat Island',
      description: '🏴‍☠️ 9am-5pm full day adventure to Kuriat Island! FREE fruits, soft drinks, lunch (chicken/fish), pirate animation, island stay. See dolphins & sea turtles, deep sea swim. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Boat Trips',
      price: 35,
      duration: 8,
      maxParticipants: 1,
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Monastir',
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 35 }
      ])
    },
  ];

  // ============================================================
  // MAHDIA ONLY
  // ============================================================
  const mahdiaOnly = [
    // 17. Morning Dolphin Ride (Mahdia) — boat only, jet ski is now its own listing below
    {
      name: 'Morning Dolphin Ride (Mahdia)',
      description: '🐬 1-hour dolphin watching. Early morning magic: 9am-10am or 10am-11am. Mahdia only. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Water Sports',
      price: 30,
      duration: 1,
      maxParticipants: 2,
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Mahdia',
      pricingOptions: JSON.stringify([
        { label: 'On Boat', type: 'Boat', price: 30 }
      ])
    },

    // 17b. Jet Ski – Free Ride to Dolphins (Mahdia) — 1h30, £100 per jet ski
    {
      name: 'Jet Ski – Free Ride to Dolphins (Mahdia)',
      description: '🏄‍♂️🐬 1h30 free-ride jet ski adventure out to the dolphins. Priced per jet ski (single or tandem). Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Water Sports',
      price: 100,
      duration: 1.5,
      maxParticipants: 2,
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      difficulty: 'Intermediate',
      location: 'Mahdia',
      pricingOptions: JSON.stringify([
        { label: 'Per Jet Ski (Single or Tandem)', price: 100 }
      ])
    },

    // 17c. VIP Private Catamaran (Mahdia) — 2-8h, from £150/boat, max 20p
    {
      name: 'VIP Private Catamaran (Mahdia)',
      description: '⛵ 2-8h private catamaran charter with dolphin spotting and a swim stop. Priced per boat, up to 20 persons. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Boat Trips',
      price: 150,
      duration: 4,
      maxParticipants: 20,
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Mahdia',
      pricingOptions: JSON.stringify([
        { label: 'From (Per Boat, max 20p)', price: 150 }
      ])
    },

    // 17d. VIP Private Fishing Boat (Mahdia) — 2-6h, £200/boat, max 6p
    {
      name: 'VIP Private Fishing Boat (Mahdia)',
      description: '🎣 2-6h private fishing charter with relaxed fishing & dolphin sightings. Priced per boat, up to 6 persons. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Boat Trips',
      price: 200,
      duration: 4,
      maxParticipants: 6,
      image: 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Mahdia',
      pricingOptions: JSON.stringify([
        { label: 'Per Boat (max 6p)', price: 200 }
      ])
    },

    // 18. Quad Bike – Forest Adventure (Mahdia) — 1h30, £25/£30
    {
      name: 'Quad Bike - Forest Adventure (Mahdia)',
      description: '🏎️ 1h30 forest adventure ride with a short pause on the road (pause not included in price). All ages welcome. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Land Adventures',
      price: 25,
      duration: 1.5,
      maxParticipants: 2,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
      difficulty: 'Intermediate',
      location: 'Mahdia',
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 25 },
        { label: '2 Persons (Same Quad)', participants: 2, price: 30 }
      ])
    },

    // 19. Private Horse Beach Ride (Mahdia) — 1h30, £25
    {
      name: 'Private Horse Beach Ride (Mahdia)',
      description: '🏖️🌅 1h30 private beach ride at sunrise or sunset. An unforgettable romantic experience. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Traditional Experiences',
      price: 25,
      duration: 1.5,
      maxParticipants: 1,
      image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Mahdia',
      pricingOptions: JSON.stringify([
        { label: 'Sunrise Ride', participants: 1, price: 25 },
        { label: 'Sunset Ride', participants: 1, price: 25 }
      ])
    },

    // 20. Pirate Boat Trip Mahdia
    {
      name: 'Pirate Boat Trip Mahdia',
      description: '🏴‍☠️ 2-hour pirate-themed adventure! Includes FREE fruits, soft drinks & lunch. Morning or afternoon ride. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Boat Trips',
      price: 20,
      duration: 2,
      maxParticipants: 1,
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Mahdia',
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 20 }
      ])
    },
  ];

  // ============================================================
  // HAMMAMET ONLY
  // ============================================================
  const hammametOnly = [
    // VIP Private Catamaran with Dolphin Search (Hammamet) — 2-6h, from £155/boat, max 15p
    {
      name: 'VIP Private Catamaran with Dolphin Search (Hammamet)',
      description: '⛵ 2-6h private catamaran charter with dolphin search, swimming & relaxation. Priced per boat, up to 15 persons. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Boat Trips',
      price: 155,
      duration: 4,
      maxParticipants: 15,
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Hammamet',
      pricingOptions: JSON.stringify([
        { label: 'From (Per Boat, max 15p)', price: 155 }
      ])
    },

    // VIP Private Fishing Boat (Hammamet) — 2-4h, from £155/boat, max 6p
    {
      name: 'VIP Private Fishing Boat (Hammamet)',
      description: '🎣 2-4h private fishing charter with dolphin search included. Priced per boat, up to 6 persons. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Boat Trips',
      price: 155,
      duration: 3,
      maxParticipants: 6,
      image: 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Hammamet',
      pricingOptions: JSON.stringify([
        { label: 'From (Per Boat, max 6p)', price: 155 }
      ])
    },

    // Quad Bike Adventure (Hammamet) — 2h, £25/£30
    {
      name: 'Quad Bike Adventure (Hammamet)',
      description: '🏍️ 2-hour off-road quad ride through nature trails. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Land Adventures',
      price: 25,
      duration: 2,
      maxParticipants: 2,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
      difficulty: 'Intermediate',
      location: 'Hammamet',
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 25 },
        { label: '2 Persons (Same Quad)', participants: 2, price: 30 }
      ])
    },

    // Camel Ride (Hammamet) — 2h, £25
    {
      name: 'Camel Ride (Hammamet)',
      description: '🐫 2-hour camel ride discovering the Tunisian countryside. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Traditional Experiences',
      price: 25,
      duration: 2,
      maxParticipants: 1,
      image: 'https://images.unsplash.com/photo-1542731965-02c7c6ad2772?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Hammamet',
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 25 }
      ])
    },

    // Mountain Horse Ride (Hammamet) — 1h30, £25
    {
      name: 'Mountain Horse Ride (Hammamet)',
      description: '🐎 1h30 horse ride along mountain trails with scenic landscapes. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Traditional Experiences',
      price: 25,
      duration: 1.5,
      maxParticipants: 1,
      image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Hammamet',
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 25 }
      ])
    },

    // Beach Horse Ride (Hammamet) — 2h, £30
    {
      name: 'Beach Horse Ride (Hammamet)',
      description: '🐎 2-hour horse ride along the beach with coastal views. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Traditional Experiences',
      price: 30,
      duration: 2,
      maxParticipants: 1,
      image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Hammamet',
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 30 }
      ])
    },

    // Catamaran Outing with Dolphin Search (Hammamet, Group) — 3h, £30
    {
      name: 'Catamaran Outing with Dolphin Search (Hammamet)',
      description: '⛵ 3-hour group catamaran outing with dolphin search and panoramic sea views. Includes FREE pickup & drop-off 🚐 | 📸 Photos & videos included',
      category: 'Boat Trips',
      price: 30,
      duration: 3,
      maxParticipants: 15,
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Hammamet',
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 30 }
      ])
    },
  ];

  // ============================================================
  // EXCURSIONS — Available from all locations
  // ============================================================
  const excursions = [
    // 18. Tunis Cultural Tour
    {
      name: 'Tunis/Carthage/Sidi Bou Said/Bardo',
      description: '🏛️ Full day cultural tour with VIP car & private guide. Explore ancient Carthage, blue & white Sidi Bou Said, Bardo Museum treasures. Includes FREE pickup & drop-off 🚐',
      category: 'Excursions',
      price: 60,
      duration: 8,
      maxParticipants: 1,
      image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Sousse, Monastir, Mahdia',
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 60 }
      ])
    },

    // 19. Kairouan & El Jem
    {
      name: 'Kairouan & El Jem Coliseum',
      description: '🏛️ Half day historical tour with VIP car & private guide. Visit holy Kairouan & magnificent El Jem Roman Coliseum. Includes FREE pickup & drop-off 🚐',
      category: 'Excursions',
      price: 45,
      duration: 4,
      maxParticipants: 1,
      image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Sousse, Monastir, Mahdia',
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 45 }
      ])
    },

    // 20. Takrouna & Hergla
    {
      name: 'Takrouna Mountain Village & Hergla',
      description: '⛰️ Half day scenic tour with VIP car & private guide. Explore traditional mountain village Takrouna & pristine Hergla beaches. Includes FREE pickup & drop-off 🚐',
      category: 'Excursions',
      price: 30,
      duration: 4,
      maxParticipants: 1,
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Sousse, Monastir, Mahdia',
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 30 }
      ])
    },

    // 21. Monastir & Sousse
    {
      name: 'Monastir Ribat & Sousse Medina',
      description: '🕌 Half day cultural tour with VIP car & private guide. Discover historic Monastir fortress & vibrant Sousse Medina. Includes FREE pickup & drop-off 🚐',
      category: 'Excursions',
      price: 45,
      duration: 4,
      maxParticipants: 1,
      image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Sousse, Monastir, Mahdia',
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 45 }
      ])
    },

    // 22. Mahdia
    {
      name: 'Mahdia Medina & Crystal Beaches',
      description: '🏖️ Half day relaxation tour with VIP car & private guide. Explore charming Mahdia Medina & swim at crystal-clear beaches. Includes FREE pickup & drop-off 🚐',
      category: 'Excursions',
      price: 30,
      duration: 4,
      maxParticipants: 1,
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Sousse, Monastir, Mahdia',
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 30 }
      ])
    },

    // 23. Friguia Zoo
    {
      name: 'Friguia African Zoo',
      description: '🦁 Half day wildlife adventure with VIP car & private guide. Meet African animals in Tunisia\'s premier zoo. Perfect for families! Includes FREE pickup & drop-off 🚐',
      category: 'Excursions',
      price: 30,
      duration: 4,
      maxParticipants: 1,
      image: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800&q=80',
      difficulty: 'Beginner',
      location: 'Sousse, Monastir, Mahdia',
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 30 }
      ])
    }
  ];

  const allActivities = [...sharedActivities, ...sousseOnly, ...monastirOnly, ...mahdiaOnly, ...hammametOnly, ...excursions];

  for (const activity of allActivities) {
    insertActivity.run(
      activity.name,
      activity.description,
      activity.category,
      activity.price,
      activity.duration,
      activity.maxParticipants,
      activity.image,
      activity.difficulty,
      activity.location,
      activity.pricingOptions,
      1,
      now,
      now
    );
  }

  console.log(`✅ Successfully added ${allActivities.length} activities with pricing options!`);
  console.log('🎉 Activity update completed!');
}

// Run the update
try {
  seedActivitiesNew();
} catch (error) {
  console.error('❌ Error updating activities:', error);
}
