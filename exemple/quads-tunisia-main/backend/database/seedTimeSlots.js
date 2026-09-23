const db = require('./db');

// Time slots per the official price sheet
const timeSlotsByName = {
  // Mahdia: 9-10am or 10-11am
  'Morning Dolphin Ride (Mahdia)': ['09:00 - 10:00', '10:00 - 11:00'],

  // Sunrise / Sunset rides
  'Private Horse Beach Ride': ['Sunrise (06:00 - 07:00)', 'Sunset (18:00 - 19:00)'],
  'Private Horse Beach Ride (Mahdia)': ['Sunrise (06:00 - 07:30)', 'Sunset (17:30 - 19:00)'],

  // VIP boat charters: morning / afternoon / sunset
  'VIP Catamaran & Dolphin Trip (Private)': ['Morning (09:00)', 'Afternoon (14:00)', 'Sunset (17:00)'],
  'VIP Private Fishing Boat': ['Morning (07:00)', 'Afternoon (13:00)', 'Sunset (16:00)'],

  // Group catamaran / glass-bottom — typically morning or afternoon
  'Catamaran Group Ride (Monastir)': ['Morning (10:00)', 'Afternoon (15:00)'],
  'Glass Bottom Boat Group Ride (Monastir)': ['Morning (10:00)', 'Afternoon (15:00)'],

  // Pirate trips include lunch — midday departure
  'Pirate Boat Trip Sousse': ['Midday (10:00 - 12:00)'],
  'Pirate Boat Trip Mahdia': ['Midday (10:00 - 12:00)'],
  'Pirate Boat to Kuriat Island': ['Midday (10:00 - 12:00)'],

  // Camel & carriage — usually morning or late afternoon
  'Berber Camel & Horse Carriage Ride': ['Morning (09:00)', 'Late Afternoon (16:00)'],
};

const update = db.prepare('UPDATE activities SET timeSlots = ?, updatedAt = ? WHERE name = ?');
const now = new Date().toISOString();

const tx = db.transaction(() => {
  for (const [name, slots] of Object.entries(timeSlotsByName)) {
    const info = update.run(JSON.stringify(slots), now, name);
    console.log(`${info.changes ? 'OK' : 'NOT FOUND'} | ${name} -> ${slots.join(', ')}`);
  }
});
tx();

console.log('\n── Activities with time slots ──');
const rows = db.prepare("SELECT id, name, timeSlots FROM activities WHERE timeSlots IS NOT NULL ORDER BY id").all();
for (const r of rows) console.log(`${r.id} | ${r.name} -> ${r.timeSlots}`);
