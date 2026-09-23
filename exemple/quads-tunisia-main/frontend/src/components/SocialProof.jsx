import { useState, useEffect, useRef } from 'react';

const BOOKINGS = [
  { name: 'Sophie', city: 'London', activity: 'Jet Ski', flag: '🇬🇧', time: '2 min ago' },
  { name: 'Mohammed', city: 'Paris', activity: 'Parasailing', flag: '🇫🇷', time: '5 min ago' },
  { name: 'Lars', city: 'Berlin', activity: 'Catamaran', flag: '🇩🇪', time: 'just now' },
  { name: 'Emma', city: 'Manchester', activity: 'Quad Biking', flag: '🇬🇧', time: '1 min ago' },
  { name: 'Fatima', city: 'Tunis', activity: 'Boat Trip', flag: '🇹🇳', time: '3 min ago' },
  { name: 'Luca', city: 'Milan', activity: 'Snorkelling', flag: '🇮🇹', time: 'just now' },
  { name: 'Ahmed', city: 'Dubai', activity: 'Jet Ski', flag: '🇦🇪', time: '4 min ago' },
  { name: 'Clara', city: 'Brussels', activity: 'Buggy Rides', flag: '🇧🇪', time: '2 min ago' },
  { name: 'Tom', city: 'Dublin', activity: 'Parasailing', flag: '🇮🇪', time: 'just now' },
  { name: 'Yasmine', city: 'Lyon', activity: 'Catamaran', flag: '🇫🇷', time: '6 min ago' },
  { name: 'David', city: 'Amsterdam', activity: 'Jet Ski', flag: '🇳🇱', time: '1 min ago' },
  { name: 'Sara', city: 'Madrid', activity: 'Boat Trip', flag: '🇪🇸', time: 'just now' },
];

const ACTIVITY_EMOJIS = {
  'Jet Ski': '🏄',
  'Parasailing': '🪂',
  'Catamaran': '⛵',
  'Quad Biking': '🏍️',
  'Buggy Rides': '🚗',
  'Boat Trip': '🚤',
  'Snorkelling': '🤿',
};

export default function SocialProof() {
  const [notification, setNotification] = useState(null);
  const [visible, setVisible] = useState(false);
  const indexRef = useRef(Math.floor(Math.random() * BOOKINGS.length));
  const timerRef = useRef(null);

  const showNext = () => {
    const entry = BOOKINGS[indexRef.current % BOOKINGS.length];
    indexRef.current += 1;
    setNotification(entry);
    setVisible(true);

    // Auto-hide after 4.5s
    setTimeout(() => setVisible(false), 4500);
  };

  useEffect(() => {
    // First popup after 8s, then every 35–50s
    const first = setTimeout(() => {
      showNext();
      timerRef.current = setInterval(showNext, 38000 + Math.random() * 12000);
    }, 8000);

    return () => {
      clearTimeout(first);
      clearInterval(timerRef.current);
    };
  }, []);

  if (!notification) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '90px',
        left: '20px',
        zIndex: 9998,
        transform: visible ? 'translateX(0)' : 'translateX(calc(-100% - 30px))',
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'white',
        borderRadius: '14px',
        padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid rgba(196, 81, 18,0.15)',
        maxWidth: '280px',
        minWidth: '240px',
      }}>
        {/* Avatar circle */}
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #c45112, #fbbf24)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          flexShrink: 0,
        }}>
          {ACTIVITY_EMOJIS[notification.activity] || '🌊'}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#422919', lineHeight: 1.3 }}>
            {notification.flag} {notification.name} from {notification.city}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#555', lineHeight: 1.3 }}>
            just booked <span style={{ color: '#c45112', fontWeight: 700 }}>{notification.activity}</span>
          </p>
          <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#aaa' }}>
            🕐 {notification.time}
          </p>
        </div>

        {/* Close */}
        <button
          onClick={() => setVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#ccc',
            fontSize: '16px',
            lineHeight: 1,
            padding: '2px',
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
