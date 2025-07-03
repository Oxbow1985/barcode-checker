# 10. Annexes Techniques

## 10.1 Exemples de Formats de Fichiers Supportés

### Format PDF Supporté

#### Structure Attendue
```
Caractéristiques requises:
- Texte extractible (pas d'images scannées)
- Codes-barres format : 3605168XXXXXX (13 chiffres)
- Encodage : UTF-8 ou Latin-1
- Taille max : 50MB
- Pages multiples supportées
```

#### Exemple de Contenu PDF
```
R2PIVEGA-JP OXV932106
Code-barres: 3605168507131
Prix: 29.99€

R2PIVEGA-JP OXV932107  
Code-barres: 3605168507148
Prix: 34.99€

R2PIVEGA-JP OXV932108
Code-barres: 3605168507155
Prix: 24.99€

R2PIVEGA-JP OXV932109
Code-barres: 3605168507162
Prix: 39.99€
```

#### Variations Supportées
```
// Format standard
Code-barres: 3605168507131

// Format avec espaces
Code-barres: 3 605 168 507 131

// Format sans préfixe
3605168507131

// Format avec tirets
3-605-168-507-131

// Format avec préfixe EAN
EAN: 3605168507131

// Format avec préfixe GTIN
GTIN-13: 3605168507131
```

### Format Excel SS26 (Enrichi)

#### Structure Attendue
```
Caractéristiques requises:
- Format: .xlsx, .xlsm, .xls, .csv
- Encodage: UTF-8, Latin-1, Windows-1252
- Première ligne: En-têtes
- Colonnes requises: Gencod, Code_article, Fournisseur
- Colonnes SS26: X300 (EUR), X350 (GBP), lib._coloris, Taille
- Taille max: 20MB
```

#### Exemple Format SS26 Complet
```excel
| Gencod        | Code_article | Fournisseur | X300  | X350  | lib._coloris | Taille | Libellé_article |
|---------------|--------------|-------------|-------|-------|--------------|--------|-----------------|
| 3605168507131 | OXV932106    | OXBOW       | 29.99 | 24.99 | Rouge        | M      | T-shirt rouge   |
| 3605168507148 | OXV932107    | OXBOW       | 34.99 | 29.99 | Bleu         | L      | T-shirt bleu    |
| 3605168507155 | OXV932108    | OXBOW       | 24.99 | 19.99 | Vert         | S      | T-shirt vert    |
| 3605168507162 | OXV932109    | OXBOW       | 39.99 | 34.99 | Noir         | XL     | T-shirt noir    |
```

#### Colonnes Optionnelles SS26
```excel
| Code_coloris | Sais_création_produit | Dernière_sais_comm | Code_Marque | Délai_commercial |
|--------------|------------------------|-------------------|-------------|------------------|
| ROU          | SS26                  | SS26              | OXB         | 15               |
| BLE          | SS26                  | SS26              | OXB         | 15               |
| VER          | SS26                  | SS26              | OXB         | 15               |
| NOI          | SS26                  | SS26              | OXB         | 15               |
```

### Format Excel FW25 (Classique)

#### Structure Attendue
```
Caractéristiques requises:
- Format: .xlsx, .xlsm, .xls, .csv
- Encodage: UTF-8, Latin-1, Windows-1252
- Première ligne: En-têtes
- Colonnes requises: code-barres, Code article, Supplier, RETAIL PRICE
- Taille max: 20MB
```

#### Exemple Format FW25 Standard
```excel
| code-barres   | Code article | Supplier | RETAIL PRICE | Description     |
|---------------|--------------|----------|--------------|-----------------|
| 3605168507131 | OXV932106    | OXBOW    | 29.99        | T-shirt rouge M |
| 3605168507148 | OXV932107    | OXBOW    | 34.99        | T-shirt bleu L  |
| 3605168507155 | OXV932108    | OXBOW    | 24.99        | T-shirt vert S  |
| 3605168507162 | OXV932109    | OXBOW    | 39.99        | T-shirt noir XL |
```

#### Variations Supportées
```excel
# Variation 1: Noms de colonnes alternatifs
| EAN13         | Reference    | Vendor   | Price (€)     | Product Name    |

# Variation 2: Colonnes supplémentaires
| Barcode       | SKU          | Brand    | Price         | Description     | Stock | Category | Season |

# Variation 3: Ordre différent
| Supplier      | RETAIL PRICE | code-barres   | Code article | Description     |
```

## 10.2 Patterns Regex Utilisés

### Extraction Codes-barres PDF

```typescript
const BARCODE_PATTERNS = {
  // Pattern principal OXBOW
  oxbow_standard: /3605168\d{6}/g,
  
  // Pattern avec espaces (PDF mal formaté)
  oxbow_spaced: /3\s*605\s*168\s*\d{6}/g,
  
  // Pattern ultra-flexible (espaces partout)
  oxbow_flexible: /3\s*6\s*0\s*5\s*1\s*6\s*8\s*\d{6}/g,
  
  // Pattern SS26 (nouveau préfixe)
  oxbow_ss26: /3\s*6051\s*68\s*\d{6}/g,
  
  // Validation finale
  validation: /^3605168\d{6}$/
};
```

