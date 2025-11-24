// src/app/(protected)/user/request/faq/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle2, ArrowRight, HelpCircle, Clock, Users, Building2, Wallet, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export default function RequestFAQPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#7A0010] to-[#9c2a3a] mb-4"
        >
          <HelpCircle className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-4xl font-bold text-gray-900">How to Create a Travel Request</h1>
        <p className="text-lg text-gray-600">Learn how to submit travel requests and understand the approval process</p>
      </div>

      {/* What is a Travel Request */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-blue-600 p-2">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">What is a Travel Request?</h2>
        </div>
        <p className="text-gray-700 leading-relaxed">
          A travel request is a formal request for transportation services for official university business. 
          This includes travel for seminars, educational trips, competitions, and official visits. 
          All travel requests must go through an approval process to ensure proper documentation and budget allocation.
        </p>
      </motion.section>

      {/* Step-by-Step Guide */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-emerald-600 p-2">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Step-by-Step Guide</h2>
        </div>
        <div className="space-y-4">
          {[
            {
              step: 1,
              title: "Select Request Type",
              description: "Choose between Travel Order or Seminar Application based on your needs.",
              icon: <FileText className="h-5 w-5" />
            },
            {
              step: 2,
              title: "Fill in Travel Details",
              description: "Enter destination, dates, purpose, and requester information.",
              icon: <Clock className="h-5 w-5" />
            },
            {
              step: 3,
              title: "Choose Transportation",
              description: "Select institutional vehicle, owned vehicle, or rental option.",
              icon: <Building2 className="h-5 w-5" />
            },
            {
              step: 4,
              title: "Estimate Budget",
              description: "Provide cost estimates for food, accommodation, and other expenses.",
              icon: <Wallet className="h-5 w-5" />
            },
            {
              step: 5,
              title: "Review and Submit",
              description: "Review all information and submit for approval through the workflow.",
              icon: <MessageSquare className="h-5 w-5" />
            }
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#7A0010] to-[#9c2a3a] flex items-center justify-center text-white font-bold">
                {item.step}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-gray-600">{item.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                </div>
                <p className="text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Required Information */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-amber-600 p-2">
            <Users className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Required Information</h2>
        </div>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Travel dates (departure and return)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Destination and purpose of travel</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Requester name and department</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Transportation mode selection</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Budget estimates (if applicable)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Participant information (for seminars)</span>
          </li>
        </ul>
      </motion.section>

      {/* Approval Process */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-purple-600 p-2">
            <ArrowRight className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Approval Process Overview</h2>
        </div>
        <div className="space-y-3 text-gray-700">
          <p className="leading-relaxed">
            Your request will go through the following approval workflow:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li><strong>Department Head</strong> - Initial review and endorsement (for faculty)</li>
            <li><strong>Transportation Manager (Admin)</strong> - Vehicle and logistics assignment</li>
            <li><strong>Comptroller</strong> - Budget review and approval</li>
            <li><strong>Human Resources</strong> - Personnel verification</li>
            <li><strong>Vice President</strong> - Executive approval</li>
            <li><strong>President/COO</strong> - Final approval (for heads or high-budget requests ≥₱15,000)</li>
            <li><strong>Transportation Manager</strong> - Final logistics confirmation</li>
          </ol>
          <p className="text-sm text-gray-600 mt-4 italic">
            Note: The approval path may vary based on your role and request budget. 
            Requests with budgets ≥₱15,000 require President approval.
          </p>
        </div>
      </motion.section>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-6"
      >
        <button
          onClick={() => router.push("/user/request/new")}
          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <span>Start Request Now</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </motion.div>
    </div>
  );
}

