import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  X, 
  Search, 
  ChevronDown, 
  Palette, 
  Ruler, 
  Building2, 
  Euro, 
  PoundSterling,
  RotateCcw,
  Save,
  Star,
  Trash2,
  Check,
  Plus,
  Sparkles
} from 'lucide-react';
import { FilterOptions, ComparisonResult } from '../types';

interface AdvancedFiltersPanelProps {
  results: ComparisonResult[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  isVisible: boolean;
  onToggle: () => void;
}

interface SavedFilter {
  id: string;
  name: string;
  filters: FilterOptions;
  createdAt: Date;
}

export function AdvancedFiltersPanel({ 
  results, 
  filters, 
  onFiltersChange, 
  isVisible, 
  onToggle 
}: AdvancedFiltersPanelProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [filterName, setFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // 📊 EXTRACTION DES OPTIONS DISPONIBLES
  const availableOptions = React.useMemo(() => {
    const colors = new Set<string>();
    const sizes = new Set<string>();
    const suppliers = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    results.forEach(result => {
      if (result.excelData) {
        if (result.excelData.color) colors.add(result.excelData.color);
        if (result.excelData.size) sizes.add(result.excelData.size);
        if (result.excelData.supplier) suppliers.add(result.excelData.supplier);
        
        const price = result.excelData.priceEuro || result.excelData.price;
        if (price) {
          minPrice = Math.min(minPrice, price);
          maxPrice = Math.max(maxPrice, price);
        }
      }
    });

    return {
      colors: Array.from(colors).sort(),
      sizes: Array.from(sizes).sort((a, b) => {
        // Tri intelligent des tailles
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];
        const aIndex = sizeOrder.indexOf(a);
        const bIndex = sizeOrder.indexOf(b);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.localeCompare(b);
      }),
      suppliers: Array.from(suppliers).sort(),
      priceRange: minPrice !== Infinity ? { min: Math.floor(minPrice), max: Math.ceil(maxPrice) } : null
    };
  }, [results]);

  // 💾 GESTION DES FILTRES SAUVEGARDÉS
  useEffect(() => {
    const saved = localStorage.getItem('oxbow-saved-filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedFilters(parsed.map((f: any) => ({ ...f, createdAt: new Date(f.createdAt) })));
      } catch (error) {
        console.error('Erreur lors du chargement des filtres sauvegardés:', error);
      }
    }
  }, []);

  const saveFilters = () => {
    if (!filterName.trim()) return;

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName.trim(),
      filters: { ...filters },
      createdAt: new Date()
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('oxbow-saved-filters', JSON.stringify(updated));
    
    setFilterName('');
    setShowSaveDialog(false);
  };

  const loadFilter = (savedFilter: SavedFilter) => {
    onFiltersChange(savedFilter.filters);
  };

