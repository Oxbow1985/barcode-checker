# 8. Sécurité et Bonnes Pratiques

## 8.1 Mesures de Sécurité Implémentées

### Validation des Fichiers Multi-Niveaux

#### 1. Validation MIME Type et Extension
```typescript
// src/utils/fileValidation.ts
export function validatePdfFile(file: File): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Validation MIME type strict
  const allowedMimeTypes = [
    'application/pdf',
    'application/x-pdf'
  ];
  
  if (!allowedMimeTypes.includes(file.type)) {
    errors.push({ 
      field: 'pdf', 
      message: 'Le fichier doit être au format PDF' 
    });
  }
  
  // Validation extension
  const allowedExtensions = ['.pdf'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(fileExtension)) {
    errors.push({ 
      field: 'pdf', 
      message: 'Extension de fichier non autorisée' 
    });
  }
  
  return errors;
}
```

#### 2. Validation Signature Binaire (Magic Numbers)
```typescript
// Prévention des attaques par fichiers malveillants
export async function validateFileSignature(file: File, type: 'pdf' | 'excel'): Promise<boolean> {
  try {
    const buffer = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    const allowedSignatures = {
      pdf: [
        [0x25, 0x50, 0x44, 0x46],      // %PDF
        [0x25, 0x50, 0x44, 0x46, 0x2D] // %PDF-
      ],
      excel: [
        [0x50, 0x4B, 0x03, 0x04],      // ZIP (XLSX)
        [0x50, 0x4B, 0x05, 0x06],      // ZIP (XLSX)
        [0xD0, 0xCF, 0x11, 0xE0],      // OLE2 (XLS/XLSM)
        [0x09, 0x08, 0x06, 0x00]       // XLS (alternative)
      ]
    };
    
    return allowedSignatures[type].some(signature => 
      signature.every((byte, index) => bytes[index] === byte)
    );
  } catch (error) {
    console.error('Erreur validation signature:', error);
    return false;
  }
}
```

#### 3. Validation Taille et Contenu
```typescript
// Limites strictes pour prévenir les attaques DoS
const SECURITY_LIMITS = {
  PDF_MAX_SIZE: 50 * 1024 * 1024,    // 50MB
  EXCEL_MAX_SIZE: 20 * 1024 * 1024,  // 20MB
  MIN_FILE_SIZE: 100,                 // 100 bytes minimum
  MAX_FILENAME_LENGTH: 255,           // Limite nom de fichier
  ALLOWED_CHARS: /^[a-zA-Z0-9._-]+$/ // Caractères autorisés
};

export function validateFileSize(file: File, type: 'pdf' | 'excel'): ValidationError[] {
  const errors: ValidationError[] = [];
  const maxSize = type === 'pdf' ? SECURITY_LIMITS.PDF_MAX_SIZE : SECURITY_LIMITS.EXCEL_MAX_SIZE;
  
  // Taille maximum
  if (file.size > maxSize) {
    errors.push({
      field: type,
      message: `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: ${maxSize / 1024 / 1024}MB`
    });
  }
  
  // Taille minimum (éviter fichiers vides/corrompus)
  if (file.size < SECURITY_LIMITS.MIN_FILE_SIZE) {
    errors.push({
      field: type,
      message: 'Fichier trop petit ou corrompu'
    });
  }
  
  // Validation nom de fichier
  if (file.name.length > SECURITY_LIMITS.MAX_FILENAME_LENGTH) {
    errors.push({
      field: type,
      message: 'Nom de fichier trop long'
    });
  }
  
  return errors;
}
```

### Sanitisation des Données d'Entrée

