import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Package, Search, Info } from 'lucide-react';
import { ComparisonResult } from '../types';

interface NonMatchAlertProps {
  nonMatchResults: ComparisonResult[];
  supplierName: string;
  totalPdfCodes: number;
}

export function NonMatchAlert({ nonMatchResults, supplierName, totalPdfCodes }: NonMatchAlertProps) {
  const nonMatchCount = nonMatchResults.length;
  const nonMatchRate = ((nonMatchCount / totalPdfCodes) * 100).toFixed(1);
  
  if (nonMatchCount === 0) return null;

  return (
    <motion.div 
      className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-xl p-6 mb-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-warning-600" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-bold text-warning-900 dark:text-warning-100 mb-2">
            🚨 Codes-barres non trouvés chez {supplierName}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Package className="w-5 h-5 text-warning-600" />
                <span className="font-medium text-gray-900 dark:text-white">Codes manquants</span>
              </div>
              <div className="text-2xl font-bold text-warning-600">{nonMatchCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">sur {totalPdfCodes} codes PDF</div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Search className="w-5 h-5 text-warning-600" />
                <span className="font-medium text-gray-900 dark:text-white">Taux de manque</span>
              </div>
              <div className="text-2xl font-bold text-warning-600">{nonMatchRate}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">des codes PDF</div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="w-5 h-5 text-warning-600" />
                <span className="font-medium text-gray-900 dark:text-white">Impact</span>
              </div>
              <div className="text-lg font-bold text-warning-600">
                {parseFloat(nonMatchRate) > 10 ? 'Critique' : parseFloat(nonMatchRate) > 5 ? 'Modéré' : 'Faible'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">sur la conformité</div>
            </div>
          </div>
          
          <div className="bg-warning-100 dark:bg-warning-900/30 rounded-lg p-4">
            <h4 className="font-semibold text-warning-900 dark:text-warning-100 mb-3">
              📋 Exemples de codes manquants :
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {nonMatchResults.slice(0, 8).map((result, index) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-slate-800 rounded px-3 py-2 text-sm font-mono text-gray-900 dark:text-white border border-warning-200 dark:border-warning-700"
                >
                  {result.barcode}
                </div>
              ))}
              {nonMatchCount > 8 && (
                <div className="bg-warning-200 dark:bg-warning-800 rounded px-3 py-2 text-sm text-warning-800 dark:text-warning-200 text-center">
                  +{nonMatchCount - 8} autres
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Actions recommandées :
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Vérifier si ces produits doivent être ajoutés au catalogue {supplierName}</li>
              <li>• Contrôler si les codes-barres PDF sont corrects</li>
              <li>• Examiner si un autre fournisseur pourrait avoir ces produits</li>
              {parseFloat(nonMatchRate) > 15 && (
                <li className="font-medium text-warning-700 dark:text-warning-300">
                  • ⚠️ Taux élevé : Vérifier la correspondance fournisseur/PDF
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}