"use client";

import React from "react";
import { HelpCircle, Book, MessageSquare, FileText, Video } from "lucide-react";

export default function ComptrollerHelpPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
        <p className="text-gray-600 mt-2">Get assistance and learn how to use the system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Documentation */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Book className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Documentation</h2>
          </div>
          <p className="text-gray-600 text-sm">Browse comprehensive guides and documentation</p>
        </div>

        {/* Video Tutorials */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Video className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Video Tutorials</h2>
          </div>
          <p className="text-gray-600 text-sm">Watch step-by-step video guides</p>
        </div>

        {/* Contact Support */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Contact Support</h2>
          </div>
          <p className="text-gray-600 text-sm">Get help from our support team</p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 mb-2">How do I review a budget request?</h3>
            <p className="text-gray-600 text-sm">Navigate to Budget Reviews in the sidebar and click on any pending request to review it.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">What happens after I approve a budget?</h3>
            <p className="text-gray-600 text-sm">The request moves to the executive approval stage in the workflow.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Can I undo an approval or rejection?</h3>
            <p className="text-gray-600 text-sm">Contact the system administrator if you need to reverse a decision.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
