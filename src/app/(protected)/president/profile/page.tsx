"use client";

import React from "react";
import { UserRound } from "lucide-react";

export default function PresidentProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">President Profile</h1>
        <p className="text-gray-600 mt-1">
          Manage your presidential profile
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <UserRound className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Profile Management Coming Soon
        </h3>
        <p className="text-gray-600">
          Update your presidential profile and credentials
        </p>
      </div>
    </div>
  );
}