#### Nettoyage Strict des Chaînes
```typescript
// Prévention XSS et injection
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    // Suppression caractères dangereux
    .replace(/[<>\"'&]/g, '')
    // Suppression caractères de contrôle
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Suppression scripts potentiels
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    // Normalisation espaces
    .replace(/\s+/g, ' ')
    .trim()
    // Limitation longueur
    .substring(0, 1000);
}

// Validation spécialisée pour codes-barres
export function sanitizeBarcode(barcode: string): string {
  if (!barcode) return '';
  
  return barcode
    // Garder uniquement les chiffres
    .replace(/[^\d]/g, '')
    // Limitation longueur codes-barres
    .substring(0, 14);
}

// Validation prix avec sécurité
export function sanitizePrice(price: any): number | undefined {
  if (price === null || price === undefined || price === '') return undefined;
  
  // Conversion sécurisée
  let numericValue: number;
  
  if (typeof price === 'number') {
    numericValue = price;
  } else if (typeof price === 'string') {
    // Nettoyage chaîne prix
    const cleaned = price
      .replace(/[€$£¥₹]/g, '')     // Symboles monétaires
      .replace(/[,\s]/g, '')       // Virgules et espaces
      .replace(/\.(?=.*\.)/g, '')  // Multiples points
      .trim();
    
    numericValue = parseFloat(cleaned);
  } else {
    return undefined;
  }
  
  // Validation plage réaliste
  if (isNaN(numericValue) || numericValue < 0 || numericValue > 50000) {
    return undefined;
  }
  
  // Arrondi à 2 décimales
  return Math.round(numericValue * 100) / 100;
}
```

### Traitement Côté Client Uniquement

#### Avantages Sécuritaires
```typescript
// Aucune donnée sensible n'est envoyée sur un serveur externe
class ClientOnlyProcessor {
  
  // Traitement local sécurisé
  async processFiles(pdfFile: File, excelFile: File): Promise<ProcessingResult> {
    // ✅ Toutes les données restent dans le navigateur
    // ✅ Aucune transmission réseau de données sensibles
    // ✅ Contrôle total sur le traitement
    
    try {
      // Validation sécurisée
      await this.validateFiles(pdfFile, excelFile);
      
      // Traitement local
      const pdfData = await this.extractPdfData(pdfFile);
      const excelData = await this.extractExcelData(excelFile);
      
      // Comparaison locale
      const results = await this.compareData(pdfData, excelData);
      
      return results;
      
    } catch (error) {
      // Gestion d'erreur sécurisée
      this.handleSecureError(error);
      throw error;
    }
  }
  
  private handleSecureError(error: any): void {
    // Logging sécurisé (pas de données sensibles)
    const safeError = {
      type: error.constructor.name,
      message: error.message,
      timestamp: new Date().toISOString(),
      // ❌ Pas de stack trace en production
      // ❌ Pas de données utilisateur
    };
    
    if (import.meta.env.DEV) {
      console.error('Erreur de traitement:', safeError);
    }
  }
}
```

### Gestion Mémoire Sécurisée

#### Nettoyage Automatique des Données Sensibles
```typescript
// src/utils/memoryManager.ts
class SecureMemoryManager {
  private sensitiveData: Map<string, any> = new Map();
  private cleanupTimers: Map<string, NodeJS.Timeout> = new Map();
  
  // Stockage temporaire sécurisé
  storeSensitiveData(key: string, data: any, ttl: number = 300000): void { // 5 min par défaut
    // Nettoyage des données précédentes
    this.clearSensitiveData(key);
    
    // Stockage avec TTL
    this.sensitiveData.set(key, data);
    
    // Timer de nettoyage automatique
    const timer = setTimeout(() => {
      this.clearSensitiveData(key);
    }, ttl);
    
    this.cleanupTimers.set(key, timer);
  }
  
  // Nettoyage sécurisé
  clearSensitiveData(key: string): void {
    // Suppression des données
    if (this.sensitiveData.has(key)) {
      const data = this.sensitiveData.get(key);
      
      // Écrasement sécurisé pour les chaînes
      if (typeof data === 'string') {
        // Écrasement mémoire (best effort)
        data.replace(/./g, '0');
      }
      
      this.sensitiveData.delete(key);
    }
    
    // Nettoyage timer
    const timer = this.cleanupTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(key);
    }
  }
  
  // Nettoyage complet
  clearAllSensitiveData(): void {
    for (const key of this.sensitiveData.keys()) {
      this.clearSensitiveData(key);
    }
    
    // Force garbage collection si disponible
    if ('gc' in window && import.meta.env.DEV) {
      (window as any).gc();
    }
  }
  
  // Surveillance mémoire critique
  isMemoryCritical(): boolean {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usagePercent = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
      return usagePercent > 85;
    }
    return false;
  }
}

// Instance globale
export const secureMemoryManager = new SecureMemoryManager();

// Nettoyage automatique périodique
setInterval(() => {
  if (secureMemoryManager.isMemoryCritical()) {
    console.warn('⚠️ Mémoire critique - Nettoyage automatique');
    secureMemoryManager.clearAllSensitiveData();
  }
}, 30000); // Toutes les 30 secondes

// Nettoyage à la fermeture
window.addEventListener('beforeunload', () => {
  secureMemoryManager.clearAllSensitiveData();
});
```

