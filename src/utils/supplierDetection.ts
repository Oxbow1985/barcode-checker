import { BarcodeData, SupplierInfo, ProductReference } from '../types';

/**
 * Identification automatique du fournisseur
 */
export function identifySupplier(
  productReferences: ProductReference[],
  excelData: BarcodeData[]
): SupplierInfo | null {
  
  if (productReferences.length === 0) {
    return null;
  }
  
  const suppliers = getAvailableSuppliers(excelData);
  
  // Recherche du fournisseur avec le plus de correspondances
  for (const supplier of suppliers) {
    const supplierData = excelData.filter(row => row.supplier === supplier.name);
    const supplierCodes = supplierData.map(row => row.productReference).filter(Boolean);
    
    let matches = 0;
    const matchedRefs: string[] = [];
    
    productReferences.forEach(ref => {
      if (supplierCodes.some(code => code?.includes(ref.code) || ref.code.includes(code || ''))) {
        matches++;
        matchedRefs.push(ref.code);
      }
    });
    
    if (matches > 0) {
      return {
        ...supplier,
        detectedReferences: matchedRefs,
        confidence: matches / productReferences.length
      };
    }
  }
  
  return null;
}

/**
 * Récupère tous les fournisseurs disponibles
 */
export function getAvailableSuppliers(excelData: BarcodeData[]): SupplierInfo[] {
  const supplierCounts = new Map<string, number>();
  
  excelData.forEach(row => {
    if (row.supplier) {
      supplierCounts.set(row.supplier, (supplierCounts.get(row.supplier) || 0) + 1);
    }
  });
  
  return Array.from(supplierCounts.entries())
    .map(([name, count]) => ({
      id: name.replace(/[^a-zA-Z0-9]/g, '_'),
      name,
      productCount: count,
      detectedReferences: [],
      confidence: 0
    }))
    .sort((a, b) => b.productCount - a.productCount);
}

/**
 * Filtre les données Excel par fournisseur
 */
export function filterExcelBySupplier(
  excelData: BarcodeData[],
  supplier: SupplierInfo
): BarcodeData[] {
  return excelData.filter(row => row.supplier === supplier.name);
}

/**
 * Valide la détection du fournisseur
 */
export function validateSupplierDetection(
  supplier: SupplierInfo,
  totalReferences: number
): {
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low';
  message: string;
} {
  const matchRatio = totalReferences > 0 ? supplier.detectedReferences.length / totalReferences : 0;
  const absoluteMatches = supplier.detectedReferences.length;
  
  if (matchRatio >= 0.5 || absoluteMatches >= 5) {
    return {
      isValid: true,
      confidence: 'high',
      message: `Correspondance excellente (${absoluteMatches} références trouvées)`
    };
  } else if (absoluteMatches >= 1) {
    return {
      isValid: true,
      confidence: 'medium',
      message: `Correspondance partielle (${absoluteMatches} références trouvées)`
    };
  } else {
    return {
      isValid: false,
      confidence: 'low',
      message: `Aucune correspondance trouvée`
    };
  }
}

/**
 * Extraction simplifiée des références produits
 */
export function extractProductReferences(text: string): ProductReference[] {
  const matches = text.match(/([A-Z0-9]{9})/g) || [];
  return matches.map(code => ({
    pattern: 'DIRECT',
    code,
    fullReference: code
  }));
}