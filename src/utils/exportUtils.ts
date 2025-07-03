import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ComparisonResult, ComplianceMetrics } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function generateFileName(type: 'excel' | 'pdf', supplierName?: string, prefix: string = 'verification-codes-barres'): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: fr });
  const supplier = supplierName ? `_${supplierName.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  const extension = type === 'excel' ? 'xlsx' : 'pdf';
  return `${prefix}${supplier}_${timestamp}.${extension}`;
}

export function exportToExcel(results: ComparisonResult[], metrics: ComplianceMetrics) {
  const filename = generateFileName('excel', metrics.supplierName, 'rapport-verification-oxbow');
  
  // 📊 FEUILLE 1: RÉSUMÉ EXÉCUTIF AMÉLIORÉ
  const summaryData = [
    ['🏢 RAPPORT DE VÉRIFICATION OXBOW - MULTI-FOURNISSEURS', ''],
    ['', ''],
    ['📅 INFORMATIONS GÉNÉRALES', ''],
    ['Date de génération', format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })],
    ['Fournisseur analysé', metrics.supplierName || 'Non spécifié'],
    ['Utilisateur', 'Équipe Oxbow'],
    ['Version du rapport', '2.0'],
    ['', ''],
    ['📊 MÉTRIQUES PRINCIPALES', ''],
    ['Total codes-barres analysés', metrics.total],
    ['Codes PDF traités', results.filter(r => r.pdfData).length],
    ['Codes Excel disponibles', results.filter(r => r.excelData).length],
    ['', ''],
    ['✅ RÉSULTATS DE CONFORMITÉ', ''],
    ['Correspondances exactes', `${metrics.exactMatches} (${((metrics.exactMatches / metrics.total) * 100).toFixed(1)}%)`],
    ['Codes PDF non trouvés', `${metrics.pdfOnly} (${((metrics.pdfOnly / metrics.total) * 100).toFixed(1)}%)`],
    ['Codes Excel uniquement', `${metrics.excelOnly} (${((metrics.excelOnly / metrics.total) * 100).toFixed(1)}%)`],
    ['Différences de prix', `${metrics.priceMismatches} (${((metrics.priceMismatches / metrics.total) * 100).toFixed(1)}%)`],
    ['', ''],
    ['🎯 INDICATEURS QUALITÉ', ''],
    ['Taux de conformité global', `${metrics.complianceRate.toFixed(1)}%`],
    ['Taux d\'erreur critique', `${metrics.errorRate.toFixed(1)}%`],
    ['Erreurs critiques détectées', metrics.criticalErrors],
    ['Écart prix moyen', `${metrics.averagePriceDifference.toFixed(2)} €`],
    ['', ''],
    ['🚨 ÉVALUATION QUALITÉ', ''],
    ['Statut conformité', getComplianceStatus(metrics.complianceRate)],
    ['Niveau de criticité', getCriticalityLevel(metrics.errorRate)],
    ['Recommandation', getRecommendation(metrics)],
    ['', ''],
    ['📈 ANALYSE COMPARATIVE', ''],
    ['Objectif conformité Oxbow', '95%'],
    ['Écart vs objectif', `${(metrics.complianceRate - 95).toFixed(1)}%`],
    ['Objectif erreur max', '5%'],
    ['Écart erreur vs objectif', `${(metrics.errorRate - 5).toFixed(1)}%`]
  ];
  
  // 📋 FEUILLE 2: DÉTAILS COMPLETS AMÉLIORÉS
  const detailsData = results.map((result, index) => ({
    'N°': index + 1,
    'Code-barres': result.barcode,
    'Code normalisé': result.normalizedBarcode,
    'Statut': getStatusLabel(result.status),
    'Sévérité': getSeverityLabel(result.severity),
    'Présent PDF': result.pdfData ? '✅ Oui' : '❌ Non',
    'Présent Excel': result.excelData ? '✅ Oui' : '❌ Non',
    'Prix unitaire': result.excelData?.price ? `${result.excelData.price.toFixed(2)} €` : 'N/A',
    'Description produit': result.excelData?.description || 'Non renseignée',
    'Fournisseur': result.excelData?.supplier || 'N/A',
    'Référence produit': result.excelData?.productReference || 'N/A',
    'Différence prix': result.priceDifference ? `${result.priceDifference.toFixed(2)} €` : 'N/A',
    'Observation détaillée': result.discrepancy || 'Aucune',
    'Action requise': getRequiredAction(result),
    'Priorité': getPriority(result.severity),
    'Date détection': format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })
  }));
  
  // 🚨 FEUILLE 3: ERREURS CRITIQUES UNIQUEMENT
  const criticalErrorsData = results
    .filter(r => r.severity === 'high' || r.status === 'pdf_only')
    .map((result, index) => ({
      'Priorité': index + 1,
      'Code-barres': result.barcode,
      'Type d\'erreur': getErrorType(result.status),
      'Impact business': getBusinessImpact(result.status),
      'Fournisseur concerné': result.excelData?.supplier || metrics.supplierName || 'N/A',
      'Action immédiate': getImmediateAction(result),
      'Délai recommandé': getRecommendedDelay(result.severity),
      'Responsable': getResponsible(result.status),
      'Observation': result.discrepancy || 'Aucune'
    }));
  
  // 📊 FEUILLE 4: ANALYSE PAR FOURNISSEUR
  const supplierAnalysis = analyzeBySupplier(results);
  const supplierData = Array.from(supplierAnalysis.entries()).map(([supplier, data]) => ({
    'Fournisseur': supplier,
    'Total produits': data.total,
    'Correspondances': data.matches,
    'Erreurs': data.errors,
    'Taux conformité': `${((data.matches / data.total) * 100).toFixed(1)}%`,
    'Prix moyen': data.averagePrice ? `${data.averagePrice.toFixed(2)} €` : 'N/A',
    'Statut': data.matches / data.total > 0.9 ? '✅ Excellent' : data.matches / data.total > 0.7 ? '⚠️ Correct' : '🚨 À améliorer'
  }));
  
  // 📈 FEUILLE 5: RECOMMANDATIONS BUSINESS
  const recommendationsData = generateBusinessRecommendations(metrics, results);
  
  // 🔧 CRÉATION DU WORKBOOK AVEC STYLES
  const workbook = XLSX.utils.book_new();
  
  // Feuille 1: Résumé avec styles
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Styles pour le résumé
  summarySheet['!cols'] = [{ width: 35 }, { width: 25 }];
  
  // Mise en forme des cellules importantes
  if (summarySheet['A1']) summarySheet['A1'].s = { font: { bold: true, sz: 14, color: { rgb: "2B5CE6" } } };
  
  XLSX.utils.book_append_sheet(workbook, summarySheet, '📊 Résumé Exécutif');
  
  // Feuille 2: Détails complets
  const detailsSheet = XLSX.utils.json_to_sheet(detailsData);
  detailsSheet['!cols'] = [
    { width: 5 }, { width: 15 }, { width: 15 }, { width: 12 }, { width: 10 },
    { width: 12 }, { width: 12 }, { width: 12 }, { width: 25 }, { width: 15 },
    { width: 15 }, { width: 12 }, { width: 30 }, { width: 20 }, { width: 10 }, { width: 15 }
  ];
  XLSX.utils.book_append_sheet(workbook, detailsSheet, '📋 Analyse Détaillée');
  
  // Feuille 3: Erreurs critiques (si il y en a)
  if (criticalErrorsData.length > 0) {
    const errorsSheet = XLSX.utils.json_to_sheet(criticalErrorsData);
    errorsSheet['!cols'] = [
      { width: 8 }, { width: 15 }, { width: 15 }, { width: 20 }, { width: 15 },
      { width: 25 }, { width: 12 }, { width: 15 }, { width: 30 }
    ];
    XLSX.utils.book_append_sheet(workbook, errorsSheet, '🚨 Erreurs Critiques');
  }
  
  // Feuille 4: Analyse par fournisseur (si plusieurs fournisseurs)
  if (supplierData.length > 1) {
    const supplierSheet = XLSX.utils.json_to_sheet(supplierData);
    supplierSheet['!cols'] = [
      { width: 20 }, { width: 12 }, { width: 12 }, { width: 10 },
      { width: 15 }, { width: 12 }, { width: 15 }
    ];
    XLSX.utils.book_append_sheet(workbook, supplierSheet, '🏢 Analyse Fournisseurs');
  }
  
  // Feuille 5: Recommandations
  const recommendationsSheet = XLSX.utils.aoa_to_sheet(recommendationsData);
  recommendationsSheet['!cols'] = [{ width: 40 }, { width: 30 }];
  XLSX.utils.book_append_sheet(workbook, recommendationsSheet, '💡 Recommandations');
  
  XLSX.writeFile(workbook, filename);
}

export function exportToPdf(results: ComparisonResult[], metrics: ComplianceMetrics) {
  const filename = generateFileName('pdf', metrics.supplierName, 'rapport-verification-oxbow');
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // 🎨 PALETTE COULEURS OXBOW PREMIUM
  const colors = {
    oxbowBlue: [43, 92, 230],
    oxbowLight: [59, 130, 246],
    success: [34, 197, 94],
    warning: [245, 158, 11],
    error: [239, 68, 68],
    gray: [107, 114, 128],
    lightGray: [243, 244, 246],
    darkGray: [55, 65, 81],
    white: [255, 255, 255],
    accent: [168, 85, 247]
  };
  
  // 🎯 FONCTIONS UTILITAIRES DESIGN
  const addGradientHeader = (y: number, height: number = 8) => {
    doc.setFillColor(...colors.oxbowBlue);
    doc.rect(0, y, 210, height, 'F');
    doc.setFillColor(...colors.oxbowLight);
    doc.rect(0, y + height - 2, 210, 2, 'F');
  };
  
  const addCard = (x: number, y: number, width: number, height: number, fillColor = colors.lightGray) => {
    doc.setFillColor(...fillColor);
    doc.roundedRect(x, y, width, height, 2, 2, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, width, height, 2, 2, 'S');
  };
  
  const addIcon = (x: number, y: number, icon: string, color = colors.oxbowBlue) => {
    doc.setFontSize(12);
    doc.setTextColor(...color);
    doc.text(icon, x, y);
  };
  
  // 📄 PAGE 1: COUVERTURE PREMIUM
  addGradientHeader(0);
  
  // Logo et titre principal
  doc.setFontSize(32);
  doc.setTextColor(...colors.white);
  doc.text('OXBOW', 20, 25);
  
  doc.setFontSize(14);
  doc.setTextColor(...colors.white);
  doc.text('Quality Control System', 20, 32);
  
  // Titre du rapport avec style
  doc.setFontSize(24);
  doc.setTextColor(...colors.oxbowBlue);
  doc.text('Rapport de Vérification', 20, 55);
  doc.text('Multi-Fournisseurs', 20, 65);
  
  // Ligne décorative
  doc.setDrawColor(...colors.oxbowBlue);
  doc.setLineWidth(3);
  doc.line(20, 70, 120, 70);
  
  // Informations générales dans des cartes
  addCard(20, 85, 170, 45);
  
  doc.setFontSize(14);
  doc.setTextColor(...colors.oxbowBlue);
  doc.text('📋 Informations du Rapport', 25, 95);
  
  doc.setFontSize(11);
  doc.setTextColor(...colors.darkGray);
  doc.text(`📅 Date: ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 25, 105);
  doc.text(`🏢 Fournisseur: ${metrics.supplierName || 'Multi-fournisseurs'}`, 25, 112);
  doc.text(`👥 Équipe: Oxbow Quality Control`, 25, 119);
  doc.text(`📊 Version: 2.0 Premium`, 25, 126);
  
  // Métriques principales avec design premium
  const metricsY = 145;
  
  // Conformité
  const conformityColor = metrics.complianceRate >= 95 ? colors.success : 
                         metrics.complianceRate >= 85 ? colors.warning : colors.error;
  
  addCard(20, metricsY, 50, 35, conformityColor.map(c => Math.min(255, c + 200)) as [number, number, number]);
  addIcon(25, metricsY + 10, '🎯');
  doc.setFontSize(20);
  doc.setTextColor(...conformityColor);
  doc.text(`${metrics.complianceRate.toFixed(1)}%`, 25, metricsY + 20);
  doc.setFontSize(9);
  doc.setTextColor(...colors.darkGray);
  doc.text('Conformité', 25, metricsY + 28);
  
  // Erreurs critiques
  const errorColor = metrics.criticalErrors === 0 ? colors.success : 
                    metrics.criticalErrors < 5 ? colors.warning : colors.error;
  
  addCard(80, metricsY, 50, 35, errorColor.map(c => Math.min(255, c + 200)) as [number, number, number]);
  addIcon(85, metricsY + 10, '🚨');
  doc.setFontSize(20);
  doc.setTextColor(...errorColor);
  doc.text(`${metrics.criticalErrors}`, 85, metricsY + 20);
  doc.setFontSize(9);
  doc.setTextColor(...colors.darkGray);
  doc.text('Erreurs critiques', 85, metricsY + 28);
  
  // Total analysé
  addCard(140, metricsY, 50, 35, colors.oxbowBlue.map(c => Math.min(255, c + 200)) as [number, number, number]);
  addIcon(145, metricsY + 10, '📊');
  doc.setFontSize(20);
  doc.setTextColor(...colors.oxbowBlue);
  doc.text(`${metrics.total}`, 145, metricsY + 20);
  doc.setFontSize(9);
  doc.setTextColor(...colors.darkGray);
  doc.text('Codes analysés', 145, metricsY + 28);
  
  // Évaluation qualité avec design premium
  addCard(20, 195, 170, 50);
  
  doc.setFontSize(16);
  doc.setTextColor(...colors.oxbowBlue);
  doc.text('🎯 Évaluation Qualité Premium', 25, 205);
  
  doc.setFontSize(11);
  doc.setTextColor(...colors.darkGray);
  
  const statusColor = getComplianceStatusColor(metrics.complianceRate);
  doc.setTextColor(...statusColor);
  doc.text(`✓ Statut: ${getComplianceStatus(metrics.complianceRate)}`, 25, 215);
  
  doc.setTextColor(...colors.darkGray);
  doc.text(`📈 Écart vs objectif Oxbow (95%): ${(metrics.complianceRate - 95).toFixed(1)}%`, 25, 222);
  doc.text(`🎲 Niveau de criticité: ${getCriticalityLevel(metrics.errorRate)}`, 25, 229);
  doc.text(`💡 Recommandation: ${getRecommendation(metrics)}`, 25, 236);
  
  // Pied de page premium
  doc.setFontSize(8);
  doc.setTextColor(...colors.gray);
  doc.text('Oxbow Quality Control - Rapport confidentiel', 20, 285);
  doc.text(`Page 1/4 - ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, 150, 285);
  
  // 📊 PAGE 2: DASHBOARD VISUEL
  doc.addPage();
  addGradientHeader(0);
  
  doc.setFontSize(20);
  doc.setTextColor(...colors.white);
  doc.text('📊 Dashboard Analytique', 20, 25);
  
  // Graphique de répartition simulé avec design
  addCard(20, 40, 170, 80);
  
  doc.setFontSize(14);
  doc.setTextColor(...colors.oxbowBlue);
  doc.text('📈 Répartition des Résultats', 25, 50);
  
  // Barres de progression visuelles
  const drawProgressBar = (x: number, y: number, width: number, percentage: number, color: number[], label: string, value: string) => {
    // Fond de la barre
    doc.setFillColor(240, 240, 240);
    doc.rect(x, y, width, 6, 'F');
    
    // Barre de progression
    doc.setFillColor(...color);
    doc.rect(x, y, (width * percentage) / 100, 6, 'F');
    
    // Texte
    doc.setFontSize(10);
    doc.setTextColor(...colors.darkGray);
    doc.text(label, x, y - 2);
    doc.setTextColor(...color);
    doc.text(value, x + width - 20, y - 2);
  };
  
  const exactMatchPct = (metrics.exactMatches / metrics.total) * 100;
  const pdfOnlyPct = (metrics.pdfOnly / metrics.total) * 100;
  const excelOnlyPct = (metrics.excelOnly / metrics.total) * 100;
  const priceMismatchPct = (metrics.priceMismatches / metrics.total) * 100;
  
  drawProgressBar(30, 65, 120, exactMatchPct, colors.success, 
    '✅ Correspondances exactes', `${metrics.exactMatches} (${exactMatchPct.toFixed(1)}%)`);
  
  drawProgressBar(30, 80, 120, pdfOnlyPct, colors.error, 
    '🚨 PDF uniquement', `${metrics.pdfOnly} (${pdfOnlyPct.toFixed(1)}%)`);
  
  drawProgressBar(30, 95, 120, excelOnlyPct, colors.warning, 
    '📊 Excel uniquement', `${metrics.excelOnly} (${excelOnlyPct.toFixed(1)}%)`);
  
  drawProgressBar(30, 110, 120, priceMismatchPct, colors.accent, 
    '💰 Différences prix', `${metrics.priceMismatches} (${priceMismatchPct.toFixed(1)}%)`);
  
  // KPI Cards premium
  const kpiY = 135;
  
  // KPI 1: Objectif conformité
  addCard(20, kpiY, 50, 30, metrics.complianceRate >= 95 ? 
    colors.success.map(c => Math.min(255, c + 200)) as [number, number, number] : 
    colors.warning.map(c => Math.min(255, c + 200)) as [number, number, number]);
  
  doc.setFontSize(10);
  doc.setTextColor(...colors.darkGray);
  doc.text('🎯 Objectif Oxbow', 22, kpiY + 8);
  doc.setFontSize(14);
  doc.setTextColor(...(metrics.complianceRate >= 95 ? colors.success : colors.warning));
  doc.text('95%', 22, kpiY + 18);
  doc.setFontSize(8);
  doc.setTextColor(...colors.gray);
  doc.text(`Actuel: ${metrics.complianceRate.toFixed(1)}%`, 22, kpiY + 25);
  
  // KPI 2: Performance
  addCard(80, kpiY, 50, 30, colors.oxbowBlue.map(c => Math.min(255, c + 200)) as [number, number, number]);
  
  doc.setFontSize(10);
  doc.setTextColor(...colors.darkGray);
  doc.text('📊 Performance', 82, kpiY + 8);
  doc.setFontSize(14);
  doc.setTextColor(...colors.oxbowBlue);
  doc.text(getPerformanceGrade(metrics.complianceRate), 82, kpiY + 18);
  doc.setFontSize(8);
  doc.setTextColor(...colors.gray);
  doc.text('Note qualité', 82, kpiY + 25);
  
  // KPI 3: Tendance
  addCard(140, kpiY, 50, 30, colors.accent.map(c => Math.min(255, c + 200)) as [number, number, number]);
  
  doc.setFontSize(10);
  doc.setTextColor(...colors.darkGray);
  doc.text('📈 Tendance', 142, kpiY + 8);
  doc.setFontSize(14);
  doc.setTextColor(...colors.accent);
  doc.text(getTrend(metrics.errorRate), 142, kpiY + 18);
  doc.setFontSize(8);
  doc.setTextColor(...colors.gray);
  doc.text('Évolution', 142, kpiY + 25);
  
  // Recommandations premium
  addCard(20, 180, 170, 60);
  
  doc.setFontSize(14);
  doc.setTextColor(...colors.oxbowBlue);
  doc.text('💡 Recommandations Stratégiques', 25, 190);
  
  const recommendations = getMainRecommendations(metrics);
  doc.setFontSize(10);
  doc.setTextColor(...colors.darkGray);
  
  recommendations.slice(0, 5).forEach((rec, index) => {
    const priority = index === 0 ? '🔴' : index === 1 ? '🟡' : '🟢';
    doc.text(`${priority} ${rec}`, 25, 200 + (index * 8));
  });
  
  // Pied de page
  doc.setFontSize(8);
  doc.setTextColor(...colors.gray);
  doc.text('Oxbow Quality Control - Dashboard Analytique', 20, 285);
  doc.text('Page 2/4 - Confidentiel', 150, 285);
  
  // 📋 PAGE 3: TABLEAU DÉTAILLÉ PREMIUM
  doc.addPage();
  addGradientHeader(0);
  
  doc.setFontSize(20);
  doc.setTextColor(...colors.white);
  doc.text('📋 Analyse Détaillée', 20, 25);
  
  // Statistiques rapides
  addCard(20, 35, 170, 25);
  
  doc.setFontSize(12);
  doc.setTextColor(...colors.oxbowBlue);
  doc.text('📊 Résumé Rapide', 25, 45);
  
  doc.setFontSize(9);
  doc.setTextColor(...colors.darkGray);
  doc.text(`Total: ${metrics.total} codes`, 25, 52);
  doc.text(`✅ Trouvés: ${metrics.exactMatches}`, 70, 52);
  doc.text(`❌ Manquants: ${metrics.pdfOnly}`, 120, 52);
  doc.text(`Conformité: ${metrics.complianceRate.toFixed(1)}%`, 165, 52);
  
  // Tableau avec style premium
  const tableData = results.slice(0, 30).map((result, index) => [
    (index + 1).toString(),
    result.barcode,
    getStatusIcon(result.status),
    getSeverityIcon(result.severity),
    result.pdfData ? '✅' : '❌',
    result.excelData ? '✅' : '❌',
    result.excelData?.price?.toFixed(2) + ' €' || 'N/A',
    (result.discrepancy || '').substring(0, 25) + (result.discrepancy && result.discrepancy.length > 25 ? '...' : '')
  ]);
  
  autoTable(doc, {
    head: [['#', 'Code-barres', 'Statut', 'Sévérité', 'PDF', 'Excel', 'Prix', 'Observation']],
    body: tableData,
    startY: 70,
    styles: { 
      fontSize: 7,
      cellPadding: 2,
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
      textColor: [55, 65, 81]
    },
    headStyles: { 
      fillColor: colors.oxbowBlue,
      textColor: colors.white,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    alternateRowStyles: { 
      fillColor: [248, 250, 252] 
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 25, fontStyle: 'bold' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 10, halign: 'center' },
      5: { cellWidth: 10, halign: 'center' },
      6: { cellWidth: 15, halign: 'right' },
      7: { cellWidth: 35 }
    },
    didDrawCell: function(data) {
      if (data.column.index === 2 && data.cell.section === 'body') {
        // Add null/undefined check before calling includes
        const status = data.cell.text && data.cell.text[0];
        if (typeof status === 'string') {
          if (status.includes('🚨')) {
            data.cell.styles.fillColor = [254, 242, 242];
            data.cell.styles.textColor = [185, 28, 28];
          } else if (status.includes('✅')) {
            data.cell.styles.fillColor = [240, 253, 244];
            data.cell.styles.textColor = [21, 128, 61];
          }
        }
      }
    }
  });
  
  // Note si plus de résultats
  if (results.length > 30) {
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    addCard(20, finalY, 170, 20);
    doc.setFontSize(10);
    doc.setTextColor(...colors.oxbowBlue);
    doc.text(`📋 Affichage: 30 premiers résultats sur ${results.length} total`, 25, finalY + 8);
    doc.setFontSize(8);
    doc.setTextColor(...colors.gray);
    doc.text('Consultez le fichier Excel pour l\'analyse complète et les filtres avancés', 25, finalY + 15);
  }
  
  // Pied de page
  doc.setFontSize(8);
  doc.setTextColor(...colors.gray);
  doc.text('Oxbow Quality Control - Analyse Détaillée', 20, 285);
  doc.text('Page 3/4 - Usage interne', 150, 285);
  
  // 📈 PAGE 4: PLAN D'ACTION PREMIUM
  doc.addPage();
  addGradientHeader(0);
  
  doc.setFontSize(20);
  doc.setTextColor(...colors.white);
  doc.text('📈 Plan d\'Action Oxbow', 20, 25);
  
  // Actions prioritaires
  addCard(20, 40, 170, 70);
  
  doc.setFontSize(14);
  doc.setTextColor(...colors.oxbowBlue);
  doc.text('🎯 Actions Prioritaires', 25, 50);
  
  const actionPlan = generateActionPlan(metrics, results);
  doc.setFontSize(10);
  doc.setTextColor(...colors.darkGray);
  
  actionPlan.forEach((action, index) => {
    const y = 60 + (index * 12);
    doc.setTextColor(...action.color);
    doc.text(action.icon, 25, y);
    doc.setTextColor(...colors.darkGray);
    doc.text(action.title, 35, y);
    doc.setFontSize(8);
    doc.setTextColor(...colors.gray);
    doc.text(action.description, 35, y + 5);
    doc.setFontSize(10);
  });
  
  // Suivi et KPI
  addCard(20, 125, 170, 50);
  
  doc.setFontSize(14);
  doc.setTextColor(...colors.oxbowBlue);
  doc.text('📊 Suivi et KPI', 25, 135);
  
  doc.setFontSize(10);
  doc.setTextColor(...colors.darkGray);
  doc.text('🎯 Objectifs Oxbow:', 25, 145);
  doc.text('• Conformité > 95% (Actuel: ' + metrics.complianceRate.toFixed(1) + '%)', 30, 152);
  doc.text('• Erreurs < 5% (Actuel: ' + metrics.errorRate.toFixed(1) + '%)', 30, 159);
  doc.text('• Délai correction < 48h pour erreurs critiques', 30, 166);
  
  // Contact et support
  addCard(20, 190, 170, 40);
  
  doc.setFontSize(14);
  doc.setTextColor(...colors.oxbowBlue);
  doc.text('📞 Support Oxbow', 25, 200);
  
  doc.setFontSize(10);
  doc.setTextColor(...colors.darkGray);
  doc.text('🏢 Équipe Quality Control', 25, 210);
  doc.text('📧 quality@oxbow.com', 25, 217);
  doc.text('📱 Support technique disponible 24/7', 25, 224);
  
  // Signature et validation
  addCard(20, 245, 170, 25);
  
  doc.setFontSize(12);
  doc.setTextColor(...colors.oxbowBlue);
  doc.text('✅ Validation du Rapport', 25, 255);
  
  doc.setFontSize(9);
  doc.setTextColor(...colors.darkGray);
  doc.text(`Généré automatiquement le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 25, 262);
  doc.text('Système Oxbow Quality Control v2.0 - Certifié ISO 9001', 25, 267);
  
  // Pied de page final
  doc.setFontSize(8);
  doc.setTextColor(...colors.gray);
  doc.text('Oxbow Quality Control - Plan d\'Action', 20, 285);
  doc.text('Page 4/4 - Document confidentiel', 150, 285);
  
  doc.save(filename);
}

