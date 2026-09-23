import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const location = useLocation();
  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    let prev = 0;
    const onScroll = () => {
      const cur = window.pageYOffset;
      if (cur > prev && cur > 80) {
        setHidden(true);
        setMenuOpen(false);
      } else {
        setHidden(false);
      }
      prev = cur;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Activities', to: '/locations' },
    { label: 'My Bookings', to: '/my-bookings' },
    { label: 'About Us', to: '/about' },
  ];

  const tickerItems = [
    { emoji: '🏄', name: 'Jet Ski', price: 'From £25' },
    { emoji: '🪂', name: 'Parasailing', price: 'From £25' },
    { emoji: '⛵', name: 'Catamaran', price: 'From £150' },
    { emoji: '🏍️', name: 'Quad Biking', price: 'From £25' },
    { emoji: '🚗', name: 'Buggy Rides', price: 'From £50' },
    { emoji: '🚤', name: 'Boat Trip', price: 'From £20' },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 w-full bg-white shadow-md"
      style={{
        transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Rolling activities ticker */}
      <div className="w-full h-8 overflow-hidden bg-gradient-to-r from-[#c45112] to-[#fbbf24] flex items-center">
        <div className="ticker-track">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-2 px-6 text-xs font-bold text-white whitespace-nowrap"
            >
              <span>{item.emoji}</span>
              <span>{item.name}</span>
              <span className="text-white/80 font-semibold">{item.price}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex items-center justify-between py-2 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center transition-opacity duration-300 hover:opacity-80">
          <img
            src="/brand-logo.png"
            alt="Quads Tunisia"
            width="112" height="72"
            style={{ height: '72px', width: '112px', objectFit: 'contain' }}
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium leading-normal transition-colors ${
                isActive(link.to)
                  ? 'text-[#c45112] font-bold'
                  : 'text-[#422919] hover:text-[#c45112]'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/locations"
            className="flex items-center justify-center rounded-full h-10 px-6 bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white text-sm font-bold tracking-[0.015em] hover:opacity-90 transition-all transform hover:scale-105 shadow-md"
          >
            Book Now
          </Link>
        </nav>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-[#422919] p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="flex flex-col pb-6 gap-1 bg-white/95 backdrop-blur-md rounded-b-2xl px-4 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`text-base font-medium py-3 px-4 rounded-lg transition-colors ${
                isActive(link.to)
                  ? 'text-[#c45112] bg-[#c45112]/10 font-bold'
                  : 'text-[#422919] hover:text-[#c45112] hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/locations"
            onClick={() => setMenuOpen(false)}
            className="w-full bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white py-3 rounded-full font-bold mt-3 text-center shadow-md"
          >
            Book Now
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
