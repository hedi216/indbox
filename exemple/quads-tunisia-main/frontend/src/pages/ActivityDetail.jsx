import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { activitiesAPI, reviewsAPI } from '../utils/api';
import { setSEO } from '../utils/seo';
import './Home.css';

function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState({ totalReviews: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    customerName: '',
    customerEmail: '',
    rating: 5,
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Gallery images - you can customize these for each activity
  const galleryImages = [
    activity?.image,
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=80',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
    'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=1200&q=80',
    'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=1200&q=80'
  ];

  useEffect(() => {
    fetchActivityDetails();
    fetchReviews();
    fetchRating();
  }, [id]);

  // Update page title and meta tags for SEO
  useEffect(() => {
    if (activity) {
      setSEO({
        title: `${activity.name} - ${activity.location}, Tunisia`,
        description: `${activity.description} Book ${activity.name} in ${activity.location}, Tunisia. Starting from £${activity.price}. ${rating.totalReviews} reviews with ${rating.averageRating} stars.`,
        keywords: `${activity.name}, ${activity.location}, Tunisia, water sports, ${activity.category}, adventure sports, ${activity.name} Tunisia, ${activity.name} ${activity.location}, parasailing Tunisia, jet ski Tunisia, boat trips Tunisia, excursions Tunisia`,
        image: activity.image,
        path: `/activity/${id}`,
      });
    }
  }, [activity, rating, id]);

  const fetchActivityDetails = async () => {
    try {
      const response = await activitiesAPI.getOne(id);
      setActivity(response.data);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewsAPI.getActivityReviews(id, { approved: 'true' });
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchRating = async () => {
    try {
      const response = await reviewsAPI.getActivityRating(id);
      setRating(response.data);
    } catch (error) {
      console.error('Error fetching rating:', error);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!reviewForm.customerName || !reviewForm.comment) {
      alert('Please fill in all required fields!');
      return;
    }

    try {
      setSubmitting(true);
      await reviewsAPI.create({
        activityId: id,
        ...reviewForm
      });

      alert('Thanks for your review! It will appear on this page once our team has approved it.');

      // Reset form
      setReviewForm({
        customerName: '',
        customerEmail: '',
        rating: 5,
        comment: ''
      });
      setShowReviewForm(false);

      // Refresh reviews
      fetchReviews();
      fetchRating();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  if (loading) {
    return (
      <div className="w-full bg-[#fff8ed] dark:bg-[#29231c] pt-32 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#f97316] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading activity...</p>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="w-full bg-[#fff8ed] dark:bg-[#29231c] pt-32 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-gray-600 dark:text-gray-400 mb-4">Activity not found</p>
          <Link to="/" className="text-[#f97316] hover:underline">Return to Home</Link>
        </div>
      </div>
    );
  }

  // Generate structured data for Google rich snippets
  const getStructuredData = () => {
    if (!activity) return null;

    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": activity.name,
      "description": activity.description,
      "image": activity.image,
      "brand": {
        "@type": "Brand",
        "name": "Quads Tunisia"
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "GBP",
        "price": activity.price,
        "availability": "https://schema.org/InStock",
        "priceValidUntil": "2026-12-31"
      },
      "aggregateRating": rating.totalReviews > 0 ? {
        "@type": "AggregateRating",
        "ratingValue": rating.averageRating,
        "reviewCount": rating.totalReviews,
        "bestRating": "5",
        "worstRating": "1"
      } : undefined,
      "review": reviews.slice(0, 5).map(review => ({
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": review.rating,
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": review.customerName
        },
        "reviewBody": review.comment,
        "datePublished": review.createdAt
      }))
    };
  };

  return (
    <div className="w-full bg-[#fff8ed] dark:bg-[#29231c] pt-32 min-h-screen">
      {/* Structured Data for SEO */}
      {activity && (
        <script type="application/ld+json">
          {JSON.stringify(getStructuredData())}
        </script>
      )}

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-[#f97316]">Home</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 dark:text-white font-semibold">{activity.name}</span>
        </div>

        {/* Gallery Section */}
        <section className="mb-12">
          <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={galleryImages[currentImageIndex]}
              alt={activity.name}
              className="w-full h-full object-cover transition-opacity duration-500"
            />

            {/* Gallery Navigation */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-black/70 p-3 rounded-full hover:bg-white dark:hover:bg-black transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-black/70 p-3 rounded-full hover:bg-white dark:hover:bg-black transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Image Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {galleryImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div className="mt-4 grid grid-cols-5 gap-4">
            {galleryImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`relative h-24 rounded-lg overflow-hidden transition-all ${
                  index === currentImageIndex ? 'ring-4 ring-[#f97316]' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title and Rating */}
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-4">{activity.name}</h1>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className={`w-6 h-6 ${i < Math.floor(rating.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                  ))}
                  <span className="text-lg font-semibold">{rating.averageRating.toFixed(1)}</span>
                  <span className="text-gray-600 dark:text-gray-400">({rating.totalReviews} reviews)</span>
                </div>
                <span className="px-4 py-1 bg-[#f97316]/20 text-[#f97316] rounded-full text-sm font-semibold">
                  {activity.category}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-[#422919] rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">About This Activity</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-line">
                {activity.description}
              </p>
            </div>

            {/* Pricing Options */}
            {activity.pricingOptions && (() => {
              try {
                const opts = JSON.parse(activity.pricingOptions);
                if (!opts || opts.length === 0) return null;
                return (
                  <div className="bg-white dark:bg-[#422919] rounded-2xl p-6 shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Pricing Options</h2>
                    <div className="space-y-2">
                      {opts.map((opt, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                          <div>
                            <p className="font-bold">{opt.label}</p>
                            {(opt.duration || opt.participants || opt.type) && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {opt.duration ? `${opt.duration}h` : ''}
                                {opt.participants ? ` • ${opt.participants} ${opt.participants === 1 ? 'person' : 'people'}` : ''}
                                {opt.type ? ` • ${opt.type}` : ''}
                              </p>
                            )}
                          </div>
                          <p className="text-xl font-black text-[#f97316]">£{opt.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } catch { return null; }
            })()}

            {/* Available Time Slots */}
            {activity.timeSlots && (() => {
              try {
                const slots = JSON.parse(activity.timeSlots);
                if (!slots || slots.length === 0) return null;
                return (
                  <div className="bg-white dark:bg-[#422919] rounded-2xl p-6 shadow-lg">
                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                      <svg className="w-6 h-6 text-[#f97316]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>
                      Available Time Slots
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Pick your preferred slot when adding to cart.</p>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((slot, i) => (
                        <span key={i} className="px-4 py-2 bg-[#f97316]/10 text-[#f97316] rounded-full text-sm font-bold border border-[#f97316]/30">
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              } catch { return null; }
            })()}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#422919] rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#f97316]">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                    <p className="text-xl font-bold">{activity.duration}h</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#422919] rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#f97316]">
                    <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Max Group</p>
                    <p className="text-xl font-bold">{activity.maxParticipants} {activity.maxParticipants === 1 ? 'person' : 'people'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#422919] rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#f97316]">
                    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                    <p className="text-lg font-bold">{activity.location}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#422919] rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#f97316]">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Difficulty</p>
                    <p className="text-lg font-bold">{activity.difficulty}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white dark:bg-[#422919] rounded-2xl p-8 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Customer Reviews</h2>
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="bg-[#f97316] text-white px-6 py-3 rounded-full font-bold hover:opacity-90 transition-opacity"
                >
                  Write a Review
                </button>
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <h3 className="text-xl font-bold mb-4">Share Your Experience</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={reviewForm.customerName}
                        onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-[#f97316] focus:outline-none"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Email (Optional)</label>
                      <input
                        type="email"
                        value={reviewForm.customerEmail}
                        onChange={(e) => setReviewForm({ ...reviewForm, customerEmail: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-[#f97316] focus:outline-none"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Rating *</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="text-4xl focus:outline-none transition-colors"
                        >
                          <span className={star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Your Review *</label>
                    <textarea
                      required
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-[#f97316] focus:outline-none"
                      placeholder="Tell us about your experience..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white px-8 py-4 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-center text-gray-600 dark:text-gray-400 py-8">No reviews yet. Be the first to review this activity!</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-lg">{review.customerName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-[#422919] rounded-2xl p-6 shadow-2xl">
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">From</p>
                <p className="text-4xl font-black text-[#f97316]">£{activity.price}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">per person</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-500">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                  <span>FREE pickup included 🚐</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-500">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                  <span>Instant confirmation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-500">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                  <span>Professional guide</span>
                </div>
              </div>

              <Link
                to="/locations"
                className="block w-full bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white text-center px-8 py-4 rounded-lg font-bold hover:opacity-90 transition-opacity mb-3"
              >
                Book Now
              </Link>

              <button
                onClick={() => navigate(-1)}
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-center px-8 py-4 rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ActivityDetail;
