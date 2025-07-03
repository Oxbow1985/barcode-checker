# 4. Guide d'Utilisation Complet

## 4.1 Prérequis et Installation

### Prérequis Système

#### Configuration Minimale
```bash
# Node.js version 18+ requise
node --version  # v18.0.0+
npm --version   # 8.0.0+

# Mémoire RAM recommandée
# Minimum: 4GB RAM
# Recommandé: 8GB+ RAM pour gros fichiers

# Espace disque
# 500MB libres pour installation
# 2GB+ pour cache et fichiers temporaires
```

#### Navigateurs Supportés
| Navigateur | Version Minimum | Fonctionnalités |
|------------|----------------|-----------------|
| Chrome | 90+ | ✅ Toutes fonctionnalités |
| Firefox | 88+ | ✅ Toutes fonctionnalités |
| Safari | 14+ | ✅ Toutes fonctionnalités |
| Edge | 90+ | ✅ Toutes fonctionnalités |
| Opera | 76+ | ✅ Toutes fonctionnalités |

### Installation Développement

#### Clonage et Configuration
```bash
# 1. Cloner le repository
git clone https://github.com/Oxbow1985/barcode-checker
cd barcode-checker

# 2. Installer les dépendances
npm install

# 3. Vérifier l'installation
npm run lint

# 4. Lancer en mode développement
npm run dev

# 5. Ouvrir dans le navigateur
# http://localhost:5173
```

#### Variables d'Environnement (Optionnel)
```bash
# .env.local (pour développement)
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
VITE_ENABLE_PERFORMANCE_MONITOR=true
```

### Build Production

#### Compilation Optimisée
```bash
# Build optimisé pour production
npm run build

# Vérification du build
npm run preview

# Test de performance
npm run build && npm run preview
```

#### Structure du Build
```
dist/
├── index.html                    # Point d'entrée
├── assets/
│   ├── index-[hash].js          # Bundle principal (React + logique)
│   ├── vendor-[hash].js         # Librairies tierces
│   ├── charts-[hash].js         # Composants graphiques
│   ├── utils-[hash].js          # Utilitaires (PDF.js, XLSX)
│   └── index-[hash].css         # Styles compilés
├── manifest.json                # Manifest PWA
└── sw.js                       # Service Worker
```

## 4.2 Guide Utilisateur Pas à Pas

### Étape 1 : Accès à l'Application

#### Première Connexion
1. **Ouvrir l'URL** dans un navigateur moderne
2. **Vérifier compatibilité** : Message d'alerte si navigateur non supporté
3. **Interface d'accueil** : Page upload avec zones distinctes PDF/Excel

#### Interface Principale
```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 OXBOW - Vérification Codes-Barres                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📄 Fichier PDF Étiquettes    📊 Fichier Excel Catalogue   │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │                         │  │                         │   │
│  │   Glisser-déposer       │  │   Glisser-déposer       │   │
│  │   votre PDF ici         │  │   votre Excel ici       │   │
│  │                         │  │                         │   │
│  │   ou cliquer pour       │  │   ou cliquer pour       │   │
│  │   sélectionner          │  │   sélectionner          │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
│                                                             │
│              [Analyser et identifier le fournisseur]        │
└─────────────────────────────────────────────────────────────┘
```

### Étape 2 : Upload des Fichiers

#### Upload PDF Étiquettes
1. **Glisser-déposer** le fichier PDF dans la zone de gauche
2. **Validation automatique** :
   - ✅ Format PDF vérifié
   - ✅ Taille < 50MB
   - ✅ Signature fichier validée
   - ✅ Contenu extractible confirmé

3. **Feedback visuel** :
   ```
   ✅ Fichier etiquettes_produits.pdf sélectionné avec succès
   📊 Taille: 12.3 MB
   📄 Format: PDF valide
   ```

#### Upload Excel Catalogue
1. **Glisser-déposer** le fichier Excel dans la zone de droite
2. **Formats supportés** :
   - `.xlsx` (Excel 2007+)
   - `.xlsm` (Excel avec macros)
   - `.xls` (Excel 97-2003)
   - `.csv` (Comma Separated Values)

3. **Validation et analyse préliminaire** :
   ```
   ✅ Fichier catalogue_fournisseur.xlsx sélectionné avec succès
   📊 Taille: 8.7 MB
   🎯 Format SS26 détecté avec couleurs, tailles et prix multi-devises
   📋 2,847 codes-barres trouvés
   ```

