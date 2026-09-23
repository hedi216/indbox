# Quads Tunisia Admin Dashboard

A comprehensive admin dashboard for managing your Quads Tunisia business.

## Features

### 📊 Dashboard
- Real-time analytics and statistics
- Revenue tracking (paid and pending)
- Booking status overview
- Recent bookings list
- User statistics

### 📅 Bookings Management
- View all customer bookings
- Filter by status (Pending, Confirmed, Completed, Cancelled)
- Update booking status
- Edit booking details
- Delete bookings
- Complete booking information with customer details

### 🏄 Activities Management
- Add new water sports activities
- Edit existing activities
- Delete activities
- Toggle activity status (active/inactive)
- Manage pricing, duration, and capacity
- Set difficulty levels
- Categorize activities

### 👥 User Management
- View all users (customers and admins)
- Add new users
- Edit user details
- Enable/disable user accounts
- Filter by role and status
- Delete users (with protection for last admin)

## Access

### Admin Login
- URL: `http://localhost:5173/admin/login`
- Demo Credentials:
  - Email: `admin@aquasports.com`
  - Password: `admin123`

### Admin Routes
- Dashboard: `/admin`
- Bookings: `/admin/bookings`
- Activities: `/admin/activities`
- Users: `/admin/users`

## Design Features

The admin dashboard follows the same design patterns as the main site:

- ✨ Tailwind CSS with custom color palette
- 🌙 Dark mode support
- 🎨 Gradient accents (Ocean Blue to Turquoise)
- 📱 Fully responsive design
- 🎯 Consistent component patterns
- ⚡ Smooth transitions and animations
- 🎭 Glass morphism effects

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify token

### Activities
- `GET /api/activities` - Get all activities
- `GET /api/activities/:id` - Get single activity
- `POST /api/activities` - Create activity (admin only)
- `PUT /api/activities/:id` - Update activity (admin only)
- `DELETE /api/activities/:id` - Delete activity (admin only)

### Bookings
- `GET /api/bookings` - Get all bookings (authenticated)
- `GET /api/bookings/stats` - Get booking statistics (admin only)
- `GET /api/bookings/:id` - Get single booking
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking (admin only)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/stats` - Get user statistics (admin only)
- `GET /api/users/:id` - Get single user (admin only)
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

## Tech Stack

### Backend
- Node.js + Express
- **SQLite Database** (persistent, file-based storage)
- RESTful API architecture
- JWT-like token authentication (mock implementation)
- Middleware for authentication and authorization
- better-sqlite3 for database operations

### Frontend
- React 19
- React Router 7
- Tailwind CSS
- Custom hooks and components
- Fetch API for HTTP requests

## Running the Admin Dashboard

1. **Start the Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Backend runs on `http://localhost:5000`

   **Note:** The SQLite database (`aquasports.db`) is automatically created on first run with seed data.

2. **Start the Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

3. **Access Admin Panel:**
   - Navigate to `http://localhost:5173/admin/login`
   - Login with demo credentials
   - Start managing your business!

## Database

The application uses **SQLite** for persistent data storage:

- **Database File:** `backend/database/aquasports.db`
- **Automatic Creation:** Created on first server start
- **Auto-Seeding:** Populated with demo data (only once)
- **Persistent:** Data survives server restarts
- **Backup:** Simply copy the `.db` file

For detailed database documentation, see [DATABASE.md](DATABASE.md)

## Future Enhancements

- ✅ ~~Real database integration~~ **Done! Using SQLite**
- Email notifications for bookings
- PDF invoice generation
- Advanced analytics with charts
- File upload for activity images
- Calendar view for bookings
- Export data to CSV/Excel
- Real-time notifications
- Multi-language support
- Payment gateway integration

## Security Notes

⚠️ **Important for Production:**

1. Replace mock authentication with proper JWT tokens
2. Hash passwords using bcrypt
3. Add input validation and sanitization
4. Implement rate limiting
5. Add HTTPS/SSL certificates
6. Use environment variables for sensitive data
7. Implement proper session management
8. Add CSRF protection
9. Enable CORS only for trusted domains
10. Regular security audits

## Support

For questions or issues, please refer to the main README.md or contact the development team.