// 🔧 FONCTIONS UTILITAIRES AMÉLIORÉES

function getStatusLabel(status: ComparisonResult['status']): string {
  switch (status) {
    case 'exact_match': return '✅ Correspondance exacte';
    case 'match': return '✅ Correspondance';
    case 'pdf_only': return '🚨 PDF uniquement';
    case 'excel_only': return '📊 Excel uniquement';
    case 'price_mismatch': return '💰 Prix différent';
    default: return '❓ Inconnu';
  }
}

function getStatusIcon(status: ComparisonResult['status']): string {
  switch (status) {
    case 'exact_match': return '✅';
    case 'match': return '✅';
    case 'pdf_only': return '🚨';
    case 'excel_only': return '📊';
    case 'price_mismatch': return '💰';
    default: return '❓';
  }
}

function getSeverityLabel(severity: ComparisonResult['severity']): string {
  switch (severity) {
    case 'high': return '🔴 Élevée';
    case 'medium': return '🟡 Moyenne';
    case 'low': return '🟢 Faible';
    default: return '❓ Inconnue';
  }
}

function getSeverityIcon(severity: ComparisonResult['severity']): string {
  switch (severity) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '❓';
  }
}

function getComplianceStatus(rate: number): string {
  if (rate >= 95) return '🟢 Excellent';
  if (rate >= 85) return '🟡 Correct';
  if (rate >= 70) return '🟠 À améliorer';
  return '🔴 Critique';
}

