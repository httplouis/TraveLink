// src/components/user/request/ui/UserSearchableSelect.tsx
"use client";

import * as React from "react";
import { Search, ChevronDown, User, Check } from "lucide-react";
import ProfileHoverCard from "@/components/common/ProfileHoverCard";

interface User {
  id: string;
  name: string;
  email?: string;
  position?: string;
  department?: string;
  departmentCode?: string;
  profilePicture?: string;
  role?: string;
}

interface UserSearchableSelectProps {
  value: string; // User name
  onChange: (userName: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export default function UserSearchableSelect({
  value,
  onChange,
  placeholder = "Type to search user (e.g., name, email)...",
  label = "Requesting person",
  required = false,
  error,
  className = "",
}: UserSearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Fetch users from API when dropdown opens or search query changes
  React.useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const queryParam = searchQuery.trim() ? `q=${encodeURIComponent(searchQuery)}` : '';
        const url = `/api/users/search${queryParam ? `?${queryParam}` : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.ok && Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          console.error('[UserSearchableSelect] Invalid response format:', data);
          setUsers([]);
        }
      } catch (error) {
        console.error('[UserSearchableSelect] Failed to fetch users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search queries, but fetch immediately when dropdown opens
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, searchQuery.trim() ? 300 : 0); // No delay for initial load

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isOpen]);

  // Use API-filtered results directly (no client-side filtering needed)
  const filteredUsers = React.useMemo(() => {
    return users;
  }, [users]);

  // Get selected user
  const selectedUser = React.useMemo(() => {
    return users.find(u => u.name === value);
  }, [users, value]);

  const handleSelect = (user: User) => {
    onChange(user.name);
    setSearchQuery("");
    setIsOpen(false);
    setActiveIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      setIsOpen(true);
      return;
    }
    if (!filteredUsers.length) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filteredUsers.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredUsers[activeIndex]) {
        handleSelect(filteredUsers[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? searchQuery : value}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
              setActiveIndex(0);
            }}
            onFocus={() => {
              setIsOpen(true);
              setSearchQuery("");
            }}
            onBlur={() => {
              // Delay to allow click on option
              setTimeout(() => setIsOpen(false), 200);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`
              w-full pl-10 pr-10 py-2.5 rounded-xl border-2 text-sm font-medium outline-none transition-all shadow-sm
              ${error
                ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                : "border-gray-300 bg-white focus:border-[#7A0010] focus:ring-4 focus:ring-[#7A0010]/10 focus:shadow-lg hover:border-gray-400"
              }
            `}
          />
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) {
                inputRef.current?.focus();
              }
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full max-h-80 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
            {loading ? (
              <div className="px-4 py-3 text-sm text-gray-500">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">No users found</div>
            ) : (
              filteredUsers.map((user, idx) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelect(user)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    idx === activeIndex
                      ? "bg-[#7A0010]/10 text-[#7A0010]"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${value === user.name ? "bg-[#7A0010]/5" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5A0010] flex items-center justify-center text-white font-semibold text-sm">
                          {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <ProfileHoverCard
                          profile={{
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            position: user.position,
                            department: user.department,
                            profile_picture: user.profilePicture,
                          }}
                        >
                          <span className="font-medium text-sm truncate hover:text-[#7A0010] transition-colors">{user.name}</span>
                        </ProfileHoverCard>
                        {value === user.name && (
                          <Check className="w-4 h-4 text-[#7A0010] flex-shrink-0" />
                        )}
                      </div>
                      {user.position && (
                        <p className="text-xs text-gray-600 truncate">{user.position}</p>
                      )}
                      {user.department && (
                        <p className="text-xs text-gray-500 truncate">
                          {user.department} {user.departmentCode ? `(${user.departmentCode})` : ''}
                        </p>
                      )}
                      {user.email && (
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {error && (
        <span className="text-xs text-red-600 mt-1 block">{error}</span>
      )}
    </div>
  );
}

