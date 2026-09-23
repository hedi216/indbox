const Pulse = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);

export function SkeletonTableRow({ cols = 6 }) {
  return (
    <tr className="border-t border-gray-100 dark:border-gray-800">
      {[...Array(cols)].map((_, i) => (
        <td key={i} className="py-4 px-6">
          <Pulse className="h-4 w-full rounded-md" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonActivityCard() {
  return (
    <div className="bg-white dark:bg-[#29231c] rounded-2xl shadow-lg overflow-hidden">
      <div className="h-48 animate-pulse bg-gray-200 dark:bg-gray-700" />
      <div className="p-6 space-y-3">
        <div className="flex justify-between items-start">
          <Pulse className="h-5 w-2/3 rounded-md" />
          <Pulse className="h-6 w-16 rounded-full" />
        </div>
        <Pulse className="h-3 w-full rounded-md" />
        <Pulse className="h-3 w-4/5 rounded-md" />
        <div className="space-y-2 pt-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <Pulse className="h-3 w-1/3 rounded-md" />
              <Pulse className="h-3 w-1/4 rounded-md" />
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <Pulse className="h-9 flex-1 rounded-lg" />
          <Pulse className="h-9 flex-1 rounded-lg" />
          <Pulse className="h-9 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white dark:bg-[#29231c] rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <Pulse className="h-4 w-28 rounded-md" />
        <Pulse className="h-12 w-12 rounded-xl" />
      </div>
      <Pulse className="h-9 w-24 rounded-md mb-2" />
      <Pulse className="h-3 w-32 rounded-md" />
    </div>
  );
}

export function SkeletonDashboardTable({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 items-center py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex-1 space-y-1.5">
            <Pulse className="h-4 w-1/3 rounded-md" />
            <Pulse className="h-3 w-1/4 rounded-md" />
          </div>
          <Pulse className="h-4 w-24 rounded-md" />
          <Pulse className="h-4 w-20 rounded-md" />
          <Pulse className="h-4 w-16 rounded-md" />
          <Pulse className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
