"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Plus, Edit, TrendingUp, TrendingDown, Search, Filter } from 'lucide-react';
import { WowCard, WowButton } from '@/components/common/Modal';
import { formatLongDate } from '@/lib/datetime';

interface DepartmentBudget {
  id: string;
  department_id: string;
  department_name: string;
  department_code?: string;
  fiscal_year: number;
  semester?: string;
  total_allocated: number;
  total_used: number;
  total_pending: number;
  remaining: number;
  created_at: string;
  updated_at: string;
}

export default function ComptrollerBudgetPage() {
  const [budgets, setBudgets] = useState<DepartmentBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [editingBudget, setEditingBudget] = useState<DepartmentBudget | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchBudgets();
  }, [selectedSemester, selectedYear]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/comptroller/budget?year=${selectedYear}&semester=${selectedSemester}`);
      const data = await response.json();
      if (data.ok) {
        setBudgets(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
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

  const getUsagePercentage = (budget: DepartmentBudget) => {
    if (budget.total_allocated === 0) return 0;
    return ((budget.total_used + budget.total_pending) / budget.total_allocated) * 100;
  };

  const getRemainingPercentage = (budget: DepartmentBudget) => {
    if (budget.total_allocated === 0) return 0;
    return (budget.remaining / budget.total_allocated) * 100;
  };

  const getStatusColor = (budget: DepartmentBudget) => {
    const usage = getUsagePercentage(budget);
    if (usage >= 90) return 'text-red-600 bg-red-50';
    if (usage >= 75) return 'text-orange-600 bg-orange-50';
    if (usage >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const filteredBudgets = budgets.filter(budget => {
    const query = searchQuery.toLowerCase();
    return (
      budget.department_name.toLowerCase().includes(query) ||
      budget.department_code?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-[#7a0019] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Department Budget Management</h1>
            <p className="text-gray-600 mt-1">Track and manage budgets for each department</p>
          </div>
          <WowButton variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Budget
          </WowButton>
        </div>

        {/* Filters */}
        <WowCard>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search departments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0019] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fiscal Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0019] focus:border-transparent"
              >
                {[2024, 2025, 2026, 2027].map(year => (
                  <option key={year} value={year}>{year}-{year + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0019] focus:border-transparent"
              >
                <option value="all">All Semesters</option>
                <option value="1st">1st Semester</option>
                <option value="2nd">2nd Semester</option>
              </select>
            </div>
            <div className="flex items-end">
              <WowButton
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSemester('all');
                  setSelectedYear(new Date().getFullYear());
                }}
              >
                <Filter className="w-4 h-4" />
                Reset Filters
              </WowButton>
            </div>
          </div>
        </WowCard>

        {/* Budget Cards */}
        {filteredBudgets.length === 0 ? (
          <WowCard>
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No budgets found</p>
              <p className="text-gray-500 text-sm mt-2">
                {searchQuery ? 'Try adjusting your search filters' : 'Add a budget to get started'}
              </p>
            </div>
          </WowCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBudgets.map((budget) => (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <WowCard className="h-full">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {budget.department_name}
                        </h3>
                        {budget.department_code && (
                          <p className="text-sm text-gray-500">{budget.department_code}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {budget.semester || 'Annual'} • FY {budget.fiscal_year}-{budget.fiscal_year + 1}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingBudget(budget)}
                        className="p-2 text-gray-400 hover:text-[#7a0019] transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Budget Amount */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Total Allocated</span>
                        <span className="text-xl font-bold text-gray-900">
                          {formatCurrency(budget.total_allocated)}
                        </span>
                      </div>
                    </div>

                    {/* Usage Breakdown */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-green-600" />
                          <span className="text-gray-600">Used</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(budget.total_used)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-yellow-600" />
                          <span className="text-gray-600">Pending</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(budget.total_pending)}
                        </span>
                      </div>
                      <div className="border-t pt-3 flex items-center justify-between">
                        <span className="font-semibold text-gray-900">Remaining</span>
                        <span className={`font-bold text-lg ${getStatusColor(budget)} px-3 py-1 rounded-full`}>
                          {formatCurrency(budget.remaining)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Usage: {getUsagePercentage(budget).toFixed(1)}%</span>
                        <span>Remaining: {getRemainingPercentage(budget).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div className="h-full flex">
                          <div
                            className="bg-green-500"
                            style={{ width: `${(budget.total_used / budget.total_allocated) * 100}%` }}
                          />
                          <div
                            className="bg-yellow-500"
                            style={{ width: `${(budget.total_pending / budget.total_allocated) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Last Updated */}
                    <p className="text-xs text-gray-400 text-right">
                      Updated: {formatLongDate(budget.updated_at)}
                    </p>
                  </div>
                </WowCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {filteredBudgets.length > 0 && (
          <WowCard>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Allocated</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(filteredBudgets.reduce((sum, b) => sum + b.total_allocated, 0))}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Used</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(filteredBudgets.reduce((sum, b) => sum + b.total_used, 0))}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {formatCurrency(filteredBudgets.reduce((sum, b) => sum + b.total_pending, 0))}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Remaining</p>
                <p className="text-2xl font-bold text-[#7a0019] mt-1">
                  {formatCurrency(filteredBudgets.reduce((sum, b) => sum + b.remaining, 0))}
                </p>
              </div>
            </div>
          </WowCard>
        )}
      </div>

      {/* Add/Edit Modal - TODO: Implement */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Department Budget</h3>
            <p className="text-gray-600">Modal implementation needed</p>
            <div className="mt-4 flex justify-end gap-3">
              <WowButton variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </WowButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

