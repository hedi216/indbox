import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center px-4 pt-32 pb-12">
      <div className="max-w-lg text-center">
        <p className="text-[#f97316] font-black text-7xl md:text-8xl mb-2 tracking-tighter">404</p>
        <h1 className="text-3xl md:text-4xl font-black mb-4 text-[#422919] dark:text-white">
          This wave got away.
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
          The page you're looking for doesn't exist or has drifted out to sea. Let's get you back on shore.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#c45112] to-[#fbbf24] text-white px-6 py-3 rounded-full font-bold hover:opacity-90 transition-opacity shadow-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
            Back to Home
          </Link>
          <Link
            to="/locations"
            className="inline-flex items-center justify-center gap-2 bg-white dark:bg-[#422919] text-[#422919] dark:text-white border border-gray-200 dark:border-gray-700 px-6 py-3 rounded-full font-bold hover:bg-gray-50 dark:hover:bg-[#422919]/80 transition-colors"
          >
            Browse Locations
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
