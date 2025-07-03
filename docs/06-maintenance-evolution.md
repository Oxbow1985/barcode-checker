# 6. Maintenance et Évolution

## 6.1 Modification des Patterns d'Extraction PDF

### Localisation des Patterns

#### Fichier Principal : `src/utils/pdfProcessor.ts`

```typescript
// Ligne ~25 - Patterns universels OXBOW
const universalPatterns = [
  { name: 'FW25', pattern: /3\s*605\s*168\s*\d{6}/g },
  { name: 'SS26', pattern: /3\s*6051\s*68\s*\d{6}/g },
  { name: 'Complet', pattern: /3605168\d{6}/g },
  { name: 'Ultra-flexible', pattern: /3\s*6\s*0\s*5\s*1\s*6\s*8\s*\d{6}/g }
];
```

### Procédure d'Ajout d'un Nouveau Pattern

#### Étape 1 : Analyser le Nouveau Format
```bash
# Exemple : Nouveau format SS27 avec préfixe 3605169
# Échantillons à analyser :
3605169123456
3 605 169 123456
3605169 123456
```

#### Étape 2 : Créer le Pattern Regex
```typescript
// Test du pattern avec regex101.com
const ss27Pattern = /3\s*605\s*169\s*\d{6}/g;

// Validation avec échantillons
const testCodes = [
  '3605169123456',
  '3 605 169 123456', 
  '3605169 123456'
];

testCodes.forEach(code => {
  const matches = code.match(ss27Pattern);
  console.log(`${code}: ${matches ? '✅' : '❌'}`);
});
```

#### Étape 3 : Ajouter au Tableau des Patterns
```typescript
// src/utils/pdfProcessor.ts - Ligne ~25
const universalPatterns = [
  // Patterns existants
  { name: 'FW25', pattern: /3\s*605\s*168\s*\d{6}/g },
  { name: 'SS26', pattern: /3\s*6051\s*68\s*\d{6}/g },
  { name: 'Complet', pattern: /3605168\d{6}/g },
  { name: 'Ultra-flexible', pattern: /3\s*6\s*0\s*5\s*1\s*6\s*8\s*\d{6}/g },
  
  // 🆕 Nouveau pattern SS27
  { name: 'SS27', pattern: /3\s*605\s*169\s*\d{6}/g }
];
```

#### Étape 4 : Mettre à Jour la Validation
```typescript
// src/utils/pdfProcessor.ts - Ligne ~85
function isValidOxbowBarcode(barcode: string): boolean {
  // Ajouter le nouveau préfixe
  const validPrefixes = [
    '3605168',  // FW25/SS26 existant
    '3605169'   // 🆕 SS27 nouveau
  ];
  
  return barcode.length === 13 && 
         /^\d{13}$/.test(barcode) && 
         validPrefixes.some(prefix => barcode.startsWith(prefix));
}
```

#### Étape 5 : Tester et Valider
```typescript
// Test unitaire à ajouter
const testSS27Codes = [
  '3605169123456',
  '3605169789012',
  '3605169555666'
];

testSS27Codes.forEach(code => {
  const isValid = isValidOxbowBarcode(code);
  console.log(`${code}: ${isValid ? '✅ Valide' : '❌ Invalide'}`);
});
```

### Modification des Patterns Existants

#### Améliorer la Précision d'un Pattern
```typescript
// Avant : Pattern trop permissif
{ name: 'FW25', pattern: /3\s*605\s*168\s*\d{6}/g }

// Après : Pattern plus strict
{ name: 'FW25', pattern: /3\s*605\s*168\s*[0-9]{6}(?!\d)/g }
//                                              ^^^^^^^^
//                                              Évite les correspondances partielles
```

#### Ajouter des Variantes d'Espacement
```typescript
// Pattern pour formats avec tirets
{ name: 'FW25-Tirets', pattern: /3-605-168-\d{6}/g }

// Pattern pour formats avec points
{ name: 'FW25-Points', pattern: /3\.605\.168\.\d{6}/g }
```

## 6.2 Adaptation pour Nouveaux Fournisseurs

### Détection Automatique (Recommandée)

La détection de fournisseurs est **automatique** et basée sur :

