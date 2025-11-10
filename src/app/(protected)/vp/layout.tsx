import VPLeftNav from "@/components/vp/nav/VPLeftNav";

export default function VPLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">VP</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">VP Portal</h1>
              <p className="text-xs text-gray-600">Vice President</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <VPLeftNav />
        </div>
        
        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Logged in as VP
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
