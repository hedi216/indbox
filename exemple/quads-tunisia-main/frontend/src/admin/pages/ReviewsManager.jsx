import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { reviewsAPI } from '../../utils/api';
import { useToast } from '../../components/Toast';

const TABS = [
  { id: 'pending',  label: 'Pending',  approvedFilter: 'false' },
  { id: 'approved', label: 'Approved', approvedFilter: 'true' },
  { id: 'all',      label: 'All',      approvedFilter: undefined },
];

const Stars = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <svg
        key={s}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`w-4 h-4 ${s <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
      >
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
      </svg>
    ))}
  </div>
);

const ReviewsManager = () => {
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [counts, setCounts] = useState({ pending: 0, approved: 0, all: 0 });

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const filter = TABS.find(t => t.id === tab).approvedFilter;
      const params = filter !== undefined ? { approved: filter } : {};
      const response = await reviewsAPI.getAll(params);
      setReviews(response.data || []);

      // Refresh sidebar counts in parallel
      const [pendingRes, approvedRes, allRes] = await Promise.all([
        reviewsAPI.getAll({ approved: 'false' }),
        reviewsAPI.getAll({ approved: 'true' }),
        reviewsAPI.getAll(),
      ]);
      setCounts({
        pending: pendingRes.count || 0,
        approved: approvedRes.count || 0,
        all: allRes.count || 0,
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id, approve) => {
    try {
      await reviewsAPI.updateApproval(id, approve);
      toast.success(approve ? 'Review approved & published' : 'Review hidden from site');
      fetchReviews();
    } catch (error) {
      console.error(error);
      toast.error('Could not update review');
    }
  };

  const handleDelete = async (id) => {
    const ok = await toast.confirm('Permanently delete this review?', { title: 'Delete review?', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      await reviewsAPI.delete(id);
      toast.success('Review deleted');
      fetchReviews();
    } catch (error) {
      console.error(error);
      toast.error('Could not delete review');
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-black text-[#422919] dark:text-white mb-2">Reviews Moderation</h1>
        <p className="text-gray-600 dark:text-gray-400">Approve, hide, or delete customer reviews. Approved reviews are visible on the public activity page.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 font-semibold text-sm border-b-2 transition-colors ${
              tab === t.id
                ? 'border-[#f97316] text-[#f97316]'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.label}
            <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f97316] mx-auto" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white dark:bg-[#29231c] rounded-2xl p-12 text-center shadow-md">
          <div className="text-5xl mb-3">⭐</div>
          <p className="text-xl font-bold text-[#422919] dark:text-white">No {tab !== 'all' ? tab : ''} reviews</p>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {tab === 'pending' ? 'Inbox is empty — nice work!' : 'Reviews will appear here once customers submit them.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white dark:bg-[#29231c] rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="font-bold text-[#422919] dark:text-white">{r.customerName}</span>
                    {r.customerEmail && <span className="text-xs text-gray-400">{r.customerEmail}</span>}
                    <Stars rating={r.rating} />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      r.isApproved
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    }`}>
                      {r.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-[#f97316] font-semibold mb-2">
                    {r.activityName || `Activity #${r.activityId}`}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{r.comment}</p>
                  <p className="text-xs text-gray-400 mt-3">
                    {new Date(r.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="flex md:flex-col gap-2 md:w-32 flex-shrink-0">
                  {r.isApproved ? (
                    <button
                      onClick={() => handleApproval(r.id, false)}
                      className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      Hide
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApproval(r.id, true)}
                      className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      ✓ Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default ReviewsManager;
