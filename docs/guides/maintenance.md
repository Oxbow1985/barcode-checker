# Guide de Maintenance - Oxbow Barcode Checker

Ce guide détaille les procédures de maintenance et d'évolution de l'application Oxbow Barcode Checker.

## 🔄 Maintenance Régulière

### Mises à Jour des Dépendances

#### Vérification des Dépendances
```bash
# Vérifier les dépendances obsolètes
npm outdated

# Vérifier les vulnérabilités
npm audit
```

#### Mise à Jour Sécurisée
```bash
# Mise à jour mineure (patch)
npm update

# Mise à jour majeure (avec précaution)
npx npm-check-updates -u
npm install
```

#### Dépendances Critiques
| Dépendance | Rôle | Précautions |
|------------|------|-------------|
| `pdfjs-dist` | Extraction PDF | Tester extraction sur échantillons variés |
| `xlsx` | Traitement Excel | Vérifier formats supportés |
| `chart.js` | Graphiques | Tester tous les types de graphiques |
| `react` | Framework UI | Tester application complète |

### Surveillance Performance

#### Métriques à Surveiller
- Temps de chargement initial
- Temps de traitement fichiers
- Utilisation mémoire
- Taux d'erreur

#### Outils de Monitoring
```javascript
// src/utils/performanceMonitor.ts
export function logPerformanceMetrics() {
  const metrics = {
    loadTime: performance.now(),
    memory: performance.memory ? {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize
    } : null,
    errors: window.__oxbowErrors || []
  };
  
  console.table(metrics);
  
  // Envoi à service monitoring (optionnel)
  if (import.meta.env.VITE_MONITORING_URL) {
    fetch(import.meta.env.VITE_MONITORING_URL, {
      method: 'POST',
      body: JSON.stringify(metrics)
    });
  }
}
```

### Gestion des Logs

#### Niveaux de Log
```typescript
// src/utils/logger.ts
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

const currentLevel = import.meta.env.VITE_LOG_LEVEL || 
                    (import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN);

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (currentLevel <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (currentLevel <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (currentLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  
  error: (message: string, error?: any, ...args: any[]) => {
    if (currentLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, error, ...args);
      
      // Capture pour monitoring
      if (window.__oxbowErrors) {
        window.__oxbowErrors.push({
          message,
          error: error?.toString(),
          timestamp: new Date().toISOString()
        });
      }
    }
  }
};
```

## 🔧 Modifications Courantes

### Ajout d'un Nouveau Format de Code-barres

#### 1. Localiser le Fichier des Patterns
```typescript
// src/utils/pdfProcessor.ts - Ligne ~25
const universalPatterns = [
  { name: 'FW25', pattern: /3\s*605\s*168\s*\d{6}/g },
  { name: 'SS26', pattern: /3\s*6051\s*68\s*\d{6}/g },
  { name: 'Complet', pattern: /3605168\d{6}/g },
  { name: 'Ultra-flexible', pattern: /3\s*6\s*0\s*5\s*1\s*6\s*8\s*\d{6}/g }
];
```

#### 2. Ajouter le Nouveau Pattern
```typescript
// Exemple: Ajout format SS27
const universalPatterns = [
  // Patterns existants...
  
  // Nouveau pattern SS27
  { name: 'SS27', pattern: /3\s*605\s*169\s*\d{6}/g }
];
```

#### 3. Mettre à Jour la Validation
```typescript
// src/utils/pdfProcessor.ts - Ligne ~85
function isValidOxbowBarcode(barcode: string): boolean {
  // Ajouter le nouveau préfixe
  const validPrefixes = [
    '3605168',  // FW25/SS26 existant
    '3605169'   // SS27 nouveau
  ];
  
  return barcode.length === 13 && 
         /^\d{13}$/.test(barcode) && 
         validPrefixes.some(prefix => barcode.startsWith(prefix));
}
```

#### 4. Tester avec des Échantillons
```typescript
// tests/pdfProcessor.test.ts
test('should detect SS27 barcodes', () => {
  const testCases = [
    '3605169123456',
    '3 605 169 123456',
    '3605169 123456'
  ];
  
  testCases.forEach(code => {
    const result = extractBarcodesFromText(code);
    expect(result).toContain('3605169123456');
  });
});
```

### Ajout d'une Nouvelle Colonne Excel

