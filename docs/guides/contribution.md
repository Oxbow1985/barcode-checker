# Guide de Contribution - Oxbow Barcode Checker

Ce guide est destiné aux développeurs souhaitant contribuer au projet Oxbow Barcode Checker. Il détaille les procédures, standards et bonnes pratiques à suivre.

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- npm 8+
- Git

### Installation
```bash
# Cloner le repository
git clone https://github.com/Oxbow1985/barcode-checker.git
cd barcode-checker

# Installer les dépendances
npm install

# Démarrer en mode développement
npm run dev
```

## 📋 Structure du Projet

```
src/
├── components/       # Composants UI réutilisables
├── contexts/         # Gestion d'état globale
├── pages/            # Pages principales
├── types/            # Définitions TypeScript
├── utils/            # Utilitaires et logique métier
├── App.tsx           # Composant racine
└── main.tsx          # Point d'entrée
```

## 🔧 Workflow de Développement

### Branches
- `main` - Code de production stable
- `develop` - Branche de développement principale
- `feature/nom-feature` - Nouvelles fonctionnalités
- `bugfix/nom-bug` - Corrections de bugs
- `release/x.y.z` - Préparation release

### Commits
Suivez le format Conventional Commits:
```
type(scope): description concise

Corps du commit plus détaillé si nécessaire.
```

Types:
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage (pas de changement de code)
- `refactor`: Refactoring
- `perf`: Optimisation performance
- `test`: Tests
- `chore`: Tâches de maintenance

### Pull Requests
1. Créez une branche depuis `develop`
2. Développez votre fonctionnalité/correction
3. Assurez-vous que les tests passent
4. Créez une PR vers `develop`
5. Attendez la review et l'approbation

## 🧪 Tests

```bash
# Lancer les tests
npm run test

# Tests avec couverture
npm run test:coverage

# Tests d'un fichier spécifique
npm run test -- src/utils/pdfProcessor.test.ts
```

## 🎨 Standards de Code

### Linting
```bash
# Vérifier le code
npm run lint

# Corriger automatiquement
npm run lint:fix
```

### TypeScript
- Utilisez des types stricts
- Évitez `any` autant que possible
- Documentez les interfaces complexes

### React
- Utilisez des composants fonctionnels
- Préférez les hooks aux classes
- Utilisez `useMemo` et `useCallback` pour les optimisations

### CSS/Tailwind
- Suivez la convention BEM pour les classes personnalisées
- Utilisez les classes utilitaires Tailwind quand possible
- Évitez les styles inline

## 📝 Documentation

### JSDoc
Documentez les fonctions complexes avec JSDoc:

```typescript
/**
 * Compare les codes-barres PDF avec les données Excel
 * 
 * @param pdfBarcodes - Codes-barres extraits du PDF
 * @param excelBarcodes - Codes-barres extraits de l'Excel
 * @returns Résultats de la comparaison
 */
function compareData(
  pdfBarcodes: BarcodeData[], 
  excelBarcodes: BarcodeData[]
): ComparisonResult[] {
  // ...
}
```

### Commentaires
- Commentez le "pourquoi", pas le "quoi"
- Utilisez des commentaires pour expliquer la logique complexe
- Maintenez les commentaires à jour avec le code

## 🚀 Déploiement

### Environnements
- `development` - Local
- `staging` - Tests avant production
- `production` - Environnement live

### Process de Release
1. Merge des features dans `develop`
2. Création branche `release/x.y.z`
3. Tests et corrections sur la release
4. Merge dans `main` et tag
5. Déploiement automatique

## 🐛 Rapporter des Bugs

Utilisez le template d'issue pour rapporter un bug:

```
## Description
Description claire et concise du bug.

## Étapes pour reproduire
1. Aller à '...'
2. Cliquer sur '....'
3. Défiler jusqu'à '....'
4. Voir l'erreur

## Comportement attendu
Description de ce qui devrait se passer.

## Captures d'écran
Si applicable, ajoutez des captures d'écran.

## Environnement
 - OS: [ex: Windows 10]
 - Navigateur: [ex: Chrome 90]
 - Version: [ex: 2.0.1]

## Informations supplémentaires
Tout autre contexte sur le problème.
```

## 🎯 Proposer des Fonctionnalités

Utilisez le template d'issue pour proposer une fonctionnalité:

```
## Description
Description claire et concise de la fonctionnalité.

## Problème résolu
Expliquez quel problème cette fonctionnalité résout.

## Solution proposée
Description de la solution que vous envisagez.

## Alternatives considérées
Autres solutions que vous avez envisagées.

## Informations supplémentaires
Contexte, maquettes, etc.
```

## 📚 Ressources

- [Documentation Technique Complète](../README.md)
- [Guide d'Utilisation](../04-guide-utilisation.md)
- [Architecture Technique](../05-architecture-technique.md)
- [Roadmap](../09-roadmap-ameliorations.md)

## 📞 Contact

- **Équipe Technique**: tech@oxbow.com
- **Slack**: #oxbow-barcode-checker
- **Réunions**: Stand-up quotidien à 10h

---

Merci de contribuer au projet Oxbow Barcode Checker! 🙏