// src/components/user/dashboard/AIInsights.ui.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Lightbulb, BarChart3, Loader2 } from "lucide-react";

interface Insight {
  summary: string;
  trends: string[];
  recommendations: string[];
  keyMetrics: Record<string, string>;
  aiEnabled?: boolean;
}

interface Props {
  insights: Insight | null;
  loading?: boolean;
  className?: string;
}

export default function AIInsights({ insights, loading = false, className = "" }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 p-6 shadow-sm ring-1 ring-purple-100 ${className}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100">
            <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">AI Insights</h3>
            <p className="text-xs text-gray-500">Analyzing your data...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!insights) {
    return null;
  }

  // Don't show if AI is not enabled (just fallback message)
  if (!insights.aiEnabled) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 p-6 shadow-sm ring-1 ring-purple-100 ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              AI-Powered Insights
              {insights.aiEnabled && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                  Powered by Gemini
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500">Smart analytics for your requests</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-purple-600 hover:text-purple-700 font-medium"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      </div>

      {/* Summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 leading-relaxed">{insights.summary}</p>
      </div>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4 pt-4 border-t border-purple-200"
        >
          {/* Trends */}
          {insights.trends && insights.trends.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <h4 className="text-xs font-semibold text-gray-900">Key Trends</h4>
              </div>
              <ul className="space-y-1">
                {insights.trends.map((trend, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span>{trend}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {insights.recommendations && insights.recommendations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                <h4 className="text-xs font-semibold text-gray-900">Recommendations</h4>
              </div>
              <ul className="space-y-1">
                {insights.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Metrics */}
          {insights.keyMetrics && Object.keys(insights.keyMetrics).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <h4 className="text-xs font-semibold text-gray-900">Key Metrics</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(insights.keyMetrics).map(([key, value]) => (
                  <div key={key} className="bg-white/60 rounded-lg p-2">
                    <div className="text-xs font-medium text-gray-900">{key}</div>
                    <div className="text-xs text-gray-600">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