  const deleteFilter = (id: string) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem('oxbow-saved-filters', JSON.stringify(updated));
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: [],
      severity: [],
      searchTerm: '',
      colors: [],
      sizes: [],
      suppliers: [],
      priceRange: null,
      currency: 'ALL'
    });
  };

  const hasActiveFilters = filters.status.length > 0 || 
                          filters.severity.length > 0 || 
                          filters.searchTerm || 
                          filters.colors.length > 0 || 
                          filters.sizes.length > 0 || 
                          filters.suppliers.length > 0 || 
                          filters.priceRange || 
                          filters.currency !== 'ALL';

  const activeFiltersCount = [
    filters.status.length,
    filters.severity.length,
    filters.searchTerm ? 1 : 0,
    filters.colors.length,
    filters.sizes.length,
    filters.suppliers.length,
    filters.priceRange ? 1 : 0,
    filters.currency !== 'ALL' ? 1 : 0
  ].reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-700">
      {/* Header Premium avec couleurs Oxbow */}
      <button
        onClick={onToggle}
        className="w-full px-8 py-6 flex items-center justify-between bg-gradient-to-r from-oxbow-500 via-oxbow-600 to-oxbow-700 hover:from-oxbow-600 hover:via-oxbow-700 hover:to-oxbow-800 transition-all duration-300 group"
      >
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Filter className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-white mb-1">
              Filtres Avancés SS26
            </h3>
            <p className="text-white/80 text-sm">
              Recherche intelligente multi-critères
              {activeFiltersCount > 0 && (
                <span className="ml-3 px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-medium">
                  {activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isVisible ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="text-white/80 group-hover:text-white transition-colors"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-8 space-y-8 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-700">
              
              {/* Actions Rapides avec couleurs Oxbow */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <motion.button
                    onClick={() => setShowSaveDialog(true)}
                    disabled={!hasActiveFilters}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-success-500 to-success-600 text-white rounded-xl hover:from-success-600 hover:to-success-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Save className="w-4 h-4" />
                    <span className="font-medium">Sauvegarder</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={clearAllFilters}
                    disabled={!hasActiveFilters}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="font-medium">Réinitialiser</span>
                  </motion.button>
                </div>

                {savedFilters.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-slate-700/50 px-4 py-2 rounded-xl backdrop-blur-sm">
                    <Star className="w-4 h-4 text-warning-500" />
                    <span>{savedFilters.length} filtre{savedFilters.length > 1 ? 's' : ''} sauvegardé{savedFilters.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Recherche Textuelle Premium */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                  <Search className="w-4 h-4 text-oxbow-500" />
                  <span>Recherche Globale Intelligente</span>
                </label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-oxbow-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Code-barres, description, couleur, taille, fournisseur..."
                    value={filters.searchTerm}
                    onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
                    className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-oxbow-500/20 focus:border-oxbow-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 text-lg"
                  />
                  {filters.searchTerm && (
                    <button
                      onClick={() => onFiltersChange({ ...filters, searchTerm: '' })}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtres par Statut et Sévérité - Design Cards avec couleurs Oxbow */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-oxbow-500 to-oxbow-600 rounded-full"></div>
                    <span>Statut des Correspondances</span>
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: 'exact_match', label: 'Correspondance exacte', color: 'from-success-500 to-success-600', icon: '✅' },
                      { value: 'pdf_only', label: 'PDF uniquement', color: 'from-error-500 to-error-600', icon: '🚨' },
                      { value: 'excel_only', label: 'Excel uniquement', color: 'from-warning-500 to-warning-600', icon: '📊' },
                      { value: 'price_mismatch', label: 'Prix différent', color: 'from-oxbow-500 to-oxbow-600', icon: '💰' }
                    ].map(status => (
                      <motion.label 
                        key={status.value} 
                        className="group cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                          filters.status.includes(status.value)
                            ? `bg-gradient-to-r ${status.color} text-white border-transparent shadow-lg`
                            : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 hover:shadow-md'
                        }`}>
                          <input
                            type="checkbox"
                            checked={filters.status.includes(status.value)}
                            onChange={(e) => {
                              const newStatus = e.target.checked
                                ? [...filters.status, status.value]
                                : filters.status.filter(s => s !== status.value);
                              onFiltersChange({ ...filters, status: newStatus });
                            }}
                            className="sr-only"
                          />
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-sm ${
                            filters.status.includes(status.value) ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-600'
                          }`}>
                            {filters.status.includes(status.value) ? <Check className="w-4 h-4" /> : status.icon}
                          </div>
                          <span className={`font-medium ${
                            filters.status.includes(status.value) ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {status.label}
                          </span>
                        </div>
                      </motion.label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-warning-500 to-error-500 rounded-full"></div>
                    <span>Niveau de Sévérité</span>
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: 'high', label: 'Élevée', color: 'from-error-500 to-error-600', icon: '🔴' },
                      { value: 'medium', label: 'Moyenne', color: 'from-warning-500 to-warning-600', icon: '🟡' },
                      { value: 'low', label: 'Faible', color: 'from-success-500 to-success-600', icon: '🟢' }
                    ].map(severity => (
                      <motion.label 
                        key={severity.value} 
                        className="group cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                          filters.severity.includes(severity.value)
                            ? `bg-gradient-to-r ${severity.color} text-white border-transparent shadow-lg`
                            : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 hover:shadow-md'
                        }`}>
                          <input
                            type="checkbox"
                            checked={filters.severity.includes(severity.value)}
                            onChange={(e) => {
                              const newSeverity = e.target.checked
                                ? [...filters.severity, severity.value]
                                : filters.severity.filter(s => s !== severity.value);
                              onFiltersChange({ ...filters, severity: newSeverity });
                            }}
                            className="sr-only"
                          />
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-sm ${
                            filters.severity.includes(severity.value) ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-600'
                          }`}>
                            {filters.severity.includes(severity.value) ? <Check className="w-4 h-4" /> : severity.icon}
                          </div>
                          <span className={`font-medium ${
                            filters.severity.includes(severity.value) ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {severity.label}
                          </span>
                        </div>
                      </motion.label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filtres SS26 Spécifiques - Design Premium avec couleurs Oxbow */}
              {(availableOptions.colors.length > 0 || availableOptions.sizes.length > 0) && (
                <div className="border-t-2 border-gradient-to-r from-oxbow-200 to-oxbow-300 dark:from-oxbow-800 dark:to-oxbow-700 pt-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-r from-oxbow-500 to-oxbow-600 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                      Filtres SS26 Enrichis
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Couleurs Premium */}
                    {availableOptions.colors.length > 0 && (
                      <div className="space-y-4">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                          <Palette className="w-4 h-4 text-oxbow-500" />
                          <span>Couleurs ({availableOptions.colors.length})</span>
                        </label>
                        <div className="bg-white dark:bg-slate-700 rounded-xl border-2 border-gray-200 dark:border-slate-600 p-4 max-h-48 overflow-y-auto custom-scrollbar">
                          <div className="grid grid-cols-2 gap-2">
                            {availableOptions.colors.map(color => (
                              <motion.label 
                                key={color} 
                                className="group cursor-pointer"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className={`flex items-center space-x-2 p-3 rounded-lg transition-all duration-200 ${
                                  filters.colors.includes(color)
                                    ? 'bg-gradient-to-r from-oxbow-500 to-oxbow-600 text-white shadow-lg'
                                    : 'hover:bg-gray-50 dark:hover:bg-slate-600'
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={filters.colors.includes(color)}
                                    onChange={(e) => {
                                      const newColors = e.target.checked
                                        ? [...filters.colors, color]
                                        : filters.colors.filter(c => c !== color);
                                      onFiltersChange({ ...filters, colors: newColors });
                                    }}
                                    className="sr-only"
                                  />
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                    filters.colors.includes(color) ? 'bg-white/20' : 'bg-gray-200 dark:bg-slate-500'
                                  }`}>
                                    {filters.colors.includes(color) && <Check className="w-3 h-3" />}
                                  </div>
                                  <span className={`text-sm font-medium truncate ${
                                    filters.colors.includes(color) ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {color}
                                  </span>
                                </div>
                              </motion.label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tailles Premium */}
                    {availableOptions.sizes.length > 0 && (
                      <div className="space-y-4">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                          <Ruler className="w-4 h-4 text-oxbow-500" />
                          <span>Tailles ({availableOptions.sizes.length})</span>
                        </label>
                        <div className="bg-white dark:bg-slate-700 rounded-xl border-2 border-gray-200 dark:border-slate-600 p-4 max-h-48 overflow-y-auto custom-scrollbar">
                          <div className="grid grid-cols-3 gap-2">
                            {availableOptions.sizes.map(size => (
                              <motion.label 
                                key={size} 
                                className="group cursor-pointer"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <div className={`flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                                  filters.sizes.includes(size)
                                    ? 'bg-gradient-to-r from-oxbow-500 to-oxbow-600 text-white shadow-lg'
                                    : 'hover:bg-gray-50 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600'
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={filters.sizes.includes(size)}
                                    onChange={(e) => {
                                      const newSizes = e.target.checked
                                        ? [...filters.sizes, size]
                                        : filters.sizes.filter(s => s !== size);
                                      onFiltersChange({ ...filters, sizes: newSizes });
                                    }}
                                    className="sr-only"
                                  />
                                  <span className={`text-sm font-bold ${
                                    filters.sizes.includes(size) ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {size}
                                  </span>
                                </div>
                              </motion.label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fournisseurs et Prix - Design Premium avec couleurs Oxbow */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Fournisseurs */}
                {availableOptions.suppliers.length > 0 && (
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-oxbow-500" />
                      <span>Fournisseurs ({availableOptions.suppliers.length})</span>
                    </label>
                    <div className="bg-white dark:bg-slate-700 rounded-xl border-2 border-gray-200 dark:border-slate-600 p-4 max-h-40 overflow-y-auto custom-scrollbar">
                      <div className="space-y-2">
                        {availableOptions.suppliers.map(supplier => (
                          <motion.label 
                            key={supplier} 
                            className="group cursor-pointer block"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <div className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                              filters.suppliers.includes(supplier)
                                ? 'bg-gradient-to-r from-oxbow-500 to-oxbow-600 text-white shadow-lg'
                                : 'hover:bg-gray-50 dark:hover:bg-slate-600'
                            }`}>
                              <input
                                type="checkbox"
                                checked={filters.suppliers.includes(supplier)}
                                onChange={(e) => {
                                  const newSuppliers = e.target.checked
                                    ? [...filters.suppliers, supplier]
                                    : filters.suppliers.filter(s => s !== supplier);
                                  onFiltersChange({ ...filters, suppliers: newSuppliers });
                                }}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                                filters.suppliers.includes(supplier) ? 'bg-white/20' : 'bg-gray-200 dark:bg-slate-500'
                              }`}>
                                {filters.suppliers.includes(supplier) && <Check className="w-3 h-3" />}
                              </div>
                              <span className={`text-sm font-medium truncate ${
                                filters.suppliers.includes(supplier) ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {supplier}
                              </span>
                            </div>
                          </motion.label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Prix et Devise */}
                <div className="space-y-6">
                  {/* Devise */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      💱 Devise
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'ALL', label: 'Toutes', icon: null, color: 'from-gray-500 to-gray-600' },
                        { value: 'EUR', label: 'Euro', icon: Euro, color: 'from-oxbow-500 to-oxbow-600' },
                        { value: 'GBP', label: 'Livre', icon: PoundSterling, color: 'from-success-500 to-success-600' }
                      ].map(currency => (
                        <motion.button
                          key={currency.value}
                          onClick={() => onFiltersChange({ ...filters, currency: currency.value as any })}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex flex-col items-center space-y-2 p-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                            filters.currency === currency.value
                              ? `bg-gradient-to-r ${currency.color} text-white shadow-lg`
                              : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 border-2 border-gray-200 dark:border-slate-600'
                          }`}
                        >
                          {currency.icon && <currency.icon className="w-5 h-5" />}
                          <span>{currency.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Plage de Prix */}
                  {availableOptions.priceRange && (
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        💰 Plage de Prix (€)
                      </label>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Minimum</label>
                            <input
                              type="number"
                              placeholder="Min"
                              value={filters.priceRange?.min || ''}
                              onChange={(e) => {
                                const min = parseFloat(e.target.value) || 0;
                                const max = filters.priceRange?.max || availableOptions.priceRange!.max;
                                onFiltersChange({ 
                                  ...filters, 
                                  priceRange: { min, max }
                                });
                              }}
                              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-oxbow-500/20 focus:border-oxbow-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-all duration-300"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Maximum</label>
                            <input
                              type="number"
                              placeholder="Max"
                              value={filters.priceRange?.max || ''}
                              onChange={(e) => {
                                const max = parseFloat(e.target.value) || availableOptions.priceRange!.max;
                                const min = filters.priceRange?.min || availableOptions.priceRange!.min;
                                onFiltersChange({ 
                                  ...filters, 
                                  priceRange: { min, max }
                                });
                              }}
                              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-oxbow-500/20 focus:border-oxbow-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-all duration-300"
                            />
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-600 px-3 py-2 rounded-lg">
                          Plage disponible: {availableOptions.priceRange.min}€ - {availableOptions.priceRange.max}€
                        </div>
                        {filters.priceRange && (
                          <button
                            onClick={() => onFiltersChange({ ...filters, priceRange: null })}
                            className="text-xs text-oxbow-600 hover:text-oxbow-800 dark:text-oxbow-400 dark:hover:text-oxbow-300 underline font-medium"
                          >
                            Supprimer le filtre prix
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Filtres Sauvegardés Premium avec couleurs Oxbow */}
              {savedFilters.length > 0 && (
                <div className="border-t-2 border-gradient-to-r from-warning-200 to-warning-300 dark:from-warning-800 dark:to-warning-700 pt-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-r from-warning-500 to-warning-600 rounded-xl flex items-center justify-center">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                      Filtres Sauvegardés
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedFilters.map(savedFilter => (
                      <motion.div
                        key={savedFilter.id}
                        className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-700 dark:to-slate-800 rounded-xl p-5 border-2 border-gray-200 dark:border-slate-600 hover:border-warning-300 dark:hover:border-warning-600 transition-all duration-300 group hover:shadow-lg"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                            {savedFilter.name}
                          </h5>
                          <button
                            onClick={() => deleteFilter(savedFilter.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                          {savedFilter.createdAt.toLocaleDateString('fr-FR')}
                        </div>
                        <button
                          onClick={() => loadFilter(savedFilter)}
                          className="w-full px-4 py-2 bg-gradient-to-r from-warning-500 to-warning-600 text-white rounded-lg text-sm font-medium hover:from-warning-600 hover:to-warning-700 transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                          Appliquer
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialog de Sauvegarde Premium avec couleurs Oxbow */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-slate-700"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                  <Save className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Sauvegarder les Filtres
                </h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Nom du filtre
                  </label>
                  <input
                    type="text"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="Ex: Produits rouges taille M"
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-success-500/20 focus:border-success-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-all duration-300"
                    autoFocus
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-300 font-medium"
                  >
                    Annuler
                  </button>
                  <motion.button
                    onClick={saveFilters}
                    disabled={!filterName.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-success-500 to-success-600 text-white rounded-xl hover:from-success-600 hover:to-success-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                  >
                    Sauvegarder
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #2B5CE6, #1d4ed8);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #1d4ed8, #1e40af);
        }
      `}</style>
    </div>
  );
}