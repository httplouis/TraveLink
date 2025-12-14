// src/app/(protected)/admin/feedback/page.tsx
"use client";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  MessageSquare,
  Calendar,
  MapPin,
  User,
  Star,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Filter,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  Reply,
  Trash2,
  Download,
  RefreshCw,
  Sparkles,
  Car,
  Users,
  Building2,
  Phone,
  Mail,
} from "lucide-react";

type FeedbackItem = {
  id: string;
  user_id: string | null;
  user_name: string;
  user_email: string | null;
  trip_id: string | null;
  driver_id: string | null;
  vehicle_id: string | null;
  rating: number | null;
  message: string;
  category: string | null;
  status: string;
  admin_response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data from API
  trip?: {
    id: string;
    request_number: string;
    title?: string;
    purpose?: string;
    destination: string;
    travel_start_date: string;
    travel_end_date: string;
    requester_name: string;
    status: string;
    department?: { id: string; name: string; code: string };
    assigned_driver?: { id: string; name: string; email: string };
    assigned_vehicle?: { id: string; plate_number: string; vehicle_name: string; type: string };
  };
};

type Trip = {
  id: string;
  request_number: string;
  requester_name: string;
  destination: string;
  travel_start_date: string;
  travel_end_date: string;
  status: string;
  department?: { code: string; name: string };
};

type Analytics = {
  totalFeedback: number;
  averageRating: number;
  ratingTrend: number;
  newCount: number;
  reviewedCount: number;
  resolvedCount: number;
  categoryBreakdown: { category: string; count: number }[];
  ratingDistribution: { rating: number; count: number }[];
  recentTrend: { date: string; count: number; avgRating: number }[];
};

