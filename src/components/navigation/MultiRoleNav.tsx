"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Calendar, 
  Inbox, 
  FileText, 
  Plus, 
  History, 
  Users, 
  Settings, 
  ChevronDown,
  Crown,
  Shield,
  Briefcase,
  UserCheck,
  Building
} from 'lucide-react';

interface UserRole {
  type: 'user' | 'head' | 'admin' | 'comptroller' | 'hr' | 'executive';
  label: string;
  icon: any;
  color: string;
}

interface NavigationItem {
  icon: any;
  label: string;
  href?: string;
  expandable?: boolean;
  children?: Array<{
    label: string;
    href: string;
    icon?: any;
  }>;
  badge?: string;
}

interface MultiRoleNavProps {
  userRoles: UserRole[];
  currentRole: string;
  onRoleChange: (role: string) => void;
  userName: string;
  userPhoto?: string;
}

export default function MultiRoleNav({
  userRoles,
  currentRole,
  onRoleChange,
  userName,
  userPhoto
}: MultiRoleNavProps) {
  const [requestsExpanded, setRequestsExpanded] = useState(true);

  const roleIcons = {
    user: Users,
    head: Building,
    admin: Shield,
    comptroller: Briefcase,
    hr: UserCheck,
    executive: Crown
  };

  const roleColors = {
    user: 'bg-gray-100 text-gray-800',
    head: 'bg-blue-100 text-blue-800',
    admin: 'bg-green-100 text-green-800',
    comptroller: 'bg-purple-100 text-purple-800',
    hr: 'bg-orange-100 text-orange-800',
    executive: 'bg-red-100 text-red-800'
  };

  // Navigation items based on current role
  const getNavigationItems = (): NavigationItem[] => {
    const baseItems = [
      { icon: Home, label: 'Dashboard', href: '/dashboard' },
      { icon: Calendar, label: 'Schedule', href: '/schedule' }
    ];

    const roleSpecificItems = {
      user: [
        { icon: Inbox, label: 'My Inbox', href: '/inbox' },
        { 
          icon: FileText, 
          label: 'Requests', 
          expandable: true,
          children: [
            { label: 'New Request', href: '/requests/new', icon: Plus },
            { label: 'My Drafts', href: '/requests/drafts' },
            { label: 'My Submissions', href: '/requests/submissions' },
            { label: 'My History', href: '/requests/history' }
          ]
        }
      ],
      head: [
        { icon: Inbox, label: 'Head Inbox', href: '/head/inbox', badge: '3' },
        { 
          icon: FileText, 
          label: 'Requests', 
          expandable: true,
          children: [
            { label: 'New Request', href: '/requests/new', icon: Plus },
            { label: 'My Submissions', href: '/requests/submissions' },
            { label: 'Department Requests', href: '/head/requests' },
            { label: 'Approval History', href: '/head/history' }
          ]
        }
      ],
      admin: [
        { icon: Inbox, label: 'Admin Inbox', href: '/admin/inbox', badge: '5' },
        { 
          icon: FileText, 
          label: 'Requests', 
          expandable: true,
          children: [
            { label: 'New Request', href: '/requests/new', icon: Plus },
            { label: 'My Submissions', href: '/requests/submissions' },
            { label: 'Pending Assignment', href: '/admin/requests/pending' },
            { label: 'Active Requests', href: '/admin/requests/active' },
            { label: 'Processing History', href: '/admin/history' }
          ]
        }
      ],
      comptroller: [
        { icon: Inbox, label: 'Budget Review', href: '/comptroller/inbox', badge: '2' },
        { 
          icon: FileText, 
          label: 'Requests', 
          expandable: true,
          children: [
            { label: 'New Request', href: '/requests/new', icon: Plus },
            { label: 'My Submissions', href: '/requests/submissions' },
            { label: 'Budget Review History', href: '/comptroller/history' }
          ]
        }
      ],
      hr: [
        { icon: Inbox, label: 'HR Review', href: '/hr/inbox', badge: '1' },
        { 
          icon: FileText, 
          label: 'Requests', 
          expandable: true,
          children: [
            { label: 'New Request', href: '/requests/new', icon: Plus },
            { label: 'My Submissions', href: '/requests/submissions' },
            { label: 'HR Review History', href: '/hr/history' }
          ]
        }
      ],
      executive: [
        { icon: Inbox, label: 'Executive Review', href: '/executive/inbox', badge: '4' },
        { 
          icon: FileText, 
          label: 'Requests', 
          expandable: true,
          children: [
            { label: 'New Request', href: '/requests/new', icon: Plus },
            { label: 'My Submissions', href: '/requests/submissions' },
            { label: 'Executive History', href: '/executive/history' }
          ]
        }
      ]
    };

    return [
      ...baseItems,
      ...(roleSpecificItems[currentRole as keyof typeof roleSpecificItems] || roleSpecificItems.user)
    ];
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* User Profile & Role Switcher */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-[#7a0019] rounded-full flex items-center justify-center text-white font-semibold">
            {userName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">{userName}</p>
            <p className="text-xs text-gray-500">Multi-Role User</p>
          </div>
        </div>

        {/* Role Switcher */}
        {userRoles.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Active Role
            </p>
            <div className="grid grid-cols-2 gap-2">
              {userRoles.map((role) => {
                const Icon = roleIcons[role.type as keyof typeof roleIcons];
                const isActive = currentRole === role.type;
                
                return (
                  <motion.button
                    key={role.type}
                    onClick={() => onRoleChange(role.type)}
                    className={`
                      p-2 rounded-lg text-xs font-medium transition-all
                      ${isActive 
                        ? roleColors[role.type as keyof typeof roleColors] + ' ring-2 ring-[#7a0019]'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    {role.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {navigationItems.map((item, index) => {
            if (item.expandable) {
              return (
                <div key={item.label}>
                  <motion.button
                    onClick={() => setRequestsExpanded(!requestsExpanded)}
                    className="w-full flex items-center justify-between p-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <motion.div
                      animate={{ rotate: requestsExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {requestsExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-8 mt-2 space-y-1"
                      >
                        {item.children?.map((child: any, childIndex: number) => (
                          <motion.a
                            key={child.label}
                            href={child.href}
                            className="flex items-center space-x-2 p-2 text-sm text-gray-600 hover:text-[#7a0019] hover:bg-red-50 rounded-lg transition-colors"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: childIndex * 0.05 }}
                            whileHover={{ x: 4 }}
                          >
                            {child.icon && <child.icon className="w-4 h-4" />}
                            <span>{child.label}</span>
                          </motion.a>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <motion.a
                key={item.label}
                href={item.href}
                className="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group"
                whileHover={{ x: 4 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-5 h-5 group-hover:text-[#7a0019]" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-[#7a0019] text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </motion.a>
            );
          })}
        </div>
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-gray-200">
        <motion.a
          href="/settings"
          className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          whileHover={{ x: 4 }}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </motion.a>
      </div>
    </div>
  );
}
