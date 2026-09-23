import { Link } from 'react-router-dom';
import { PHONE_DISPLAY, SUPPORT_EMAIL } from '../utils/contact';

function Footer() {
  return (
    <footer className="w-full bg-[#422919] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <Link to="/" aria-label="Quads Tunisia home" className="inline-block bg-white rounded-xl p-2 mb-4"><img src="/brand-logo.png" alt="Quads Tunisia" width="208" height="176" loading="lazy" style={{ width: '208px', height: '176px', objectFit: 'contain' }} /></Link>
          <p className="text-gray-300 mb-4">Your ultimate water sports destination in Tunisia. Sousse, Monastir, Mahdia & Hammamet.</p>
        </div>
        <div>
          <h4 className="text-xl font-bold mb-4">Quick Links</h4>
          <ul className="space-y-2">
            <li><Link to="/locations" className="hover:text-[#f97316] transition-colors">Activities</Link></li>
            <li><Link to="/locations" className="hover:text-[#f97316] transition-colors">Book Now</Link></li>
            <li><Link to="/about" className="hover:text-[#f97316] transition-colors">About Us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xl font-bold mb-4">Contact Info</h4>
          <ul className="space-y-2 text-gray-300">
            <li>📞 {PHONE_DISPLAY}</li>
            <li>✉️ {SUPPORT_EMAIL}</li>
            <li>📍 Sousse, Tunisia</li>
            <li>📍 Monastir, Tunisia</li>
            <li>📍 Mahdia, Tunisia</li>
            <li>📍 Hammamet, Tunisia</li>
            <li>🕒 Open Daily: 8AM - 7PM</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
        <p>&copy; 2025 Quads Tunisia. All rights reserved. | Privacy Policy | Terms & Conditions</p>
      </div>
    </footer>
  );
}

export default Footer;
