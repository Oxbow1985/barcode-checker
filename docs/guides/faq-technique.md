# FAQ Technique - Oxbow Barcode Checker

Cette FAQ répond aux questions techniques fréquemment posées sur l'application Oxbow Barcode Checker.

## 📋 Table des Matières

1. [Questions Générales](#questions-générales)
2. [Traitement des Fichiers](#traitement-des-fichiers)
3. [Formats et Compatibilité](#formats-et-compatibilité)
4. [Performance et Optimisation](#performance-et-optimisation)
5. [Sécurité et Confidentialité](#sécurité-et-confidentialité)
6. [Intégration et API](#intégration-et-api)
7. [Dépannage](#dépannage)

## Questions Générales

### Q: Quelles technologies sont utilisées dans l'application?

**R:** L'application utilise:
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Traitement PDF**: PDF.js
- **Traitement Excel**: XLSX.js
- **Graphiques**: Chart.js
- **Animations**: Framer Motion
- **Export**: jsPDF, XLSX

Toutes les opérations sont effectuées côté client, sans serveur backend.

### Q: L'application fonctionne-t-elle hors ligne?

**R:** Oui, une fois chargée, l'application fonctionne entièrement hors ligne. Elle est également configurée comme PWA (Progressive Web App), ce qui permet de l'installer sur votre appareil et de l'utiliser sans connexion internet.

### Q: Quelles sont les exigences système minimales?

**R:** L'application nécessite:
- **Navigateur**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **RAM**: 4GB minimum, 8GB recommandé pour les gros fichiers
- **CPU**: Processeur dual-core moderne
- **Espace disque**: 100MB pour l'application + espace pour le cache

## Traitement des Fichiers

### Q: Quelle est la taille maximale des fichiers supportée?

**R:** Les limites actuelles sont:
- **PDF**: 50MB
- **Excel**: 20MB

Ces limites sont imposées pour garantir la stabilité du navigateur. Pour les fichiers plus volumineux, nous recommandons de les diviser en plusieurs fichiers plus petits.

### Q: Comment les codes-barres sont-ils extraits du PDF?

**R:** L'extraction se fait en plusieurs étapes:
1. Le PDF est chargé via PDF.js
2. Le texte est extrait page par page
3. Des expressions régulières (regex) sont appliquées pour détecter les codes-barres
4. Plusieurs patterns sont utilisés pour s'adapter aux différents formats
5. Les codes trouvés sont normalisés et validés

Si aucun code n'est trouvé avec les patterns spécifiques, un fallback plus générique est utilisé.

### Q: Comment l'application détecte-t-elle les colonnes dans Excel?

**R:** La détection est basée sur:
1. Analyse des noms de colonnes (correspondance avec des noms connus)
2. Validation du contenu des cellules (vérification que les données correspondent au type attendu)
3. Score de confiance calculé pour chaque colonne potentielle
4. Sélection des colonnes avec le meilleur score

L'application peut détecter automatiquement les formats SS26 et FW25, ainsi que de nombreuses variations.

### Q: Les fichiers sont-ils envoyés sur un serveur?

**R:** Non, tout le traitement est effectué localement dans votre navigateur. Aucune donnée n'est envoyée à un serveur externe, garantissant ainsi la confidentialité totale de vos données.

## Formats et Compatibilité

### Q: Quels formats de codes-barres sont supportés?

**R:** L'application supporte principalement les codes-barres OXBOW au format EAN-13, avec les préfixes suivants:
- `3605168` (format standard FW25/SS26)
- `3605169` (nouveau format SS27)

Les codes-barres doivent avoir 13 chiffres au total.

### Q: Quels formats Excel sont supportés?

**R:** L'application supporte:
- `.xlsx` (Excel 2007+)
- `.xlsm` (Excel avec macros)
- `.xls` (Excel 97-2003)
- `.csv` (Comma Separated Values)

### Q: Quelle est la différence entre les formats SS26 et FW25?

**R:** 
- **FW25** (Fall-Winter 2025): Format classique avec colonnes basiques (code-barres, prix, description)
- **SS26** (Spring-Summer 2026): Format enrichi avec colonnes supplémentaires:
  - Couleurs (`lib._coloris`)
  - Tailles (`taille`)
  - Prix multi-devises (`X300` pour EUR, `X350` pour GBP)

L'application détecte automatiquement le format utilisé et adapte son interface en conséquence.

### Q: Puis-je utiliser des PDF scannés ou des images?

**R:** Non, l'application nécessite des PDF contenant du texte extractible. Les PDF scannés (qui sont essentiellement des images) ne sont pas supportés car le texte ne peut pas être extrait. Solution alternative: utilisez un logiciel OCR pour convertir vos PDF scannés en PDF avec texte.

## Performance et Optimisation

### Q: Comment l'application gère-t-elle les gros fichiers?

**R:** Plusieurs optimisations sont en place:
1. **Traitement par chunks**: Les fichiers sont traités par morceaux pour éviter de bloquer l'interface
2. **Lazy loading**: Les composants sont chargés à la demande
3. **Memoization**: Les calculs coûteux sont mis en cache
4. **Gestion mémoire**: Nettoyage automatique des données temporaires

Pour les très gros fichiers, nous recommandons d'utiliser un ordinateur avec au moins 8GB de RAM.

### Q: Pourquoi l'application ralentit-elle avec beaucoup de résultats?

**R:** L'affichage de milliers de résultats peut ralentir le navigateur. Pour améliorer les performances:
1. Utilisez les filtres pour réduire le nombre de résultats affichés
2. Augmentez la pagination (20 → 50 → 100 éléments par page)
3. Utilisez la vue "Grille" plutôt que "Tableau" pour les grands ensembles de données

Dans une future mise à jour, nous implémenterons la virtualisation des listes pour améliorer les performances avec de grands ensembles de données.

### Q: Comment optimiser le traitement des fichiers?

**R:** Pour des performances optimales:
1. Utilisez des fichiers PDF bien formatés avec texte extractible
2. Nettoyez vos fichiers Excel (supprimez les colonnes inutiles)
3. Fermez les autres onglets et applications gourmandes en mémoire
4. Utilisez un navigateur récent (Chrome ou Firefox de préférence)
5. Activez l'accélération matérielle dans votre navigateur

## Sécurité et Confidentialité

### Q: Les données sont-elles sécurisées?

**R:** Oui, l'application offre un haut niveau de sécurité:
1. **Traitement local**: Toutes les données restent dans votre navigateur
2. **Aucun serveur**: Aucune donnée n'est envoyée à des serveurs externes
3. **Validation stricte**: Les fichiers sont validés avant traitement
4. **Sanitisation**: Les données sont nettoyées pour prévenir les injections
5. **HTTPS**: Communication sécurisée lors du chargement de l'application

### Q: Comment les fichiers sont-ils validés?

**R:** La validation se fait en plusieurs étapes:
1. **Validation MIME type**: Vérification du type de fichier
2. **Validation extension**: Vérification de l'extension du fichier
3. **Validation signature**: Vérification des "magic numbers" (signature binaire)
4. **Validation taille**: Vérification que le fichier respecte les limites
5. **Validation contenu**: Vérification que le contenu est exploitable

### Q: Les données sont-elles conservées après utilisation?

**R:** Par défaut, les données sont conservées uniquement en mémoire pendant la session. Elles sont effacées lorsque vous fermez l'onglet ou rafraîchissez la page.

Optionnellement, l'application peut mettre en cache les résultats de traitement dans IndexedDB pour accélérer les analyses futures des mêmes fichiers. Ce cache peut être effacé à tout moment via les paramètres.

## Intégration et API

### Q: Peut-on intégrer l'application dans un autre système?

**R:** Actuellement, l'application est autonome sans API publique. Cependant, la roadmap prévoit:
1. Une API REST pour l'intégration avec d'autres systèmes
2. Des webhooks pour les notifications d'événements
3. Un SDK JavaScript pour les développeurs

Si vous avez des besoins d'intégration spécifiques, contactez l'équipe technique.

### Q: Est-il possible d'automatiser le processus de vérification?

**R:** L'automatisation complète nécessitera l'API REST prévue dans la roadmap. En attendant, vous pouvez:
1. Utiliser des scripts de navigation (comme Puppeteer ou Playwright) pour automatiser l'interface
2. Utiliser les bibliothèques sous-jacentes (PDF.js, XLSX) directement dans vos propres scripts

### Q: Comment exporter les données vers d'autres systèmes?

**R:** L'application propose actuellement:
1. Export Excel complet avec plusieurs feuilles
2. Export PDF avec rapport détaillé
3. Copie des codes-barres individuels ou en masse

Pour des intégrations plus avancées, attendez la future API ou contactez l'équipe technique pour des solutions personnalisées.

## Dépannage

### Q: L'application ne trouve aucun code-barres dans mon PDF. Que faire?

**R:** Vérifiez les points suivants:
1. **Format du PDF**: Assurez-vous que le PDF contient du texte extractible (pas une image)
   - Test: Essayez de sélectionner et copier du texte dans le PDF
   - Solution: Utilisez un logiciel OCR pour convertir le PDF scanné en texte

2. **Format des codes-barres**: Vérifiez que vos codes-barres suivent le format OXBOW
   - Format attendu: 3605168XXXXXX (13 chiffres)
   - Solution: Vérifiez quelques codes manuellement

3. **Encodage**: Problèmes d'encodage de caractères
   - Solution: Réenregistrez le PDF avec un encodage standard

4. **Mode Debug**: Activez le mode debug pour plus d'informations
   ```javascript
   // Dans la console du navigateur
   localStorage.setItem('oxbow-debug', 'true');
   // Rechargez la page
   ```

### Q: L'application ne détecte pas correctement les colonnes Excel. Comment résoudre?

**R:** Essayez ces solutions:
1. **Vérifiez les noms de colonnes**: Assurez-vous qu'ils correspondent aux noms attendus
   - SS26: `Gencod`, `Code_article`, `Fournisseur`, `X300`, `X350`, `lib._coloris`, `Taille`
   - FW25: `code-barres`, `Code article`, `Supplier`, `RETAIL PRICE`

2. **Première ligne**: Assurez-vous que la première ligne contient les en-têtes

3. **Format du fichier**: Essayez de réenregistrer en .xlsx pur

4. **Mode Debug**: Activez-le pour voir quelles colonnes sont détectées et avec quelle confiance

5. **Solution manuelle**: Renommez vos colonnes pour correspondre exactement aux noms attendus

### Q: L'application plante avec des fichiers volumineux. Comment résoudre?

**R:** Pour les fichiers volumineux:
1. **Divisez les fichiers**: Traitez-les en plusieurs parties plus petites
2. **Fermez les autres applications**: Libérez de la mémoire
3. **Utilisez un navigateur récent**: Chrome ou Firefox récent
4. **Augmentez la mémoire virtuelle**: Sur Windows, augmentez le fichier d'échange
5. **Utilisez un ordinateur plus puissant**: Idéalement avec 16GB+ de RAM

### Q: Les graphiques ne s'affichent pas correctement. Que faire?

**R:** Problèmes courants avec les graphiques:
1. **Navigateur obsolète**: Mettez à jour votre navigateur
2. **Accélération matérielle**: Activez-la dans les paramètres du navigateur
3. **Extensions bloquantes**: Désactivez temporairement les bloqueurs de contenu
4. **Cache corrompu**: Videz le cache du navigateur
5. **Conflit JavaScript**: Essayez en mode navigation privée

---

Si vous ne trouvez pas la réponse à votre question, contactez le support technique à support-tech@oxbow.com ou consultez la [documentation complète](../README.md).