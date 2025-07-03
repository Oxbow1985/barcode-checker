# 7. Déploiement et Configuration

## 7.1 Instructions de Build et Déploiement

### Build Local de Développement

#### Configuration de l'Environnement
```bash
# Prérequis système
node --version    # v18.0.0+ requis
npm --version     # 8.0.0+ requis

# Variables d'environnement optionnelles
echo "VITE_DEBUG_MODE=true" > .env.local
echo "VITE_LOG_LEVEL=debug" >> .env.local
echo "VITE_ENABLE_PERFORMANCE_MONITOR=true" >> .env.local
```

#### Installation et Démarrage
```bash
# 1. Installation des dépendances
npm install

# 2. Vérification de la configuration
npm run lint

# 3. Démarrage du serveur de développement
npm run dev

# 4. Ouverture automatique du navigateur
# http://localhost:5173
```

#### Scripts de Développement Disponibles
```json
{
  "scripts": {
    "dev": "vite",                    // Serveur de développement
    "build": "vite build",            // Build de production
    "preview": "vite preview",        // Preview du build
    "lint": "eslint .",              // Vérification code
    "lint:fix": "eslint . --fix",    // Correction automatique
    "type-check": "tsc --noEmit"     // Vérification types
  }
}
```

### Build de Production

#### Compilation Optimisée
```bash
# Build complet avec optimisations
npm run build

# Vérification du build
npm run preview

# Analyse de la taille du bundle
npx vite-bundle-analyzer dist
```

#### Structure du Build Généré
```
dist/
├── index.html                    # Point d'entrée principal
├── assets/
│   ├── index-[hash].js          # Bundle principal (React + App)
│   ├── vendor-[hash].js         # Librairies tierces (React, etc.)
│   ├── charts-[hash].js         # Composants graphiques (Chart.js)
│   ├── utils-[hash].js          # Utilitaires (PDF.js, XLSX)
│   ├── index-[hash].css         # Styles compilés Tailwind
│   └── workbox-[hash].js        # Service Worker PWA
├── manifest.json                # Manifest PWA
├── pwa-192x192.png             # Icônes PWA
├── pwa-512x512.png
└── sw.js                       # Service Worker principal
```

#### Optimisations Automatiques
```typescript
// vite.config.ts - Configuration optimisée
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],           // Framework (stable)
          charts: ['chart.js', 'react-chartjs-2'], // Graphiques (optionnel)
          utils: ['xlsx', 'jspdf', 'pdfjs-dist']   // Utilitaires (gros)
        }
      }
    },
    // Optimisations de production
    minify: 'terser',              // Minification avancée
    sourcemap: false,              // Pas de sourcemaps en prod
    chunkSizeWarningLimit: 1000,   // Limite taille chunks
    assetsInlineLimit: 4096        // Inline assets < 4KB
  },
  
  // Optimisations des dépendances
  optimizeDeps: {
    exclude: ['lucide-react'],     // Exclusion pour tree-shaking
    include: ['react', 'react-dom'] // Pré-bundling explicite
  }
});
```

### Métriques de Performance du Build

#### Tailles Typiques (Gzipped)
```
📊 Analyse du Bundle de Production:

├── index.html                 ~2 KB
├── vendor-[hash].js          ~45 KB   (React + React-DOM)
├── index-[hash].js           ~35 KB   (Code application)
├── charts-[hash].js          ~25 KB   (Chart.js + composants)
├── utils-[hash].js           ~180 KB  (PDF.js + XLSX)
├── index-[hash].css          ~8 KB    (Tailwind optimisé)
└── Service Worker            ~15 KB   (Cache + PWA)

Total Initial Load:           ~95 KB   (vendor + index + css)
Total avec Lazy Loading:      ~310 KB  (tous les chunks)

🎯 Objectifs Performance:
✅ First Contentful Paint:    < 1.5s
✅ Largest Contentful Paint:  < 2.5s
✅ Time to Interactive:       < 3.5s
✅ Cumulative Layout Shift:   < 0.1
```

## 7.2 Déploiement sur Différentes Plateformes

### Netlify (Recommandé)

#### Configuration Automatique
```bash
# 1. Connexion du repository Git
# Netlify détecte automatiquement Vite

# 2. Configuration build (automatique)
Build command: npm run build
Publish directory: dist
Node version: 18

# 3. Variables d'environnement (optionnelles)
VITE_APP_VERSION=2.0.0
VITE_BUILD_DATE=$(date)
VITE_ENVIRONMENT=production
```

