import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { bookingsAPI } from '../utils/api';
import { waLink } from '../utils/contact';

const STATUS_STYLES = {
  Pending:   { bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-700 dark:text-amber-300',  dot: 'bg-amber-500' },
  Confirmed: { bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-300',  dot: 'bg-green-500' },
  Completed: { bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-700 dark:text-blue-300',    dot: 'bg-blue-500' },
  Cancelled: { bg: 'bg-red-100 dark:bg-red-900/30',      text: 'text-red-700 dark:text-red-300',      dot: 'bg-red-500' },
};

function MyBookings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [submitted, setSubmitted] = useState(!!initialEmail);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (submitted && email) fetchBookings(email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  const fetchBookings = async (em) => {
    try {
      setLoading(true);
      setError(null);
      const response = await bookingsAPI.getAll({ customerEmail: em });
      setBookings(response.data || []);
    } catch (e) {
      console.error(e);
      setError('Could not load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSearchParams({ email: email.trim() });
    setSubmitted(true);
  };

  const reset = () => {
    setSubmitted(false);
    setBookings([]);
    setEmail('');
    setSearchParams({});
  };

  return (
    <div className="w-full bg-[#fff8ed] dark:bg-[#29231c] pt-32 pb-16 min-h-screen">
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <p className="text-[#f97316] font-semibold text-sm tracking-widest uppercase mb-2">Your Reservations</p>
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-[#422919] dark:text-white">My Bookings</h1>
          <p className="text-gray-600 dark:text-gray-400">Look up your booking history with the email you used to reserve.</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-[#30251c] rounded-2xl shadow-lg p-6 md:p-8 max-w-lg mx-auto">
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Email used at booking</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-[#f97316] focus:outline-none mb-4"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg"
            >
              Find My Bookings
            </button>
          </form>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing bookings for <span className="font-semibold text-[#422919] dark:text-white">{email}</span>
              </p>
              <button onClick={reset} className="text-sm font-semibold text-[#f97316] hover:underline">
                Use a different email
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f97316] mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading…</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-4 text-center">
                {error}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center bg-white dark:bg-[#30251c] rounded-2xl p-10 shadow-lg">
                <div className="text-6xl mb-3">🌊</div>
                <h2 className="text-xl font-bold mb-2 text-[#422919] dark:text-white">No bookings found</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">We couldn't find any reservations under that email.</p>
                <Link
                  to="/locations"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white px-6 py-3 rounded-full font-bold hover:opacity-90"
                >
                  Browse Activities
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => {
                  const style = STATUS_STYLES[b.status] || STATUS_STYLES.Pending;
                  const enquireMsg = `Hi! I'd like to ask about my booking *${b.activityName}* on ${b.date} (booking #${b.id}). Could you help me?`;
                  return (
                    <div key={b.id} className="bg-white dark:bg-[#30251c] rounded-2xl shadow-md hover:shadow-lg transition-shadow p-5 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1.5 ${style.bg} ${style.text} text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                              {b.status}
                            </span>
                            <span className="text-xs text-gray-400">Booking #{b.id}</span>
                          </div>
                          <h3 className="text-lg md:text-xl font-black text-[#422919] dark:text-white mb-2 leading-tight">
                            {b.activityName}
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-400 dark:text-gray-500">Date</p>
                              <p className="font-semibold">{b.date}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 dark:text-gray-500">Participants</p>
                              <p className="font-semibold">{b.participants}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 dark:text-gray-500">Total</p>
                              <p className="font-bold text-[#f97316]">£{b.totalPrice.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 dark:text-gray-500">Payment</p>
                              <p className="font-semibold">{b.paymentStatus}</p>
                            </div>
                          </div>
                        </div>
                        <a
                          href={waLink(enquireMsg)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                          Ask about it
                        </a>
                      </div>
                      {b.notes && (
                        <p className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400 italic">
                          {b.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default MyBookings;