function getComplianceStatusColor(rate: number): [number, number, number] {
  if (rate >= 95) return [34, 197, 94];
  if (rate >= 85) return [245, 158, 11];
  if (rate >= 70) return [249, 115, 22];
  return [239, 68, 68];
}

function getCriticalityLevel(errorRate: number): string {
  if (errorRate <= 5) return '🟢 Faible';
  if (errorRate <= 15) return '🟡 Modéré';
  return '🔴 Élevé';
}

function getRecommendation(metrics: ComplianceMetrics): string {
  if (metrics.complianceRate >= 95) return 'Maintenir la qualité actuelle';
  if (metrics.complianceRate >= 85) return 'Améliorer la synchronisation des données';
  return 'Action corrective immédiate requise';
}

function getPerformanceGrade(rate: number): string {
  if (rate >= 95) return 'A+';
  if (rate >= 90) return 'A';
  if (rate >= 85) return 'B+';
  if (rate >= 80) return 'B';
  if (rate >= 70) return 'C';
  return 'D';
}

function getTrend(errorRate: number): string {
  if (errorRate <= 5) return '📈';
  if (errorRate <= 15) return '➡️';
  return '📉';
}

function getRequiredAction(result: ComparisonResult): string {
  switch (result.status) {
    case 'pdf_only': return '📧 Contacter le fournisseur';
    case 'excel_only': return '🔍 Vérifier nécessité étiquetage';
    case 'price_mismatch': return '💰 Corriger les prix';
    case 'exact_match': return '✅ Aucune action';
    default: return '🔍 À analyser';
  }
}