#### Fichier de Configuration Netlify
```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "8"

# Redirections pour SPA
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Headers de sécurité
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Cache des assets
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

#### Déploiement Manuel
```bash
# Installation Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Déploiement
netlify deploy --prod --dir=dist
```

### Vercel

#### Configuration Vercel
```json
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

#### Déploiement Vercel
```bash
# Installation Vercel CLI
npm install -g vercel

# Déploiement
vercel --prod
```

### GitHub Pages

#### Configuration GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

#### Configuration Base Path
```typescript
// vite.config.ts - Pour GitHub Pages
export default defineConfig({
  base: '/oxbow-barcode-checker/', // Nom du repository
  // ... reste de la configuration
});
```

### Docker (Auto-hébergement)

#### Dockerfile Multi-stage
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./
RUN npm ci --only=production

# Copie du code source
COPY . .

# Build de production
RUN npm run build

# Stage de production avec Nginx
FROM nginx:alpine

# Copie du build
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuration Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Exposition du port
EXPOSE 80

# Démarrage Nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### Configuration Nginx
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    sendfile        on;
    keepalive_timeout  65;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    server {
        listen       80;
        server_name  localhost;
        
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        
        # Gestion SPA
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # Cache des assets
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Headers de sécurité
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # Gestion des erreurs
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   /usr/share/nginx/html;
        }
    }
}
```

#### Commandes Docker
```bash
# Build de l'image
docker build -t oxbow-barcode-checker .

# Lancement du conteneur
docker run -d -p 80:80 --name oxbow-app oxbow-barcode-checker

# Avec docker-compose
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
```

## 7.3 Variables d'Environnement

### Variables de Build

#### Fichier .env.production
```bash
# .env.production
VITE_APP_NAME="Oxbow Barcode Checker"
VITE_APP_VERSION="2.0.0"
VITE_BUILD_DATE="2024-01-15"
VITE_ENVIRONMENT="production"

# Analytics (optionnel)
VITE_ANALYTICS_ID="GA-XXXXXXXXX"
VITE_SENTRY_DSN="https://xxx@sentry.io/xxx"

# API (si nécessaire)
VITE_API_BASE_URL="https://api.oxbow.com"

# Features flags
VITE_ENABLE_DEBUG_MODE="false"
VITE_ENABLE_PERFORMANCE_MONITOR="false"
VITE_ENABLE_EXPERIMENTAL_FEATURES="false"
```

#### Utilisation dans le Code
```typescript
// src/config/environment.ts
export const config = {
  // Informations application
  appName: import.meta.env.VITE_APP_NAME || 'Oxbow Barcode Checker',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  buildDate: import.meta.env.VITE_BUILD_DATE || new Date().toISOString(),
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  
  // Features flags
  enableDebugMode: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true' || import.meta.env.DEV,
  enableAnalytics: !!import.meta.env.VITE_ANALYTICS_ID,
  enablePerformanceMonitor: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITOR === 'true',
  
  // Limites techniques
  maxPdfSize: 50 * 1024 * 1024,  // 50MB
  maxExcelSize: 20 * 1024 * 1024, // 20MB
  
  // URLs externes
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  analyticsId: import.meta.env.VITE_ANALYTICS_ID,
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  
  // Validation
  isProduction: import.meta.env.VITE_ENVIRONMENT === 'production',
  isDevelopment: import.meta.env.DEV,
  isStaging: import.meta.env.VITE_ENVIRONMENT === 'staging'
};

// Validation de la configuration
if (config.isProduction && !config.version) {
  console.warn('⚠️ Version non définie en production');
}

if (config.enableAnalytics && !config.analyticsId) {
  console.warn('⚠️ Analytics activé mais ID manquant');
}
```

### Configuration par Environnement

#### Développement (.env.development)
```bash
VITE_ENVIRONMENT="development"
VITE_DEBUG_MODE="true"
VITE_LOG_LEVEL="debug"
VITE_ENABLE_PERFORMANCE_MONITOR="true"

# Features de développement
VITE_ENABLE_MOCK_DATA="true"
VITE_ENABLE_HOT_RELOAD="true"
VITE_ENABLE_DEVTOOLS="true"

