"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bus, Car, MapPin, Clock, Phone, FileText } from "lucide-react";

interface TransportationFormProps {
  value: {
    transportation_type?: "pickup" | "self";
    pickup_location?: string;
    pickup_time?: string;
    pickup_contact_number?: string;
    pickup_special_instructions?: string;
    return_transportation_same?: boolean;
    dropoff_location?: string;
    dropoff_time?: string;
    parking_required?: boolean;
    own_vehicle_details?: string;
  };
  onChange: (value: any) => void;
  className?: string;
}

export default function TransportationForm({
  value,
  onChange,
  className = "",
}: TransportationFormProps) {
  const transportType = value.transportation_type;

  const handleChange = (field: string, fieldValue: any) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  // If transportation_type is already set, don't show the selection buttons
  // Just show the details form (pickup details or self transport details)
  const showTypeSelection = !transportType;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Transportation Type Selection - Only show if not already selected */}
      {showTypeSelection && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Transportation Arrangement *
          </label>

          <div className="grid grid-cols-2 gap-4">
            {/* Pickup Option */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleChange("transportation_type", "pickup")}
              className={`
                p-6 border-2 rounded-lg transition-all
                flex flex-col items-center gap-3
                ${
                  transportType === "pickup"
                    ? "border-[#7a0019] bg-red-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }
              `}
            >
              <Bus
                className={`w-8 h-8 ${
                  transportType === "pickup" ? "text-[#7a0019]" : "text-gray-400"
                }`}
              />
              <div className="text-center">
                <p className="font-semibold text-gray-900">Pick me up</p>
                <p className="text-xs text-gray-500 mt-1">
                  University vehicle will pick you up
                </p>
              </div>
            </motion.button>

            {/* Self Transport Option */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleChange("transportation_type", "self")}
              className={`
                p-6 border-2 rounded-lg transition-all
                flex flex-col items-center gap-3
                ${
                  transportType === "self"
                    ? "border-[#7a0019] bg-red-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }
              `}
            >
              <Car
                className={`w-8 h-8 ${
                  transportType === "self" ? "text-[#7a0019]" : "text-gray-400"
                }`}
              />
              <div className="text-center">
                <p className="font-semibold text-gray-900">Go myself</p>
                <p className="text-xs text-gray-500 mt-1">
                  I will use my own transportation
                </p>
              </div>
            </motion.button>
          </div>
        </div>
      )}

      {/* Show selected type indicator if already selected */}
      {!showTypeSelection && (
        <div className="rounded-lg border-2 border-[#7a0019]/20 bg-red-50/50 p-4">
          <div className="flex items-center gap-3">
            {transportType === "pickup" ? (
              <>
                <Bus className="w-6 h-6 text-[#7a0019]" />
                <div>
                  <p className="font-semibold text-gray-900">Pick me up</p>
                  <p className="text-xs text-gray-600">University vehicle will pick you up</p>
                </div>
              </>
            ) : (
              <>
                <Car className="w-6 h-6 text-[#7a0019]" />
                <div>
                  <p className="font-semibold text-gray-900">Go myself</p>
                  <p className="text-xs text-gray-600">I will use my own transportation</p>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => handleChange("transportation_type", undefined)}
              className="ml-auto text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Change
            </button>
          </div>
        </div>
      )}

      {/* Pickup Details (if pickup selected) */}
      <AnimatePresence mode="wait">
        {transportType === "pickup" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 pt-4 border-t border-gray-200"
          >
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Bus className="w-5 h-5 text-[#7a0019]" />
              Pickup Details
            </h4>

            {/* Pickup Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Pickup Location *
              </label>
              <input
                type="text"
                value={value.pickup_location || ""}
                onChange={(e) => handleChange("pickup_location", e.target.value)}
                placeholder="Enter your pickup address"
                className="
                  w-full px-4 py-2 rounded-lg border-2 border-gray-200
                  focus:border-[#7a0019] focus:ring-2 focus:ring-[#7a0019]/20
                  transition-all outline-none
                "
                required
              />
            </div>

            {/* Pickup Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Pickup Time *
              </label>
              <input
                type="time"
                value={value.pickup_time || ""}
                onChange={(e) => handleChange("pickup_time", e.target.value)}
                className="
                  w-full px-4 py-2 rounded-lg border-2 border-gray-200
                  focus:border-[#7a0019] focus:ring-2 focus:ring-[#7a0019]/20
                  transition-all outline-none
                "
                required
              />
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Contact Number for Driver *
              </label>
              <input
                type="tel"
                value={value.pickup_contact_number || ""}
                onChange={(e) =>
                  handleChange("pickup_contact_number", e.target.value)
                }
                placeholder="+63 XXX XXX XXXX"
                className="
                  w-full px-4 py-2 rounded-lg border-2 border-gray-200
                  focus:border-[#7a0019] focus:ring-2 focus:ring-[#7a0019]/20
                  transition-all outline-none
                "
                required
              />
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Special Instructions (Optional)
              </label>
              <textarea
                value={value.pickup_special_instructions || ""}
                onChange={(e) =>
                  handleChange("pickup_special_instructions", e.target.value)
                }
                placeholder="Any special pickup instructions or landmarks..."
                rows={3}
                className="
                  w-full px-4 py-2 rounded-lg border-2 border-gray-200
                  focus:border-[#7a0019] focus:ring-2 focus:ring-[#7a0019]/20
                  transition-all outline-none resize-none
                "
              />
            </div>
          </motion.div>
        )}

        {/* Self Transport Details */}
        {transportType === "self" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 pt-4 border-t border-gray-200"
          >
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-[#7a0019]" />
              Your Transportation Details
            </h4>

            {/* Parking Required */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="parking_required"
                checked={value.parking_required || false}
                onChange={(e) =>
                  handleChange("parking_required", e.target.checked)
                }
                className="
                  w-5 h-5 text-[#7a0019] border-gray-300 rounded
                  focus:ring-[#7a0019]
                "
              />
              <label
                htmlFor="parking_required"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                I will need parking at the university
              </label>
            </div>

            {/* Vehicle Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Information (Optional)
              </label>
              <input
                type="text"
                value={value.own_vehicle_details || ""}
                onChange={(e) =>
                  handleChange("own_vehicle_details", e.target.value)
                }
                placeholder="e.g., Toyota Vios, ABC-1234"
                className="
                  w-full px-4 py-2 rounded-lg border-2 border-gray-200
                  focus:border-[#7a0019] focus:ring-2 focus:ring-[#7a0019]/20
                  transition-all outline-none
                "
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Return Transportation */}
      {transportType && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 pt-4 border-t border-gray-200"
        >
          <h4 className="font-semibold text-gray-900">Return Transportation</h4>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="return_same"
              checked={value.return_transportation_same ?? true}
              onChange={(e) =>
                handleChange("return_transportation_same", e.target.checked)
              }
              className="
                w-5 h-5 text-[#7a0019] border-gray-300 rounded
                focus:ring-[#7a0019]
              "
            />
            <label
              htmlFor="return_same"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              Same as departure arrangement
            </label>
          </div>

          {!value.return_transportation_same && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-4 pl-8"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drop-off Location
                </label>
                <input
                  type="text"
                  value={value.dropoff_location || ""}
                  onChange={(e) =>
                    handleChange("dropoff_location", e.target.value)
                  }
                  placeholder="Enter drop-off address"
                  className="
                    w-full px-4 py-2 rounded-lg border-2 border-gray-200
                    focus:border-[#7a0019] focus:ring-2 focus:ring-[#7a0019]/20
                    transition-all outline-none
                  "
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drop-off Time
                </label>
                <input
                  type="time"
                  value={value.dropoff_time || ""}
                  onChange={(e) => handleChange("dropoff_time", e.target.value)}
                  className="
                    w-full px-4 py-2 rounded-lg border-2 border-gray-200
                    focus:border-[#7a0019] focus:ring-2 focus:ring-[#7a0019]/20
                    transition-all outline-none
                  "
                />
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