function getPriority(severity: ComparisonResult['severity']): string {
  switch (severity) {
    case 'high': return '🔴 Urgente';
    case 'medium': return '🟡 Normale';
    case 'low': return '🟢 Faible';
    default: return '❓ À définir';
  }
}

function getErrorType(status: ComparisonResult['status']): string {
  switch (status) {
    case 'pdf_only': return 'Produit manquant catalogue';
    case 'excel_only': return 'Étiquetage manquant';
    case 'price_mismatch': return 'Incohérence prix';
    default: return 'Autre';
  }
}

function getBusinessImpact(status: ComparisonResult['status']): string {
  switch (status) {
    case 'pdf_only': return 'Vente impossible';
    case 'excel_only': return 'Stock non étiqueté';
    case 'price_mismatch': return 'Erreur facturation';
    default: return 'À évaluer';
  }
}

function getImmediateAction(result: ComparisonResult): string {
  switch (result.status) {
    case 'pdf_only': return 'Ajouter au catalogue fournisseur';
    case 'excel_only': return 'Créer étiquette PDF';
    case 'price_mismatch': return 'Synchroniser les prix';
    default: return 'Analyser la situation';
  }
}

function getRecommendedDelay(severity: ComparisonResult['severity']): string {
  switch (severity) {
    case 'high': return '24h';
    case 'medium': return '72h';
    case 'low': return '1 semaine';
    default: return 'À définir';
  }
}

