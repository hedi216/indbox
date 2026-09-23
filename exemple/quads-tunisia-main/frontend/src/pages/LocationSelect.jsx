import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { waLink } from '../utils/contact';
import './Home.css';

const locations = [
  {
    id: 'sousse',
    name: 'Sousse',
    tagline: 'The Pearl of the Sahel',
    description: 'Major tourist hub with a vibrant marina, famous UNESCO Medina, and the widest range of water sports along the Tunisian coast.',
    image: '/Sousseimg.jpg',
    activityCount: 19,
    color: 'from-blue-600 to-cyan-400',
  },
  {
    id: 'monastir',
    name: 'Monastir',
    tagline: 'Where History Meets the Sea',
    description: 'Home to the historic Ribat fortress, pristine Kuriat Islands, and peaceful beaches perfect for parasailing and boat trips.',
    image: '/monastirimg.jpg',
    activityCount: 19,
    color: 'from-emerald-600 to-teal-400',
  },
  {
    id: 'mahdia',
    name: 'Mahdia',
    tagline: 'The Hidden Gem',
    description: 'Crystal-clear turquoise waters, an authentic medina, and exclusive dolphin watching experiences away from the crowds.',
    image: '/Mahidaimg.jpg',
    activityCount: 18,
    color: 'from-violet-600 to-purple-400',
  },
  {
    id: 'hammamet',
    name: 'Hammamet',
    tagline: 'The Garden of Tunisia',
    description: 'A postcard resort town of walled medina, orange groves, and golden beaches — VIP catamaran trips, quad rides and horseback adventures.',
    image: 'https://images.unsplash.com/photo-1633936476249-c5a807e46fd4?w=1200&q=80',
    activityCount: 7,
    color: 'from-amber-600 to-orange-400',
  },
];

const AUTOPLAY_MS = 5500;
const SWIPE_THRESHOLD = 50;

