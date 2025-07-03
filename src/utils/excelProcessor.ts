import * as XLSX from 'xlsx';
import { BarcodeData } from '../types';
import { normalizeBarcode, isValidBarcodeFormat } from './barcodeNormalizer';

// 🔧 CONFIGURATION ROBUSTE ADAPTÉE SS26
const CONFIG = {
  MAX_ROWS_TO_SCAN: 50,
  MIN_CONFIDENCE_SCORE: 0.6,
  CHUNK_SIZE: 1000,
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  SUPPORTED_ENCODINGS: ['utf-8', 'iso-8859-1', 'windows-1252']
};

// 🎯 DÉTECTEURS DE COLONNES SS26 ENRICHIS
const COLUMN_DETECTORS = {
  barcode: {
    names: [
      // SS26 exact
      'gencod',
      // FW25 et variations
      'code-barres', 'code barre', 'codebarre', 'code_barre',
      'ean', 'ean13', 'ean-13', 'upc', 'gtin', 'gtin13',
      'barcode', 'bar_code', 'bar-code', 'product_code', 'item_code',
      'code', 'code article', 'article_code', 'article-code',
      'référence', 'reference', 'ref', 'sku', 'id', 'identifiant'
    ],
    validator: (value: any) => {
      if (!value) return false;
      const str = value.toString().replace(/[^\d]/g, '');
      return str.length >= 8 && str.length <= 14 && /^\d+$/.test(str);
    },
    confidence: (values: any[]) => {
      const validCount = values.filter(v => COLUMN_DETECTORS.barcode.validator(v)).length;
      return Math.min(1.0, validCount / Math.max(values.length, 1)); // 🔧 CORRECTION: Limiter à 1.0
    }
  },
  
  priceEuro: {
    names: ['x300', 'prix eur', 'price eur', 'euro', 'eur'],
    validator: (value: any) => {
      if (value === null || value === undefined || value === '') return false;
      if (typeof value === 'number') return value >= 0;
      const str = value.toString().replace(/[€$£,\s]/g, '').replace(',', '.');
      const num = parseFloat(str);
      return !isNaN(num) && num >= 0 && num < 10000;
    },
    confidence: (values: any[]) => {
      const validCount = values.filter(v => COLUMN_DETECTORS.priceEuro.validator(v)).length;
      return Math.min(1.0, validCount / Math.max(values.length, 1)); // 🔧 CORRECTION
    }
  },
  
  pricePound: {
    names: ['x350', 'prix gbp', 'price gbp', 'pound', 'gbp'],
    validator: (value: any) => {
      if (value === null || value === undefined || value === '') return false;
      if (typeof value === 'number') return value >= 0;
      const str = value.toString().replace(/[€$£,\s]/g, '').replace(',', '.');
      const num = parseFloat(str);
      return !isNaN(num) && num >= 0 && num < 10000;
    },
    confidence: (values: any[]) => {
      const validCount = values.filter(v => COLUMN_DETECTORS.pricePound.validator(v)).length;
      return Math.min(1.0, validCount / Math.max(values.length, 1)); // 🔧 CORRECTION
    }
  },
  
  price: {
    names: [
      'prix', 'price', 'retail price', 'prix de vente', 'prix_vente',
      'montant', 'coût', 'cout', 'cost', 'tarif', 'tariff',
      'prix unitaire', 'unit price', 'prix_unitaire', 'unit_price',
      'valeur', 'value', 'amount', 'total', 'pvp'
    ],
    validator: (value: any) => {
      if (value === null || value === undefined || value === '') return false;
      if (typeof value === 'number') return value >= 0;
      const str = value.toString().replace(/[€$£,\s]/g, '').replace(',', '.');
      const num = parseFloat(str);
      return !isNaN(num) && num >= 0 && num < 10000;
    },
    confidence: (values: any[]) => {
      const validCount = values.filter(v => COLUMN_DETECTORS.price.validator(v)).length;
      return Math.min(1.0, validCount / Math.max(values.length, 1)); // 🔧 CORRECTION
    }
  },
  
  description: {
    names: [
      // SS26 exact
      'libellé_article', 'libelle_article',
      // Variations
      'description', 'libellé', 'libelle', 'nom', 'name', 'produit', 'product',
      'designation', 'titre', 'title', 'label', 'style', 'modèle', 'modele',
      'article', 'item', 'product_name', 'product-name', 'item_name'
    ],
    validator: (value: any) => {
      if (!value) return false;
      const str = value.toString().trim();
      return str.length > 2 && str.length < 200;
    },
    confidence: (values: any[]) => {
      const validCount = values.filter(v => COLUMN_DETECTORS.description.validator(v)).length;
      return Math.min(1.0, validCount / Math.max(values.length, 1)); // 🔧 CORRECTION
    }
  },
  
  supplier: {
    names: [
      // SS26 exact
      'fournisseur',
      // Variations
      'supplier', 'vendor', 'marque', 'brand', 'fabricant',
      'manufacturer', 'distributeur', 'distributor', 'société', 'societe',
      'company', 'entreprise', 'partenaire', 'partner'
    ],
    validator: (value: any) => {
      if (!value) return false;
      const str = value.toString().trim();
      return str.length > 1 && str.length < 100;
    },
    confidence: (values: any[]) => {
      const validCount = values.filter(v => COLUMN_DETECTORS.supplier.validator(v)).length;
      return Math.min(1.0, validCount / Math.max(values.length, 1)); // 🔧 CORRECTION
    }
  },

  productReference: {
    names: [
      // SS26 exact
      'code_article', 'code article',
      // Variations
      'article code', 'product code', 'reference', 'ref produit',
      'product reference', 'item reference', 'article reference', 'ref article',
      'article_code', 'product_code', 'ref_produit'
    ],
    validator: (value: any) => {
      if (!value) return false;
      const str = value.toString().trim();
      return str.length >= 3 && str.length <= 50 && /[A-Z0-9]/.test(str);
    },
    confidence: (values: any[]) => {
      const validCount = values.filter(v => COLUMN_DETECTORS.productReference.validator(v)).length;
      return Math.min(1.0, validCount / Math.max(values.length, 1)); // 🔧 CORRECTION
    }
  },

  // 🆕 NOUVEAUX DÉTECTEURS SS26
  color: {
    names: ['lib._coloris', 'coloris', 'couleur', 'color', 'lib_coloris'],
    validator: (value: any) => {
      if (!value) return false;
      const str = value.toString().trim();
      return str.length > 1 && str.length < 50;
    },
    confidence: (values: any[]) => {
      const validCount = values.filter(v => COLUMN_DETECTORS.color.validator(v)).length;
      return Math.min(1.0, validCount / Math.max(values.length, 1)); // 🔧 CORRECTION
    }
  },

  size: {
    names: ['taille', 'size'],
    validator: (value: any) => {
      if (!value) return false;
      const str = value.toString().trim();
      return /^(XS|S|M|L|XL|XXL|XXXL|XXXXL|\d+)$/i.test(str) || str.length <= 10;
    },
    confidence: (values: any[]) => {
      const validCount = values.filter(v => COLUMN_DETECTORS.size.validator(v)).length;
      return Math.min(1.0, validCount / Math.max(values.length, 1)); // 🔧 CORRECTION
    }
  },

  colorCode: {
    names: ['code_coloris', 'code coloris', 'color code'],
    validator: (value: any) => {
      if (!value) return false;
      const str = value.toString().trim();
      return str.length >= 1 && str.length <= 20;
    },
    confidence: (values: any[]) => {
      const validCount = values.filter(v => COLUMN_DETECTORS.colorCode.validator(v)).length;
      return Math.min(1.0, validCount / Math.max(values.length, 1)); // 🔧 CORRECTION
    }
  },

  season: {
    names: ['dernière_sais_comm', 'derniere_sais_comm', 'saison', 'season'],
    validator: (value: any) => {
      if (!value) return false;
      const str = value.toString().trim();
      return str.length >= 2 && str.length <= 20;
    },
    confidence: (values: any[]) => {
      const validCount = values.filter(v => COLUMN_DETECTORS.season.validator(v)).length;
      return Math.min(1.0, validCount / Math.max(values.length, 1)); // 🔧 CORRECTION
    }
  },

  creationSeason: {
    names: ['sais_création_produit', 'sais_creation_produit', 'creation season'],
    validator: (value: any) => {
      if (!value) return false;
      const str = value.toString().trim();
      return str.length >= 2 && str.length <= 20;
    },
    confidence: (values: any[]) => {
      const validCount = values.filter(v => COLUMN_DETECTORS.creationSeason.validator(v)).length;
      return Math.min(1.0, validCount / Math.max(values.length, 1)); // 🔧 CORRECTION
    }
  },

  brandCode: {
    names: ['code_marque', 'code marque', 'brand code'],
    validator: (value: any) => {
      if (!value) return false;
      const str = value.toString().trim();
      return str.length >= 1 && str.length <= 20;
    },
    confidence: (values: any[]) => {
      const validCount = values.filter(v => COLUMN_DETECTORS.brandCode.validator(v)).length;
      return Math.min(1.0, validCount / Math.max(values.length, 1)); // 🔧 CORRECTION
    }
  },

  commercialDelay: {
    names: ['délai_commercial', 'delai_commercial', 'commercial delay'],
    validator: (value: any) => {
      if (!value) return false;
      const str = value.toString().trim();
      return str.length >= 1 && str.length <= 50;
    },
    confidence: (values: any[]) => {
      const validCount = values.filter(v => COLUMN_DETECTORS.commercialDelay.validator(v)).length;
      return Math.min(1.0, validCount / Math.max(values.length, 1)); // 🔧 CORRECTION
    }
  }
};