### Détection Colonnes Excel

```typescript
const COLUMN_PATTERNS = {
  barcode: {
    exact: /^(gencod|code-barres|barcode|ean13?)$/i,
    partial: /(code|barr|ean|gtin)/i
  },
  
  price_eur: {
    exact: /^(x300|prix\s*eur|price\s*eur)$/i,
    partial: /(prix|price|eur|euro)/i
  },
  
  price_gbp: {
    exact: /^(x350|prix\s*gbp|price\s*gbp)$/i,
    partial: /(gbp|pound|livre)/i
  },
  
  color: {
    exact: /^(lib\._coloris|coloris|couleur|color)$/i,
    partial: /(color|couleur)/i
  },
  
  size: {
    exact: /^(taille|size)$/i,
    partial: /(taille|size)/i
  },
  
  supplier: {
    exact: /^(fournisseur|supplier|vendor)$/i,
    partial: /(fourn|suppl|vend)/i
  },
  
  product_reference: {
    exact: /^(code_article|code article|reference|ref)$/i,
    partial: /(code|ref|arti)/i
  }
};
```

### Validation Données

```typescript
const VALIDATION_PATTERNS = {
  // Code-barres valide
  valid_barcode: /^\d{8,14}$/,
  
  // Prix valide
  valid_price: /^\d+([.,]\d{1,2})?$/,
  
  // Taille valide
  valid_size: /^(XS|S|M|L|XL|XXL|XXXL|\d+)$/i,
  
  // Couleur valide (lettres et espaces)
  valid_color: /^[a-zA-ZÀ-ÿ\s-]{2,50}$/,
  
  // Référence produit
  product_reference: /^[A-Z0-9]{6,15}$/i,
  
  // Email valide
  valid_email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Code postal
  valid_postal_code: /^\d{5}$/,
  
  // Numéro de téléphone
  valid_phone: /^(\+\d{1,3})?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
  
  // URL valide
  valid_url: /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
};
```

### Extraction Références Produits

```typescript
const REFERENCE_PATTERNS = {
  // Format standard Oxbow (ex: OXV932106)
  oxbow_standard: /[A-Z0-9]{9}/g,
  
  // Format avec préfixe (ex: R2PIVEGA-JP OXV932106)
  oxbow_with_prefix: /([A-Z0-9]+-[A-Z]+)\s+([A-Z0-9]{9})/g,
  
  // Format avec séparateur (ex: OXV-932-106)
  oxbow_with_separator: /[A-Z]{3}-\d{3}-\d{3}/g,
  
  // Format numérique (ex: 932106)
  oxbow_numeric: /\b\d{6}\b/g
};
```

## 10.3 Structures de Données Principales

### BarcodeData (Interface Principale)

```typescript
interface BarcodeData {
  // Identifiants
  barcode: string;                    // Code-barres original
  normalizedBarcode: string;          // Code normalisé (chiffres uniquement)
  source: 'pdf' | 'excel';           // Source du code
  rawBarcode?: string;                // Code brut avant traitement
  
  // Prix (multi-devises SS26)
  price?: number;                     // Prix principal
  priceEuro?: number;                 // Prix EUR (X300)
  pricePound?: number;                // Prix GBP (X350)
  currency?: 'EUR' | 'GBP';          // Devise principale
  
  // Métadonnées produit
  description?: string;               // Description produit
  supplier?: string;                  // Nom fournisseur
  productReference?: string;          // Référence produit (Code_article)
  
  // Attributs SS26 enrichis
  color?: string;                     // Couleur (lib._coloris)
  size?: string;                      // Taille
  colorCode?: string;                 // Code couleur
  season?: string;                    // Saison commerciale
  creationSeason?: string;            // Saison création
  brandCode?: string;                 // Code marque
  commercialDelay?: string;           // Délai commercial
  
  // Métadonnées techniques
  detectionConfidence?: number;       // Confiance détection (0-1)
  processingTime?: number;            // Temps traitement (ms)
  matchAttempts?: number;             // Tentatives correspondance
  warnings?: string[];                // Avertissements
}
```

### ComparisonResult (Résultat de Comparaison)

```typescript
interface ComparisonResult {
  // Identifiants
  barcode: string;                    // Code-barres original
  normalizedBarcode: string;          // Code normalisé
  
  // Données sources
  pdfData?: BarcodeData;              // Données du PDF
  excelData?: BarcodeData;            // Données de l'Excel
  
  // Résultat de la comparaison
  status: 'exact_match'               // Correspondance parfaite
        | 'pdf_only'                  // Présent uniquement dans PDF
        | 'excel_only'                // Présent uniquement dans Excel
        | 'price_mismatch';           // Différence de prix détectée
  
  // Métadonnées
  severity: 'low' | 'medium' | 'high'; // Niveau de criticité
  discrepancy?: string;               // Description de l'écart
  priceDifference?: number;           // Différence de prix (€)
  
  // Métadonnées techniques
  matchType?: 'exact' | 'fuzzy' | 'none'; // Type de correspondance
  matchReason?: string;               // Raison de la correspondance
  processingTime?: number;            // Temps de traitement (ms)
  
  // Métadonnées business
  businessImpact?: 'low' | 'medium' | 'high'; // Impact business
  suggestedAction?: string;           // Action suggérée
  responsibleTeam?: string;           // Équipe responsable
  priority?: number;                  // Priorité (1-5)
}
```

