import { Link, useLocation, useNavigate } from 'react-router-dom';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin', icon: '📊', label: 'Dashboard', exact: true },
    { path: '/admin/bookings', icon: '📅', label: 'Bookings' },
    { path: '/admin/activities', icon: '🏄', label: 'Activities' },
    { path: '/admin/reviews', icon: '⭐', label: 'Reviews' },
    { path: '/admin/users', icon: '👥', label: 'Users' },
  ];

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <aside className="w-64 bg-white dark:bg-[#29231c] border-r border-gray-200 dark:border-gray-700 min-h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <Link to="/admin" className="flex items-center space-x-3">
          <img src="/brand-logo.png" alt="Quads Tunisia" width="64" height="64" className="bg-white rounded-lg object-contain shrink-0" />
          <div>
            <h1 className="text-xl font-black text-[#422919] dark:text-white">Quads Tunisia</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(item)
                    ? 'bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="font-semibold">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-[#f97316] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold">
              {storedUser?.name?.charAt(0)?.toUpperCase() || storedUser?.email?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#422919] dark:text-white truncate">
              {storedUser?.name || 'Admin User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {storedUser?.email || 'admin@aquasports.com'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/"
            className="flex-1 text-center py-2 px-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-medium"
          >
            ← Site
          </Link>
          <button
            onClick={handleLogout}
            className="flex-1 text-center py-2 px-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-xs font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
