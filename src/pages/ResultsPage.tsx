import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Building2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { ExecutiveSummary } from '../components/ExecutiveSummary';
import { InteractiveComplianceChart } from '../components/InteractiveComplianceChart';
import { FilterableResultsTable } from '../components/FilterableResultsTable';
import { MissingCodesSection } from '../components/MissingCodesSection';
import { calculateComplianceMetrics } from '../utils/comparisonEngine';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';

export function ResultsPage() {
  const { state, dispatch } = useApp();
  
  const pdfCodeCount = state.pdfCodeCount || state.results.filter(r => r.pdfData).length;
  const metrics = calculateComplianceMetrics(state.results, state.selectedSupplier?.name, pdfCodeCount);
  
  // 🎯 ISOLATION DES CODES PDF NON TROUVÉS
  const nonMatchResults = state.results.filter(r => r.status === 'pdf_only');

  const handleStartOver = () => {
    dispatch({ type: 'RESET' });
  };

  const handleExportExcel = () => {
    exportToExcel(state.results, metrics);
  };

  const handleExportPdf = () => {
    exportToPdf(state.results, metrics);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Rapport de Vérification Oxbow
          </h2>
          <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
            <Building2 className="w-5 h-5" />
            <span>
              Fournisseur: <strong>{state.selectedSupplier?.name || 'Non spécifié'}</strong>
            </span>
            <span>•</span>
            <span>
              {pdfCodeCount} codes PDF • {metrics.complianceRate.toFixed(1)}% de conformité
            </span>
            {state.detectedFormat && (
              <>
                <span>•</span>
                <span className="px-2 py-1 bg-oxbow-100 dark:bg-oxbow-900/30 text-oxbow-700 dark:text-oxbow-300 rounded text-sm font-medium">
                  Format {state.detectedFormat}
                </span>
              </>
            )}
          </div>
        </motion.div>
        
        <motion.button
          onClick={handleStartOver}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Nouvelle vérification</span>
        </motion.button>
      </div>

      {/* Supplier Summary */}
      {state.selectedSupplier && (
        <motion.div 
          className="bg-oxbow-50 dark:bg-oxbow-900/20 border border-oxbow-200 dark:border-oxbow-800 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-oxbow-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-oxbow-900 dark:text-oxbow-100">
                  {state.selectedSupplier.name}
                </h3>
                <p className="text-sm text-oxbow-700 dark:text-oxbow-300">
                  Analyse ciblée sur {state.selectedSupplier.productCount} produits de ce fournisseur
                  {state.detectedFormat === 'SS26' && ' • Format enrichi SS26'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-oxbow-600 dark:text-oxbow-400">
                Confiance de détection
              </div>
              <div className="text-2xl font-bold text-oxbow-900 dark:text-oxbow-100">
                {(state.selectedSupplier.confidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          
          {state.selectedSupplier.detectedReferences.length > 0 && (
            <div className="mt-4 pt-4 border-t border-oxbow-200 dark:border-oxbow-700">
              <p className="text-sm text-oxbow-700 dark:text-oxbow-300 mb-2">
                Références détectées dans le PDF :
              </p>
              <div className="flex flex-wrap gap-2">
                {state.selectedSupplier.detectedReferences.slice(0, 5).map((ref, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-oxbow-100 dark:bg-oxbow-800 text-oxbow-800 dark:text-oxbow-200 text-xs rounded font-mono"
                  >
                    {ref}
                  </span>
                ))}
                {state.selectedSupplier.detectedReferences.length > 5 && (
                  <span className="px-2 py-1 bg-oxbow-100 dark:bg-oxbow-800 text-oxbow-600 dark:text-oxbow-400 text-xs rounded">
                    +{state.selectedSupplier.detectedReferences.length - 5} autres
                  </span>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 🆕 SECTION DÉDIÉE AUX CODES MANQUANTS */}
      {nonMatchResults.length > 0 && state.selectedSupplier && (
        <MissingCodesSection 
          missingResults={nonMatchResults}
          supplierName={state.selectedSupplier.name}
          totalPdfCodes={pdfCodeCount}
          allResults={state.results}
        />
      )}

      <ExecutiveSummary metrics={metrics} />
      
      <InteractiveComplianceChart metrics={metrics} results={state.results} />

      <FilterableResultsTable
        results={state.results}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
      />
    </div>
  );
}