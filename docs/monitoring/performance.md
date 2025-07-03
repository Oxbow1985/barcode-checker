# Métriques de Performance - Oxbow Barcode Checker

Ce document détaille les métriques de performance de l'application Oxbow Barcode Checker, les méthodes de mesure et les objectifs à atteindre.

## 📊 Métriques Clés

### Temps de Chargement

| Métrique | Objectif | Méthode de Mesure |
|----------|----------|-------------------|
| First Contentful Paint (FCP) | < 1.5s | Performance API |
| Largest Contentful Paint (LCP) | < 2.5s | Performance API |
| Time to Interactive (TTI) | < 3.5s | Performance API |
| First Input Delay (FID) | < 100ms | Performance API |
| Cumulative Layout Shift (CLS) | < 0.1 | Performance API |

### Traitement de Fichiers

| Métrique | Objectif | Méthode de Mesure |
|----------|----------|-------------------|
| Extraction PDF (100 codes) | < 2s | Performance Monitor |
| Extraction PDF (1000 codes) | < 10s | Performance Monitor |
| Traitement Excel (1000 lignes) | < 3s | Performance Monitor |
| Traitement Excel (10000 lignes) | < 15s | Performance Monitor |
| Comparaison (1000 codes) | < 1s | Performance Monitor |
| Génération Rapport | < 3s | Performance Monitor |

### Utilisation Ressources

| Métrique | Objectif | Méthode de Mesure |
|----------|----------|-------------------|
| Taille Bundle JS | < 500KB (gzipped) | Analyse Bundle |
| Utilisation Mémoire Pic | < 500MB | Performance Monitor |
| Utilisation Mémoire Moyenne | < 200MB | Performance Monitor |
| Utilisation CPU Pic | < 80% | Performance Monitor |
| Utilisation CPU Moyenne | < 30% | Performance Monitor |

## 📈 Mesure et Monitoring

### Performance API

```typescript
// src/utils/performanceMonitoring.ts
export function captureWebVitals() {
  // FCP
  const fcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const fcpEntry = entries[entries.length - 1];
    console.log(`FCP: ${fcpEntry.startTime}ms`);
    
    // Envoi à analytics
    if (import.meta.env.VITE_ANALYTICS_ID) {
      // sendAnalytics('FCP', fcpEntry.startTime);
    }
  });
  fcpObserver.observe({ type: 'paint', buffered: true });
  
  // LCP
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lcpEntry = entries[entries.length - 1];
    console.log(`LCP: ${lcpEntry.startTime}ms`);
    
    // Envoi à analytics
    if (import.meta.env.VITE_ANALYTICS_ID) {
      // sendAnalytics('LCP', lcpEntry.startTime);
    }
  });
  lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  
  // CLS
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    }
    console.log(`CLS: ${clsValue}`);
    
    // Envoi à analytics
    if (import.meta.env.VITE_ANALYTICS_ID) {
      // sendAnalytics('CLS', clsValue);
    }
  });
  clsObserver.observe({ type: 'layout-shift', buffered: true });
  
  // FID
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log(`FID: ${entry.processingStart - entry.startTime}ms`);
      
      // Envoi à analytics
      if (import.meta.env.VITE_ANALYTICS_ID) {
        // sendAnalytics('FID', entry.processingStart - entry.startTime);
      }
    }
  });
  fidObserver.observe({ type: 'first-input', buffered: true });
}
```

### Performance Monitor

```typescript
// src/utils/performanceMonitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private memorySnapshots: number[] = [];
  private startMemory = 0;

  // Démarrer une mesure
  start(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };
    
    this.metrics.set(name, metric);
    
    // Snapshot mémoire
    if ('memory' in performance) {
      const memory = (performance as any).memory.usedJSHeapSize;
      this.memorySnapshots.push(memory);
      
      if (this.startMemory === 0) {
        this.startMemory = memory;
      }
    }
  }

  // Terminer une mesure
  end(name: string): number {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return 0;
    }
    
    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;
    
    return duration;
  }

  // Mesure automatique
  async measure<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  // Générer un rapport
  generateReport(): PerformanceReport {
    const completedMetrics = Array.from(this.metrics.values())
      .filter(m => m.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));
    
    const totalTime = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    
    const endMemory = this.memorySnapshots.length > 0 
      ? this.memorySnapshots[this.memorySnapshots.length - 1]
      : this.startMemory;
    
    const peakMemory = Math.max(...this.memorySnapshots, this.startMemory);
    
    return {
      totalTime,
      metrics: completedMetrics,
      memoryUsage: {
        start: this.startMemory,
        end: endMemory,
        peak: peakMemory
      },
      recommendations: this.generateRecommendations(completedMetrics, {
        start: this.startMemory,
        end: endMemory,
        peak: peakMemory
      })
    };
  }

  // Générer des recommandations
  private generateRecommendations(
    metrics: PerformanceMetric[], 
    memory: { start: number; end: number; peak: number }
  ): string[] {
    const recommendations: string[] = [];
    
    // Analyse des temps de traitement
    const slowOperations = metrics.filter(m => (m.duration || 0) > 1000);
    if (slowOperations.length > 0) {
      recommendations.push(
        `⚡ ${slowOperations.length} opération(s) lente(s) détectée(s): ${slowOperations.map(op => op.name).join(', ')}`
      );
    }
    
    // Analyse mémoire
    const memoryIncrease = memory.end - memory.start;
    if (memoryIncrease > 50 * 1024 * 1024) { // 50MB
      recommendations.push(
        `🧠 Augmentation mémoire importante: +${(memoryIncrease / 1024 / 1024).toFixed(1)}MB`
      );
    }
    
    return recommendations;
  }
}

// Utilisation
const performanceMonitor = new PerformanceMonitor();

// Mesure manuelle
performanceMonitor.start('extractPDF');
const barcodes = await extractBarcodesFromPdf(file);
const extractionTime = performanceMonitor.end('extractPDF');
console.log(`Extraction PDF: ${extractionTime.toFixed(0)}ms`);

// Mesure automatique
const results = await performanceMonitor.measure(
  'compareData',
  () => compareData(pdfBarcodes, excelBarcodes),
  { pdfCount: pdfBarcodes.length, excelCount: excelBarcodes.length }
);

// Rapport final
const report = performanceMonitor.generateReport();
console.log('Rapport de performance:', report);
```

