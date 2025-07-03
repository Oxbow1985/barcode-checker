# 2. Technologies et Choix Techniques

## 2.1 Stack Technologique Complète

### Frontend Core
```json
{
  "react": "^18.3.1",           // Framework UI principal
  "typescript": "^5.5.3",       // Typage statique
  "vite": "^5.4.2",            // Build tool moderne
  "tailwindcss": "^3.4.1"      // Framework CSS utilitaire
}
```

### Traitement de Fichiers
```json
{
  "pdfjs-dist": "^3.11.174",   // Extraction PDF
  "xlsx": "^0.18.5",           // Traitement Excel
  "react-dropzone": "^14.3.8"  // Upload fichiers
}
```

### Interface Utilisateur
```json
{
  "framer-motion": "^10.16.16", // Animations fluides
  "lucide-react": "^0.344.0",   // Icônes cohérentes
  "react-hot-toast": "^2.4.1",  // Notifications
  "chart.js": "^4.4.0"          // Graphiques analytiques
}
```

### Export et Rapports
```json
{
  "jspdf": "^2.5.1",           // Génération PDF
  "jspdf-autotable": "^3.6.0", // Tableaux PDF
  "date-fns": "^2.30.0"        // Manipulation dates
}
```

## 2.2 Justification des Choix Techniques

### React + TypeScript : Fondation Solide

#### Pourquoi React ?
- **Écosystème mature** : Vaste communauté et librairies
- **Performance** : Virtual DOM et optimisations
- **Composants réutilisables** : Architecture modulaire
- **Hooks modernes** : Gestion d'état simplifiée

#### Pourquoi TypeScript ?
```typescript
// Exemple de typage strict pour la sécurité
interface BarcodeData {
  barcode: string;
  normalizedBarcode: string;
  source: 'pdf' | 'excel';
  price?: number;
  // Nouveaux champs SS26
  priceEuro?: number;
  pricePound?: number;
  color?: string;
  size?: string;
}

// Prévention d'erreurs à la compilation
function processBarcode(data: BarcodeData): ComparisonResult {
  // TypeScript garantit la structure des données
  return {
    barcode: data.barcode,
    status: data.price ? 'exact_match' : 'pdf_only',
    severity: 'low'
  };
}
```

**Avantages TypeScript :**
- **Sécurité type** : Détection erreurs à la compilation
- **IntelliSense** : Autocomplétion et documentation
- **Refactoring sûr** : Modifications sans casse
- **Maintenabilité** : Code auto-documenté

### Vite vs Create React App

#### Pourquoi Vite ?
```javascript
// Configuration Vite optimisée
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],           // Framework
          charts: ['chart.js', 'react-chartjs-2'], // Graphiques
          utils: ['xlsx', 'jspdf', 'pdfjs-dist']   // Utilitaires
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'] // Optimisation bundle
  }
});
```

**Avantages Vite :**
- ⚡ **Performance** : HMR instantané, build 10x plus rapide
- 📦 **Bundle optimisé** : Tree-shaking automatique, chunks intelligents
- 🔧 **Configuration simple** : Zero-config par défaut
- 🚀 **Développement** : Démarrage instantané

### PDF.js vs Alternatives

#### Pourquoi PDF.js ?
```typescript
// Extraction robuste et sécurisée
export async function extractBarcodesFromPdf(file: File) {
  // Configuration worker pour performance
  pdfjsLib.GlobalWorkerOptions.workerSrc = 
    `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  // Traitement page par page pour optimiser la mémoire
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return extractBarcodesFromText(fullText);
}
```

**Avantages PDF.js :**
- 🔒 **Sécurité** : Pas d'exécution de code malveillant
- 🌐 **Client-side** : Aucune donnée envoyée sur serveur
- 📱 **Cross-platform** : Fonctionne partout (navigateur, mobile)
- 🎯 **Précision** : Extraction texte fidèle

#### Alternatives Écartées
- **PDF-lib** : Plus orienté création que lecture
- **PDF2pic** : Conversion en images (perte de texte)
- **Solutions serveur** : Problèmes de confidentialité

### XLSX vs Papa Parse

#### Pourquoi XLSX ?
```typescript
// Support complet des formats Excel
const workbook = XLSX.read(arrayBuffer, { 
  type: 'array',
  cellDates: true,    // Gestion dates automatique
  cellNF: false,      // Pas de formatage numérique
  raw: false,         // Conversion en texte
  codepage: 65001     // UTF-8 par défaut
});

