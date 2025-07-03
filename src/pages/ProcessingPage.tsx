import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ProgressBar } from '../components/ProgressBar';
import { LoadingDots } from '../components/LoadingSpinner';
import { useApp } from '../contexts/AppContext';
import { extractBarcodesFromPdf } from '../utils/pdfProcessor';
import { compareData } from '../utils/comparisonEngine';
import { filterExcelBySupplier } from '../utils/supplierDetection';

export function ProcessingPage() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    const processFiles = async () => {
      if (!state.pdfFile || !state.excelFile || !state.selectedSupplier) return;

      dispatch({ type: 'SET_PROCESSING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        // Step 1: Extract barcodes from PDF
        dispatch({ type: 'SET_MESSAGE', payload: 'Extraction des codes-barres du PDF...' });
        dispatch({ type: 'SET_PROGRESS', payload: 10 });
        
        const { barcodes: pdfBarcodes } = await extractBarcodesFromPdf(state.pdfFile);
        dispatch({ type: 'SET_PROGRESS', payload: 40 });

        // Step 2: Filter Excel data
        dispatch({ type: 'SET_MESSAGE', payload: `Filtrage des données pour ${state.selectedSupplier.name}...` });
        const filteredExcelData = filterExcelBySupplier(state.barcodes, state.selectedSupplier);
        dispatch({ type: 'SET_PROGRESS', payload: 70 });

        // Step 3: Compare data
        dispatch({ type: 'SET_MESSAGE', payload: 'Comparaison PDF → Excel...' });
        const results = compareData(pdfBarcodes, filteredExcelData);
        dispatch({ type: 'SET_PROGRESS', payload: 90 });

        // Step 4: Finalize
        dispatch({ type: 'SET_BARCODES', payload: [...pdfBarcodes, ...filteredExcelData] });
        dispatch({ type: 'SET_RESULTS', payload: results });
        dispatch({ type: 'SET_PDF_COUNT', payload: pdfBarcodes.length });
        dispatch({ type: 'SET_PROGRESS', payload: 100 });
        dispatch({ type: 'SET_MESSAGE', payload: `Analyse terminée pour ${state.selectedSupplier.name} !` });

        const matchCount = results.filter(r => r.status === 'exact_match').length;
        const conformityRate = pdfBarcodes.length > 0 ? ((matchCount / pdfBarcodes.length) * 100).toFixed(1) : '0';
        
        toast.success(`Analyse terminée ! Conformité: ${conformityRate}%`);

        setTimeout(() => {
          dispatch({ type: 'SET_STEP', payload: 'results' });
          dispatch({ type: 'SET_PROCESSING', payload: false });
        }, 1500);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        dispatch({ type: 'SET_PROCESSING', payload: false });
        toast.error(`Erreur: ${errorMessage}`);
      }
    };

    processFiles();
  }, [state.pdfFile, state.excelFile, state.selectedSupplier, dispatch]);

  const processingSteps = [
    { id: 1, label: 'Extraction des codes-barres du PDF', threshold: 10 },
    { id: 2, label: `Filtrage des données ${state.selectedSupplier?.name || 'fournisseur'}`, threshold: 40 },
    { id: 3, label: 'Comparaison PDF → Excel', threshold: 70 },
    { id: 4, label: 'Génération du rapport de conformité', threshold: 100 },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-card p-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <motion.h2 
            className="text-2xl font-bold text-gray-900 dark:text-white mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Traitement en cours
            <LoadingDots className="inline-flex ml-2" />
          </motion.h2>
          <motion.p 
            className="text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Analyse ciblée pour <strong>{state.selectedSupplier?.name}</strong>
          </motion.p>
        </div>

        {/* Supplier Info */}
        {state.selectedSupplier && (
          <motion.div 
            className="bg-oxbow-50 dark:bg-oxbow-900/20 rounded-lg p-4 mb-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-oxbow-900 dark:text-oxbow-100">
                  🏢 {state.selectedSupplier.name}
                </h3>
                <p className="text-sm text-oxbow-700 dark:text-oxbow-300">
                  {state.selectedSupplier.productCount} produits dans la base
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-oxbow-600 dark:text-oxbow-400">
                  Confiance: {(state.selectedSupplier.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <ProgressBar 
            progress={state.progress} 
            message={state.message}
          />

          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Étapes du traitement :</h3>
            <div className="space-y-3">
              {processingSteps.map((step, index) => (
                <motion.div 
                  key={step.id}
                  className={`flex items-center space-x-3 transition-colors duration-300 ${
                    state.progress >= step.threshold 
                      ? 'text-oxbow-600 dark:text-oxbow-400' 
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 + index * 0.1 }}
                >
                  <motion.div 
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      state.progress >= step.threshold 
                        ? 'bg-oxbow-500' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    animate={state.progress >= step.threshold ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  />
                  <span>{step.label}</span>
                  {state.progress >= step.threshold && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-success-500"
                    >
                      ✓
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {state.error && (
            <motion.div 
              className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p className="text-error-600 dark:text-error-400 text-sm">{state.error}</p>
              <button
                onClick={() => {
                  dispatch({ type: 'SET_STEP', payload: 'supplier-validation' });
                  dispatch({ type: 'SET_ERROR', payload: null });
                }}
                className="mt-2 text-sm text-error-600 dark:text-error-400 underline hover:no-underline"
              >
                Retour à la sélection du fournisseur
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}