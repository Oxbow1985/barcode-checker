// 🧠 GESTIONNAIRE DE MÉMOIRE INTELLIGENT

interface MemoryStats {
  used: number;
  total: number;
  percentage: number;
}

class MemoryManager {
  private cache: Map<string, { data: any; timestamp: number; size: number }> = new Map();
  private readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // 📊 SURVEILLANCE MÉMOIRE
  getMemoryStats(): MemoryStats {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      };
    }
    
    return { used: 0, total: 0, percentage: 0 };
  }

  // 🗑️ NETTOYAGE AUTOMATIQUE
  cleanup(): void {
    const now = Date.now();
    let totalSize = 0;
    
    // Supprimer les entrées expirées
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      } else {
        totalSize += entry.size;
      }
    }
    
    // Si le cache est trop gros, supprimer les plus anciennes entrées
    if (totalSize > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      for (const [key] of entries) {
        this.cache.delete(key);
        totalSize -= this.cache.get(key)?.size || 0;
        
        if (totalSize <= this.MAX_CACHE_SIZE * 0.8) break;
      }
    }
  }

  // 💾 CACHE INTELLIGENT
  set(key: string, data: any): void {
    const size = this.estimateSize(data);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size
    });
    
    this.cleanup();
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Vérifier l'expiration
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  // 📏 ESTIMATION DE TAILLE
  private estimateSize(obj: any): number {
    if (obj === null || obj === undefined) return 0;
    
    if (typeof obj === 'string') return obj.length * 2; // UTF-16
    if (typeof obj === 'number') return 8;
    if (typeof obj === 'boolean') return 4;
    
    if (Array.isArray(obj)) {
      return obj.reduce((size, item) => size + this.estimateSize(item), 0);
    }
    
    if (typeof obj === 'object') {
      return Object.entries(obj).reduce(
        (size, [key, value]) => size + key.length * 2 + this.estimateSize(value),
        0
      );
    }
    
    return 0;
  }

  // 🚨 SURVEILLANCE CRITIQUE
  isMemoryCritical(): boolean {
    const stats = this.getMemoryStats();
    return stats.percentage > 85;
  }

  // 🔄 LIBÉRATION FORCÉE
  forceCleanup(): void {
    this.cache.clear();
    
    // Forcer le garbage collection si disponible
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  // 📈 STATISTIQUES DU CACHE
  getCacheStats(): { entries: number; totalSize: number; hitRate: number } {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    
    return {
      entries: this.cache.size,
      totalSize,
      hitRate: 0 // TODO: Implémenter le tracking des hits
    };
  }
}

// 🎯 INSTANCE GLOBALE
export const memoryManager = new MemoryManager();

// 🔄 NETTOYAGE AUTOMATIQUE PÉRIODIQUE
setInterval(() => {
  memoryManager.cleanup();
}, 60000); // Toutes les minutes

// 🚨 SURVEILLANCE CRITIQUE
setInterval(() => {
  if (memoryManager.isMemoryCritical()) {
    console.warn('⚠️ Mémoire critique détectée, nettoyage forcé');
    memoryManager.forceCleanup();
  }
}, 10000); // Toutes les 10 secondes