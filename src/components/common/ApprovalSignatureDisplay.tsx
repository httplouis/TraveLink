"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Clock, Maximize2 } from "lucide-react";
import PersonDisplay from "./PersonDisplay";
import StatusBadge from "./StatusBadge";
import { fadeVariants, successCheckVariants } from "@/lib/animations";

interface ApprovalSignatureDisplayProps {
  stageLabel: string;
  approver?: {
    name: string;
    position?: string;
    department?: string;
    profile_picture?: string | null;
  } | null;
  signature?: string | null;
  comments?: string | null;
  approvedAt?: string | null;
  status: "completed" | "pending" | "current";
  className?: string;
}

export default function ApprovalSignatureDisplay({
  stageLabel,
  approver,
  signature,
  comments,
  approvedAt,
  status,
  className = "",
}: ApprovalSignatureDisplayProps) {
  const [isSignatureExpanded, setIsSignatureExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        border-2 rounded-lg p-6 space-y-4 bg-white
        ${status === "completed" ? "border-green-200" : "border-gray-200"}
        ${className}
      `}
    >
      {/* Header with Stage Label and Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {status === "completed" && (
            <motion.div
              variants={successCheckVariants}
              initial="hidden"
              animate="visible"
            >
              <CheckCircle className="w-6 h-6 text-green-600" />
            </motion.div>
          )}
          {status === "current" && <Clock className="w-6 h-6 text-yellow-600" />}
          <h3 className="font-semibold text-lg text-gray-900">{stageLabel}</h3>
        </div>

        {status === "completed" && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            Approved
          </span>
        )}
        {status === "pending" && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
            Pending
          </span>
        )}
        {status === "current" && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            In Progress
          </span>
        )}
      </div>

      {/* Approver Information with Profile Picture */}
      {approver ? (
        <PersonDisplay
          name={approver.name}
          position={approver.position}
          department={approver.department}
          profilePicture={approver.profile_picture}
          size="md"
        />
      ) : (
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <p className="font-medium">Pending approval</p>
            <p className="text-sm">Awaiting {stageLabel.toLowerCase()}</p>
          </div>
        </div>
      )}

      {/* Approval Timestamp */}
      {approvedAt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs text-gray-500"
        >
          Approved on {new Date(approvedAt).toLocaleString("en-US", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </motion.div>
      )}

      {/* Digital Signature */}
      {signature && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium text-gray-700">
            Digital Signature:
          </label>
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="
                border-2 border-gray-200 rounded-lg p-4 bg-gray-50
                cursor-pointer group
                hover:border-[#7a0019] transition-colors
              "
              onClick={() => setIsSignatureExpanded(true)}
            >
              <img
                src={signature}
                alt={`${approver?.name || "Approver"} signature`}
                className="max-h-24 mx-auto"
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white rounded-full p-1.5 shadow-md">
                  <Maximize2 className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Comments/Notes */}
      {comments && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium text-gray-700">Comments:</label>
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
            {comments}
          </p>
        </motion.div>
      )}

      {/* Signature Expanded Modal */}
      <AnimatePresence>
        {isSignatureExpanded && signature && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setIsSignatureExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-xl p-8 max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {approver?.name}'s Signature
                </h3>
                <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
                  <img
                    src={signature}
                    alt="Signature"
                    className="w-full max-h-64 object-contain"
                  />
                </div>
                <button
                  onClick={() => setIsSignatureExpanded(false)}
                  className="
                    w-full px-4 py-2 rounded-lg
                    bg-gray-200 hover:bg-gray-300
                    text-gray-800 font-medium
                    transition-colors
                  "
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Compact version for timeline view
export function ApprovalSignatureCompact({
  stageLabel,
  approver,
  approvedAt,
  status,
}: Pick<ApprovalSignatureDisplayProps, "stageLabel" | "approver" | "approvedAt" | "status">) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 py-3"
    >
      {/* Status Indicator */}
      <div className={`
        w-3 h-3 rounded-full
        ${status === "completed" ? "bg-green-500" : ""}
        ${status === "current" ? "bg-yellow-500 animate-pulse" : ""}
        ${status === "pending" ? "bg-gray-300" : ""}
      `} />

      {/* Content */}
      <div className="flex-1">
        <p className="font-medium text-gray-900">{stageLabel}</p>
        {approver && (
          <p className="text-sm text-gray-600">{approver.name}</p>
        )}
        {approvedAt && (
          <p className="text-xs text-gray-500">
            {new Date(approvedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Badge */}
      {status === "completed" && (
        <CheckCircle className="w-5 h-5 text-green-600" />
      )}
    </motion.div>
  );
}
