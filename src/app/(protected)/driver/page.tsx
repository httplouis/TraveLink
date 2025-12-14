"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, MapPin, Clock, Car, ChevronRight, Star, CheckCircle2 } from "lucide-react";

interface UpcomingTrip {
  id: string;
  request_number: string;
  title: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  vehicle_name: string;
  plate_number: string;
}

interface Stats {
  upcoming: number;
  completed: number;
  avgRating: string;
}

export default function DriverDashboard() {
  const [stats, setStats] = React.useState<Stats>({ upcoming: 0, completed: 0, avgRating: "N/A" });
  const [upcomingTrips, setUpcomingTrips] = React.useState<UpcomingTrip[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const statsRes = await fetch("/api/driver/stats");
        const statsData = await statsRes.json();
        if (statsData.ok && statsData.data) {
          setStats(statsData.data);
        }

        // Fetch upcoming trips
        const scheduleRes = await fetch("/api/driver/schedule");
        const scheduleData = await scheduleRes.json();
        if (scheduleData.ok && scheduleData.data) {
          setUpcomingTrips(scheduleData.data.slice(0, 3)); // Show only first 3
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, Driver!</h1>
        <p className="text-gray-500 mt-1">Here&apos;s your overview for today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.upcoming}</div>
          <div className="text-sm text-gray-500 mt-1">Upcoming Trips</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.completed}</div>
          <div className="text-sm text-gray-500 mt-1">Completed</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Star className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.avgRating}</div>
          <div className="text-sm text-gray-500 mt-1">Avg Rating</div>
        </div>
      </div>


      {/* Upcoming Trips Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Trips</h2>
          <Link
            href="/driver/schedule"
            className="text-sm text-[#7a0019] hover:underline flex items-center gap-1"
          >
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {upcomingTrips.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No upcoming trips scheduled</p>
            <p className="text-sm text-gray-400 mt-1">Check back later for new assignments</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcomingTrips.map((trip) => (
              <div key={trip.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Date Badge */}
                  <div className="flex-shrink-0 w-16 text-center">
                    <div className="bg-[#7a0019] text-white rounded-lg py-2 px-3">
                      <div className="text-xs font-medium">{formatDate(trip.departure_date)}</div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{trip.title}</h3>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{trip.destination}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{trip.departure_time || "TBD"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Car className="h-4 w-4 text-gray-400" />
                          <span>{trip.vehicle_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/driver/schedule"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#7a0019] hover:shadow-md transition-all group"
        >
          <Calendar className="h-8 w-8 text-[#7a0019] mb-3" />
          <h3 className="font-semibold text-gray-900 group-hover:text-[#7a0019]">My Schedule</h3>
          <p className="text-sm text-gray-500 mt-1">View all your assigned trips</p>
        </Link>
        <Link
          href="/driver/history"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#7a0019] hover:shadow-md transition-all group"
        >
          <CheckCircle2 className="h-8 w-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900 group-hover:text-[#7a0019]">Trip History</h3>
          <p className="text-sm text-gray-500 mt-1">Review completed trips & feedback</p>
        </Link>
      </div>
    </div>
  );
}
