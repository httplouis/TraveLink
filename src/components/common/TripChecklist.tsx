"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Circle,
  Car,
  Fuel,
  FileText,
  Shield,
  MapPin,
  Clock,
  Camera,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  required: boolean;
  completed: boolean;
}

interface TripChecklistProps {
  tripId: string;
  type: "pre_trip" | "post_trip";
  onComplete?: (items: ChecklistItem[]) => void;
  readOnly?: boolean;
}

const PRE_TRIP_ITEMS: Omit<ChecklistItem, "completed">[] = [
  {
    id: "vehicle_condition",
    label: "Vehicle Condition Check",
    description: "Inspect exterior and interior for damage",
    icon: <Car className="h-4 w-4" />,
    required: true,
  },
  {
    id: "fuel_level",
    label: "Fuel Level",
    description: "Ensure adequate fuel for the trip",
    icon: <Fuel className="h-4 w-4" />,
    required: true,
  },
  {
    id: "documents",
    label: "Documents Ready",
    description: "OR/CR, driver's license, travel order",
    icon: <FileText className="h-4 w-4" />,
    required: true,
  },
  {
    id: "safety_equipment",
    label: "Safety Equipment",
    description: "First aid kit, early warning device, fire extinguisher",
    icon: <Shield className="h-4 w-4" />,
    required: true,
  },
  {
    id: "route_confirmed",
    label: "Route Confirmed",
    description: "Verify destination and route with passenger",
    icon: <MapPin className="h-4 w-4" />,
    required: true,
  },
  {
    id: "departure_time",
    label: "Departure Time Logged",
    description: "Record actual departure time",
    icon: <Clock className="h-4 w-4" />,
    required: true,
  },
];

const POST_TRIP_ITEMS: Omit<ChecklistItem, "completed">[] = [
  {
    id: "arrival_logged",
    label: "Arrival Time Logged",
    description: "Record actual arrival time",
    icon: <Clock className="h-4 w-4" />,
    required: true,
  },
  {
    id: "mileage_recorded",
    label: "Mileage Recorded",
    description: "Log ending odometer reading",
    icon: <Car className="h-4 w-4" />,
    required: true,
  },
  {
    id: "fuel_recorded",
    label: "Fuel Level Recorded",
    description: "Log remaining fuel level",
    icon: <Fuel className="h-4 w-4" />,
    required: true,
  },
  {
    id: "vehicle_returned",
    label: "Vehicle Returned",
    description: "Park vehicle in designated area",
    icon: <MapPin className="h-4 w-4" />,
    required: true,
  },
  {
    id: "damage_report",
    label: "Damage Report",
    description: "Report any new damage or issues",
    icon: <AlertTriangle className="h-4 w-4" />,
    required: false,
  },
  {
    id: "photos_uploaded",
    label: "Photos Uploaded",
    description: "Upload trip completion photos",
    icon: <Camera className="h-4 w-4" />,
    required: false,
  },
];

export default function TripChecklist({ tripId, type, onComplete, readOnly = false }: TripChecklistProps) {
  const baseItems = type === "pre_trip" ? PRE_TRIP_ITEMS : POST_TRIP_ITEMS;
  const [items, setItems] = useState<ChecklistItem[]>(
    baseItems.map((item) => ({ ...item, completed: false }))
  );
  const [expanded, setExpanded] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const toggleItem = (id: string) => {
    if (readOnly) return;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const completedCount = items.filter((item) => item.completed).length;
  const requiredCount = items.filter((item) => item.required).length;
  const requiredCompleted = items.filter((item) => item.required && item.completed).length;
  const allRequiredComplete = requiredCompleted === requiredCount;
  const progress = Math.round((completedCount / items.length) * 100);

  const handleSubmit = async () => {
    if (!allRequiredComplete) return;
    setSubmitting(true);
    try {
      // Save checklist to API
      await fetch(`/api/trips/${tripId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, items }),
        credentials: "include",
      });
      onComplete?.(items);
    } catch (error) {
      console.error("Failed to save checklist:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div
        className={`px-6 py-4 ${
          type === "pre_trip"
            ? "bg-gradient-to-r from-blue-600 to-indigo-600"
            : "bg-gradient-to-r from-green-600 to-emerald-600"
        } text-white`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              {type === "pre_trip" ? <Car className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {type === "pre_trip" ? "Pre-Trip Checklist" : "Post-Trip Checklist"}
              </h3>
              <p className="text-white/70 text-sm">
                {completedCount}/{items.length} completed
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-white"
            />
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 space-y-2">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => toggleItem(item.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    item.completed
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-100 hover:border-gray-200"
                  } ${!readOnly ? "cursor-pointer" : ""}`}
                >
                  {/* Checkbox */}
                  <div
                    className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center transition-colors ${
                      item.completed ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {item.completed ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium text-sm ${
                          item.completed ? "text-green-700 line-through" : "text-gray-900"
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.required && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-600">Required</span>
                      )}
                    </div>
                    {item.description && (
                      <p className={`text-xs mt-0.5 ${item.completed ? "text-green-600" : "text-gray-500"}`}>
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${
                      item.completed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {item.icon}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Submit Button */}
            {!readOnly && (
              <div className="px-4 pb-4">
                <button
                  onClick={handleSubmit}
                  disabled={!allRequiredComplete || submitting}
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    allRequiredComplete
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : allRequiredComplete ? (
                    "Complete Checklist"
                  ) : (
                    `Complete ${requiredCount - requiredCompleted} more required items`
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
