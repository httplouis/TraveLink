// src/app/(protected)/admin/org-request/page.tsx
/**
 * Admin Org Request Page
 * Face-to-face manual entry of organization requests
 * Skips head approval, goes directly to comptroller/HR
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  User, MapPin, Calendar, DollarSign, Users, Car, FileText, 
  Building2, Plus, X, Check, AlertCircle 
} from "lucide-react";
import { useToast } from "@/components/common/ui/ToastProvider.ui";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";
import { DEPARTMENTS } from "@/lib/org/departments";

type Participant = {
  id: string;
  name: string;
  position?: string;
};

type Expense = {
  id: string;
  item: string;
  amount: number;
  description?: string;
};

export default function OrgRequestPage() {
  const toast = useToast();
  
  // Form state
  const [requestingPerson, setRequestingPerson] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [purpose, setPurpose] = React.useState("");
  const [travelStartDate, setTravelStartDate] = React.useState("");
  const [travelEndDate, setTravelEndDate] = React.useState("");
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [newParticipant, setNewParticipant] = React.useState({ name: "", position: "" });
  
  // Budget
  const [hasBudget, setHasBudget] = React.useState(false);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [newExpense, setNewExpense] = React.useState({ item: "", amount: "", description: "" });
  
  // Vehicle
  const [needsVehicle, setNeedsVehicle] = React.useState(false);
  const [vehicleType, setVehicleType] = React.useState("");
  const [assignedVehicleId, setAssignedVehicleId] = React.useState("");
  const [assignedDriverId, setAssignedDriverId] = React.useState("");
  
  // Admin
  const [adminNotes, setAdminNotes] = React.useState("");
  const [signature, setSignature] = React.useState<string | null>(null);
  
  const [submitting, setSubmitting] = React.useState(false);
  const [searchUsers, setSearchUsers] = React.useState("");
  const [userSuggestions, setUserSuggestions] = React.useState<any[]>([]);

  // Search users for requesting person
  React.useEffect(() => {
    if (searchUsers.length >= 2) {
      const timeout = setTimeout(async () => {
        try {
          const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchUsers)}&limit=10`);
          const json = await res.json();
          if (json.ok && json.data) {
            setUserSuggestions(json.data);
          }
        } catch (err) {
          console.error("Failed to search users:", err);
        }
      }, 300);
      return () => clearTimeout(timeout);
    } else {
      setUserSuggestions([]);
    }
  }, [searchUsers]);

  const addParticipant = () => {
    if (!newParticipant.name.trim()) return;
    setParticipants([...participants, {
      id: Date.now().toString(),
      name: newParticipant.name,
      position: newParticipant.position || undefined
    }]);
    setNewParticipant({ name: "", position: "" });
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const addExpense = () => {
    if (!newExpense.item.trim() || !newExpense.amount) return;
    setExpenses([...expenses, {
      id: Date.now().toString(),
      item: newExpense.item,
      amount: parseFloat(newExpense.amount) || 0,
      description: newExpense.description || undefined
    }]);
    setNewExpense({ item: "", amount: "", description: "" });
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const totalBudget = React.useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!requestingPerson.trim()) {
      toast({ message: "Requesting person is required", kind: "error" });
      return;
    }
    if (!destination.trim()) {
      toast({ message: "Destination is required", kind: "error" });
      return;
    }
    if (!purpose.trim()) {
      toast({ message: "Purpose is required", kind: "error" });
      return;
    }
    if (!travelStartDate || !travelEndDate) {
      toast({ message: "Travel dates are required", kind: "error" });
      return;
    }
    if (!adminNotes.trim() || adminNotes.trim().length < 20) {
      toast({ message: "Admin notes are required (minimum 20 characters)", kind: "error" });
      return;
    }
    if (!signature) {
      toast({ message: "Admin signature is required", kind: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/org-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestingPerson,
          department,
          destination,
          purpose,
          travelStartDate,
          travelEndDate,
          participants: participants.map(p => ({ name: p.name, position: p.position })),
          totalBudget: hasBudget ? totalBudget : 0,
          expenseBreakdown: hasBudget ? expenses.map(e => ({
            item: e.item,
            amount: e.amount,
            description: e.description
          })) : [],
          needsVehicle,
          vehicleType: needsVehicle ? vehicleType : null,
          assignedVehicleId: needsVehicle ? assignedVehicleId : null,
          assignedDriverId: needsVehicle ? assignedDriverId : null,
          adminNotes,
          signature,
        }),
      });

      const json = await res.json();

      if (json.ok) {
        toast({
          message: `✅ Org request ${json.data.request_number} created successfully!`,
          kind: "success",
        });
        
        // Reset form
        setRequestingPerson("");
        setDepartment("");
        setDestination("");
        setPurpose("");
        setTravelStartDate("");
        setTravelEndDate("");
        setParticipants([]);
        setExpenses([]);
        setHasBudget(false);
        setNeedsVehicle(false);
        setAdminNotes("");
        setSignature(null);
      } else {
        toast({ message: json.error || "Failed to create org request", kind: "error" });
      }
    } catch (err: any) {
      console.error("Org request submit error:", err);
      toast({ message: err.message || "Failed to create org request. Please try again.", kind: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Request Entry</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manually enter organization requests (face-to-face). These requests skip head approval.
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 space-y-6"
        >
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#7A0010]" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Requesting Person */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requesting Person <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={requestingPerson}
                    onChange={(e) => {
                      setRequestingPerson(e.target.value);
                      setSearchUsers(e.target.value);
                    }}
                    placeholder="Search for user..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
                    required
                  />
                  {userSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {userSuggestions.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setRequestingPerson(user.name);
                            setSearchUsers("");
                            setUserSuggestions([]);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                        >
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map((dept, index) => (
                    <option key={`dept-${index}-${dept}`} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Where are they traveling?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
                  required
                />
              </div>

              {/* Purpose */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Purpose of travel..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent resize-none"
                  required
                />
              </div>

              {/* Travel Dates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Travel Start Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={travelStartDate}
                  onChange={(e) => setTravelStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Travel End Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={travelEndDate}
                  onChange={(e) => setTravelEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Participants */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#7A0010]" />
              Participants
            </h2>
            <div className="space-y-3">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{p.name}</div>
                    {p.position && <div className="text-sm text-gray-500">{p.position}</div>}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeParticipant(p.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                  placeholder="Participant name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
                />
                <input
                  type="text"
                  value={newParticipant.position}
                  onChange={(e) => setNewParticipant({ ...newParticipant, position: e.target.value })}
                  placeholder="Position (optional)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addParticipant}
                  className="px-4 py-2 bg-[#7A0010] text-white rounded-lg hover:bg-[#9c2a3a] transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#7A0010]" />
              Budget
            </h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasBudget}
                  onChange={(e) => setHasBudget(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Request has budget</span>
              </label>

              {hasBudget && (
                <div className="space-y-3">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{exp.item}</div>
                        {exp.description && <div className="text-sm text-gray-500">{exp.description}</div>}
                        <div className="text-sm font-semibold text-[#7A0010]">₱{exp.amount.toLocaleString()}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExpense(exp.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newExpense.item}
                      onChange={(e) => setNewExpense({ ...newExpense, item: e.target.value })}
                      placeholder="Expense item"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
                    />
                    <input
                      type="number"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      placeholder="Amount"
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={addExpense}
                      className="px-4 py-2 bg-[#7A0010] text-white rounded-lg hover:bg-[#9c2a3a] transition-colors flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                  {totalBudget > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">Total Budget</span>
                        <span className="text-2xl font-bold text-[#7A0010]">₱{totalBudget.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Vehicle */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Car className="h-5 w-5 text-[#7A0010]" />
              Vehicle Assignment
            </h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={needsVehicle}
                  onChange={(e) => setNeedsVehicle(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Needs vehicle</span>
              </label>

              {needsVehicle && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Type
                    </label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
                    >
                      <option key="vehicle-empty" value="">Select Type</option>
                      <option key="vehicle-van" value="Van">Van</option>
                      <option key="vehicle-bus" value="Bus">Bus</option>
                      <option key="vehicle-car" value="Car">Car</option>
                      <option key="vehicle-motorcycle" value="Motorcycle">Motorcycle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle ID (optional)
                    </label>
                    <input
                      type="text"
                      value={assignedVehicleId}
                      onChange={(e) => setAssignedVehicleId(e.target.value)}
                      placeholder="Vehicle ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Driver ID (optional)
                    </label>
                    <input
                      type="text"
                      value={assignedDriverId}
                      onChange={(e) => setAssignedDriverId(e.target.value)}
                      placeholder="Driver ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin Notes & Signature */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#7A0010]" />
              Admin Notes & Signature
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes <span className="text-red-600">*</span>
                  <span className="text-xs text-gray-500 ml-2">(Minimum 20 characters)</span>
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter notes about this org request (face-to-face entry details, special instructions, etc.)..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {adminNotes.length} / 20 characters minimum
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Signature <span className="text-red-600">*</span>
                </label>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                  <SignaturePad
                    height={180}
                    value={signature}
                    onSave={setSignature}
                    onClear={() => setSignature(null)}
                    hideSaveButton
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={submitting || !signature || adminNotes.trim().length < 20}
              className="px-6 py-3 bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-semibold"
            >
              {submitting ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Request...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Create Org Request
                </>
              )}
            </button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}