#### 1. Ajouter le Nouveau Détecteur
```typescript
// src/utils/excelProcessor.ts - Ligne ~50
const COLUMN_DETECTORS = {
  // Détecteurs existants...
  
  // Nouveau détecteur
  category: {
    names: ['categorie', 'category', 'cat', 'product_category'],
    validator: (value: any) => {
      if (!value) return false;
      const str = value.toString().trim();
      return str.length > 1 && str.length < 50;
    },
    confidence: (values: any[]) => {
      const validCount = values.filter(v => COLUMN_DETECTORS.category.validator(v)).length;
      return Math.min(1.0, validCount / Math.max(values.length, 1));
    }
  }
};
```

#### 2. Mettre à Jour l'Interface BarcodeData
```typescript
// src/types/index.ts
export interface BarcodeData {
  // Champs existants...
  
  // Nouveau champ
  category?: string;
}
```

#### 3. Mettre à Jour le Traitement
```typescript
// src/utils/excelProcessor.ts - Dans processDataInChunks (ligne ~400)
const category = columnMapping.category !== undefined && row[columnMapping.category]
  ? sanitizeInput(row[columnMapping.category].toString().trim())
  : undefined;

// Ajouter au BarcodeData
barcodes.push({
  // Champs existants...
  category
});
```

#### 4. Mettre à Jour l'Affichage (si nécessaire)
```typescript
// src/components/ResultDetailModal.tsx
<div>
  <label className="text-xs font-medium text-gray-600">Catégorie</label>
  <p className="text-sm text-gray-900">
    {result.excelData?.category || 'Non spécifiée'}
  </p>
</div>
```

### Modification des Filtres

#### 1. Étendre l'Interface FilterOptions
```typescript
// src/types/index.ts
export interface FilterOptions {
  // Filtres existants...
  
  // Nouveau filtre
  categories: string[];
}
```

#### 2. Mettre à Jour le Composant de Filtrage
```typescript
// src/components/AdvancedFiltersPanel.tsx
// Extraction des catégories disponibles
const availableCategories = useMemo(() => {
  const categories = new Set<string>();
  results.forEach(result => {
    if (result.excelData?.category) {
      categories.add(result.excelData.category);
    }
  });
  return Array.from(categories).sort();
}, [results]);

// Ajout de l'UI
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
```

#### 3. Mettre à Jour la Logique de Filtrage
```typescript
// src/utils/comparisonEngine.ts
export function filterResults(results: ComparisonResult[], filters: FilterOptions) {
  return results.filter(result => {
    // Filtres existants...
    
    // Nouveau filtre catégories
    if (filters.categories && filters.categories.length > 0) {
      const category = result.excelData?.category;
      if (!category || !filters.categories.includes(category)) {
        return false;
      }
    }
    
    return true;
  });
}
```

## 🔍 Debugging et Résolution de Problèmes

### Outils de Debugging

#### Mode Debug Intégré
```typescript
// src/utils/debug.ts
export const debugMode = {
  isEnabled: () => {
    return localStorage.getItem('oxbow-debug') === 'true' || 
           import.meta.env.VITE_DEBUG_MODE === 'true';
  },
  
  enable: () => {
    localStorage.setItem('oxbow-debug', 'true');
    console.log('🐞 Mode debug activé');
  },
  
  disable: () => {
    localStorage.removeItem('oxbow-debug');
    console.log('🐞 Mode debug désactivé');
  },
  
  log: (area: string, message: string, data?: any) => {
    if (!debugMode.isEnabled()) return;
    
    console.group(`🐞 DEBUG: ${area}`);
    console.log(message);
    if (data) console.log(data);
    console.groupEnd();
  }
};

// Utilisation
debugMode.log('PDF Processor', 'Extraction patterns', {
  patterns: universalPatterns,
  text: fullText.substring(0, 200) + '...'
});
```

#### Composant DebugPanel
```typescript
// src/components/DebugPanel.tsx
export function DebugPanel({ debug, isVisible, onToggle }) {
  // Implémentation...
}

// Activation
<DebugPanel
  debug={debugInfo}
  isVisible={showDebug}
  onToggle={() => setShowDebug(!showDebug)}
/>
```

### Problèmes Courants et Solutions

#### 1. Aucun Code-barres Trouvé dans le PDF

**Symptômes:**
- Message "Aucun code-barres trouvé"
- Extraction PDF échoue

