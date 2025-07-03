import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Grid3X3,
  List,
  Palette,
  Ruler,
  Building2,
  Euro,
  PoundSterling,
  Copy,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { ComparisonResult, FilterOptions } from '../types';
import { ResultDetailModal } from './ResultDetailModal';
import toast from 'react-hot-toast';

interface EnhancedResultsTableProps {
  results: ComparisonResult[];
  filteredResults: ComparisonResult[];
  filters: FilterOptions;
  onExportExcel: () => void;
  onExportPdf: () => void;
}

type SortField = 'barcode' | 'status' | 'severity' | 'price' | 'color' | 'size' | 'supplier';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'grid';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export function EnhancedResultsTable({ 
  results, 
  filteredResults, 
  filters,
  onExportExcel, 
  onExportPdf 
}: EnhancedResultsTableProps) {
  const [selectedResult, setSelectedResult] = useState<ComparisonResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'barcode', direction: 'asc' });
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // 📊 TRI INTELLIGENT
  const sortedResults = useMemo(() => {
    return [...filteredResults].sort((a, b) => {
      const { field, direction } = sortConfig;
      let aValue: any;
      let bValue: any;

      switch (field) {
        case 'barcode':
          aValue = a.barcode;
          bValue = b.barcode;
          break;
        case 'status':
          const statusOrder = { 'pdf_only': 0, 'price_mismatch': 1, 'excel_only': 2, 'exact_match': 3 };
          aValue = statusOrder[a.status as keyof typeof statusOrder] ?? 999;
          bValue = statusOrder[b.status as keyof typeof statusOrder] ?? 999;
          break;
        case 'severity':
          const severityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
          aValue = severityOrder[a.severity];
          bValue = severityOrder[b.severity];
          break;
        case 'price':
          aValue = a.excelData?.priceEuro || a.excelData?.price || 0;
          bValue = b.excelData?.priceEuro || b.excelData?.price || 0;
          break;
        case 'color':
          aValue = a.excelData?.color || '';
          bValue = b.excelData?.color || '';
          break;
        case 'size':
          aValue = a.excelData?.size || '';
          bValue = b.excelData?.size || '';
          break;
        case 'supplier':
          aValue = a.excelData?.supplier || '';
          bValue = b.excelData?.supplier || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredResults, sortConfig]);

  // 📄 PAGINATION
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedResults.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedResults, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedResults.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

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

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-oxbow-500" />
      : <ArrowDown className="w-4 h-4 text-oxbow-500" />;
  };

  const getStatusIcon = (status: ComparisonResult['status']) => {
    switch (status) {
      case 'exact_match':
        return <div className="w-3 h-3 bg-success-500 rounded-full" />;
      case 'pdf_only':
        return <div className="w-3 h-3 bg-error-500 rounded-full" />;
      case 'excel_only':
        return <div className="w-3 h-3 bg-warning-500 rounded-full" />;
      case 'price_mismatch':
        return <div className="w-3 h-3 bg-oxbow-500 rounded-full" />;
      default:
        return <div className="w-3 h-3 bg-gray-500 rounded-full" />;
    }
  };

  const getStatusLabel = (status: ComparisonResult['status']) => {
    switch (status) {
      case 'exact_match': return 'Correspondance exacte';
      case 'pdf_only': return 'PDF uniquement';
      case 'excel_only': return 'Excel uniquement';
      case 'price_mismatch': return 'Prix différent';
      default: return 'Inconnu';
    }
  };

  const getSeverityBadge = (severity: ComparisonResult['severity']) => {
    const colors = {
      high: 'bg-error-100 text-error-800 border-error-200',
      medium: 'bg-warning-100 text-warning-800 border-warning-200',
      low: 'bg-success-100 text-success-800 border-success-200'
    };
    
    const labels = {
      high: 'Élevée',
      medium: 'Moyenne',
      low: 'Faible'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${colors[severity]}`}>
        {labels[severity]}
      </span>
    );
  };

  // 🎨 COMPOSANT CARTE POUR VUE GRILLE
  const ResultCard = ({ result, index }: { result: ComparisonResult; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-card p-4 border border-gray-200 dark:border-slate-600 hover:shadow-lg transition-all group"
    >
      {/* Header de la carte */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon(result.status)}
          <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
            {result.barcode}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleCopyCode(result.barcode)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
          >
            {copiedCode === result.barcode ? (
              <CheckCircle className="w-4 h-4 text-success-500" />
            ) : (
              <Copy className="w-4 h-4 text-gray-500" />
            )}
          </button>
          <button
            onClick={() => setSelectedResult(result)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
          >
            <Eye className="w-4 h-4 text-oxbow-500" />
          </button>
        </div>
      </div>

      {/* Statut et Sévérité */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {getStatusLabel(result.status)}
        </span>
        {getSeverityBadge(result.severity)}
      </div>

      {/* Informations SS26 */}
      {result.excelData && (
        <div className="space-y-2">
          {/* Prix */}
          {(result.excelData.priceEuro || result.excelData.price) && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Prix:</span>
              <div className="flex items-center space-x-2">
                {result.excelData.priceEuro && (
                  <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                    <Euro className="w-3 h-3 mr-1" />
                    {result.excelData.priceEuro.toFixed(2)}
                  </span>
                )}
                {result.excelData.pricePound && (
                  <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                    <PoundSterling className="w-3 h-3 mr-1" />
                    {result.excelData.pricePound.toFixed(2)}
                  </span>
                )}
                {!result.excelData.priceEuro && !result.excelData.pricePound && result.excelData.price && (
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {result.excelData.price.toFixed(2)} €
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Couleur et Taille */}
          <div className="grid grid-cols-2 gap-2">
            {result.excelData.color && (
              <div className="flex items-center space-x-1">
                <Palette className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {result.excelData.color}
                </span>
              </div>
            )}
            {result.excelData.size && (
              <div className="flex items-center space-x-1">
                <Ruler className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {result.excelData.size}
                </span>
              </div>
            )}
          </div>

          {/* Fournisseur */}
          {result.excelData.supplier && (
            <div className="flex items-center space-x-1">
              <Building2 className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {result.excelData.supplier}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Sources */}
      <div className="flex justify-center space-x-4 mt-3 pt-3 border-t border-gray-200 dark:border-slate-600">
        <div className="flex items-center space-x-1">
          <span className={`w-2 h-2 rounded-full ${result.pdfData ? 'bg-success-500' : 'bg-gray-300'}`} />
          <span className="text-xs text-gray-600 dark:text-gray-400">PDF</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className={`w-2 h-2 rounded-full ${result.excelData ? 'bg-success-500' : 'bg-gray-300'}`} />
          <span className="text-xs text-gray-600 dark:text-gray-400">Excel</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-600">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Résultats Détaillés ({sortedResults.length}/{results.length})
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Analyse complète avec tri, filtres et recherche avancée
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Sélecteur de vue */}
            <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Tableau</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span>Grille</span>
              </button>
            </div>

            {/* Sélecteur d'éléments par page */}
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm border-0 focus:ring-2 focus:ring-oxbow-500"
            >
              <option value={10}>10 par page</option>
              <option value={20}>20 par page</option>
              <option value={50}>50 par page</option>
              <option value={100}>100 par page</option>
            </select>
            
            <button
              onClick={onExportExcel}
              className="flex items-center space-x-2 px-3 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Excel</span>
            </button>
            
            <button
              onClick={onExportPdf}
              className="flex items-center space-x-2 px-3 py-2 bg-error-500 text-white rounded-lg hover:bg-error-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {viewMode === 'table' ? (
            <motion.div
              key="table-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-x-auto"
            >
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    {[
                      { field: 'barcode' as SortField, label: 'Code-barres' },
                      { field: 'status' as SortField, label: 'Statut' },
                      { field: 'severity' as SortField, label: 'Sévérité' },
                      { field: 'color' as SortField, label: 'Couleur' },
                      { field: 'size' as SortField, label: 'Taille' },
                      { field: 'supplier' as SortField, label: 'Fournisseur' },
                      { field: 'price' as SortField, label: 'Prix' }
                    ].map(column => (
                      <th
                        key={column.field}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                        onClick={() => handleSort(column.field)}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{column.label}</span>
                          {getSortIcon(column.field)}
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Sources
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-600">
                  {paginatedResults.map((result, index) => (
                    <motion.tr
                      key={result.barcode}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-700'} hover:bg-oxbow-50 dark:hover:bg-oxbow-900/20 transition-colors group`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                            {result.barcode}
                          </span>
                          <button
                            onClick={() => handleCopyCode(result.barcode)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
                          >
                            {copiedCode === result.barcode ? (
                              <CheckCircle className="w-3 h-3 text-success-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-500" />
                            )}
                          </button>
                        </div>
                        {result.normalizedBarcode !== result.barcode && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Normalisé: {result.normalizedBarcode}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(result.status)}
                          <span className="text-sm text-gray-900 dark:text-white">
                            {getStatusLabel(result.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getSeverityBadge(result.severity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.excelData?.color ? (
                          <div className="flex items-center space-x-1">
                            <Palette className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {result.excelData.color}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.excelData?.size ? (
                          <div className="flex items-center space-x-1">
                            <Ruler className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {result.excelData.size}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.excelData?.supplier ? (
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {result.excelData.supplier}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.excelData && (result.excelData.priceEuro || result.excelData.price) ? (
                          <div className="space-y-1">
                            {result.excelData.priceEuro && (
                              <div className="flex items-center space-x-1 text-sm text-gray-900 dark:text-white">
                                <Euro className="w-3 h-3" />
                                <span>{result.excelData.priceEuro.toFixed(2)}</span>
                              </div>
                            )}
                            {result.excelData.pricePound && (
                              <div className="flex items-center space-x-1 text-sm text-gray-900 dark:text-white">
                                <PoundSterling className="w-3 h-3" />
                                <span>{result.excelData.pricePound.toFixed(2)}</span>
                              </div>
                            )}
                            {!result.excelData.priceEuro && !result.excelData.pricePound && result.excelData.price && (
                              <span className="text-sm text-gray-900 dark:text-white">
                                {result.excelData.price.toFixed(2)} €
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-2">
                          <span 
                            className={`w-2 h-2 rounded-full ${result.pdfData ? 'bg-success-500' : 'bg-gray-300'}`} 
                            title="PDF" 
                          />
                          <span 
                            className={`w-2 h-2 rounded-full ${result.excelData ? 'bg-success-500' : 'bg-gray-300'}`} 
                            title="Excel" 
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSelectedResult(result)}
                          className="text-oxbow-600 hover:text-oxbow-900 dark:text-oxbow-400 dark:hover:text-oxbow-300 transition-colors"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          ) : (
            <motion.div
              key="grid-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {paginatedResults.map((result, index) => (
                <ResultCard key={result.barcode} result={result} index={index} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-slate-600 pt-6">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Affichage {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, sortedResults.length)} sur {sortedResults.length} résultats
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Précédent</span>
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-oxbow-500 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Suivant</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de détail */}
      {selectedResult && (
        <ResultDetailModal
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  );
}