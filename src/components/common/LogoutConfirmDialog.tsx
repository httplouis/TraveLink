"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function LogoutConfirmDialog({ isOpen, onClose, onConfirm, isLoading }: LogoutConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogOut className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Confirm Logout</h3>
          <p className="text-gray-500 mb-6">Are you sure you want to logout? You will need to sign in again to access your account.</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Logout
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface UseLogoutConfirmReturn {
  showDialog: boolean;
  isLoading: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  handleLogout: () => Promise<void>;
}

export function useLogoutConfirm(logoutFn: () => Promise<void>): UseLogoutConfirmReturn {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const openDialog = () => setShowDialog(true);
  const closeDialog = () => setShowDialog(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutFn();
    } finally {
      setIsLoading(false);
      setShowDialog(false);
    }
  };

  return { showDialog, isLoading, openDialog, closeDialog, handleLogout };
}
