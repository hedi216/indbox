# Quads Tunisia Database Documentation

## Database Type: SQLite

Your Quads Tunisia application now uses **SQLite** - a file-based, persistent database.

## Benefits

✅ **Persistent Storage** - All data survives server restarts
✅ **Zero Configuration** - No database server to install
✅ **Portable** - Single file database (`backend/database/aquasports.db`)
✅ **Production Ready** - Perfect for small to medium applications
✅ **Easy Backup** - Just copy the `.db` file
✅ **Fast Performance** - Optimized for local operations

## Database Location

```
backend/database/aquasports.db
```

This file is automatically created when you first run the server.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
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
```

### Activities Table
```sql
CREATE TABLE activities (
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
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
)
```

### Bookings Table
```sql
CREATE TABLE bookings (
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
```

## Initial Data

The database is automatically seeded with:
- **4 Users** (1 admin, 3 customers)
- **6 Activities** (Jet Skiing, Scuba Diving, Parasailing, Snorkeling, Kayaking, Sunset Cruise)
- **5 Bookings** (Various statuses and dates)

**Seeding only happens once!** If data already exists, seeding is skipped.

## Database Operations

### Backup Your Database
```bash
# Copy the database file
cp backend/database/aquasports.db backend/database/aquasports_backup.db
```

### Reset Database
```bash
# Delete the database file and restart the server
rm backend/database/aquasports.db
cd backend && npm run dev
# Database will be recreated with initial seed data
```

### View Database Contents
You can use any SQLite viewer:

**Option 1: Command Line**
```bash
cd backend/database
sqlite3 aquasports.db
.tables              # List all tables
SELECT * FROM users; # Query users
.exit
```

**Option 2: VS Code Extension**
- Install "SQLite Viewer" extension
- Right-click `aquasports.db` → Open With → SQLite Viewer

**Option 3: Online Tool**
- Use https://sqliteviewer.app/
- Upload your `aquasports.db` file

## How Data Persists

### Before (In-Memory)
```javascript
// Data stored in arrays - lost on restart
const store = {
  users: [],
  activities: [],
  bookings: []
};
```

### After (SQLite)
```javascript
// Data stored in SQLite file - persists forever
const db = require('./database/db');
const users = db.prepare('SELECT * FROM users').all();
```

## Migration Notes

All your API endpoints work exactly the same! The only difference is:
- **Old:** Data reset on server restart
- **New:** Data persists in `aquasports.db`

No frontend changes needed - your admin dashboard continues to work perfectly!

## Scaling to Bigger Databases

If your business grows significantly, you can migrate to:

### PostgreSQL (Recommended for growth)
```bash
npm install pg sequelize
```

### MySQL
```bash
npm install mysql2 sequelize
```

### MongoDB (NoSQL)
```bash
npm install mongoose
```

**But SQLite is perfect for now!** Most businesses never outgrow SQLite.

## Security Notes

⚠️ **Important:**
1. The `.db` file is in `.gitignore` - won't be committed to Git
2. Passwords are stored as plain text - use bcrypt in production
3. Backup your database regularly
4. Restrict file system access to the database file

## Support

For database issues:
1. Check server logs for errors
2. Verify `backend/database/aquasports.db` exists
3. Delete and restart to reset database
4. Check file permissions

## Quick Reference

| Task | Command |
|------|---------|
| Start Server | `cd backend && npm run dev` |
| View Database | `sqlite3 backend/database/aquasports.db` |
| Backup Database | `cp backend/database/aquasports.db backup.db` |
| Reset Database | `rm backend/database/aquasports.db` then restart |
| List Tables | In sqlite3: `.tables` |
| View Data | In sqlite3: `SELECT * FROM table_name;` |

---

**Your data is now persistent and safe! 🎉**
