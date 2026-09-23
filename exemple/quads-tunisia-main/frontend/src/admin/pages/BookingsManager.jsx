import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { bookingsAPI } from '../../utils/api';
import { useToast } from '../../components/Toast';
import { SkeletonTableRow } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

const BookingsManager = () => {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editingBooking, setEditingBooking] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingsAPI.getAll();
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await bookingsAPI.update(bookingId, { status: newStatus });
      fetchBookings();
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking status');
    }
  };

  const handleDelete = async (bookingId) => {
    const confirmed = await toast.confirm(
      'This booking will be permanently removed and cannot be recovered.',
      { title: 'Delete Booking?', confirmLabel: 'Delete', danger: true }
    );
    if (!confirmed) return;

    try {
      await bookingsAPI.delete(bookingId);
      fetchBookings();
      toast.success('Booking deleted successfully');
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Failed to delete booking');
    }
  };

  const handleEdit = (booking) => {
    setEditingBooking({ ...booking });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await bookingsAPI.update(editingBooking.id, editingBooking);
      setShowEditModal(false);
      setEditingBooking(null);
      fetchBookings();
      toast.success('Booking updated successfully');
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Pending':   return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:          return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const q = search.toLowerCase();
  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = filter === 'all' || b.status === filter;
    const matchesSearch = !q || (
      b.customerName?.toLowerCase().includes(q) ||
      b.customerEmail?.toLowerCase().includes(q) ||
      b.activityName?.toLowerCase().includes(q) ||
      String(b.id).includes(q)
    );
    return matchesFilter && matchesSearch;
  });

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-[#422919] dark:text-white mb-2">Bookings Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage and track all customer bookings</p>
      </div>

      {/* Filter + Search bar */}
      <div className="bg-white dark:bg-[#29231c] rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Status filters */}
          <div className="flex flex-wrap gap-2 flex-1">
            {['all', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all ${
                  filter === status
                    ? 'bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search bookings…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none text-sm w-52"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#29231c] rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {['ID', 'Customer', 'Activity', 'Date', 'Participants', 'Total', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left py-4 px-6 font-bold text-gray-700 dark:text-gray-300">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => <SkeletonTableRow key={i} cols={8} />)
                : filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                      <td className="py-4 px-6 text-gray-600 dark:text-gray-400 font-mono text-sm">#{booking.id}</td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-[#422919] dark:text-white">{booking.customerName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{booking.customerEmail}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{booking.customerPhone}</p>
                      </td>
                      <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">{booking.activityName}</td>
                      <td className="py-4 px-6 text-gray-700 dark:text-gray-300">{new Date(booking.date).toLocaleDateString()}</td>
                      <td className="py-4 px-6 text-gray-700 dark:text-gray-300">{booking.participants}</td>
                      <td className="py-4 px-6 font-bold text-[#422919] dark:text-white">£{booking.totalPrice.toFixed(2)}</td>
                      <td className="py-4 px-6">
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                          className={`px-3 py-1 rounded-lg text-sm font-semibold border-2 cursor-pointer ${getStatusColor(booking.status)}`}
                        >
                          {['Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <button onClick={() => handleEdit(booking)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">Edit</button>
                          <button onClick={() => handleDelete(booking.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>

          {/* Empty state */}
          {!loading && filteredBookings.length === 0 && (
            <EmptyState
              type={search ? 'search' : 'bookings'}
              title={search ? 'No results found' : 'No bookings yet'}
              subtitle={search ? `No bookings match "${search}". Try a different search term.` : 'Customer bookings will appear here once they start coming in.'}
            />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#29231c] rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <h2 className="text-2xl font-black text-[#422919] dark:text-white mb-6">Edit Booking</h2>
            <div className="space-y-4">
              {[
                { label: 'Customer Name', key: 'customerName', type: 'text' },
                { label: 'Email', key: 'customerEmail', type: 'email' },
                { label: 'Phone', key: 'customerPhone', type: 'text' },
                { label: 'Date', key: 'date', type: 'date' },
                { label: 'Participants', key: 'participants', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</label>
                  <input
                    type={type}
                    min={type === 'number' ? 1 : undefined}
                    value={editingBooking[key]}
                    onChange={(e) => setEditingBooking({ ...editingBooking, [key]: type === 'number' ? parseInt(e.target.value) : e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => { setShowEditModal(false); setEditingBooking(null); }} className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors font-semibold">Cancel</button>
              <button onClick={handleSaveEdit} className="px-6 py-3 bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white rounded-lg hover:opacity-90 transition-opacity font-semibold shadow-lg">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default BookingsManager;
