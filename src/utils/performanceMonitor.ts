// 📊 MONITEUR DE PERFORMANCE AVANCÉ

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  totalTime: number;
  metrics: PerformanceMetric[];
  memoryUsage: {
    start: number;
    end: number;
    peak: number;
  };
  recommendations: string[];
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private memorySnapshots: number[] = [];
  private startMemory = 0;

  // 🚀 DÉMARRER UNE MESURE
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

  // 🏁 TERMINER UNE MESURE
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

  // 📊 MESURE AUTOMATIQUE
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

  // 📈 GÉNÉRER UN RAPPORT
  generateReport(): PerformanceReport {
    const completedMetrics = Array.from(this.metrics.values())
      .filter(m => m.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));
    
    const totalTime = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    
    const endMemory = this.memorySnapshots.length > 0 
      ? this.memorySnapshots[this.memorySnapshots.length - 1]
      : this.startMemory;
    
    const peakMemory = Math.max(...this.memorySnapshots, this.startMemory);
    
    const recommendations = this.generateRecommendations(completedMetrics, {
      start: this.startMemory,
      end: endMemory,
      peak: peakMemory
    });
    
    return {
      totalTime,
      metrics: completedMetrics,
      memoryUsage: {
        start: this.startMemory,
        end: endMemory,
        peak: peakMemory
      },
      recommendations
    };
  }

  // 💡 GÉNÉRER DES RECOMMANDATIONS
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
    
    const memoryPeak = memory.peak - memory.start;
    if (memoryPeak > 100 * 1024 * 1024) { // 100MB
      recommendations.push(
        `📈 Pic mémoire élevé: ${(memoryPeak / 1024 / 1024).toFixed(1)}MB - Considérez le traitement par chunks`
      );
    }
    
    // Analyse des patterns
    const fileProcessingMetrics = metrics.filter(m => 
      m.name.includes('excel') || m.name.includes('pdf')
    );
    
    if (fileProcessingMetrics.length > 0) {
      const avgProcessingTime = fileProcessingMetrics.reduce(
        (sum, m) => sum + (m.duration || 0), 0
      ) / fileProcessingMetrics.length;
      
      if (avgProcessingTime > 2000) {
        recommendations.push(
          `📁 Temps de traitement fichier élevé: ${avgProcessingTime.toFixed(0)}ms - Optimisation recommandée`
        );
      }
    }
    
    // Recommandations générales
    if (metrics.length > 10) {
      recommendations.push(
        `🔧 Nombreuses opérations (${metrics.length}) - Considérez la mise en cache`
      );
    }
    
    return recommendations;
  }

  // 🧹 NETTOYER LES MÉTRIQUES
  clear(): void {
    this.metrics.clear();
    this.memorySnapshots = [];
    this.startMemory = 0;
  }

  // 📊 OBTENIR LES MÉTRIQUES ACTUELLES
  getCurrentMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  // 🎯 MÉTRIQUES SPÉCIFIQUES
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  // 📈 STATISTIQUES RAPIDES
  getQuickStats(): {
    activeMetrics: number;
    completedMetrics: number;
    totalTime: number;
    averageTime: number;
  } {
    const allMetrics = Array.from(this.metrics.values());
    const completed = allMetrics.filter(m => m.duration !== undefined);
    const totalTime = completed.reduce((sum, m) => sum + (m.duration || 0), 0);
    
    return {
      activeMetrics: allMetrics.length - completed.length,
      completedMetrics: completed.length,
      totalTime,
      averageTime: completed.length > 0 ? totalTime / completed.length : 0
    };
  }
}

// 🎯 INSTANCE GLOBALE
export const performanceMonitor = new PerformanceMonitor();

// 🔧 HELPER POUR DÉCORATEUR DE PERFORMANCE
export function withPerformanceTracking<T extends (...args: any[]) => any>(
  name: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    return performanceMonitor.measure(name, () => fn(...args));
  }) as T;
}

// 📊 HELPER POUR LOGGING AUTOMATIQUE
export function logPerformanceReport(): void {
  const report = performanceMonitor.generateReport();
  
  console.group('📊 Performance Report');
  console.log(`⏱️ Temps total: ${report.totalTime.toFixed(2)}ms`);
  console.log(`🧠 Mémoire: ${(report.memoryUsage.start / 1024 / 1024).toFixed(1)}MB → ${(report.memoryUsage.end / 1024 / 1024).toFixed(1)}MB (pic: ${(report.memoryUsage.peak / 1024 / 1024).toFixed(1)}MB)`);
  
  if (report.metrics.length > 0) {
    console.table(
      report.metrics.map(m => ({
        Opération: m.name,
        'Durée (ms)': m.duration?.toFixed(2),
        Métadonnées: JSON.stringify(m.metadata || {})
      }))
    );
  }
  
  if (report.recommendations.length > 0) {
    console.group('💡 Recommandations');
    report.recommendations.forEach(rec => console.log(rec));
    console.groupEnd();
  }
  
  console.groupEnd();
}