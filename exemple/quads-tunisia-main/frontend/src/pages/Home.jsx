import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { waLink, PHONE_DISPLAY, PHONE_TEL, SUPPORT_EMAIL } from '../utils/contact';
import { setSEO } from '../utils/seo';
import './Home.css';
import AdventureHero from '../components/AdventureHero';
import AIChat from '../components/AIChat';

// ── Branded SVG Icon Components ───────────────────────────────────────────────
const IcoJetski    = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17h18M5 17v-5l3-3h8l3 3v5"/><path d="M8 9V7l4-3 4 3v2"/></svg>;
const IcoParasail  = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="19" r="2"/><path d="M12 17v-7"/><path d="M5 10c0-4 7-8 7-8s7 4 7 8H5z"/></svg>;
const IcoCatamaran = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18M12 3v13"/><path d="M12 3L4 16h16L12 3z"/></svg>;
const IcoQuad      = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="8" rx="2"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/><line x1="7" y1="16" x2="7" y2="8"/><line x1="17" y1="16" x2="17" y2="8"/></svg>;
const IcoBuggy     = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="9" width="20" height="7" rx="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/><path d="M6 9V7h12v2"/></svg>;
const IcoBoat      = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 21l10-5 10 5"/><path d="M4 17V12h16v5"/><path d="M9 12V8l3-3 3 3v4"/></svg>;
const IcoWave      = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12c1.5-2 3-3 5-3s3.5 1 5 3 3.5 3 5 3"/><path d="M2 17c1.5-2 3-3 5-3s3.5 1 5 3 3.5 3 5 3"/></svg>;
const IcoShield    = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>;
const IcoAward     = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>;
const IcoUsers     = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IcoTool      = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const IcoGradCap   = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const IcoTag       = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const IcoMapPin    = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IcoStar      = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcoAnchor    = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>;
const IcoLifeRing  = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg>;
const IcoLightning = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IcoHeart     = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const IcoPhone     = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.68 9.59a19.79 19.79 0 0 1-3-8.59A2 2 0 0 1 3.62 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 7.91a16 16 0 0 0 6 6l.46-.46a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 15.92z"/></svg>;
const IcoMail      = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IcoChat      = (p) => <svg {...p} viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.48-8.45z"/></svg>;
const IcoSparkle   = (p) => <svg {...p} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4L22 12l-7.6 2.6L12 22l-2.4-7.4L2 12l7.6-2.6L12 2z"/></svg>;

const moodRecommendations = {
  thrill: {
    label: 'Adrenaline Seeker',
    icon: <IcoLightning className="w-8 h-8" />,
    gradient: 'from-orange-500 to-red-600',
    activities: [
      { name: 'Jet Ski', icon: <IcoJetski className="w-12 h-12" />, desc: '60 km/h rush on the waves!', price: 'From £25' },
      { name: 'Parasailing', icon: <IcoParasail className="w-12 h-12" />, desc: '50m above the Mediterranean!', price: 'From £25' },
      { name: 'Quad Biking', icon: <IcoQuad className="w-12 h-12" />, desc: 'Desert dunes at full throttle!', price: 'From £25' },
    ],
    tip: 'Combine Jet Ski + Parasailing for the ultimate adrenaline day!',
  },
  family: {
    label: 'Family Adventure',
    icon: <IcoUsers className="w-8 h-8" />,
    gradient: 'from-blue-500 to-cyan-500',
    activities: [
      { name: 'Boat Trip', icon: <IcoBoat className="w-12 h-12" />, desc: 'Explore the coast together', price: 'From £20' },
      { name: 'Catamaran', icon: <IcoCatamaran className="w-12 h-12" />, desc: 'Sailing fun for all ages!', price: 'From £150' },
      { name: 'Parasailing', icon: <IcoParasail className="w-12 h-12" />, desc: 'Take turns flying high!', price: 'From £25' },
    ],
    tip: 'Ask about our Family Package — kids under 10 get special rates!',
  },
  romantic: {
    label: 'Romantic Escape',
    icon: <IcoHeart className="w-8 h-8" />,
    gradient: 'from-pink-500 to-rose-600',
    activities: [
      { name: 'Sunset Catamaran', icon: <IcoCatamaran className="w-12 h-12" />, desc: 'Romance on the Mediterranean', price: 'From £150' },
      { name: 'Tandem Parasailing', icon: <IcoParasail className="w-12 h-12" />, desc: 'Fly together as one', price: 'From £25' },
      { name: 'Private Boat Trip', icon: <IcoBoat className="w-12 h-12" />, desc: 'Your own private cruise', price: 'From £20' },
    ],
    tip: 'Ask about our Sunset Romance Package — it\'s truly magical!',
  },
  chill: {
    label: 'Chill Explorer',
    icon: <IcoWave className="w-8 h-8" />,
    gradient: 'from-teal-500 to-emerald-500',
    activities: [
      { name: 'Boat Trip', icon: <IcoBoat className="w-12 h-12" />, desc: 'Peaceful coastal exploration', price: 'From £20' },
      { name: 'Catamaran', icon: <IcoCatamaran className="w-12 h-12" />, desc: 'Sail at your own pace', price: 'From £150' },
      { name: 'Buggy Ride', icon: <IcoBuggy className="w-12 h-12" />, desc: 'Scenic off-road tour', price: 'From £50' },
    ],
    tip: 'Our morning boat trips are the most serene experience we offer.',
  },
};