// Gestion intelligente des feuilles
const sheetPriorities = [
  'Main sheet',       // SS26 standard
  'Sheet1',          // Défaut Excel
  'AH 25',           // FW25 standard
  'Data', 'Produits' // Noms courants
];
```

**Avantages XLSX :**
- 📊 **Support complet** : .xlsx, .xlsm, .xls, .csv
- 🎯 **Détection intelligente** : Gestion automatique des encodages
- 🔧 **Flexibilité** : Accès aux métadonnées Excel
- 🛡️ **Robustesse** : Gestion des fichiers corrompus

#### Papa Parse : Limité au CSV
- ❌ Pas de support .xlsx/.xls
- ❌ Pas de gestion des feuilles multiples
- ❌ Pas d'accès aux métadonnées

## 2.3 Architecture de Données

### Flux de Données Unidirectionnel

```typescript
// Context Pattern pour l'état global
interface AppState {
  step: 'upload' | 'supplier-validation' | 'processing' | 'results';
  files: { pdfFile?: File; excelFile?: File };
  results: ComparisonResult[];
  detectedFormat: 'FW25' | 'SS26' | 'MIXED';
  selectedSupplier?: SupplierInfo;
}

// Actions typées pour la sécurité
type AppAction = 
  | { type: 'SET_STEP'; payload: ProcessingState['step'] }
  | { type: 'SET_RESULTS'; payload: ComparisonResult[] }
  | { type: 'SET_DETECTED_FORMAT'; payload: 'FW25' | 'SS26' | 'MIXED' };

// Reducer pour mutations contrôlées
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'SET_RESULTS':
      return { ...state, results: action.payload };
    case 'SET_DETECTED_FORMAT':
      return { ...state, detectedFormat: action.payload };
    default:
      return state;
  }
}
```

### Gestion d'État Avancée

#### Context API vs Redux
**Choix : Context API**

**Avantages :**
- ✅ **Simplicité** : Moins de boilerplate
- ✅ **Performance** : Optimisations React natives
- ✅ **TypeScript** : Intégration native
- ✅ **Bundle size** : Pas de dépendance externe

**Redux écarté car :**
- ❌ **Overkill** : Application pas assez complexe
- ❌ **Boilerplate** : Trop de code pour peu de valeur
- ❌ **Bundle** : Augmentation taille inutile

## 2.4 Choix d'Interface Utilisateur

### Tailwind CSS vs Styled Components

#### Pourquoi Tailwind CSS ?
```typescript
// Composant avec Tailwind - Lisible et maintenable
function FileUploadZone({ title, description, errors }) {
  return (
    <div className={`
      relative border-2 border-dashed rounded-xl p-8 text-center
      transition-all duration-300 ease-in-out
      ${errors.length > 0
        ? 'border-error-300 bg-error-50 hover:border-error-400'
        : 'border-gray-300 bg-white hover:border-oxbow-300 hover:bg-oxbow-50'
      }
    `}>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
    </div>
  );
}
```

**Avantages Tailwind :**
- 🎨 **Design system** : Cohérence automatique
- ⚡ **Performance** : CSS optimisé et purgé
- 🔧 **Maintenance** : Styles colocalisés avec composants
- 📱 **Responsive** : Classes responsive intégrées

### Framer Motion vs React Spring

#### Pourquoi Framer Motion ?
```typescript
// Animations déclaratives et performantes
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
  className="bg-white rounded-xl shadow-card p-6"
>
  <AnimatePresence mode="wait">
    {showContent && (
      <motion.div
        key="content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {content}
      </motion.div>
    )}
  </AnimatePresence>
</motion.div>
```

**Avantages Framer Motion :**
- 🎬 **API déclarative** : Animations simples à écrire
- ⚡ **Performance** : Optimisations GPU automatiques
- 🔄 **AnimatePresence** : Gestion entrées/sorties
- 📱 **Gestures** : Support tactile intégré

## 2.5 Outils de Développement

### Build et Bundling

#### Configuration Vite Optimisée
```typescript
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          utils: ['xlsx', 'jspdf', 'pdfjs-dist']
        }
      }
    },
    sourcemap: false,
    minify: 'terser'
  }
});
```

### Qualité de Code

#### ESLint + TypeScript
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react-hooks/exhaustive-deps": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

#### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

## 2.6 Contraintes et Limitations

### Contraintes Techniques

#### Navigateur
- **Minimum** : Chrome 90+, Firefox 88+, Safari 14+
- **Raison** : APIs modernes (File API, Web Workers, ES2020)
- **Impact** : 95%+ des utilisateurs couverts

#### Mémoire
- **Limite PDF** : 50MB (validation côté client)
- **Limite Excel** : 20MB (optimisation performance)
- **Gestion** : Traitement par chunks, nettoyage automatique

#### Performance
- **Traitement** : ~1000 codes-barres/minute
- **Optimisation** : Web Workers (roadmap)
- **Monitoring** : Métriques performance intégrées

### Choix d'Architecture

#### Client-Side Only
**Avantages :**
- 🔒 **Confidentialité** : Données ne quittent jamais le navigateur
- ⚡ **Performance** : Pas de latence réseau
- 💰 **Coût** : Pas d'infrastructure serveur
- 🌐 **Disponibilité** : Fonctionne offline

**Inconvénients :**
- 📱 **Ressources** : Dépendant de la machine client
- 🔄 **Synchronisation** : Pas de partage entre utilisateurs
- 📊 **Analytics** : Métriques limitées

---

**Prochaine section :** [Fonctionnalités Détaillées](./03-fonctionnalites-detaillees.md)