**Causes possibles:**
- PDF scanné (image) au lieu de texte
- Format de codes-barres non supporté
- Encodage PDF non standard

**Solutions:**
1. Vérifier que le PDF contient du texte extractible
   ```javascript
   // Test rapide
   const hasText = await checkPdfHasText(file);
   console.log('PDF contient du texte:', hasText);
   ```

2. Ajouter un pattern plus flexible
   ```javascript
   // Pattern plus permissif
   { name: 'Ultra-flexible', pattern: /\d{13}/g }
   ```

3. Essayer un autre encodage
   ```javascript
   // Tester différents encodages
   const encodings = ['utf-8', 'latin1', 'ascii'];
   for (const encoding of encodings) {
     try {
       const text = await extractTextWithEncoding(file, encoding);
       const codes = extractBarcodesFromText(text);
       if (codes.length > 0) {
         console.log(`✅ Codes trouvés avec encodage ${encoding}`);
         return codes;
       }
     } catch (error) {
       console.warn(`❌ Échec avec encodage ${encoding}:`, error);
     }
   }
   ```

#### 2. Détection Colonnes Excel Échoue

**Symptômes:**
- Message "Colonne X non trouvée"
- Traitement Excel échoue

**Causes possibles:**
- Noms de colonnes non standards
- En-têtes sur une ligne différente
- Format Excel corrompu

**Solutions:**
1. Afficher toutes les colonnes disponibles
   ```javascript
   // Logging des en-têtes
   console.log('En-têtes disponibles:', headers);
   ```

2. Ajuster les noms de colonnes reconnus
   ```javascript
   // Ajouter des variantes
   barcode: {
     names: [
       // Ajouter les variantes problématiques
       'code_barre', 'code-barre', 'cb', 'ean-13'
     ]
   }
   ```

3. Rechercher les en-têtes dans plusieurs lignes
   ```javascript
   // Scan des 5 premières lignes
   for (let i = 0; i < Math.min(5, data.length); i++) {
     const potentialHeaders = data[i];
     // Analyse...
   }
   ```

#### 3. Problèmes de Mémoire avec Gros Fichiers

**Symptômes:**
- Crash navigateur
- Message "Out of memory"
- Performance dégradée

**Solutions:**
1. Traitement par chunks
   ```javascript
   // Traiter par lots de 1000 lignes
   for (let i = 0; i < data.length; i += 1000) {
     const chunk = data.slice(i, i + 1000);
     await processChunk(chunk);
     
     // Pause pour libérer le thread principal
     await new Promise(resolve => setTimeout(resolve, 0));
   }
   ```

2. Nettoyage mémoire explicite
   ```javascript
   // Libérer les grosses variables
   const result = processData(largeData);
   largeData = null; // Aide GC
   
   // Force GC si disponible
   if ('gc' in window) {
     (window as any).gc();
   }
   ```

3. Utiliser Web Workers
   ```javascript
   // Traitement en arrière-plan
   const worker = new Worker('/workers/fileProcessor.js');
   worker.postMessage({ file, action: 'PROCESS' });
   worker.onmessage = (event) => {
     const { result } = event.data;
     // Utiliser le résultat
   };
   ```

## 📈 Optimisation et Performance

### Optimisations Critiques

#### 1. Traitement Fichiers Volumineux
```typescript
// Streaming pour gros fichiers
async function processLargeFile(file: File) {
  const CHUNK_SIZE = 1024 * 1024; // 1MB
  const fileSize = file.size;
  const chunks = Math.ceil(fileSize / CHUNK_SIZE);
  
  let processedSize = 0;
  const results = [];
  
  for (let i = 0; i < chunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, fileSize);
    const chunk = file.slice(start, end);
    
    // Traiter le chunk
    const chunkResult = await processChunk(chunk);
    results.push(chunkResult);
    
    // Mise à jour progression
    processedSize += (end - start);
    const progress = (processedSize / fileSize) * 100;
    updateProgress(progress);
    
    // Pause pour UI
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return mergeResults(results);
}
```

#### 2. Memoization des Calculs Coûteux
```typescript
// Utilisation de useMemo pour calculs coûteux
const filteredResults = useMemo(() => {
  console.time('filterResults');
  const result = filterResults(results, filters);
  console.timeEnd('filterResults');
  return result;
}, [results, filters]);

// Utilisation de useCallback pour fonctions stables
const handleProcessFile = useCallback(async (file: File) => {
  // Traitement...
}, [dependencies]);
```