export default function FeedbackPage() {
  const [feedback, setFeedback] = React.useState<FeedbackItem[]>([]);
  const [completedTrips, setCompletedTrips] = React.useState<Trip[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingTrips, setLoadingTrips] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"analytics" | "feedback" | "trips">("analytics");
  const [selectedFeedback, setSelectedFeedback] = React.useState<FeedbackItem | null>(null);
  const [showDetailModal, setShowDetailModal] = React.useState(false);
  const [showResponseModal, setShowResponseModal] = React.useState(false);
  const [responseText, setResponseText] = React.useState("");
  const [submittingResponse, setSubmittingResponse] = React.useState(false);
  const [selectedTrip, setSelectedTrip] = React.useState<Trip | null>(null);
  const [showQRModal, setShowQRModal] = React.useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [ratingFilter, setRatingFilter] = React.useState<string>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");

  // Analytics
  const [analytics, setAnalytics] = React.useState<Analytics>({
    totalFeedback: 0,
    averageRating: 0,
    ratingTrend: 0,
    newCount: 0,
    reviewedCount: 0,
    resolvedCount: 0,
    categoryBreakdown: [],
    ratingDistribution: [],
    recentTrend: [],
  });

  React.useEffect(() => {
    loadFeedback();
    loadCompletedTrips();
  }, []);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/feedback-with-trips?limit=100");
      const json = await res.json();
      if (json.ok) {
        const feedbackData = json.data || [];
        setFeedback(feedbackData);
        calculateAnalytics(feedbackData);
      }
    } catch (err) {
      console.error("Failed to load feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedTrips = async () => {
    try {
      const res = await fetch("/api/admin/completed-trips");
      const json = await res.json();
      if (json.ok) {
        setCompletedTrips(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load completed trips:", err);
    } finally {
      setLoadingTrips(false);
    }
  };

  const calculateAnalytics = (data: FeedbackItem[]) => {
    const total = data.length;
    const withRating = data.filter((f) => f.rating !== null);
    const avgRating = withRating.length > 0
      ? withRating.reduce((sum, f) => sum + (f.rating || 0), 0) / withRating.length
      : 0;

    // Status counts
    const newCount = data.filter((f) => f.status === "new").length;
    const reviewedCount = data.filter((f) => f.status === "reviewed").length;
    const resolvedCount = data.filter((f) => f.status === "resolved").length;

    // Category breakdown
    const categoryMap = new Map<string, number>();
    data.forEach((f) => {
      const cat = f.category || "general";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });
    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Rating distribution
    const ratingMap = new Map<number, number>();
    withRating.forEach((f) => {
      const r = f.rating || 0;
      ratingMap.set(r, (ratingMap.get(r) || 0) + 1);
    });
    const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: ratingMap.get(rating) || 0,
    }));

    // Recent trend (last 7 days)
    const now = new Date();
    const recentTrend: { date: string; count: number; avgRating: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayFeedback = data.filter((f) => f.created_at.startsWith(dateStr));
      const dayWithRating = dayFeedback.filter((f) => f.rating !== null);
      recentTrend.push({
        date: dateStr,
        count: dayFeedback.length,
        avgRating: dayWithRating.length > 0
          ? dayWithRating.reduce((sum, f) => sum + (f.rating || 0), 0) / dayWithRating.length
          : 0,
      });
    }

    // Calculate trend (compare last 3 days vs previous 3 days)
    const last3 = recentTrend.slice(-3);
    const prev3 = recentTrend.slice(-6, -3);
    const last3Avg = last3.reduce((sum, d) => sum + d.avgRating, 0) / 3;
    const prev3Avg = prev3.reduce((sum, d) => sum + d.avgRating, 0) / 3;
    const ratingTrend = prev3Avg > 0 ? ((last3Avg - prev3Avg) / prev3Avg) * 100 : 0;

    setAnalytics({
      totalFeedback: total,
      averageRating: avgRating,
      ratingTrend,
      newCount,
      reviewedCount,
      resolvedCount,
      categoryBreakdown,
      ratingDistribution,
      recentTrend,
    });
  };

  const handleRespond = async () => {
    if (!selectedFeedback || !responseText.trim()) return;
    setSubmittingResponse(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedFeedback.id,
          admin_response: responseText,
          status: "reviewed",
        }),
      });
      const json = await res.json();
      if (json.ok) {
        await loadFeedback();
        setShowResponseModal(false);
        setResponseText("");
        setSelectedFeedback(null);
      }
    } catch (err) {
      console.error("Failed to respond:", err);
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleDelete = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} feedback item(s)?`)) return;
    try {
      for (const id of ids) {
        await fetch(`/api/feedback?id=${id}`, { method: "DELETE" });
      }
      await loadFeedback();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      await loadFeedback();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Filter feedback
  const filteredFeedback = feedback.filter((f) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !f.user_name.toLowerCase().includes(q) &&
        !f.message.toLowerCase().includes(q) &&
        !(f.user_email || "").toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (statusFilter !== "all" && f.status !== statusFilter) return false;
    if (ratingFilter !== "all" && String(f.rating) !== ratingFilter) return false;
    if (categoryFilter !== "all" && f.category !== categoryFilter) return false;
    return true;
  });

  const categories = [...new Set(feedback.map((f) => f.category || "general"))];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#7A0010] to-[#9c2a3a] rounded-xl text-white">
              <MessageSquare className="h-6 w-6" />
            </div>
            Feedback Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            View analytics, manage feedback, and generate QR codes for trip feedback
          </p>
        </div>
        <button
          onClick={loadFeedback}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {[
            { id: "analytics", label: "Analytics", icon: BarChart3 },
            { id: "feedback", label: "Feedback", icon: MessageSquare, count: feedback.length },
            { id: "trips", label: "Completed Trips", icon: QrCode, count: completedTrips.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-3 font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-[#7A0010] text-[#7A0010] bg-[#7A0010]/5"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? "bg-[#7A0010] text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "analytics" && (
          <AnalyticsTab key="analytics" analytics={analytics} loading={loading} />
        )}
        {activeTab === "feedback" && (
          <FeedbackTab
            key="feedback"
            feedback={filteredFeedback}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            ratingFilter={ratingFilter}
            setRatingFilter={setRatingFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            categories={categories}
            analytics={analytics}
            onView={(f) => {
              setSelectedFeedback(f);
              setShowDetailModal(true);
            }}
            onRespond={(f) => {
              setSelectedFeedback(f);
              setResponseText(f.admin_response || "");
              setShowResponseModal(true);
            }}
            onDelete={handleDelete}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
        {activeTab === "trips" && (
          <TripsTab
            key="trips"
            trips={completedTrips}
            loading={loadingTrips}
            onGenerateQR={(trip) => {
              setSelectedTrip(trip);
              setShowQRModal(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <FeedbackDetailModal
        feedback={selectedFeedback}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedFeedback(null);
        }}
      />

      {/* Response Modal */}
      <ResponseModal
        feedback={selectedFeedback}
        isOpen={showResponseModal}
        responseText={responseText}
        setResponseText={setResponseText}
        submitting={submittingResponse}
        onClose={() => {
          setShowResponseModal(false);
          setSelectedFeedback(null);
          setResponseText("");
        }}
        onSubmit={handleRespond}
      />

      {/* QR Modal */}
      <QRCodeModal
        trip={selectedTrip}
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false);
          setSelectedTrip(null);
        }}
      />
    </div>
  );
}


// ============ Analytics Tab ============
function AnalyticsTab({ analytics, loading }: { analytics: Analytics; loading: boolean }) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-20"
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#7A0010] border-t-transparent"></div>
          <p className="mt-4 text-gray-500">Loading analytics...</p>
        </div>
      </motion.div>
    );
  }

  const maxRatingCount = Math.max(...analytics.ratingDistribution.map((r) => r.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Feedback"
          value={analytics.totalFeedback}
          icon={MessageSquare}
          color="blue"
          subtitle="All time submissions"
        />
        <StatCard
          title="Average Rating"
          value={analytics.averageRating.toFixed(1)}
          icon={Star}
          color="yellow"
          subtitle={
            <span className={`flex items-center gap-1 text-xs ${
              analytics.ratingTrend >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              {analytics.ratingTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(analytics.ratingTrend).toFixed(1)}% vs last week
            </span>
          }
          suffix="/5"
        />
        <StatCard
          title="Pending Review"
          value={analytics.newCount}
          icon={AlertCircle}
          color="orange"
          subtitle="Needs attention"
        />
        <StatCard
          title="Resolved"
          value={analytics.resolvedCount}
          icon={CheckCircle2}
          color="green"
          subtitle={`${analytics.reviewedCount} reviewed`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Rating Distribution
          </h3>
          <div className="space-y-3">
            {analytics.ratingDistribution.map((item) => (
              <div key={item.rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium text-gray-700">{item.rating}</span>
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.count / maxRatingCount) * 100}%` }}
                    transition={{ duration: 0.5, delay: item.rating * 0.1 }}
                    className={`h-full rounded-full ${
                      item.rating >= 4 ? "bg-gradient-to-r from-green-400 to-green-500" :
                      item.rating === 3 ? "bg-gradient-to-r from-yellow-400 to-yellow-500" :
                      "bg-gradient-to-r from-red-400 to-red-500"
                    }`}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-600 w-10 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Feedback by Category
          </h3>
          {analytics.categoryBreakdown.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No category data yet</div>
          ) : (
            <div className="space-y-3">
              {analytics.categoryBreakdown.slice(0, 5).map((item, index) => {
                const maxCount = analytics.categoryBreakdown[0]?.count || 1;
                const colors = [
                  "from-[#7A0010] to-[#9c2a3a]",
                  "from-blue-500 to-blue-600",
                  "from-purple-500 to-purple-600",
                  "from-teal-500 to-teal-600",
                  "from-orange-500 to-orange-600",
                ];
                return (
                  <div key={item.category} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-24 truncate capitalize">
                      {item.category}
                    </span>
                    <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.count / maxCount) * 100}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`h-full rounded-full bg-gradient-to-r ${colors[index % colors.length]}`}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-600 w-10 text-right">{item.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Trend */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          7-Day Feedback Trend
        </h3>
        <div className="flex items-end justify-between gap-2 h-40">
          {analytics.recentTrend.map((day, index) => {
            const maxCount = Math.max(...analytics.recentTrend.map((d) => d.count), 1);
            const height = (day.count / maxCount) * 100;
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-28">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 5)}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="w-full max-w-[40px] bg-gradient-to-t from-[#7A0010] to-[#c44d5e] rounded-t-lg relative group cursor-pointer"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {day.count} feedback{day.count !== 1 ? "s" : ""}
                      {day.avgRating > 0 && ` • ${day.avgRating.toFixed(1)}★`}
                    </div>
                  </motion.div>
                </div>
                <span className="text-xs text-gray-500">{dayName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Overview */}
      <div className="bg-gradient-to-br from-[#7A0010] to-[#9c2a3a] rounded-2xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Quick Status Overview
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{analytics.newCount}</div>
            <div className="text-sm text-white/80 mt-1">New</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{analytics.reviewedCount}</div>
            <div className="text-sm text-white/80 mt-1">Reviewed</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{analytics.resolvedCount}</div>
            <div className="text-sm text-white/80 mt-1">Resolved</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  suffix,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: "blue" | "yellow" | "orange" | "green";
  subtitle: React.ReactNode;
  suffix?: string;
}) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    yellow: "from-yellow-500 to-yellow-600",
    orange: "from-orange-500 to-orange-600",
    green: "from-green-500 to-green-600",
  };
  const bgColors = {
    blue: "bg-blue-50",
    yellow: "bg-yellow-50",
    orange: "bg-orange-50",
    green: "bg-green-50",
  };
  const iconColors = {
    blue: "text-blue-600",
    yellow: "text-yellow-600",
    orange: "text-orange-600",
    green: "text-green-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {value}
            {suffix && <span className="text-lg text-gray-400">{suffix}</span>}
          </p>
          <div className="mt-2 text-sm text-gray-500">{subtitle}</div>
        </div>
        <div className={`p-3 rounded-xl ${bgColors[color]}`}>
          <Icon className={`h-6 w-6 ${iconColors[color]}`} />
        </div>
      </div>
    </motion.div>
  );
}


// ============ Feedback Tab ============
function FeedbackTab({
  feedback,
  loading,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  ratingFilter,
  setRatingFilter,
  categoryFilter,
  setCategoryFilter,
  categories,
  onView,
  onRespond,
  onDelete,
  onUpdateStatus,
  analytics,
}: {
  feedback: FeedbackItem[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  ratingFilter: string;
  setRatingFilter: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  categories: string[];
  onView: (f: FeedbackItem) => void;
  onRespond: (f: FeedbackItem) => void;
  onDelete: (ids: string[]) => void;
  onUpdateStatus: (id: string, status: string) => void;
  analytics: Analytics;
}) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-20"
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#7A0010] border-t-transparent"></div>
          <p className="mt-4 text-gray-500">Loading feedback...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* KPI Stats at Top */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalFeedback}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{analytics.averageRating.toFixed(1)}</p>
              <p className="text-xs text-gray-500">Avg Rating</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{analytics.newCount}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{analytics.resolvedCount}</p>
              <p className="text-xs text-gray-500">Resolved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7A0010]/20 focus:border-[#7A0010] outline-none text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010]/20 focus:border-[#7A0010] outline-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010]/20 focus:border-[#7A0010] outline-none bg-white"
            >
              <option value="all">All Ratings</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r} Star{r !== 1 ? "s" : ""}</option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010]/20 focus:border-[#7A0010] outline-none bg-white capitalize"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selected.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
            <span className="text-sm text-gray-600">{selected.size} selected</span>
            <button
              onClick={() => onDelete([...selected])}
              className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Feedback List */}
      {feedback.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No feedback found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedback.map((f, index) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                selected.has(f.id) ? "border-[#7A0010] ring-2 ring-[#7A0010]/20" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selected.has(f.id)}
                    onChange={(e) => {
                      const newSet = new Set(selected);
                      e.target.checked ? newSet.add(f.id) : newSet.delete(f.id);
                      setSelected(newSet);
                    }}
                    className="mt-1 rounded border-gray-300 text-[#7A0010] focus:ring-[#7A0010]"
                  />

                  {/* Avatar */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#7A0010] to-[#9c2a3a] flex items-center justify-center text-white font-semibold">
                    {f.user_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{f.user_name}</span>
                          {f.user_email && (
                            <span className="text-xs text-gray-500">{f.user_email}</span>
                          )}
                          <StatusBadge status={f.status} />
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(f.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {f.category && (
                            <span className="px-2 py-0.5 bg-gray-100 rounded-full capitalize">
                              {f.category}
                            </span>
                          )}
                          {f.trip && (
                            <span className="px-2 py-0.5 bg-[#7A0010]/10 text-[#7A0010] rounded-full font-medium">
                              {f.trip.request_number}
                            </span>
                          )}
                        </div>
                        {/* Trip Info Preview */}
                        {f.trip && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-600 flex items-center gap-4 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {f.trip.destination}
                            </span>
                            {f.trip.assigned_driver && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {f.trip.assigned_driver.name}
                              </span>
                            )}
                            {f.trip.assigned_vehicle && (
                              <span className="flex items-center gap-1">
                                <Car className="h-3 w-3" />
                                {f.trip.assigned_vehicle.plate_number}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Rating */}
                      {f.rating !== null && (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < f.rating! ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    <p className={`mt-2 text-gray-700 text-sm ${
                      expandedId === f.id ? "" : "line-clamp-2"
                    }`}>
                      {f.message}
                    </p>
                    {f.message.length > 150 && (
                      <button
                        onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                        className="text-xs text-[#7A0010] font-medium mt-1 hover:underline flex items-center gap-1"
                      >
                        {expandedId === f.id ? (
                          <>Show less <ChevronUp className="h-3 w-3" /></>
                        ) : (
                          <>Show more <ChevronDown className="h-3 w-3" /></>
                        )}
                      </button>
                    )}

                    {/* Admin Response */}
                    {f.admin_response && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-green-700 font-medium mb-1">
                          <Reply className="h-3 w-3" />
                          Admin Response
                        </div>
                        <p className="text-sm text-green-800">{f.admin_response}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => onView(f)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View Details
                      </button>
                      <button
                        onClick={() => onRespond(f)}
                        className="px-3 py-1.5 bg-[#7A0010] text-white rounded-lg text-xs font-medium hover:bg-[#9c2a3a] transition-colors flex items-center gap-1"
                      >
                        <Reply className="h-3 w-3" />
                        {f.admin_response ? "Edit Response" : "Respond"}
                      </button>
                      {f.status !== "resolved" && (
                        <button
                          onClick={() => onUpdateStatus(f.id, "resolved")}
                          className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    new: { bg: "bg-blue-100", text: "text-blue-700", icon: AlertCircle },
    reviewed: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Eye },
    resolved: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle2 },
  }[status] || { bg: "bg-gray-100", text: "text-gray-700", icon: MessageSquare };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <config.icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}


// ============ Trips Tab ============
function TripsTab({
  trips,
  loading,
  onGenerateQR,
}: {
  trips: Trip[];
  loading: boolean;
  onGenerateQR: (trip: Trip) => void;
}) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredTrips = trips.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.request_number.toLowerCase().includes(q) ||
      t.requester_name.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-20"
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#7A0010] border-t-transparent"></div>
          <p className="mt-4 text-gray-500">Loading completed trips...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search trips by request number, requester, or destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7A0010]/20 focus:border-[#7A0010] outline-none text-sm"
          />
        </div>
      </div>

      {/* Trips Grid */}
      {filteredTrips.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <QrCode className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No completed trips found</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery ? "Try adjusting your search" : "Completed trips will appear here"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrips.map((trip, index) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">{trip.request_number}</span>
                  <span className="px-2 py-1 bg-white/20 text-white rounded-full text-xs font-medium backdrop-blur">
                    Completed
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Requester</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{trip.requester_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <MapPin className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Destination</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{trip.destination}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Travel Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(trip.travel_end_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {trip.department && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Building2 className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {trip.department.code || trip.department.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="px-4 pb-4">
                <button
                  onClick={() => onGenerateQR(trip)}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium group-hover:scale-[1.02]"
                >
                  <QrCode className="h-4 w-4" />
                  Generate QR Code
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ============ Modals ============
function FeedbackDetailModal({
  feedback,
  isOpen,
  onClose,
}: {
  feedback: FeedbackItem | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !feedback) return null;

  const trip = feedback.trip;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Feedback Details</h2>
              {trip && (
                <p className="text-white/80 text-sm mt-0.5">
                  Trip: {trip.request_number}
                </p>
              )}
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Trip Details Section */}
          {trip && (
            <div className="mb-6 p-4 bg-[#7A0010]/5 rounded-xl border border-[#7A0010]/20">
              <h4 className="text-sm font-semibold text-[#7A0010] mb-3 flex items-center gap-2">
                <Car className="h-4 w-4" />
                Trip Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Request Number</p>
                  <p className="font-semibold text-gray-900">{trip.request_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Requester</p>
                  <p className="font-medium text-gray-900">{trip.requester_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Destination</p>
                  <p className="font-medium text-gray-900">{trip.destination}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="font-medium text-gray-900">
                    {trip.department?.name || trip.department?.code || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Travel Dates</p>
                  <p className="font-medium text-gray-900">
                    {new Date(trip.travel_start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {trip.travel_end_date && trip.travel_end_date !== trip.travel_start_date && (
                      <> - {new Date(trip.travel_end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Purpose</p>
                  <p className="font-medium text-gray-900 truncate">{trip.purpose || trip.title || "N/A"}</p>
                </div>
                {trip.assigned_driver && (
                  <div>
                    <p className="text-xs text-gray-500">Driver</p>
                    <p className="font-medium text-gray-900">{trip.assigned_driver.name}</p>
                  </div>
                )}
                {trip.assigned_vehicle && (
                  <div>
                    <p className="text-xs text-gray-500">Vehicle</p>
                    <p className="font-medium text-gray-900">
                      {trip.assigned_vehicle.vehicle_name} ({trip.assigned_vehicle.plate_number})
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Info */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7A0010] to-[#9c2a3a] flex items-center justify-center text-white text-xl font-bold">
              {feedback.user_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{feedback.user_name}</h3>
              {feedback.user_email && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {feedback.user_email}
                </p>
              )}
            </div>
            <div className="ml-auto">
              <StatusBadge status={feedback.status} />
            </div>
          </div>

          {/* Rating */}
          {feedback.rating !== null && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
              <p className="text-sm text-yellow-800 font-medium mb-2">Rating</p>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-6 w-6 ${
                      i < feedback.rating! ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
                    }`}
                  />
                ))}
                <span className="ml-2 text-lg font-bold text-yellow-700">{feedback.rating}/5</span>
              </div>
            </div>
          )}

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Category</p>
              <p className="font-medium text-gray-900 capitalize">{feedback.category || "General"}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Submitted</p>
              <p className="font-medium text-gray-900">
                {new Date(feedback.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Message */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 font-medium mb-2">Feedback Message</p>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-700 whitespace-pre-wrap">{feedback.message}</p>
            </div>
          </div>

          {/* Admin Response */}
          {feedback.admin_response && (
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                <Reply className="h-4 w-4" />
                Admin Response
              </div>
              <p className="text-green-800">{feedback.admin_response}</p>
              {feedback.responded_at && (
                <p className="text-xs text-green-600 mt-2">
                  Responded on {new Date(feedback.responded_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ResponseModal({
  feedback,
  isOpen,
  responseText,
  setResponseText,
  submitting,
  onClose,
  onSubmit,
}: {
  feedback: FeedbackItem | null;
  isOpen: boolean;
  responseText: string;
  setResponseText: (v: string) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!isOpen || !feedback) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Respond to Feedback</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Original Feedback */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Original feedback from {feedback.user_name}</p>
            <p className="text-sm text-gray-700 line-clamp-3">{feedback.message}</p>
          </div>

          {/* Response Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Response</label>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Type your response here..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7A0010]/20 focus:border-[#7A0010] outline-none text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!responseText.trim() || submitting}
            className="px-4 py-2 bg-[#7A0010] text-white rounded-lg hover:bg-[#9c2a3a] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Reply className="h-4 w-4" />
                Send Response
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function QRCodeModal({
  trip,
  isOpen,
  onClose,
}: {
  trip: Trip | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !trip) return null;

  const feedbackUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/user/feedback?request_id=${trip.id}&locked=true`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] px-6 py-4 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Feedback QR Code</h2>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Trip Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl text-left">
            <p className="text-sm font-semibold text-[#7A0010] mb-2">{trip.request_number}</p>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Requester:</span> {trip.requester_name}</p>
              <p><span className="font-medium">Destination:</span> {trip.destination}</p>
              <p><span className="font-medium">Date:</span> {new Date(trip.travel_end_date).toLocaleDateString()}</p>
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center mb-4">
            <div className="text-center">
              <QrCode className="h-24 w-24 text-gray-400 mx-auto" />
              <p className="text-xs text-gray-400 mt-2">QR Code</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Scan this QR code to submit feedback for this trip
          </p>

          {/* URL */}
          <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 break-all mb-4">
            {feedbackUrl}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(feedbackUrl)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Copy Link
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#7A0010] text-white rounded-lg hover:bg-[#9c2a3a] transition-colors text-sm font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