### ComplianceMetrics (Métriques de Conformité)

```typescript
interface ComplianceMetrics {
  // Métriques de base
  total: number;                      // Total codes analysés
  exactMatches: number;               // Correspondances exactes
  priceMismatches: number;            // Différences de prix
  pdfOnly: number;                    // Codes PDF uniquement
  excelOnly: number;                  // Codes Excel uniquement
  
  // Indicateurs calculés
  complianceRate: number;             // Taux de conformité (%)
  errorRate: number;                  // Taux d'erreur (%)
  averagePriceDifference: number;     // Écart prix moyen (€)
  criticalErrors: number;             // Erreurs critiques
  
  // Métadonnées
  supplierName?: string;              // Nom du fournisseur
  formatDetected?: 'FW25' | 'SS26' | 'MIXED'; // Format détecté
  
  // Distributions SS26
  colorDistribution?: { [color: string]: number };
  sizeDistribution?: { [size: string]: number };
  supplierDistribution?: { [supplier: string]: number };
  
  // Analyse devises
  currencyAnalysis?: {
    eurCount: number;                 // Nombre produits EUR
    gbpCount: number;                 // Nombre produits GBP
    averagePriceEur?: number;         // Prix moyen EUR
    averagePriceGbp?: number;         // Prix moyen GBP
    priceDiscrepancies: number;       // Incohérences prix
  };
  
  // Analyse temporelle
  timeAnalysis?: {
    processingTime: number;           // Temps traitement total (ms)
    extractionTime: number;           // Temps extraction (ms)
    comparisonTime: number;           // Temps comparaison (ms)
    renderTime: number;               // Temps rendu (ms)
  };
  
  // Analyse qualité
  qualityAnalysis?: {
    dataCompleteness: number;         // Complétude données (%)
    dataConsistency: number;          // Cohérence données (%)
    dataPrecision: number;            // Précision données (%)
    overallQuality: number;           // Qualité globale (%)
  };
}
```

### FilterOptions (Options de Filtrage)

```typescript
interface FilterOptions {
  // Filtres de base
  status: string[];                   // Statuts de correspondance
  severity: string[];                 // Niveaux de sévérité
  searchTerm: string;                 // Recherche textuelle
  
  // Filtres SS26 enrichis
  colors: string[];                   // Filtrage par couleurs
  sizes: string[];                    // Filtrage par tailles
  suppliers: string[];               // Filtrage par fournisseurs
  priceRange: {                      // Plage de prix
    min: number;
    max: number;
  } | null;
  currency: 'ALL' | 'EUR' | 'GBP';   // Filtrage par devise
  
  // Filtres avancés
  categories?: string[];             // Filtrage par catégories
  seasons?: string[];                // Filtrage par saisons
  dateRange?: {                      // Plage de dates
    start: Date;
    end: Date;
  } | null;
  
  // Filtres techniques
  matchType?: ('exact' | 'fuzzy' | 'none')[]; // Type de correspondance
  hasWarnings?: boolean | null;      // Présence avertissements
  processingTimeRange?: {            // Plage temps traitement
    min: number;
    max: number;
  } | null;
  
  // Filtres business
  businessImpact?: ('low' | 'medium' | 'high')[]; // Impact business
  priorityRange?: {                 // Plage priorité
    min: number;
    max: number;
  } | null;
  responsibleTeams?: string[];      // Équipes responsables
}
```

### SupplierInfo (Information Fournisseur)

```typescript
interface SupplierInfo {
  id: string;                         // Identifiant unique
  name: string;                       // Nom du fournisseur
  productCount: number;               // Nombre de produits
  detectedReferences: string[];       // Références détectées
  confidence: number;                 // Score de confiance (0-1)
  
  // Métadonnées enrichies
  contactInfo?: {                    // Informations contact
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
  };
  
  performance?: {                    // Métriques performance
    averageComplianceRate: number;   // Taux conformité moyen
    lastComplianceRate: number;      // Dernier taux conformité
    trend: 'up' | 'down' | 'stable'; // Tendance
    lastUpdate: Date;                // Dernière mise à jour
  };
  
  businessInfo?: {                   // Informations business
    contractNumber?: string;         // Numéro contrat
    paymentTerms?: string;           // Conditions paiement
    deliveryTime?: number;           // Délai livraison (jours)
    minimumOrderValue?: number;      // Commande minimum
  };
  
  technicalInfo?: {                  // Informations techniques
    supportedFormats: ('FW25' | 'SS26')[]; // Formats supportés
    apiEndpoint?: string;            // Endpoint API
    integrationStatus: 'active' | 'pending' | 'inactive'; // Statut intégration
    customFields?: Record<string, any>; // Champs personnalisés
  };
}
```