# URLs de développement
VITE_API_BASE_URL="http://localhost:3001"
```

#### Staging (.env.staging)
```bash
VITE_ENVIRONMENT="staging"
VITE_DEBUG_MODE="false"
VITE_LOG_LEVEL="info"
VITE_ENABLE_PERFORMANCE_MONITOR="true"

# URLs de staging
VITE_API_BASE_URL="https://staging-api.oxbow.com"

# Analytics de test
VITE_ANALYTICS_ID="GA-STAGING-ID"
VITE_SENTRY_DSN="https://staging@sentry.io/xxx"
```

#### Production (.env.production)
```bash
VITE_ENVIRONMENT="production"
VITE_DEBUG_MODE="false"
VITE_LOG_LEVEL="error"
VITE_ENABLE_PERFORMANCE_MONITOR="false"

# URLs de production
VITE_API_BASE_URL="https://api.oxbow.com"

# Analytics production
VITE_ANALYTICS_ID="GA-PRODUCTION-ID"
VITE_SENTRY_DSN="https://production@sentry.io/xxx"

# Sécurité
VITE_ENABLE_SOURCE_MAPS="false"
VITE_ENABLE_CONSOLE_LOGS="false"
```

### Gestion Sécurisée des Variables

#### Variables Publiques vs Privées
```typescript
// ✅ Variables publiques (préfixe VITE_)
// Accessibles côté client, incluses dans le bundle
const publicConfig = {
  appName: import.meta.env.VITE_APP_NAME,
  version: import.meta.env.VITE_APP_VERSION,
  apiUrl: import.meta.env.VITE_API_BASE_URL
};

// ❌ Variables privées (sans préfixe VITE_)
// Non accessibles côté client, pour le build uniquement
const privateConfig = {
  // Ces variables ne seront PAS disponibles dans le navigateur
  secretKey: import.meta.env.SECRET_KEY,        // undefined
  dbPassword: import.meta.env.DB_PASSWORD       // undefined
};
```

#### Validation des Variables Critiques
```typescript
// src/config/validation.ts
function validateEnvironment() {
  const required = [
    'VITE_APP_NAME',
    'VITE_APP_VERSION',
    'VITE_ENVIRONMENT'
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Variables d'environnement manquantes: ${missing.join(', ')}`);
  }
  
  // Validation des valeurs
  const env = import.meta.env.VITE_ENVIRONMENT;
  const validEnvs = ['development', 'staging', 'production'];
  
  if (!validEnvs.includes(env)) {
    throw new Error(`Environnement invalide: ${env}. Valeurs acceptées: ${validEnvs.join(', ')}`);
  }
  
  console.log(`✅ Configuration validée pour l'environnement: ${env}`);
}

// Validation au démarrage
validateEnvironment();
```

## 7.4 Configuration des Différents Environnements

### Configuration Nginx pour Production

#### Configuration Complète
```nginx
# /etc/nginx/sites-available/oxbow-barcode
server {
    listen 80;
    listen [::]:80;
    server_name oxbow-barcode.com www.oxbow-barcode.com;
    
    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name oxbow-barcode.com www.oxbow-barcode.com;
    
    # Certificats SSL
    ssl_certificate /etc/letsencrypt/live/oxbow-barcode.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/oxbow-barcode.com/privkey.pem;
    
    # Configuration SSL moderne
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Racine du site
    root /var/www/oxbow-barcode/dist;
    index index.html;
    
    # Gestion SPA (Single Page Application)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache agressif pour les assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
        
        # Compression
        gzip_static on;
        brotli_static on;
    }
    
    # Cache pour les fichiers statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 6M;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
    }
    
    # Pas de cache pour index.html
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
    }
    
    # Headers de sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:;" always;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        application/xml
        image/svg+xml;
    
    # Logs
    access_log /var/log/nginx/oxbow-barcode.access.log;
    error_log /var/log/nginx/oxbow-barcode.error.log;
    
    # Gestion des erreurs
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

### Configuration Apache (Alternative)

