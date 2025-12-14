"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, History, User, LogOut, Menu, X, Home } from "lucide-react";
import PageTitle from "@/components/common/PageTitle";
import { createSupabaseClient } from "@/lib/supabase/client";

interface DriverProfile {
  name: string;
  employee_id: string;
}

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = React.useState<DriverProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/driver/profile");
        const data = await res.json();
        if (data.ok && data.data) {
          setProfile({ name: data.data.full_name || "Driver", employee_id: data.data.employee_id || "N/A" });
        }
      } catch (err) { console.error("Error fetching profile:", err); }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createSupabaseClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) { console.error("Logout error:", err); setLoggingOut(false); }
  };

  const navItems = [
    { href: "/driver", icon: Home, label: "Dashboard" },
    { href: "/driver/schedule", icon: Calendar, label: "My Schedule" },
    { href: "/driver/history", icon: History, label: "Trip History" },
    { href: "/driver/profile", icon: User, label: "My Profile" },
  ];

  const isActive = (href: string) => {
    if (href === "/driver") return pathname === "/driver";
    return pathname?.startsWith(href);
  };

  return (
    <>
      <PageTitle title="Travelink | Driver Portal" />
      <div className="min-h-screen bg-gray-50">
        <header className="bg-[#7a0019] text-white sticky top-0 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">D</div>
                <div><h1 className="text-lg font-bold">Travelink</h1><p className="text-xs text-white/70">Driver Portal</p></div>
              </div>
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (<Link key={item.href} href={item.href} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.href) ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`}><item.icon className="h-4 w-4" />{item.label}</Link>))}
              </nav>
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right"><p className="text-sm font-medium">{profile?.name || "Loading..."}</p><p className="text-xs text-white/70">{profile?.employee_id}</p></div>
                <button onClick={handleLogout} disabled={loggingOut} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"><LogOut className="h-4 w-4" />{loggingOut ? "..." : "Logout"}</button>
              </div>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 hover:bg-white/10 rounded-lg">{mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
            </div>
          </div>
          {mobileMenuOpen && (<div className="md:hidden border-t border-white/20 bg-[#5c000c]"><div className="px-4 py-3 border-b border-white/10"><p className="font-medium">{profile?.name || "Loading..."}</p><p className="text-xs text-white/70">{profile?.employee_id}</p></div><nav className="py-2">{navItems.map((item) => (<Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 text-sm ${isActive(item.href) ? "bg-white/10 text-white font-medium" : "text-white/80 hover:bg-white/5"}`}><item.icon className="h-5 w-5" />{item.label}</Link>))}<button onClick={handleLogout} disabled={loggingOut} className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/5 w-full"><LogOut className="h-5 w-5" />{loggingOut ? "Logging out..." : "Logout"}</button></nav></div>)}
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </div>
    </>
  );
}
