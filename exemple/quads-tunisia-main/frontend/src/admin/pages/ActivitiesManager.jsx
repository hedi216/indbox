import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { activitiesAPI } from '../../utils/api';
import { useToast } from '../../components/Toast';
import { SkeletonActivityCard } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

const CATEGORIES = [
  'Water Sports',
  'Land Adventures',
  'Boat Trips',
  'Traditional Experiences',
  'Diving',
  'Excursions',
];

const EMPTY_OPTION = { label: '', price: '', participants: '', duration: '' };

// Parse the JSON string stored in the DB into an array of rows for the editor.
function parsePricingOptions(raw) {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed.map(o => ({
      label: o.label ?? '',
      price: o.price ?? '',
      participants: o.participants ?? '',
      duration: o.duration ?? '',
      type: o.type ?? '',
    })) : [];
  } catch {
    return [];
  }
}

// Strip empty rows and coerce numeric fields before sending to the API.
function serializePricingOptions(rows) {
  const cleaned = rows
    .filter(r => (r.label && String(r.label).trim()) || r.price !== '' && r.price !== null)
    .map(r => {
      const out = { label: String(r.label).trim() };
      if (r.price !== '' && r.price !== null) out.price = Number(r.price);
      if (r.participants !== '' && r.participants !== null && !isNaN(Number(r.participants))) out.participants = Number(r.participants);
      if (r.duration !== '' && r.duration !== null && !isNaN(Number(r.duration))) out.duration = Number(r.duration);
      if (r.type) out.type = String(r.type).trim();
      return out;
    });
  return cleaned.length ? cleaned : null;
}

