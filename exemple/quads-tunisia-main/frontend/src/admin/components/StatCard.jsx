const StatCard = ({ title, value, icon, trend, trendValue, color = 'blue' }) => {
  const colorClasses = {
    blue: 'from-[#667eea] to-[#764ba2]',
    green: 'from-[#4caf50] to-[#45a049]',
    orange: 'from-[#ff9800] to-[#f57c00]',
    purple: 'from-[#9c27b0] to-[#7b1fa2]',
    cyan: 'from-[#c45112] to-[#fbbf24]',
  };

  return (
    <div className="bg-white dark:bg-[#29231c] rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
            {title}
          </p>
          <p className="text-3xl font-black text-[#422919] dark:text-white mb-2">
            {value}
          </p>
          {trend && (
            <div className="flex items-center space-x-1">
              <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                {trend === 'up' ? '↑' : '↓'}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div
          className={`w-14 h-14 rounded-xl bg-gradient-to-r ${colorClasses[color]} flex items-center justify-center shadow-lg`}
        >
          <span className="text-3xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