// 🧠 INTERFACE DE DEBUG ENRICHIE
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

// 🔧 FONCTION PRINCIPALE ADAPTÉE SS26
export async function extractDataFromExcel(file: File): Promise<BarcodeData[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // 🎯 PRIORITÉ SS26: "Main sheet" en premier
    const sheetPriorities = [
      'Main sheet', 'Main Sheet', 'MAIN SHEET',  // ✅ NOUVEAU SS26
      'Sheet1', 'Sheet 1', 'AH 25', 'Data', 'Produits'
    ];
    
    let sheetName = '';
    
    // Recherche par priorité
    for (const priority of sheetPriorities) {
      if (workbook.SheetNames.includes(priority)) {
        sheetName = priority;
        break;
      }
    }
    
    // Fallback si aucune priorité trouvée
    if (!sheetName) {
      const dataSheets = workbook.SheetNames.filter(name => 
        !name.toLowerCase().includes('summary') &&
        !name.toLowerCase().includes('config')
      );
      sheetName = dataSheets[0] || workbook.SheetNames[0];
    }
    
    if (!sheetName) {
      throw new Error('Le fichier Excel ne contient aucune feuille de calcul');
    }
    
    console.log(`📊 Feuille sélectionnée: "${sheetName}"`);
    
    const worksheet = workbook.Sheets[sheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      blankrows: false
    }) as any[][];
    
    if (jsonData.length < 2) {
      throw new Error(`La feuille "${sheetName}" doit contenir au moins une ligne d'en-têtes et une ligne de données`);
    }
    
    const barcodes: BarcodeData[] = [];
    
    // 🔍 DÉTECTION INTELLIGENTE DES EN-TÊTES
    let headers: string[] = [];
    let headerRowIndex = -1;
    
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i];
      if (row && row.length > 0) {
        const potentialHeaders = row.map(h => (h || '').toString().toLowerCase().trim());
        
        // Score de qualité pour SS26
        let score = 0;
        if (potentialHeaders.includes('gencod')) score += 5; // SS26 signature
        if (potentialHeaders.includes('code_article')) score += 3;
        if (potentialHeaders.includes('fournisseur')) score += 3;
        if (potentialHeaders.includes('x300')) score += 2; // Prix EUR
        if (potentialHeaders.includes('x350')) score += 2; // Prix GBP
        if (potentialHeaders.includes('lib._coloris')) score += 2;
        if (potentialHeaders.includes('taille')) score += 2;
        
        // Score pour FW25 (rétrocompatibilité)
        if (potentialHeaders.some(h => h.includes('code-barres') || h.includes('barcode'))) score += 3;
        if (potentialHeaders.some(h => h.includes('prix') || h.includes('price'))) score += 2;
        
        if (score >= 5) { // Seuil adaptatif
          headers = potentialHeaders;
          headerRowIndex = i;
          break;
        }
      }
    }
    
    if (headerRowIndex === -1 || headers.length === 0) {
      // Fallback: utiliser la première ligne non vide
      for (let i = 0; i < jsonData.length; i++) {
        if (jsonData[i] && jsonData[i].length > 0) {
          headers = jsonData[i].map(h => (h || '').toString().toLowerCase().trim());
          headerRowIndex = i;
          break;
        }
      }
    }
    
    // 🎯 MAPPING DES COLONNES AVEC PRIORITÉ SS26
    const columnMapping: { [key: string]: number } = {};
    
    // Détection pour chaque type de colonne
    for (const [type, detector] of Object.entries(COLUMN_DETECTORS)) {
      let bestIndex = -1;
      let bestConfidence = 0;
      
      for (let colIndex = 0; colIndex < headers.length; colIndex++) {
        const header = headers[colIndex];
        let confidence = 0;
        
        // Score basé sur le nom exact (priorité SS26)
        const exactMatch = detector.names.find(name => header === name);
        if (exactMatch) {
          confidence += 0.8;
        } else {
          // Score basé sur l'inclusion
          const partialMatch = detector.names.find(name => header.includes(name));
          if (partialMatch) {
            confidence += 0.5;
          }
        }
        
        if (confidence > bestConfidence && confidence >= CONFIG.MIN_CONFIDENCE_SCORE) {
          bestConfidence = confidence;
          bestIndex = colIndex;
        }
      }
      
      if (bestIndex !== -1) {
        columnMapping[type] = bestIndex;
        console.log(`✅ ${type}: "${headers[bestIndex]}" (index ${bestIndex}, confiance: ${(bestConfidence * 100).toFixed(0)}%)`);
      }
    }
    
    // Vérification des colonnes essentielles
    if (columnMapping.barcode === undefined) {
      const allColumns = headers.map((h, i) => `${i}: "${h}"`).join(', ');
      throw new Error(`Colonne code-barres non trouvée.

ANALYSE DU FICHIER:
- Feuille utilisée: "${sheetName}"
- Feuilles disponibles: ${workbook.SheetNames.join(', ')}
- Ligne d'en-têtes détectée: ${headerRowIndex + 1}
- Colonnes détectées: ${allColumns}

COLONNES RECHERCHÉES SS26: "Gencod"
COLONNES RECHERCHÉES FW25: "code-barres", "barcode", "ean"

SOLUTIONS:
1. Vérifiez que la feuille "${sheetName}" contient la colonne "Gencod" (SS26)
2. Ou renommez votre colonne code-barres en "Gencod"
3. Pour FW25: utilisez "code-barres" ou "barcode"`);
    }
    
    // 🏭 TRAITEMENT DES DONNÉES
    const seenBarcodes = new Set<string>();
    let validRowsCount = 0;
    let errorRowsCount = 0;
    
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;
      
      try {
        const rawBarcode = sanitizeInput(row[columnMapping.barcode]?.toString().trim() || '');
        
        if (!rawBarcode || rawBarcode.length < 8) {
          continue;
        }
        
        // Validation spécifique OXBOW
        const cleanBarcode = rawBarcode.replace(/[^\d]/g, '');
        if (!/^\d+$/.test(cleanBarcode) || cleanBarcode.length < 8 || cleanBarcode.length > 14) {
          errorRowsCount++;
          continue;
        }
        
        const normalizedBarcode = normalizeBarcode(rawBarcode);
        
        // Éviter les doublons
        if (seenBarcodes.has(normalizedBarcode)) {
          continue;
        }
        seenBarcodes.add(normalizedBarcode);
        
        // 💰 EXTRACTION DES PRIX (priorité SS26)
        let price: number | undefined;
        let priceEuro: number | undefined;
        let pricePound: number | undefined;
        let currency: 'EUR' | 'GBP' | undefined;
        
        // Prix EUR (X300)
        if (columnMapping.priceEuro !== undefined && row[columnMapping.priceEuro] !== undefined) {
          priceEuro = parsePrice(row[columnMapping.priceEuro]);
        }
        
        // Prix GBP (X350)
        if (columnMapping.pricePound !== undefined && row[columnMapping.pricePound] !== undefined) {
          pricePound = parsePrice(row[columnMapping.pricePound]);
        }
        
        // Prix principal (fallback)
        if (columnMapping.price !== undefined && row[columnMapping.price] !== undefined) {
          price = parsePrice(row[columnMapping.price]);
        }
        
        // Déterminer le prix principal et la devise
        if (priceEuro !== undefined) {
          price = priceEuro;
          currency = 'EUR';
        } else if (pricePound !== undefined) {
          price = pricePound;
          currency = 'GBP';
        }
        
        // 📝 EXTRACTION DES MÉTADONNÉES SS26
        const description = columnMapping.description !== undefined && row[columnMapping.description]
          ? sanitizeInput(row[columnMapping.description].toString().trim())
          : undefined;
        
        const supplier = columnMapping.supplier !== undefined && row[columnMapping.supplier]
          ? sanitizeInput(row[columnMapping.supplier].toString().trim())
          : undefined;
        
        const productReference = columnMapping.productReference !== undefined && row[columnMapping.productReference]
          ? sanitizeInput(row[columnMapping.productReference].toString().trim())
          : undefined;
        
        const color = columnMapping.color !== undefined && row[columnMapping.color]
          ? sanitizeInput(row[columnMapping.color].toString().trim())
          : undefined;
        
        const size = columnMapping.size !== undefined && row[columnMapping.size]
          ? sanitizeInput(row[columnMapping.size].toString().trim())
          : undefined;
        
        const colorCode = columnMapping.colorCode !== undefined && row[columnMapping.colorCode]
          ? sanitizeInput(row[columnMapping.colorCode].toString().trim())
          : undefined;
        
        const season = columnMapping.season !== undefined && row[columnMapping.season]
          ? sanitizeInput(row[columnMapping.season].toString().trim())
          : undefined;
        
        const creationSeason = columnMapping.creationSeason !== undefined && row[columnMapping.creationSeason]
          ? sanitizeInput(row[columnMapping.creationSeason].toString().trim())
          : undefined;
        
        const brandCode = columnMapping.brandCode !== undefined && row[columnMapping.brandCode]
          ? sanitizeInput(row[columnMapping.brandCode].toString().trim())
          : undefined;
        
        const commercialDelay = columnMapping.commercialDelay !== undefined && row[columnMapping.commercialDelay]
          ? sanitizeInput(row[columnMapping.commercialDelay].toString().trim())
          : undefined;
        
        // 🎯 CRÉATION DE L'OBJET ENRICHI
        const barcodeData: BarcodeData = {
          barcode: rawBarcode,
          normalizedBarcode,
          source: 'excel',
          rawBarcode,
          
          // Prix
          price,
          priceEuro,
          pricePound,
          currency,
          
          // Métadonnées de base
          description,
          supplier,
          productReference,
          
          // Métadonnées SS26
          color,
          size,
          colorCode,
          season,
          creationSeason,
          brandCode,
          commercialDelay
        };
        
        barcodes.push(barcodeData);
        validRowsCount++;
        
      } catch (error) {
        errorRowsCount++;
        console.warn(`Erreur ligne ${i + 1}:`, error);
      }
    }
    
    // 📊 DÉTECTION DU FORMAT
    const hasColorData = barcodes.some(b => b.color);
    const hasSizeData = barcodes.some(b => b.size);
    const hasDualCurrency = barcodes.some(b => b.priceEuro && b.pricePound);
    
    const formatDetected = (hasColorData && hasSizeData && hasDualCurrency) ? 'SS26' : 'FW25';
    
    console.group(`📊 EXTRACTION EXCEL ${formatDetected} - SUCCÈS`);
    console.log(`✅ Format détecté: ${formatDetected}`);
    console.log(`📄 Feuille: "${sheetName}"`);
    console.log(`📊 Codes-barres extraits: ${barcodes.length}`);
    console.log(`✅ Lignes valides: ${validRowsCount}`);
    console.log(`❌ Lignes avec erreurs: ${errorRowsCount}`);
    
    if (formatDetected === 'SS26') {
      console.log(`🎨 Couleurs détectées: ${new Set(barcodes.map(b => b.color).filter(Boolean)).size}`);
      console.log(`📏 Tailles détectées: ${new Set(barcodes.map(b => b.size).filter(Boolean)).size}`);
      console.log(`🏢 Fournisseurs détectés: ${new Set(barcodes.map(b => b.supplier).filter(Boolean)).size}`);
      console.log(`💰 Produits avec prix EUR: ${barcodes.filter(b => b.priceEuro).length}`);
      console.log(`💷 Produits avec prix GBP: ${barcodes.filter(b => b.pricePound).length}`);
    }
    
    console.groupEnd();
    
    if (barcodes.length === 0) {
      throw new Error(`Aucun code-barres valide trouvé dans la feuille "${sheetName}".

ANALYSE:
- Format détecté: ${formatDetected}
- Feuille utilisée: "${sheetName}"
- Colonne code-barres: "${headers[columnMapping.barcode]}" (index ${columnMapping.barcode})
- Lignes traitées: ${validRowsCount + errorRowsCount}
- Erreurs: ${errorRowsCount}

VÉRIFICATIONS:
1. Les codes-barres doivent être numériques (ex: 3605168507131)
2. Longueur: 8-14 chiffres
3. Format SS26: colonne "Gencod"
4. Format FW25: colonne "code-barres" ou "barcode"`);
    }
    
    return barcodes;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Erreur lors de l'analyse du fichier Excel: ${error.message}`);
    }
    throw new Error('Erreur inconnue lors de l\'analyse du fichier Excel');
  }
}

