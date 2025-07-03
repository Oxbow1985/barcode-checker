export interface BarcodeData {
  barcode: string;
  normalizedBarcode: string;
  source: 'pdf' | 'excel';
  price?: number;
  description?: string;
  rawBarcode?: string; // Original barcode before normalization
  supplier?: string; // Supplier information from Excel
  productReference?: string; // Product reference (e.g., OXV932106)
  
  // 🆕 NOUVEAUX CHAMPS SS26
  priceEuro?: number;      // X300 (€)
  pricePound?: number;     // X350 (£)
  currency?: 'EUR' | 'GBP';
  color?: string;          // lib._coloris
  size?: string;           // Taille
  colorCode?: string;      // Code_coloris
  season?: string;         // Dernière_sais_comm
  creationSeason?: string; // Sais_création_produit
  brandCode?: string;      // Code_Marque
  commercialDelay?: string; // Délai_commercial
}

export interface ComparisonResult {
  barcode: string;
  normalizedBarcode: string;
  pdfData?: BarcodeData;
  excelData?: BarcodeData;
  status: 'match' | 'pdf_only' | 'excel_only' | 'price_mismatch' | 'exact_match';
  discrepancy?: string;
  priceDifference?: number;
  severity: 'low' | 'medium' | 'high';
}

export interface ProcessingState {
  step: 'upload' | 'supplier-validation' | 'processing' | 'results';
  progress: number;
  message: string;
  pdfFile?: File;
  excelFile?: File;
  barcodes: BarcodeData[];
  results: ComparisonResult[];
  detectedSupplier?: SupplierInfo;
  availableSuppliers?: SupplierInfo[];
  selectedSupplier?: SupplierInfo;
  // 🆕 NOUVEAU: Détection du format
  detectedFormat?: 'FW25' | 'SS26' | 'MIXED';
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ComplianceMetrics {
  total: number;
  exactMatches: number;
  priceMismatches: number;
  pdfOnly: number;
  excelOnly: number;
  complianceRate: number;
  errorRate: number;
  averagePriceDifference: number;
  criticalErrors: number;
  supplierName?: string;
  // 🆕 NOUVELLES MÉTRIQUES SS26
  formatDetected?: 'FW25' | 'SS26' | 'MIXED';
  colorDistribution?: { [color: string]: number };
  sizeDistribution?: { [size: string]: number };
  supplierDistribution?: { [supplier: string]: number };
  currencyAnalysis?: {
    eurCount: number;
    gbpCount: number;
    averagePriceEur?: number;
    averagePriceGbp?: number;
    priceDiscrepancies: number;
  };
}

export interface FilterOptions {
  status: string[];
  severity: string[];
  searchTerm: string;
  // 🆕 NOUVEAUX FILTRES SS26
  colors: string[];
  sizes: string[];
  suppliers: string[];
  priceRange: { min: number; max: number } | null;
  currency: 'ALL' | 'EUR' | 'GBP';
}

export interface SupplierInfo {
  id: string;
  name: string;
  productCount: number;
  detectedReferences: string[];
  confidence: number; // 0-1 score based on reference matches
}

export interface ProductReference {
  pattern: string; // e.g., "R2PIVEGA-JP"
  code: string; // e.g., "OXV932106"
  fullReference: string; // e.g., "R2PIVEGA-JP OXV932106"
}