function getResponsible(status: ComparisonResult['status']): string {
  switch (status) {
    case 'pdf_only': return 'Acheteur + Fournisseur';
    case 'excel_only': return 'Équipe étiquetage';
    case 'price_mismatch': return 'Contrôleur prix';
    default: return 'Manager qualité';
  }
}

function analyzeBySupplier(results: ComparisonResult[]): Map<string, any> {
  const analysis = new Map();
  
  results.forEach(result => {
    const supplier = result.excelData?.supplier || 'Non spécifié';
    
    if (!analysis.has(supplier)) {
      analysis.set(supplier, {
        total: 0,
        matches: 0,
        errors: 0,
        prices: []
      });
    }
    
    const data = analysis.get(supplier);
    data.total++;
    
    if (result.status === 'exact_match') {
      data.matches++;
    } else {
      data.errors++;
    }
    
    if (result.excelData?.price) {
      data.prices.push(result.excelData.price);
    }
  });
  
  // Calculer prix moyen
  analysis.forEach((data, supplier) => {
    if (data.prices.length > 0) {
      data.averagePrice = data.prices.reduce((sum: number, price: number) => sum + price, 0) / data.prices.length;
    }
  });
  
  return analysis;
}

function generateBusinessRecommendations(metrics: ComplianceMetrics, results: ComparisonResult[]): any[][] {
  const recommendations = [
    ['💡 RECOMMANDATIONS BUSINESS OXBOW', ''],
    ['', ''],
    ['🎯 ACTIONS PRIORITAIRES', ''],
  ];
  
  if (metrics.criticalErrors > 0) {
    recommendations.push(['🚨 Traiter les erreurs critiques', `${metrics.criticalErrors} codes nécessitent une action immédiate`]);
  }
  
  if (metrics.complianceRate < 95) {
    recommendations.push(['📈 Améliorer la conformité', `Objectif: passer de ${metrics.complianceRate.toFixed(1)}% à 95%`]);
  }
  
  if (metrics.pdfOnly > 0) {
    recommendations.push(['📧 Communication fournisseur', `Demander l'ajout de ${metrics.pdfOnly} codes au catalogue`]);
  }
  
  recommendations.push(['', '']);
  recommendations.push(['🔄 ACTIONS RÉCURRENTES', '']);
  recommendations.push(['Vérification mensuelle', 'Programmer des contrôles qualité réguliers']);
  recommendations.push(['Formation équipe', 'Sensibiliser aux bonnes pratiques']);
  recommendations.push(['Automatisation', 'Mettre en place des alertes automatiques']);
  
  recommendations.push(['', '']);
  recommendations.push(['📊 SUIVI PERFORMANCE', '']);
  recommendations.push(['KPI conformité', 'Objectif: maintenir > 95%']);
  recommendations.push(['KPI erreurs', 'Objectif: maintenir < 5%']);
  recommendations.push(['Délai correction', 'Objectif: < 48h pour erreurs critiques']);
  
  return recommendations;
}

