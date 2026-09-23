import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { usersAPI } from '../../utils/api';
import { useToast } from '../../components/Toast';
import { SkeletonTableRow } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

const UsersManager = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', role: 'customer', isActive: true });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await usersAPI.update(editingUser.id, updateData);
        toast.success('User updated successfully');
      } else {
        await usersAPI.create(formData);
        toast.success('User created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.message || 'Failed to save user');
    }
  };

  const handleEdit = (user) => { setEditingUser(user); setFormData({ ...user, password: '' }); setShowModal(true); };

  const handleDelete = async (id) => {
    const confirmed = await toast.confirm(
      'This user account will be permanently removed.',
      { title: 'Delete User?', confirmLabel: 'Delete', danger: true }
    );
    if (!confirmed) return;
    try {
      await usersAPI.delete(id);
      fetchUsers();
      toast.success('User deleted');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await usersAPI.update(user.id, { isActive: !user.isActive });
      fetchUsers();
      toast.success(user.isActive ? 'User disabled' : 'User enabled');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', phone: '', role: 'customer', isActive: true });
    setEditingUser(null);
  };

  const q = search.toLowerCase();
  const filteredUsers = users.filter((u) => {
    const matchesFilter = filter === 'all' || (filter === 'active' ? u.isActive : filter === 'inactive' ? !u.isActive : u.role === filter);
    const matchesSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#422919] dark:text-white mb-2">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage customer accounts and admin users</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="px-6 py-3 bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white rounded-xl hover:opacity-90 transition-opacity font-semibold shadow-lg whitespace-nowrap">
          + Add User
        </button>
      </div>

      {/* Filter + Search */}
      <div className="bg-white dark:bg-[#29231c] rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-wrap gap-2 flex-1">
            {['all', 'admin', 'customer', 'active', 'inactive'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all ${
                  filter === status
                    ? 'bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search users…"
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
                {['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left py-4 px-6 font-bold text-gray-700 dark:text-gray-300">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => <SkeletonTableRow key={i} cols={8} />)
                : filteredUsers.map((user) => (
                    <tr key={user.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                      <td className="py-4 px-6 text-gray-600 dark:text-gray-400 font-mono text-sm">#{user.id}</td>
                      <td className="py-4 px-6 font-semibold text-[#422919] dark:text-white">{user.name}</td>
                      <td className="py-4 px-6 text-gray-700 dark:text-gray-300">{user.email}</td>
                      <td className="py-4 px-6 text-gray-700 dark:text-gray-300">{user.phone || 'N/A'}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>{user.role}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>{user.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="py-4 px-6 text-gray-700 dark:text-gray-300 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <button onClick={() => handleEdit(user)} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium">Edit</button>
                          <button onClick={() => handleToggleActive(user)} className={`px-3 py-1 rounded transition-colors text-sm font-medium ${user.isActive ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-green-500 text-white hover:bg-green-600'}`}>{user.isActive ? 'Disable' : 'Enable'}</button>
                          <button onClick={() => handleDelete(user.id)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>

          {!loading && filteredUsers.length === 0 && (
            <EmptyState
              type={search ? 'search' : 'users'}
              title={search ? 'No results found' : 'No users yet'}
              subtitle={search ? `No users match "${search}".` : 'User accounts will appear here once people register.'}
              action={!search ? { label: '+ Add User', onClick: () => { resetForm(); setShowModal(true); } } : null}
            />
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#29231c] rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <h2 className="text-2xl font-black text-[#422919] dark:text-white mb-6">{editingUser ? 'Edit User' : 'Add New User'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password {editingUser ? '(leave blank to keep current)' : '*'}</label>
                <input type="password" required={!editingUser} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Role *</label>
                <select required value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none">
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-5 h-5 text-[#f97316] rounded focus:ring-[#f97316]" />
                <label htmlFor="isActive" className="ml-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Active Account</label>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors font-semibold">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white rounded-lg hover:opacity-90 transition-opacity font-semibold shadow-lg">{editingUser ? 'Save Changes' : 'Add User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default UsersManager;