#### Gestion des Erreurs Upload
```
❌ Erreurs Communes et Solutions :

• "Fichier trop volumineux"
  → Solution: Compresser le PDF ou diviser l'Excel

• "Format non supporté"
  → Solution: Convertir en .xlsx ou .pdf

• "Fichier corrompu"
  → Solution: Réenregistrer depuis l'application source

• "Aucun texte extractible"
  → Solution: Utiliser un PDF avec texte (pas d'image scannée)
```

### Étape 3 : Validation Fournisseur

#### Fournisseur Détecté Automatiquement
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Identification du Fournisseur                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ✅ Fournisseur Identifié Automatiquement                    │
│                                                             │
│ 🏢 OXBOW                                                   │
│ 📊 1,247 produits dans Excel                               │
│ 🎯 23 références trouvées dans le PDF                      │
│ 📈 Confiance: 87% (Élevée)                                  │
│                                                             │
│ 📋 Références Détectées:                                    │
│ • OXV932106  • OXV932107  • OXV932108                       │
│ • OXV932109  • OXV932110  +18 autres                        │
│                                                             │
│ [✅ Sélectionner ce fournisseur] [🔍 Choisir manuellement] │
└─────────────────────────────────────────────────────────────┘
```

#### Sélection Manuelle (si nécessaire)
1. **Liste des fournisseurs disponibles** :
   ```
   🏢 Fournisseurs Détectés dans l'Excel:
   
   ┌─────────────────┬──────────────┬─────────────┐
   │ Fournisseur     │ Produits     │ Confiance   │
   ├─────────────────┼──────────────┼─────────────┤
   │ OXBOW           │ 1,247        │ 87%         │
   │ SUPPLIER_B      │ 892          │ 12%         │
   │ SUPPLIER_C      │ 445          │ 3%          │
   └─────────────────┴──────────────┴─────────────┘
   ```

2. **Cliquer sur le fournisseur souhaité**
3. **Confirmer la sélection**

#### Validation et Continuation
```
✅ Fournisseur sélectionné: OXBOW
📊 Analyse ciblée sur 1,247 produits
🎯 Format SS26 enrichi détecté
🚀 Prêt pour l'analyse complète

[Continuer avec OXBOW] →
```

### Étape 4 : Traitement et Analyse

#### Progression Temps Réel
```
┌─────────────────────────────────────────────────────────────┐
│ ⚡ Traitement en cours...                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🏢 Analyse ciblée pour OXBOW                               │
│ 📊 1,247 produits dans la base                             │
│ 🎯 Confiance: 87%                                          │
│                                                             │
│ ████████████████████████████████████████████████ 85%       │
│                                                             │
│ ✅ Extraction des codes-barres du PDF                      │
│ ✅ Filtrage des données OXBOW                              │
│ 🔄 Comparaison PDF → Excel                                 │
│ ⏳ Génération du rapport de conformité                     │
│                                                             │
│ 📈 Étapes du traitement:                                   │
│ • Extraction PDF: 156 codes trouvés                        │
│ • Filtrage Excel: 1,247 produits OXBOW                     │
│ • Comparaison: 142 correspondances trouvées                │
│ • Conformité: 91.0%                                        │
└─────────────────────────────────────────────────────────────┘
```

#### Messages de Progression
1. **Extraction PDF** : "Extraction des codes-barres du PDF..."
2. **Analyse Excel** : "Filtrage des données pour OXBOW..."
3. **Comparaison** : "Comparaison PDF → Excel..."
4. **Finalisation** : "Génération du rapport de conformité..."

### Étape 5 : Consultation des Résultats

#### Résumé Exécutif
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Rapport de Vérification Oxbow                           │
│ Fournisseur: OXBOW • 156 codes PDF • 91.0% de conformité   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🎯 91.0%        🚨 14         📊 156        ⚡ Excellent    │
│ Conformité      Erreurs       Total        Performance      │
│                 critiques     analysé                       │
│                                                             │
│ 📈 Répartition des Résultats:                              │
│ ████████████████████████████████████████ 142 (91.0%)       │
│ ✅ Correspondances exactes                                  │
│                                                             │
│ ████ 14 (9.0%)                                             │
│ 🚨 PDF uniquement                                          │
│                                                             │
│ 💡 Recommandations:                                        │
│ • Contacter OXBOW pour ajouter 14 codes manquants          │
│ • Performance excellente - Maintenir la qualité            │
└─────────────────────────────────────────────────────────────┘
```

