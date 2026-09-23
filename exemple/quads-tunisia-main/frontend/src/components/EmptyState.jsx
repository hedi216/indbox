const ILLUSTRATIONS = {
  bookings: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="12" y="16" width="56" height="52" rx="6" fill="#fff0d6" stroke="#f97316" strokeWidth="2.5"/>
      <rect x="24" y="8" width="8" height="16" rx="4" fill="#f97316"/>
      <rect x="48" y="8" width="8" height="16" rx="4" fill="#f97316"/>
      <line x1="12" y1="34" x2="68" y2="34" stroke="#f97316" strokeWidth="2"/>
      <rect x="24" y="44" width="10" height="10" rx="2" fill="#fed7aa"/>
      <rect x="46" y="44" width="10" height="10" rx="2" fill="#fed7aa"/>
    </svg>
  ),
  activities: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <ellipse cx="40" cy="62" rx="28" ry="8" fill="#fff0d6"/>
      <path d="M20 62 Q25 40 40 30 Q55 40 60 62" fill="#fed7aa" stroke="#f97316" strokeWidth="2.5" strokeLinejoin="round"/>
      <circle cx="40" cy="24" r="10" fill="#f97316" opacity="0.2" stroke="#f97316" strokeWidth="2.5"/>
      <path d="M37 24 l3-5 3 5h-6z" fill="#f97316"/>
    </svg>
  ),
  users: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="28" r="16" fill="#fff0d6" stroke="#f97316" strokeWidth="2.5"/>
      <path d="M16 68c0-13.25 10.75-24 24-24s24 10.75 24 24" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" fill="#fff0d6"/>
      <path d="M35 25 l5-6 5 6h-3v5h-4v-5h-3z" fill="#f97316"/>
    </svg>
  ),
  search: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="34" cy="34" r="20" fill="#fff0d6" stroke="#f97316" strokeWidth="2.5"/>
      <line x1="49" y1="49" x2="66" y2="66" stroke="#f97316" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="26" y1="34" x2="42" y2="34" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
      <line x1="34" y1="26" x2="34" y2="42" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  default: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="12" y="20" width="56" height="44" rx="8" fill="#fff0d6" stroke="#f97316" strokeWidth="2.5"/>
      <path d="M28 42h24M28 52h16" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="40" cy="32" r="6" fill="#fed7aa" stroke="#f97316" strokeWidth="2"/>
    </svg>
  ),
};

export default function EmptyState({
  type = 'default',
  title = 'Nothing here yet',
  subtitle = 'No data to display at the moment.',
  action = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="mb-5 opacity-90">{ILLUSTRATIONS[type] || ILLUSTRATIONS.default}</div>
      <h3 className="text-xl font-black text-[#422919] dark:text-white mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs leading-relaxed mb-6">{subtitle}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-md"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
