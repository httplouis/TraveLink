"use client";

import React from "react";
import { UserRound } from "lucide-react";

export default function VPProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">VP Profile</h1>
        <p className="text-gray-600 mt-1">
          Manage your profile information
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <UserRound className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Profile Management Coming Soon
        </h3>
        <p className="text-gray-600">
          Update your profile details, photo, and preferences
        </p>
      </div>
    </div>
  );
}