#### Section Codes Manquants (si applicable)
```
┌─────────────────────────────────────────────────────────────┐
│ 🚨 Codes-barres non trouvés chez OXBOW                     │
│ 14 codes PDF manquants sur 156 (9.0%)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📊 Impact Business:                                        │
│ • Criticité: 🟡 Modérée                                    │
│ • Ventes impactées: 14 produits                            │
│ • Action requise: Planifiée                                │
│                                                             │
│ 📋 Exemples de codes manquants:                            │
│ 3605168507131  3605168507148  3605168507155                 │
│ 3605168507162  3605168507179  +9 autres                    │
│                                                             │
│ [📧 Copier tous les codes] [📋 Voir détails]               │
│                                                             │
│ 💡 Actions recommandées pour OXBOW:                        │
│ • Envoyer la liste des 14 codes manquants au fournisseur   │
│ • Demander l'ajout de ces produits au catalogue OXBOW      │
│ • Vérifier les délais de mise à disposition                │
└─────────────────────────────────────────────────────────────┘
```

#### Graphiques Interactifs
1. **Répartition des résultats** : Graphique en secteurs
2. **Performance par couleur/taille** : Graphiques SS26
3. **Analyse des prix** : Distribution EUR/GBP
4. **Tendances** : Évolution de la conformité

#### Tableau Détaillé avec Filtres
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Résultats Détaillés (142/156)                           │
│                                                             │
│ 🔍 Filtres Avancés SS26:                                   │
│ [Statut ▼] [Couleur ▼] [Taille ▼] [Prix ▼] [🔍 Recherche] │
│                                                             │
│ ┌──────────────┬─────────┬─────────┬─────────┬─────────────┐ │
│ │ Code-barres  │ Statut  │ Couleur │ Taille  │ Prix        │ │
│ ├──────────────┼─────────┼─────────┼─────────┼─────────────┤ │
│ │ 3605168507131│ ✅ Exact│ Rouge   │ M       │ 29.99€      │ │
│ │ 3605168507148│ ✅ Exact│ Bleu    │ L       │ 34.99€      │ │
│ │ 3605168507155│ 🚨 PDF  │ -       │ -       │ -           │ │
│ │ 3605168507162│ ✅ Exact│ Vert    │ S       │ 27.99€      │ │
│ └──────────────┴─────────┴─────────┴─────────┴─────────────┘ │
│                                                             │
│ [📊 Excel] [📄 PDF] [🔍 Vue Grille] [📋 Vue Tableau]       │
└─────────────────────────────────────────────────────────────┘
```

### Étape 6 : Export des Rapports

#### Export Excel Multi-Feuilles
```
📊 Rapport Excel Généré:
├── 📋 Résumé Exécutif
│   ├── Informations générales
│   ├── Métriques principales
│   └── Recommandations business
├── 📊 Analyse Détaillée
│   ├── Tous les résultats
│   ├── Colonnes enrichies SS26
│   └── Filtres et tri
├── 🚨 Erreurs Critiques
│   ├── Codes PDF manquants
│   ├── Actions immédiates
│   └── Responsables
└── 🏢 Analyse Fournisseurs
    ├── Performance par fournisseur
    ├── Comparaisons
    └── Recommandations
```

#### Export PDF Premium
```
📄 Rapport PDF Exécutif:
├── Page 1: Couverture Premium
│   ├── Logo Oxbow
│   ├── Métriques principales
│   └── Évaluation qualité
├── Page 2: Dashboard Analytique
│   ├── Graphiques visuels
│   ├── KPI cards
│   └── Recommandations
├── Page 3: Analyse Détaillée
│   ├── Tableau résultats
│   ├── Statistiques
│   └── Notes techniques
└── Page 4: Plan d'Action
    ├── Actions prioritaires
    ├── Suivi KPI
    └── Contact support
