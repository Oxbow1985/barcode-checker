import { ValidationError } from '../types';

const ALLOWED_PDF_SIGNATURES = [
  [0x25, 0x50, 0x44, 0x46], // %PDF
];

const ALLOWED_EXCEL_SIGNATURES = [
  [0x50, 0x4B, 0x03, 0x04], // ZIP (XLSX)
  [0x50, 0x4B, 0x05, 0x06], // ZIP (XLSX)
  [0xD0, 0xCF, 0x11, 0xE0], // OLE2 (XLS/XLSM)
];

export function validatePdfFile(file: File): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // MIME type validation
  if (!file.type.includes('pdf')) {
    errors.push({ field: 'pdf', message: 'Le fichier doit être au format PDF' });
  }
  
  // Size validation
  if (file.size > 50 * 1024 * 1024) {
    errors.push({ field: 'pdf', message: 'Le fichier PDF ne doit pas dépasser 50MB' });
  }
  
  // Minimum size check
  if (file.size < 1024) {
    errors.push({ field: 'pdf', message: 'Le fichier PDF semble être corrompu ou vide' });
  }
  
  return errors;
}

export function validateExcelFile(file: File): ValidationError[] {
  const errors: ValidationError[] = [];
  
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
    'application/vnd.ms-excel', // .xls
    'text/csv'
  ];
  
  // Plus flexible pour accepter les fichiers XLSM
  const isValidType = validTypes.some(type => file.type.includes(type)) || 
                     file.name.toLowerCase().endsWith('.xlsm') ||
                     file.name.toLowerCase().endsWith('.xlsx') ||
                     file.name.toLowerCase().endsWith('.xls') ||
                     file.name.toLowerCase().endsWith('.csv');
  
  if (!isValidType) {
    errors.push({ field: 'excel', message: 'Le fichier doit être au format Excel (.xlsx, .xlsm, .xls) ou CSV' });
  }
  
  if (file.size > 20 * 1024 * 1024) {
    errors.push({ field: 'excel', message: 'Le fichier Excel ne doit pas dépasser 20MB' });
  }
  
  if (file.size < 100) {
    errors.push({ field: 'excel', message: 'Le fichier Excel semble être corrompu ou vide' });
  }
  
  return errors;
}

export async function validateFileSignature(file: File, type: 'pdf' | 'excel'): Promise<boolean> {
  try {
    const buffer = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    const signatures = type === 'pdf' ? ALLOWED_PDF_SIGNATURES : ALLOWED_EXCEL_SIGNATURES;
    
    return signatures.some(signature => 
      signature.every((byte, index) => bytes[index] === byte)
    );
  } catch {
    return false;
  }
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 100);
}