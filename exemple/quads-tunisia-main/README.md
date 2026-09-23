# Quads Tunisia

A full-stack web application built with React and Node.js.

## Project Structure

```
aquasports/
├── backend/          # Node.js + Express backend
│   ├── server.js     # Main server file
│   ├── package.json
│   └── .env          # Environment variables
├── frontend/         # React + Vite frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The backend server will run on `http://localhost:5001`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5174`

## Available Scripts

### Backend
- `npm start` - Run the server in production mode
- `npm run dev` - Run the server with nodemon for development

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Endpoints

- `GET /` - Welcome message
- `GET /api/health` - Health check endpoint

## Branding

The supplied illustrated logo is installed at frontend/public/brand-logo.png and used in the navigation, footer, admin screens, and browser icon. The original activity catalog, contact information, and demo login are retained. This copy has its own SQLite database.
