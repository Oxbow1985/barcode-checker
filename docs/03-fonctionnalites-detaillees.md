# 3. Fonctionnalités Détaillées

## 3.1 Upload et Validation de Fichiers

### Interface Drag-and-Drop Avancée

#### Fonctionnalité
Interface utilisateur intuitive avec zones de dépôt distinctes pour PDF et Excel, validation en temps réel et feedback visuel immédiat.

#### Workflow Technique
```typescript
// 1. Validation côté client multi-niveaux
export function validatePdfFile(file: File): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Validation MIME type
  if (!file.type.includes('pdf')) {
    errors.push({ field: 'pdf', message: 'Format PDF requis' });
  }
  
  // Validation taille (50MB max)
  if (file.size > 50 * 1024 * 1024) {
    errors.push({ field: 'pdf', message: 'Fichier trop volumineux (max 50MB)' });
  }
  
  // Validation taille minimum (éviter fichiers vides)
  if (file.size < 1024) {
    errors.push({ field: 'pdf', message: 'Fichier semble corrompu ou vide' });
  }
  
  return errors;
}

// 2. Validation signature fichier (sécurité)
export async function validateFileSignature(file: File, type: 'pdf' | 'excel') {
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  const signatures = {
    pdf: [[0x25, 0x50, 0x44, 0x46]], // %PDF
    excel: [
      [0x50, 0x4B, 0x03, 0x04],      // ZIP (XLSX)
      [0xD0, 0xCF, 0x11, 0xE0]       // OLE2 (XLS)
    ]
  };
  
  return signatures[type].some(signature => 
    signature.every((byte, index) => bytes[index] === byte)
  );
}

// 3. Composant React avec gestion d'état
function FileUploadZone({ onFileSelect, accept, maxSize, title, errors }) {
  const [dragActive, setDragActive] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setIsValidating(true);

      try {
        // Validation signature pour sécurité
        const fileType = accept.includes('pdf') ? 'pdf' : 'excel';
        const isValidSignature = await validateFileSignature(selectedFile, fileType);
        
        if (!isValidSignature) {
          toast.error('Format de fichier non valide ou corrompu');
          return;
        }

        onFileSelect(selectedFile);
        toast.success(`Fichier ${selectedFile.name} sélectionné avec succès`);
      } catch (error) {
        toast.error('Erreur lors de la validation du fichier');
      } finally {
        setIsValidating(false);
      }
    }
  }, [onFileSelect, accept]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { [accept]: [] },
    maxSize,
    multiple: false,
    disabled: isProcessing
  });

  return (
    <motion.div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
        transition-all duration-300 ease-in-out
        ${isDragActive || dragActive
          ? 'border-oxbow-400 bg-oxbow-50 scale-[1.02]'
          : errors.length > 0
          ? 'border-error-300 bg-error-50 hover:border-error-400'
          : 'border-gray-300 bg-white hover:border-oxbow-300 hover:bg-oxbow-50'
        }
      `}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <input {...getInputProps()} />
      {/* Interface utilisateur avec feedback visuel */}
    </motion.div>
  );
}
```

#### Logique Métier
- **Validation multi-niveaux** : MIME type → Taille → Signature binaire
- **Feedback temps réel** : Erreurs affichées instantanément
- **Sécurité renforcée** : Prévention upload de fichiers malveillants
- **UX optimisée** : Animations et états visuels clairs

## 3.2 Extraction PDF Universelle

### Algorithme d'Extraction Robuste

#### Patterns Universels OXBOW
```typescript
export async function extractBarcodesFromPdf(file: File) {
  // 1. Patterns universels pour tous formats OXBOW
  const universalPatterns = [
    { name: 'FW25', pattern: /3\s*605\s*168\s*\d{6}/g },
    { name: 'SS26', pattern: /3\s*6051\s*68\s*\d{6}/g },
    { name: 'Complet', pattern: /3605168\d{6}/g },
    { name: 'Ultra-flexible', pattern: /3\s*6\s*0\s*5\s*1\s*6\s*8\s*\d{6}/g }
  ];
  
  // 2. Extraction texte page par page (optimisation mémoire)
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  // 3. Application de tous les patterns avec logging
  const foundBarcodes = new Set<string>();
  const allMatches: string[] = [];
  
  universalPatterns.forEach(({ name, pattern }) => {
    const matches = fullText.match(pattern) || [];
    if (matches.length > 0) {
      console.log(`✅ ${name}: ${matches.length} codes trouvés`);
      allMatches.push(...matches);
    }
  });
  
  // 4. Validation et nettoyage
  allMatches.forEach(match => {
    const cleaned = match.replace(/\s/g, '');
    
    if (cleaned.length === 13 && 
        /^\d{13}$/.test(cleaned) && 
        cleaned.startsWith('3605168')) {
      foundBarcodes.add(cleaned);
    }
  });
  
  // 5. Fallback si aucun pattern ne fonctionne
  if (foundBarcodes.size === 0) {
    console.log('🔄 Fallback: recherche générale...');
    
    const textWithoutSpaces = fullText.replace(/\s/g, '');
    const allNumbers = textWithoutSpaces.match(/\d{13}/g) || [];
    
    allNumbers.forEach(num => {
      if (num.startsWith('3605168')) {
        foundBarcodes.add(num);
      }
    });
  }
  
  return Array.from(foundBarcodes);
}
```

#### Robustesse et Fallbacks
- **Multi-patterns** : 4 patterns différents pour couvrir tous les cas
- **Fallback intelligent** : Si aucun pattern ne fonctionne, recherche générale
- **Validation stricte** : Vérification format OXBOW (3605168 + 6 chiffres)
- **Optimisation mémoire** : Traitement page par page

#### Extraction Références Produits
```typescript
// Extraction des références produits (ex: OXV932106)
function extractProductReferences(text: string): ProductReference[] {
  const referenceMatches = text.match(/([A-Z0-9]{9})/g) || [];
  
  return referenceMatches.map(ref => ({
    pattern: 'DIRECT',
    code: ref,
    fullReference: ref
  }));
}
```

## 3.3 Traitement Excel Intelligent

### Détection Automatique des Colonnes

#### Système de Détecteurs Avancé
```typescript
const COLUMN_DETECTORS = {
  barcode: {
    names: [
      // SS26 exact
      'gencod',
      // FW25 et variations
      'code-barres', 'code barre', 'codebarre', 'code_barre',
      'ean', 'ean13', 'ean-13', 'upc', 'gtin', 'gtin13',
      'barcode', 'bar_code', 'bar-code', 'product_code', 'item_code'
    ],
    validator: (value: any) => {
      if (!value) return false;
      const str = value.toString().replace(/[^\d]/g, '');
      return str.length >= 8 && str.length <= 14 && /^\d+$/.test(str);
    },
    confidence: (values: any[]) => {
      const validCount = values.filter(v => COLUMN_DETECTORS.barcode.validator(v)).length;
      return Math.min(1.0, validCount / Math.max(values.length, 1));
    }
  },
  
  // Nouveaux détecteurs SS26
  priceEuro: {
    names: ['x300', 'prix eur', 'price eur', 'euro', 'eur'],
    validator: (value: any) => {
      if (value === null || value === undefined || value === '') return false;
      if (typeof value === 'number') return value >= 0;
      const str = value.toString().replace(/[€$£,\s]/g, '').replace(',', '.');
      const num = parseFloat(str);
      return !isNaN(num) && num >= 0 && num < 10000;
    }
  },
  
  color: {
    names: ['lib._coloris', 'coloris', 'couleur', 'color', 'lib_coloris'],
    validator: (value: any) => {
      if (!value) return false;
      const str = value.toString().trim();
      return str.length > 1 && str.length < 50;
    }
  },

  size: {
    names: ['taille', 'size'],
    validator: (value: any) => {
      if (!value) return false;
      const str = value.toString().trim();
      return /^(XS|S|M|L|XL|XXL|XXXL|XXXXL|\d+)$/i.test(str) || str.length <= 10;
    }
  }
};
```

#### Algorithme de Détection Intelligent
```typescript
function detectColumns(rawData: any[][], debug: DebugInfo): { [key: string]: number } {
  const mapping: { [key: string]: number } = {};
  
  // 1. Recherche des en-têtes dans les 10 premières lignes
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

  // 2. Échantillonnage des données pour validation
  const sampleData = rawData.slice(headerRow + 1, headerRow + 21); // 20 lignes d'échantillon

  // 3. Détection pour chaque type de colonne
  for (const [type, detector] of Object.entries(COLUMN_DETECTORS)) {
    let bestIndex = -1;
    let bestConfidence = 0;

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

      confidence = Math.min(1.0, confidence);

      if (confidence > bestConfidence && confidence >= 0.6) {
        bestConfidence = confidence;
        bestIndex = colIndex;
      }
    }

    if (bestIndex !== -1) {
      mapping[type] = bestIndex;
    }
  }

  return mapping;
}
```

### Traitement par Chunks Optimisé

#### Gestion Mémoire et Performance
```typescript
async function processDataInChunks(
  rawData: any[][],
  columnMapping: { [key: string]: number },
  debug: DebugInfo
): Promise<BarcodeData[]> {
  const barcodes: BarcodeData[] = [];
  const seenBarcodes = new Set<string>();
  const CHUNK_SIZE = 1000;
  
  const dataRows = rawData.slice(1); // Skip headers
  const chunks = [];
  
  // Découpage en chunks
  for (let i = 0; i < dataRows.length; i += CHUNK_SIZE) {
    chunks.push(dataRows.slice(i, i + CHUNK_SIZE));
  }

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

        // Extraction des données SS26 enrichies
        const barcodeData: BarcodeData = {
          barcode: rawBarcode,
          normalizedBarcode,
          source: 'excel',
          rawBarcode,
          
          // Prix multi-devises
          priceEuro: parsePrice(row[columnMapping.priceEuro]),
          pricePound: parsePrice(row[columnMapping.pricePound]),
          price: parsePrice(row[columnMapping.price]),
          
          // Métadonnées SS26
          color: sanitizeInput(row[columnMapping.color]?.toString().trim()),
          size: sanitizeInput(row[columnMapping.size]?.toString().trim()),
          supplier: sanitizeInput(row[columnMapping.supplier]?.toString().trim()),
          description: sanitizeInput(row[columnMapping.description]?.toString().trim()),
          productReference: sanitizeInput(row[columnMapping.productReference]?.toString().trim())
        };

        barcodes.push(barcodeData);
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
```

## 3.4 Identification Automatique des Fournisseurs

### Logique d'Identification Avancée

#### Algorithme de Correspondance
```typescript
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
      // Correspondance exacte ou partielle
      if (supplierCodes.some(code => 
        code?.includes(ref.code) || ref.code.includes(code || '')
      )) {
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

// Extraction des fournisseurs disponibles
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
```

#### Critères de Confiance
```typescript
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
```

## 3.5 Moteur de Comparaison Avancé

### Algorithme de Comparaison Multi-Niveaux

#### Comparaison avec Fallbacks
```typescript
export function compareData(
  pdfBarcodes: BarcodeData[], 
  excelBarcodes: BarcodeData[]
): ComparisonResult[] {
  const results: ComparisonResult[] = [];
  
  // Créer un index des codes Excel pour recherche O(1)
  const excelLookup = new Map<string, BarcodeData>();
  const excelLookupRaw = new Map<string, BarcodeData>();
  
  excelBarcodes.forEach(item => {
    excelLookup.set(item.normalizedBarcode, item);
    excelLookupRaw.set(item.barcode, item);
  });
  
  // Détection du format pour enrichissement
  const hasColorData = excelBarcodes.some(b => b.color);
  const hasSizeData = excelBarcodes.some(b => b.size);
  const hasDualCurrency = excelBarcodes.some(b => b.priceEuro && b.pricePound);
  const formatDetected = (hasColorData && hasSizeData && hasDualCurrency) ? 'SS26' : 'FW25';
  
  const supplierName = excelBarcodes[0]?.supplier || 'Fournisseur inconnu';
  
  // Traiter chaque code PDF avec analyse détaillée
  pdfBarcodes.forEach((pdfData) => {
    // 1. Recherche exacte par code normalisé
    let excelMatch = excelLookup.get(pdfData.normalizedBarcode);
    let matchType: 'exact' | 'fuzzy' | 'none' = 'none';
    let matchReason = '';
    
    if (excelMatch) {
      matchType = 'exact';
      matchReason = 'Correspondance exacte code normalisé';
    } else {
      // 2. Recherche par code brut
      excelMatch = excelLookupRaw.get(pdfData.barcode);
      if (excelMatch) {
        matchType = 'exact';
        matchReason = 'Correspondance exacte code brut';
      } else {
        // 3. Recherche fuzzy améliorée
        const fuzzyMatch = findFuzzyMatch(pdfData, excelBarcodes);
        if (fuzzyMatch.match) {
          excelMatch = fuzzyMatch.match;
          matchType = 'fuzzy';
          matchReason = fuzzyMatch.reason;
        } else {
          matchReason = 'Aucune correspondance trouvée';
        }
      }
    }
    
    if (excelMatch) {
      // Enrichissement SS26: Créer une description enrichie
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
  
  return results.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

// Recherche fuzzy pour codes similaires
function findFuzzyMatch(pdfData: BarcodeData, excelBarcodes: BarcodeData[]): {
  match: BarcodeData | null;
  reason: string;
} {
  const pdfNormalized = pdfData.normalizedBarcode;
  
  // Recherche par code tronqué (cas fréquent)
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
```

## 3.6 Système de Filtrage Avancé

### Filtres Multi-Critères SS26

#### Interface de Filtrage
```typescript
interface FilterOptions {
  status: string[];           // Type de correspondance
  severity: string[];         // Niveau de criticité
  searchTerm: string;         // Recherche textuelle
  colors: string[];           // Filtrage par couleur (SS26)
  sizes: string[];            // Filtrage par taille (SS26)
  suppliers: string[];        // Filtrage par fournisseur
  priceRange: { min: number; max: number } | null;
  currency: 'ALL' | 'EUR' | 'GBP';
}

export function filterResults(results: ComparisonResult[], filters: FilterOptions) {
  return results.filter(result => {
    // Filtrage par statut
    if (filters.status.length > 0 && !filters.status.includes(result.status)) {
      return false;
    }
    
    // Filtrage par sévérité
    if (filters.severity.length > 0 && !filters.severity.includes(result.severity)) {
      return false;
    }
    
    // Filtres SS26 spécifiques
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
    
    // Recherche textuelle multi-champs
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
```

---

**Prochaine section :** [Guide d'Utilisation](./04-guide-utilisation.md)