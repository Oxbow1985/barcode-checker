# Guide de Déploiement - Oxbow Barcode Checker

Ce guide détaille les procédures de déploiement de l'application Oxbow Barcode Checker dans différents environnements.

## 📋 Prérequis

### Environnement
- Node.js 18+
- npm 8+
- Accès aux plateformes de déploiement (Netlify, Vercel, etc.)
- Accès Git au repository

### Fichiers de Configuration
- `.env.production` - Variables d'environnement production
- `.env.staging` - Variables d'environnement staging
- `netlify.toml` ou `vercel.json` - Configuration déploiement

## 🚀 Déploiement Automatisé (Recommandé)

### Netlify

#### Configuration Initiale
1. Connectez votre repository GitHub à Netlify
2. Configurez les paramètres de build:
   ```
   Build command: npm run build
   Publish directory: dist
   Node version: 18
   ```
3. Configurez les variables d'environnement:
   ```
   VITE_APP_VERSION=2.0.0
   VITE_ENVIRONMENT=production
   ```

#### Déploiement Continu
- Chaque push sur `main` déclenche un déploiement automatique
- Les PR créent des déploiements de preview

#### Déploiement Manuel
```bash
# Installation Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Déploiement
npm run build
netlify deploy --prod --dir=dist
```

### Vercel

#### Configuration Initiale
1. Importez votre repository dans Vercel
2. Configurez le projet:
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm ci
   ```
3. Ajoutez les variables d'environnement

#### Déploiement Continu
- Automatique sur push vers `main`
- Environnements de preview pour chaque PR

#### Déploiement Manuel
```bash
# Installation Vercel CLI
npm install -g vercel

# Login
vercel login

# Déploiement
vercel --prod
```

## 🔧 Déploiement Manuel

### Build Local
```bash
# Installation dépendances
npm ci

# Build production
npm run build

# Vérification
npm run preview
```

### Serveur Web (Nginx)

#### Configuration Nginx
```nginx
server {
    listen 80;
    server_name oxbow-barcode.com;
    
    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name oxbow-barcode.com;
    
    # Certificats SSL
    ssl_certificate /etc/letsencrypt/live/oxbow-barcode.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/oxbow-barcode.com/privkey.pem;
    
    # Racine du site
    root /var/www/oxbow-barcode/dist;
    index index.html;
    
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
}
```

#### Déploiement
```bash
# Build
npm run build

# Copie des fichiers
sudo mkdir -p /var/www/oxbow-barcode
sudo cp -r dist/* /var/www/oxbow-barcode/

# Permissions
sudo chown -R www-data:www-data /var/www/oxbow-barcode
sudo chmod -R 755 /var/www/oxbow-barcode

# Activation site
sudo ln -s /etc/nginx/sites-available/oxbow-barcode /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Docker

#### Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Déploiement
```bash
# Build image
docker build -t oxbow-barcode-checker .

# Run container
docker run -d -p 80:80 --name oxbow-app oxbow-barcode-checker

# Avec docker-compose
docker-compose up -d
```

## 📊 Environnements Multiples

### Configuration par Environnement

#### Production
```bash
# .env.production
VITE_APP_NAME="Oxbow Barcode Checker"
VITE_APP_VERSION="2.0.0"
VITE_ENVIRONMENT="production"
VITE_ANALYTICS_ID="GA-PRODUCTION-ID"
```

#### Staging
```bash
# .env.staging
VITE_APP_NAME="Oxbow Barcode Checker (Staging)"
VITE_APP_VERSION="2.0.0-beta"
VITE_ENVIRONMENT="staging"
VITE_ANALYTICS_ID="GA-STAGING-ID"
```

#### Développement
```bash
# .env.development
VITE_APP_NAME="Oxbow Barcode Checker (Dev)"
VITE_APP_VERSION="dev"
VITE_ENVIRONMENT="development"
VITE_DEBUG_MODE="true"
```

### Build Spécifique à l'Environnement
```bash
# Production
npm run build

# Staging
npm run build:staging

# Développement
npm run dev
```

## 🔒 Sécurité

### Headers de Sécurité
```nginx
# Nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self';" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()" always;
```

### HTTPS
```bash
# Obtention certificat Let's Encrypt
sudo certbot --nginx -d oxbow-barcode.com -d www.oxbow-barcode.com

# Renouvellement automatique
sudo certbot renew --dry-run
```

## 📈 Monitoring

### Vérification Santé
```bash
#!/bin/bash
# health-check.sh

URL="https://oxbow-barcode.com"
EXPECTED_STATUS=200

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $HTTP_STATUS -eq $EXPECTED_STATUS ]; then
    echo "✅ Site accessible (HTTP $HTTP_STATUS)"
    exit 0
else
    echo "❌ Problème détecté (HTTP $HTTP_STATUS)"
    exit 1
fi
```

### Logs
```bash
# Logs Nginx
sudo tail -f /var/log/nginx/oxbow-barcode.access.log
sudo tail -f /var/log/nginx/oxbow-barcode.error.log

# Logs Docker
docker logs -f oxbow-app
```

## 🔄 Rollback

### Netlify/Vercel
```bash
# Rollback via interface web
# OU
# Rollback via CLI
netlify deploy --prod --dir=dist --site-id=your-site-id --message="Rollback to v2.0.0"
```

### Serveur Web
```bash
# Restauration depuis backup
sudo cp -r /var/backups/oxbow-barcode/20240115_120000/* /var/www/oxbow-barcode/
sudo systemctl reload nginx
```

### Docker
```bash
# Rollback à version précédente
docker stop oxbow-app
docker rm oxbow-app
docker run -d -p 80:80 --name oxbow-app oxbow-barcode-checker:2.0.0
```

## 📝 Checklist de Déploiement

### Avant Déploiement
- [ ] Tous les tests passent
- [ ] Build local réussi
- [ ] Variables d'environnement configurées
- [ ] Vérification des dépendances
- [ ] Revue de code complétée

### Pendant Déploiement
- [ ] Surveillance des logs
- [ ] Vérification du build
- [ ] Tests de smoke

### Après Déploiement
- [ ] Vérification fonctionnelle
- [ ] Vérification performance
- [ ] Monitoring en place
- [ ] Documentation mise à jour

## 🚨 Gestion des Incidents

### Procédure d'Urgence
1. **Identification** - Confirmer et qualifier l'incident
2. **Communication** - Alerter l'équipe concernée
3. **Mitigation** - Appliquer solution temporaire si possible
4. **Rollback** - Revenir à la version stable si nécessaire
5. **Résolution** - Corriger le problème
6. **Post-mortem** - Analyser les causes et prévenir la récurrence

### Contacts d'Urgence
- **Responsable Technique**: tech-lead@oxbow.com
- **Responsable Déploiement**: devops@oxbow.com
- **Support Niveau 2**: support-n2@oxbow.com

## 📚 Ressources

- [Documentation Vite](https://vitejs.dev/guide/build.html)
- [Documentation Netlify](https://docs.netlify.com/)
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Nginx](https://nginx.org/en/docs/)
- [Documentation Docker](https://docs.docker.com/)

---

Pour toute question ou assistance, contactez l'équipe DevOps à devops@oxbow.com.