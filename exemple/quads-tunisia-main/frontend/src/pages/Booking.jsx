import { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { activitiesAPI, bookingsAPI } from '../utils/api';
import { waLink } from '../utils/contact';
import { setSEO } from '../utils/seo';
import '../pages/Home.css';

const locationData = {
  sousse: {
    name: 'Sousse',
    tagline: 'The Pearl of the Sahel',
    description: 'Experience the thrill of water sports at Tunisia\'s premier coastal hub, with its vibrant marina and stunning Mediterranean views.',
    priceMultiplier: 1,
    activityDescriptions: {
      default: 'Enjoy this exciting activity along the beautiful Sousse coastline, departing from the vibrant Port El Kantaoui marina.',
    },
  },
  monastir: {
    name: 'Monastir',
    tagline: 'Where History Meets the Sea',
    description: 'Discover adventure against the backdrop of the historic Ribat fortress, with excursions to the pristine Kuriat Islands.',
    priceMultiplier: 1,
    activityDescriptions: {
      default: 'Set sail from Monastir\'s scenic marina, with views of the iconic Ribat fortress and routes to the stunning Kuriat Islands.',
    },
  },
  mahdia: {
    name: 'Mahdia',
    tagline: 'The Hidden Gem',
    description: 'Explore crystal-clear turquoise waters and enjoy exclusive dolphin watching experiences far from the tourist crowds.',
    priceMultiplier: 1,
    activityDescriptions: {
      default: 'Discover Mahdia\'s untouched crystal-clear waters, a hidden paradise with pristine beaches and authentic Tunisian charm.',
    },
  },
  hammamet: {
    name: 'Hammamet',
    tagline: 'The Garden of Tunisia',
    description: 'Relax in Tunisia\'s classic resort town, with its walled medina and orange groves, then head out for VIP catamaran trips, quad rides and horseback adventures.',
    priceMultiplier: 1,
    activityDescriptions: {
      default: 'Set out from Hammamet\'s golden beaches and orange-grove countryside for a mix of sea and land adventures.',
    },
  },
};

// ── Currency config ───────────────────────────────────────────────────────────
// Base currency is GBP (DB prices are stored in £ from the official price sheet).
// `rate` = how many units of the target currency equal 1 GBP.
const CURRENCIES = {
  GBP: { symbol: '£',   rate: 1,     flag: '🇬🇧', label: 'British Pound' },
  EUR: { symbol: '€',   rate: 1.17,  flag: '🇪🇺', label: 'Euro' },
  TND: { symbol: 'TND', rate: 3.97,  flag: '🇹🇳', label: 'Tunisian Dinar' },
};

// ── On-demand transfers (priced by request via WhatsApp) ─────────────────────
const AIRPORT_TRANSFERS = [
  { id: 'monastir-airport', name: 'Monastir Airport', icon: '✈️' },
  { id: 'enfidha-airport',  name: 'Enfidha Airport',  icon: '✈️' },
  { id: 'tunis-airport',    name: 'Tunis-Carthage Airport', icon: '✈️' },
];
const LOCAL_TRANSFERS = [
  { id: 'transfer-sousse',   name: 'Sousse',   icon: '🚐' },
  { id: 'transfer-monastir', name: 'Monastir', icon: '🚐' },
  { id: 'transfer-mahdia',   name: 'Mahdia',   icon: '🚐' },
  { id: 'transfer-hammamet', name: 'Hammamet', icon: '🚐' },
];

// ── On-demand private VIP boat trips (custom pricing 2-6h, £150-£450 range) ──
const ON_DEMAND_BOATS = [
  {
    id: 'vip-catamaran',
    name: 'VIP Catamaran & Dolphin Trip (Private)',
    icon: '⛵',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    locations: ['sousse', 'monastir'],
    blurb: 'Private catamaran, dolphin spotting, swim stop, soft drinks & fruits. Morning, afternoon, or sunset.',
    range: '2–6h · Up to 15 persons',
  },
  {
    id: 'vip-fishing',
    name: 'VIP Private Fishing Boat',
    icon: '🎣',
    image: 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=800&q=80',
    locations: ['sousse', 'monastir'],
    blurb: 'Private boat & fishing gear, dolphin sightings, swim stop. Optional fillet/cook your catch.',
    range: '2–6h · Up to 15 persons',
  },
  {
    id: 'glass-bottom',
    name: 'Glass Bottom Boat — Underwater Adventure (Private)',
    icon: '🌊',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    locations: ['sousse', 'monastir'],
    blurb: 'See underwater life without getting wet. Private boat, soft drinks & fruits, possible dolphin sightings.',
    range: '2–6h · Up to 15 persons',
  },
];

function Booking() {
  const { location } = useParams();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null); // { reference, items, customer, date, total }
  const [currency, setCurrency] = useState(() => {
    try {
      const saved = localStorage.getItem('quads-tunisia.currency');
      // Migrate: if previously saved as TND under the old wrong base, reset to GBP
      if (!saved || saved === 'TND') return 'GBP';
      return saved;
    } catch { return 'GBP'; }
  });

  useEffect(() => {
    try { localStorage.setItem('quads-tunisia.currency', currency); } catch {} // eslint-disable-line
  }, [currency]);
  const [formData, setFormData] = useState(() => {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem('quads-tunisia.customer') || '{}');
    } catch {} // eslint-disable-line
    return {
      name: saved.name || '',
      email: saved.email || '',
      phone: saved.phone || '',
      date: '',
      participants: 1,
      specialRequests: ''
    };
  });

  const currentLocation = locationData[location];

  // Fetch activities from backend
  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    if (!currentLocation) return;
    setSEO({
      title: `Book Water Sports & Activities in ${currentLocation.name}, Tunisia`,
      description: `${currentLocation.description} Browse and book jet skis, parasailing, boat trips, quad biking and more in ${currentLocation.name}.`,
      keywords: `book activities ${currentLocation.name}, water sports ${currentLocation.name}, ${currentLocation.name} Tunisia booking, jet ski ${currentLocation.name}, parasailing ${currentLocation.name}`,
      path: `/booking/${location}`,
    });
  }, [currentLocation, location]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await activitiesAPI.getAll({ isActive: 'true' });
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      alert('Failed to load activities. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Redirect to locations page if invalid location
  if (!currentLocation) {
    return <Navigate to="/locations" replace />;
  }

  const getLocationPrice = (basePrice) => {
    return Math.round(basePrice * currentLocation.priceMultiplier);
  };

  const getLocationDescription = (activity) => {
    return currentLocation.activityDescriptions[activity.name?.toLowerCase()] || currentLocation.activityDescriptions.default;
  };

  // Convert a GBP amount (DB base) to the selected display currency
  const formatPrice = (gbpAmount) => {
    const { symbol, rate } = CURRENCIES[currency];
    const converted = gbpAmount * rate;
    if (currency === 'TND') return `${Math.round(converted)} TND`;
    return `${symbol}${converted.toFixed(2)}`;
  };

  // Format duration nicely (e.g., 1.33 → "1h 20min", 0.5 → "30min", 8 → "8h")
  const formatDuration = (hours) => {
    if (!hours) return '';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      'Water Sports': '🌊',
      'Land Adventures': '🏎️',
      'Boat Trips': '⛵',
      'Traditional Experiences': '🐪',
      'Diving': '🤿',
      'Excursions': '🏛️',
    };
    return icons[category] || '🎯';
  };

  const handleActivityClick = (activity) => {
    const pricingOptions = activity.pricingOptions ? JSON.parse(activity.pricingOptions) : null;
    const timeSlots = activity.timeSlots ? JSON.parse(activity.timeSlots) : null;

    const needsModal =
      (pricingOptions && pricingOptions.length > 1) ||
      (timeSlots && timeSlots.length > 0);

    if (needsModal) {
      setSelectedActivity(activity);
      const adjustedOptions = pricingOptions
        ? pricingOptions.map(opt => ({ ...opt, price: getLocationPrice(opt.price) }))
        : null;
      setSelectedOption(adjustedOptions ? adjustedOptions[0] : null);
      setSelectedTimeSlot(timeSlots && timeSlots.length > 0 ? timeSlots[0] : null);
      setShowOptionsModal(true);
    } else {
      const option = pricingOptions ? { ...pricingOptions[0], price: getLocationPrice(pricingOptions[0].price) } : null;
      addToCart(activity, option, null);
    }
  };

  const addToCart = (activity, option, timeSlot) => {
    const slotKey = timeSlot ? `-${timeSlot}` : '';
    const cartItemId = option ? `${activity.id}-${option.label}${slotKey}` : `${activity.id}${slotKey}`;
    const price = option ? option.price : getLocationPrice(activity.price);
    const itemLabel = option ? `${activity.name} - ${option.label}` : activity.name;

    const cartItem = {
      id: cartItemId,
      activityId: activity.id,
      name: itemLabel,
      activityName: activity.name,
      option: option,
      timeSlot: timeSlot || null,
      price: price,
      duration: option?.duration || activity.duration,
      participants: option?.participants || 1,
      quantity: 1
    };

    const existingItem = cart.find(item => item.id === cartItemId);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === cartItemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, cartItem]);
    }

    setShowOptionsModal(false);
    setShowCart(true);
  };

  const handleAddSelectedOption = () => {
    if (selectedActivity) {
      addToCart(selectedActivity, selectedOption, selectedTimeSlot);
    }
  };

  const removeFromCart = (activityId) => {
    setCart(cart.filter(item => item.id !== activityId));
  };

  const updateQuantity = (activityId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(activityId);
    } else {
      setCart(cart.map(item =>
        item.id === activityId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Filter activities by selected location first, then by category
  const locationKey = location.toLowerCase();
  const locationFiltered = activities.filter((a) => {
    const loc = (a.location || '').toLowerCase();
    return (
      !loc || // include activities without a specific location
      loc.includes(locationKey) ||
      loc.includes(currentLocation.name.toLowerCase())
    );
  });

  // Get unique categories from location-filtered activities
  const categories = ['All', ...new Set(locationFiltered.map(a => a.category))];

  // Filter activities by category (applied after location filter)
  const filteredActivities = selectedCategory === 'All'
    ? locationFiltered
    : locationFiltered.filter(a => a.category === selectedCategory);

  // Build the WhatsApp confirmation message that the customer can send to
  // Midou after booking. Multi-line, structured, fits in a wa.me URL.
  const buildWhatsAppConfirmation = (snapshot) => {
    const lines = [
      `🌊 *New Booking — Quads Tunisia*`,
      ``,
      `📍 *Location:* ${snapshot.locationName}`,
      `📅 *Date:* ${snapshot.date}`,
      `🔖 *Reference:* ${snapshot.reference}`,
      ``,
      `👤 *Customer:*`,
      `• ${snapshot.customer.name}`,
      `• ${snapshot.customer.email}`,
      `• ${snapshot.customer.phone}`,
      ``,
      `🎯 *Activities (${snapshot.items.length}):*`,
      ...snapshot.items.map(i => `• ${i.name}${i.timeSlot ? ` 🕒 ${i.timeSlot}` : ''} ×${i.quantity} — £${(i.price * i.quantity).toFixed(2)}`),
      ``,
      `💰 *Total: £${snapshot.total.toFixed(2)}*`,
    ];
    if (snapshot.customer.specialRequests) {
      lines.push('', `📝 *Notes:* ${snapshot.customer.specialRequests}`);
    }
    lines.push('', 'Could you please confirm availability? Thank you!');
    return lines.join('\n');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('Please add at least one activity to your cart!');
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.date) {
      alert('Please fill in all required fields!');
      return;
    }

    // Validate cart participants don't exceed any single activity's max
    const overMax = cart.find(i => {
      const act = activities.find(a => a.id === i.activityId);
      return act && i.participants * i.quantity > act.maxParticipants;
    });
    if (overMax) {
      alert(`"${overMax.name}" exceeds its participant limit. Please reduce the quantity.`);
      return;
    }

    try {
      setSubmitting(true);

      // Create a booking for each item in the cart
      const bookingPromises = cart.map(item =>
        bookingsAPI.create({
          activityId: item.activityId,
          activityName: `${item.name} (${currentLocation.name})`,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          date: formData.date,
          participants: item.participants * item.quantity,
          totalPrice: item.price * item.quantity,
          notes: `Location: ${currentLocation.name}.${item.timeSlot ? ` Time slot: ${item.timeSlot}.` : ''} ${formData.specialRequests || ''}`,
          status: 'Pending',
          paymentStatus: 'Unpaid'
        })
      );

      const results = await Promise.all(bookingPromises);
      const firstId = results?.[0]?.data?.id;
      const reference = firstId ? `AS-${String(firstId).padStart(5, '0')}` : `AS-${Date.now().toString().slice(-6)}`;

      const snapshot = {
        reference,
        locationName: currentLocation.name,
        date: formData.date,
        customer: { ...formData },
        items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        total: getTotalPrice(),
      };

      // Show the confirmation modal — replaces the old alert.
      setConfirmation(snapshot);

      // Reset form and cart
      setCart([]);
      // Persist customer credentials so they don't have to retype on next booking
      try {
        localStorage.setItem('quads-tunisia.customer', JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        }));
      } catch {} // eslint-disable-line

      // Keep credentials prefilled, only clear the booking-specific fields
      setFormData((prev) => ({
        ...prev,
        date: '',
        participants: 1,
        specialRequests: ''
      }));
      setShowCart(false);
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Failed to submit booking. Please try again or contact support.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-[#fff8ed] dark:bg-[#29231c] pt-32 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#f97316] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading activities in {currentLocation.name}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#fff8ed] dark:bg-[#29231c] pt-32">
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <Link
              to="/locations"
              className="inline-flex items-center gap-2 text-[#f97316] hover:text-[#ea580c] font-semibold transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
              </svg>
              Change Location
            </Link>
          </div>
          <p className="text-[#f97316] font-semibold text-lg mb-2 tracking-wider">{currentLocation.tagline}</p>
          <h1 className="text-5xl md:text-6xl font-black leading-tight tracking-tight mb-6">
            Adventures in <span className="gradient-text">{currentLocation.name}</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            {currentLocation.description}{' '}
            Most activities include <span className="font-bold text-[#f97316]">FREE pickup</span>, professional guidance, and unforgettable memories!
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-white dark:bg-[#422919] px-6 py-3 rounded-full shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#f97316]">
                <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Certified & Safe</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-[#422919] px-6 py-3 rounded-full shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#f97316]">
                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">{currentLocation.name}, Tunisia</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-[#422919] px-6 py-3 rounded-full shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#f97316]">
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">5000+ Happy Customers</span>
            </div>
          </div>
        </section>

        {/* Activities Grid */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Available Activities</h2>
              {/* Currency switcher */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-[#30251c] border border-gray-200 dark:border-gray-700 rounded-xl p-1 w-fit shadow-sm">
                <span className="text-xs font-semibold text-gray-400 px-2">Currency:</span>
                {Object.entries(CURRENCIES).map(([key, { flag, symbol }]) => (
                  <button
                    key={key}
                    onClick={() => setCurrency(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                      currency === key
                        ? 'bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span>{flag}</span>
                    <span>{key === 'TND' ? 'TND' : symbol}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 bg-[#f97316] text-[#422919] px-6 py-3 rounded-full font-bold hover:opacity-90 transition-opacity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
              </svg>
              Cart ({cart.length})
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white shadow-md shadow-[#f97316]/30 scale-105'
                    : 'bg-white dark:bg-[#30251c] text-gray-600 dark:text-gray-300 hover:bg-[#f97316]/10 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {category !== 'All' && <span className="mr-1.5">{getCategoryIcon(category)}</span>}
                {category}
              </button>
            ))}
          </div>

          {/* Activity Count */}
          <div className="mb-6 text-gray-600 dark:text-gray-400">
            Showing {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'} in {currentLocation.name}
          </div>

          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 dark:text-gray-400">No activities available in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredActivities.map((activity) => {
                const pricingOpts = activity.pricingOptions ? JSON.parse(activity.pricingOptions) : [];
                const hasMultipleOptions = pricingOpts.length > 1;
                const isVIP = activity.name.toLowerCase().includes('vip') || activity.name.toLowerCase().includes('private');
                const descriptionText = activity.description || getLocationDescription(activity);

                return (
                  <div
                    key={activity.id}
                    className={`group relative bg-white dark:bg-[#30251c] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 flex flex-col ${
                      isVIP ? 'ring-2 ring-yellow-400/60' : ''
                    }`}
                  >
                    {/* Image Section — clickable to full details */}
                    <Link to={`/activity/${activity.id}`} className="relative h-52 overflow-hidden block group/img">
                      <img
                        src={activity.image}
                        alt={activity.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.classList.add('bg-gradient-to-br', 'from-[#422919]', 'to-[#c45112]', 'flex', 'items-center', 'justify-center');
                          const icon = document.createElement('span');
                          icon.className = 'text-7xl';
                          icon.textContent = getCategoryIcon(activity.category);
                          e.target.parentElement.appendChild(icon);
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {/* Hover hint */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity">
                        <span className="bg-white/95 text-[#422919] px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm0-4a1 1 0 112 0v3a1 1 0 11-2 0V5z" clipRule="evenodd"/></svg>
                          View Full Details
                        </span>
                      </div>

                      {/* VIP Badge */}
                      {isVIP && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-[#422919] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg">
                          VIP
                        </div>
                      )}

                      {/* Category Badge */}
                      <div className={`absolute top-3 ${isVIP ? 'left-20' : 'left-3'} bg-white/15 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold border border-white/20`}>
                        {getCategoryIcon(activity.category)} {activity.category}
                      </div>

                      {/* Duration Badge */}
                      <div className="absolute top-3 right-3 bg-white/15 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                        {formatDuration(activity.duration)}
                      </div>

                      {/* Price Tag - bottom of image */}
                      <div className="absolute bottom-3 right-3">
                        <div className="bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white px-4 py-2 rounded-xl shadow-lg">
                          <span className="text-xs font-medium opacity-90">{hasMultipleOptions ? 'From ' : ''}</span>
                          <span className="text-xl font-black">{formatPrice(getLocationPrice(activity.price))}</span>
                        </div>
                      </div>
                    </Link>

                    {/* Content Section */}
                    <div className="p-5 flex flex-col flex-1">
                      {/* Title — clickable to full details */}
                      <Link
                        to={`/activity/${activity.id}`}
                        className="block text-lg font-black leading-tight mb-2 hover:text-[#f97316] transition-colors"
                      >
                        {activity.name}
                      </Link>

                      {/* Description - use actual activity description */}
                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
                        {descriptionText.replace(/🎈|🚤|🍌|🏎️|🐪🐴|🏖️🌅|🤿|🏴‍☠️|🐬|🏛️|⛰️|🕌|🦁|⛵|🌊|🎣/g, '').trim()}
                      </p>

                      {/* Feature Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {descriptionText.toLowerCase().includes('free pickup') && (
                          <span className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M0 1a1 1 0 011-1h1.5a1 1 0 01.979.796L3.73 2H18a1 1 0 01.962 1.275l-1.4 5A1 1 0 0116.6 9H4.21l-.17.637A1 1 0 003.064 10.5H2a1 1 0 110-2h.42l1.65-6.175A1 1 0 003.5 1H1a1 1 0 01-1-1z"/></svg>
                            FREE Pickup
                          </span>
                        )}
                        {descriptionText.toLowerCase().includes('photo') && (
                          <span className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm13.5 3a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM10 14a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg>
                            Photos Included
                          </span>
                        )}
                        {activity.difficulty === 'Beginner' && (
                          <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                            All Ages
                          </span>
                        )}
                        {descriptionText.toLowerCase().includes('dolphin') && (
                          <span className="inline-flex items-center gap-1 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                            Dolphin Spotting
                          </span>
                        )}
                      </div>

                      {/* Quick Info Row */}
                      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>
                          {formatDuration(activity.duration)}
                        </span>
                        <span className="text-gray-300 dark:text-gray-700">|</span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
                          Max {activity.maxParticipants}
                        </span>
                        {hasMultipleOptions && (
                          <>
                            <span className="text-gray-300 dark:text-gray-700">|</span>
                            <span className="text-[#f97316] font-semibold">{pricingOpts.length} options</span>
                          </>
                        )}
                      </div>

                      {/* Pricing Options Preview (if multiple) */}
                      {hasMultipleOptions && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {pricingOpts.map((opt, i) => (
                            <span key={i} className="text-xs bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                              {opt.label}: <span className="font-bold text-[#f97316]">{formatPrice(getLocationPrice(opt.price))}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Book Button */}
                      <button
                        onClick={() => handleActivityClick(activity)}
                        className={`w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 text-sm group-hover:shadow-lg ${
                          isVIP
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-[#422919] hover:from-yellow-500 hover:to-amber-600'
                            : 'bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white hover:opacity-90'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
                        </svg>
                        {hasMultipleOptions ? 'Choose Option & Book' : `Book Now — ${formatPrice(getLocationPrice(activity.price))}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* On-Demand Private Boat Trips */}
        {ON_DEMAND_BOATS.some(b => b.locations.includes(location.toLowerCase())) && (
          <section className="mb-16">
            <div className="text-center mb-8">
              <p className="text-yellow-500 font-semibold text-sm tracking-wider uppercase mb-2">⭐ VIP — On Request</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Private Boat Trips</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Custom 2–6h private charters tailored to your group. Tap any trip to message us on WhatsApp — we'll send a personalized quote based on your group size and duration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ON_DEMAND_BOATS.filter(b => b.locations.includes(location.toLowerCase())).map((boat) => {
                const msg = `Hi! I'd like to book a ${boat.name} in ${currentLocation.name}. Could you send me a quote for our group?`;
                const href = waLink(msg);
                return (
                  <a
                    key={boat.id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative bg-white dark:bg-[#30251c] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ring-2 ring-yellow-400/60 flex flex-col"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={boat.image}
                        alt={boat.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-[#422919] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg">
                        VIP — On Demand
                      </div>
                      <div className="absolute top-3 right-3 bg-white/15 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                        {boat.range}
                      </div>
                      <div className="absolute bottom-3 left-3 text-4xl">{boat.icon}</div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-lg font-black leading-tight mb-2 group-hover:text-[#f97316] transition-colors">
                        {boat.name}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4 flex-1">
                        {boat.blurb}
                      </p>
                      <div className="mb-4 inline-flex items-center gap-1.5 self-start bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                        💬 Custom Quote
                      </div>
                      <button className="w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 text-sm bg-green-500 text-white hover:bg-green-600 group-hover:shadow-lg">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        Request Quote on WhatsApp
                      </button>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* On-Demand Transfers */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <p className="text-[#f97316] font-semibold text-sm tracking-wider uppercase mb-2">On-Demand Service</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Transfers — Tailored to You</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Airport pickups and city-to-city transfers are priced on request. Tap any destination to message us on WhatsApp — we'll confirm price &amp; pickup time within minutes.
            </p>
          </div>

          {/* Airport Transfers */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="text-lg">✈️</span> Airport Transfers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {AIRPORT_TRANSFERS.map((t) => {
                const msg = `Hi! I'd like a transfer between ${t.name} and ${currentLocation.name}. Could you confirm the price and pickup details?`;
                const href = waLink(msg);
                return (
                  <a
                    key={t.id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative bg-white dark:bg-[#30251c] rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-800 flex items-center gap-4"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#c45112] to-[#fbbf24] flex items-center justify-center text-2xl">
                      {t.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base truncate group-hover:text-[#f97316] transition-colors">{t.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Tap to request quote</p>
                    </div>
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-green-500 text-white flex items-center justify-center group-hover:bg-green-600 transition-colors">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Local Transfers */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="text-lg">🚐</span> Local City Transfers
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {LOCAL_TRANSFERS.map((t) => {
                const msg = `Hi! I'd like a local transfer to ${t.name} from ${currentLocation.name}. Could you confirm the price and pickup details?`;
                const href = waLink(msg);
                return (
                  <a
                    key={t.id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative bg-white dark:bg-[#30251c] rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c45112] to-[#fbbf24] flex items-center justify-center text-2xl">
                      {t.icon}
                    </div>
                    <p className="font-bold text-sm group-hover:text-[#f97316] transition-colors">To {t.name}</p>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      Request quote
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing Options Modal */}
        {showOptionsModal && selectedActivity && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowOptionsModal(false)}>
            <div className="bg-white dark:bg-[#30251c] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header with Image */}
              <div className="relative h-40 overflow-hidden">
                <img src={selectedActivity.image} alt={selectedActivity.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#422919] via-[#422919]/60 to-transparent" />
                <button
                  onClick={() => setShowOptionsModal(false)}
                  className="absolute top-3 right-3 bg-white/20 backdrop-blur-md text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="absolute bottom-4 left-6 right-6">
                  <p className="text-[#f97316] text-xs font-semibold tracking-wider uppercase mb-1">{selectedActivity.category}</p>
                  <h2 className="text-2xl font-black text-white">{selectedActivity.name}</h2>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5 leading-relaxed">
                  {(selectedActivity.description || getLocationDescription(selectedActivity)).replace(/🎈|🚤|🍌|🏎️|🐪🐴|🏖️🌅|🤿|🏴‍☠️|🐬|🏛️|⛰️|🕌|🦁|⛵|🌊|🎣/g, '').trim()}
                </p>

                {selectedActivity.pricingOptions && JSON.parse(selectedActivity.pricingOptions).length > 1 && (
                  <>
                    <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Choose your option</h3>
                    <div className="space-y-2 mb-6">
                      {JSON.parse(selectedActivity.pricingOptions).map((option, index) => {
                        const adjustedOption = { ...option, price: getLocationPrice(option.price) };
                        const isSelected = selectedOption?.label === adjustedOption.label;
                        return (
                          <button
                            key={index}
                            onClick={() => setSelectedOption(adjustedOption)}
                            className={`w-full p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${
                              isSelected
                                ? 'border-[#f97316] bg-[#f97316]/10 shadow-md shadow-[#f97316]/10'
                                : 'border-gray-100 dark:border-gray-800 hover:border-[#f97316]/40 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isSelected ? 'border-[#f97316] bg-[#f97316]' : 'border-gray-300 dark:border-gray-600'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                                )}
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-sm">{adjustedOption.label}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                  {adjustedOption.duration ? formatDuration(adjustedOption.duration) : ''}
                                  {adjustedOption.participants ? `${adjustedOption.participants} ${adjustedOption.participants === 1 ? 'person' : 'people'}` : ''}
                                  {adjustedOption.type ? adjustedOption.type : ''}
                                </p>
                              </div>
                            </div>
                            <div className={`text-xl font-black ${isSelected ? 'text-[#f97316]' : 'text-gray-700 dark:text-gray-300'}`}>
                              {formatPrice(adjustedOption.price)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {selectedActivity.timeSlots && JSON.parse(selectedActivity.timeSlots).length > 0 && (
                  <>
                    <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#f97316]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>
                      Choose your time slot
                    </h3>
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {JSON.parse(selectedActivity.timeSlots).map((slot, index) => {
                        const isSelected = selectedTimeSlot === slot;
                        return (
                          <button
                            key={index}
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`p-3 rounded-xl border-2 transition-all text-sm font-bold ${
                              isSelected
                                ? 'border-[#f97316] bg-[#f97316]/10 text-[#f97316] shadow-md shadow-[#f97316]/10'
                                : 'border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#f97316]/40 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                <button
                  onClick={handleAddSelectedOption}
                  className="w-full bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-[#f97316]/20 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
                  </svg>
                  Add to Cart — {formatPrice(selectedOption?.price || getLocationPrice(selectedActivity.price))}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cart Modal */}
        {showCart && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#29231c] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-black">Your Cart - {currentLocation.name}</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">Your cart is empty</p>
                  <button
                    onClick={() => setShowCart(false)}
                    className="bg-[#f97316] text-[#422919] px-6 py-3 rounded-lg font-bold hover:opacity-90"
                  >
                    Browse Activities
                  </button>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-4 mb-8">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{item.name}</h3>
                          {item.timeSlot && (
                            <p className="text-xs text-[#f97316] font-semibold mt-0.5 inline-flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>
                              {item.timeSlot}
                            </p>
                          )}
                          <p className="text-gray-600 dark:text-gray-400">{formatPrice(item.price)} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            -
                          </button>
                          <span className="font-bold w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                              <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        <div className="font-bold text-xl">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Booking Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold">Customer Information</h3>
                        {(() => {
                          let saved = {};
                          try { saved = JSON.parse(localStorage.getItem('quads-tunisia.customer') || '{}'); } catch {} // eslint-disable-line
                          const hasSaved = saved.name || saved.email || saved.phone;
                          if (!hasSaved) return null;
                          return (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                                Saved on this device
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  try { localStorage.removeItem('quads-tunisia.customer'); } catch {} // eslint-disable-line
                                  setFormData((prev) => ({ ...prev, name: '', email: '', phone: '' }));
                                }}
                                className="text-gray-400 hover:text-red-500 underline underline-offset-2"
                              >
                                Clear
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-[#f97316] focus:outline-none"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Email *</label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-[#f97316] focus:outline-none"
                            placeholder="john@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Phone *</label>
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-[#f97316] focus:outline-none"
                            placeholder="+1234567890"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Preferred Date *</label>
                          <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-[#f97316] focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-semibold mb-2">Special Requests (Optional)</label>
                        <textarea
                          value={formData.specialRequests}
                          onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-[#f97316] focus:outline-none"
                          placeholder="Any special requirements or questions..."
                        />
                      </div>
                    </div>

                    {/* Total and Submit */}
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                        <p className="text-3xl font-black text-[#f97316]">{formatPrice(getTotalPrice())}</p>
                        {currency !== 'GBP' && (
                          <p className="text-xs text-gray-400 mt-0.5">≈ £{getTotalPrice().toFixed(2)} · Booking processed in GBP</p>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white px-8 py-4 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Submitting...' : 'Complete Booking'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

        {/* Booking Confirmation Modal */}
        {confirmation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#29231c] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-fade-in-up">
              {/* Success header with checkmark */}
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h2 className="text-3xl font-black mb-1">Booking Received!</h2>
                <p className="text-white/90 text-sm">Reference: <span className="font-bold">{confirmation.reference}</span></p>
              </div>

              <div className="p-6 space-y-5">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Thanks <span className="font-bold">{confirmation.customer.name.split(' ')[0]}</span>! We've recorded your reservation. <span className="font-semibold text-green-600 dark:text-green-400">Tap the button below</span> to send us a WhatsApp confirmation — we'll lock in your slot and reply within 30 minutes.
                </p>

                {/* Order summary */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">📍 Location</span>
                    <span className="font-bold">{confirmation.locationName}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">📅 Date</span>
                    <span className="font-bold">{confirmation.date}</span>
                  </div>
                  <div className="flex justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-500">🎯 Activities</span>
                    <span className="font-bold">{confirmation.items.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {confirmation.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400 truncate pr-2">{it.name} ×{it.quantity}</span>
                        <span className="font-semibold whitespace-nowrap">£{(it.price * it.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-bold">Total</span>
                    <span className="text-xl font-black text-[#f97316]">£{confirmation.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* WhatsApp confirmation CTA */}
                <a
                  href={waLink(buildWhatsAppConfirmation(confirmation))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-green-500/30"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Confirm on WhatsApp
                </a>

                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmation(null)}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                  >
                    Close
                  </button>
                  <Link
                    to={`/my-bookings?email=${encodeURIComponent(confirmation.customer.email)}`}
                    className="flex-1 px-4 py-3 bg-[#f97316]/10 text-[#f97316] rounded-xl font-semibold hover:bg-[#f97316]/20 transition-colors text-sm text-center"
                  >
                    View My Bookings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Booking;