## 10.4 Configuration et Constantes

### Limites et Contraintes

```typescript
const CONFIG = {
  // Limites fichiers
  MAX_PDF_SIZE: 50 * 1024 * 1024,    // 50MB
  MAX_EXCEL_SIZE: 20 * 1024 * 1024,  // 20MB
  MIN_FILE_SIZE: 100,                // 100 bytes minimum
  MAX_FILENAME_LENGTH: 255,          // Longueur max nom fichier
  
  // Traitement
  MAX_ROWS_TO_SCAN: 50,              // Lignes à scanner pour en-têtes
  MIN_CONFIDENCE_SCORE: 0.6,         // Score minimum détection colonne
  CHUNK_SIZE: 1000,                  // Taille chunks traitement
  MAX_RESULTS: 10000,                // Nombre max résultats
  
  // Performance
  CACHE_TTL: 5 * 60 * 1000,          // 5 minutes cache
  MAX_CACHE_SIZE: 100 * 1024 * 1024, // 100MB cache max
  MEMORY_WARNING_THRESHOLD: 85,       // % mémoire critique
  DEBOUNCE_SEARCH_MS: 300,           // Délai debounce recherche
  
  // Validation
  VALID_BARCODE_LENGTHS: [8, 12, 13, 14],
  OXBOW_PREFIXES: ['3605168', '3605169'],
  MAX_PRICE_VALUE: 10000,            // Prix maximum accepté
  
  // UI
  ITEMS_PER_PAGE_DEFAULT: 20,        // Pagination par défaut
  TOAST_DURATION: 4000,              // Durée notifications
  ANIMATION_DURATION: 300,           // Durée animations (ms)
  
  // Sécurité
  MAX_UPLOAD_ATTEMPTS: 3,            // Tentatives max upload
  RATE_LIMIT_UPLOADS: 10,            // Uploads max par minute
  ALLOWED_FILE_EXTENSIONS: ['.pdf', '.xlsx', '.xlsm', '.xls', '.csv'],
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.ms-excel.sheet.macroEnabled.12',
    'text/csv'
  ]
};
```

### Messages d'Erreur Standardisés

```typescript
const ERROR_MESSAGES = {
  // Fichiers
  FILE_TOO_LARGE: 'Fichier trop volumineux (max {size}MB)',
  INVALID_FILE_TYPE: 'Type de fichier non supporté',
  CORRUPTED_FILE: 'Fichier corrompu ou illisible',
  INVALID_SIGNATURE: 'Signature de fichier invalide',
  
  // Traitement
  NO_BARCODES_FOUND: 'Aucun code-barres trouvé dans le PDF',
  INVALID_EXCEL_FORMAT: 'Format Excel non reconnu',
  MISSING_REQUIRED_COLUMNS: 'Colonnes requises manquantes: {columns}',
  EMPTY_EXCEL: 'Fichier Excel vide ou sans données valides',
  
  // Validation
  INVALID_BARCODE_FORMAT: 'Format de code-barres invalide: {barcode}',
  PRICE_OUT_OF_RANGE: 'Prix hors limites acceptables: {price}',
  INVALID_SUPPLIER: 'Fournisseur non reconnu: {supplier}',
  INVALID_COLOR_FORMAT: 'Format de couleur invalide: {color}',
  
  // Système
  MEMORY_CRITICAL: 'Mémoire insuffisante pour traiter ce fichier',
  PROCESSING_TIMEOUT: 'Délai de traitement dépassé',
  BROWSER_UNSUPPORTED: 'Navigateur non supporté. Utilisez Chrome, Firefox, Edge ou Safari récent',
  UNKNOWN_ERROR: 'Erreur inconnue lors du traitement',
  
  // API
  API_UNAVAILABLE: 'API non disponible. Veuillez réessayer plus tard',
  UNAUTHORIZED: 'Non autorisé. Veuillez vous connecter',
  RATE_LIMITED: 'Trop de requêtes. Veuillez réessayer dans {seconds} secondes',
  INVALID_REQUEST: 'Requête invalide: {details}'
};
```

### Constantes d'Interface Utilisateur

```typescript
const UI_CONSTANTS = {
  // Thème couleurs
  COLORS: {
    oxbow: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#2B5CE6',
      600: '#2563eb',
      700: '#1d4ed8'
    },
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      700: '#15803d'
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      700: '#b45309'
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      700: '#b91c1c'
    }
  },
  
  // Animations
  ANIMATIONS: {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.3 }
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5 }
    },
    scale: {
      initial: { scale: 0.9, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { duration: 0.3 }
    }
  },
  
  // Breakpoints responsive
  BREAKPOINTS: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  
  // Tailles composants
  SIZES: {
    button: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    },
    input: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-5 py-3 text-lg'
    },
    card: {
      sm: 'p-4 rounded-lg',
      md: 'p-6 rounded-xl',
      lg: 'p-8 rounded-2xl'
    }
  },
  
  // Icônes par statut
  ICONS: {
    success: 'CheckCircle',
    warning: 'AlertTriangle',
    error: 'XCircle',
    info: 'Info',
    loading: 'Loader'
  },
  
  // Textes par statut
  STATUS_TEXTS: {
    exact_match: 'Correspondance exacte',
    pdf_only: 'PDF uniquement',
    excel_only: 'Excel uniquement',
    price_mismatch: 'Prix différent'
  }
};
```

