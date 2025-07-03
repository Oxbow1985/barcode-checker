import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, FileText, Table } from 'lucide-react';
import { ComparisonResult } from '../types';

interface ResultsTableProps {
  results: ComparisonResult[];
  onExportExcel: () => void;
  onExportPdf: () => void;
}

export function ResultsTable({ results, onExportExcel, onExportPdf }: ResultsTableProps) {
  const getStatusIcon = (status: ComparisonResult['status']) => {
    switch (status) {
      case 'match':
        return <CheckCircle2 className="w-5 h-5 text-success-500" />;
      case 'pdf_only':
      case 'excel_only':
        return <AlertTriangle className="w-5 h-5 text-warning-500" />;
      default:
        return <XCircle className="w-5 h-5 text-error-500" />;
    }
  };

  const getStatusLabel = (status: ComparisonResult['status']) => {
    switch (status) {
      case 'match': return 'Concordant';
      case 'pdf_only': return 'PDF uniquement';
      case 'excel_only': return 'Excel uniquement';
      case 'price_mismatch': return 'Prix différent';
      default: return 'Inconnu';
    }
  };

  const getStatusBadgeColor = (status: ComparisonResult['status']) => {
    switch (status) {
      case 'match': return 'bg-success-100 text-success-800';
      case 'pdf_only':
      case 'excel_only': return 'bg-warning-100 text-warning-800';
      default: return 'bg-error-100 text-error-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Résultats de la vérification</h3>
        <div className="flex space-x-2">
          <button
            onClick={onExportExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors"
          >
            <Table className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={onExportPdf}
            className="flex items-center space-x-2 px-4 py-2 bg-error-500 text-white rounded-lg hover:bg-error-600 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code-barres
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                PDF
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Excel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prix
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Observation
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result, index) => (
              <tr key={result.barcode} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {result.barcode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(result.status)}
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(result.status)}`}>
                      {getStatusLabel(result.status)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {result.pdfData ? (
                    <CheckCircle2 className="w-5 h-5 text-success-500 mx-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {result.excelData ? (
                    <CheckCircle2 className="w-5 h-5 text-success-500 mx-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {result.excelData?.price ? `${result.excelData.price.toFixed(2)} €` : '—'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                  {result.discrepancy || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}