## 🎯 Objectifs et Benchmarks

### Benchmarks par Taille de Fichier

#### PDF

| Taille PDF | Codes-barres | Temps Extraction | Mémoire Utilisée |
|------------|--------------|------------------|------------------|
| < 1MB | < 100 | < 1s | < 50MB |
| 1-5MB | 100-500 | < 3s | < 100MB |
| 5-20MB | 500-2000 | < 8s | < 200MB |
| 20-50MB | 2000-5000 | < 20s | < 400MB |

#### Excel

| Taille Excel | Lignes | Temps Traitement | Mémoire Utilisée |
|--------------|--------|------------------|------------------|
| < 1MB | < 1000 | < 1s | < 50MB |
| 1-5MB | 1000-5000 | < 3s | < 100MB |
| 5-10MB | 5000-10000 | < 8s | < 200MB |
| 10-20MB | 10000-50000 | < 15s | < 300MB |

### Objectifs d'Amélioration

| Métrique | Actuel | Objectif | Amélioration |
|----------|--------|----------|--------------|
| Extraction PDF (1000 codes) | 10s | 5s | -50% |
| Traitement Excel (10000 lignes) | 15s | 8s | -47% |
| Utilisation Mémoire Pic | 500MB | 300MB | -40% |
| Taille Bundle JS | 450KB | 350KB | -22% |
| Time to Interactive | 3.5s | 2.5s | -29% |

## 🔍 Profiling et Optimisation

### Points Chauds Identifiés

| Fonction | % Temps CPU | Problème | Solution |
|----------|-------------|----------|----------|
| `extractBarcodesFromPdf` | 35% | Extraction texte synchrone | Web Workers |
| `processDataInChunks` | 25% | Traitement séquentiel | Parallélisation |
| `compareData` | 15% | Recherche O(n²) | Indexation Map |
| `renderResultsTable` | 10% | Re-renders inutiles | Virtualisation |
| `calculateMetrics` | 8% | Calculs redondants | Memoization |

### Optimisations Planifiées

#### Phase 1 (Court terme)
- Implémentation Web Workers pour extraction PDF
- Optimisation algorithme de comparaison
- Virtualisation des listes de résultats

#### Phase 2 (Moyen terme)
- Traitement parallèle des chunks Excel
- Compression mémoire des structures de données
- Lazy loading des composants lourds

#### Phase 3 (Long terme)
- Implémentation WASM pour traitement critique
- Streaming des fichiers volumineux
- Indexation côté client pour recherche instantanée

## 📱 Performance Mobile

### Métriques Spécifiques Mobile

| Métrique | Objectif Mobile | Méthode de Mesure |
|----------|-----------------|-------------------|
| FCP Mobile | < 2.5s | Lighthouse Mobile |
| TTI Mobile | < 5s | Lighthouse Mobile |
| Interaction Delay | < 150ms | Performance API |
| Battery Impact | < 2% / minute | Battery API |

### Optimisations Mobile

```typescript
// Détection capacités appareil
const deviceCapabilities = {
  isLowEndDevice: () => {
    return navigator.hardwareConcurrency <= 2 || 
           (navigator.deviceMemory && navigator.deviceMemory <= 2);
  },
  
  isBatteryLow: async () => {
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      return battery.level < 0.2 && !battery.charging;
    }
    return false;
  },
  
  isSlowConnection: () => {
    return navigator.connection && 
           (navigator.connection.effectiveType === 'slow-2g' || 
            navigator.connection.effectiveType === '2g');
  },
  
  getOptimalChunkSize: () => {
    if (deviceCapabilities.isLowEndDevice()) {
      return 500; // Plus petits chunks pour appareils faibles
    }
    return 1000; // Taille standard
  }
};

// Adaptation dynamique
async function adaptToDevice() {
  const isLowEnd = deviceCapabilities.isLowEndDevice();
  const isBatteryLow = await deviceCapabilities.isBatteryLow();
  const isSlowConnection = deviceCapabilities.isSlowConnection();
  
  // Ajuster paramètres
  if (isLowEnd || isBatteryLow) {
    CONFIG.CHUNK_SIZE = deviceCapabilities.getOptimalChunkSize();
    CONFIG.MAX_RESULTS = 5000;
    CONFIG.ITEMS_PER_PAGE_DEFAULT = 10;
    
    // Désactiver animations lourdes
    CONFIG.ENABLE_HEAVY_ANIMATIONS = false;
  }
  
  if (isSlowConnection) {
    // Réduire qualité assets
    CONFIG.ENABLE_HIGH_RES_IMAGES = false;
  }
}
```

---

Ce document est mis à jour régulièrement avec les dernières métriques et optimisations. Pour toute question, contactez l'équipe performance à performance@oxbow.com.