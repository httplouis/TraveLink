"use client";

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero Skeleton */}
      <div className="h-48 bg-gradient-to-br from-[#7a0019] to-[#9a0020] rounded-xl p-6 flex items-center justify-between">
        <div className="space-y-3">
          <div className="h-6 w-64 bg-white/20 rounded"></div>
          <div className="h-12 w-48 bg-white/20 rounded"></div>
          <div className="h-4 w-40 bg-white/20 rounded"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-white/20 rounded-lg"></div>
          <div className="h-10 w-32 bg-white/20 rounded-lg"></div>
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-32 bg-gray-200 rounded"></div>
              <div className="h-5 w-5 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Upcoming Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
          <div className="h-48 bg-gray-100 rounded"></div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

