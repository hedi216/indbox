import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);

      if (response.success) {
        // Check if user is admin
        if (response.data.user.role !== 'admin') {
          setError('Access denied. Admin privileges required.');
          authAPI.logout();
          return;
        }

        // Redirect to admin dashboard
        navigate('/admin');
      }
    } catch (error) {
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#c45112] to-[#fbbf24] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#29231c] rounded-3xl shadow-2xl max-w-md w-full p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/brand-logo.png" alt="Quads Tunisia" width="180" height="150" className="bg-white rounded-xl object-contain mx-auto mb-4" />
          <h1 className="text-3xl font-black text-[#422919] dark:text-white mb-2">
            Quads Tunisia Admin
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to access the admin panel
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none transition-colors"
              placeholder="admin@aquasports.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white rounded-lg hover:opacity-90 transition-opacity font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
            Demo Credentials:
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Email: admin@aquasports.com
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Password: admin123
          </p>
        </div>

        {/* Back to Site Link */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-[#f97316] hover:text-[#c45112] font-semibold transition-colors"
          >
            ← Back to Website
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