#### 1. Analyse de la Colonne Fournisseur
```typescript
// src/utils/supplierDetection.ts
export function getAvailableSuppliers(excelData: BarcodeData[]): SupplierInfo[] {
  const supplierCounts = new Map<string, number>();
  
  // Comptage automatique des produits par fournisseur
  excelData.forEach(row => {
    if (row.supplier) {
      supplierCounts.set(row.supplier, (supplierCounts.get(row.supplier) || 0) + 1);
    }
  });
  
  // Tri par nombre de produits (plus gros fournisseur en premier)
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

#### 2. Correspondance Références Produits
```typescript
export function identifySupplier(
  productReferences: ProductReference[],
  excelData: BarcodeData[]
): SupplierInfo | null {
  
  const suppliers = getAvailableSuppliers(excelData);
  
  for (const supplier of suppliers) {
    const supplierData = excelData.filter(row => row.supplier === supplier.name);
    const supplierCodes = supplierData.map(row => row.productReference).filter(Boolean);
    
    let matches = 0;
    const matchedRefs: string[] = [];
    
    // Recherche correspondances exactes et partielles
    productReferences.forEach(ref => {
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
```

### Ajout Manuel d'un Fournisseur (Si Nécessaire)

#### Cas d'Usage
- Fournisseur avec nom non standard dans Excel
- Correspondances de références complexes
- Configuration spécifique requise

#### Implémentation
```typescript
// src/utils/supplierDetection.ts - Ajouter cette fonction
export function addManualSupplier(
  name: string, 
  productPatterns: string[],
  specialConfig?: SupplierConfig
): SupplierInfo {
  return {
    id: name.replace(/[^a-zA-Z0-9]/g, '_'),
    name,
    productCount: 0, // Sera calculé automatiquement
    detectedReferences: productPatterns,
    confidence: 1.0, // Confiance manuelle maximale
    isManual: true,
    config: specialConfig
  };
}

// Interface pour configuration spéciale
interface SupplierConfig {
  barcodePrefix?: string;           // Préfixe codes-barres spécifique
  referencePattern?: RegExp;        // Pattern références custom
  priceColumns?: string[];          // Colonnes prix alternatives
  requiredColumns?: string[];       // Colonnes obligatoires
  customValidation?: (data: BarcodeData) => boolean;
}
```

#### Utilisation
```typescript
// Exemple d'ajout manuel
const specialSupplier = addManualSupplier(
  'FOURNISSEUR_SPECIAL',
  ['REF001', 'REF002', 'REF003'],
  {
    barcodePrefix: '3605170',
    referencePattern: /[A-Z]{2}\d{7}/g,
    priceColumns: ['prix_special', 'tarif_custom'],
    requiredColumns: ['gencod', 'ref_special'],
    customValidation: (data) => data.price > 0 && data.description?.length > 5
  }
);
```

### Configuration Fournisseur Avancée

#### Fichier de Configuration (Optionnel)
```typescript
// src/config/suppliers.ts - Nouveau fichier
export const SUPPLIER_CONFIGS: { [key: string]: SupplierConfig } = {
  'OXBOW': {
    barcodePrefix: '3605168',
    referencePattern: /[A-Z0-9]{9}/g,
    priceColumns: ['x300', 'x350', 'prix'],
    requiredColumns: ['gencod', 'code_article'],
    customValidation: (data) => data.barcode.startsWith('3605168')
  },
  
  'SUPPLIER_PREMIUM': {
    barcodePrefix: '3605170',
    referencePattern: /PREM\d{6}/g,
    priceColumns: ['prix_premium', 'tarif_special'],
    requiredColumns: ['code_barre', 'reference_premium'],
    customValidation: (data) => data.price > 50 // Produits premium
  },
  
  'SUPPLIER_BUDGET': {
    barcodePrefix: '3605171',
    referencePattern: /BUD[A-Z]\d{5}/g,
    priceColumns: ['prix_budget'],
    requiredColumns: ['ean13', 'ref_budget'],
    customValidation: (data) => data.price < 30 // Produits budget
  }
};
```

## 6.3 Modification des Colonnes Excel Supportées

### Ajout de Nouvelles Colonnes

#### Étape 1 : Définir le Nouveau Détecteur
```typescript
// src/utils/excelProcessor.ts - Ligne ~50
const COLUMN_DETECTORS = {
  // Détecteurs existants...
  
  // 🆕 Nouveau détecteur
  newField: {
    names: [
      'nouvelle_colonne',     // Nom exact prioritaire
      'new_field',           // Nom anglais
      'champ_nouveau',       // Variante française
      'campo_nuevo'          // Variante espagnole
    ],
    validator: (value: any) => {
      // Logique de validation spécifique
      if (!value) return false;
      const str = value.toString().trim();
      
      // Exemple : Validation code postal
      return /^\d{5}$/.test(str) && str.length === 5;
    },
    confidence: (values: any[]) => {
      const validCount = values.filter(v => COLUMN_DETECTORS.newField.validator(v)).length;
      return Math.min(1.0, validCount / Math.max(values.length, 1));
    }
  },
  
  // Autre exemple : Validation email
  email: {
    names: ['email', 'e-mail', 'mail', 'adresse_mail'],
    validator: (value: any) => {
      if (!value) return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value.toString().trim());
    },
    confidence: (values: any[]) => {
      const validCount = values.filter(v => COLUMN_DETECTORS.email.validator(v)).length;
      return Math.min(1.0, validCount / Math.max(values.length, 1));
    }
  }
};
```

#### Étape 2 : Mettre à Jour les Types TypeScript
```typescript
// src/types/index.ts
export interface BarcodeData {
  // Champs existants...
  barcode: string;
  normalizedBarcode: string;
  source: 'pdf' | 'excel';
  price?: number;
  priceEuro?: number;
  pricePound?: number;
  color?: string;
  size?: string;
  supplier?: string;
  description?: string;
  productReference?: string;
  
  // 🆕 Nouveaux champs
  newField?: string;        // Nouveau champ générique
  email?: string;           // Email de contact
  postalCode?: string;      // Code postal
  category?: string;        // Catégorie produit
  weight?: number;          // Poids en grammes
  dimensions?: {            // Dimensions
    length: number;
    width: number;
    height: number;
  };
}
```

#### Étape 3 : Mettre à Jour le Traitement
```typescript
// src/utils/excelProcessor.ts - Dans processDataInChunks (ligne ~400)
async function processDataInChunks(
  rawData: any[][],
  columnMapping: { [key: string]: number },
  debug: DebugInfo
): Promise<BarcodeData[]> {
  
  // ... code existant ...
  
  for (const row of chunk) {
    try {
      // Extraction champs existants...
      const rawBarcode = sanitizeInput(row[columnMapping.barcode]?.toString().trim() || '');
      const price = parsePrice(row[columnMapping.price]);
      const color = sanitizeInput(row[columnMapping.color]?.toString().trim());
      
      // 🆕 Extraction nouveaux champs
      const newField = columnMapping.newField !== undefined && row[columnMapping.newField]
        ? sanitizeInput(row[columnMapping.newField].toString().trim())
        : undefined;
      
      const email = columnMapping.email !== undefined && row[columnMapping.email]
        ? sanitizeInput(row[columnMapping.email].toString().trim())
        : undefined;
      
      const weight = columnMapping.weight !== undefined && row[columnMapping.weight]
        ? parseFloat(row[columnMapping.weight].toString()) || undefined
        : undefined;
      
      // Création objet avec nouveaux champs
      const barcodeData: BarcodeData = {
        // Champs existants...
        barcode: rawBarcode,
        normalizedBarcode: normalizeBarcode(rawBarcode),
        source: 'excel',
        price,
        color,
        
        // 🆕 Nouveaux champs
        newField,
        email,
        weight
      };
      
      barcodes.push(barcodeData);
      
    } catch (error) {
      debug.dataQuality.errorRows++;
    }
  }
  
  return barcodes;
}
```

### Modification des Colonnes Existantes

#### Ajouter des Variantes de Noms
```typescript
// Exemple : Ajouter des variantes pour la colonne couleur
color: {
  names: [
    // Existants
    'lib._coloris', 'coloris', 'couleur', 'color', 'lib_coloris',
    
    // 🆕 Nouvelles variantes
    'colour',           // Anglais britannique
    'farbe',           // Allemand
    'colore',          // Italien
    'cor',             // Portugais
    'color_name',      // Variante technique
    'product_color',   // Variante descriptive
    'main_color'       // Couleur principale
  ],
  // validator et confidence inchangés
}
```

#### Améliorer la Validation
```typescript
// Exemple : Validation plus stricte pour les tailles
size: {
  names: ['taille', 'size'],
  validator: (value: any) => {
    if (!value) return false;
    const str = value.toString().trim().toUpperCase();
    
    // Tailles vêtements standard
    const clothingSizes = /^(XS|S|M|L|XL|XXL|XXXL|XXXXL)$/;
    
    // Tailles numériques (chaussures, etc.)
    const numericSizes = /^\d{1,3}$/;
    
    // Tailles avec fractions (ex: 8.5)
    const fractionalSizes = /^\d{1,2}\.\d{1}$/;
    
    // Tailles européennes (ex: 38, 40, 42)
    const europeanSizes = /^(3[0-9]|4[0-9]|5[0-9])$/;
    
    return clothingSizes.test(str) || 
           numericSizes.test(str) || 
           fractionalSizes.test(str) || 
           europeanSizes.test(str) ||
           str.length <= 10; // Fallback pour formats custom
  }
}
```

## 6.4 Extension des Fonctionnalités Existantes

### Ajout de Nouveaux Filtres

#### Étape 1 : Étendre FilterOptions
```typescript
// src/types/index.ts
export interface FilterOptions {
  // Filtres existants
  status: string[];
  severity: string[];
  searchTerm: string;
  colors: string[];
  sizes: string[];
  suppliers: string[];
  priceRange: { min: number; max: number } | null;
  currency: 'ALL' | 'EUR' | 'GBP';
  
  // 🆕 Nouveaux filtres
  categories: string[];           // Filtrage par catégorie
  weightRange: { min: number; max: number } | null;  // Plage de poids
  hasEmail: boolean | null;       // Produits avec/sans email
  dateRange: { start: Date; end: Date } | null;      // Plage de dates
  customFields: { [key: string]: any };              // Filtres custom
}
```

#### Étape 2 : Mettre à Jour l'Interface
```typescript
// src/components/AdvancedFiltersPanel.tsx
export function AdvancedFiltersPanel({ results, filters, onFiltersChange }) {
  
  // Extraction des nouvelles options
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    results.forEach(result => {
      if (result.excelData?.category) {
        categories.add(result.excelData.category);
      }
    });
    return Array.from(categories).sort();
  }, [results]);
  
  return (
    <div className="space-y-6">
      {/* Filtres existants... */}
      
      {/* 🆕 Nouveau filtre catégories */}
      {availableCategories.length > 0 && (
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">
            📂 Catégories ({availableCategories.length})
          </label>
          <div className="space-y-2">
            {availableCategories.map(category => (
              <label key={category} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category)}
                  onChange={(e) => {
                    const newCategories = e.target.checked
                      ? [...filters.categories, category]
                      : filters.categories.filter(c => c !== category);
                    onFiltersChange({ ...filters, categories: newCategories });
                  }}
                />
                <span>{category}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {/* 🆕 Filtre plage de poids */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-700">
          ⚖️ Plage de Poids (g)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="Min"
            value={filters.weightRange?.min || ''}
            onChange={(e) => {
              const min = parseFloat(e.target.value) || 0;
              const max = filters.weightRange?.max || 1000;
              onFiltersChange({ 
                ...filters, 
                weightRange: { min, max }
              });
            }}
            className="px-3 py-2 border rounded-lg"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.weightRange?.max || ''}
            onChange={(e) => {
              const max = parseFloat(e.target.value) || 1000;
              const min = filters.weightRange?.min || 0;
              onFiltersChange({ 
                ...filters, 
                weightRange: { min, max }
              });
            }}
            className="px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
```

#### Étape 3 : Mettre à Jour la Logique de Filtrage
```typescript
// src/utils/comparisonEngine.ts
export function filterResults(results: ComparisonResult[], filters: FilterOptions) {
  return results.filter(result => {
    // Filtres existants...
    if (filters.status.length > 0 && !filters.status.includes(result.status)) {
      return false;
    }
    
    // 🆕 Nouveau filtre catégories
    if (filters.categories && filters.categories.length > 0) {
      const category = result.excelData?.category;
      if (!category || !filters.categories.includes(category)) {
        return false;
      }
    }
    
    // 🆕 Filtre plage de poids
    if (filters.weightRange) {
      const weight = result.excelData?.weight;
      if (!weight || weight < filters.weightRange.min || weight > filters.weightRange.max) {
        return false;
      }
    }
    
    // 🆕 Filtre présence email
    if (filters.hasEmail !== null) {
      const hasEmail = !!result.excelData?.email;
      if (hasEmail !== filters.hasEmail) {
        return false;
      }
    }
    
    return true;
  });
}
```

### Ajout de Nouvelles Métriques

#### Étape 1 : Étendre ComplianceMetrics
```typescript
// src/types/index.ts
export interface ComplianceMetrics {
  // Métriques existantes...
  total: number;
  exactMatches: number;
  complianceRate: number;
  
  // 🆕 Nouvelles métriques
  categoryAnalysis?: {
    [category: string]: {
      total: number;
      matches: number;
      complianceRate: number;
    };
  };
  
  weightAnalysis?: {
    averageWeight: number;
    weightRange: { min: number; max: number };
    heavyProducts: number;      // > 1kg
    lightProducts: number;      // < 100g
  };
  
  qualityScore?: {
    dataCompleteness: number;   // % champs remplis
    dataAccuracy: number;       // % données valides
    overallScore: number;       // Score global
  };
  
  trendsAnalysis?: {
    monthlyComparison: { [month: string]: number };
    seasonalTrends: { [season: string]: number };
    yearOverYear: number;
  };
}
```

#### Étape 2 : Calculer les Nouvelles Métriques
```typescript
// src/utils/comparisonEngine.ts
export function calculateComplianceMetrics(
  results: ComparisonResult[],
  supplierName?: string,
  originalPdfCount?: number
): ComplianceMetrics {
  
  // Calculs existants...
  const total = results.length;
  const exactMatches = results.filter(r => r.status === 'exact_match').length;
  const complianceRate = total > 0 ? (exactMatches / total) * 100 : 0;
  
  // 🆕 Analyse par catégorie
  const categoryAnalysis: { [category: string]: any } = {};
  const excelData = results.map(r => r.excelData).filter(Boolean) as BarcodeData[];
  
  excelData.forEach(data => {
    if (data.category) {
      if (!categoryAnalysis[data.category]) {
        categoryAnalysis[data.category] = { total: 0, matches: 0, complianceRate: 0 };
      }
      categoryAnalysis[data.category].total++;
      
      // Vérifier si ce produit a une correspondance
      const hasMatch = results.some(r => 
        r.excelData?.barcode === data.barcode && r.status === 'exact_match'
      );
      if (hasMatch) {
        categoryAnalysis[data.category].matches++;
      }
    }
  });
  
  // Calculer taux de conformité par catégorie
  Object.keys(categoryAnalysis).forEach(category => {
    const cat = categoryAnalysis[category];
    cat.complianceRate = cat.total > 0 ? (cat.matches / cat.total) * 100 : 0;
  });
  
  // 🆕 Analyse du poids
  const weights = excelData.map(d => d.weight).filter(Boolean) as number[];
  const weightAnalysis = weights.length > 0 ? {
    averageWeight: weights.reduce((sum, w) => sum + w, 0) / weights.length,
    weightRange: {
      min: Math.min(...weights),
      max: Math.max(...weights)
    },
    heavyProducts: weights.filter(w => w > 1000).length,
    lightProducts: weights.filter(w => w < 100).length
  } : undefined;
  
  // 🆕 Score de qualité
  const qualityScore = calculateQualityScore(excelData);
  
  return {
    // Métriques existantes...
    total,
    exactMatches,
    complianceRate,
    
    // 🆕 Nouvelles métriques
    categoryAnalysis,
    weightAnalysis,
    qualityScore
  };
}

function calculateQualityScore(data: BarcodeData[]): {
  dataCompleteness: number;
  dataAccuracy: number;
  overallScore: number;
} {
  if (data.length === 0) {
    return { dataCompleteness: 0, dataAccuracy: 0, overallScore: 0 };
  }
  
  // Calcul complétude des données
  const requiredFields = ['barcode', 'price', 'description', 'supplier'];
  const optionalFields = ['color', 'size', 'email', 'weight'];
  
  let completenessScore = 0;
  data.forEach(item => {
    let fieldCount = 0;
    const totalFields = requiredFields.length + optionalFields.length;
    
    requiredFields.forEach(field => {
      if (item[field as keyof BarcodeData]) fieldCount += 2; // Poids double pour champs requis
    });
    
    optionalFields.forEach(field => {
      if (item[field as keyof BarcodeData]) fieldCount += 1;
    });
    
    completenessScore += (fieldCount / (requiredFields.length * 2 + optionalFields.length)) * 100;
  });
  
  const dataCompleteness = completenessScore / data.length;
  
  // Calcul précision des données
  let accuracyScore = 0;
  data.forEach(item => {
    let validFields = 0;
    let totalCheckedFields = 0;
    
    // Validation code-barres
    if (item.barcode) {
      totalCheckedFields++;
      if (/^\d{13}$/.test(item.barcode)) validFields++;
    }
    
    // Validation prix
    if (item.price !== undefined) {
      totalCheckedFields++;
      if (item.price > 0 && item.price < 10000) validFields++;
    }
    
    // Validation email
    if (item.email) {
      totalCheckedFields++;
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)) validFields++;
    }
    
    if (totalCheckedFields > 0) {
      accuracyScore += (validFields / totalCheckedFields) * 100;
    }
  });
  
  const dataAccuracy = data.length > 0 ? accuracyScore / data.length : 0;
  const overallScore = (dataCompleteness + dataAccuracy) / 2;
  
  return {
    dataCompleteness,
    dataAccuracy,
    overallScore
  };
}
```

## 6.5 Fichiers Spécifiques par Type de Changement

### Modifications Interface Utilisateur

```
src/components/           # Composants UI
├── Layout.tsx           # Structure générale, header, navigation
├── *FiltersPanel.tsx    # Filtres et recherche avancée
├── *Table.tsx           # Tableaux de données et affichage
├── *Chart.tsx           # Graphiques et visualisations
├── *Modal.tsx           # Modales et popups
├── *Form.tsx            # Formulaires et saisie
└── *Card.tsx            # Cartes et résumés
```

### Modifications Logique Métier

```
src/utils/
├── comparisonEngine.ts  # ⭐ Algorithmes de comparaison et métriques
├── supplierDetection.ts # ⭐ Logique fournisseurs et identification
├── excelProcessor.ts    # ⭐ Traitement Excel et détection colonnes
├── pdfProcessor.ts      # ⭐ Traitement PDF et extraction patterns
├── exportUtils.ts       # Génération rapports et exports
├── fileValidation.ts    # Validation fichiers et sécurité
└── barcodeNormalizer.ts # Normalisation et validation codes-barres
```

### Modifications Types et Interfaces

```
src/types/index.ts       # ⭐ Toutes les définitions TypeScript
```

### Modifications État Global

```
src/contexts/
├── AppContext.tsx       # ⭐ État principal et actions
└── ThemeContext.tsx     # Thème et préférences utilisateur
```

### Modifications Configuration

```
vite.config.ts          # Configuration build et plugins
tailwind.config.js      # Configuration styles et thème
package.json            # Dépendances et scripts
eslint.config.js        # Règles de qualité code
tsconfig.json           # Configuration TypeScript
```

### Guide de Modification par Cas d'Usage

#### Ajouter un Nouveau Format de Code-barres
1. **Modifier** : `src/utils/pdfProcessor.ts` (patterns)
2. **Modifier** : `src/utils/barcodeNormalizer.ts` (validation)
3. **Tester** : Créer échantillons de test

#### Ajouter une Nouvelle Colonne Excel
1. **Modifier** : `src/utils/excelProcessor.ts` (détecteurs)
2. **Modifier** : `src/types/index.ts` (interface BarcodeData)
3. **Modifier** : `src/components/*Table.tsx` (affichage)
4. **Modifier** : `src/components/*FiltersPanel.tsx` (filtres)

#### Ajouter un Nouveau Type de Rapport
1. **Modifier** : `src/utils/exportUtils.ts` (génération)
2. **Modifier** : `src/components/*ResultsPage.tsx` (boutons export)
3. **Modifier** : `src/types/index.ts` (types si nécessaire)

#### Ajouter une Nouvelle Métrique
1. **Modifier** : `src/types/index.ts` (ComplianceMetrics)
2. **Modifier** : `src/utils/comparisonEngine.ts` (calcul)
3. **Modifier** : `src/components/*Chart.tsx` (visualisation)
4. **Modifier** : `src/components/ExecutiveSummary.tsx` (affichage)

---

**Prochaine section :** [Déploiement et Configuration](./07-deploiement-configuration.md)