#### VirtualHost Apache
```apache
# /etc/apache2/sites-available/oxbow-barcode.conf
<VirtualHost *:80>
    ServerName oxbow-barcode.com
    ServerAlias www.oxbow-barcode.com
    
    # Redirection HTTPS
    Redirect permanent / https://oxbow-barcode.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName oxbow-barcode.com
    ServerAlias www.oxbow-barcode.com
    
    DocumentRoot /var/www/oxbow-barcode/dist
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/oxbow-barcode.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/oxbow-barcode.com/privkey.pem
    
    # Headers de sécurité
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Gestion SPA
    <Directory "/var/www/oxbow-barcode/dist">
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Réécriture pour SPA
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Cache pour assets
    <LocationMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
        Header append Cache-Control "public, immutable"
    </LocationMatch>
    
    # Pas de cache pour index.html
    <LocationMatch "^/index\.html$">
        ExpiresActive On
        ExpiresDefault "access plus 0 seconds"
        Header set Cache-Control "no-cache, no-store, must-revalidate"
        Header set Pragma "no-cache"
    </LocationMatch>
    
    # Compression
    LoadModule deflate_module modules/mod_deflate.so
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \
            \.(?:gif|jpe?g|png)$ no-gzip dont-vary
        SetEnvIfNoCase Request_URI \
            \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    </Location>
    
    # Logs
    ErrorLog ${APACHE_LOG_DIR}/oxbow-barcode_error.log
    CustomLog ${APACHE_LOG_DIR}/oxbow-barcode_access.log combined
</VirtualHost>
```

### Monitoring et Logs

#### Configuration de Monitoring
```bash
# Installation de outils de monitoring
sudo apt install htop iotop nethogs

# Monitoring des logs en temps réel
sudo tail -f /var/log/nginx/oxbow-barcode.access.log
sudo tail -f /var/log/nginx/oxbow-barcode.error.log

# Analyse des performances
sudo nginx -t                    # Test configuration
sudo systemctl reload nginx     # Rechargement sans interruption
```

#### Script de Déploiement Automatisé
```bash
#!/bin/bash
# deploy.sh - Script de déploiement automatisé

set -e

echo "🚀 Déploiement Oxbow Barcode Checker"

# Variables
REPO_URL="https://github.com/oxbow/barcode-checker.git"
DEPLOY_DIR="/var/www/oxbow-barcode"
BACKUP_DIR="/var/backups/oxbow-barcode"
NGINX_CONFIG="/etc/nginx/sites-available/oxbow-barcode"

# Backup de l'ancienne version
echo "📦 Sauvegarde de l'ancienne version..."
if [ -d "$DEPLOY_DIR" ]; then
    sudo cp -r "$DEPLOY_DIR" "$BACKUP_DIR/$(date +%Y%m%d_%H%M%S)"
fi

# Clone du repository
echo "📥 Téléchargement du code..."
git clone "$REPO_URL" /tmp/oxbow-barcode-new

# Build de production
echo "🔨 Build de production..."
cd /tmp/oxbow-barcode-new
npm ci --only=production
npm run build

# Déploiement
echo "🚀 Déploiement..."
sudo rm -rf "$DEPLOY_DIR"
sudo mv /tmp/oxbow-barcode-new/dist "$DEPLOY_DIR"
sudo chown -R www-data:www-data "$DEPLOY_DIR"
sudo chmod -R 755 "$DEPLOY_DIR"

# Test de la configuration Nginx
echo "🔧 Vérification Nginx..."
sudo nginx -t

# Rechargement Nginx
echo "🔄 Rechargement Nginx..."
sudo systemctl reload nginx

# Nettoyage
rm -rf /tmp/oxbow-barcode-new

echo "✅ Déploiement terminé avec succès!"
echo "🌐 Site disponible sur: https://oxbow-barcode.com"

# Test de santé
echo "🏥 Test de santé..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://oxbow-barcode.com)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Site accessible (HTTP $HTTP_STATUS)"
else
    echo "❌ Problème détecté (HTTP $HTTP_STATUS)"
    exit 1
fi
```

### Certificats SSL avec Let's Encrypt

#### Installation et Configuration
```bash
# Installation Certbot
sudo apt install certbot python3-certbot-nginx

# Obtention du certificat
sudo certbot --nginx -d oxbow-barcode.com -d www.oxbow-barcode.com

# Renouvellement automatique
sudo crontab -e
# Ajouter cette ligne:
0 12 * * * /usr/bin/certbot renew --quiet

# Test du renouvellement
sudo certbot renew --dry-run
```

---

**Prochaine section :** [Sécurité et Bonnes Pratiques](./08-securite-bonnes-pratiques.md)