```

## 4.3 Cas d'Usage Typiques

### Cas 1 : Vérification Catalogue Fournisseur Standard

#### Contexte
- **Situation** : Nouveau catalogue reçu d'un fournisseur existant
- **Fichiers** : PDF étiquettes (50-200 produits) + Excel catalogue (500-2000 produits)
- **Objectif** : Vérifier la cohérence avant mise en production

#### Workflow
1. **Upload** : PDF étiquettes + Excel catalogue
2. **Détection** : Fournisseur identifié automatiquement (confiance élevée)
3. **Traitement** : Analyse en 2-3 minutes
4. **Résultat attendu** : 95%+ de conformité, quelques nouveaux produits

#### Résultat Type
```
✅ Conformité: 97.2%
📊 Total: 187 codes PDF
🎯 Trouvés: 182 codes
🚨 Manquants: 5 codes (nouveaux produits)
💡 Action: Demander ajout des 5 nouveaux codes
```

### Cas 2 : Audit Qualité Multi-Fournisseurs

#### Contexte
- **Situation** : Contrôle qualité trimestriel
- **Fichiers** : PDF étiquettes mixtes + Excel consolidé multi-fournisseurs
- **Objectif** : Identifier les problèmes par fournisseur

#### Workflow
1. **Upload** : PDF mixte + Excel multi-fournisseurs
2. **Détection** : Identification automatique du fournisseur principal
3. **Analyse** : Rapport détaillé par fournisseur
4. **Export** : Rapport Excel avec onglet par fournisseur

#### Résultat Type
```
📊 Analyse Multi-Fournisseurs:
├── OXBOW: 89.5% conformité (142/159 codes)
├── SUPPLIER_B: 76.3% conformité (87/114 codes)
└── SUPPLIER_C: 92.1% conformité (35/38 codes)

💡 Actions:
• SUPPLIER_B: 27 codes manquants - Action prioritaire
• OXBOW: 17 codes manquants - Suivi standard
• SUPPLIER_C: 3 codes manquants - Excellent
```

### Cas 3 : Intégration Nouveau Fournisseur

#### Contexte
- **Situation** : Premier catalogue d'un nouveau partenaire
- **Fichiers** : PDF test + Excel nouveau format
- **Objectif** : Valider la compatibilité et la qualité

#### Workflow
1. **Upload** : PDF test + Excel nouveau fournisseur
2. **Détection** : Format SS26/FW25 détecté automatiquement
3. **Validation** : Vérification structure et qualité données
4. **Rapport** : Évaluation complète pour validation partenariat

#### Résultat Type
```
🆕 Nouveau Fournisseur: PARTNER_NEW
🎯 Format détecté: SS26 (Enrichi)
📊 Qualité données: 94% (Excellente)
✅ Structure compatible: Oui
💡 Recommandation: Validation partenariat ✅

📋 Détails:
• Colonnes détectées: Gencod, X300, X350, Couleur, Taille
• Encodage: UTF-8 ✅
• Doublons: 0 ✅
• Erreurs: 3% (Acceptable)
```

## 4.4 Gestion des Erreurs et Dépannage

### Erreurs Communes et Solutions

#### Erreur : "Colonne code-barres non trouvée"

**Symptômes :**
```
❌ Erreur lors de l'analyse du fichier Excel:
Colonne code-barres non trouvée.

ANALYSE DU FICHIER:
- Feuille utilisée: "Sheet1"
- Feuilles disponibles: Sheet1, Summary
- Ligne d'en-têtes détectée: 1
- Colonnes détectées: A: "Code", B: "Description", C: "Prix"
```

**Causes possibles :**
- Nom de colonne non standard
- Feuille Excel incorrecte sélectionnée
- En-têtes sur une ligne différente

**Solutions :**
1. **Renommer la colonne** :
   ```
   ✅ Formats acceptés:
   • SS26: "Gencod"
   • FW25: "code-barres", "barcode", "ean", "ean13"
   ```

2. **Vérifier la feuille** :
   ```
   💡 Feuilles prioritaires:
   • "Main sheet" (SS26)
   • "Sheet1" (Standard)
   • "AH 25" (FW25)
   • "Data", "Produits"
   ```

3. **Corriger les en-têtes** :
   ```
   ✅ Placer les en-têtes en ligne 1
   ✅ Éviter les cellules fusionnées
   ✅ Utiliser des noms simples
   ```

#### Erreur : "Aucun code-barres trouvé dans le PDF"

**Symptômes :**
```
❌ Aucun code-barres OXBOW détecté: 0