function Home() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [mood, setMood] = useState(null);
  const [liveBookings, setLiveBookings] = useState(247);
  const [counts, setCounts] = useState({ years: 0, customers: 0, activities: 0 });
  const [promoVisible, setPromoVisible] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const statsRef = useRef(null);
  const countersStarted = useRef(false);

  useEffect(() => {
    setSEO({
      title: 'Quad Adventures & Off-Road Escapes in Tunisia',
      image: `${window.location.origin}/images/hero-sahara.png`,
      description: 'Golden sand. Wide-open trails. A little dust and a lot of adrenaline. This is your wild side of Tunisia.',
      keywords: 'Quads Tunisia, water sports Tunisia, jet ski Sousse, parasailing Tunisia, boat trips Monastir, quad biking Tunisia, diving Tunisia, Sousse activities, Monastir activities, Tunisia adventure sports, book water sports Tunisia',
      path: '/',
    });
  }, []);

  // Sticky promo bar — show after scrolling 600px, hide if dismissed this session
  useEffect(() => {
    if (promoDismissed) return;
    const onScroll = () => setPromoVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [promoDismissed]);

  // Scroll-reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -80px 0px' }
    );
    const sections = document.querySelectorAll('[data-scroll-section]');
    sections.forEach((s) => observer.observe(s));
    return () => sections.forEach((s) => observer.unobserve(s));
  }, []);

  // Live bookings ticker
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.55) setLiveBookings((n) => n + 1);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Counter animation on stats visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !countersStarted.current) {
          countersStarted.current = true;
          const animate = (key, target, duration) => {
            const start = performance.now();
            const tick = (now) => {
              const t = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - t, 3);
              setCounts((p) => ({ ...p, [key]: Math.floor(eased * target) }));
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          };
          animate('years', 15, 1800);
          animate('customers', 50, 2400);
          animate('activities', 25, 1600);
        }
      },
      { threshold: 0.5 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const testimonials = [
    { name: 'Jessica Miller', location: 'London, UK', rating: 5, text: 'The most exhilarating experience of my life! The jet ski tour in Sousse was incredible, and the staff were so friendly and professional. Quads Tunisia made our vacation unforgettable!' },
    { name: 'Sophie Dubois', location: 'Paris, France', rating: 5, text: "Une expérience absolument fantastique à Monastir! Le catamaran était magnifique et l'équipe très professionnelle. Les eaux tunisiennes sont d'une beauté à couper le souffle!" },
    { name: 'Hans Mueller', location: 'Berlin, Germany', rating: 5, text: 'Fantastisches Erlebnis in Tunesien! Die Quad-Tour durch die Wüste war atemberaubend. Das Team war sehr professionell und die Ausrüstung top. Sousse ist wunderschön!' },
    { name: 'Marie Laurent', location: 'Lyon, France', rating: 5, text: "Magnifique aventure en quad dans les dunes de Tunisie! Le personnel parle français et est très accueillant. C'était le moment fort de nos vacances à Sousse!" },
    { name: 'Thomas Schmidt', location: 'Munich, Germany', rating: 5, text: 'Absolut empfehlenswert! Parasailing in Monastir war spektakulär. Der Blick auf die Küste war unvergesslich. Sehr sichere und unterhaltsame Aktivität für die ganze Familie!' },
    { name: 'Michael Roberts', location: 'Dublin, Ireland', rating: 5, text: "Best water sports experience ever! The buggy ride was thrilling and the catamaran cruise along the Tunisian coast was peaceful and beautiful. Can't wait to come back!" },
    { name: 'Pierre Rousseau', location: 'Marseille, France', rating: 5, text: "Superbe sortie en bateau le long de la côte de Monastir! L'eau cristalline, le soleil tunisien, et une équipe au top. Je recommande vivement Quads Tunisia à tous mes amis!" },
    { name: 'Sabine Weber', location: 'Hamburg, Germany', rating: 5, text: 'Unglaublich tolles Erlebnis mit meiner Familie in Sousse! Jet-Ski fahren hat so viel Spaß gemacht. Das Personal war sehr freundlich und hilfsbereit. Wir kommen definitiv wieder!' },
    { name: 'Emma Thompson', location: 'Manchester, UK', rating: 5, text: 'Amazing day out in Monastir! The kayaking tour was serene and the staff made sure we felt safe at all times. The Tunisian coastline is absolutely stunning. Highly recommend!' },
    { name: 'Claire Moreau', location: 'Nice, France', rating: 5, text: "Quelle aventure incroyable! Le jet-ski à Sousse était sensationnel. L'équipe d'Quads Tunisia était attentionnée et professionnelle. Des souvenirs inoubliables de nos vacances en Tunisie!" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const nextTestimonial = () => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  const prevTestimonial = () => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  // Activities data — extracted for clarity
  const activitiesShowcase = [
    { badge: 'From £25',  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBuKCLU64UbPYWpbap69H3Pg8he5rhKb1wsdekGqiTYvt8AC4KSrplFl1tD4HSQF9upQ6go-p5kJ5hsVnlAydI0nA_s8yr6oUQ6LvcgA5cCC6xPi4zTiOEZyiQ5_9iHD-IZ3NpiyXPFAMOlMhsqpRR6BlHAIIJ9IS6P2koVSwTm3OxYU-4tAUkaZxKzpdvlDIC6NY9KR9FdRefm42bMlMnOCkixo94K4A8KrysA3Qa51_3Ktr46CZCrKgMLrdXDlq7iIzBFsrLcLQN', alt: 'Quad Biking',  name: 'Quad Biking',  desc: 'Explore the desert dunes' },
    { badge: 'From £150', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOPjsTNaWYY94HF7nCoyYmUo84xGNzxFy09aI5kJw94_FtWTgetdeRzhVJMEq5V1wQOagvBppQyOMmkrc2f5SEfReUT_1sa53dkKtXf9QCMh69Cs0lh4T9LkGBkKhbeEEnzn2ZSyfiRYYzZ-pqqWPUfgGR8UUXR0pZo9lvlKeOpLevvDgpnXzjY5_uotU-O0swbj7DeSaP0zfPMjRiU43vHka6KKnW1z58R3_kjpWTeFQJqlm_xKQk0UZ-TMOy-SbrEjDdMrBCrEDz', alt: 'Catamaran',    name: 'Catamaran',    desc: 'Sail the Mediterranean' },
    { badge: 'From £25',  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGCOmXAGVnOj8ADVOfh-lf_kNIjzag6yUi7lh-QvTvbmVZcBbmy-Ox9SHWr8DQ9u-v6N_wMhGj8PdDfr3tLlxFigMZTtD2JaMFzBGJFsJenNz30jGRBVgUlsGu1pGSeF3D7L3ZQ5I43zdRMFlnIWlNd6WY3MU4l_CTxUlUXSgrwVtXElEeSP2OCCkZi-Yu3xUj4u5PStPlrzk7lvQna0r1Pqg2delCYYZ1lYRHgqELZhUJ-KbqsMeLcNx0os3ywrXhKBk1QgvLc4Cw', alt: 'Jet Skis',     name: 'Jet Skis',     desc: 'Feel the adrenaline rush' },
    { badge: 'From £25',  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDn05NvUr_JQMVOGBj_72WKYau3Dx1XlsLiT3YhXy8379hjQ0QGtPQjkcvnCHIzRn4zneU04fy8SDfEkA-HLabPnmjnsKkI3HxfXRAlv-tfKGF9lxW-uMTXti0Li2Q2u-q5HRBNiEjbPzW9jGnYTmxNqcHS4jux_xpgZQ7q2YCHj8XD_0Seu_KPx0RQGr1s8HKeq8O-t1--fi2Wf3erZfQKuDjwnDjxDQvWvExmngFOzilxlXpV5hJqoNsiWp5cKtqC8E8ndW7dM4XW', alt: 'Parasailing',  name: 'Parasailing',  desc: 'Soar above the waves' },
    { badge: 'From £50',  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiJPqUSqWRXi-vglU_y1WRkZVDKMBxCUVbfmmcWWNz8KPLm1dx7XLLVcmvLiB16coW3kXK9ZQ0RaIOdm_sbusmSC1H4ZdyQzuK0oJhe4OunwB1-1mLDxhoTiKUcUgLUcjn64fIe_nfufC2HYapLhEdiDnRa0ppxsvcDabqMns2hAh0NI9zEhIUjszrwVRiWrMRXl2AjDCWkriYNkGubHT7tiD-28SeXdZkI5ho07ZSArhbVBsYw_HHezxPyZKIPT-fXXi-qW7px6GS', alt: 'Buggy Rides',  name: 'Buggy Rides',  desc: 'Off-road adventure' },
    { badge: 'From £20',  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfKcgU40656170EBVgqB4xK1bI5woKN-lrfi0RNuSOQuVM8CBQJHH5ERlbslt6J0QMHIIE0bcbcsD00olUErZiqioJZoOiVqlEhKvc_xEzaODtSp6r-V0BNsr4URh-zGmS2hO6Wf9M8mnq7pafcdIREBsLN6_Wy_IP253KZGwWvcH6hO-HYqfphEfsIKwpdg97dLt_V9AnzqpzM3HEtLp8dhJgqsuT8KVxzEVlE2dv9N1i6hQHGrvPmmQXozB_r-IGu_vxEa3jcNhB', alt: 'Boat Trips',   name: 'Boat Trips',   desc: 'Cruise along the coast' },
  ];

  const whyChooseUs = [
    { icon: <IcoTool    className="w-7 h-7" />, title: 'Best Equipment',     desc: 'Brand-new, well-maintained gear meeting international safety standards for your comfort and safety.' },
    { icon: <IcoGradCap className="w-7 h-7" />, title: 'Expert Instructors', desc: 'Certified professionals fluent in English, French, German & Arabic ready to guide you.' },
    { icon: <IcoShield  className="w-7 h-7" />, title: 'Safety First',       desc: 'Comprehensive briefings and all protective equipment included — zero compromise on safety.' },
    { icon: <IcoTag     className="w-7 h-7" />, title: 'Best Prices',        desc: 'Competitive transparent pricing with no hidden fees and group discounts available.' },
    { icon: <IcoMapPin  className="w-7 h-7" />, title: 'Prime Locations',    desc: "Operating on Tunisia's most beautiful coastlines: Sousse, Monastir, Mahdia & Hammamet." },
    { icon: <IcoStar    className="w-7 h-7" />, title: '5-Star Reviews',     desc: 'Thousands of satisfied customers from UK, France, Germany and beyond rave about us.' },
  ];

  const promiseSteps = [
    { num: '01', icon: <IcoAnchor   className="w-7 h-7" />, title: 'Elite Equipment',    desc: 'Brand-new jet skis, premium boats and top-level gear maintained to international safety standards.' },
    { num: '02', icon: <IcoLifeRing className="w-7 h-7" />, title: 'Safety Guaranteed',  desc: 'Certified instructors, full briefings and zero-compromise protection for every single guest.' },
    { num: '03', icon: <IcoWave     className="w-7 h-7" />, title: 'Prime Coastlines',   desc: "Operating in Sousse, Monastir, Mahdia and Hammamet — Tunisia's most beautiful and thrilling coastline." },
  ];

  const t = testimonials[currentTestimonial];

  return (
    <>
      {/* ───────────── STICKY PROMO BAR ───────────── */}
      <div
        className="fixed bottom-0 inset-x-0 z-[9990]"
        style={{
          transform: promoVisible && !promoDismissed ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.2, 0.64, 1)',
          pointerEvents: promoVisible && !promoDismissed ? 'auto' : 'none',
        }}
      >
        <div className="flex items-center justify-center gap-4 px-5 py-3 flex-wrap text-white shadow-[0_-4px_24px_rgba(0,0,0,0.18)]"
             style={{ background: 'linear-gradient(90deg, #422919 0%, #c45112 60%, #fbbf24 100%)' }}>
          <span className="text-lg">🎁</span>
          <span className="text-sm font-semibold">
            First-time adventure? Get <strong>10% OFF</strong> your first booking — no code needed!
          </span>
          <Link to="/locations" className="bg-white text-[#422919] px-4 py-1.5 rounded-full font-bold text-xs whitespace-nowrap hover:opacity-85 transition-opacity">
            Book Now →
          </Link>
          <button
            onClick={() => { setPromoDismissed(true); setPromoVisible(false); }}
            className="text-white/70 hover:text-white text-xl leading-none px-1"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 01 — HERO                                                             */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <AdventureHero />

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 02 — ACTIVITIES SHOWCASE   (light background)                         */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <section
        id="activities"
        className="relative w-full bg-[#fff8ed] py-16 md:py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <p className="text-xs tracking-[0.4em] uppercase text-[#f97316] font-bold mb-3">
                — 02 · Our Experiences
              </p>
              <h2 className="text-5xl md:text-6xl font-black leading-[0.95] tracking-tight text-[#422919]">
                Discover Our<br />
                <span className="gradient-text italic">Adventures</span>
              </h2>
            </div>
            <p className="text-lg text-gray-500 max-w-md leading-relaxed md:text-right">
              Six handpicked experiences across Tunisia's most beautiful coastline. Pick your thrill.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {activitiesShowcase.map((act, idx) => (
              <div
                key={idx}
                className={`group relative overflow-hidden rounded-2xl aspect-[3/4] shadow-xl cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 animate-fade-in-up stagger-${(idx % 6) + 1}`}
              >
                <div className="activity-card-badge">{act.badge}</div>
                <img className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" alt={act.alt} src={act.img} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-2xl font-black leading-tight mb-2">{act.name}</p>
                  <p className="text-white/80 text-sm mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{act.desc}</p>
                  <Link to="/locations" className="bg-white text-[#422919] px-4 py-2 rounded-full font-bold text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#f97316] hover:text-white inline-block">
                    Book Now →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/locations" className="inline-flex items-center gap-2 text-[#422919] hover:text-[#f97316] font-bold text-base group">
              See all activities by location
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 03 — AI ADVENTURE PLANNER   (subtle gradient bg)                      */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <section
        id="ai-planner"
        className="relative w-full py-16 md:py-20 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #fff8ed 0%, #eaf4f7 100%)' }}
      >
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#f97316]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#fbbf24]/15 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <div className="ai-planner-badge mx-auto">
              <IcoSparkle width="16" height="16" />
              AI Adventure Planner
            </div>
            <h2 className="text-5xl md:text-6xl font-black leading-[0.95] tracking-tight text-[#422919] mb-4 mt-2">
              Find Your <span className="gradient-text italic">Perfect Match</span>
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Tell us what kind of experience you're after — our AI will handpick the best activities just for you.
            </p>
          </div>

          <div className="mood-grid">
            {Object.entries(moodRecommendations).map(([key, rec]) => (
              <button key={key} onClick={() => setMood(mood === key ? null : key)} className={`mood-btn ${mood === key ? 'active' : ''}`}>
                <span className="mood-icon">{rec.icon}</span>
                <span className="mood-label">{rec.label}</span>
              </button>
            ))}
          </div>

          {mood && (
            <div className="ai-rec-panel">
              <div className="ai-rec-header">
                <div className="ai-rec-avatar">🤖</div>
                <div>
                  <p className="font-bold text-white text-lg">
                    Quads AI recommends for <span className="text-[#f97316]">{moodRecommendations[mood].label}s</span>:
                  </p>
                  <p className="text-white/60 text-sm">Based on your vibe, here are the perfect picks</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mt-8">
                {moodRecommendations[mood].activities.map((act, i) => (
                  <div key={i} className="ai-rec-card" style={{ animationDelay: `${i * 0.12}s` }}>
                    <div className="mb-3 flex justify-center text-[#c45112]">{act.icon}</div>
                    <h3 className="text-xl font-black mb-2 text-[#422919]">{act.name}</h3>
                    <p className="text-gray-500 text-sm mb-4 leading-relaxed">{act.desc}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[#f97316] font-bold text-sm">{act.price}</span>
                      <Link to="/locations" className="bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white px-4 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-all hover:scale-105 shadow-md">
                        Book →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ai-rec-tip">
                <span className="tip-icon">💡</span>
                <div><strong>Quads AI Tip:</strong> {moodRecommendations[mood].tip}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 04 — STATS BAND   (full-bleed dark, breaks rhythm)                    */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <section
        id="stats"
        ref={statsRef}
        className="relative w-full py-14 md:py-16 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #422919 0%, #c45112 60%, #fbbf24 100%)' }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.4em] uppercase text-white/60 font-bold mb-2">— 04 · By the Numbers</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">15 years. Thousands of smiles.</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8">
            {[
              { val: `${counts.years}+`,     label: 'Years Experience', icon: <IcoAward  className="w-10 h-10 mx-auto" /> },
              { val: `${counts.customers}K+`,label: 'Happy Customers',  icon: <IcoUsers  className="w-10 h-10 mx-auto" /> },
              { val: '100%',                 label: 'Safety Record',    icon: <IcoShield className="w-10 h-10 mx-auto" /> },
              { val: `${counts.activities}+`,label: 'Activities',       icon: <IcoWave   className="w-10 h-10 mx-auto" /> },
            ].map((stat, i) => (
              <div key={i} className="text-center text-white">
                <div className="mb-3 opacity-80">{stat.icon}</div>
                <div className="text-6xl md:text-7xl font-black mb-2 tracking-tight stat-number">{stat.val}</div>
                <p className="text-sm font-medium uppercase tracking-widest text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 05 — TESTIMONIALS   (clean editorial style, single quote in focus)    */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <section
        id="testimonials"
        className="relative w-full bg-white py-16 md:py-20"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.4em] uppercase text-[#f97316] font-bold mb-3">— 05 · Happy Adventurers</p>
            <h2 className="text-5xl md:text-6xl font-black leading-[0.95] tracking-tight text-[#422919]">
              What Our <span className="gradient-text italic">Adventurers</span> Say
            </h2>
          </div>

          <div className="relative">
            {/* Giant quote mark */}
            <div className="absolute -top-8 -left-4 md:-left-8 text-[160px] md:text-[220px] leading-none font-black text-[#f97316]/15 pointer-events-none select-none">"</div>

            <div className="relative bg-gradient-to-br from-white to-[#fff8ed] rounded-3xl shadow-2xl shadow-[#f97316]/10 p-10 md:p-16 border border-gray-100">
              <div className="flex justify-start text-yellow-400 mb-6">
                {[...Array(t.rating)].map((_, i) => <span key={i} className="text-2xl">★</span>)}
              </div>
              <blockquote className="text-2xl md:text-3xl font-medium text-[#422919] leading-relaxed mb-8 min-h-[140px]">
                {t.text}
              </blockquote>
              <div className="flex items-center justify-between flex-wrap gap-4 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c45112] to-[#fbbf24] flex items-center justify-center text-white font-black text-lg">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-[#422919]">{t.name}</p>
                    <p className="text-sm text-[#f97316] font-medium">{t.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={prevTestimonial} aria-label="Previous testimonial" className="w-11 h-11 rounded-full bg-white border border-gray-200 hover:border-[#f97316] hover:bg-[#f97316] hover:text-white transition-all flex items-center justify-center text-[#422919]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <span className="text-sm font-bold text-gray-400 px-3 tabular-nums">
                    {String(currentTestimonial + 1).padStart(2, '0')} / {String(testimonials.length).padStart(2, '0')}
                  </span>
                  <button onClick={nextTestimonial} aria-label="Next testimonial" className="w-11 h-11 rounded-full bg-white border border-gray-200 hover:border-[#f97316] hover:bg-[#f97316] hover:text-white transition-all flex items-center justify-center text-[#422919]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-1.5 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                aria-label={`Testimonial ${index + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentTestimonial ? 'bg-[#f97316] w-8' : 'bg-gray-300 w-1.5 hover:bg-gray-400'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 06 — WHY CHOOSE US   (alternating zig-zag layout)                     */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <section
        id="why-choose-us"
        className="relative w-full bg-[#fff8ed] py-16 md:py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="text-xs tracking-[0.4em] uppercase text-[#f97316] font-bold mb-3">— 06 · Why Us</p>
            <h2 className="text-5xl md:text-6xl font-black leading-[0.95] tracking-tight text-[#422919] mb-4">
              Why Choose <span className="gradient-text italic">Quads Tunisia</span>?
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Your trusted partner for premium water adventures since 2010.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyChooseUs.map((item, i) => (
              <div
                key={i}
                className="group relative bg-white rounded-2xl p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#f97316]/10 border border-transparent hover:border-[#f97316]/20"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#c45112]/10 to-[#fbbf24]/10 flex items-center justify-center text-[#c45112] mb-5 group-hover:from-[#c45112] group-hover:to-[#fbbf24] group-hover:text-white transition-all duration-500">
                  {item.icon}
                </div>
                <h3 className="text-xl font-black mb-3 text-[#422919]">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed text-[15px]">{item.desc}</p>
                <div className="absolute top-6 right-6 text-xs font-bold tracking-widest text-gray-200 group-hover:text-[#f97316] transition-colors">
                  0{i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 07 — THE Quads Tunisia DIFFERENCE   (dark, 3-step promise)              */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <section
        id="location"
        className="relative w-full py-16 md:py-20 overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at top, #422919 0%, #000d1a 100%)' }}
      >
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-[#f97316]/30 blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[#fbbf24]/20 blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="text-xs tracking-[0.4em] uppercase text-[#f97316] font-bold mb-3">— 07 · Our Promise</p>
            <h2 className="text-5xl md:text-6xl font-black leading-[0.95] tracking-tight text-white mb-4">
              The <span className="gradient-text italic">Quads Tunisia</span> Difference
            </h2>
            <p className="text-lg text-white/60 leading-relaxed">
              Premium experiences crafted for thrill, safety and unforgettable memories.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {promiseSteps.map((step, i) => (
              <div
                key={i}
                className="relative group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 transition-all duration-500 hover:bg-white/10 hover:border-[#f97316]/40 hover:-translate-y-2"
              >
                <div className="absolute -top-4 left-8 px-3 py-1 rounded-full bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-[#422919] text-xs font-black tracking-widest">
                  STEP {step.num}
                </div>
                <div className="w-14 h-14 rounded-xl bg-[#f97316]/10 flex items-center justify-center text-[#f97316] mb-5 mt-3 group-hover:bg-[#f97316] group-hover:text-[#422919] transition-all duration-500">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-black mb-3 text-white">{step.title}</h3>
                <p className="text-white/60 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 08 — FINAL CTA                                                        */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <section
        id="cta"
        className="relative w-full py-16 md:py-20 text-white text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #422919 0%, #c45112 70%, #fbbf24 100%)' }}
      >
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative max-w-4xl mx-auto px-6">
          <div className="flex justify-center mb-6">
            <IcoWave className="w-16 h-16 text-white/60" />
          </div>
          <h2 className="text-5xl md:text-7xl font-black mb-4 leading-[0.95] tracking-tight">
            Ready for Your<br />
            <span className="text-yellow-300 italic">Adventure?</span>
          </h2>
          <p className="text-xl md:text-2xl mb-2 text-white/80">Tunisia is waiting. Book now and get</p>
          <p className="text-3xl md:text-4xl font-black text-yellow-300 mb-12">10% off your first activity!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
            <a href={`tel:${PHONE_TEL}`} className="cta-contact-btn bg-white text-[#422919] hover:bg-gray-50">
              <IcoPhone className="w-6 h-6" />
              <span>{PHONE_DISPLAY}</span>
            </a>
            <a href={waLink()} target="_blank" rel="noopener noreferrer" className="cta-contact-btn bg-green-500 text-white hover:bg-green-600">
              <IcoChat className="w-6 h-6" />
              <span>WhatsApp Us</span>
            </a>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="cta-contact-btn bg-[#f97316] text-[#422919] hover:bg-[#ea580c]">
              <IcoMail className="w-6 h-6" />
              <span>Email Us</span>
            </a>
          </div>
        </div>
      </section>

      {/* AI Chat Widget */}
      <AIChat />
    </>
  );
}

export default Home;
