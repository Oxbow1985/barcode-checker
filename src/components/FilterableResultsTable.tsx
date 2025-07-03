import React, { useState, useMemo } from 'react';
import { FilterOptions, ComparisonResult } from '../types';
import { filterResults } from '../utils/comparisonEngine';
import { AdvancedFiltersPanel } from './AdvancedFiltersPanel';
import { EnhancedResultsTable } from './EnhancedResultsTable';

interface FilterableResultsTableProps {
  results: ComparisonResult[];
  onExportExcel: () => void;
  onExportPdf: () => void;
}

export function FilterableResultsTable({ results, onExportExcel, onExportPdf }: FilterableResultsTableProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    severity: [],
    searchTerm: '',
    colors: [],
    sizes: [],
    suppliers: [],
    priceRange: null,
    currency: 'ALL'
  });
  const [showFilters, setShowFilters] = useState(false);

  const filteredResults = useMemo(() => {
    return filterResults(results, filters);
  }, [results, filters]);

  return (
    <div className="space-y-6">
      {/* Panneau de Filtres Avancés */}
      <AdvancedFiltersPanel
        results={results}
        filters={filters}
        onFiltersChange={setFilters}
        isVisible={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
      />

      {/* Tableau de Résultats Enrichi */}
      <EnhancedResultsTable
        results={results}
        filteredResults={filteredResults}
        filters={filters}
        onExportExcel={onExportExcel}
        onExportPdf={onExportPdf}
      />
    </div>
  );
}