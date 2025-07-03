# Logs et Debugging - Oxbow Barcode Checker

Ce document détaille les pratiques de logging et les techniques de debugging pour l'application Oxbow Barcode Checker.

## 📝 Système de Logging

### Niveaux de Log

```typescript
// src/utils/logger.ts
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// Niveau configuré via variables d'environnement
const currentLevel = (() => {
  const envLevel = import.meta.env.VITE_LOG_LEVEL?.toUpperCase();
  if (envLevel === 'DEBUG') return LogLevel.DEBUG;
  if (envLevel === 'INFO') return LogLevel.INFO;
  if (envLevel === 'WARN') return LogLevel.WARN;
  if (envLevel === 'ERROR') return LogLevel.ERROR;
  return import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN;
})();

// Activation debug via localStorage
const isDebugEnabled = () => {
  return localStorage.getItem('oxbow-debug') === 'true' || 
         currentLevel === LogLevel.DEBUG;
};

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (currentLevel <= LogLevel.DEBUG) {
      console.debug(`%c[DEBUG] ${message}`, 'color: #6b7280', ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (currentLevel <= LogLevel.INFO) {
      console.info(`%c[INFO] ${message}`, 'color: #3b82f6', ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (currentLevel <= LogLevel.WARN) {
      console.warn(`%c[WARN] ${message}`, 'color: #f59e0b', ...args);
    }
    
    // Capture pour monitoring
    captureWarning(message, args);
  },
  
  error: (message: string, error?: any, ...args: any[]) => {
    if (currentLevel <= LogLevel.ERROR) {
      console.error(`%c[ERROR] ${message}`, 'color: #ef4444', error, ...args);
    }
    
    // Capture pour monitoring
    captureError(message, error, args);
  },
  
  group: (name: string, collapsed = false) => {
    if (currentLevel <= LogLevel.DEBUG) {
      collapsed ? console.groupCollapsed(name) : console.group(name);
    }
  },
  
  groupEnd: () => {
    if (currentLevel <= LogLevel.DEBUG) {
      console.groupEnd();
    }
  },
  
  table: (data: any, columns?: string[]) => {
    if (currentLevel <= LogLevel.DEBUG) {
      console.table(data, columns);
    }
  }
};

// Capture des erreurs pour monitoring
function captureError(message: string, error?: any, args?: any[]) {
  if (!window.__oxbowErrors) {
    window.__oxbowErrors = [];
  }
  
  window.__oxbowErrors.push({
    type: 'error',
    message,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    args,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent
  });
  
  // Limiter la taille du tableau
  if (window.__oxbowErrors.length > 100) {
    window.__oxbowErrors = window.__oxbowErrors.slice(-100);
  }
  
  // Envoi à service monitoring (si configuré)
  if (import.meta.env.VITE_ERROR_ENDPOINT) {
    try {
      navigator.sendBeacon(
        import.meta.env.VITE_ERROR_ENDPOINT,
        JSON.stringify(window.__oxbowErrors[window.__oxbowErrors.length - 1])
      );
    } catch (e) {
      // Silently fail
    }
  }
}

// Capture des avertissements
function captureWarning(message: string, args?: any[]) {
  // Similar to captureError but for warnings
  // ...
}
```

### Utilisation du Logger

```typescript
// Exemples d'utilisation
import { logger } from '../utils/logger';

// Logs simples
logger.debug('Initialisation du composant', { props });
logger.info('Fichier chargé avec succès', file.name);
logger.warn('Temps de traitement anormal', { processingTime, fileSize });
logger.error('Échec extraction PDF', error, { fileName: file.name });

// Logs groupés
logger.group('Traitement Excel');
logger.debug('Début traitement');
logger.debug('Détection colonnes', columnMapping);
logger.debug('Extraction données', { rowCount: data.length });
logger.groupEnd();

// Tableaux
logger.table(results.slice(0, 10), ['barcode', 'status', 'severity']);
```

### Logs Contextuels

```typescript
// src/utils/contextualLogger.ts
export function createContextLogger(context: string) {
  return {
    debug: (message: string, ...args: any[]) => {
      logger.debug(`[${context}] ${message}`, ...args);
    },
    info: (message: string, ...args: any[]) => {
      logger.info(`[${context}] ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
      logger.warn(`[${context}] ${message}`, ...args);
    },
    error: (message: string, error?: any, ...args: any[]) => {
      logger.error(`[${context}] ${message}`, error, ...args);
    }
  };
}