### Configuration Formats Supportés

```typescript
const SUPPORTED_FORMATS = {
  // Formats PDF
  pdf: {
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf', 'application/x-pdf'],
    signatures: [
      [0x25, 0x50, 0x44, 0x46]  // %PDF
    ],
    maxSize: 50 * 1024 * 1024,  // 50MB
    patterns: {
      barcodes: [
        { name: 'FW25', pattern: /3\s*605\s*168\s*\d{6}/g },
        { name: 'SS26', pattern: /3\s*6051\s*68\s*\d{6}/g },
        { name: 'Complet', pattern: /3605168\d{6}/g },
        { name: 'Ultra-flexible', pattern: /3\s*6\s*0\s*5\s*1\s*6\s*8\s*\d{6}/g }
      ],
      references: [
        { name: 'Standard', pattern: /[A-Z0-9]{9}/g },
        { name: 'WithPrefix', pattern: /([A-Z0-9]+-[A-Z]+)\s+([A-Z0-9]{9})/g }
      ]
    }
  },
  
  // Formats Excel
  excel: {
    extensions: ['.xlsx', '.xlsm', '.xls', '.csv'],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
      'text/csv'
    ],
    signatures: [
      [0x50, 0x4B, 0x03, 0x04],  // ZIP (XLSX)
      [0xD0, 0xCF, 0x11, 0xE0],  // OLE2 (XLS)
      [0x09, 0x08, 0x10, 0x00],  // XLS (alternative)
      [0x49, 0x44, 0x3B]         // CSV
    ],
    maxSize: 20 * 1024 * 1024,  // 20MB
    formats: {
      // Format SS26
      SS26: {
        requiredColumns: ['gencod', 'code_article', 'fournisseur'],
        optionalColumns: ['x300', 'x350', 'lib._coloris', 'taille'],
        detection: {
          confidence: 0.8,
          requiredMatches: 3
        }
      },
      // Format FW25
      FW25: {
        requiredColumns: ['code-barres', 'code article', 'supplier'],
        optionalColumns: ['retail price', 'description'],
        detection: {
          confidence: 0.7,
          requiredMatches: 2
        }
      }
    }
  }
};
```

## 10.5 Exemples de Code pour Cas d'Usage Courants

### Extraction Codes-barres PDF