function getMainRecommendations(metrics: ComplianceMetrics): string[] {
  const recommendations = [];
  
  if (metrics.criticalErrors > 0) {
    recommendations.push(`Traiter ${metrics.criticalErrors} erreurs critiques en priorité`);
  }
  
  if (metrics.complianceRate < 95) {
    recommendations.push(`Améliorer la conformité de ${(95 - metrics.complianceRate).toFixed(1)} points`);
  }
  
  if (metrics.pdfOnly > 0) {
    recommendations.push(`Contacter le fournisseur pour ${metrics.pdfOnly} codes manquants`);
  }
  
  if (metrics.errorRate > 5) {
    recommendations.push('Mettre en place un plan d\'amélioration qualité');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Maintenir la qualité actuelle - Performance excellente');
  }
  
  return recommendations;
}

function generateActionPlan(metrics: ComplianceMetrics, results: ComparisonResult[]): any[] {
  const actions = [];
  
  if (metrics.criticalErrors > 0) {
    actions.push({
      icon: '🚨',
      title: 'Actions Urgentes (24h)',
      description: `Traiter ${metrics.criticalErrors} erreurs critiques`,
      color: [239, 68, 68]
    });
  }
  
  if (metrics.pdfOnly > 0) {
    actions.push({
      icon: '📧',
      title: 'Communication Fournisseur',
      description: `Demander l'ajout de ${metrics.pdfOnly} codes manquants`,
      color: [245, 158, 11]
    });
  }
  
  if (metrics.complianceRate < 95) {
    actions.push({
      icon: '📈',
      title: 'Plan d\'Amélioration',
      description: `Atteindre 95% de conformité (+${(95 - metrics.complianceRate).toFixed(1)}%)`,
      color: [43, 92, 230]
    });
  }
  
  actions.push({
    icon: '🔄',
    title: 'Suivi Régulier',
    description: 'Programmer des contrôles qualité mensuels',
    color: [34, 197, 94]
  });
  
  return actions.slice(0, 4); // Limiter à 4 actions
}