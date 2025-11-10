"use client";

import React from "react";
import { FileText, Plus, Edit, Trash2, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { cardVariants, staggerContainer } from "@/lib/animations";

export default function PresidentPolicyPage() {
  const [policies, setPolicies] = React.useState([
    {
      id: "1",
      title: "Travel Budget Guidelines",
      description: "Maximum budget limits for different types of travel",
      category: "Budget",
      lastUpdated: "2025-11-01",
      updatedBy: "President",
      active: true,
    },
    {
      id: "2",
      title: "International Travel Requirements",
      description: "Required documents and advance notice for international trips",
      category: "Documentation",
      lastUpdated: "2025-10-15",
      updatedBy: "President",
      active: true,
    },
    {
      id: "3",
      title: "Department Head Approval Authority",
      description: "Delegation of approval authority to department heads",
      category: "Workflow",
      lastUpdated: "2025-09-20",
      updatedBy: "President",
      active: true,
    },
  ]);
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Policy Management</h1>
          <p className="text-gray-600 mt-1">
            Create and manage system-wide travel policies
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#7a0019] text-white rounded-lg hover:bg-[#9a0020] transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          New Policy
        </button>
      </div>

      {/* Presidential Authority Notice */}
      <motion.div
        variants={cardVariants}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4"
      >
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <div>
            <p className="font-semibold text-blue-900">
              Presidential Policy Authority
            </p>
            <p className="text-sm text-blue-700">
              You have full authority to create, modify, and enforce travel policies across the university
            </p>
          </div>
        </div>
      </motion.div>

      {/* Policy Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          variants={cardVariants}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="text-2xl font-bold text-gray-900">3</div>
          <div className="text-sm text-gray-600 mt-1">Active Policies</div>
        </motion.div>
        
        <motion.div
          variants={cardVariants}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="text-2xl font-bold text-gray-900">3</div>
          <div className="text-sm text-gray-600 mt-1">Categories</div>
        </motion.div>
        
        <motion.div
          variants={cardVariants}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="text-2xl font-bold text-gray-900">Nov 1, 2025</div>
          <div className="text-sm text-gray-600 mt-1">Last Update</div>
        </motion.div>
      </div>

      {/* Policies List */}
      <motion.div variants={cardVariants} className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">All Policies</h2>
        
        <div className="space-y-3">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-[#7a0019]/30 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{policy.title}</h3>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {policy.category}
                    </span>
                    {policy.active && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{policy.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Last updated: {new Date(policy.lastUpdated).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>By: {policy.updatedBy}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button className="p-2 text-gray-600 hover:text-[#7a0019] hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Changes */}
      <motion.div variants={cardVariants} className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Policy Changes</h2>
        
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Travel Budget Guidelines Updated</p>
              <p className="text-sm text-gray-600">Maximum limits increased for international travel</p>
            </div>
            <span className="text-xs text-gray-500">Nov 1, 2025</span>
          </div>
          
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Plus className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">New Policy Created</p>
              <p className="text-sm text-gray-600">Department Head Approval Authority implemented</p>
            </div>
            <span className="text-xs text-gray-500">Sep 20, 2025</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