```typescript
// Exemple complet d'extraction de codes-barres d'un PDF
async function extractBarcodesFromPDF(file: File): Promise<string[]> {
  try {
    // 1. Validation fichier
    const errors = validatePdfFile(file);
    if (errors.length > 0) {
      throw new Error(`Fichier PDF invalide: ${errors[0].message}`);
    }
    
    // 2. Validation signature
    const isValidSignature = await validateFileSignature(file, 'pdf');
    if (!isValidSignature) {
      throw new Error('Signature PDF invalide ou fichier corrompu');
    }
    
    // 3. Lecture du fichier
    const arrayBuffer = await file.arrayBuffer();
    
    // 4. Configuration PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 
      `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    // 5. Chargement du PDF
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // 6. Extraction texte page par page
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    // 7. Application des patterns
    const foundBarcodes = new Set<string>();
    
    // Patterns universels
    const universalPatterns = [
      { name: 'FW25', pattern: /3\s*605\s*168\s*\d{6}/g },
      { name: 'SS26', pattern: /3\s*6051\s*68\s*\d{6}/g },
      { name: 'Complet', pattern: /3605168\d{6}/g },
      { name: 'Ultra-flexible', pattern: /3\s*6\s*0\s*5\s*1\s*6\s*8\s*\d{6}/g }
    ];
    
    universalPatterns.forEach(({ pattern }) => {
      const matches = fullText.match(pattern) || [];
      matches.forEach(match => {
        const cleaned = match.replace(/\s/g, '');
        if (cleaned.length === 13 && /^\d{13}$/.test(cleaned)) {
          foundBarcodes.add(cleaned);
        }
      });
    });
    
    // 8. Fallback si aucun résultat
    if (foundBarcodes.size === 0) {
      const textWithoutSpaces = fullText.replace(/\s/g, '');
      const allNumbers = textWithoutSpaces.match(/\d{13}/g) || [];
      
      allNumbers.forEach(num => {
        if (num.startsWith('3605168')) {
          foundBarcodes.add(num);
        }
      });
    }
    
    return Array.from(foundBarcodes);
    
  } catch (error) {
    console.error('Erreur extraction PDF:', error);
    throw new Error(`Erreur lors de l'extraction des codes-barres: ${error.message}`);
  }
}
```

### Détection Automatique des Colonnes Excel

```typescript
// Exemple complet de détection automatique des colonnes Excel
function detectExcelColumns(
  headers: string[],
  sampleData: any[][]
): { [key: string]: number } {
  const columnMapping: { [key: string]: number } = {};
  
  // Détecteurs de colonnes
  const columnDetectors = {
    barcode: {
      names: ['gencod', 'code-barres', 'barcode', 'ean', 'ean13'],
      validator: (value: any) => {
        if (!value) return false;
        const str = value.toString().replace(/[^\d]/g, '');
        return str.length >= 8 && str.length <= 14 && /^\d+$/.test(str);
      }
    },
    priceEuro: {
      names: ['x300', 'prix eur', 'price eur', 'euro'],
      validator: (value: any) => {
        if (value === null || value === undefined || value === '') return false;
        const str = value.toString().replace(/[€$£,\s]/g, '').replace(',', '.');
        const num = parseFloat(str);
        return !isNaN(num) && num >= 0 && num < 10000;
      }
    },
    color: {
      names: ['lib._coloris', 'coloris', 'couleur', 'color'],
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
    },
    supplier: {
      names: ['fournisseur', 'supplier', 'vendor', 'brand'],
      validator: (value: any) => {
        if (!value) return false;
        const str = value.toString().trim();
        return str.length > 1 && str.length < 100;
      }
    }
  };
  
  // Normalisation des en-têtes
  const normalizedHeaders = headers.map(h => 
    (h || '').toString().toLowerCase().trim()
  );
  
  // Pour chaque type de colonne
  for (const [type, detector] of Object.entries(columnDetectors)) {
    let bestIndex = -1;
    let bestConfidence = 0;
    
    // Parcourir toutes les colonnes
    for (let colIndex = 0; colIndex < normalizedHeaders.length; colIndex++) {
      const header = normalizedHeaders[colIndex];
      let confidence = 0;
      
      // Score basé sur le nom exact
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
      
      // Score basé sur le contenu
      if (sampleData.length > 0) {
        const columnValues = sampleData.map(row => row[colIndex]).filter(Boolean);
        if (columnValues.length > 0) {
          const validCount = columnValues.filter(detector.validator).length;
          const dataConfidence = validCount / columnValues.length;
          confidence += dataConfidence * 0.5;
        }
      }
      
      // Limiter à 1.0 maximum
      confidence = Math.min(1.0, confidence);
      
      // Garder la meilleure correspondance
      if (confidence > bestConfidence && confidence >= 0.6) {
        bestConfidence = confidence;
        bestIndex = colIndex;
      }
    }
    
    // Enregistrer la colonne détectée
    if (bestIndex !== -1) {
      columnMapping[type] = bestIndex;
      console.log(`✅ Colonne "${type}" détectée: "${headers[bestIndex]}" (index ${bestIndex}, confiance: ${(bestConfidence * 100).toFixed(0)}%)`);
    } else {
      console.warn(`⚠️ Colonne "${type}" non détectée`);
    }
  }
  
  return columnMapping;
}
```

### Algorithme de Comparaison

```typescript
// Exemple complet d'algorithme de comparaison
function compareData(
  pdfBarcodes: BarcodeData[],
  excelBarcodes: BarcodeData[]
): ComparisonResult[] {
  const results: ComparisonResult[] = [];
  
  // 1. Créer un index des codes Excel pour recherche O(1)
  const excelLookup = new Map<string, BarcodeData>();
  const excelLookupRaw = new Map<string, BarcodeData>();
  
  excelBarcodes.forEach(item => {
    excelLookup.set(item.normalizedBarcode, item);
    excelLookupRaw.set(item.barcode, item);
  });
  
  // 2. Détecter le format pour enrichissement
  const hasColorData = excelBarcodes.some(b => b.color);
  const hasSizeData = excelBarcodes.some(b => b.size);
  const hasDualCurrency = excelBarcodes.some(b => b.priceEuro && b.pricePound);
  const formatDetected = (hasColorData && hasSizeData && hasDualCurrency) ? 'SS26' : 'FW25';
  
  console.log(`🎯 Comparaison ${formatDetected}: ${pdfBarcodes.length} codes PDF vs ${excelBarcodes.length} codes Excel`);
  
  const supplierName = excelBarcodes[0]?.supplier || 'Fournisseur inconnu';
  
  // 3. Traiter chaque code PDF
  pdfBarcodes.forEach((pdfData) => {
    // Recherche exacte par code normalisé
    let excelMatch = excelLookup.get(pdfData.normalizedBarcode);
    let matchType: 'exact' | 'fuzzy' | 'none' = 'none';
    let matchReason = '';
    
    if (excelMatch) {
      matchType = 'exact';
      matchReason = 'Correspondance exacte code normalisé';
    } else {
      // Recherche par code brut
      excelMatch = excelLookupRaw.get(pdfData.barcode);
      if (excelMatch) {
        matchType = 'exact';
        matchReason = 'Correspondance exacte code brut';
      } else {
        // Recherche fuzzy
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
    
    // 4. Créer le résultat
    if (excelMatch) {
      // Vérifier différence de prix
      let status: ComparisonResult['status'] = 'exact_match';
      let severity: ComparisonResult['severity'] = 'low';
      let discrepancy: string | undefined;
      let priceDifference: number | undefined;
      
      const pdfPrice = pdfData.price;
      const excelPrice = excelMatch.priceEuro || excelMatch.price;
      
      if (pdfPrice && excelPrice && Math.abs(pdfPrice - excelPrice) > 0.01) {
        status = 'price_mismatch';
        severity = 'medium';
        priceDifference = excelPrice - pdfPrice;
        discrepancy = `Différence de prix: ${pdfPrice}€ (PDF) vs ${excelPrice}€ (Excel)`;
      } else {
        // Enrichissement SS26
        discrepancy = `✅ ${matchReason} chez ${excelMatch.supplier}`;
        
        if (formatDetected === 'SS26' && excelMatch.color && excelMatch.size) {
          discrepancy += ` | ${excelMatch.color} - ${excelMatch.size}`;
          if (excelMatch.priceEuro && excelMatch.pricePound) {
            discrepancy += ` | ${excelMatch.priceEuro}€ / ${excelMatch.pricePound}£`;
          }
        }
      }
      
      results.push({
        barcode: pdfData.barcode,
        normalizedBarcode: pdfData.normalizedBarcode,
        pdfData,
        excelData: excelMatch,
        status,
        severity,
        discrepancy,
        priceDifference,
        matchType,
        matchReason
      });
    } else {
      // Code PDF non trouvé dans Excel
      results.push({
        barcode: pdfData.barcode,
        normalizedBarcode: pdfData.normalizedBarcode,
        pdfData,
        status: 'pdf_only',
        severity: 'high',
        discrepancy: `🚨 Code PDF non trouvé chez ${supplierName} - ${matchReason}`,
        matchType,
        matchReason
      });
    }
  });
  
  // 5. Ajouter les produits Excel uniquement (limité intelligemment)
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
      discrepancy: description,
      matchType: 'none',
      matchReason: 'Produit Excel uniquement'
    });
  });
  
  // 6. Tri par sévérité
  return results.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

