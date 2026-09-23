const db = require('./db');

const now = new Date().toISOString();

// ── Updates to existing rows ──────────────────────────────────────────────
const updates = [
  {
    id: 226, // Berber Camel & Horse Carriage Ride — duration 2h → 2h30
    fields: { duration: 2.5 },
  },
  {
    id: 228, // Karting Ride — sheet says 20min for £28
    fields: {
      price: 28,
      duration: 0.33,
      pricingOptions: JSON.stringify([
        { label: '20 Minutes', duration: 0.33, price: 28 },
      ]),
    },
  },
  {
    id: 231, // Pirate Boat Trip Sousse — £25
    fields: {
      price: 25,
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 25 },
      ]),
    },
  },
  {
    id: 232, // Catamaran Group Ride (Monastir) — £25 pp, min 2
    fields: {
      price: 25,
      pricingOptions: JSON.stringify([
        { label: 'Per Person (min 2 to book)', participants: 2, price: 25 },
      ]),
    },
  },
  {
    id: 233, // Glass Bottom Boat Group Ride (Monastir) — £20 pp, min 2, duration 1h
    fields: {
      price: 20,
      duration: 1,
      pricingOptions: JSON.stringify([
        { label: 'Per Person (min 2 to book)', participants: 2, price: 20 },
      ]),
    },
  },
  {
    id: 238, // Pirate Boat Trip Mahdia — £25
    fields: {
      price: 25,
      pricingOptions: JSON.stringify([
        { label: '1 Person', participants: 1, price: 25 },
      ]),
    },
  },
];

const updateTx = db.transaction(() => {
  for (const { id, fields } of updates) {
    const cols = Object.keys(fields);
    const sql = `UPDATE activities SET ${cols.map(c => `${c} = ?`).join(', ')}, updatedAt = ? WHERE id = ?`;
    const params = [...cols.map(c => fields[c]), now, id];
    db.prepare(sql).run(...params);
  }
});
updateTx();

// ── New VIP rows (only insert if not already present) ─────────────────────
const newRows = [
  {
    name: 'VIP Catamaran & Dolphin Trip (Private)',
    description: 'Private catamaran charter with dolphin spotting, swim stop, soft drinks & fruits. Available morning, afternoon, or sunset. Per-boat pricing, up to 15 guests.',
    category: 'Boat Trips',
    price: 150,
    duration: 2,
    maxParticipants: 15,
    image: encodeURI('/Catamaran Group Ride (Monastir).jpg'),
    difficulty: 'Beginner',
    location: 'Sousse / Monastir',
    pricingOptions: JSON.stringify([
      { label: '2 Hours (Private Boat, up to 15)', duration: 2, price: 150 },
      { label: '4 Hours (Private Boat, up to 15)', duration: 4, price: 300 },
      { label: '6 Hours / Sunset (Private Boat, up to 15)', duration: 6, price: 450 },
    ]),
  },
  {
    name: 'VIP Private Fishing Boat',
    description: 'Private fishing boat with gear included, dolphin sighting, swim stop, soft drinks & fruits. Optional fillet/cook your catch. Per-boat pricing, up to 15 guests.',
    category: 'Boat Trips',
    price: 150,
    duration: 2,
    maxParticipants: 15,
    image: encodeURI('/Pirate Boat Trip Mahdia.jpg'),
    difficulty: 'Beginner',
    location: 'Sousse / Monastir',
    pricingOptions: JSON.stringify([
      { label: '2 Hours (Private Boat, up to 15)', duration: 2, price: 150 },
      { label: '4 Hours (Private Boat, up to 15)', duration: 4, price: 300 },
      { label: '6 Hours (Private Boat, up to 15)', duration: 6, price: 450 },
    ]),
  },
];

const exists = db.prepare('SELECT id FROM activities WHERE name = ?');
const insert = db.prepare(`
  INSERT INTO activities (name, description, category, price, duration, maxParticipants, image, difficulty, location, pricingOptions, isActive, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
`);

for (const r of newRows) {
  if (exists.get(r.name)) {
    console.log(`SKIP (already exists): ${r.name}`);
    continue;
  }
  const info = insert.run(
    r.name, r.description, r.category, r.price, r.duration, r.maxParticipants,
    r.image, r.difficulty, r.location, r.pricingOptions, now, now
  );
  console.log(`ADDED: ${r.name} (id=${info.lastInsertRowid})`);
}

// Verify
console.log('\n── Updated rows ──');
const rows = db.prepare('SELECT id, name, price, duration, pricingOptions FROM activities ORDER BY id').all();
for (const r of rows) console.log(`${r.id} | ${r.name} | £${r.price} | ${r.duration}h`);