#### 3. Virtualisation des Listes Longues
```typescript
// Utilisation de react-window pour listes longues
import { FixedSizeList } from 'react-window';

function ResultsList({ results }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ResultItem result={results[index]} />
    </div>
  );
  
  return (
    <FixedSizeList
      height={500}
      width="100%"
      itemCount={results.length}
      itemSize={60}
    >
      {Row}
    </FixedSizeList>
  );
}
```

### Profiling et Benchmarking

#### Mesure Performance
```typescript
// Mesure temps d'exécution
function measurePerformance<T>(fn: () => T, label: string): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
  
  return result;
}

// Utilisation
const results = measurePerformance(
  () => compareData(pdfBarcodes, excelBarcodes),
  'Comparaison données'
);
```

#### Benchmark Automatisé
```typescript
// Benchmark avec différentes tailles de données
async function runBenchmarks() {
  const sizes = [100, 1000, 10000];
  const results = {};
  
  for (const size of sizes) {
    const testData = generateTestData(size);
    
    console.log(`🧪 Benchmark avec ${size} éléments`);
    
    const start = performance.now();
    await processData(testData);
    const end = performance.now();
    
    results[size] = end - start;
    console.log(`⏱️ Temps: ${(end - start).toFixed(2)}ms`);
  }
  
  console.table(results);
}
```

## 🔐 Sécurité

### Audit de Sécurité

#### Vérification des Dépendances
```bash
# Audit npm
npm audit

# Correction automatique (si possible)
npm audit fix

# Correction avec mises à jour majeures (avec précaution)
npm audit fix --force
```

#### Validation des Entrées
```typescript
// Validation stricte des entrées utilisateur
function validateUserInput(input: string): string {
  // Suppression caractères dangereux
  return input
    .replace(/[<>\"'&]/g, '') // Prévention XSS
    .replace(/[\x00-\x1F\x7F]/g, '') // Caractères de contrôle
    .replace(/javascript:/gi, '') // Prévention injection JS
    .trim()
    .substring(0, 1000); // Limitation longueur
}
```

#### Protection Contre les Attaques
```typescript
// Protection contre les attaques par force brute
const rateLimiter = {
  attempts: new Map<string, { count: number, timestamp: number }>(),
  
  check: function(ip: string, action: string): boolean {
    const key = `${ip}:${action}`;
    const now = Date.now();
    const entry = this.attempts.get(key);
    
    // Première tentative
    if (!entry) {
      this.attempts.set(key, { count: 1, timestamp: now });
      return true;
    }
    
    // Réinitialisation après 1 heure
    if (now - entry.timestamp > 3600000) {
      this.attempts.set(key, { count: 1, timestamp: now });
      return true;
    }
    
    // Limite atteinte
    if (entry.count >= 10) {
      return false;
    }
    
    // Incrémenter compteur
    entry.count++;
    this.attempts.set(key, entry);
    return true;
  },
  
  reset: function(ip: string, action: string): void {
    const key = `${ip}:${action}`;
    this.attempts.delete(key);
  }
};
```

## 📚 Documentation

### Génération Documentation

#### JSDoc
```typescript
/**
 * Compare les codes-barres PDF avec les données Excel
 * 
 * @param pdfBarcodes - Codes-barres extraits du PDF
 * @param excelBarcodes - Codes-barres extraits de l'Excel
 * @returns Résultats de la comparaison
 * @throws {ComparisonError} Si la comparaison échoue
 * 
 * @example
 * ```typescript
 * const results = compareData(pdfBarcodes, excelBarcodes);
 * console.log(`${results.length} résultats trouvés`);
 * ```
 */
function compareData(
  pdfBarcodes: BarcodeData[], 
  excelBarcodes: BarcodeData[]
): ComparisonResult[] {
  // Implémentation...
}
```

#### Documentation Utilisateur
Maintenir à jour:
- Guide d'utilisation
- FAQ
- Tutoriels vidéo
- Exemples de cas d'usage

## 🔄 Mise à Jour de la Documentation

Après chaque modification significative:

1. Mettre à jour la documentation technique
2. Mettre à jour les guides utilisateur
3. Mettre à jour les exemples de code
4. Mettre à jour les captures d'écran

---

Pour toute question ou assistance, contactez l'équipe technique à tech@oxbow.com.