// Utilisation
const pdfLogger = createContextLogger('PDF');
const excelLogger = createContextLogger('Excel');

pdfLogger.info('Extraction démarrée');
excelLogger.debug('Analyse colonnes');
```

## 🔍 Techniques de Debugging

### Mode Debug Intégré

```typescript
// src/utils/debugMode.ts
export const debugMode = {
  isEnabled: () => {
    return localStorage.getItem('oxbow-debug') === 'true' || 
           import.meta.env.VITE_DEBUG_MODE === 'true';
  },
  
  enable: () => {
    localStorage.setItem('oxbow-debug', 'true');
    console.log('🐞 Mode debug activé');
    window.location.reload();
  },
  
  disable: () => {
    localStorage.removeItem('oxbow-debug');
    console.log('🐞 Mode debug désactivé');
    window.location.reload();
  },
  
  toggle: () => {
    if (debugMode.isEnabled()) {
      debugMode.disable();
    } else {
      debugMode.enable();
    }
  }
};

// Commandes console
window.__oxbowDebug = {
  enable: debugMode.enable,
  disable: debugMode.disable,
  toggle: debugMode.toggle
};
```

### Composant DebugPanel

```typescript
// src/components/DebugPanel.tsx
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

export function DebugPanel({ debug, isVisible, onToggle }: {
  debug: DebugInfo;
  isVisible: boolean;
  onToggle: () => void;
}) {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const sections = [
    { id: 'overview', label: '📊 Vue d\'ensemble', icon: Database },
    { id: 'columns', label: '🎯 Détection colonnes', icon: Target },
    { id: 'quality', label: '✅ Qualité données', icon: CheckCircle },
    { id: 'performance', label: '⚡ Performance', icon: Zap },
    { id: 'issues', label: '🚨 Problèmes', icon: AlertTriangle }
  ];

  // Implémentation du composant...
}
```

### Outils de Debugging Avancés

#### Inspecteur d'État
```typescript
// src/utils/stateInspector.ts
export class StateInspector {
  private static instance: StateInspector;
  private states: Map<string, any> = new Map();
  
  private constructor() {
    // Singleton
  }
  
  static getInstance(): StateInspector {
    if (!StateInspector.instance) {
      StateInspector.instance = new StateInspector();
    }
    return StateInspector.instance;
  }
  
  registerState(name: string, initialState: any): void {
    this.states.set(name, initialState);
    logger.debug(`État enregistré: ${name}`, initialState);
  }
  
  updateState(name: string, newState: any): void {
    const oldState = this.states.get(name);
    this.states.set(name, newState);
    
    if (debugMode.isEnabled()) {
      console.group(`📊 Mise à jour état: ${name}`);
      console.log('Ancien état:', oldState);
      console.log('Nouvel état:', newState);
      console.log('Différences:', this.getDiff(oldState, newState));
      console.groupEnd();
    }
  }
  
  getState(name: string): any {
    return this.states.get(name);
  }
  
  getAllStates(): Record<string, any> {
    const result: Record<string, any> = {};
    this.states.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  
  private getDiff(oldObj: any, newObj: any): any {
    // Calcul des différences entre deux objets
    // ...
    return diff;
  }
}

// Hook pour React
export function useDebugState<T>(name: string, initialState: T): [T, (newState: T) => void] {
  const [state, setState] = useState<T>(initialState);
  const inspector = StateInspector.getInstance();
  
  // Enregistrement initial
  useEffect(() => {
    inspector.registerState(name, initialState);
  }, []);
  
  // Wrapper pour mise à jour
  const setDebugState = useCallback((newState: T) => {
    setState(newState);
    inspector.updateState(name, newState);
  }, [name]);
  
  return [state, setDebugState];
}
```

#### Traceur de Performance
```typescript
// src/utils/performanceTracer.ts
export class PerformanceTracer {
  private static traces: Map<string, {
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: any;
  }> = new Map();
  
  static startTrace(name: string, metadata?: any): void {
    this.traces.set(name, {
      startTime: performance.now(),
      metadata
    });
  }
  