// 🔧 FONCTION AVEC DEBUG RÉEL - CORRIGÉE
export async function extractDataFromExcelWithDebug(file: File): Promise<{
  data: BarcodeData[];
  debug: DebugInfo;
}> {
  const startTime = performance.now();
  const debug: DebugInfo = {
    fileAnalysis: {
      fileName: file.name,
      fileSize: file.size,
      sheets: [],
      selectedSheet: '',
      encoding: 'utf-8',
      processingTime: 0
    },
    columnDetection: {},
    dataQuality: {
      totalRows: 0,
      validRows: 0,
      emptyRows: 0,
      errorRows: 0,
      duplicates: 0,
      qualityScore: 0
    },
    performance: {
      parseTime: 0,
      processTime: 0,
      memoryUsage: '0 MB',
      chunksProcessed: 0
    },
    warnings: [],
    errors: [],
    suggestions: []
  };

  try {
    // 🛡️ VALIDATION PRÉLIMINAIRE
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      throw new Error(`Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum autorisé: ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // 📊 LECTURE ROBUSTE DU FICHIER
    const parseStartTime = performance.now();
    const arrayBuffer = await file.arrayBuffer();
    
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(arrayBuffer, { 
        type: 'array',
        cellDates: true,
        cellNF: false,
        cellText: false,
        raw: false,
        codepage: 65001 // UTF-8
      });
    } catch (error) {
      debug.warnings.push('Tentative de lecture avec encodage alternatif');
      workbook = XLSX.read(arrayBuffer, { 
        type: 'array',
        codepage: 1252 // Windows-1252
      });
      debug.fileAnalysis.encoding = 'windows-1252';
    }
    
    debug.performance.parseTime = performance.now() - parseStartTime;
    debug.fileAnalysis.sheets = workbook.SheetNames;

    // 🎯 SÉLECTION INTELLIGENTE DE LA FEUILLE
    const selectedSheet = selectBestSheet(workbook, debug);
    debug.fileAnalysis.selectedSheet = selectedSheet;
    
    if (!selectedSheet) {
      throw new Error('Aucune feuille de calcul valide trouvée dans le fichier');
    }

    const worksheet = workbook.Sheets[selectedSheet];
    
    // 📋 CONVERSION EN DONNÉES BRUTES
    const rawData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: null,
      blankrows: false,
      raw: false
    }) as any[][];

    if (rawData.length < 2) {
      throw new Error(`La feuille "${selectedSheet}" doit contenir au moins une ligne d'en-têtes et une ligne de données`);
    }

    debug.dataQuality.totalRows = rawData.length;

    // 🔍 DÉTECTION INTELLIGENTE DES COLONNES
    const processStartTime = performance.now();
    const columnMapping = detectColumns(rawData, debug);
    
    if (!columnMapping.barcode) {
      throw new Error(generateColumnError(debug));
    }

    // 🏭 TRAITEMENT PAR CHUNKS
    const barcodes = await processDataInChunks(rawData, columnMapping, debug);
    
    debug.performance.processTime = performance.now() - processStartTime;
    debug.fileAnalysis.processingTime = performance.now() - startTime;
    debug.performance.memoryUsage = `${(performance.memory?.usedJSHeapSize / 1024 / 1024 || 0).toFixed(1)} MB`;

    // 📊 CALCUL DU SCORE QUALITÉ
    calculateQualityScore(debug);
    
    // 💡 GÉNÉRATION DE SUGGESTIONS
    generateSuggestions(debug, barcodes.length);

    if (barcodes.length === 0) {
      throw new Error(generateNoDataError(debug));
    }

    return { data: barcodes, debug };

  } catch (error) {
    debug.errors.push(error instanceof Error ? error.message : 'Erreur inconnue');
    debug.fileAnalysis.processingTime = performance.now() - startTime;
    
    if (error instanceof Error) {
      throw new Error(`Erreur lors de l'analyse du fichier Excel: ${error.message}`);
    }
    throw new Error('Erreur inconnue lors de l\'analyse du fichier Excel');
  }
}

