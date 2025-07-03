import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, BarChart3, Target } from 'lucide-react';
import { ComplianceMetrics } from '../types';

interface ExecutiveSummaryProps {
  metrics: ComplianceMetrics;
}

export function ExecutiveSummary({ metrics }: ExecutiveSummaryProps) {
  const getComplianceColor = (rate: number) => {
    if (rate >= 95) return 'text-success-600';
    if (rate >= 85) return 'text-warning-600';
    return 'text-error-600';
  };

  const getComplianceBgColor = (rate: number) => {
    if (rate >= 95) return 'bg-success-100';
    if (rate >= 85) return 'bg-warning-100';
    return 'bg-error-100';
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Résumé Exécutif</h2>
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${getComplianceBgColor(metrics.complianceRate)}`}>
          <Target className={`w-5 h-5 ${getComplianceColor(metrics.complianceRate)}`} />
          <span className={`font-semibold ${getComplianceColor(metrics.complianceRate)}`}>
            {metrics.complianceRate.toFixed(1)}% de conformité
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-oxbow-50 to-oxbow-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-oxbow-600">Total Analysé</p>
              <p className="text-2xl font-bold text-oxbow-900">{metrics.total}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-oxbow-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-success-600">Correspondances</p>
              <p className="text-2xl font-bold text-success-900">{metrics.exactMatches}</p>
              <p className="text-xs text-success-600">
                {((metrics.exactMatches / metrics.total) * 100).toFixed(1)}%
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-success-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-error-50 to-error-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-error-600">Erreurs Critiques</p>
              <p className="text-2xl font-bold text-error-900">{metrics.criticalErrors}</p>
              <p className="text-xs text-error-600">
                {((metrics.criticalErrors / metrics.total) * 100).toFixed(1)}%
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-error-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-warning-50 to-warning-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-warning-600">Taux d'Erreur</p>
              <p className="text-2xl font-bold text-warning-900">{metrics.errorRate.toFixed(1)}%</p>
              <div className="flex items-center space-x-1">
                {metrics.errorRate > 10 ? (
                  <TrendingUp className="w-3 h-3 text-error-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-success-500" />
                )}
                <p className="text-xs text-warning-600">vs objectif 5%</p>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              metrics.errorRate > 10 ? 'bg-error-200' : 'bg-success-200'
            }`}>
              {metrics.errorRate > 10 ? (
                <TrendingUp className="w-5 h-5 text-error-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-success-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Répartition des Erreurs</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">PDF uniquement</span>
              <span className="font-medium text-error-600">{metrics.pdfOnly}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Excel uniquement</span>
              <span className="font-medium text-warning-600">{metrics.excelOnly}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Prix différents</span>
              <span className="font-medium text-oxbow-600">{metrics.priceMismatches}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Indicateurs Qualité</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Conformité</span>
              <span className={`font-medium ${getComplianceColor(metrics.complianceRate)}`}>
                {metrics.complianceRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Écart prix moyen</span>
              <span className="font-medium text-gray-900">
                {metrics.averagePriceDifference.toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Fiabilité données</span>
              <span className={`font-medium ${
                metrics.errorRate < 5 ? 'text-success-600' : 
                metrics.errorRate < 15 ? 'text-warning-600' : 'text-error-600'
              }`}>
                {metrics.errorRate < 5 ? 'Excellente' : 
                 metrics.errorRate < 15 ? 'Bonne' : 'À améliorer'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Recommandations</h4>
          <div className="space-y-2 text-sm text-gray-600">
            {metrics.complianceRate < 95 && (
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-warning-500 mt-0.5" />
                <span>Améliorer la synchronisation des données</span>
              </div>
            )}
            {metrics.criticalErrors > 0 && (
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-error-500 mt-0.5" />
                <span>Traiter les erreurs critiques en priorité</span>
              </div>
            )}
            {metrics.errorRate < 5 && (
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5" />
                <span>Qualité des données excellente</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}