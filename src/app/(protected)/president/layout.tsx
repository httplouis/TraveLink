import PresidentLeftNav from "@/components/president/nav/PresidentLeftNav";

export default function PresidentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-[#7a0019] to-[#9a0020]">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center border-2 border-white/30">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">President</h1>
              <p className="text-xs text-white/80">Chief Operating Officer</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <PresidentLeftNav />
        </div>
        
        {/* User Info */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600 text-center font-medium">
            Final Authority
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