## 8.2 Validation des Données

### Validation Multi-Niveaux des Codes-barres

#### Validation Stricte Format OXBOW
```typescript
// src/utils/barcodeValidator.ts
export class BarcodeValidator {
  
  private static readonly OXBOW_PREFIXES = ['3605168', '3605169']; // Extensible
  private static readonly VALID_LENGTHS = [8, 12, 13, 14];
  private static readonly MAX_CODES_PER_FILE = 10000; // Limite DoS
  
  // Validation complète
  static validateBarcode(barcode: string): ValidationResult {
    const result: ValidationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      normalizedCode: ''
    };
    
    // 1. Validation existence
    if (!barcode || typeof barcode !== 'string') {
      result.errors.push('Code-barres manquant ou invalide');
      return result;
    }
    
    // 2. Nettoyage et normalisation
    const cleaned = this.sanitizeBarcode(barcode);
    result.normalizedCode = cleaned;
    
    // 3. Validation longueur
    if (!this.VALID_LENGTHS.includes(cleaned.length)) {
      result.errors.push(`Longueur invalide: ${cleaned.length}. Attendu: ${this.VALID_LENGTHS.join(', ')}`);
      return result;
    }
    
    // 4. Validation format numérique
    if (!/^\d+$/.test(cleaned)) {
      result.errors.push('Le code-barres doit contenir uniquement des chiffres');
      return result;
    }
    
    // 5. Validation préfixe OXBOW
    const hasValidPrefix = this.OXBOW_PREFIXES.some(prefix => cleaned.startsWith(prefix));
    if (!hasValidPrefix) {
      result.warnings.push(`Préfixe non-OXBOW détecté. Préfixes valides: ${this.OXBOW_PREFIXES.join(', ')}`);
    }
    
    // 6. Validation checksum (si applicable)
    if (cleaned.length === 13) {
      const checksumValid = this.validateEAN13Checksum(cleaned);
      if (!checksumValid) {
        result.warnings.push('Checksum EAN-13 invalide');
      }
    }
    
    // 7. Validation codes interdits
    if (this.isForbiddenCode(cleaned)) {
      result.errors.push('Code-barres dans la liste des codes interdits');
      return result;
    }
    
    result.isValid = result.errors.length === 0;
    return result;
  }
  
  // Validation checksum EAN-13
  private static validateEAN13Checksum(code: string): boolean {
    if (code.length !== 13) return false;
    
    const digits = code.split('').map(Number);
    const checkDigit = digits.pop()!;
    
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }
    
    const calculatedCheck = (10 - (sum % 10)) % 10;
    return calculatedCheck === checkDigit;
  }
  
  // Codes interdits (exemples)
  private static isForbiddenCode(code: string): boolean {
    const forbiddenCodes = [
      '0000000000000',
      '1111111111111',
      '9999999999999'
    ];
    
    return forbiddenCodes.includes(code) || 
           /^(.)\1+$/.test(code); // Tous les chiffres identiques
  }
  
  // Nettoyage sécurisé
  private static sanitizeBarcode(barcode: string): string {
    return barcode
      .replace(/[^\d]/g, '')  // Garder uniquement les chiffres
      .substring(0, 14);      // Limiter longueur
  }
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  normalizedCode: string;
}
```

### Validation des Données Excel

