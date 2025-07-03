/**
 * Normalisation simplifiée des codes-barres
 */
export function normalizeBarcode(barcode: string): string {
  if (!barcode) return '';
  
  // Supprimer les espaces et garder uniquement les chiffres
  return barcode.replace(/[^\d]/g, '');
}

/**
 * Valide si un format de code-barres est acceptable
 */
export function isValidBarcodeFormat(barcode: string): boolean {
  if (!barcode || typeof barcode !== 'string') return false;
  
  const normalized = normalizeBarcode(barcode);
  const validLengths = [8, 12, 13, 14];
  
  return validLengths.includes(normalized.length) && /^\d+$/.test(normalized);
}

/**
 * Calcule la similarité entre deux codes-barres
 */
export function calculateSimilarity(barcode1: string, barcode2: string): number {
  const norm1 = normalizeBarcode(barcode1);
  const norm2 = normalizeBarcode(barcode2);
  
  return norm1 === norm2 ? 1.0 : 0.0;
}