// 🎯 SÉLECTION INTELLIGENTE DE LA FEUILLE
function selectBestSheet(workbook: XLSX.WorkBook, debug: DebugInfo): string {
  const sheets = workbook.SheetNames;
  
  // Priorités de sélection SS26
  const priorities = [
    /^(Main\s*sheet|Main\s*Sheet|MAIN\s*SHEET)$/i, // SS26
    /^(AH\s*25|AH25)$/i, // FW25
    /^(data|données|produits?|articles?)$/i,
    /^(sheet1?|feuil1?)$/i,
    /^(?!.*summary|résumé|total).*$/i
  ];

  for (const priority of priorities) {
    const match = sheets.find(name => priority.test(name));
    if (match) {
      debug.suggestions.push(`Feuille sélectionnée automatiquement: "${match}"`);
      return match;
    }
  }

  // Analyse du contenu pour choisir la meilleure feuille
  let bestSheet = '';
  let bestScore = 0;

  for (const sheetName of sheets) {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][];
    
    if (data.length < 2) continue;

    let score = 0;
    const headers = (data[0] || []).map((h: any) => (h || '').toString().toLowerCase());
    
    // Score SS26
    if (headers.includes('gencod')) score += 15;
    if (headers.includes('x300')) score += 10;
    if (headers.includes('x350')) score += 10;
    if (headers.includes('lib._coloris')) score += 8;
    if (headers.includes('taille')) score += 8;
    if (headers.includes('fournisseur')) score += 5;
    
    // Score FW25 (rétrocompatibilité)
    if (headers.some(h => COLUMN_DETECTORS.barcode.names.some(name => h.includes(name)))) score += 10;
    if (headers.some(h => COLUMN_DETECTORS.price.names.some(name => h.includes(name)))) score += 5;
    if (headers.some(h => COLUMN_DETECTORS.supplier.names.some(name => h.includes(name)))) score += 5;
    
    // Bonus pour le nombre de lignes
    score += Math.min(data.length / 100, 5);
    
    if (score > bestScore) {
      bestScore = score;
      bestSheet = sheetName;
    }
  }

  return bestSheet || sheets[0];
}

