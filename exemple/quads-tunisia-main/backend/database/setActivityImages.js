const db = require('./db');

const mapping = {
  222: { file: 'Parasailing.jpg', exact: true },
  223: { file: 'Jet Ski (10 Minutes).jpg', exact: true },
  224: { file: '- Water Inflatables (Banana & Big Mable).jpg', exact: true },
  225: { file: 'Quad Bike - Forest Adventure.jpg', exact: true },
  226: { file: 'Berber Camel & Horse Carriage Ride.jpg', exact: true },
  227: { file: 'Private Horse Beach Ride.jpg', exact: true },
  228: { file: 'Karting Ride.jpg', exact: true },
  229: { file: 'Scuba Diving Adventure.jpg', exact: true },
  230: { file: 'Quad Bike - Forest Adventure.jpg', exact: false },
  231: { file: 'Pirate Boat Trip Mahdia.jpg', exact: false },
  232: { file: 'Catamaran Group Ride (Monastir).jpg', exact: true },
  233: { file: 'Glass Bottom Boat Group Ride (Monastir).jpg', exact: true },
  234: { file: 'Pirate Boat Trip Mahdia.jpg', exact: false },
  235: { file: 'Morning Dolphin Ride (Mahdia).jpg', exact: true },
  236: { file: 'Quad Bike - Forest Adventure.jpg', exact: false },
  237: { file: 'Private Horse Beach Ride (Mahdia).jpg', exact: true },
  238: { file: 'Pirate Boat Trip Mahdia.jpg', exact: true },
  239: { file: 'sidbousaid.jpg', exact: true },
  240: { file: '- Kairouan & El Jem Coliseum.jpg', exact: true },
  241: { file: 'Takrouna Mountain Village & Hergla.jpg', exact: true },
  242: { file: 'Monastir Ribat & Sousse Medina.jpg', exact: true },
  243: { file: 'Mahdia Medina & Crystal Beaches.jpg', exact: true },
  244: { file: 'Friguia African Zoo.jpg', exact: true },
};

const update = db.prepare('UPDATE activities SET image = ?, updatedAt = ? WHERE id = ?');
const now = new Date().toISOString();

const tx = db.transaction(() => {
  for (const [id, { file }] of Object.entries(mapping)) {
    const url = encodeURI('/' + file);
    update.run(url, now, Number(id));
  }
});
tx();

const rows = db.prepare('SELECT id, name, image FROM activities ORDER BY id').all();
for (const r of rows) console.log(`${r.id} | ${r.name} -> ${r.image}`);
