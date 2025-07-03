import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, AlertCircle, Info, Bug } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUploadZone } from '../components/FileUploadZone';
import { DebugPanel } from '../components/DebugPanel';
import { useApp } from '../contexts/AppContext';
import { validatePdfFile, validateExcelFile } from '../utils/fileValidation';
import { ValidationError } from '../types';
import { extractBarcodesFromPdf } from '../utils/pdfProcessor';
import { extractDataFromExcel, extractDataFromExcelWithDebug } from '../utils/excelProcessor';
import { identifySupplier, getAvailableSuppliers } from '../utils/supplierDetection';

export function UploadPage() {
  const { state, dispatch } = useApp();
  const [pdfErrors, setPdfErrors] = useState<ValidationError[]>([]);
  const [excelErrors, setExcelErrors] = useState<ValidationError[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  const handlePdfFile = (file: File) => {
    const errors = validatePdfFile(file);
    setPdfErrors(errors);
    
    if (errors.length === 0) {
      dispatch({ type: 'SET_FILES', payload: { pdfFile: file, excelFile: state.excelFile } });
    }
  };

  const handleExcelFile = async (file: File) => {
    const errors = validateExcelFile(file);
    setExcelErrors(errors);
    
    if (errors.length === 0) {
      dispatch({ type: 'SET_FILES', payload: { pdfFile: state.pdfFile, excelFile: file } });
      
      try {
        toast.loading('Analyse préliminaire du fichier Excel...', { id: 'excel-analysis' });
        
        const { data, debug } = await extractDataFromExcelWithDebug(file);
        setDebugInfo(debug);
        
        // 🆕 DÉTECTION DU FORMAT
        const hasColorData = data.some(b => b.color);
        const hasSizeData = data.some(b => b.size);
        const hasDualCurrency = data.some(b => b.priceEuro && b.pricePound);
        const formatDetected = (hasColorData && hasSizeData && hasDualCurrency) ? 'SS26' : 'FW25';
        
        dispatch({ type: 'SET_DETECTED_FORMAT', payload: formatDetected });
        
        if (debug.errors.length > 0 || debug.warnings.length > 0 || debug.dataQuality.qualityScore < 70) {
          setShowDebug(true);
          toast.error('Problèmes détectés - Consultez le mode debug', { id: 'excel-analysis' });
        } else {
          toast.success(`Format ${formatDetected} détecté: ${data.length} codes-barres trouvés`, { id: 'excel-analysis' });
        }
      } catch (error) {
        toast.error('Erreur lors de l\'analyse préliminaire', { id: 'excel-analysis' });
        console.error('Excel analysis error:', error);
      }
    }
  };

  const handleStartProcessing = async () => {
    if (!state.pdfFile || !state.excelFile || pdfErrors.length > 0 || excelErrors.length > 0) {
      return;
    }

    dispatch({ type: 'SET_PROCESSING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      toast.loading('Analyse des fichiers en cours...', { id: 'analysis' });

      const { productReferences } = await extractBarcodesFromPdf(state.pdfFile);
      const excelData = await extractDataFromExcel(state.excelFile);
      
      // 🆕 DÉTECTION FINALE DU FORMAT
      const hasColorData = excelData.some(b => b.color);
      const hasSizeData = excelData.some(b => b.size);
      const hasDualCurrency = excelData.some(b => b.priceEuro && b.pricePound);
      const formatDetected = (hasColorData && hasSizeData && hasDualCurrency) ? 'SS26' : 'FW25';
      
      dispatch({ type: 'SET_DETECTED_FORMAT', payload: formatDetected });
      dispatch({ type: 'SET_PRODUCT_REFERENCES', payload: productReferences });

      const availableSuppliers = getAvailableSuppliers(excelData);
      dispatch({ type: 'SET_AVAILABLE_SUPPLIERS', payload: availableSuppliers });

      const detectedSupplier = identifySupplier(productReferences, excelData);
      
      if (detectedSupplier) {
        dispatch({ type: 'SET_DETECTED_SUPPLIER', payload: detectedSupplier });
        toast.success(`Format ${formatDetected} - Fournisseur: ${detectedSupplier.name}`, { id: 'analysis' });
      } else {
        toast.success(`Format ${formatDetected} détecté - Sélection manuelle requise`, { id: 'analysis' });
      }

      dispatch({ type: 'SET_BARCODES', payload: excelData });
      dispatch({ type: 'SET_STEP', payload: 'supplier-validation' });

    } catch (error) {
      console.error('Error during initial analysis:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(`Erreur: ${errorMessage}`, { id: 'analysis' });
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  };

  const canProceed = state.pdfFile && state.excelFile && pdfErrors.length === 0 && excelErrors.length === 0;

  return (
    <div className="space-y-8">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Vérification Multi-Fournisseurs
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Importez vos fichiers pour une analyse intelligente avec identification automatique du fournisseur
        </p>
        {state.detectedFormat && (
          <motion.div 
            className="mt-4 inline-flex items-center px-4 py-2 bg-oxbow-100 dark:bg-oxbow-900/30 rounded-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="text-oxbow-700 dark:text-oxbow-300 font-medium">
              🎯 Format détecté: {state.detectedFormat}
              {state.detectedFormat === 'SS26' && ' (Enrichi avec couleurs, tailles, multi-devises)'}
            </span>
          </motion.div>
        )}
      </motion.div>

      <motion.div 
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">🚀 Version universelle SS26 + FW25</h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
              <p><strong>✅ Support SS26:</strong> Couleurs, tailles, prix EUR/GBP, fournisseurs enrichis</p>
              <p><strong>✅ Rétrocompatibilité FW25:</strong> Fonctionne avec les anciens formats</p>
              <p><strong>🔧 Détection automatique:</strong> Adaptation intelligente selon le format détecté</p>
              <p><strong>🛡️ Ultra-robuste:</strong> Gère tous les formats Excel, encodages, cellules vides</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <FileUploadZone
            title="Fichier PDF Étiquettes"
            description="PDF avec références produits (R2PIVEGA-JP OXV932106) et codes-barres (max 50MB)"
            accept="application/pdf"
            maxSize={50 * 1024 * 1024}
            onFileSelect={handlePdfFile}
            file={state.pdfFile}
            errors={pdfErrors}
            isProcessing={state.isProcessing}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <FileUploadZone
            title="Fichier Excel Multi-Fournisseurs"
            description={`Excel avec colonnes ${state.detectedFormat === 'SS26' ? 'Gencod, Code_article, Fournisseur, X300 (EUR), X350 (GBP), lib._coloris, Taille' : 'Gencod, Code article, Supplier, RETAIL PRICE'} (max 20MB)`}
            accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12,application/vnd.ms-excel,text/csv"
            maxSize={20 * 1024 * 1024}
            onFileSelect={handleExcelFile}
            file={state.excelFile}
            errors={excelErrors}
            isProcessing={state.isProcessing}
          />
        </motion.div>
      </div>

      {debugInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <DebugPanel
            debug={debugInfo}
            isVisible={showDebug}
            onToggle={() => setShowDebug(!showDebug)}
          />
        </motion.div>
      )}

      {!canProceed && (state.pdfFile || state.excelFile) && (
        <motion.div 
          className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-warning-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-warning-800 dark:text-warning-200">Fichiers requis</h3>
              <p className="text-sm text-warning-700 dark:text-warning-300 mt-1">
                Veuillez importer les deux fichiers requis et corriger les éventuelles erreurs avant de continuer.
              </p>
              {debugInfo && (debugInfo.errors.length > 0 || debugInfo.warnings.length > 0) && (
                <button
                  onClick={() => setShowDebug(true)}
                  className="mt-2 flex items-center space-x-1 text-sm text-warning-700 dark:text-warning-300 hover:underline"
                >
                  <Bug className="w-4 h-4" />
                  <span>Voir les détails techniques</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        className="flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <motion.button
          onClick={handleStartProcessing}
          disabled={!canProceed || state.isProcessing}
          className={`
            flex items-center space-x-2 px-8 py-4 rounded-xl font-semibold text-lg
            transition-all duration-200 transform
            ${canProceed && !state.isProcessing
              ? 'bg-oxbow-500 text-white hover:bg-oxbow-600 hover:scale-105 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }
          `}
          whileHover={canProceed && !state.isProcessing ? { scale: 1.05 } : {}}
          whileTap={canProceed && !state.isProcessing ? { scale: 0.95 } : {}}
        >
          <span>
            {state.isProcessing ? 'Analyse en cours...' : 
             state.detectedFormat ? `Analyser avec format ${state.detectedFormat}` : 
             'Analyser et identifier le fournisseur'}
          </span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  );
}