const ActivitiesManager = () => {
  const toast = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', category: 'Water Sports', price: '',
    duration: '', maxParticipants: '', difficulty: 'Beginner',
    location: '', image: '', isActive: true,
    pricingOptions: [],
  });

  useEffect(() => { fetchActivities(); }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await activitiesAPI.getAll();
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        pricingOptions: serializePricingOptions(formData.pricingOptions),
      };
      if (editingActivity) {
        await activitiesAPI.update(editingActivity.id, payload);
        toast.success('Activity updated successfully');
      } else {
        await activitiesAPI.create(payload);
        toast.success('Activity created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchActivities();
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.error('Failed to save activity');
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setFormData({
      ...activity,
      pricingOptions: parsePricingOptions(activity.pricingOptions),
    });
    setShowModal(true);
  };

  // ── pricingOptions editor helpers ────────────────────────────────────────
  const addOption = () => setFormData(d => ({ ...d, pricingOptions: [...d.pricingOptions, { ...EMPTY_OPTION }] }));
  const removeOption = (idx) => setFormData(d => ({ ...d, pricingOptions: d.pricingOptions.filter((_, i) => i !== idx) }));
  const updateOption = (idx, key, value) => setFormData(d => ({
    ...d,
    pricingOptions: d.pricingOptions.map((o, i) => i === idx ? { ...o, [key]: value } : o),
  }));

  const handleDelete = async (id) => {
    const confirmed = await toast.confirm(
      'This activity will be permanently deleted along with all related data.',
      { title: 'Delete Activity?', confirmLabel: 'Delete', danger: true }
    );
    if (!confirmed) return;
    try {
      await activitiesAPI.delete(id);
      fetchActivities();
      toast.success('Activity deleted');
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Failed to delete activity');
    }
  };

  const handleToggleActive = async (activity) => {
    try {
      await activitiesAPI.update(activity.id, { isActive: !activity.isActive });
      fetchActivities();
      toast.success(activity.isActive ? 'Activity deactivated' : 'Activity activated');
    } catch (error) {
      console.error('Error updating activity:', error);
      toast.error('Failed to update activity');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', category: 'Water Sports', price: '', duration: '', maxParticipants: '', difficulty: 'Beginner', location: '', image: '', isActive: true, pricingOptions: [] });
    setEditingActivity(null);
  };

  const activityIcon = (name = '') => {
    if (name.toLowerCase().includes('jet'))      return '🛥️';
    if (name.toLowerCase().includes('scuba') || name.toLowerCase().includes('snorkel')) return '🤿';
    if (name.toLowerCase().includes('parasail')) return '🪂';
    if (name.toLowerCase().includes('kayak'))    return '🚣';
    if (name.toLowerCase().includes('cruise'))   return '⛴️';
    return '🏄';
  };

  const q = search.toLowerCase();
  const filteredActivities = activities.filter(a =>
    !q || a.name?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q)
  );

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#422919] dark:text-white mb-2">Activities Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your water sports activities and offerings</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="px-6 py-3 bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white rounded-xl hover:opacity-90 transition-opacity font-semibold shadow-lg whitespace-nowrap">
          + Add Activity
        </button>
      </div>

      {/* Search bar */}
      <div className="bg-white dark:bg-[#29231c] rounded-2xl shadow-lg p-4 mb-6">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search activities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none text-sm"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonActivityCard key={i} />)}
        </div>
      ) : filteredActivities.length === 0 ? (
        <EmptyState
          type={search ? 'search' : 'activities'}
          title={search ? 'No results found' : 'No activities yet'}
          subtitle={search ? `No activities match "${search}".` : 'Add your first activity to get started.'}
          action={!search ? { label: '+ Add Activity', onClick: () => { resetForm(); setShowModal(true); } } : null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className={`bg-white dark:bg-[#29231c] rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all ${!activity.isActive ? 'opacity-60' : ''}`}>
              <div className="h-48 bg-gradient-to-r from-[#c45112] to-[#fbbf24] flex items-center justify-center">
                <span className="text-6xl">{activityIcon(activity.name)}</span>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-black text-[#422919] dark:text-white">{activity.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${activity.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}`}>
                    {activity.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{activity.description}</p>
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Category:</span><span className="font-semibold text-[#422919] dark:text-white">{activity.category}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Price:</span><span className="font-bold text-[#f97316]">£{activity.price}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Duration:</span><span className="font-semibold text-[#422919] dark:text-white">{activity.duration}h</span></div>
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Max Participants:</span><span className="font-semibold text-[#422919] dark:text-white">{activity.maxParticipants}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Difficulty:</span><span className="font-semibold text-[#422919] dark:text-white">{activity.difficulty}</span></div>
                  {(() => {
                    const opts = parsePricingOptions(activity.pricingOptions);
                    if (opts.length === 0) return null;
                    return (
                      <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pricing Options ({opts.length}):</p>
                        <div className="flex flex-wrap gap-1">
                          {opts.map((o, i) => (
                            <span key={i} className="text-xs bg-[#f97316]/10 text-[#f97316] px-2 py-0.5 rounded-md">
                              {o.label}: {o.price}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(activity)} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">Edit</button>
                  <button onClick={() => handleToggleActive(activity)} className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${activity.isActive ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-green-500 text-white hover:bg-green-600'}`}>
                    {activity.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(activity.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#29231c] rounded-2xl shadow-2xl max-w-2xl w-full p-8 my-8">
            <h2 className="text-2xl font-black text-[#422919] dark:text-white mb-6">{editingActivity ? 'Edit Activity' : 'Add New Activity'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Activity Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                <textarea required rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                  <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Difficulty *</label>
                  <select required value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none">
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Price (£) *</label>
                  <input type="number" required min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Duration (hrs) *</label>
                  <input type="number" required min="0.5" step="0.5" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Max Participants *</label>
                  <input type="number" required min="1" value={formData.maxParticipants} onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Location(s) *</label>
                <input type="text" required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Sousse, Monastir, Mahdia, Hammamet" className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Comma-separated. The customer page shows this activity in any matching location.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Image URL</label>
                <input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none" />
              </div>

              {/* Pricing Options editor */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Pricing Options</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Add per-option variants (e.g. <em>1 Person £25 / 2 Persons £30</em>). Leave empty if there's only one flat price above.
                    </p>
                  </div>
                  <button type="button" onClick={addOption} className="px-3 py-1.5 bg-[#f97316] text-[#422919] rounded-lg text-xs font-bold hover:opacity-90 whitespace-nowrap">
                    + Add Option
                  </button>
                </div>
                {formData.pricingOptions.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic py-3">No pricing options — customers will see the single price above.</p>
                ) : (
                  <div className="space-y-2 mt-3">
                    {formData.pricingOptions.map((opt, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-start bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                        <div className="col-span-12 sm:col-span-4">
                          <input
                            type="text"
                            placeholder="Label (e.g. 1 Person)"
                            value={opt.label}
                            onChange={(e) => updateOption(idx, 'label', e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none"
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Price"
                            value={opt.price}
                            onChange={(e) => updateOption(idx, 'price', e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none"
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <input
                            type="number"
                            min="1"
                            placeholder="People"
                            value={opt.participants}
                            onChange={(e) => updateOption(idx, 'participants', e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none"
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Hours"
                            value={opt.duration}
                            onChange={(e) => updateOption(idx, 'duration', e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-[#422919] dark:text-white focus:border-[#f97316] focus:outline-none"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeOption(idx)}
                            aria-label="Remove option"
                            className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-5 h-5 text-[#f97316] rounded focus:ring-[#f97316]" />
                <label htmlFor="isActive" className="ml-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Active (visible to customers)</label>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors font-semibold">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white rounded-lg hover:opacity-90 transition-opacity font-semibold shadow-lg">{editingActivity ? 'Save Changes' : 'Add Activity'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ActivitiesManager;
