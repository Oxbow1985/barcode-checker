import { BarcodeData, ComparisonResult, ComplianceMetrics } from '../types';
import { normalizeBarcode } from './barcodeNormalizer';

export function compareData(pdfBarcodes: BarcodeData[], excelBarcodes: BarcodeData[]): ComparisonResult[] {
  const results: ComparisonResult[] = [];
  
  // Créer un index des codes Excel pour recherche rapide
  const excelLookup = new Map<string, BarcodeData>();
  const excelLookupRaw = new Map<string, BarcodeData>();
  
  excelBarcodes.forEach(item => {
    excelLookup.set(item.normalizedBarcode, item);
    excelLookupRaw.set(item.barcode, item);
  });
  
  // 🔧 DÉTECTION DU FORMAT
  const hasColorData = excelBarcodes.some(b => b.color);
  const hasSizeData = excelBarcodes.some(b => b.size);
  const hasDualCurrency = excelBarcodes.some(b => b.priceEuro && b.pricePound);
  const formatDetected = (hasColorData && hasSizeData && hasDualCurrency) ? 'SS26' : 'FW25';
  
  console.log(`🎯 Comparaison ${formatDetected}: ${pdfBarcodes.length} codes PDF vs ${excelBarcodes.length} codes Excel`);
  
  const debugInfo = {
    pdfCodesProcessed: 0,
    exactMatches: 0,
    fuzzyMatches: 0,
    notFound: 0,
    missingCodes: [] as string[],
    missingCodesAnalysis: [] as Array<{
      pdfCode: string;
      foundInOtherSupplier?: { supplier: string; price?: number };
      existsInExcel: boolean;
      reason: string;
    }>,
    matchDetails: [] as Array<{
      pdfCode: string;
      excelCode?: string;
      matchType: 'exact' | 'fuzzy' | 'none';
      reason: string;
    }>
  };
  
  const supplierName = excelBarcodes[0]?.supplier || 'Fournisseur inconnu';
  
  // Traiter chaque code PDF avec analyse détaillée
  pdfBarcodes.forEach((pdfData) => {
    debugInfo.pdfCodesProcessed++;
    
    // 1. Recherche exacte par code normalisé
    let excelMatch = excelLookup.get(pdfData.normalizedBarcode);
    let matchType: 'exact' | 'fuzzy' | 'none' = 'none';
    let matchReason = '';
    
    if (excelMatch) {
      matchType = 'exact';
      matchReason = 'Correspondance exacte code normalisé';
      debugInfo.exactMatches++;
    } else {
      // 2. Recherche par code brut
      excelMatch = excelLookupRaw.get(pdfData.barcode);
      if (excelMatch) {
        matchType = 'exact';
        matchReason = 'Correspondance exacte code brut';
        debugInfo.exactMatches++;
      } else {
        // 3. Recherche fuzzy améliorée
        const fuzzyMatch = findFuzzyMatch(pdfData, excelBarcodes);
        if (fuzzyMatch.match) {
          excelMatch = fuzzyMatch.match;
          matchType = 'fuzzy';
          matchReason = fuzzyMatch.reason;
          debugInfo.fuzzyMatches++;
        } else {
          debugInfo.notFound++;
          debugInfo.missingCodes.push(pdfData.barcode);
          matchReason = 'Aucune correspondance trouvée';
          
          const missingAnalysis = analyzeMissingCode(pdfData, excelBarcodes);
          debugInfo.missingCodesAnalysis.push({
            pdfCode: pdfData.barcode,
            foundInOtherSupplier: missingAnalysis.foundInOtherSupplier,
            existsInExcel: missingAnalysis.existsInExcel,
            reason: missingAnalysis.reason
          });
        }
      }
    }
    
    debugInfo.matchDetails.push({
      pdfCode: pdfData.barcode,
      excelCode: excelMatch?.barcode,
      matchType,
      reason: matchReason
    });
    
    if (excelMatch) {
      // 🆕 ENRICHISSEMENT SS26: Créer une description enrichie
      let enrichedDescription = `✅ ${matchReason} chez ${excelMatch.supplier}`;
      
      if (formatDetected === 'SS26' && excelMatch.color && excelMatch.size) {
        enrichedDescription += ` | ${excelMatch.color} - ${excelMatch.size}`;
        if (excelMatch.priceEuro && excelMatch.pricePound) {
          enrichedDescription += ` | ${excelMatch.priceEuro}€ / ${excelMatch.pricePound}£`;
        }
      }
      
      results.push({
        barcode: pdfData.barcode,
        normalizedBarcode: pdfData.normalizedBarcode,
        pdfData,
        excelData: excelMatch,
        status: 'exact_match',
        severity: 'low',
        discrepancy: enrichedDescription
      });
    } else {
      results.push({
        barcode: pdfData.barcode,
        normalizedBarcode: pdfData.normalizedBarcode,
        pdfData,
        status: 'pdf_only',
        severity: 'high',
        discrepancy: `🚨 Code PDF non trouvé chez ${supplierName} - ${matchReason}`
      });
    }
  });
  
  // Ajouter les produits Excel uniquement (limité intelligemment)
  const processedPdfCodes = new Set(pdfBarcodes.map(b => b.normalizedBarcode));
  const MAX_EXCEL_ONLY = formatDetected === 'SS26' ? 100 : 50; // Plus pour SS26
  
  const relevantExcelProducts = excelBarcodes
    .filter(excelData => !processedPdfCodes.has(excelData.normalizedBarcode))
    .sort((a, b) => {
      const priceA = a.price || a.priceEuro || 0;
      const priceB = b.price || b.priceEuro || 0;
      return priceB - priceA;
    })
    .slice(0, MAX_EXCEL_ONLY);
  
  relevantExcelProducts.forEach(excelData => {
    let description = `📊 Produit disponible chez ${excelData.supplier} mais absent du PDF`;
    
    if (formatDetected === 'SS26' && excelData.color && excelData.size) {
      description += ` | ${excelData.color} - ${excelData.size}`;
    }
    
    const price = excelData.priceEuro || excelData.price;
    if (price) {
      description += ` (${price.toFixed(2)}€)`;
    }
    
    results.push({
      barcode: excelData.barcode,
      normalizedBarcode: excelData.normalizedBarcode,
      excelData,
      status: 'excel_only',
      severity: 'low',
      discrepancy: description
    });
  });
  
  // 🔧 LOG DEBUG ENRICHI
  console.group(`🔍 ANALYSE DÉTAILLÉE ${formatDetected} - ${supplierName.toUpperCase()}`);
  console.log(`📊 Codes-barres PDF traités: ${debugInfo.pdfCodesProcessed}`);
  console.log(`✅ Correspondances exactes: ${debugInfo.exactMatches}`);
  console.log(`🔍 Correspondances fuzzy: ${debugInfo.fuzzyMatches}`);
  console.log(`❌ Non trouvés chez ${supplierName}: ${debugInfo.notFound}`);
  console.log(`📋 Produits ${supplierName} supplémentaires: ${relevantExcelProducts.length}`);
  
  if (formatDetected === 'SS26') {
    console.log(`🎨 Couleurs disponibles: ${new Set(excelBarcodes.map(b => b.color).filter(Boolean)).size}`);
    console.log(`📏 Tailles disponibles: ${new Set(excelBarcodes.map(b => b.size).filter(Boolean)).size}`);
    console.log(`💰 Produits avec prix EUR: ${excelBarcodes.filter(b => b.priceEuro).length}`);
    console.log(`💷 Produits avec prix GBP: ${excelBarcodes.filter(b => b.pricePound).length}`);
  }
  
  if (debugInfo.missingCodes.length > 0) {
    console.group(`❌ ${debugInfo.missingCodes.length} codes PDF manquants:`);
    debugInfo.missingCodes.slice(0, 10).forEach((code, index) => {
      console.log(`${index + 1}. ${code}`);
    });
    if (debugInfo.missingCodes.length > 10) {
      console.log(`... et ${debugInfo.missingCodes.length - 10} autres`);
    }
    console.groupEnd();
  }
  
  console.groupEnd();
  
  return results.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

// Fonctions utilitaires inchangées
function analyzeMissingCode(pdfData: BarcodeData, allExcelBarcodes: BarcodeData[]): {
  foundInOtherSupplier?: { supplier: string; price?: number };
  existsInExcel: boolean;
  reason: string;
} {
  const pdfNormalized = pdfData.normalizedBarcode;
  
  const foundInOtherSupplier = allExcelBarcodes.find(excel => 
    excel.normalizedBarcode === pdfNormalized && 
    excel.supplier !== allExcelBarcodes[0]?.supplier
  );
  
  if (foundInOtherSupplier) {
    return {
      foundInOtherSupplier: {
        supplier: foundInOtherSupplier.supplier || 'Fournisseur inconnu',
        price: foundInOtherSupplier.price || foundInOtherSupplier.priceEuro
      },
      existsInExcel: true,
      reason: `Trouvé chez ${foundInOtherSupplier.supplier}`
    };
  }
  
  return {
    existsInExcel: false,
    reason: 'Code totalement absent du fichier Excel'
  };
}

function findFuzzyMatch(pdfData: BarcodeData, excelBarcodes: BarcodeData[]): {
  match: BarcodeData | null;
  reason: string;
} {
  const pdfNormalized = pdfData.normalizedBarcode;
  
  if (pdfNormalized.length > 10) {
    const shortCode = pdfNormalized.substring(1);
    const match = excelBarcodes.find(excel => 
      excel.normalizedBarcode === shortCode || 
      excel.normalizedBarcode.endsWith(shortCode)
    );
    if (match) {
      return { match, reason: 'Correspondance par code tronqué' };
    }
  }
  
  return { match: null, reason: 'Aucune correspondance trouvée' };
}

export function calculateComplianceMetrics(
  results: ComparisonResult[], 
  supplierName?: string,
  originalPdfCount?: number
): ComplianceMetrics {
  const total = results.length;
  const exactMatches = results.filter(r => r.status === 'exact_match').length;
  const priceMismatches = results.filter(r => r.status === 'price_mismatch').length;
  const pdfOnly = results.filter(r => r.status === 'pdf_only').length;
  const excelOnly = results.filter(r => r.status === 'excel_only').length;
  const criticalErrors = results.filter(r => r.severity === 'high').length;
  
  const pdfCodes = originalPdfCount || results.filter(r => r.pdfData).length;
  const foundInExcel = exactMatches + priceMismatches;
  
  const complianceRate = pdfCodes > 0 ? (foundInExcel / pdfCodes) * 100 : 0;
  const errorRate = pdfCodes > 0 ? (pdfOnly / pdfCodes) * 100 : 0;
  
  // 🆕 MÉTRIQUES SS26 ENRICHIES
  const excelData = results.map(r => r.excelData).filter(Boolean) as BarcodeData[];
  
  // Distribution des couleurs
  const colorDistribution: { [color: string]: number } = {};
  excelData.forEach(data => {
    if (data.color) {
      colorDistribution[data.color] = (colorDistribution[data.color] || 0) + 1;
    }
  });
  
  // Distribution des tailles
  const sizeDistribution: { [size: string]: number } = {};
  excelData.forEach(data => {
    if (data.size) {
      sizeDistribution[data.size] = (sizeDistribution[data.size] || 0) + 1;
    }
  });
  
  // Distribution des fournisseurs
  const supplierDistribution: { [supplier: string]: number } = {};
  excelData.forEach(data => {
    if (data.supplier) {
      supplierDistribution[data.supplier] = (supplierDistribution[data.supplier] || 0) + 1;
    }
  });
  
  // Analyse des devises
  const eurProducts = excelData.filter(d => d.priceEuro);
  const gbpProducts = excelData.filter(d => d.pricePound);
  const averagePriceEur = eurProducts.length > 0 
    ? eurProducts.reduce((sum, d) => sum + (d.priceEuro || 0), 0) / eurProducts.length 
    : undefined;
  const averagePriceGbp = gbpProducts.length > 0 
    ? gbpProducts.reduce((sum, d) => sum + (d.pricePound || 0), 0) / gbpProducts.length 
    : undefined;
  
  // Détection du format
  const hasColorData = Object.keys(colorDistribution).length > 0;
  const hasSizeData = Object.keys(sizeDistribution).length > 0;
  const hasDualCurrency = eurProducts.length > 0 && gbpProducts.length > 0;
  const formatDetected = (hasColorData && hasSizeData && hasDualCurrency) ? 'SS26' : 'FW25';
  
  console.log(`📊 MÉTRIQUES ${formatDetected} - ${supplierName}:
  
🎯 CONFORMITÉ:
  - Codes PDF: ${pdfCodes}
  - Trouvés: ${foundInExcel} (${complianceRate.toFixed(1)}%)
  - Manquants: ${pdfOnly} (${errorRate.toFixed(1)}%)
  
${formatDetected === 'SS26' ? `🆕 ENRICHISSEMENT SS26:
  - Couleurs: ${Object.keys(colorDistribution).length}
  - Tailles: ${Object.keys(sizeDistribution).length}
  - Prix EUR: ${eurProducts.length} (moy: ${averagePriceEur?.toFixed(2)}€)
  - Prix GBP: ${gbpProducts.length} (moy: ${averagePriceGbp?.toFixed(2)}£)` : ''}
  
💡 STATUT: ${complianceRate === 100 ? 
    `🎉 PARFAIT! Tous vos codes PDF sont disponibles chez ${supplierName}` :
    `⚠️ ${pdfOnly} codes PDF ne sont pas disponibles chez ${supplierName}`
  }`);
  
  return {
    total,
    exactMatches,
    priceMismatches,
    pdfOnly,
    excelOnly,
    complianceRate,
    errorRate,
    averagePriceDifference: 0,
    criticalErrors,
    supplierName,
    formatDetected,
    colorDistribution,
    sizeDistribution,
    supplierDistribution,
    currencyAnalysis: {
      eurCount: eurProducts.length,
      gbpCount: gbpProducts.length,
      averagePriceEur,
      averagePriceGbp,
      priceDiscrepancies: 0
    }
  };
}

export function filterResults(results: ComparisonResult[], filters: { 
  status: string[]; 
  severity: string[]; 
  searchTerm: string;
  colors?: string[];
  sizes?: string[];
  suppliers?: string[];
  priceRange?: { min: number; max: number } | null;
  currency?: 'ALL' | 'EUR' | 'GBP';
}): ComparisonResult[] {
  return results.filter(result => {
    if (filters.status.length > 0 && !filters.status.includes(result.status)) {
      return false;
    }
    
    if (filters.severity.length > 0 && !filters.severity.includes(result.severity)) {
      return false;
    }
    
    // 🆕 FILTRES SS26
    if (filters.colors && filters.colors.length > 0) {
      const color = result.excelData?.color;
      if (!color || !filters.colors.includes(color)) {
        return false;
      }
    }
    
    if (filters.sizes && filters.sizes.length > 0) {
      const size = result.excelData?.size;
      if (!size || !filters.sizes.includes(size)) {
        return false;
      }
    }
    
    if (filters.suppliers && filters.suppliers.length > 0) {
      const supplier = result.excelData?.supplier;
      if (!supplier || !filters.suppliers.includes(supplier)) {
        return false;
      }
    }
    
    if (filters.priceRange) {
      const price = result.excelData?.priceEuro || result.excelData?.price;
      if (!price || price < filters.priceRange.min || price > filters.priceRange.max) {
        return false;
      }
    }
    
    if (filters.currency && filters.currency !== 'ALL') {
      if (filters.currency === 'EUR' && !result.excelData?.priceEuro) {
        return false;
      }
      if (filters.currency === 'GBP' && !result.excelData?.pricePound) {
        return false;
      }
    }
    
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesBarcode = result.barcode.toLowerCase().includes(searchLower);
      const matchesDescription = result.excelData?.description?.toLowerCase().includes(searchLower);
      const matchesDiscrepancy = result.discrepancy?.toLowerCase().includes(searchLower);
      const matchesSupplier = result.excelData?.supplier?.toLowerCase().includes(searchLower);
      const matchesColor = result.excelData?.color?.toLowerCase().includes(searchLower);
      const matchesSize = result.excelData?.size?.toLowerCase().includes(searchLower);
      const matchesReference = result.excelData?.productReference?.toLowerCase().includes(searchLower);
      
      if (!matchesBarcode && !matchesDescription && !matchesDiscrepancy && 
          !matchesSupplier && !matchesColor && !matchesSize && !matchesReference) {
        return false;
      }
    }
    
    return true;
  });
}