  static endTrace(name: string): number | undefined {
    const trace = this.traces.get(name);
    if (!trace) {
      logger.warn(`Trace non trouvée: ${name}`);
      return undefined;
    }
    
    const endTime = performance.now();
    const duration = endTime - trace.startTime;
    
    this.traces.set(name, {
      ...trace,
      endTime,
      duration
    });
    
    if (debugMode.isEnabled()) {
      logger.debug(`⏱️ ${name}: ${duration.toFixed(2)}ms`, trace.metadata);
    }
    
    return duration;
  }
  
  static getTrace(name: string): any {
    return this.traces.get(name);
  }
  
  static getAllTraces(): Record<string, any> {
    const result: Record<string, any> = {};
    this.traces.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  
  static clearTraces(): void {
    this.traces.clear();
  }
  
  static generateReport(): any {
    const completedTraces = Array.from(this.traces.entries())
      .filter(([_, trace]) => trace.duration !== undefined)
      .map(([name, trace]) => ({
        name,
        duration: trace.duration,
        metadata: trace.metadata
      }))
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));
    
    const totalTime = completedTraces.reduce((sum, trace) => sum + (trace.duration || 0), 0);
    
    return {
      totalTime,
      traces: completedTraces,
      averageTime: totalTime / completedTraces.length,
      slowestTrace: completedTraces[0],
      fastestTrace: completedTraces[completedTraces.length - 1]
    };
  }
}

// Décorateur pour mesurer performance méthodes
export function measure(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = function(...args: any[]) {
    const traceName = `${target.constructor.name}.${propertyKey}`;
    PerformanceTracer.startTrace(traceName, { args });
    
    try {
      const result = originalMethod.apply(this, args);
      
      // Gestion Promise
      if (result instanceof Promise) {
        return result.finally(() => {
          PerformanceTracer.endTrace(traceName);
        });
      }
      
      PerformanceTracer.endTrace(traceName);
      return result;
    } catch (error) {
      PerformanceTracer.endTrace(traceName);
      throw error;
    }
  };
  
  return descriptor;
}
```

## 🔧 Outils de Diagnostic

### Console Commands

```typescript
// src/utils/debugCommands.ts
export function registerDebugCommands() {
  if (!debugMode.isEnabled()) return;
  
  // Commande globale
  window.__oxbowDebug = {
    // Informations système
    system: () => {
      console.group('🖥️ Informations Système');
      console.log('User Agent:', navigator.userAgent);
      console.log('Plateforme:', navigator.platform);
      console.log('Langue:', navigator.language);
      console.log('Mémoire:', performance.memory ? {
        jsHeapSizeLimit: formatBytes(performance.memory.jsHeapSizeLimit),
        totalJSHeapSize: formatBytes(performance.memory.totalJSHeapSize),
        usedJSHeapSize: formatBytes(performance.memory.usedJSHeapSize)
      } : 'Non disponible');
      console.log('Résolution:', `${window.screen.width}x${window.screen.height}`);
      console.log('DPR:', window.devicePixelRatio);
      console.log('Orientation:', window.screen.orientation?.type || 'Non disponible');
      console.groupEnd();
    },
    
    // État application
    state: () => {
      const inspector = StateInspector.getInstance();
      console.group('📊 État Application');
      console.log(inspector.getAllStates());
      console.groupEnd();
    },
    
    // Performance
    performance: () => {
      console.group('⏱️ Performance');
      console.log(PerformanceTracer.generateReport());
      console.groupEnd();
    },
    
    // Erreurs
    errors: () => {
      console.group('🚨 Erreurs');
      console.log(window.__oxbowErrors || 'Aucune erreur enregistrée');
      console.groupEnd();
    },
    
    // Nettoyage
    clear: () => {
      PerformanceTracer.clearTraces();
      window.__oxbowErrors = [];
      console.clear();
      console.log('🧹 Console et traces nettoyées');
    },
    
    // Aide
    help: () => {
      console.group('❓ Commandes Debug Disponibles');
      console.log('window.__oxbowDebug.system() - Informations système');
      console.log('window.__oxbowDebug.state() - État application');
      console.log('window.__oxbowDebug.performance() - Métriques performance');
      console.log('window.__oxbowDebug.errors() - Erreurs enregistrées');
      console.log('window.__oxbowDebug.clear() - Nettoyer console et traces');
      console.log('window.__oxbowDebug.help() - Afficher cette aide');
      console.groupEnd();
    }
  };
  
  console.log('🐞 Commandes debug disponibles. Tapez window.__oxbowDebug.help() pour la liste.');
}

