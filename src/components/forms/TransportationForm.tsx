"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, MapPin, Clock, Phone, FileText, Car, ParkingCircle } from 'lucide-react';

interface TransportationData {
  transportation_type: 'pickup' | 'self' | null;
  pickup_location?: string;
  pickup_time?: string;
  pickup_contact_number?: string;
  pickup_special_instructions?: string;
  return_transportation_same?: boolean;
  dropoff_location?: string;
  dropoff_time?: string;
  parking_required?: boolean;
  own_vehicle_details?: string;
}

interface TransportationFormProps {
  data: TransportationData;
  onChange: (data: TransportationData) => void;
  className?: string;
}

export default function TransportationForm({
  data,
  onChange,
  className = ''
}: TransportationFormProps) {
  const [showReturnDetails, setShowReturnDetails] = useState(!data.return_transportation_same);

  const updateData = (updates: Partial<TransportationData>) => {
    onChange({ ...data, ...updates });
  };

  const transportOptions = [
    {
      value: 'pickup' as const,
      icon: Bus,
      title: 'University Pick-up',
      description: 'University vehicle will pick me up',
      color: 'border-blue-500 bg-blue-50 text-blue-700'
    },
    {
      value: 'self' as const,
      icon: Car,
      title: 'Own Transportation',
      description: 'I will go to the university myself',
      color: 'border-green-500 bg-green-50 text-green-700'
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Transportation Type Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Transportation Arrangement
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transportOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = data.transportation_type === option.value;
            
            return (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => updateData({ 
                  transportation_type: option.value,
                  // Reset fields when switching types
                  pickup_location: option.value === 'pickup' ? data.pickup_location : undefined,
                  pickup_time: option.value === 'pickup' ? data.pickup_time : undefined,
                  pickup_contact_number: option.value === 'pickup' ? data.pickup_contact_number : undefined,
                  pickup_special_instructions: option.value === 'pickup' ? data.pickup_special_instructions : undefined,
                  parking_required: option.value === 'self' ? data.parking_required : undefined,
                  own_vehicle_details: option.value === 'self' ? data.own_vehicle_details : undefined,
                })}
                className={`
                  p-6 border-2 rounded-xl transition-all duration-200
                  ${isSelected 
                    ? option.color
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <Icon className={`w-8 h-8 ${isSelected ? '' : 'text-gray-400'}`} />
                  <div>
                    <p className={`font-semibold ${isSelected ? '' : 'text-gray-700'}`}>
                      {option.title}
                    </p>
                    <p className={`text-sm ${isSelected ? 'opacity-80' : 'text-gray-500'}`}>
                      {option.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Pickup Details */}
      <AnimatePresence>
        {data.transportation_type === 'pickup' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 border-l-4 border-blue-500 pl-6"
          >
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Bus className="w-5 h-5 text-blue-500" />
              Pick-up Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Pick-up Location
                </label>
                <input
                  type="text"
                  value={data.pickup_location || ''}
                  onChange={(e) => updateData({ pickup_location: e.target.value })}
                  placeholder="Enter your address or landmark"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0019] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Pick-up Time
                </label>
                <input
                  type="time"
                  value={data.pickup_time || ''}
                  onChange={(e) => updateData({ pickup_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0019] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={data.pickup_contact_number || ''}
                  onChange={(e) => updateData({ pickup_contact_number: e.target.value })}
                  placeholder="For driver coordination"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0019] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Special Instructions
                </label>
                <textarea
                  value={data.pickup_special_instructions || ''}
                  onChange={(e) => updateData({ pickup_special_instructions: e.target.value })}
                  placeholder="Any special instructions for the driver"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0019] focus:border-transparent resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Self Transportation Details */}
      <AnimatePresence>
        {data.transportation_type === 'self' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 border-l-4 border-green-500 pl-6"
          >
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-green-500" />
              Transportation Details
            </h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="parking_required"
                  checked={data.parking_required || false}
                  onChange={(e) => updateData({ parking_required: e.target.checked })}
                  className="w-4 h-4 text-[#7a0019] border-gray-300 rounded focus:ring-[#7a0019]"
                />
                <label htmlFor="parking_required" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <ParkingCircle className="w-4 h-4" />
                  I will need parking space at the destination
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Details (Optional)
                </label>
                <textarea
                  value={data.own_vehicle_details || ''}
                  onChange={(e) => updateData({ own_vehicle_details: e.target.value })}
                  placeholder="Vehicle type, plate number, or any relevant details"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0019] focus:border-transparent resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Return Transportation */}
      <AnimatePresence>
        {data.transportation_type && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="space-y-4 border-t pt-6"
          >
            <h3 className="font-semibold text-gray-900">Return Transportation</h3>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="return_same"
                checked={data.return_transportation_same !== false}
                onChange={(e) => {
                  const isSame = e.target.checked;
                  updateData({ 
                    return_transportation_same: isSame,
                    dropoff_location: isSame ? undefined : data.dropoff_location,
                    dropoff_time: isSame ? undefined : data.dropoff_time
                  });
                  setShowReturnDetails(!isSame);
                }}
                className="w-4 h-4 text-[#7a0019] border-gray-300 rounded focus:ring-[#7a0019]"
              />
              <label htmlFor="return_same" className="text-sm font-medium text-gray-700">
                Same as departure arrangement
              </label>
            </div>

            <AnimatePresence>
              {showReturnDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-gray-200"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Drop-off Location
                    </label>
                    <input
                      type="text"
                      value={data.dropoff_location || ''}
                      onChange={(e) => updateData({ dropoff_location: e.target.value })}
                      placeholder="Different from pick-up location"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0019] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Drop-off Time
                    </label>
                    <input
                      type="time"
                      value={data.dropoff_time || ''}
                      onChange={(e) => updateData({ dropoff_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0019] focus:border-transparent"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