// 🔍 DÉTECTION INTELLIGENTE DES COLONNES - CORRIGÉE
function detectColumns(rawData: any[][], debug: DebugInfo): { [key: string]: number } {
  const mapping: { [key: string]: number } = {};
  
  // Recherche des en-têtes dans les 10 premières lignes
  let headerRow = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue;

    const potentialHeaders = row.map((h: any) => (h || '').toString().toLowerCase().trim());
    
    // Score de qualité des en-têtes SS26
    let headerScore = 0;
    
    // Signatures SS26
    if (potentialHeaders.includes('gencod')) headerScore += 5;
    if (potentialHeaders.includes('x300')) headerScore += 3;
    if (potentialHeaders.includes('x350')) headerScore += 3;
    if (potentialHeaders.includes('lib._coloris')) headerScore += 2;
    if (potentialHeaders.includes('taille')) headerScore += 2;
    if (potentialHeaders.includes('fournisseur')) headerScore += 2;
    
    // Signatures FW25
    if (potentialHeaders.some(h => h.includes('code-barres') || h.includes('barcode'))) headerScore += 3;
    if (potentialHeaders.some(h => h.includes('prix') || h.includes('price'))) headerScore += 2;
    
    if (headerScore >= 3) { // Seuil adaptatif
      headerRow = i;
      headers = potentialHeaders;
      break;
    }
  }

  if (headerRow === -1) {
    debug.warnings.push('Aucune ligne d\'en-têtes claire détectée, utilisation de la première ligne');
    headerRow = 0;
    headers = (rawData[0] || []).map((h: any) => (h || '').toString().toLowerCase().trim());
  }

  // Échantillonnage des données pour validation
  const sampleData = rawData.slice(headerRow + 1, headerRow + 21); // 20 lignes d'échantillon

  // Détection pour chaque type de colonne
  for (const [type, detector] of Object.entries(COLUMN_DETECTORS)) {
    let bestIndex = -1;
    let bestConfidence = 0;
    const alternatives: Array<{ name: string; index: number; confidence: number }> = [];

    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const header = headers[colIndex];
      let confidence = 0;

      // Score basé sur le nom de la colonne (priorité exacte SS26)
      const exactMatch = detector.names.find(name => header === name);
      if (exactMatch) {
        confidence += 0.8;
      } else {
        const partialMatch = detector.names.find(name => header.includes(name));
        if (partialMatch) {
          confidence += 0.5;
        }
      }

      // Score basé sur le contenu des données
      const columnValues = sampleData.map(row => row?.[colIndex]).filter(v => v !== null && v !== undefined);
      if (columnValues.length > 0) {
        const dataConfidence = detector.confidence(columnValues);
        confidence += dataConfidence * 0.5;
      }

      // 🔧 CORRECTION: Limiter la confiance à 1.0 maximum
      confidence = Math.min(1.0, confidence);

      alternatives.push({
        name: header,
        index: colIndex,
        confidence: Math.round(confidence * 100) / 100
      });

      if (confidence > bestConfidence && confidence >= CONFIG.MIN_CONFIDENCE_SCORE) {
        bestConfidence = confidence;
        bestIndex = colIndex;
      }
    }

    // Tri des alternatives par confiance
    alternatives.sort((a, b) => b.confidence - a.confidence);

    debug.columnDetection[type] = {
      detected: bestIndex !== -1,
      columnIndex: bestIndex,
      columnName: bestIndex !== -1 ? headers[bestIndex] : '',
      confidence: Math.round(bestConfidence * 100) / 100, // 🔧 CORRECTION: Affichage en pourcentage correct
      alternatives: alternatives.slice(0, 3) // Top 3 alternatives
    };

    if (bestIndex !== -1) {
      mapping[type] = bestIndex;
    }
  }

  return mapping;
}