// Formatage bytes
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}
```

### Diagnostic Fichiers

```typescript
// src/utils/fileAnalyzer.ts
export class FileAnalyzer {
  static async analyzePdf(file: File): Promise<any> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Vérification signature
      const signature = new Uint8Array(arrayBuffer.slice(0, 4));
      const isPdf = signature[0] === 0x25 && // %
                    signature[1] === 0x50 && // P
                    signature[2] === 0x44 && // D
                    signature[3] === 0x46;   // F
      
      if (!isPdf) {
        return {
          valid: false,
          error: 'Signature PDF invalide',
          signature: Array.from(signature).map(b => b.toString(16)).join(' ')
        };
      }
      
      // Analyse structure
      const pdfText = new TextDecoder().decode(arrayBuffer.slice(0, 1024));
      const versionMatch = pdfText.match(/%PDF-(\d+\.\d+)/);
      const version = versionMatch ? versionMatch[1] : 'Inconnue';
      
      // Extraction pages (estimation)
      const pagesMatch = pdfText.match(/\/Type\s*\/Page/g);
      const estimatedPages = pagesMatch ? pagesMatch.length : 'Inconnu';
      
      return {
        valid: true,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        version,
        estimatedPages,
        signature: Array.from(signature).map(b => b.toString(16)).join(' ')
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      };
    }
  }
  
  static async analyzeExcel(file: File): Promise<any> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Vérification signature
      const signature = new Uint8Array(arrayBuffer.slice(0, 4));
      const isXlsx = signature[0] === 0x50 && // P
                     signature[1] === 0x4B && // K
                     signature[2] === 0x03 && // ETX
                     signature[3] === 0x04;   // EOT
      
      const isXls = signature[0] === 0xD0 && 
                    signature[1] === 0xCF && 
                    signature[2] === 0x11 && 
                    signature[3] === 0xE0;
      
      if (!isXlsx && !isXls) {
        return {
          valid: false,
          error: 'Signature Excel invalide',
          signature: Array.from(signature).map(b => b.toString(16)).join(' ')
        };
      }
      
      // Analyse basique
      return {
        valid: true,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        format: isXlsx ? 'XLSX' : 'XLS',
        signature: Array.from(signature).map(b => b.toString(16)).join(' ')
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      };
    }
  }
}
```

## 🔬 Techniques de Debugging Avancées

### Debugging Asynchrone

```typescript
// src/utils/asyncDebugger.ts
export class AsyncDebugger {
  private static traces: Map<string, any[]> = new Map();
  
  static trace(id: string, data: any): void {
    if (!debugMode.isEnabled()) return;
    
    if (!this.traces.has(id)) {
      this.traces.set(id, []);
    }
    
    this.traces.get(id)!.push({
      timestamp: new Date(),
      data
    });
  }
  
  static async traceAsync<T>(id: string, promise: Promise<T>, label: string): Promise<T> {
    this.trace(id, { event: 'start', label });
    
    try {
      const result = await promise;
      this.trace(id, { event: 'success', label, result });
      return result;
    } catch (error) {
      this.trace(id, { event: 'error', label, error });
      throw error;
    }
  }
  
  static getTrace(id: string): any[] {
    return this.traces.get(id) || [];
  }
  
  static clearTrace(id: string): void {
    this.traces.delete(id);
  }
  
  static clearAllTraces(): void {
    this.traces.clear();
  }
  
  static visualizeTrace(id: string): void {
    const trace = this.getTrace(id);
    if (!trace.length) {
      console.log(`Aucune trace trouvée pour l'ID: ${id}`);
      return;
    }
    
    console.group(`🔍 Trace Asynchrone: ${id}`);
    
    // Calcul durées
    for (let i = 1; i < trace.length; i++) {
      const prev = trace[i - 1].timestamp;
      const curr = trace[i].timestamp;
      trace[i].duration = curr.getTime() - prev.getTime();
    }
    
    // Affichage
    trace.forEach((entry, index) => {
      const prefix = entry.data.event === 'start' ? '▶️' :
                     entry.data.event === 'success' ? '✅' :
                     entry.data.event === 'error' ? '❌' : '📌';
      
      console.group(`${prefix} ${entry.data.label || `Étape ${index + 1}`}`);
      console.log('Timestamp:', entry.timestamp.toISOString());
      if (entry.duration) {
        console.log('Durée:', `${entry.duration}ms`);
      }
      console.log('Données:', entry.data);
      console.groupEnd();
    });
    
    // Résumé
    const totalDuration = trace[trace.length - 1].timestamp.getTime() - 
                          trace[0].timestamp.getTime();
    
    console.log('⏱️ Durée totale:', `${totalDuration}ms`);
    console.groupEnd();
  }
}

