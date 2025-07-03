import React from 'react';
import { X, Package, FileText, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { ComparisonResult } from '../types';

interface ResultDetailModalProps {
  result: ComparisonResult;
  onClose: () => void;
}

export function ResultDetailModal({ result, onClose }: ResultDetailModalProps) {
  const getStatusColor = (status: ComparisonResult['status']) => {
    switch (status) {
      case 'exact_match': return 'text-success-600 bg-success-100';
      case 'pdf_only': return 'text-error-600 bg-error-100';
      case 'excel_only': return 'text-warning-600 bg-warning-100';
      case 'price_mismatch': return 'text-oxbow-600 bg-oxbow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: ComparisonResult['status']) => {
    switch (status) {
      case 'exact_match': return <CheckCircle2 className="w-5 h-5" />;
      case 'pdf_only': 
      case 'excel_only': return <AlertTriangle className="w-5 h-5" />;
      case 'price_mismatch': return <Info className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status: ComparisonResult['status']) => {
    switch (status) {
      case 'exact_match': return 'Correspondance exacte';
      case 'pdf_only': return 'Présent uniquement dans le PDF';
      case 'excel_only': return 'Présent uniquement dans Excel';
      case 'price_mismatch': return 'Différence de prix détectée';
      default: return 'Statut inconnu';
    }
  };

  const getSeverityColor = (severity: ComparisonResult['severity']) => {
    switch (severity) {
      case 'high': return 'text-error-600 bg-error-100';
      case 'medium': return 'text-warning-600 bg-warning-100';
      case 'low': return 'text-success-600 bg-success-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-oxbow-500" />
            <h2 className="text-xl font-bold text-gray-900">Détail du Code-Barres</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Barcode Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Informations du Code-Barres</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Code-barres original</label>
                <p className="text-lg font-mono text-gray-900">{result.barcode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Code-barres normalisé</label>
                <p className="text-lg font-mono text-gray-900">{result.normalizedBarcode}</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Statut de Vérification</h3>
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${getStatusColor(result.status)}`}>
                {getStatusIcon(result.status)}
                <span className="font-medium">{getStatusLabel(result.status)}</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(result.severity)}`}>
                Sévérité: {result.severity === 'high' ? 'Élevée' : result.severity === 'medium' ? 'Moyenne' : 'Faible'}
              </div>
            </div>
            {result.discrepancy && (
              <div className="mt-3 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <p className="text-sm text-warning-800">{result.discrepancy}</p>
              </div>
            )}
          </div>

          {/* Source Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PDF Data */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="w-5 h-5 text-error-500" />
                <h3 className="font-semibold text-gray-900">Données PDF</h3>
              </div>
              {result.pdfData ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-success-500" />
                    <span className="text-sm text-success-600">Présent dans le PDF</span>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Code-barres brut</label>
                    <p className="text-sm font-mono text-gray-900">{result.pdfData.rawBarcode || result.pdfData.barcode}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <X className="w-4 h-4 text-error-500" />
                  <span className="text-sm text-error-600">Absent du PDF</span>
                </div>
              )}
            </div>

            {/* Excel Data */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Package className="w-5 h-5 text-success-500" />
                <h3 className="font-semibold text-gray-900">Données Excel</h3>
              </div>
              {result.excelData ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-success-500" />
                    <span className="text-sm text-success-600">Présent dans Excel</span>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Code-barres brut</label>
                    <p className="text-sm font-mono text-gray-900">{result.excelData.rawBarcode || result.excelData.barcode}</p>
                  </div>
                  {result.excelData.price !== undefined && (
                    <div>
                      <label className="text-xs font-medium text-gray-600">Prix</label>
                      <p className="text-lg font-bold text-oxbow-600">{result.excelData.price.toFixed(2)} €</p>
                    </div>
                  )}
                  {result.excelData.description && (
                    <div>
                      <label className="text-xs font-medium text-gray-600">Description</label>
                      <p className="text-sm text-gray-900">{result.excelData.description}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <X className="w-4 h-4 text-error-500" />
                  <span className="text-sm text-error-600">Absent d'Excel</span>
                </div>
              )}
            </div>
          </div>

          {/* Price Analysis */}
          {result.priceDifference !== undefined && (
            <div className="bg-oxbow-50 border border-oxbow-200 rounded-lg p-4">
              <h3 className="font-semibold text-oxbow-900 mb-2">Analyse des Prix</h3>
              <div className="flex items-center space-x-4">
                <div>
                  <label className="text-xs font-medium text-oxbow-600">Différence détectée</label>
                  <p className="text-lg font-bold text-oxbow-900">
                    {result.priceDifference > 0 ? '+' : ''}{result.priceDifference.toFixed(2)} €
                  </p>
                </div>
                <div className="text-sm text-oxbow-700">
                  {Math.abs(result.priceDifference) > 1 ? 'Écart significatif' : 'Écart mineur'}
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Recommandations</h3>
            <div className="text-sm text-blue-800 space-y-1">
              {result.status === 'pdf_only' && (
                <p>• Ajouter ce code-barres au fichier Excel avec les informations de prix</p>
              )}
              {result.status === 'excel_only' && (
                <p>• Vérifier si ce produit doit apparaître sur les étiquettes PDF</p>
              )}
              {result.status === 'price_mismatch' && (
                <p>• Vérifier et corriger les informations de prix dans le système</p>
              )}
              {result.severity === 'high' && (
                <p>• Traiter cette erreur en priorité pour maintenir la cohérence des données</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-oxbow-500 text-white rounded-lg hover:bg-oxbow-600 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}