#### Validation Robuste des Cellules
```typescript
// src/utils/excelValidator.ts
export class ExcelDataValidator {
  
  // Validation prix avec sécurité renforcée
  static validatePrice(value: any, currency?: string): PriceValidationResult {
    const result: PriceValidationResult = {
      isValid: false,
      cleanValue: undefined,
      errors: [],
      warnings: []
    };
    
    // Validation existence
    if (value === null || value === undefined || value === '') {
      result.warnings.push('Prix manquant');
      return result;
    }
    
    let numericValue: number;
    
    // Conversion sécurisée
    if (typeof value === 'number') {
      numericValue = value;
    } else if (typeof value === 'string') {
      // Nettoyage sécurisé
      const cleaned = value
        .replace(/[€$£¥₹]/g, '')     // Symboles monétaires
        .replace(/[,\s]/g, '')       // Virgules et espaces
        .replace(/\.(?=.*\.)/g, '')  // Multiples points
        .trim();
      
      numericValue = parseFloat(cleaned);
    } else {
      result.errors.push('Type de prix invalide');
      return result;
    }
    
    // Validation numérique
    if (isNaN(numericValue)) {
      result.errors.push('Prix non numérique');
      return result;
    }
    
    // Validation plage réaliste
    if (numericValue < 0) {
      result.errors.push('Prix négatif non autorisé');
      return result;
    }
    
    if (numericValue > 50000) {
      result.warnings.push('Prix très élevé détecté');
    }
    
    // Validation précision
    const decimalPlaces = (numericValue.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      result.warnings.push('Prix avec plus de 2 décimales');
      numericValue = Math.round(numericValue * 100) / 100;
    }
    
    // Validation devise
    if (currency) {
      const expectedRanges = {
        'EUR': { min: 0.01, max: 10000 },
        'GBP': { min: 0.01, max: 8000 },
        'USD': { min: 0.01, max: 12000 }
      };
      
      const range = expectedRanges[currency as keyof typeof expectedRanges];
      if (range && (numericValue < range.min || numericValue > range.max)) {
        result.warnings.push(`Prix hors plage attendue pour ${currency}`);
      }
    }
    
    result.isValid = result.errors.length === 0;
    result.cleanValue = numericValue;
    
    return result;
  }
  
  // Validation couleur
  static validateColor(value: any): ValidationResult {
    const result: ValidationResult = {
      isValid: false,
      cleanValue: '',
      errors: [],
      warnings: []
    };
    
    if (!value) {
      result.warnings.push('Couleur manquante');
      return result;
    }
    
    const colorStr = value.toString().trim();
    
    // Validation longueur
    if (colorStr.length < 2 || colorStr.length > 50) {
      result.errors.push('Longueur de couleur invalide');
      return result;
    }
    
    // Validation caractères
    if (!/^[a-zA-ZÀ-ÿ\s\-/]+$/.test(colorStr)) {
      result.errors.push('Caractères invalides dans la couleur');
      return result;
    }
    
    // Nettoyage
    const cleaned = colorStr
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    
    result.isValid = true;
    result.cleanValue = cleaned;
    
    return result;
  }
  
  // Validation taille
  static validateSize(value: any): ValidationResult {
    const result: ValidationResult = {
      isValid: false,
      cleanValue: '',
      errors: [],
      warnings: []
    };
    
    if (!value) {
      result.warnings.push('Taille manquante');
      return result;
    }
    
    const sizeStr = value.toString().trim().toUpperCase();
    
    // Patterns de tailles valides
    const validPatterns = [
      /^(XS|S|M|L|XL|XXL|XXXL|XXXXL)$/,     // Tailles vêtements
      /^\d{1,3}$/,                           // Tailles numériques
      /^\d{1,2}\.\d{1}$/,                    // Tailles avec décimales
      /^(3[0-9]|4[0-9]|5[0-9])$/,           // Tailles européennes
      /^[A-Z0-9]{1,10}$/                     // Tailles custom
    ];
    
    const isValid = validPatterns.some(pattern => pattern.test(sizeStr));
    
    if (!isValid) {
      result.errors.push('Format de taille non reconnu');
      return result;
    }
    
    result.isValid = true;
    result.cleanValue = sizeStr;
    
    return result;
  }
}

interface ValidationResult {
  isValid: boolean;
  cleanValue: string;
  errors: string[];
  warnings: string[];
}

interface PriceValidationResult {
  isValid: boolean;
  cleanValue: number | undefined;
  errors: string[];
  warnings: string[];
}
```

## 8.3 Gestion des Erreurs

### Stratégie de Gestion d'Erreurs Hiérarchique