// Utilisation
async function processFile(file: File) {
  const traceId = `process_${file.name}_${Date.now()}`;
  
  try {
    // Tracer opérations asynchrones
    const arrayBuffer = await AsyncDebugger.traceAsync(
      traceId,
      file.arrayBuffer(),
      'Lecture fichier'
    );
    
    const pdf = await AsyncDebugger.traceAsync(
      traceId,
      pdfjsLib.getDocument({ data: arrayBuffer }).promise,
      'Chargement PDF'
    );
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await AsyncDebugger.traceAsync(
        traceId,
        pdf.getPage(i),
        `Chargement page ${i}`
      );
      
      const textContent = await AsyncDebugger.traceAsync(
        traceId,
        page.getTextContent(),
        `Extraction texte page ${i}`
      );
      
      AsyncDebugger.trace(traceId, {
        event: 'info',
        label: `Texte page ${i}`,
        textLength: textContent.items.length
      });
      
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    // Visualiser la trace complète
    if (debugMode.isEnabled()) {
      AsyncDebugger.visualizeTrace(traceId);
    }
    
    return fullText;
  } catch (error) {
    AsyncDebugger.trace(traceId, {
      event: 'fatal',
      error
    });
    
    if (debugMode.isEnabled()) {
      AsyncDebugger.visualizeTrace(traceId);
    }
    
    throw error;
  }
}
```

### Debugging Réactif

```typescript
// src/utils/reactiveDebugger.ts
export class ReactiveDebugger {
  private static subscriptions: Map<string, Set<(value: any) => void>> = new Map();
  private static values: Map<string, any> = new Map();
  
  static observe<T>(key: string, initialValue: T): [T, (value: T) => void] {
    // Initialiser si nécessaire
    if (!this.values.has(key)) {
      this.values.set(key, initialValue);
    }
    
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    
    // Getter
    const getValue = (): T => this.values.get(key);
    
    // Setter avec notification
    const setValue = (newValue: T): void => {
      const oldValue = this.values.get(key);
      this.values.set(key, newValue);
      
      // Notifier les observateurs
      this.subscriptions.get(key)!.forEach(callback => {
        try {
          callback({ oldValue, newValue, key });
        } catch (error) {
          console.error(`Erreur dans observateur pour ${key}:`, error);
        }
      });
    };
    
    return [getValue(), setValue];
  }
  
  static subscribe(key: string, callback: (value: any) => void): () => void {
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    
    this.subscriptions.get(key)!.add(callback);
    
    // Retourner fonction de désabonnement
    return () => {
      this.subscriptions.get(key)!.delete(callback);
    };
  }
  
  static debugValue(key: string): void {
    if (!debugMode.isEnabled()) return;
    
    const unsubscribe = this.subscribe(key, ({ oldValue, newValue }) => {
      console.group(`🔄 Valeur modifiée: ${key}`);
      console.log('Ancienne valeur:', oldValue);
      console.log('Nouvelle valeur:', newValue);
      console.groupEnd();
    });
    
    // Stocker pour nettoyage
    if (!window.__oxbowDebugSubscriptions) {
      window.__oxbowDebugSubscriptions = [];
    }
    
    window.__oxbowDebugSubscriptions.push(unsubscribe);
  }
  
  static debugAll(): void {
    if (!debugMode.isEnabled()) return;
    
    // Nettoyer anciens abonnements
    if (window.__oxbowDebugSubscriptions) {
      window.__oxbowDebugSubscriptions.forEach(unsub => unsub());
      window.__oxbowDebugSubscriptions = [];
    }
    
    // Observer toutes les valeurs
    for (const key of this.values.keys()) {
      this.debugValue(key);
    }
    
    console.log(`🔍 Observation de ${this.values.size} valeurs activée`);
  }
  
