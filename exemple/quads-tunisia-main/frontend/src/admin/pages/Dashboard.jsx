import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import StatCard from '../components/StatCard';
import { bookingsAPI, usersAPI, activitiesAPI } from '../../utils/api';
import { SkeletonStatCard, SkeletonDashboardTable } from '../../components/Skeleton';

const Dashboard = () => {
  const [stats, setStats] = useState({
    bookings: null,
    users: null,
    activities: null,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [bookingStats, userStats, activitiesData, bookingsData] = await Promise.all([
        bookingsAPI.getStats(),
        usersAPI.getStats(),
        activitiesAPI.getAll(),
        bookingsAPI.getAll(),
      ]);

      setStats({
        bookings: bookingStats.data,
        users: userStats.data,
        activities: activitiesData.data,
      });

      // Get 5 most recent bookings
      setRecentBookings(bookingsData.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Pending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-[#422919] dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard title="Total Revenue" value={`£${stats.bookings?.totalRevenue?.toFixed(2) || '0.00'}`} icon="💰" color="cyan" trend="up" trendValue="+12.5%" />
            <StatCard title="Total Bookings" value={stats.bookings?.totalBookings || 0} icon="📅" color="blue" trend="up" trendValue={`+${stats.bookings?.recentBookings || 0} this week`} />
            <StatCard title="Active Users" value={stats.users?.activeUsers || 0} icon="👥" color="green" trend="up" trendValue={`+${stats.users?.newUsers || 0} new`} />
            <StatCard title="Activities" value={stats.activities?.length || 0} icon="🏄" color="purple" />
          </>
        )}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-[#29231c] rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-[#422919] dark:text-white mb-4">
            Booking Status
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Pending</span>
              <span className="font-bold text-orange-500">
                {stats.bookings?.pendingBookings || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Confirmed</span>
              <span className="font-bold text-green-500">
                {stats.bookings?.confirmedBookings || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Completed</span>
              <span className="font-bold text-blue-500">
                {stats.bookings?.completedBookings || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#29231c] rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-[#422919] dark:text-white mb-4">
            Revenue Status
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Paid</span>
              <span className="font-bold text-green-500">
                £{stats.bookings?.totalRevenue?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Pending</span>
              <span className="font-bold text-orange-500">
                £{stats.bookings?.pendingRevenue?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#29231c] rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-[#422919] dark:text-white mb-4">
            User Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Customers</span>
              <span className="font-bold text-[#f97316]">
                {stats.users?.customerUsers || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Admins</span>
              <span className="font-bold text-purple-500">
                {stats.users?.adminUsers || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white dark:bg-[#29231c] rounded-2xl shadow-lg p-6">
        <h3 className="text-2xl font-black text-[#422919] dark:text-white mb-6">
          Recent Bookings
        </h3>
        {loading && <SkeletonDashboardTable rows={5} />}
        {!loading && <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">
                  Customer
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">
                  Activity
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">
                  Date
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">
                  Amount
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-semibold text-[#422919] dark:text-white">
                        {booking.customerName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {booking.customerEmail}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                    {booking.activityName}
                  </td>
                  <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                    {new Date(booking.date).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 font-semibold text-[#422919] dark:text-white">
                    £{booking.totalPrice.toFixed(2)}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
