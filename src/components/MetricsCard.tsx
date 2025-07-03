import React from 'react';
import { CheckCircle2, AlertTriangle, BarChart3, TrendingUp } from 'lucide-react';

interface MetricsCardProps {
  total: number;
  matches: number;
  discrepancies: number;
  matchRate: number;
}

export function MetricsCard({ total, matches, discrepancies, matchRate }: MetricsCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total</p>
            <p className="text-3xl font-bold text-gray-900">{total}</p>
          </div>
          <div className="w-12 h-12 bg-oxbow-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-oxbow-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Concordants</p>
            <p className="text-3xl font-bold text-success-600">{matches}</p>
          </div>
          <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-success-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Écarts</p>
            <p className="text-3xl font-bold text-warning-600">{discrepancies}</p>
          </div>
          <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-warning-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Taux de concordance</p>
            <p className="text-3xl font-bold text-oxbow-600">{matchRate.toFixed(1)}%</p>
          </div>
          <div className="w-12 h-12 bg-oxbow-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-oxbow-500" />
          </div>
        </div>
      </div>
    </div>
  );
}