  static stopDebugging(): void {
    if (window.__oxbowDebugSubscriptions) {
      window.__oxbowDebugSubscriptions.forEach(unsub => unsub());
      window.__oxbowDebugSubscriptions = [];
    }
    
    console.log('🛑 Observation arrêtée');
  }
}

// Hook React pour utilisation facile
export function useDebugValue<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  
  // Enregistrer dans le debugger
  useEffect(() => {
    if (debugMode.isEnabled()) {
      const [_, setDebugValue] = ReactiveDebugger.observe(key, value);
      
      // Synchroniser les changements locaux
      return ReactiveDebugger.subscribe(key, ({ newValue }) => {
        if (newValue !== value) {
          setValue(newValue);
        }
      });
    }
  }, [key, value]);
  
  // Wrapper pour mise à jour
  const updateValue = useCallback((newValue: T) => {
    setValue(newValue);
    
    if (debugMode.isEnabled()) {
      const [_, setDebugValue] = ReactiveDebugger.observe(key, value);
      setDebugValue(newValue);
    }
  }, [key, value]);
  
  return [value, updateValue];
}
```

## 🧪 Tests et Validation

### Tests Unitaires

```typescript
// tests/utils/pdfProcessor.test.ts
import { extractBarcodesFromText } from '../../src/utils/pdfProcessor';

describe('PDF Processor', () => {
  test('should extract standard barcodes', () => {
    const text = 'Code-barres: 3605168507131\nPrix: 29.99€';
    const result = extractBarcodesFromText(text);
    expect(result).toContain('3605168507131');
  });
  
  test('should extract barcodes with spaces', () => {
    const text = 'Code-barres: 3 605 168 507 131\nPrix: 29.99€';
    const result = extractBarcodesFromText(text);
    expect(result).toContain('3605168507131');
  });
  
  test('should handle multiple barcodes', () => {
    const text = 'Code: 3605168507131\nCode: 3605168507148';
    const result = extractBarcodesFromText(text);
    expect(result).toHaveLength(2);
    expect(result).toContain('3605168507131');
    expect(result).toContain('3605168507148');
  });
  
  test('should ignore invalid barcodes', () => {
    const text = 'Code: 3605168ABCDEF\nCode: 12345';
    const result = extractBarcodesFromText(text);
    expect(result).toHaveLength(0);
  });
});
```

### Tests d'Intégration

```typescript
// tests/integration/fileProcessing.test.ts
import { extractBarcodesFromPdf } from '../../src/utils/pdfProcessor';
import { extractDataFromExcel } from '../../src/utils/excelProcessor';
import { compareData } from '../../src/utils/comparisonEngine';

describe('File Processing Integration', () => {
  test('should process PDF and Excel files and compare results', async () => {
    // Créer fichiers de test
    const pdfFile = new File([/* PDF content */], 'test.pdf', { type: 'application/pdf' });
    const excelFile = new File([/* Excel content */], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Extraire données
    const { barcodes: pdfBarcodes } = await extractBarcodesFromPdf(pdfFile);
    const excelBarcodes = await extractDataFromExcel(excelFile);
    
    // Vérifier extraction
    expect(pdfBarcodes.length).toBeGreaterThan(0);
    expect(excelBarcodes.length).toBeGreaterThan(0);
    
    // Comparer
    const results = compareData(pdfBarcodes, excelBarcodes);
    
    // Vérifier résultats
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.status === 'exact_match')).toBe(true);
  });
});
```

### Mocks pour Tests

```typescript
// tests/mocks/fileMocks.ts
export function createMockPdf(barcodes: string[]): File {
  // Créer contenu PDF simple
  const content = barcodes.map(code => `Code-barres: ${code}\n`).join('\n');
  
  // Créer Blob avec en-tête PDF minimal
  const pdfHeader = '%PDF-1.5\n';
  const blob = new Blob([pdfHeader + content], { type: 'application/pdf' });
  
  return new File([blob], 'test.pdf', { type: 'application/pdf' });
}

export function createMockExcel(data: any[]): File {
  // Utiliser XLSX pour créer un fichier Excel
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  
  // Convertir en ArrayBuffer puis Blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  return new File([blob], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
```

---

Pour toute question sur le logging ou le debugging, contactez l'équipe technique à tech@oxbow.com.