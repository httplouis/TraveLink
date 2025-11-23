"use client";

import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Info } from 'lucide-react';
import { WowCard } from '@/components/common/Modal';
import { formatLongDate } from '@/lib/datetime';

interface BudgetData {
  department_id: string;
  department_name: string;
  fiscal_year: number;
  semester?: string;
  total_allocated: number;
  total_used: number;
  total_pending: number;
  remaining: number;
}

interface BudgetDisplayProps {
  departmentId?: string;
  className?: string;
}

export default function BudgetDisplay({ departmentId, className = '' }: BudgetDisplayProps) {
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (departmentId) {
      fetchBudget();
    } else {
      fetchUserBudget();
    }
  }, [departmentId]);

  const fetchUserBudget = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/budget');
      const data = await response.json();
      if (data.ok) {
        setBudget(data.data);
      }
    } catch (error) {
      console.error('Error fetching user budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/budget?department_id=${departmentId}`);
      const data = await response.json();
      if (data.ok) {
        setBudget(data.data);
      }
    } catch (error) {
      console.error('Error fetching budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getUsagePercentage = () => {
    if (!budget || budget.total_allocated === 0) return 0;
    return ((budget.total_used + budget.total_pending) / budget.total_allocated) * 100;
  };

  const getStatusColor = () => {
    const usage = getUsagePercentage();
    if (usage >= 90) return 'text-red-600';
    if (usage >= 75) return 'text-orange-600';
    if (usage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusMessage = () => {
    const usage = getUsagePercentage();
    if (usage >= 90) return 'Budget nearly exhausted';
    if (usage >= 75) return 'Budget running low';
    if (usage >= 50) return 'Budget in good standing';
    return 'Budget available';
  };

  if (loading) {
    return (
      <WowCard className={className}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </WowCard>
    );
  }

  if (!budget) {
    return (
      <WowCard className={className}>
        <div className="text-center py-4">
          <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Budget information not available</p>
        </div>
      </WowCard>
    );
  }

  return (
    <WowCard className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-600">Department Budget</h3>
            <p className="text-xs text-gray-500 mt-1">
              {budget.semester || 'Annual'} • FY {budget.fiscal_year}-{budget.fiscal_year + 1}
            </p>
          </div>
          <span className="text-3xl font-bold text-[#7a0019]">₱</span>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Remaining Budget</span>
              <span className={`text-2xl font-bold ${getStatusColor()}`}>
                {formatCurrency(budget.remaining)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  getUsagePercentage() >= 90 ? 'bg-red-500' :
                  getUsagePercentage() >= 75 ? 'bg-orange-500' :
                  getUsagePercentage() >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${100 - getUsagePercentage()}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {getUsagePercentage().toFixed(1)}% used • {getStatusMessage()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500">Used</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(budget.total_used)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-sm font-semibold text-yellow-600">
                {formatCurrency(budget.total_pending)}
              </p>
            </div>
          </div>

          {getUsagePercentage() >= 75 && (
            <div className={`p-3 rounded-lg flex items-start gap-2 ${
              getUsagePercentage() >= 90 ? 'bg-red-50 border border-red-200' :
              'bg-orange-50 border border-orange-200'
            }`}>
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                getUsagePercentage() >= 90 ? 'text-red-600' : 'text-orange-600'
              }`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  getUsagePercentage() >= 90 ? 'text-red-900' : 'text-orange-900'
                }`}>
                  {getUsagePercentage() >= 90 ? 'Warning' : 'Notice'}
                </p>
                <p className={`text-xs mt-1 ${
                  getUsagePercentage() >= 90 ? 'text-red-700' : 'text-orange-700'
                }`}>
                  {getUsagePercentage() >= 90
                    ? 'Budget is nearly exhausted. Please coordinate with Comptroller for additional funds.'
                    : 'Budget is running low. Consider planning requests carefully.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </WowCard>
  );
}

