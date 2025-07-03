import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bug, 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Clock,
  Database,
  Zap,
  FileText,
  Target
} from 'lucide-react';

interface DebugInfo {
  fileAnalysis: {
    fileName: string;
    fileSize: number;
    sheets: string[];
    selectedSheet: string;
    encoding: string;
    processingTime: number;
  };
  columnDetection: {
    [key: string]: {
      detected: boolean;
      columnIndex: number;
      columnName: string;
      confidence: number;
      alternatives: Array<{ name: string; index: number; confidence: number }>;
    };
  };
  dataQuality: {
    totalRows: number;
    validRows: number;
    emptyRows: number;
    errorRows: number;
    duplicates: number;
    qualityScore: number;
  };
  performance: {
    parseTime: number;
    processTime: number;
    memoryUsage: string;
    chunksProcessed: number;
  };
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

interface DebugPanelProps {
  debug: DebugInfo;
  isVisible: boolean;
  onToggle: () => void;
}

export function DebugPanel({ debug, isVisible, onToggle }: DebugPanelProps) {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const sections = [
    { id: 'overview', label: '📊 Vue d\'ensemble', icon: Database },
    { id: 'columns', label: '🎯 Détection colonnes', icon: Target },
    { id: 'quality', label: '✅ Qualité données', icon: CheckCircle },
    { id: 'performance', label: '⚡ Performance', icon: Zap },
    { id: 'issues', label: '🚨 Problèmes', icon: AlertTriangle }
  ];

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-success-600 bg-success-100';
    if (score >= 60) return 'text-warning-600 bg-warning-100';
    return 'text-error-600 bg-error-100';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success-600';
    if (confidence >= 0.6) return 'text-warning-600';
    return 'text-error-600';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Bug className="w-5 h-5 text-oxbow-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mode Debug - Analyse Technique
          </h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(debug.dataQuality.qualityScore)}`}>
            Qualité: {debug.dataQuality.qualityScore}%
          </div>
        </div>
        <motion.div
          animate={{ rotate: isVisible ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6">
              {/* Navigation */}
              <div className="flex flex-wrap gap-2 mb-6">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? 'bg-oxbow-100 text-oxbow-700 dark:bg-oxbow-900/30 dark:text-oxbow-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-400 dark:hover:bg-slate-600'
                    }`}
                  >
                    <section.icon className="w-4 h-4" />
                    <span>{section.label}</span>
                  </button>
                ))}
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeSection === 'overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* File Analysis */}
                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            Analyse du Fichier
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Nom:</span>
                              <span className="font-medium text-gray-900 dark:text-white">{debug.fileAnalysis.fileName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Taille:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {(debug.fileAnalysis.fileSize / 1024 / 1024).toFixed(1)} MB
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Feuille:</span>
                              <span className="font-medium text-gray-900 dark:text-white">{debug.fileAnalysis.selectedSheet}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Encodage:</span>
                              <span className="font-medium text-gray-900 dark:text-white">{debug.fileAnalysis.encoding}</span>
                            </div>
                          </div>
                        </div>

                        {/* Processing Stats */}
                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Statistiques de Traitement
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Temps total:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {debug.fileAnalysis.processingTime.toFixed(0)}ms
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Mémoire:</span>
                              <span className="font-medium text-gray-900 dark:text-white">{debug.performance.memoryUsage}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Chunks:</span>
                              <span className="font-medium text-gray-900 dark:text-white">{debug.performance.chunksProcessed}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === 'columns' && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Détection des Colonnes</h4>
                      {Object.entries(debug.columnDetection).map(([type, detection]) => (
                        <div key={type} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900 dark:text-white capitalize">{type}</h5>
                            <div className="flex items-center space-x-2">
                              {detection.detected ? (
                                <CheckCircle className="w-4 h-4 text-success-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-error-500" />
                              )}
                              <span className={`text-sm font-medium ${getConfidenceColor(detection.confidence)}`}>
                                {(detection.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          
                          {detection.detected && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              Colonne détectée: <span className="font-medium">"{detection.columnName}"</span> (index {detection.columnIndex})
                            </div>
                          )}
                          
                          {detection.alternatives.length > 0 && (
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Alternatives trouvées:</div>
                              <div className="space-y-1">
                                {detection.alternatives.slice(0, 3).map((alt, index) => (
                                  <div key={index} className="flex justify-between text-xs">
                                    <span className="text-gray-600 dark:text-gray-400">"{alt.name}"</span>
                                    <span className={getConfidenceColor(alt.confidence)}>
                                      {(alt.confidence * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeSection === 'quality' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Qualité des Données</h4>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getQualityColor(debug.dataQuality.qualityScore)}`}>
                          Score: {debug.dataQuality.qualityScore}%
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-oxbow-600">{debug.dataQuality.totalRows}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Total lignes</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-success-600">{debug.dataQuality.validRows}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Valides</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-error-600">{debug.dataQuality.errorRows}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Erreurs</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-warning-600">{debug.dataQuality.duplicates}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Doublons</div>
                        </div>
                      </div>

                      {/* Quality Bar */}
                      <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Répartition des données</span>
                          <span className="text-gray-900 dark:text-white">{debug.dataQuality.totalRows} lignes</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-3 overflow-hidden">
                          <div className="h-full flex">
                            <div 
                              className="bg-success-500" 
                              style={{ width: `${(debug.dataQuality.validRows / debug.dataQuality.totalRows) * 100}%` }}
                            />
                            <div 
                              className="bg-error-500" 
                              style={{ width: `${(debug.dataQuality.errorRows / debug.dataQuality.totalRows) * 100}%` }}
                            />
                            <div 
                              className="bg-gray-400" 
                              style={{ width: `${(debug.dataQuality.emptyRows / debug.dataQuality.totalRows) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-success-600">Valides</span>
                          <span className="text-error-600">Erreurs</span>
                          <span className="text-gray-500">Vides</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === 'performance' && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Performance du Traitement</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-3">Temps de Traitement</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Parsing:</span>
                              <span className="font-medium">{debug.performance.parseTime.toFixed(0)}ms</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Processing:</span>
                              <span className="font-medium">{debug.performance.processTime.toFixed(0)}ms</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Total:</span>
                              <span className="font-medium">{debug.fileAnalysis.processingTime.toFixed(0)}ms</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-3">Ressources</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Mémoire:</span>
                              <span className="font-medium">{debug.performance.memoryUsage}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Chunks:</span>
                              <span className="font-medium">{debug.performance.chunksProcessed}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Débit:</span>
                              <span className="font-medium">
                                {(debug.dataQuality.validRows / (debug.fileAnalysis.processingTime / 1000)).toFixed(0)} lignes/s
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === 'issues' && (
                    <div className="space-y-4">
                      {/* Errors */}
                      {debug.errors.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-error-600 mb-3 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Erreurs ({debug.errors.length})
                          </h4>
                          <div className="space-y-2">
                            {debug.errors.map((error, index) => (
                              <div key={index} className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-3">
                                <p className="text-sm text-error-800 dark:text-error-200">{error}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Warnings */}
                      {debug.warnings.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-warning-600 mb-3 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Avertissements ({debug.warnings.length})
                          </h4>
                          <div className="space-y-2">
                            {debug.warnings.map((warning, index) => (
                              <div key={index} className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-3">
                                <p className="text-sm text-warning-800 dark:text-warning-200">{warning}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggestions */}
                      {debug.suggestions.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-oxbow-600 mb-3 flex items-center">
                            <Info className="w-4 h-4 mr-2" />
                            Suggestions ({debug.suggestions.length})
                          </h4>
                          <div className="space-y-2">
                            {debug.suggestions.map((suggestion, index) => (
                              <div key={index} className="bg-oxbow-50 dark:bg-oxbow-900/20 border border-oxbow-200 dark:border-oxbow-800 rounded-lg p-3">
                                <p className="text-sm text-oxbow-800 dark:text-oxbow-200">{suggestion}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {debug.errors.length === 0 && debug.warnings.length === 0 && debug.suggestions.length === 0 && (
                        <div className="text-center py-8">
                          <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-400">Aucun problème détecté ! 🎉</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}