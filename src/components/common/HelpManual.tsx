// src/components/common/HelpManual.tsx
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  HelpCircle,
  Book,
  FileText,
  Users,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Search,
  ChevronRight,
  ChevronDown,
  Inbox,
  Sparkles,
  LayoutDashboard,
  Eye,
  Truck,
  ClipboardList,
  UserCog,
  Shield,
  Wallet,
  Clock,
  MapPin,
  Settings,
  History,
  Car,
  Send,
  AlertCircle,
  FileCheck,
  Building2,
  Wrench,
  BarChart3,
  Bell,
  PenLine,
} from "lucide-react";

type RoleType = "user" | "head" | "admin" | "hr" | "comptroller" | "vp" | "president" | "driver" | "exec";

interface HelpManualProps {
  isOpen: boolean;
  onClose: () => void;
  role?: RoleType;
}

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}


// ==================== USER/FACULTY SECTIONS ====================
const getUserSections = (): Section[] => [
  {
    id: "welcome",
    title: "Welcome to Travelink",
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Welcome to <strong>Travelink</strong> - the Campus Transport Management System for Enverga University. 
          This system helps you request official transportation for seminars, educational trips, and official business travel.
        </p>
        <div className="bg-gradient-to-r from-[#7a0019]/10 to-[#7a0019]/5 border border-[#7a0019]/20 rounded-xl p-5">
          <h4 className="font-bold text-[#7a0019] mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> What You Can Do
          </h4>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
              <span>Submit travel requests for official trips</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
              <span>Track your request status through the approval workflow</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
              <span>View available vehicles and drivers</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
              <span>Provide feedback after completed trips</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
              <span>Save drafts and continue later</span>
            </li>
          </ul>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Use the AI chatbot (Travie) at the bottom-right corner for quick answers to your questions!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "dashboard",
    title: "Your Dashboard",
    icon: LayoutDashboard,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Your dashboard is your home base. Here's what you'll find:
        </p>
        <div className="grid gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" /> Statistics Cards
            </h4>
            <p className="text-sm text-gray-600">See at a glance how many requests are pending, approved, or completed.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" /> Recent Activity
            </h4>
            <p className="text-sm text-gray-600">View your latest submissions and their current status in the workflow.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Bell className="h-4 w-4 text-red-600" /> Notifications
            </h4>
            <p className="text-sm text-gray-600">Get alerts when your request is approved, returned, or needs attention.</p>
          </div>
        </div>
      </div>
    ),
  },

  {
    id: "create-request",
    title: "Creating a New Request",
    icon: FileText,
    content: (
      <div className="space-y-5">
        <p className="text-gray-700 leading-relaxed">
          Follow these steps to create a travel request:
        </p>
        
        <div className="space-y-4">
          <div className="border-l-4 border-[#7a0019] pl-4 py-2">
            <h4 className="font-bold text-gray-900">Step 1: Choose Request Type</h4>
            <p className="text-sm text-gray-600 mt-1">Select either:</p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-4">
              <li>• <strong>Travel Order</strong> - For general official travel (meetings, visits, etc.)</li>
              <li>• <strong>Seminar Application</strong> - For attending seminars/trainings with participants</li>
            </ul>
          </div>

          <div className="border-l-4 border-[#7a0019] pl-4 py-2">
            <h4 className="font-bold text-gray-900">Step 2: Fill in Travel Details</h4>
            <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-4">
              <li>• <strong>Title</strong> - Brief description (e.g., "Faculty Development Seminar")</li>
              <li>• <strong>Purpose</strong> - Why you need to travel</li>
              <li>• <strong>Destination</strong> - Where you're going</li>
              <li>• <strong>Travel Dates</strong> - Start and end dates</li>
            </ul>
          </div>

          <div className="border-l-4 border-[#7a0019] pl-4 py-2">
            <h4 className="font-bold text-gray-900">Step 3: Add Requester Information</h4>
            <p className="text-sm text-gray-600 mt-1">
              Enter who is requesting the travel. This can be you or someone else you're submitting for.
            </p>
          </div>

          <div className="border-l-4 border-[#7a0019] pl-4 py-2">
            <h4 className="font-bold text-gray-900">Step 4: Choose Transportation</h4>
            <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-4">
              <li>• <strong>Institutional Vehicle</strong> - University-owned vehicle (van, bus, car)</li>
              <li>• <strong>Owned Vehicle</strong> - Your personal vehicle (with reimbursement)</li>
              <li>• <strong>Rental</strong> - Rented vehicle for the trip</li>
            </ul>
          </div>

          <div className="border-l-4 border-[#7a0019] pl-4 py-2">
            <h4 className="font-bold text-gray-900">Step 5: Budget Estimation (if applicable)</h4>
            <p className="text-sm text-gray-600 mt-1">
              If your trip requires budget, provide estimates for:
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-4">
              <li>• Food & meals</li>
              <li>• Accommodation</li>
              <li>• Registration fees</li>
              <li>• Other expenses</li>
            </ul>
          </div>

          <div className="border-l-4 border-[#7a0019] pl-4 py-2">
            <h4 className="font-bold text-gray-900">Step 6: Add Participants (for Seminars)</h4>
            <p className="text-sm text-gray-600 mt-1">
              For seminar applications, add all participants who will attend. You can invite them via email.
            </p>
          </div>

          <div className="border-l-4 border-green-600 pl-4 py-2 bg-green-50 rounded-r-lg">
            <h4 className="font-bold text-green-800">Step 7: Review & Submit</h4>
            <p className="text-sm text-green-700 mt-1">
              Review all information carefully, then click "Submit" to send for approval.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>⚠️ Important:</strong> Once submitted, you cannot edit your request. Make sure all details are correct before submitting!
          </p>
        </div>
      </div>
    ),
  },

  {
    id: "approval-workflow",
    title: "Understanding the Approval Process",
    icon: ClipboardList,
    content: (
      <div className="space-y-5">
        <p className="text-gray-700 leading-relaxed">
          Your request goes through multiple approval stages. Here's the complete workflow:
        </p>
        
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h4 className="font-bold text-gray-900 mb-4">Standard Approval Workflow</h4>
          <div className="space-y-3">
            {[
              { num: 1, role: "Department Head", desc: "Reviews and endorses your request", color: "bg-blue-500" },
              { num: 2, role: "Transport Admin", desc: "Assigns vehicle and driver (if institutional)", color: "bg-purple-500" },
              { num: 3, role: "Comptroller", desc: "Reviews budget (only if budget is requested)", color: "bg-indigo-500" },
              { num: 4, role: "HR Officer", desc: "Verifies personnel and compliance", color: "bg-green-500" },
              { num: 5, role: "Vice President", desc: "Executive approval", color: "bg-amber-500" },
              { num: 6, role: "President/COO", desc: "Final approval (for heads or budget ≥₱15,000)", color: "bg-red-500" },
            ].map((step) => (
              <div key={step.num} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${step.color} text-white flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                  {step.num}
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-gray-900">{step.role}</span>
                  <span className="text-gray-500 text-sm ml-2">— {step.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h5 className="font-semibold text-green-800 mb-2">✓ Owned Vehicle + No Budget</h5>
            <p className="text-sm text-green-700">Skips Comptroller step since no budget review needed.</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-semibold text-blue-800 mb-2">💰 With Budget</h5>
            <p className="text-sm text-blue-700">Always goes through Comptroller for budget verification.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "tracking",
    title: "Tracking Your Requests",
    icon: Eye,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Keep track of all your submitted requests:
        </p>
        
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">📋 Submissions Page</h4>
            <p className="text-sm text-gray-600 mb-2">Go to <strong>Request → Submissions</strong> to see all your requests.</p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• View current status (Pending, Approved, Returned, etc.)</li>
              <li>• See which approver currently has your request</li>
              <li>• Check approval history and comments</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">📊 Status Meanings</h4>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="text-sm">Pending - Awaiting approval</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-sm">Approved - Ready to go!</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-sm">Returned - Needs revision</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-sm">Completed - Trip finished</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },

  {
    id: "drafts",
    title: "Saving Drafts",
    icon: FileCheck,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Don't have all the information yet? Save your request as a draft and continue later.
        </p>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">How Drafts Work</h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Your request is automatically saved as you fill it out</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Access drafts from <strong>Request → Drafts</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Continue editing anytime before submitting</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Delete drafts you no longer need</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "inbox",
    title: "Your Inbox",
    icon: Inbox,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Your inbox shows requests that need your attention, such as signing as a participant.
        </p>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">What You'll Find</h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Requests where you're invited as a participant</li>
            <li>• Signature requests for endorsements</li>
            <li>• Notifications about your submitted requests</li>
          </ul>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> The badge number on "Inbox" shows how many items need your action.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "vehicles-drivers",
    title: "Viewing Vehicles & Drivers",
    icon: Car,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Browse available university vehicles and drivers:
        </p>
        <div className="grid gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600" /> Vehicles Page
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• See all available vehicles (vans, buses, cars)</li>
              <li>• View vehicle capacity and type</li>
              <li>• Check availability status</li>
            </ul>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" /> Drivers Page
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• View available drivers</li>
              <li>• See driver ratings and feedback</li>
              <li>• Check license information</li>
            </ul>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> You cannot assign vehicles/drivers yourself. The Transport Admin will assign them after your request is approved by your Department Head.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "feedback",
    title: "Providing Feedback",
    icon: MessageSquare,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          After completing a trip, you'll be asked to provide feedback about your experience.
        </p>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
          <h4 className="font-bold text-green-800 mb-3">Why Feedback Matters</h4>
          <ul className="space-y-2 text-green-700 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Helps improve driver performance and service quality</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Identifies vehicle maintenance needs</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Your feedback is confidential (can be anonymous)</span>
            </li>
          </ul>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            <strong>⚠️ Required:</strong> You must provide feedback for completed trips before creating new requests. This ensures continuous improvement of our transport services.
          </p>
        </div>
      </div>
    ),
  },
];


// ==================== HEAD/APPROVER SECTIONS ====================
const getHeadSections = (): Section[] => [
  ...getUserSections().slice(0, 2), // Welcome and Dashboard
  {
    id: "head-responsibilities",
    title: "Your Role as Department Head",
    icon: Shield,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          As a Department Head, you are the first approver for travel requests from your department members.
        </p>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
          <h4 className="font-bold text-blue-800 mb-3">Your Responsibilities</h4>
          <ul className="space-y-2 text-blue-700 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Review and endorse travel requests from your department</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Verify the purpose and necessity of travel</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Check budget estimates are reasonable</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Return requests that need corrections</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "reviewing-requests",
    title: "How to Review Requests",
    icon: Eye,
    content: (
      <div className="space-y-5">
        <p className="text-gray-700 leading-relaxed">
          When a request arrives in your inbox, follow these steps:
        </p>
        
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <h4 className="font-bold text-gray-900">1. Open the Request</h4>
            <p className="text-sm text-gray-600 mt-1">Click on the request in your inbox to view full details.</p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <h4 className="font-bold text-gray-900">2. Review All Information</h4>
            <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-4">
              <li>• Check travel dates and destination</li>
              <li>• Verify the purpose is valid for official travel</li>
              <li>• Review budget estimates (if applicable)</li>
              <li>• Confirm participants are appropriate</li>
            </ul>
          </div>

          <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded-r-lg">
            <h4 className="font-bold text-green-800">3. Approve</h4>
            <p className="text-sm text-green-700 mt-1">
              If everything looks good, click "Approve" and add any notes. The request moves to the Transport Admin.
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 rounded-r-lg">
            <h4 className="font-bold text-red-800">3. Or Return</h4>
            <p className="text-sm text-red-700 mt-1">
              If corrections are needed, click "Return" and provide clear feedback on what needs to be fixed.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "head-inbox",
    title: "Managing Your Inbox",
    icon: Inbox,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Your inbox shows all requests pending your approval.
        </p>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Inbox Features</h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• <strong>Filter by status</strong> - View pending, approved, or returned requests</li>
            <li>• <strong>Search</strong> - Find specific requests by name or destination</li>
            <li>• <strong>Sort</strong> - Order by date, requester, or urgency</li>
            <li>• <strong>Quick actions</strong> - Approve or return directly from the list</li>
          </ul>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>💡 Tip:</strong> Check your inbox daily to avoid delays in the approval process!
          </p>
        </div>
      </div>
    ),
  },
  ...getUserSections().slice(2), // Rest of user sections
];


// ==================== ADMIN SECTIONS ====================
const getAdminSections = (): Section[] => [
  {
    id: "admin-welcome",
    title: "Transport Admin Overview",
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Welcome to the <strong>Transport Admin Portal</strong>. You manage the university's transport operations including vehicles, drivers, and trip assignments.
        </p>
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
          <h4 className="font-bold text-purple-800 mb-3">Your Responsibilities</h4>
          <ul className="space-y-2 text-purple-700 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Assign vehicles and drivers to approved requests</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Manage the vehicle fleet (add, update, maintain)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Manage driver records and assignments</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Schedule and track all transport activities</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Generate reports and analytics</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "admin-inbox",
    title: "Processing Requests",
    icon: Inbox,
    content: (
      <div className="space-y-5">
        <p className="text-gray-700 leading-relaxed">
          Requests arrive in your inbox after Department Head approval. Here's how to process them:
        </p>
        
        <div className="space-y-4">
          <div className="border-l-4 border-purple-500 pl-4 py-2">
            <h4 className="font-bold text-gray-900">1. Review the Request</h4>
            <p className="text-sm text-gray-600 mt-1">Check travel dates, destination, and vehicle requirements.</p>
          </div>

          <div className="border-l-4 border-purple-500 pl-4 py-2">
            <h4 className="font-bold text-gray-900">2. Check Availability</h4>
            <p className="text-sm text-gray-600 mt-1">Use the Schedule page to see which vehicles and drivers are available for the requested dates.</p>
          </div>

          <div className="border-l-4 border-purple-500 pl-4 py-2">
            <h4 className="font-bold text-gray-900">3. Assign Vehicle & Driver</h4>
            <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-4">
              <li>• Select an appropriate vehicle based on passenger count</li>
              <li>• Assign an available driver</li>
              <li>• Add any special instructions</li>
            </ul>
          </div>

          <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded-r-lg">
            <h4 className="font-bold text-green-800">4. Forward for Approval</h4>
            <p className="text-sm text-green-700 mt-1">
              After assignment, the request moves to Comptroller (if budget) or HR for further approval.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "vehicle-management",
    title: "Managing Vehicles",
    icon: Truck,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Keep the vehicle fleet up-to-date and well-maintained.
        </p>
        <div className="grid gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Adding a Vehicle</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Go to <strong>Vehicles</strong> page</li>
              <li>• Click "Add Vehicle"</li>
              <li>• Enter plate number, type, capacity, and details</li>
              <li>• Set initial status (Available, In Use, Maintenance)</li>
            </ul>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Vehicle Status</h4>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="text-center p-2 bg-green-50 rounded">
                <span className="text-xs font-medium text-green-700">Available</span>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded">
                <span className="text-xs font-medium text-blue-700">In Use</span>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded">
                <span className="text-xs font-medium text-orange-700">Maintenance</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "driver-management",
    title: "Managing Drivers",
    icon: Users,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Manage driver records and track their assignments.
        </p>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Driver Information</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Personal details</strong> - Name, contact, employee ID</li>
            <li>• <strong>License info</strong> - License number, type, expiry date</li>
            <li>• <strong>Status</strong> - Available, On Trip, Off Duty</li>
            <li>• <strong>Ratings</strong> - Feedback scores from passengers</li>
          </ul>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>💡 Tip:</strong> Regularly check driver license expiry dates to ensure compliance!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "schedule",
    title: "Schedule & Calendar",
    icon: Calendar,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          The schedule page shows all transport activities in a calendar view.
        </p>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Calendar Features</h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• <strong>Day/Week/Month views</strong> - Switch between different time scales</li>
            <li>• <strong>Color coding</strong> - Different colors for different trip types</li>
            <li>• <strong>Conflict detection</strong> - See overlapping assignments</li>
            <li>• <strong>Click to view</strong> - Click any trip to see full details</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "maintenance",
    title: "Vehicle Maintenance",
    icon: Wrench,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Track and schedule vehicle maintenance to keep the fleet in good condition.
        </p>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Maintenance Records</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Schedule regular maintenance (oil change, tire rotation, etc.)</li>
            <li>• Record repairs and costs</li>
            <li>• Track maintenance history per vehicle</li>
            <li>• Set reminders for upcoming maintenance</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    icon: BarChart3,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Generate reports to analyze transport operations.
        </p>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Available Reports</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Trip reports</strong> - All trips by date range</li>
            <li>• <strong>Vehicle utilization</strong> - Usage statistics per vehicle</li>
            <li>• <strong>Driver performance</strong> - Trips and ratings per driver</li>
            <li>• <strong>Department usage</strong> - Requests by department</li>
          </ul>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Export:</strong> All reports can be exported to Excel or PDF for sharing.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "admin-feedback",
    title: "Managing Feedback",
    icon: MessageSquare,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Review and respond to feedback from passengers.
        </p>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Feedback Management</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• View all feedback with ratings and comments</li>
            <li>• Filter by driver, vehicle, or rating</li>
            <li>• Respond to feedback (visible to submitter)</li>
            <li>• Mark feedback as reviewed or resolved</li>
            <li>• Generate QR codes for trip feedback collection</li>
          </ul>
        </div>
      </div>
    ),
  },
];


// ==================== HR SECTIONS ====================
const getHRSections = (): Section[] => [
  {
    id: "hr-welcome",
    title: "HR Officer Overview",
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          As an <strong>HR Officer</strong>, you verify personnel compliance and approve travel requests after budget review.
        </p>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
          <h4 className="font-bold text-green-800 mb-3">Your Responsibilities</h4>
          <ul className="space-y-2 text-green-700 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Verify employee eligibility for travel</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Check compliance with HR policies</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Review participant lists for seminars</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Forward approved requests to VP/President</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "hr-review",
    title: "Reviewing Requests",
    icon: Eye,
    content: (
      <div className="space-y-5">
        <p className="text-gray-700 leading-relaxed">
          Requests arrive after Admin processing (and Comptroller if budget). Here's what to check:
        </p>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">HR Checklist</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              </div>
              <span>Requester is an active employee</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              </div>
              <span>Travel dates don't conflict with leave records</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              </div>
              <span>All participants are verified employees/students</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              </div>
              <span>Travel purpose aligns with job responsibilities</span>
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h5 className="font-semibold text-green-800 text-sm mb-1">✓ Approve</h5>
            <p className="text-xs text-green-700">Forwards to VP for executive approval</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h5 className="font-semibold text-red-800 text-sm mb-1">✗ Return</h5>
            <p className="text-xs text-red-700">Sends back with feedback for corrections</p>
          </div>
        </div>
      </div>
    ),
  },
  ...getUserSections().slice(2, 6), // Request creation and tracking sections
];

// ==================== COMPTROLLER SECTIONS ====================
const getComptrollerSections = (): Section[] => [
  {
    id: "comptroller-welcome",
    title: "Comptroller Overview",
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          As <strong>Comptroller</strong>, you review and approve the financial aspects of travel requests.
        </p>
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
          <h4 className="font-bold text-indigo-800 mb-3">Your Responsibilities</h4>
          <ul className="space-y-2 text-indigo-700 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Review budget estimates for reasonableness</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Verify fund availability</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Check compliance with budget policies</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Approve or return requests based on financial review</span>
            </li>
          </ul>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> You only receive requests that have a budget component. Requests with no budget skip your approval.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "budget-review",
    title: "Reviewing Budgets",
    icon: Wallet,
    content: (
      <div className="space-y-5">
        <p className="text-gray-700 leading-relaxed">
          When reviewing budget requests, check the following:
        </p>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Budget Review Checklist</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <Wallet className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <span><strong>Food & Meals</strong> - Within per diem limits</span>
            </li>
            <li className="flex items-start gap-2">
              <Wallet className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <span><strong>Accommodation</strong> - Reasonable rates for location</span>
            </li>
            <li className="flex items-start gap-2">
              <Wallet className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <span><strong>Registration Fees</strong> - Verified against event details</span>
            </li>
            <li className="flex items-start gap-2">
              <Wallet className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <span><strong>Transportation</strong> - If rental or reimbursement</span>
            </li>
            <li className="flex items-start gap-2">
              <Wallet className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <span><strong>Other Expenses</strong> - Justified and documented</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-semibold text-blue-800 mb-2">Budget Thresholds</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Requests ≥ ₱15,000 require President approval</li>
            <li>• Department heads' requests always go to President</li>
          </ul>
        </div>
      </div>
    ),
  },
  ...getUserSections().slice(2, 6),
];


// ==================== VP SECTIONS ====================
const getVPSections = (): Section[] => [
  {
    id: "vp-welcome",
    title: "Vice President Overview",
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          As <strong>Vice President</strong>, you provide executive approval for travel requests after HR verification.
        </p>
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
          <h4 className="font-bold text-amber-800 mb-3">Your Responsibilities</h4>
          <ul className="space-y-2 text-amber-700 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Review requests for strategic alignment</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Approve standard faculty/staff travel</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Forward high-value requests to President</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Monitor overall travel activity</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "vp-approval",
    title: "Approval Guidelines",
    icon: FileCheck,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          As VP, you're the final approver for most requests. Here's when requests go to President:
        </p>
        <div className="grid gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h5 className="font-semibold text-green-800 mb-2">✓ You Can Approve</h5>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Standard faculty/staff travel requests</li>
              <li>• Requests with budget under ₱15,000</li>
              <li>• Routine seminar attendance</li>
            </ul>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h5 className="font-semibold text-amber-800 mb-2">→ Forward to President</h5>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Requests from Department Heads</li>
              <li>• Budget ≥ ₱15,000</li>
              <li>• International travel</li>
              <li>• Special circumstances</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  ...getUserSections().slice(2, 6),
];

// ==================== PRESIDENT SECTIONS ====================
const getPresidentSections = (): Section[] => [
  {
    id: "president-welcome",
    title: "President/COO Overview",
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          As <strong>President/COO</strong>, you provide final approval for high-level travel requests.
        </p>
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-5">
          <h4 className="font-bold text-red-800 mb-3">Your Responsibilities</h4>
          <ul className="space-y-2 text-red-700 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Final approval for Department Head travel</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Approve high-budget requests (≥₱15,000)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Review international travel requests</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Set travel policies and guidelines</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "president-review",
    title: "Request Review",
    icon: Eye,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Requests reaching you have already been reviewed by all previous approvers. Focus on:
        </p>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Final Review Points</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span>Strategic value of the travel</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span>Budget justification for high-cost items</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span>Alignment with institutional goals</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span>Previous approvers' notes and comments</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  ...getUserSections().slice(2, 6),
];

// ==================== DRIVER SECTIONS ====================
const getDriverSections = (): Section[] => [
  {
    id: "driver-welcome",
    title: "Driver Portal Overview",
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Welcome to the <strong>Driver Portal</strong>. Here you can view your assignments and manage your trips.
        </p>
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5">
          <h4 className="font-bold text-blue-800 mb-3">What You Can Do</h4>
          <ul className="space-y-2 text-blue-700 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>View your assigned trips</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>See trip details (destination, passengers, time)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Check your schedule calendar</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>View your performance ratings</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "driver-assignments",
    title: "Your Assignments",
    icon: ClipboardList,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          View and manage your trip assignments:
        </p>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Trip Information</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Destination</strong> - Where you're going</li>
            <li>• <strong>Date & Time</strong> - When to depart</li>
            <li>• <strong>Passengers</strong> - Who you're transporting</li>
            <li>• <strong>Vehicle</strong> - Which vehicle to use</li>
            <li>• <strong>Contact</strong> - Requester's contact info</li>
          </ul>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>💡 Tip:</strong> Check your assignments daily and arrive at least 15 minutes before departure time!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "driver-schedule",
    title: "Your Schedule",
    icon: Calendar,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          The calendar shows all your upcoming trips at a glance.
        </p>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Calendar Features</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• View trips by day, week, or month</li>
            <li>• Color-coded by trip status</li>
            <li>• Click on a trip to see full details</li>
            <li>• See upcoming trips at a glance</li>
          </ul>
        </div>
      </div>
    ),
  },
];


// ==================== FAQ SECTION ====================
const getFAQSection = (role: RoleType): Section => ({
  id: "faq",
  title: "Frequently Asked Questions",
  icon: HelpCircle,
  content: (
    <div className="space-y-3">
      {[
        ...(["user", "head", "hr", "comptroller", "vp", "president", "exec"].includes(role) ? [
          {
            q: "How long does approval take?",
            a: "Typically 1-3 business days depending on the number of approvers. Urgent requests may be expedited."
          },
          {
            q: "Can I edit a submitted request?",
            a: "No, once submitted you cannot edit. If changes are needed, ask an approver to return it to you."
          },
          {
            q: "What if my request is returned?",
            a: "You'll receive a notification with the reason. Make the required changes and resubmit."
          },
        ] : []),
        ...(role === "user" ? [
          {
            q: "How do I track my request status?",
            a: "Go to Request → Submissions to see all your requests and their current status."
          },
          {
            q: "What's the difference between Travel Order and Seminar Application?",
            a: "Travel Order is for general official travel. Seminar Application is for attending seminars/trainings with multiple participants."
          },
          {
            q: "Can I request a specific vehicle or driver?",
            a: "No, vehicle and driver assignment is done by the Transport Admin based on availability."
          },
        ] : []),
        ...(["head", "hr", "comptroller", "vp", "president"].includes(role) ? [
          {
            q: "What happens if I don't approve in time?",
            a: "The request remains pending. Check your inbox regularly to avoid delays."
          },
          {
            q: "Can I delegate my approval authority?",
            a: "Contact the Super Admin to set up temporary delegation during your absence."
          },
        ] : []),
        ...(role === "admin" ? [
          {
            q: "What if no vehicles are available?",
            a: "You can return the request with a note, or suggest alternative dates to the requester."
          },
          {
            q: "How do I handle maintenance scheduling?",
            a: "Go to Maintenance page to schedule and track vehicle maintenance. Vehicles under maintenance are automatically unavailable."
          },
        ] : []),
        ...(role === "driver" ? [
          {
            q: "What if I can't make an assigned trip?",
            a: "Contact the Transport Admin immediately so they can reassign the trip."
          },
          {
            q: "How are my ratings calculated?",
            a: "Ratings are based on passenger feedback after each trip. Maintain good service for high ratings!"
          },
        ] : []),
        {
          q: "Who do I contact for technical issues?",
          a: "Contact the IT Help Desk or use the AI chatbot (Travie) for quick assistance."
        },
      ].map((item, idx) => (
        <details key={idx} className="group bg-white border border-gray-200 rounded-lg shadow-sm">
          <summary className="flex items-center justify-between p-4 cursor-pointer list-none hover:bg-gray-50">
            <span className="font-medium text-gray-900 pr-4">{item.q}</span>
            <ChevronDown className="h-4 w-4 text-gray-500 group-open:rotate-180 transition-transform flex-shrink-0" />
          </summary>
          <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
            {item.a}
          </div>
        </details>
      ))}
    </div>
  ),
});

// ==================== GET SECTIONS BY ROLE ====================
const getSectionsForRole = (role: RoleType): Section[] => {
  switch (role) {
    case "user":
      return [...getUserSections(), getFAQSection(role)];
    case "head":
      return [...getHeadSections(), getFAQSection(role)];
    case "admin":
      return [...getAdminSections(), getFAQSection(role)];
    case "hr":
      return [...getHRSections(), getFAQSection(role)];
    case "comptroller":
      return [...getComptrollerSections(), getFAQSection(role)];
    case "vp":
      return [...getVPSections(), getFAQSection(role)];
    case "president":
      return [...getPresidentSections(), getFAQSection(role)];
    case "driver":
      return [...getDriverSections(), getFAQSection(role)];
    case "exec":
      return [...getVPSections(), getFAQSection(role)]; // Exec uses VP sections
    default:
      return [...getUserSections(), getFAQSection(role)];
  }
};

const getRoleTitle = (role: RoleType): string => {
  const titles: Record<RoleType, string> = {
    user: "Faculty/Staff",
    head: "Department Head",
    admin: "Transport Admin",
    hr: "HR Officer",
    comptroller: "Comptroller",
    vp: "Vice President",
    president: "President/COO",
    driver: "Driver",
    exec: "Executive",
  };
  return titles[role] || "User";
};


// ==================== MAIN COMPONENT ====================
export default function HelpManual({ isOpen, onClose, role = "user" }: HelpManualProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeSection, setActiveSection] = React.useState<string | null>(null);
  const sections = getSectionsForRole(role);
  
  const filteredSections = searchQuery
    ? sections.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sections;

  React.useEffect(() => {
    if (isOpen && !activeSection && sections.length > 0) {
      setActiveSection(sections[0].id);
    }
  }, [isOpen, activeSection, sections]);

  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setActiveSection(null);
    }
  }, [isOpen]);

  const activeContent = sections.find(s => s.id === activeSection);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[100]"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 bg-white rounded-2xl shadow-2xl z-[101] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#7a0019] to-[#5c0013]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur">
                  <Book className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">User Manual</h2>
                  <p className="text-sm text-white/80">Travelink Guide for {getRoleTitle(role)}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar */}
              <div className="w-72 border-r border-gray-200 bg-gray-50 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7a0019]/20 focus:border-[#7a0019] outline-none"
                    />
                  </div>
                </div>
                
                <nav className="flex-1 overflow-y-auto p-3">
                  <div className="space-y-1">
                    {filteredSections.map((section) => {
                      const isActive = activeSection === section.id;
                      return (
                        <button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                            isActive
                              ? "bg-[#7a0019] text-white shadow-md"
                              : "text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <section.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-white" : "text-gray-500"}`} />
                          <span className="text-sm font-medium truncate">{section.title}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {filteredSections.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No topics found for "{searchQuery}"
                    </div>
                  )}
                </nav>
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-y-auto p-8 bg-white">
                {activeContent ? (
                  <motion.div
                    key={activeContent.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="max-w-3xl"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-[#7a0019]/10 rounded-xl">
                        <activeContent.icon className="h-6 w-6 text-[#7a0019]" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{activeContent.title}</h3>
                    </div>
                    {activeContent.content}
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Select a topic from the sidebar
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Need more help? Use the AI chatbot (Travie) or contact the Transport Office.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-[#7a0019] text-white rounded-lg hover:bg-[#5c0013] transition-colors text-sm font-medium"
              >
                Close Manual
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
