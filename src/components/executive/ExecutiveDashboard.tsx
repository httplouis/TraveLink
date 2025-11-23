"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Calendar,
  MapPin,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { WowCard, WowButton } from '../common/Modal';
import { PersonDisplay } from '../common/ProfilePicture';

interface ExecutiveStats {
  total_requests: number;
  pending_approval: number;
  approved_today: number;
  total_budget: number;
  efficiency_improvement: number;
  avg_processing_time: number;
}

interface PendingRequest {
  id: string;
  request_number: string;
  title: string;
  requester: {
    id: string;
    name: string;
    department: string;
    profile_picture?: string;
  };
  total_budget: number;
  travel_start_date: string;
  priority: 'high' | 'medium' | 'low';
  days_pending: number;
}

interface ExecutiveDashboardProps {
  userRole: 'vp' | 'president';
  userName: string;
  userPhoto?: string;
}

export default function ExecutiveDashboard({ 
  userRole, 
  userName, 
  userPhoto 
}: ExecutiveDashboardProps) {
  const [stats, setStats] = useState<ExecutiveStats>({
    total_requests: 0,
    pending_approval: 0,
    approved_today: 0,
    total_budget: 0,
    efficiency_improvement: 0,
    avg_processing_time: 0
  });
  
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const isPresident = userRole === 'president';
  const roleTitle = isPresident ? 'President/COO' : 'Vice President';
  const roleColor = isPresident ? 'purple' : 'indigo';

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats({
        total_requests: 156,
        pending_approval: 8,
        approved_today: 12,
        total_budget: 2450000,
        efficiency_improvement: 34,
        avg_processing_time: 2.3
      });

      setPendingRequests([
        {
          id: '1',
          request_number: 'TO-2025-089',
          title: 'International Conference Attendance',
          requester: {
            id: 'user-1',
            name: 'Dr. Maria Santos',
            department: 'CNAHS',
            profile_picture: undefined
          },
          total_budget: 85000,
          travel_start_date: '2025-11-20',
          priority: 'high',
          days_pending: 2
        },
        {
          id: '2',
          request_number: 'TO-2025-090',
          title: 'Campus Coordination Meeting',
          requester: {
            id: 'user-2',
            name: 'Prof. John Dela Cruz',
            department: 'CCMS',
            profile_picture: undefined
          },
          total_budget: 15000,
          travel_start_date: '2025-11-18',
          priority: 'medium',
          days_pending: 1
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const statCards = [
    {
      title: 'Total Requests',
      value: stats.total_requests.toLocaleString(),
      icon: Activity,
      color: 'blue',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'Pending Approval',
      value: stats.pending_approval.toString(),
      icon: Clock,
      color: 'yellow',
      change: '-8%',
      changeType: 'positive' as const
    },
    {
      title: 'Approved Today',
      value: stats.approved_today.toString(),
      icon: CheckCircle,
      color: 'green',
      change: '+25%',
      changeType: 'positive' as const
    },
    {
      title: 'Total Budget',
      value: `₱${(stats.total_budget / 1000000).toFixed(1)}M`,
      icon: ({ className }: { className?: string } = {}) => <span className={`text-2xl font-bold ${className || ""}`}>₱</span>,
      color: roleColor,
      change: '+18%',
      changeType: 'positive' as const
    }
  ];

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-[#7a0019] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {userName.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Executive Dashboard
                </h1>
                <p className="text-gray-600">
                  Welcome back, {userName} • {roleTitle}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`
                px-3 py-1 rounded-full text-xs font-medium border
                ${isPresident 
                  ? 'bg-purple-100 text-purple-800 border-purple-200' 
                  : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                }
              `}>
                {roleTitle}
              </span>
              {isPresident && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold-100 text-gold-800 border border-gold-200">
                  Final Authority
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <WowCard hoverEffect glowOnHover>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className={`
                          text-xs font-medium
                          ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}
                        `}>
                          {stat.change}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          vs last month
                        </span>
                      </div>
                    </div>
                    <div className={`
                      p-3 rounded-full
                      ${stat.color === 'blue' ? 'bg-blue-100' : ''}
                      ${stat.color === 'yellow' ? 'bg-yellow-100' : ''}
                      ${stat.color === 'green' ? 'bg-green-100' : ''}
                      ${stat.color === 'purple' ? 'bg-purple-100' : ''}
                      ${stat.color === 'indigo' ? 'bg-indigo-100' : ''}
                    `}>
                      <Icon className={`
                        w-6 h-6
                        ${stat.color === 'blue' ? 'text-blue-600' : ''}
                        ${stat.color === 'yellow' ? 'text-yellow-600' : ''}
                        ${stat.color === 'green' ? 'text-green-600' : ''}
                        ${stat.color === 'purple' ? 'text-purple-600' : ''}
                        ${stat.color === 'indigo' ? 'text-indigo-600' : ''}
                      `} />
                    </div>
                  </div>
                </WowCard>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pending Requests */}
          <div className="lg:col-span-2">
            <WowCard>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Pending Executive Approval
                </h2>
                <WowButton variant="outline" size="sm">
                  View All
                </WowButton>
              </div>

              <div className="space-y-4">
                {pendingRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-4 hover:border-[#7a0019] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-gray-900">
                            {request.request_number}
                          </span>
                          <span className={`
                            px-2 py-1 rounded-full text-xs font-medium border
                            ${priorityColors[request.priority]}
                          `}>
                            {request.priority.toUpperCase()}
                          </span>
                        </div>
                        
                        <h3 className="font-medium text-gray-900 mb-2">
                          {request.title}
                        </h3>
                        
                        <PersonDisplay
                          person={request.requester}
                          size="sm"
                          showPosition={false}
                        />
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-bold">₱</span>
                            ₱{request.total_budget.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(request.travel_start_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {request.days_pending} days pending
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <WowButton variant="outline" size="sm">
                          Review
                        </WowButton>
                        <WowButton variant="primary" size="sm">
                          Approve
                        </WowButton>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </WowCard>
          </div>

          {/* Quick Actions & Analytics */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <WowCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <WowButton variant="primary" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4" />
                  View Analytics
                </WowButton>
                <WowButton variant="outline" className="w-full justify-start">
                  <PieChart className="w-4 h-4" />
                  Budget Reports
                </WowButton>
                <WowButton variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4" />
                  Department Overview
                </WowButton>
                {isPresident && (
                  <WowButton variant="secondary" className="w-full justify-start">
                    <AlertCircle className="w-4 h-4" />
                    System Override
                  </WowButton>
                )}
              </div>
            </WowCard>

            {/* Performance Metrics */}
            <WowCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Performance Metrics
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Processing Efficiency</span>
                    <span className="font-medium">{stats.efficiency_improvement}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-green-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.efficiency_improvement}%` }}
                      transition={{ delay: 0.5, duration: 1 }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Avg. Processing Time</span>
                    <span className="font-medium">{stats.avg_processing_time} days</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-blue-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(5 - stats.avg_processing_time) * 20}%` }}
                      transition={{ delay: 0.7, duration: 1 }}
                    />
                  </div>
                </div>
              </div>
            </WowCard>
          </div>
        </div>
      </div>
    </div>
  );
}
