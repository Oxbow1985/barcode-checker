import * as pdfjsLib from 'pdfjs-dist';
import { BarcodeData, ProductReference } from '../types';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractBarcodesFromPdf(file: File): Promise<{
  barcodes: BarcodeData[];
  productReferences: ProductReference[];
  fullText: string;
  debugInfo: {
    rawBarcodes: string[];
    rawReferences: string[];
    textSample: string;
    processingStats: {
      totalReferencesFound: number;
      validBarcodesExtracted: number;
      productReferencesOnly: number;
      invalidFormats: number;
    };
  };
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    console.log('🔍 Extraction universelle des codes-barres OXBOW...');
    
    const foundBarcodes = new Set<string>();
    
    // 🎯 PATTERNS UNIVERSELS - Testent tous les formats OXBOW connus
    const universalPatterns = [
      { name: 'FW25', pattern: /3\s*605\s*168\s*\d{6}/g },
      { name: 'SS26', pattern: /3\s*6051\s*68\s*\d{6}/g },
      { name: 'Complet', pattern: /3605168\d{6}/g },
      { name: 'Ultra-flexible', pattern: /3\s*6\s*0\s*5\s*1\s*6\s*8\s*\d{6}/g }
    ];
    
    // Test de tous les patterns
    const allMatches: string[] = [];
    universalPatterns.forEach(({ name, pattern }) => {
      const matches = fullText.match(pattern) || [];
      if (matches.length > 0) {
        console.log(`✅ ${name}: ${matches.length} codes trouvés`);
        allMatches.push(...matches);
      }
    });
    
    // Validation et nettoyage de tous les matches
    allMatches.forEach(match => {
      const cleaned = match.replace(/\s/g, '');
      
      if (cleaned.length === 13 && 
          /^\d{13}$/.test(cleaned) && 
          cleaned.startsWith('3605168')) {
        foundBarcodes.add(cleaned);
      }
    });
    
    // 🔄 FALLBACK: Si aucun pattern ne fonctionne
    if (foundBarcodes.size === 0) {
      console.log('🔄 Fallback: recherche générale...');
      
      const textWithoutSpaces = fullText.replace(/\s/g, '');
      const allNumbers = textWithoutSpaces.match(/\d{13}/g) || [];
      
      allNumbers.forEach(num => {
        if (num.startsWith('3605168')) {
          foundBarcodes.add(num);
        }
      });
    }
    
    console.log(`✅ Codes-barres OXBOW détectés: ${foundBarcodes.size}`);
    
    // 2. Extraction des références produits
    const referenceMatches = fullText.match(/([A-Z0-9]{9})/g) || [];
    
    const validBarcodes = Array.from(foundBarcodes);
    const productReferencesOnly = referenceMatches.filter(ref => 
      !validBarcodes.some(barcode => barcode.includes(ref))
    );
    
    const barcodes: BarcodeData[] = validBarcodes.map(barcode => ({
      barcode,
      normalizedBarcode: barcode,
      source: 'pdf' as const,
      rawBarcode: barcode
    }));
    
    const productReferences: ProductReference[] = referenceMatches.map(ref => ({
      pattern: 'DIRECT',
      code: ref,
      fullReference: ref
    }));
    
    const processingStats = {
      totalReferencesFound: referenceMatches.length,
      validBarcodesExtracted: validBarcodes.length,
      productReferencesOnly: productReferencesOnly.length,
      invalidFormats: 0
    };
    
    const debugInfo = {
      rawBarcodes: validBarcodes,
      rawReferences: referenceMatches,
      textSample: fullText.substring(0, 500),
      processingStats
    };
    
    // 🎯 RÉSULTATS FINAUX
    console.group('📄 EXTRACTION UNIVERSELLE OXBOW - SUCCÈS');
    console.log(`✅ Codes-barres OXBOW trouvés: ${validBarcodes.length}`);
    console.log(`📝 Références produits: ${referenceMatches.length}`);
    console.log(`🔧 Compatibilité: FW25, SS26, et futurs formats`);
    
    if (validBarcodes.length > 0) {
      console.log(`🎯 Codes détectés (${validBarcodes.length} total)`);
      // Afficher seulement les 5 premiers pour ne pas encombrer
      validBarcodes.slice(0, 5).forEach((code, i) => {
        console.log(`${i + 1}. ${code}`);
      });
      if (validBarcodes.length > 5) {
        console.log(`... et ${validBarcodes.length - 5} autres codes`);
      }
    }
    
    console.groupEnd();
    
    return {
      barcodes,
      productReferences,
      fullText: fullText.trim(),
      debugInfo
    };
  } catch (error) {
    throw new Error(`Erreur lors de l'analyse du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}
