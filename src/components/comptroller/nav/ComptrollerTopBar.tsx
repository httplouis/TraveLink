"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import ComptrollerNotificationDropdown from "./ComptrollerNotificationDropdown";
import ComptrollerProfileDropdown from "./ComptrollerProfileDropdown";

export default function ComptrollerTopBar() {

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left - Logo & Title */}
        <div className="flex items-center gap-3">
          <Link href="/comptroller" className="inline-flex items-center gap-3 group">
            <div className="relative h-10 w-10 rounded-lg bg-white p-1.5 shadow-md border border-gray-200 transition-transform group-hover:scale-105">
              <Image
                src="/travelink.png"
                alt="Travelink Logo"
                width={32}
                height={32}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Travelink</h1>
              <span className="h-6 w-px bg-gray-300" />
              <p className="text-sm text-gray-600 font-medium">Comptroller</p>
            </div>
          </Link>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <ComptrollerNotificationDropdown />

          {/* Profile Dropdown */}
          <ComptrollerProfileDropdown />
        </div>
      </div>
    </header>
  );
}
