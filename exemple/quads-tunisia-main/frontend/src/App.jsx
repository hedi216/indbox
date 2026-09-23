import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import ScrollProgress from './components/ScrollProgress';
import SocialProof from './components/SocialProof';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import Booking from './pages/Booking';
import LocationSelect from './pages/LocationSelect';
import ActivityDetail from './pages/ActivityDetail';
import MyBookings from './pages/MyBookings';
import NotFound from './pages/NotFound';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Admin imports
import AdminLogin from './admin/pages/AdminLogin';
import Dashboard from './admin/pages/Dashboard';
import BookingsManager from './admin/pages/BookingsManager';
import ActivitiesManager from './admin/pages/ActivitiesManager';
import ReviewsManager from './admin/pages/ReviewsManager';
import UsersManager from './admin/pages/UsersManager';

// Guard: only allow access if logged in as admin
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('authToken');
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();
  if (!token || !user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function App() {
  return (
    <ToastProvider>
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute><BookingsManager /></ProtectedRoute>} />
        <Route path="/admin/activities" element={<ProtectedRoute><ActivitiesManager /></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute><ReviewsManager /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><UsersManager /></ProtectedRoute>} />

        {/* Public Routes */}
        <Route
          path="/*"
          element={
            <div className="relative min-h-screen w-full overflow-x-clip bg-[#fff8ed] dark:bg-[#29231c]">
              <ScrollProgress />
              <SocialProof />
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/locations" element={<LocationSelect />} />
                <Route path="/booking/:location" element={<Booking />} />
                <Route path="/activity/:id" element={<ActivityDetail />} />
                <Route path="/my-bookings" element={<MyBookings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Footer />
            </div>
          }
        />
      </Routes>
    </Router>
    </ToastProvider>
  );
}

export default App;