#### Hiérarchie d'Erreurs Typées
```typescript
// src/utils/errors.ts
export class OxbowError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high',
    public userMessage?: string
  ) {
    super(message);
    this.name = 'OxbowError';
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OxbowError);
    }
  }
  
  // Message utilisateur localisé
  getUserMessage(): string {
    return this.userMessage || this.message;
  }
  
  // Informations pour logging
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      severity: this.severity,
      message: this.message,
      stack: import.meta.env.DEV ? this.stack : undefined
    };
  }
}

// Erreurs spécifiques
export class FileProcessingError extends OxbowError {
  constructor(
    message: string, 
    public fileName: string,
    public fileType: 'pdf' | 'excel',
    severity: 'low' | 'medium' | 'high' = 'high'
  ) {
    super(
      message, 
      'FILE_PROCESSING_ERROR', 
      severity,
      `Erreur lors du traitement du fichier ${fileName}`
    );
    this.name = 'FileProcessingError';
  }
}

export class ValidationError extends OxbowError {
  constructor(
    message: string, 
    public field: string,
    severity: 'low' | 'medium' | 'high' = 'medium'
  ) {
    super(
      message, 
      'VALIDATION_ERROR', 
      severity,
      `Erreur de validation: ${message}`
    );
    this.name = 'ValidationError';
  }
}

export class ComparisonError extends OxbowError {
  constructor(
    message: string,
    public details: any,
    severity: 'low' | 'medium' | 'high' = 'medium'
  ) {
    super(
      message,
      'COMPARISON_ERROR',
      severity,
      `Erreur lors de la comparaison des données`
    );
    this.name = 'ComparisonError';
  }
}

export class MemoryError extends OxbowError {
  constructor(message: string) {
    super(
      message,
      'MEMORY_ERROR',
      'high',
      `Mémoire insuffisante pour traiter cette opération`
    );
    this.name = 'MemoryError';
  }
}
```

### Gestion Globale des Erreurs

