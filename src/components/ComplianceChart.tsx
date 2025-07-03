import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { ComplianceMetrics } from '../types';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface ComplianceChartProps {
  metrics: ComplianceMetrics;
}

export function ComplianceChart({ metrics }: ComplianceChartProps) {
  const doughnutData = {
    labels: ['Correspondances exactes', 'PDF uniquement', 'Excel uniquement', 'Prix différents'],
    datasets: [
      {
        data: [metrics.exactMatches, metrics.pdfOnly, metrics.excelOnly, metrics.priceMismatches],
        backgroundColor: [
          '#22c55e', // success
          '#ef4444', // error
          '#f59e0b', // warning
          '#2B5CE6', // oxbow
        ],
        borderColor: [
          '#16a34a',
          '#dc2626',
          '#d97706',
          '#1d4ed8',
        ],
        borderWidth: 2,
      },
    ],
  };

  const barData = {
    labels: ['Conformité', 'Erreurs', 'Critiques'],
    datasets: [
      {
        label: 'Pourcentage',
        data: [
          metrics.complianceRate,
          metrics.errorRate,
          (metrics.criticalErrors / metrics.total) * 100,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-6 mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Analyse Graphique</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            Répartition des Codes-Barres
          </h4>
          <div className="h-64">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
        
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            Indicateurs de Performance
          </h4>
          <div className="h-64">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-success-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-success-600">
            {((metrics.exactMatches / metrics.total) * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-success-700">Taux de correspondance</div>
        </div>
        
        <div className="bg-warning-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-warning-600">
            {metrics.errorRate.toFixed(1)}%
          </div>
          <div className="text-sm text-warning-700">Taux d'erreur global</div>
        </div>
        
        <div className="bg-oxbow-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-oxbow-600">
            {metrics.averagePriceDifference.toFixed(2)}€
          </div>
          <div className="text-sm text-oxbow-700">Écart prix moyen</div>
        </div>
      </div>
    </div>
  );
}