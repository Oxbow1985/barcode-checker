import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Package, 
  Search, 
  Info, 
  ChevronDown,
  ChevronRight,
  Building2,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react';
import { ComparisonResult } from '../types';
import toast from 'react-hot-toast';

interface MissingCodesSectionProps {
  missingResults: ComparisonResult[];
  supplierName: string;
  totalPdfCodes: number;
  allResults: ComparisonResult[]; // Pour l'analyse cross-fournisseurs
}

interface CrossSupplierAnalysis {
  code: string;
  foundInSupplier?: string;
  price?: number;
  currency?: string;
  color?: string;
  size?: string;
  description?: string;
}

export function MissingCodesSection({ 
  missingResults, 
  supplierName, 
  totalPdfCodes,
  allResults 
}: MissingCodesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCrossAnalysis, setShowCrossAnalysis] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const missingCount = missingResults.length;
  const missingRate = ((missingCount / totalPdfCodes) * 100).toFixed(1);

  // 🔍 ANALYSE CROSS-FOURNISSEURS
  const crossSupplierAnalysis: CrossSupplierAnalysis[] = missingResults.map(result => {
    const code = result.barcode;
    
    // Rechercher ce code chez d'autres fournisseurs
    const foundInOtherSupplier = allResults.find(r => 
      r.barcode === code && 
      r.excelData && 
      r.excelData.supplier !== supplierName
    );

    if (foundInOtherSupplier?.excelData) {
      return {
        code,
        foundInSupplier: foundInOtherSupplier.excelData.supplier,
        price: foundInOtherSupplier.excelData.priceEuro || foundInOtherSupplier.excelData.price,
        currency: foundInOtherSupplier.excelData.priceEuro ? 'EUR' : 'GBP',
        color: foundInOtherSupplier.excelData.color,
        size: foundInOtherSupplier.excelData.size,
        description: foundInOtherSupplier.excelData.description
      };
    }

    return { code };
  });

  const foundInOtherSuppliers = crossSupplierAnalysis.filter(item => item.foundInSupplier);
  const totallyMissing = crossSupplierAnalysis.filter(item => !item.foundInSupplier);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(`Code ${code} copié !`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  const handleCopyAllCodes = async () => {
    const allCodes = missingResults.map(r => r.barcode).join('\n');
    try {
      await navigator.clipboard.writeText(allCodes);
      toast.success(`${missingCount} codes copiés !`);
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  if (missingCount === 0) return null;

  return (
    <motion.div 
      className="bg-gradient-to-r from-error-50 to-warning-50 dark:from-error-900/20 dark:to-warning-900/20 border border-error-200 dark:border-error-800 rounded-xl overflow-hidden mb-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      {/* Header Principal */}
      <div className="bg-gradient-to-r from-error-500 to-warning-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">
                🚨 Codes-barres non trouvés chez {supplierName}
              </h3>
              <p className="text-white/90">
                {missingCount} codes PDF manquants sur {totalPdfCodes} ({missingRate}%)
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopyAllCodes}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Copier tous</span>
            </button>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <span>Détails</span>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>
          </div>
        </div>
      </div>

      {/* Métriques Rapides */}
      <div className="p-6 bg-white dark:bg-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-error-50 dark:bg-error-900/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Package className="w-5 h-5 text-error-600" />
              <span className="font-medium text-error-900 dark:text-error-100">Codes manquants</span>
            </div>
            <div className="text-2xl font-bold text-error-600">{missingCount}</div>
            <div className="text-sm text-error-700 dark:text-error-300">sur {totalPdfCodes} codes PDF</div>
          </div>
          
          <div className="bg-warning-50 dark:bg-warning-900/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Search className="w-5 h-5 text-warning-600" />
              <span className="font-medium text-warning-900 dark:text-warning-100">Taux de manque</span>
            </div>
            <div className="text-2xl font-bold text-warning-600">{missingRate}%</div>
            <div className="text-sm text-warning-700 dark:text-warning-300">des codes PDF</div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">Autres fournisseurs</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{foundInOtherSuppliers.length}</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">codes trouvés ailleurs</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Info className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900 dark:text-gray-100">Totalement absents</span>
            </div>
            <div className="text-2xl font-bold text-gray-600">{totallyMissing.length}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">de tout l'Excel</div>
          </div>
        </div>

        {/* Impact Business */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-3 flex items-center">
            📊 Impact Business
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-orange-800 dark:text-orange-200">Criticité:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                parseFloat(missingRate) > 15 ? 'bg-red-100 text-red-800' :
                parseFloat(missingRate) > 5 ? 'bg-orange-100 text-orange-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {parseFloat(missingRate) > 15 ? '🔴 Critique' :
                 parseFloat(missingRate) > 5 ? '🟠 Modérée' : '🟡 Faible'}
              </span>
            </div>
            <div>
              <span className="font-medium text-orange-800 dark:text-orange-200">Ventes impactées:</span>
              <span className="ml-2 text-orange-900 dark:text-orange-100">{missingCount} produits</span>
            </div>
            <div>
              <span className="font-medium text-orange-800 dark:text-orange-200">Action requise:</span>
              <span className="ml-2 text-orange-900 dark:text-orange-100">
                {parseFloat(missingRate) > 10 ? 'Immédiate' : 'Planifiée'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section Détaillée Expandable */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600">
              
              {/* Navigation des onglets */}
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setShowCrossAnalysis(false)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    !showCrossAnalysis
                      ? 'bg-error-500 text-white'
                      : 'bg-white dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-500'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Codes Manquants ({missingCount})</span>
                </button>
                
                <button
                  onClick={() => setShowCrossAnalysis(true)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    showCrossAnalysis
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-500'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Analyse Cross-Fournisseurs</span>
                  {foundInOtherSuppliers.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {foundInOtherSuppliers.length}
                    </span>
                  )}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {!showCrossAnalysis ? (
                  // 📋 LISTE DES CODES MANQUANTS
                  <motion.div
                    key="missing-codes"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      📋 Liste Complète des Codes Manquants chez {supplierName}
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {missingResults.map((result, index) => (
                        <motion.div
                          key={result.barcode}
                          className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-error-200 dark:border-error-800 hover:shadow-md transition-all group"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                                {result.barcode}
                              </div>
                              <div className="text-xs text-error-600 dark:text-error-400 mt-1">
                                Code #{index + 1}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleCopyCode(result.barcode)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                              title="Copier le code"
                            >
                              {copiedCode === result.barcode ? (
                                <CheckCircle className="w-4 h-4 text-success-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Actions recommandées */}
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                        💡 Actions Recommandées pour {supplierName}:
                      </h5>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>Envoyer la liste des {missingCount} codes manquants au fournisseur</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>Demander l'ajout de ces produits au catalogue {supplierName}</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>Vérifier les délais de mise à disposition</span>
                        </li>
                        {parseFloat(missingRate) > 15 && (
                          <li className="flex items-start space-x-2">
                            <span className="text-red-500 mt-1">⚠️</span>
                            <span className="font-medium text-red-700 dark:text-red-300">
                              Taux élevé : Vérifier la correspondance collection/fournisseur
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </motion.div>
                ) : (
                  // 🔍 ANALYSE CROSS-FOURNISSEURS
                  <motion.div
                    key="cross-analysis"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      🔍 Analyse Cross-Fournisseurs
                    </h4>

                    {foundInOtherSuppliers.length > 0 && (
                      <div className="mb-6">
                        <h5 className="font-medium text-success-700 dark:text-success-300 mb-3 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Codes trouvés chez d'autres fournisseurs ({foundInOtherSuppliers.length})
                        </h5>
                        
                        <div className="space-y-3">
                          {foundInOtherSuppliers.map((item, index) => (
                            <motion.div
                              key={item.code}
                              className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                                      {item.code}
                                    </span>
                                    <span className="text-xs bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-200 px-2 py-1 rounded">
                                      Trouvé
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                                    <div>
                                      <span className="text-gray-600 dark:text-gray-400">Fournisseur:</span>
                                      <div className="font-medium text-success-700 dark:text-success-300 flex items-center">
                                        <Building2 className="w-3 h-3 mr-1" />
                                        {item.foundInSupplier}
                                      </div>
                                    </div>
                                    
                                    {item.price && (
                                      <div>
                                        <span className="text-gray-600 dark:text-gray-400">Prix:</span>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {item.price.toFixed(2)} {item.currency}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {item.color && (
                                      <div>
                                        <span className="text-gray-600 dark:text-gray-400">Couleur:</span>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {item.color}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {item.size && (
                                      <div>
                                        <span className="text-gray-600 dark:text-gray-400">Taille:</span>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {item.size}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {item.description && (
                                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                                
                                <button
                                  onClick={() => handleCopyCode(item.code)}
                                  className="p-2 rounded hover:bg-success-100 dark:hover:bg-success-900/30 transition-colors"
                                  title="Copier le code"
                                >
                                  {copiedCode === item.code ? (
                                    <CheckCircle className="w-4 h-4 text-success-600" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-success-600" />
                                  )}
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {/* Recommandations cross-fournisseurs */}
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <h6 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            💡 Options Alternatives:
                          </h6>
                          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            <li>• Négocier avec {supplierName} pour ajouter ces {foundInOtherSuppliers.length} produits</li>
                            <li>• Considérer une commande mixte multi-fournisseurs</li>
                            <li>• Évaluer les conditions tarifaires des fournisseurs alternatifs</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {totallyMissing.length > 0 && (
                      <div>
                        <h5 className="font-medium text-error-700 dark:text-error-300 mb-3 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Codes totalement absents de l'Excel ({totallyMissing.length})
                        </h5>
                        
                        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                            {totallyMissing.map((item, index) => (
                              <div 
                                key={index}
                                className="bg-white dark:bg-slate-800 rounded px-3 py-2 text-sm font-mono text-gray-900 dark:text-white border border-error-200 dark:border-error-700 flex items-center justify-between group"
                              >
                                <span>{item.code}</span>
                                <button
                                  onClick={() => handleCopyCode(item.code)}
                                  className="opacity-0 group-hover:opacity-100 ml-1"
                                >
                                  <Copy className="w-3 h-3 text-gray-500" />
                                </button>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-4 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded">
                            <h6 className="font-semibold text-warning-900 dark:text-warning-100 mb-2">
                              ⚠️ Actions Critiques:
                            </h6>
                            <ul className="text-sm text-warning-800 dark:text-warning-200 space-y-1">
                              <li>• Vérifier si ces codes correspondent à de nouveaux produits</li>
                              <li>• Contrôler la validité des codes-barres PDF</li>
                              <li>• Rechercher dans d'autres bases de données fournisseurs</li>
                              <li>• Contacter le service produit pour validation</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}