import React, { useState, useMemo } from 'react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  Maximize2,
  Filter,
  Palette,
  Building2,
  Euro,
  PoundSterling
} from 'lucide-react';
import { ComplianceMetrics, ComparisonResult } from '../types';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title
);

interface InteractiveComplianceChartProps {
  metrics: ComplianceMetrics;
  results: ComparisonResult[];
}

type ChartType = 'overview' | 'colors' | 'sizes' | 'suppliers' | 'prices' | 'trends';

export function InteractiveComplianceChart({ metrics, results }: InteractiveComplianceChartProps) {
  const [activeChart, setActiveChart] = useState<ChartType>('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 📊 DONNÉES POUR GRAPHIQUES SS26
  const chartData = useMemo(() => {
    const excelData = results.map(r => r.excelData).filter(Boolean);
    
    return {
      overview: {
        labels: ['Correspondances exactes', 'PDF uniquement', 'Excel uniquement', 'Prix différents'],
        datasets: [{
          data: [metrics.exactMatches, metrics.pdfOnly, metrics.excelOnly, metrics.priceMismatches],
          backgroundColor: ['#22c55e', '#ef4444', '#f59e0b', '#2B5CE6'],
          borderColor: ['#16a34a', '#dc2626', '#d97706', '#1d4ed8'],
          borderWidth: 2,
        }]
      },
      
      colors: metrics.colorDistribution ? {
        labels: Object.keys(metrics.colorDistribution),
        datasets: [{
          label: 'Produits par couleur',
          data: Object.values(metrics.colorDistribution),
          backgroundColor: [
            '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', 
            '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#84cc16'
          ],
          borderWidth: 1,
        }]
      } : null,
      
      sizes: metrics.sizeDistribution ? {
        labels: Object.keys(metrics.sizeDistribution),
        datasets: [{
          label: 'Produits par taille',
          data: Object.values(metrics.sizeDistribution),
          backgroundColor: '#3b82f6',
          borderColor: '#1d4ed8',
          borderWidth: 1,
        }]
      } : null,
      
      suppliers: metrics.supplierDistribution ? {
        labels: Object.keys(metrics.supplierDistribution),
        datasets: [{
          label: 'Produits par fournisseur',
          data: Object.values(metrics.supplierDistribution),
          backgroundColor: [
            '#2B5CE6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
          ],
          borderWidth: 1,
        }]
      } : null,
      
      prices: metrics.currencyAnalysis ? {
        labels: ['Prix EUR', 'Prix GBP'],
        datasets: [{
          label: 'Nombre de produits',
          data: [metrics.currencyAnalysis.eurCount, metrics.currencyAnalysis.gbpCount],
          backgroundColor: ['#2B5CE6', '#22c55e'],
          borderColor: ['#1d4ed8', '#16a34a'],
          borderWidth: 2,
        }]
      } : null,
      
      trends: {
        labels: ['Conformité', 'Erreurs', 'Critiques'],
        datasets: [{
          label: 'Pourcentage',
          data: [
            metrics.complianceRate,
            metrics.errorRate,
            (metrics.criticalErrors / metrics.total) * 100,
          ],
          backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(245, 158, 11, 0.8)'],
          borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)', 'rgb(245, 158, 11)'],
          borderWidth: 1,
        }]
      }
    };
  }, [metrics, results]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#2B5CE6',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            if (activeChart === 'overview') {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
            return `${context.label}: ${context.parsed}`;
          },
        },
      },
    },
    scales: activeChart === 'trends' || activeChart === 'sizes' || activeChart === 'suppliers' ? {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return activeChart === 'trends' ? value + '%' : value;
          },
        },
      },
    } : undefined,
  };

  const chartTabs = [
    { 
      id: 'overview' as ChartType, 
      label: 'Vue d\'ensemble', 
      icon: PieChart,
      description: 'Répartition globale des résultats'
    },
    { 
      id: 'colors' as ChartType, 
      label: 'Couleurs', 
      icon: Palette,
      description: 'Distribution par couleur',
      available: !!metrics.colorDistribution && Object.keys(metrics.colorDistribution).length > 0
    },
    { 
      id: 'sizes' as ChartType, 
      label: 'Tailles', 
      icon: Filter,
      description: 'Distribution par taille',
      available: !!metrics.sizeDistribution && Object.keys(metrics.sizeDistribution).length > 0
    },
    { 
      id: 'suppliers' as ChartType, 
      label: 'Fournisseurs', 
      icon: Building2,
      description: 'Distribution par fournisseur',
      available: !!metrics.supplierDistribution && Object.keys(metrics.supplierDistribution).length > 0
    },
    { 
      id: 'prices' as ChartType, 
      label: 'Devises', 
      icon: Euro,
      description: 'Répartition EUR/GBP',
      available: !!metrics.currencyAnalysis && (metrics.currencyAnalysis.eurCount > 0 || metrics.currencyAnalysis.gbpCount > 0)
    },
    { 
      id: 'trends' as ChartType, 
      label: 'Performance', 
      icon: TrendingUp,
      description: 'Indicateurs de performance'
    }
  ].filter(tab => tab.available !== false);

  const renderChart = () => {
    const data = chartData[activeChart];
    if (!data) return null;

    switch (activeChart) {
      case 'overview':
        return <Doughnut data={data} options={chartOptions} />;
      case 'colors':
        return <Doughnut data={data} options={chartOptions} />;
      case 'prices':
        return <Doughnut data={data} options={chartOptions} />;
      case 'sizes':
      case 'suppliers':
      case 'trends':
        return <Bar data={data} options={chartOptions} />;
      default:
        return null;
    }
  };

  const getStatsForActiveChart = () => {
    switch (activeChart) {
      case 'overview':
        return [
          { label: 'Taux de correspondance', value: `${((metrics.exactMatches / metrics.total) * 100).toFixed(1)}%`, color: 'success' },
          { label: 'Taux d\'erreur global', value: `${metrics.errorRate.toFixed(1)}%`, color: 'warning' },
          { label: 'Écart prix moyen', value: `${metrics.averagePriceDifference.toFixed(2)}€`, color: 'oxbow' }
        ];
      case 'colors':
        const topColor = metrics.colorDistribution ? 
          Object.entries(metrics.colorDistribution).sort(([,a], [,b]) => b - a)[0] : null;
        return topColor ? [
          { label: 'Couleur principale', value: topColor[0], color: 'oxbow' },
          { label: 'Nombre de produits', value: topColor[1].toString(), color: 'success' },
          { label: 'Couleurs différentes', value: Object.keys(metrics.colorDistribution!).length.toString(), color: 'warning' }
        ] : [];
      case 'sizes':
        const topSize = metrics.sizeDistribution ? 
          Object.entries(metrics.sizeDistribution).sort(([,a], [,b]) => b - a)[0] : null;
        return topSize ? [
          { label: 'Taille principale', value: topSize[0], color: 'oxbow' },
          { label: 'Nombre de produits', value: topSize[1].toString(), color: 'success' },
          { label: 'Tailles différentes', value: Object.keys(metrics.sizeDistribution!).length.toString(), color: 'warning' }
        ] : [];
      case 'suppliers':
        const topSupplier = metrics.supplierDistribution ? 
          Object.entries(metrics.supplierDistribution).sort(([,a], [,b]) => b - a)[0] : null;
        return topSupplier ? [
          { label: 'Fournisseur principal', value: topSupplier[0], color: 'oxbow' },
          { label: 'Nombre de produits', value: topSupplier[1].toString(), color: 'success' },
          { label: 'Fournisseurs total', value: Object.keys(metrics.supplierDistribution!).length.toString(), color: 'warning' }
        ] : [];
      case 'prices':
        return metrics.currencyAnalysis ? [
          { label: 'Produits EUR', value: metrics.currencyAnalysis.eurCount.toString(), color: 'oxbow' },
          { label: 'Produits GBP', value: metrics.currencyAnalysis.gbpCount.toString(), color: 'success' },
          { label: 'Prix moyen EUR', value: metrics.currencyAnalysis.averagePriceEur ? `${metrics.currencyAnalysis.averagePriceEur.toFixed(2)}€` : 'N/A', color: 'warning' }
        ] : [];
      case 'trends':
        return [
          { label: 'Conformité', value: `${metrics.complianceRate.toFixed(1)}%`, color: 'success' },
          { label: 'Erreurs', value: `${metrics.errorRate.toFixed(1)}%`, color: 'warning' },
          { label: 'Critiques', value: `${((metrics.criticalErrors / metrics.total) * 100).toFixed(1)}%`, color: 'error' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-card overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-600 bg-gradient-to-r from-oxbow-50 to-blue-50 dark:from-oxbow-900/20 dark:to-blue-900/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              📊 Analyse Graphique Interactive
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {chartTabs.find(tab => tab.id === activeChart)?.description}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
              title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            
            <button
              className="p-2 rounded-lg bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
              title="Télécharger le graphique"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation des onglets */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-600">
        <div className="flex flex-wrap gap-2">
          {chartTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveChart(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeChart === tab.id
                  ? 'bg-oxbow-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Graphique */}
          <div className="lg:col-span-2">
            <div className={`${isFullscreen ? 'h-96' : 'h-80'}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeChart}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {renderChart()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          
          {/* Statistiques */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              📈 Statistiques Clés
            </h4>
            
            <div className="space-y-3">
              {getStatsForActiveChart().map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg ${
                    stat.color === 'success' ? 'bg-success-50 dark:bg-success-900/20' :
                    stat.color === 'warning' ? 'bg-warning-50 dark:bg-warning-900/20' :
                    stat.color === 'error' ? 'bg-error-50 dark:bg-error-900/20' :
                    'bg-oxbow-50 dark:bg-oxbow-900/20'
                  }`}
                >
                  <div className={`text-2xl font-bold ${
                    stat.color === 'success' ? 'text-success-600' :
                    stat.color === 'warning' ? 'text-warning-600' :
                    stat.color === 'error' ? 'text-error-600' :
                    'text-oxbow-600'
                  }`}>
                    {stat.value}
                  </div>
                  <div className={`text-sm ${
                    stat.color === 'success' ? 'text-success-700 dark:text-success-300' :
                    stat.color === 'warning' ? 'text-warning-700 dark:text-warning-300' :
                    stat.color === 'error' ? 'text-error-700 dark:text-error-300' :
                    'text-oxbow-700 dark:text-oxbow-300'
                  }`}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Insights SS26 */}
            {metrics.formatDetected === 'SS26' && (
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h5 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  🎨 Insights SS26
                </h5>
                <div className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                  {metrics.colorDistribution && Object.keys(metrics.colorDistribution).length > 5 && (
                    <p>• Large gamme de couleurs ({Object.keys(metrics.colorDistribution).length} couleurs)</p>
                  )}
                  {metrics.currencyAnalysis && metrics.currencyAnalysis.eurCount > 0 && metrics.currencyAnalysis.gbpCount > 0 && (
                    <p>• Catalogue multi-devises (EUR/GBP)</p>
                  )}
                  {metrics.sizeDistribution && Object.keys(metrics.sizeDistribution).length > 3 && (
                    <p>• Gamme de tailles étendue ({Object.keys(metrics.sizeDistribution).length} tailles)</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}