// Recherche fuzzy pour codes similaires
function findFuzzyMatch(
  pdfData: BarcodeData, 
  excelBarcodes: BarcodeData[]
): { match: BarcodeData | null; reason: string } {
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
  
  // Recherche par distance de Levenshtein (tolérance 1 caractère)
  for (const excelData of excelBarcodes) {
    if (levenshteinDistance(pdfNormalized, excelData.normalizedBarcode) <= 1) {
      return { 
        match: excelData, 
        reason: 'Correspondance approximative (1 caractère différent)' 
      };
    }
  }
  
  return { match: null, reason: 'Aucune correspondance trouvée' };
}

// Distance de Levenshtein pour fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  
  // Initialisation matrice
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  // Calcul distance
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // suppression
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}
```

### Export Rapport PDF

```typescript
// Exemple complet d'export PDF
function exportToPdf(results: ComparisonResult[], metrics: ComplianceMetrics) {
  const filename = generateFileName('pdf', metrics.supplierName, 'rapport-verification-oxbow');
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Palette couleurs Oxbow
  const colors = {
    oxbowBlue: [43, 92, 230],
    oxbowLight: [59, 130, 246],
    success: [34, 197, 94],
    warning: [245, 158, 11],
    error: [239, 68, 68],
    gray: [107, 114, 128],
    lightGray: [243, 244, 246],
    darkGray: [55, 65, 81],
    white: [255, 255, 255]
  };
  
  // Fonctions utilitaires design
  const addGradientHeader = (y: number, height: number = 8) => {
    doc.setFillColor(...colors.oxbowBlue);
    doc.rect(0, y, 210, height, 'F');
    doc.setFillColor(...colors.oxbowLight);
    doc.rect(0, y + height - 2, 210, 2, 'F');
  };
  
  const addCard = (x: number, y: number, width: number, height: number, fillColor = colors.lightGray) => {
    doc.setFillColor(...fillColor);
    doc.roundedRect(x, y, width, height, 2, 2, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, width, height, 2, 2, 'S');
  };
  
  // Page 1: Couverture
  addGradientHeader(0);
  
  doc.setFontSize(32);
  doc.setTextColor(...colors.white);
  doc.text('OXBOW', 20, 25);
  
  doc.setFontSize(14);
  doc.setTextColor(...colors.white);
  doc.text('Quality Control System', 20, 32);
  
  doc.setFontSize(24);
  doc.setTextColor(...colors.oxbowBlue);
  doc.text('Rapport de Vérification', 20, 55);
  doc.text('Multi-Fournisseurs', 20, 65);
  
  doc.setDrawColor(...colors.oxbowBlue);
  doc.setLineWidth(3);
  doc.line(20, 70, 120, 70);
  
  // Informations générales
  addCard(20, 85, 170, 45);
  
  doc.setFontSize(14);
  doc.setTextColor(...colors.oxbowBlue);
  doc.text('📋 Informations du Rapport', 25, 95);
  
  doc.setFontSize(11);
  doc.setTextColor(...colors.darkGray);
  doc.text(`📅 Date: ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 25, 105);
  doc.text(`🏢 Fournisseur: ${metrics.supplierName || 'Multi-fournisseurs'}`, 25, 112);
  doc.text(`👥 Équipe: Oxbow Quality Control`, 25, 119);
  doc.text(`📊 Version: 2.0 Premium`, 25, 126);
  
  // Métriques principales
  const metricsY = 145;
  
  // Conformité
  const conformityColor = metrics.complianceRate >= 95 ? colors.success : 
                         metrics.complianceRate >= 85 ? colors.warning : colors.error;
  
  addCard(20, metricsY, 50, 35, conformityColor.map(c => Math.min(255, c + 200)) as [number, number, number]);
  doc.setFontSize(20);
  doc.setTextColor(...conformityColor);
  doc.text(`${metrics.complianceRate.toFixed(1)}%`, 25, metricsY + 20);
  doc.setFontSize(9);
  doc.setTextColor(...colors.darkGray);
  doc.text('Conformité', 25, metricsY + 28);
  
  // Erreurs critiques
  const errorColor = metrics.criticalErrors === 0 ? colors.success : 
                    metrics.criticalErrors < 5 ? colors.warning : colors.error;
  
  addCard(80, metricsY, 50, 35, errorColor.map(c => Math.min(255, c + 200)) as [number, number, number]);
  doc.setFontSize(20);
  doc.setTextColor(...errorColor);
  doc.text(`${metrics.criticalErrors}`, 85, metricsY + 20);
  doc.setFontSize(9);
  doc.setTextColor(...colors.darkGray);
  doc.text('Erreurs critiques', 85, metricsY + 28);
  
  // Total analysé
  addCard(140, metricsY, 50, 35, colors.oxbowBlue.map(c => Math.min(255, c + 200)) as [number, number, number]);
  doc.setFontSize(20);
  doc.setTextColor(...colors.oxbowBlue);
  doc.text(`${metrics.total}`, 145, metricsY + 20);
  doc.setFontSize(9);
  doc.setTextColor(...colors.darkGray);
  doc.text('Codes analysés', 145, metricsY + 28);
  
  // Page 2: Tableau résultats
  doc.addPage();
  addGradientHeader(0);
  
  doc.setFontSize(20);
  doc.setTextColor(...colors.white);
  doc.text('Résultats Détaillés', 20, 25);
  
  // Tableau avec autoTable
  autoTable(doc, {
    head: [['Code-barres', 'Statut', 'Sévérité', 'Prix', 'Observation']],
    body: results.slice(0, 30).map(result => [
      result.barcode,
      getStatusLabel(result.status),
      getSeverityLabel(result.severity),
      result.excelData?.price?.toFixed(2) + ' €' || 'N/A',
      (result.discrepancy || '').substring(0, 25) + (result.discrepancy && result.discrepancy.length > 25 ? '...' : '')
    ]),
    startY: 40,
    styles: { 
      fontSize: 8,
      cellPadding: 3
    },
    headStyles: { 
      fillColor: colors.oxbowBlue,
      textColor: colors.white,
      fontStyle: 'bold'
    },
    alternateRowStyles: { 
      fillColor: [248, 250, 252] 
    }
  });
  
  // Enregistrement du fichier
  doc.save(filename);
}
```

---

## 10.6 Glossaire Technique

| Terme | Description |
|-------|-------------|
| **Barcode** | Code-barres produit, généralement au format EAN-13 (13 chiffres) |
| **Normalized Barcode** | Code-barres nettoyé (chiffres uniquement) pour comparaison |
| **FW25** | Format "Fall-Winter 2025", format classique Oxbow |
| **SS26** | Format "Spring-Summer 2026", format enrichi avec couleurs/tailles |
| **PDF Extraction** | Processus d'extraction des codes-barres depuis un fichier PDF |
| **Excel Processing** | Traitement des données Excel avec détection automatique |
| **Supplier Detection** | Identification automatique du fournisseur dans les données |
| **Comparison Engine** | Algorithme de comparaison entre données PDF et Excel |
| **Compliance Rate** | Taux de conformité (% codes PDF trouvés dans Excel) |
| **Error Rate** | Taux d'erreur (% codes PDF non trouvés dans Excel) |
| **Fuzzy Matching** | Correspondance approximative pour tolérer erreurs mineures |
| **Web Worker** | Thread JavaScript séparé pour traitement sans bloquer l'UI |
| **IndexedDB** | Base de données côté client pour stockage persistant |
| **PWA** | Progressive Web App, fonctionnalités application native |

---

**Fin de la documentation technique**