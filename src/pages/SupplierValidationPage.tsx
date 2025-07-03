import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft,
  Package,
  Search,
  Info
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { SupplierInfo } from '../types';
import { validateSupplierDetection } from '../utils/supplierDetection';

export function SupplierValidationPage() {
  const { state, dispatch } = useApp();
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierInfo | null>(null);

  // Auto-sélection du fournisseur détecté
  useEffect(() => {
    if (state.detectedSupplier && !selectedSupplier) {
      setSelectedSupplier(state.detectedSupplier);
      dispatch({ type: 'SET_SELECTED_SUPPLIER', payload: state.detectedSupplier });
    }
  }, [state.detectedSupplier, selectedSupplier, dispatch]);

  const handleSupplierSelect = (supplier: SupplierInfo) => {
    setSelectedSupplier(supplier);
    dispatch({ type: 'SET_SELECTED_SUPPLIER', payload: supplier });
  };

  const handleContinue = () => {
    if (selectedSupplier) {
      dispatch({ type: 'SET_STEP', payload: 'processing' });
    } else {
      alert('Veuillez sélectionner un fournisseur avant de continuer');
    }
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 'upload' });
  };

  const detectedSupplier = state.detectedSupplier;
  const availableSuppliers = state.availableSuppliers || [];
  
  const validation = detectedSupplier 
    ? validateSupplierDetection(detectedSupplier, detectedSupplier.detectedReferences.length)
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          🔍 Identification du Fournisseur
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Nous avons analysé vos fichiers pour identifier automatiquement le fournisseur correspondant
        </p>
      </motion.div>

      {/* Detected Supplier Section */}
      {detectedSupplier && (
        <motion.div 
          className="bg-white dark:bg-slate-800 rounded-xl shadow-card p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-oxbow-100 dark:bg-oxbow-900/30 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-oxbow-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Fournisseur Identifié Automatiquement
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Basé sur l'analyse des références produits du PDF
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supplier Info */}
            <div className="space-y-4">
              <div className="bg-oxbow-50 dark:bg-oxbow-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-oxbow-900 dark:text-oxbow-100 mb-2">
                  {detectedSupplier.name}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Produits dans Excel :</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {detectedSupplier.productCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Références trouvées :</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {detectedSupplier.detectedReferences.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Confiance :</span>
                    <span className={`font-medium ${
                      validation?.confidence === 'high' ? 'text-success-600' :
                      validation?.confidence === 'medium' ? 'text-warning-600' : 'text-error-600'
                    }`}>
                      {(detectedSupplier.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {validation && (
                <div className={`rounded-lg p-4 ${
                  validation.confidence === 'high' ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800' :
                  validation.confidence === 'medium' ? 'bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800' :
                  'bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800'
                }`}>
                  <div className="flex items-center space-x-2">
                    {validation.confidence === 'high' ? (
                      <CheckCircle className="w-5 h-5 text-success-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-warning-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      validation.confidence === 'high' ? 'text-success-800 dark:text-success-200' :
                      validation.confidence === 'medium' ? 'text-warning-800 dark:text-warning-200' :
                      'text-error-800 dark:text-error-200'
                    }`}>
                      {validation.message}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Detected References */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                📋 Références Détectées dans le PDF
              </h4>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                {detectedSupplier.detectedReferences.length > 0 ? (
                  <div className="space-y-2">
                    {detectedSupplier.detectedReferences.map((ref, index) => (
                      <div 
                        key={index}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <Package className="w-4 h-4 text-oxbow-500" />
                        <span className="font-mono text-gray-900 dark:text-white">{ref}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Aucune référence spécifique détectée
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200 dark:border-slate-600">
            <button
              onClick={() => handleSupplierSelect(detectedSupplier)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedSupplier?.id === detectedSupplier.id
                  ? 'bg-oxbow-500 text-white'
                  : 'bg-oxbow-100 dark:bg-oxbow-900/30 text-oxbow-700 dark:text-oxbow-300 hover:bg-oxbow-200 dark:hover:bg-oxbow-900/50'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span>
                {selectedSupplier?.id === detectedSupplier.id ? 'Fournisseur sélectionné ✅' : 'Sélectionner ce fournisseur'}
              </span>
            </button>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              ou choisissez manuellement ci-dessous
            </div>
          </div>
        </motion.div>
      )}

      {/* Manual Selection */}
      <motion.div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-card p-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center space-x-3 mb-6">
          <Search className="w-6 h-6 text-gray-500" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Sélection Manuelle du Fournisseur
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableSuppliers.map((supplier) => (
            <motion.button
              key={supplier.id}
              onClick={() => handleSupplierSelect(supplier)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedSupplier?.id === supplier.id
                  ? 'border-oxbow-500 bg-oxbow-50 dark:bg-oxbow-900/20'
                  : 'border-gray-200 dark:border-slate-600 hover:border-oxbow-300 dark:hover:border-oxbow-700'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {supplier.name}
                </h4>
                {selectedSupplier?.id === supplier.id && (
                  <CheckCircle className="w-5 h-5 text-oxbow-500" />
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {supplier.productCount} produits
              </p>
            </motion.button>
          ))}
        </div>

        {availableSuppliers.length === 0 && (
          <div className="text-center py-8">
            <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Aucun fournisseur trouvé dans le fichier Excel
            </p>
          </div>
        )}
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between">
        <motion.button
          onClick={handleBack}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </motion.button>

        <motion.button
          onClick={handleContinue}
          disabled={!selectedSupplier}
          className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-semibold transition-all ${
            selectedSupplier
              ? 'bg-oxbow-500 text-white hover:bg-oxbow-600 hover:scale-105 shadow-lg cursor-pointer'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
          whileHover={selectedSupplier ? { scale: 1.05 } : {}}
          whileTap={selectedSupplier ? { scale: 0.95 } : {}}
        >
          <span>
            {selectedSupplier ? `Continuer avec ${selectedSupplier.name}` : 'Sélectionnez un fournisseur'}
          </span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}