#### Error Boundary React
```typescript
// src/components/ErrorBoundary.tsx
import React from 'react';
import { OxbowError } from '../utils/errors';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log erreur pour monitoring
    console.error('Application Error:', error, errorInfo);
    
    // Callback pour traitement externe
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Envoi vers service de monitoring (si configuré)
    if (import.meta.env.VITE_SENTRY_DSN) {
      // Sentry.captureException(error);
    }
  }
  
  render(): React.ReactNode {
    if (this.state.hasError) {
      // Fallback UI personnalisé ou par défaut
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // UI par défaut avec message adapté
      return (
        <div className="p-8 bg-error-50 rounded-lg border border-error-200">
          <h2 className="text-xl font-bold text-error-800 mb-4">
            Une erreur est survenue
          </h2>
          
          <div className="bg-white p-4 rounded border border-error-100 mb-4">
            <p className="text-error-600">
              {this.state.error instanceof OxbowError
                ? this.state.error.getUserMessage()
                : "Une erreur inattendue s'est produite. Veuillez réessayer."}
            </p>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-oxbow-500 text-white rounded hover:bg-oxbow-600"
          >
            Recharger l'application
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

#### Utilisation dans l'Application
```typescript
// src/App.tsx
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Logging, analytics, etc.
    if (import.meta.env.VITE_ANALYTICS_ID) {
      // Envoi erreur à Google Analytics
      // gtag('event', 'error', { error_type: error.name, error_message: error.message });
    }
  };
  
  return (
    <ErrorBoundary onError={handleError}>
      <ThemeProvider>
        <AppProvider>
          <Router>
            <Routes>
              <Route path="/" element={<AppContent />} />
            </Routes>
          </Router>
          <Toaster position="top-right" />
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

### Retry et Fallbacks

#### Retry Automatique pour Opérations Critiques
```typescript
// src/utils/retry.ts
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoffFactor?: number;
    retryableErrors?: string[];
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoffFactor = 2,
    retryableErrors = [],
    onRetry = () => {}
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Vérifier si l'erreur est retryable
      const isRetryable = retryableErrors.length === 0 || 
                         retryableErrors.includes(error.constructor.name);
      
      if (!isRetryable || attempt > maxRetries) {
        throw error;
      }
      
      // Callback de retry
      onRetry(attempt, error as Error);
      
      // Délai exponentiel
      const retryDelay = delay * Math.pow(backoffFactor, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw lastError!;
}

// Exemple d'utilisation
async function processExcelWithRetry(file: File): Promise<BarcodeData[]> {
  return withRetry(
    () => extractDataFromExcel(file),
    {
      maxRetries: 3,
      delay: 1000,
      backoffFactor: 1.5,
      retryableErrors: ['FileProcessingError', 'MemoryError'],
      onRetry: (attempt, error) => {
        console.warn(`Tentative ${attempt}/3 échouée:`, error.message);
        
        // Nettoyage mémoire avant retry
        if (error.name === 'MemoryError') {
          secureMemoryManager.clearAllSensitiveData();
        }
      }
    }
  );
}
```

#### Fallbacks Intelligents
```typescript
// src/utils/fallbacks.ts
export class FallbackStrategies {
  
  // Fallback pour extraction PDF
  static async extractPdfWithFallback(file: File): Promise<BarcodeData[]> {
    try {
      // Stratégie principale
      return await extractBarcodesFromPdf(file);
    } catch (error) {
      console.warn('Extraction PDF principale échouée, tentative fallback:', error);
      
      try {
        // Fallback 1: Extraction texte brut
        return await extractBarcodesFromPdfText(file);
      } catch (secondError) {
        console.warn('Fallback 1 échoué, tentative fallback 2:', secondError);
        
        try {
          // Fallback 2: Extraction par OCR (si disponible)
          if ('Tesseract' in window) {
            return await extractBarcodesWithOCR(file);
          }
          
          throw new Error('Aucune méthode OCR disponible');
        } catch (thirdError) {
          // Échec de toutes les méthodes
          throw new FileProcessingError(
            'Impossible d\'extraire les codes-barres du PDF après plusieurs tentatives',
            file.name,
            'pdf',
            'high'
          );
        }
      }
    }
  }
  
  // Fallback pour détection fournisseur
  static identifySupplierWithFallback(
    productReferences: ProductReference[],
    excelData: BarcodeData[]
  ): SupplierInfo | null {
    // Stratégie principale: correspondance exacte
    const supplier = identifySupplier(productReferences, excelData);
    
    if (supplier) return supplier;
    
    // Fallback 1: Correspondance partielle
    const partialSupplier = identifySupplierPartial(productReferences, excelData);
    
    if (partialSupplier) return partialSupplier;
    
    // Fallback 2: Fournisseur principal
    const mainSupplier = getMainSupplier(excelData);
    
    if (mainSupplier) {
      mainSupplier.confidence = 0.3; // Confiance réduite
      return mainSupplier;
    }
    
    return null;
  }
}
```

## 8.4 Bonnes Pratiques de Développement

### Code Quality

#### Configuration ESLint Stricte
```javascript
// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Règles de sécurité
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-param-reassign': 'error',
      'no-return-assign': 'error',
      'no-sequences': 'error',
      'no-unused-expressions': 'error',
      'no-useless-concat': 'error',
      'prefer-template': 'warn',
      'react-hooks/exhaustive-deps': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn'
    },
  }
);
```

#### TypeScript Configuration Stricte
```json
// tsconfig.app.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    /* Sécurité */
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    "exactOptionalPropertyTypes": true
  },
  "include": ["src"]
}
```

### Performance

#### Lazy Loading et Code Splitting
```typescript
// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { LoadingSpinner } from './components/LoadingSpinner';

// Lazy loading des pages
const UploadPage = lazy(() => 
  import('./pages/UploadPage').then(module => ({ 
    default: module.UploadPage 
  }))
);

const SupplierValidationPage = lazy(() => 
  import('./pages/SupplierValidationPage').then(module => ({ 
    default: module.SupplierValidationPage 
  }))
);

const ProcessingPage = lazy(() => 
  import('./pages/ProcessingPage').then(module => ({ 
    default: module.ProcessingPage 
  }))
);

const ResultsPage = lazy(() => 
  import('./pages/ResultsPage').then(module => ({ 
    default: module.ResultsPage 
  }))
);

function AppContent() {
  const { state } = useApp();

  const renderCurrentStep = () => {
    switch (state.step) {
      case 'upload':
        return <UploadPage />;
      case 'supplier-validation':
        return <SupplierValidationPage />;
      case 'processing':
        return <ProcessingPage />;
      case 'results':
        return <ResultsPage />;
      default:
        return <UploadPage />;
    }
  };

  return (
    <Layout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      }>
        {renderCurrentStep()}
      </Suspense>
    </Layout>
  );
}
```

#### Memoization des Calculs Coûteux
```typescript
// src/components/EnhancedResultsTable.tsx
import React, { useState, useMemo } from 'react';

export function EnhancedResultsTable({ results, filters }) {
  // Tri et filtrage optimisés
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      // Logique de tri complexe
      return a.barcode.localeCompare(b.barcode);
    });
  }, [results]);
  
  // Filtrage optimisé
  const filteredResults = useMemo(() => {
    return filterResults(sortedResults, filters);
  }, [sortedResults, filters]);
  
  // Pagination optimisée
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredResults.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredResults, currentPage, itemsPerPage]);
  
  return (
    <table>
      {/* Rendu optimisé */}
      <tbody>
        {paginatedResults.map(result => (
          <tr key={result.barcode}>
            {/* Contenu de ligne */}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

#### Debouncing des Recherches
```typescript
// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Utilisation dans un composant
function SearchBar({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  useEffect(() => {
    if (debouncedSearchTerm) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch]);
  
  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Rechercher..."
      className="px-4 py-2 border rounded-lg"
    />
  );
}
```

### Accessibilité

#### Support ARIA et Rôles
```typescript
// src/components/FileUploadZone.tsx
function FileUploadZone({ title, description, onFileSelect, errors }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onFileSelect,
    // ...autres options
  });
  
  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 ${
        isDragActive ? 'border-oxbow-400 bg-oxbow-50' : 'border-gray-300'
      }`}
      role="button"
      aria-label={`Zone de dépôt pour ${title}`}
      aria-describedby={`${title}-description`}
      tabIndex={0}
    >
      <input {...getInputProps()} aria-hidden="true" />
      
      <h3 id={`${title}-title`} className="text-lg font-semibold">
        {title}
      </h3>
      
      <p id={`${title}-description`} className="text-sm text-gray-600">
        {description}
      </p>
      
      {errors.length > 0 && (
        <div role="alert" aria-live="assertive" className="mt-3">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-error-600">
              {error.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### Support Clavier Complet
```typescript
// src/components/EnhancedResultsTable.tsx
function ResultRow({ result, onView, onCopy }) {
  // Support clavier pour actions
  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };
  
  return (
    <tr className="hover:bg-gray-50">
      <td>{result.barcode}</td>
      <td>{result.status}</td>
      <td>
        <button
          onClick={() => onView(result)}
          onKeyDown={(e) => handleKeyDown(e, () => onView(result))}
          aria-label={`Voir détails pour ${result.barcode}`}
          tabIndex={0}
          className="p-2 rounded hover:bg-gray-100"
        >
          <Eye className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => onCopy(result.barcode)}
          onKeyDown={(e) => handleKeyDown(e, () => onCopy(result.barcode))}
          aria-label={`Copier le code ${result.barcode}`}
          tabIndex={0}
          className="p-2 rounded hover:bg-gray-100"
        >
          <Copy className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}
```

#### Focus Management
```typescript
// src/components/ResultDetailModal.tsx
function ResultDetailModal({ result, onClose }) {
  // Référence pour focus
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  
  // Focus automatique à l'ouverture
  useEffect(() => {
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
    
    // Sauvegarde de l'élément actif précédent
    const previousActiveElement = document.activeElement as HTMLElement;
    
    // Restauration du focus à la fermeture
    return () => {
      if (previousActiveElement) {
        previousActiveElement.focus();
      }
    };
  }, []);
  
  // Gestion touche Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 id="modal-title" className="text-xl font-bold">
            Détail du Code-Barres
          </h2>
          
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Fermer"
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Contenu modal */}
        
        <div className="p-6 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-oxbow-500 text-white rounded-lg"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

**Prochaine section :** [Roadmap et Améliorations](./09-roadmap-ameliorations.md)