function LocationSelect() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(0); // -1 prev, +1 next
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const carouselRef = useRef(null);

  const total = locations.length;

  const goTo = useCallback((index, dir = 0) => {
    setDirection(dir);
    setActiveIndex(((index % total) + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(activeIndex + 1, +1), [activeIndex, goTo]);
  const prev = useCallback(() => goTo(activeIndex - 1, -1), [activeIndex, goTo]);

  // Autoplay (pauses on hover, focus, document hidden)
  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') next();
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [isPaused, next]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  // Swipe handlers
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };
  const onTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const onTouchEnd = () => {
    if (touchStartX.current == null || touchEndX.current == null) return;
    const delta = touchStartX.current - touchEndX.current;
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      delta > 0 ? next() : prev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Compute the per-card transform (centered active, smaller side cards)
  const getCardStyle = (index) => {
    let offset = index - activeIndex;
    // Wrap around: keep offset in range [-floor(total/2), ceil(total/2)-1]
    const half = Math.floor(total / 2);
    if (offset > half) offset -= total;
    if (offset < -half) offset += total;

    const isActive = offset === 0;
    const absOffset = Math.abs(offset);
    const translateX = offset * 62; // %
    const scale = isActive ? 1 : 0.78 - (absOffset - 1) * 0.05;
    const opacity = isActive ? 1 : Math.max(0.35, 0.7 - (absOffset - 1) * 0.2);
    const zIndex = 30 - absOffset;
    const blur = isActive ? 0 : 1.5;

    return {
      transform: `translate3d(${translateX}%, 0, 0) scale(${scale})`,
      opacity,
      zIndex,
      filter: `blur(${blur}px)`,
      pointerEvents: isActive ? 'auto' : 'none',
      transition: 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease, filter 500ms ease',
    };
  };

  const active = locations[activeIndex];

  return (
    <div className="w-full min-h-screen bg-[#fff8ed] dark:bg-[#29231c]">
      {/* Hero Section */}
      <div className="relative w-full pt-32 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#422919] via-[#00456e] to-[#c45112]"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#f97316] rounded-full blur-[120px]"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#fbbf24] rounded-full blur-[150px]"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <p className="text-[#f97316] font-semibold text-lg mb-4 tracking-widest uppercase animate-fade-in-up">Select Your Destination</p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight mb-6 animate-fade-in-up">
            Choose Your <span className="gradient-text">Adventure</span> Location
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto animate-fade-in-up">
            Swipe, click, or use ← → keys to explore Tunisia's most beautiful coastal cities.
          </p>
        </div>
      </div>

      {/* Carousel */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          ref={carouselRef}
          className="relative w-full select-none"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          aria-roledescription="carousel"
          aria-label="Choose your adventure location"
        >
          {/* Stage */}
          <div className="relative h-[460px] md:h-[520px] flex items-center justify-center">
            {locations.map((loc, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={loc.id}
                  className="absolute top-0 left-0 right-0 mx-auto w-[88%] md:w-[62%] h-full"
                  style={getCardStyle(idx)}
                  aria-hidden={!isActive}
                  aria-roledescription="slide"
                  aria-label={`${loc.name} — slide ${idx + 1} of ${total}`}
                >
                  <Link
                    to={`/booking/${loc.id}`}
                    tabIndex={isActive ? 0 : -1}
                    className={`group relative block w-full h-full overflow-hidden rounded-3xl shadow-2xl transition-shadow duration-500 ${
                      isActive ? 'shadow-[#f97316]/30 hover:shadow-[#f97316]/50' : ''
                    }`}
                  >
                    <img
                      src={loc.image}
                      alt={`${loc.name} - ${loc.tagline}`}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                      loading={isActive ? 'eager' : 'lazy'}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${loc.color} opacity-30`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

                    {/* Activity count + index */}
                    <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                      <span className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold text-sm border border-white/30">
                        📍 {idx + 1} / {total}
                      </span>
                      <span className="bg-[#f97316] text-[#422919] px-4 py-2 rounded-full font-black text-sm shadow-lg">
                        {loc.activityCount} Activities
                      </span>
                    </div>

                    {/* Body */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                      <p className="text-[#f97316] font-semibold text-sm tracking-widest uppercase mb-2">
                        {loc.tagline}
                      </p>
                      <h2 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
                        {loc.name}
                      </h2>
                      <p
                        className={`text-white/80 text-base leading-relaxed mb-6 max-w-xl transition-all duration-500 ${
                          isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                      >
                        {loc.description}
                      </p>
                      <span className="inline-flex items-center gap-2 bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg shadow-[#f97316]/30 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[#f97316]/50">
                        Explore Activities
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1">
                          <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}

            {/* Side overlays make non-active cards click-to-navigate */}
            {locations.map((loc, idx) => {
              if (idx === activeIndex) return null;
              const offset = ((idx - activeIndex + total + Math.floor(total / 2)) % total) - Math.floor(total / 2);
              const isLeft = offset < 0;
              return (
                <button
                  key={`nav-${loc.id}`}
                  onClick={() => goTo(idx, isLeft ? -1 : +1)}
                  className={`absolute top-1/2 -translate-y-1/2 w-[15%] h-[80%] z-40 ${isLeft ? 'left-0' : 'right-0'}`}
                  style={{ background: 'transparent' }}
                  aria-label={`Go to ${loc.name}`}
                  tabIndex={-1}
                />
              );
            })}
          </div>

          {/* Prev / Next arrows */}
          <button
            onClick={prev}
            aria-label="Previous location"
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/90 dark:bg-[#422919]/90 backdrop-blur-md text-[#422919] dark:text-white shadow-xl hover:bg-[#f97316] hover:text-white transition-all duration-300 flex items-center justify-center hover:scale-110"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 010 1.06L4.81 11.25h15.44a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Next location"
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/90 dark:bg-[#422919]/90 backdrop-blur-md text-[#422919] dark:text-white shadow-xl hover:bg-[#f97316] hover:text-white transition-all duration-300 flex items-center justify-center hover:scale-110"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Indicators + autoplay control */}
        <div className="mt-8 flex items-center justify-center gap-4">
          {/* Pills */}
          <div className="flex items-center gap-2">
            {locations.map((loc, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={loc.id}
                  onClick={() => goTo(idx, idx > activeIndex ? +1 : -1)}
                  aria-label={`Go to ${loc.name}`}
                  aria-current={isActive ? 'true' : 'false'}
                  className={`relative h-2.5 rounded-full transition-all duration-500 overflow-hidden ${
                    isActive ? 'w-12 bg-gray-300 dark:bg-gray-700' : 'w-2.5 bg-gray-300 dark:bg-gray-700 hover:bg-[#f97316]/50'
                  }`}
                >
                  {isActive && !isPaused && (
                    <span
                      key={activeIndex}
                      className="absolute inset-0 bg-gradient-to-r from-[#c45112] to-[#fbbf24] origin-left"
                      style={{
                        animation: `loc-progress ${AUTOPLAY_MS}ms linear forwards`,
                      }}
                    />
                  )}
                  {isActive && isPaused && (
                    <span className="absolute inset-0 bg-gradient-to-r from-[#c45112] to-[#fbbf24]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Pause / Play toggle */}
          <button
            onClick={() => setIsPaused(p => !p)}
            aria-label={isPaused ? 'Resume autoplay' : 'Pause autoplay'}
            className="ml-2 w-10 h-10 rounded-full bg-white dark:bg-[#422919] shadow-md text-[#422919] dark:text-white hover:bg-[#f97316] hover:text-white transition-all flex items-center justify-center"
          >
            {isPaused ? (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-0.5"><path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.89a1.5 1.5 0 000-2.54L6.3 2.84z"/></svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h2a.75.75 0 00.75-.75V3.75A.75.75 0 007.75 3h-2zM12.25 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h2a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-2z"/></svg>
            )}
          </button>
        </div>

        {/* Active card meta */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Now showing <span className="font-bold text-[#f97316]">{active.name}</span>
            {' · '}
            <span>{activeIndex + 1} of {total}</span>
            {' · '}
            <span className="text-xs">use ← / → or swipe</span>
          </p>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
            Not sure where to go? All locations offer our full range of water sports!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={waLink()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-full font-bold hover:bg-green-600 transition-all transform hover:scale-105">
              <span>Ask us on WhatsApp</span>
            </a>
            <Link to="/" className="flex items-center gap-2 bg-white dark:bg-[#422919] text-gray-700 dark:text-gray-300 px-6 py-3 rounded-full font-bold hover:bg-gray-100 dark:hover:bg-[#422919]/80 transition-all border border-gray-200 dark:border-gray-700">
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Keyframe for the pill autoplay progress */}
      <style>{`
        @keyframes loc-progress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}

export default LocationSelect;