// 🏭 TRAITEMENT PAR CHUNKS
async function processDataInChunks(
  rawData: any[][],
  columnMapping: { [key: string]: number },
  debug: DebugInfo
): Promise<BarcodeData[]> {
  const barcodes: BarcodeData[] = [];
  const seenBarcodes = new Set<string>();
  const headerRowIndex = 0; // Supposé trouvé précédemment
  
  const dataRows = rawData.slice(headerRowIndex + 1);
  const chunks = [];
  
  // Découpage en chunks
  for (let i = 0; i < dataRows.length; i += CONFIG.CHUNK_SIZE) {
    chunks.push(dataRows.slice(i, i + CONFIG.CHUNK_SIZE));
  }

  debug.performance.chunksProcessed = chunks.length;

  for (const chunk of chunks) {
    for (const row of chunk) {
      if (!row || row.length === 0) {
        debug.dataQuality.emptyRows++;
        continue;
      }

      try {
        const barcodeValue = row[columnMapping.barcode];
        
        if (!barcodeValue) {
          debug.dataQuality.emptyRows++;
          continue;
        }

        const rawBarcode = sanitizeInput(barcodeValue.toString().trim());
        
        // Validation robuste du code-barres
        if (!isValidBarcodeCandidate(rawBarcode)) {
          debug.dataQuality.errorRows++;
          continue;
        }

        const normalizedBarcode = normalizeBarcode(rawBarcode);
        
        // Détection des doublons
        if (seenBarcodes.has(normalizedBarcode)) {
          debug.dataQuality.duplicates++;
          continue;
        }
        seenBarcodes.add(normalizedBarcode);

        // Extraction des autres données avec gestion d'erreur
        let price: number | undefined;
        let priceEuro: number | undefined;
        let pricePound: number | undefined;
        let currency: 'EUR' | 'GBP' | undefined;
        
        // Prix EUR (X300)
        if (columnMapping.priceEuro !== undefined && row[columnMapping.priceEuro] !== undefined) {
          priceEuro = parsePrice(row[columnMapping.priceEuro]);
        }
        
        // Prix GBP (X350)
        if (columnMapping.pricePound !== undefined && row[columnMapping.pricePound] !== undefined) {
          pricePound = parsePrice(row[columnMapping.pricePound]);
        }
        
        // Prix principal (fallback)
        if (columnMapping.price !== undefined && row[columnMapping.price] !== undefined) {
          price = parsePrice(row[columnMapping.price]);
        }
        
        // Déterminer le prix principal et la devise
        if (priceEuro !== undefined) {
          price = priceEuro;
          currency = 'EUR';
        } else if (pricePound !== undefined) {
          price = pricePound;
          currency = 'GBP';
        }

        const description = columnMapping.description !== undefined && row[columnMapping.description]
          ? sanitizeInput(row[columnMapping.description].toString().trim())
          : undefined;

        const supplier = columnMapping.supplier !== undefined && row[columnMapping.supplier]
          ? sanitizeInput(row[columnMapping.supplier].toString().trim())
          : undefined;

        const productReference = columnMapping.productReference !== undefined && row[columnMapping.productReference]
          ? sanitizeInput(row[columnMapping.productReference].toString().trim())
          : undefined;

        const color = columnMapping.color !== undefined && row[columnMapping.color]
          ? sanitizeInput(row[columnMapping.color].toString().trim())
          : undefined;

        const size = columnMapping.size !== undefined && row[columnMapping.size]
          ? sanitizeInput(row[columnMapping.size].toString().trim())
          : undefined;

        const colorCode = columnMapping.colorCode !== undefined && row[columnMapping.colorCode]
          ? sanitizeInput(row[columnMapping.colorCode].toString().trim())
          : undefined;

        const season = columnMapping.season !== undefined && row[columnMapping.season]
          ? sanitizeInput(row[columnMapping.season].toString().trim())
          : undefined;

        const creationSeason = columnMapping.creationSeason !== undefined && row[columnMapping.creationSeason]
          ? sanitizeInput(row[columnMapping.creationSeason].toString().trim())
          : undefined;

        const brandCode = columnMapping.brandCode !== undefined && row[columnMapping.brandCode]
          ? sanitizeInput(row[columnMapping.brandCode].toString().trim())
          : undefined;

        const commercialDelay = columnMapping.commercialDelay !== undefined && row[columnMapping.commercialDelay]
          ? sanitizeInput(row[columnMapping.commercialDelay].toString().trim())
          : undefined;

        barcodes.push({
          barcode: rawBarcode,
          normalizedBarcode,
          source: 'excel',
          price,
          priceEuro,
          pricePound,
          currency,
          description,
          supplier,
          productReference,
          color,
          size,
          colorCode,
          season,
          creationSeason,
          brandCode,
          commercialDelay,
          rawBarcode
        });

        debug.dataQuality.validRows++;

      } catch (error) {
        debug.dataQuality.errorRows++;
        debug.warnings.push(`Erreur ligne ${rawData.indexOf(row) + 1}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }

    // Pause pour éviter de bloquer l'UI
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return barcodes;
}

// 🛡️ VALIDATION ROBUSTE DES CODES-BARRES
function isValidBarcodeCandidate(barcode: string): boolean {
  if (!barcode || typeof barcode !== 'string') return false;
  
  // Nettoyage et validation
  const cleaned = barcode.replace(/[^\d]/g, '');
  
  // Longueurs acceptables
  const validLengths = [8, 12, 13, 14];
  
  return validLengths.includes(cleaned.length) && 
         /^\d+$/.test(cleaned) &&
         cleaned !== '0'.repeat(cleaned.length); // Éviter les codes vides
}

// 💰 PARSING ROBUSTE DES PRIX
function parsePrice(value: any): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  
  if (typeof value === 'number') {
    return value >= 0 && value < 10000 ? value : undefined;
  }
  
  if (typeof value === 'string') {
    // Nettoyage robuste
    const cleaned = value
      .replace(/[€$£¥₹]/g, '') // Symboles monétaires
      .replace(/[,\s]/g, '') // Virgules et espaces
      .replace(/\.(?=.*\.)/g, '') // Multiples points (garder le dernier)
      .trim();
    
    const parsed = parseFloat(cleaned);
    return !isNaN(parsed) && parsed >= 0 && parsed < 10000 ? parsed : undefined;
  }
  
  return undefined;
}

// 📊 CALCUL DU SCORE QUALITÉ
function calculateQualityScore(debug: DebugInfo): void {
  const total = debug.dataQuality.totalRows;
  const valid = debug.dataQuality.validRows;
  const errors = debug.dataQuality.errorRows;
  const empty = debug.dataQuality.emptyRows;
  
  if (total === 0) {
    debug.dataQuality.qualityScore = 0;
    return;
  }
  
  // Score basé sur plusieurs facteurs
  const validRatio = valid / total;
  const errorRatio = errors / total;
  const emptyRatio = empty / total;
  
  let score = validRatio * 100;
  score -= errorRatio * 50; // Pénalité pour les erreurs
  score -= emptyRatio * 20; // Pénalité légère pour les lignes vides
  
  // Bonus pour détection de colonnes
  const detectedColumns = Object.values(debug.columnDetection).filter(col => col.detected).length;
  score += detectedColumns * 5;
  
  debug.dataQuality.qualityScore = Math.max(0, Math.min(100, Math.round(score)));
}

// 💡 GÉNÉRATION DE SUGGESTIONS - AMÉLIORÉE
function generateSuggestions(debug: DebugInfo, resultCount: number): void {
  const suggestions = debug.suggestions;
  
  // Détection du format
  const detectedColumns = Object.keys(debug.columnDetection).filter(
    key => debug.columnDetection[key].detected
  );
  
  const hasColorColumn = detectedColumns.includes('color');
  const hasSizeColumn = detectedColumns.includes('size');
  const hasPriceEuroColumn = detectedColumns.includes('priceEuro');
  const hasPricePoundColumn = detectedColumns.includes('pricePound');
  
  if (hasColorColumn && hasSizeColumn && hasPriceEuroColumn && hasPricePoundColumn) {
    suggestions.push('🎯 Format SS26 détecté avec couleurs, tailles et prix multi-devises');
  } else if (detectedColumns.includes('barcode') && detectedColumns.includes('price')) {
    suggestions.push('📊 Format FW25 détecté - Compatibilité rétroactive assurée');
  }
  
  // Suggestions basées sur la qualité
  if (debug.dataQuality.qualityScore < 70) {
    suggestions.push('⚠️ Qualité des données faible - Vérifiez le format du fichier');
  }
  
  if (debug.dataQuality.errorRows > debug.dataQuality.validRows * 0.1) {
    suggestions.push('🔧 Beaucoup d\'erreurs détectées - Vérifiez les formats de données');
  }
  
  if (debug.dataQuality.duplicates > 0) {
    suggestions.push(`🔄 ${debug.dataQuality.duplicates} doublons supprimés automatiquement`);
  }
  
  // 🔧 AMÉLIORATION: Filtrer les colonnes non essentielles pour SS26
  const essentialSS26Columns = ['barcode', 'priceEuro', 'pricePound', 'color', 'size', 'supplier', 'description', 'productReference'];
  const nonEssentialColumns = ['price', 'commercialDelay']; // Ces colonnes ne sont pas critiques pour SS26
  
  const missingColumns = Object.entries(debug.columnDetection)
    .filter(([type, col]) => !col.detected && !nonEssentialColumns.includes(type))
    .map(([type, _]) => type);
  
  if (missingColumns.length > 0) {
    suggestions.push(`📋 Colonnes non détectées: ${missingColumns.join(', ')}`);
  }
  
  // Suggestions de performance
  if (debug.performance.processingTime > 5000) {
    suggestions.push('⚡ Fichier volumineux - Considérez le découpage en plusieurs fichiers');
  }
  
  if (resultCount === 0) {
    suggestions.push('❌ Aucune donnée extraite - Vérifiez le format et les colonnes');
  } else if (resultCount < 10) {
    suggestions.push('⚠️ Peu de données extraites - Vérifiez la feuille sélectionnée');
  }
}

// 🚨 GÉNÉRATION D'ERREURS DÉTAILLÉES
function generateColumnError(debug: DebugInfo): string {
  const barcodeDetection = debug.columnDetection.barcode;
  
  let error = `Colonne code-barres non trouvée.\n\n`;
  error += `📊 ANALYSE DU FICHIER:\n`;
  error += `- Feuille utilisée: "${debug.fileAnalysis.selectedSheet}"\n`;
  error += `- Feuilles disponibles: ${debug.fileAnalysis.sheets.join(', ')}\n`;
  error += `- Lignes analysées: ${debug.dataQuality.totalRows}\n\n`;
  
  if (barcodeDetection?.alternatives.length > 0) {
    error += `🔍 COLONNES CANDIDATES TROUVÉES:\n`;
    barcodeDetection.alternatives.forEach((alt, i) => {
      error += `${i + 1}. "${alt.name}" (confiance: ${(alt.confidence * 100).toFixed(0)}%)\n`;
    });
    error += `\n`;
  }
  
  error += `✅ SOLUTIONS POSSIBLES:\n`;
  error += `1. Format SS26: Renommez une colonne en "Gencod"\n`;
  error += `2. Format FW25: Renommez une colonne en "code-barres" ou "barcode"\n`;
  error += `3. Vérifiez que la feuille "${debug.fileAnalysis.selectedSheet}" contient les bonnes données\n`;
  error += `4. Assurez-vous que les codes-barres sont au format numérique (ex: 3605168507131)\n`;
  
  return error;
}

function generateNoDataError(debug: DebugInfo): string {
  let error = `Aucun code-barres valide trouvé.\n\n`;
  error += `📊 STATISTIQUES:\n`;
  error += `- Lignes totales: ${debug.dataQuality.totalRows}\n`;
  error += `- Lignes valides: ${debug.dataQuality.validRows}\n`;
  error += `- Lignes avec erreurs: ${debug.dataQuality.errorRows}\n`;
  error += `- Lignes vides: ${debug.dataQuality.emptyRows}\n`;
  error += `- Score qualité: ${debug.dataQuality.qualityScore}%\n\n`;
  
  error += `🔧 VÉRIFICATIONS:\n`;
  error += `1. Les codes-barres doivent être entièrement numériques\n`;
  error += `2. Longueur acceptée: 8, 12, 13 ou 14 chiffres\n`;
  error += `3. Format attendu: 3605168654224, 3605168632215, etc.\n`;
  
  return error;
}

// 🔧 FONCTIONS UTILITAIRES (inchangées)
function findColumnIndex(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = headers.findIndex(header => 
      header && header.toLowerCase().includes(name.toLowerCase())
    );
    if (index !== -1) return index;
  }
  return -1;
}

function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[<>\"'&]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
}