VÉRIFICATIONS:
1. Les codes-barres doivent être numériques (ex: 3605168507131)
2. Longueur: 13 chiffres
3. Format attendu: 3605168XXXXXX
```

**Causes possibles :**
- PDF scanné (image) au lieu de texte
- Codes-barres non OXBOW
- Format PDF corrompu

**Solutions :**
1. **Vérifier le contenu PDF** :
   ```
   ✅ PDF avec texte extractible
   ❌ PDF scanné/image
   
   Test: Sélectionner du texte dans le PDF
   Si impossible → PDF image
   ```

2. **Vérifier les codes** :
   ```
   ✅ Format OXBOW: 3605168XXXXXX
   ❌ Autres formats: 123456789012X
   
   Exemples valides:
   • 3605168507131
   • 3605168507148
   • 3605168507155
   ```

3. **Régénérer le PDF** :
   ```
   💡 Solutions:
   • Exporter depuis l'application source
   • Utiliser "Imprimer vers PDF"
   • Éviter la numérisation
   ```

#### Erreur : "Fichier trop volumineux"

**Symptômes :**
```
❌ Fichier rejeté: Fichier trop volumineux
PDF: 67.3MB (max 50MB)
Excel: 25.1MB (max 20MB)
```

**Solutions :**
1. **Compresser le PDF** :
   ```bash
   # Outils recommandés:
   • Adobe Acrobat: "Réduire la taille"
   • PDF24: Compression en ligne
   • SmallPDF: Compression gratuite
   
   Objectif: < 50MB
   ```

2. **Optimiser l'Excel** :
   ```
   💡 Techniques:
   • Supprimer colonnes inutiles
   • Supprimer lignes vides
   • Compresser images intégrées
   • Sauvegarder en .xlsx (pas .xls)
   
   Objectif: < 20MB
   ```

3. **Diviser les fichiers** :
   ```
   📊 Stratégie:
   • Diviser par fournisseur
   • Diviser par gamme de produits
   • Traiter par lots
   ```

#### Erreur : "Format de fichier non valide"

**Symptômes :**
```
❌ Format de fichier non valide ou corrompu
Signature fichier invalide
```

**Causes :**
- Fichier corrompu
- Extension incorrecte
- Fichier malveillant bloqué

**Solutions :**
1. **Vérifier l'extension** :
   ```
   ✅ PDF: .pdf
   ✅ Excel: .xlsx, .xlsm, .xls
   ✅ CSV: .csv
   ```

2. **Régénérer le fichier** :
   ```
   💡 Méthodes:
   • Réenregistrer depuis l'application source
   • Convertir via un outil fiable
   • Vérifier l'intégrité du fichier
   ```

### Mode Debug Avancé

#### Activation du Mode Debug
```javascript
// Dans la console du navigateur
localStorage.setItem('oxbow-debug', 'true');
// Recharger la page
```

#### Informations Debug Disponibles
```
🔧 Mode Debug Activé:

📊 Analyse du Fichier:
├── Nom: catalogue_fournisseur.xlsx
├── Taille: 8.7 MB
├── Feuilles: ["Main sheet", "Summary", "Config"]
├── Feuille sélectionnée: "Main sheet"
└── Encodage: UTF-8

🎯 Détection des Colonnes:
├── Gencod: ✅ Détecté (index 0, confiance: 95%)
├── X300: ✅ Détecté (index 4, confiance: 87%)
├── X350: ✅ Détecté (index 5, confiance: 87%)
├── Couleur: ✅ Détecté (index 8, confiance: 92%)
└── Taille: ✅ Détecté (index 9, confiance: 89%)

📈 Qualité des Données:
├── Lignes totales: 2,847
├── Lignes valides: 2,731 (95.9%)
├── Lignes avec erreurs: 116 (4.1%)
├── Lignes vides: 0
├── Doublons: 12
└── Score qualité: 94%

⚡ Performance:
├── Temps parsing: 1,247ms
├── Temps traitement: 3,891ms
├── Mémoire utilisée: 45.2 MB
└── Chunks traités: 3
```

### Support et Assistance

#### Canaux de Support
```
📞 Support Oxbow:

🏢 Équipe Quality Control
📧 quality@oxbow.com
📱 Support technique 24/7

📋 Informations à fournir:
• Version navigateur
• Taille des fichiers
• Messages d'erreur complets
• Captures d'écran si possible
```

#### FAQ Rapide
```
❓ Questions Fréquentes:

Q: L'application fonctionne-t-elle hors ligne?
R: Oui, une fois chargée, elle fonctionne sans internet.

Q: Mes données sont-elles envoyées sur un serveur?
R: Non, tout le traitement se fait dans votre navigateur.

Q: Puis-je traiter plusieurs fournisseurs simultanément?
R: Non, un fournisseur à la fois pour plus de précision.

Q: Quelle est la limite de taille des fichiers?
R: PDF: 50MB, Excel: 20MB

Q: Les formats .xlsm sont-ils supportés?
R: Oui, tous les formats Excel sont supportés.
```

---

**Prochaine section :** [Architecture Technique](./05-architecture-technique.md)
