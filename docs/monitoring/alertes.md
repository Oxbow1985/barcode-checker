# Monitoring et Alertes - Oxbow Barcode Checker

Ce document détaille le système de monitoring et d'alertes mis en place pour l'application Oxbow Barcode Checker.

## 📊 Système de Monitoring

### Métriques Surveillées

#### Performance Application
| Métrique | Seuil Alerte | Seuil Critique | Fréquence |
|----------|--------------|----------------|-----------|
| Temps Chargement | > 3s | > 5s | Toutes les 5 min |
| Temps Traitement PDF | > 15s | > 30s | Par utilisation |
| Temps Traitement Excel | > 10s | > 20s | Par utilisation |
| Utilisation Mémoire | > 70% | > 85% | Continu |
| Erreurs JavaScript | > 5/heure | > 20/heure | Horaire |

#### Disponibilité
| Métrique | Seuil Alerte | Seuil Critique | Fréquence |
|----------|--------------|----------------|-----------|
| Uptime | < 99.5% | < 99% | Journalier |
| Temps Réponse API | > 500ms | > 1000ms | Toutes les 5 min |
| Erreurs HTTP | > 1% | > 5% | Horaire |
| Certificat SSL | < 14 jours | < 7 jours | Journalier |

#### Utilisation
| Métrique | Seuil Alerte | Seuil Critique | Fréquence |
|----------|--------------|----------------|-----------|
| Utilisateurs Actifs | > 100 | > 200 | Horaire |
| Taux d'Erreur Utilisateur | > 5% | > 10% | Horaire |
| Taille Fichiers | > 30MB | > 45MB | Par utilisation |
| Temps Session | > 30min | > 1h | Par session |

### Outils de Monitoring

#### Frontend Monitoring
```typescript
// src/utils/monitoring.ts
export class FrontendMonitor {
  private metrics: Record<string, any> = {};
  private errors: any[] = [];
  private config: MonitoringConfig;
  
  constructor(config: MonitoringConfig) {
    this.config = config;
    this.setupErrorTracking();
    this.setupPerformanceTracking();
  }
  
  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'uncaught',
        message: event.message,
        stack: event.error?.stack,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: new Date().toISOString()
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
    });
  }
  
  private setupPerformanceTracking(): void {
    // Web Vitals
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcp = entries[entries.length - 1];
      this.captureMetric('FCP', fcp.startTime);
    });
    fcpObserver.observe({ type: 'paint', buffered: true });
    
    // Mémoire
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.captureMetric('memory', {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        });
      }, 10000);
    }
  }
  
  captureMetric(name: string, value: any): void {
    this.metrics[name] = value;
    
    // Vérifier seuils d'alerte
    this.checkThresholds(name, value);
    
    // Envoi périodique
    this.scheduleMetricsSend();
  }
  
  captureError(error: any): void {
    this.errors.push(error);
    
    // Alerte immédiate pour erreurs critiques
    if (this.isCriticalError(error)) {
      this.sendAlertImmediately('critical_error', error);
    }
    
    // Envoi périodique
    this.scheduleErrorsSend();
  }
  
  private checkThresholds(name: string, value: any): void {
    const threshold = this.config.thresholds[name];
    if (!threshold) return;
    
    if (typeof value === 'number') {
      if (threshold.critical && value > threshold.critical) {
        this.sendAlert('critical', name, value, threshold.critical);
      } else if (threshold.warning && value > threshold.warning) {
        this.sendAlert('warning', name, value, threshold.warning);
      }
    }
  }
  
  private isCriticalError(error: any): boolean {
    // Logique pour déterminer si une erreur est critique
    return error.type === 'uncaught' || 
           error.message?.includes('memory') ||
           error.message?.includes('crash');
  }
  
  private sendAlert(level: 'warning' | 'critical', name: string, value: any, threshold: any): void {
    if (!this.config.alertEndpoint) return;
    
    fetch(this.config.alertEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        name,
        value,
        threshold,
        timestamp: new Date().toISOString(),
        app: this.config.appName,
        environment: this.config.environment,
        user: this.getUserInfo()
      })
    }).catch(err => console.error('Failed to send alert:', err));
  }
  
  private sendAlertImmediately(type: string, data: any): void {
    // Envoi immédiat pour alertes critiques
    // ...
  }
  
  private scheduleMetricsSend(): void {
    // Envoi groupé des métriques
    // ...
  }
  
  private scheduleErrorsSend(): void {
    // Envoi groupé des erreurs
    // ...
  }
  
  private getUserInfo(): any {
    // Informations utilisateur anonymisées
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      sessionId: this.getSessionId()
    };
  }
  
  private getSessionId(): string {
    // Génération/récupération ID session
    // ...
    return sessionId;
  }
}
```

#### Serveur Monitoring (Optionnel)
```javascript
// server/monitoring.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Slack = require('@slack/webhook');

// Configuration
const config = {
  email: {
    enabled: true,
    recipients: ['alerts@oxbow.com', 'tech@oxbow.com'],
    // ...
  },
  slack: {
    enabled: true,
    webhook: process.env.SLACK_WEBHOOK_URL,
    channel: '#oxbow-alerts'
  },
  thresholds: {
    // Seuils configurables
  }
};

// Endpoint pour alertes
router.post('/alert', async (req, res) => {
  const { level, name, value, threshold, timestamp, app, environment, user } = req.body;
  
  // Enregistrement en base
  await saveAlert({
    level,
    name,
    value,
    threshold,
    timestamp,
    app,
    environment,
    user
  });
  
  // Notification selon niveau
  if (level === 'critical') {
    await sendCriticalAlert({
      subject: `[CRITIQUE] ${app} - ${name}`,
      message: `Alerte critique sur ${app} (${environment}): ${name} = ${value} (seuil: ${threshold})`,
      details: req.body
    });
  } else if (level === 'warning') {
    await sendWarningAlert({
      subject: `[ALERTE] ${app} - ${name}`,
      message: `Alerte sur ${app} (${environment}): ${name} = ${value} (seuil: ${threshold})`,
      details: req.body
    });
  }
  
  res.status(200).json({ status: 'received' });
});

// Fonctions de notification
async function sendCriticalAlert({ subject, message, details }) {
  // Email
  if (config.email.enabled) {
    await sendEmail({
      to: config.email.recipients,
      subject,
      html: `
        <h2 style="color: #ef4444;">${subject}</h2>
        <p>${message}</p>
        <pre>${JSON.stringify(details, null, 2)}</pre>
      `
    });
  }
  
  // Slack
  if (config.slack.enabled) {
    const slack = new Slack.IncomingWebhook(config.slack.webhook);
    await slack.send({
      channel: config.slack.channel,
      attachments: [{
        color: '#ef4444',
        title: subject,
        text: message,
        fields: Object.entries(details).map(([key, value]) => ({
          title: key,
          value: typeof value === 'object' ? JSON.stringify(value) : value,
          short: false
        }))
      }]
    });
  }
}

// Autres fonctions...

module.exports = router;
```

## 🚨 Système d'Alertes

### Canaux de Notification

#### Email
```javascript
// Exemple de configuration email
const emailConfig = {
  service: 'smtp',
  host: 'smtp.oxbow.com',
  port: 587,
  secure: false,
  auth: {
    user: 'alerts@oxbow.com',
    pass: process.env.EMAIL_PASSWORD
  }
};

// Fonction d'envoi
async function sendEmail({ to, subject, html }) {
  const transporter = nodemailer.createTransport(emailConfig);
  
  await transporter.sendMail({
    from: '"Oxbow Monitoring" <alerts@oxbow.com>',
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html
  });
}
```

#### Slack
```javascript
// Exemple de notification Slack
async function sendSlackAlert(message, data, level = 'warning') {
  const webhook = new Slack.IncomingWebhook(config.slack.webhook);
  
  const colors = {
    info: '#3b82f6',
    warning: '#f59e0b',
    critical: '#ef4444'
  };
  
  await webhook.send({
    channel: config.slack.channel,
    attachments: [{
      color: colors[level] || colors.warning,
      title: message,
      fields: Object.entries(data).map(([key, value]) => ({
        title: key,
        value: typeof value === 'object' ? JSON.stringify(value) : value,
        short: false
      })),
      footer: `Oxbow Monitoring • ${new Date().toISOString()}`
    }]
  });
}
```

#### SMS (Urgences)
```javascript
// Exemple avec Twilio
const twilioClient = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendSmsAlert(message) {
  // Uniquement pour alertes critiques
  await twilioClient.messages.create({
    body: `🚨 CRITIQUE: ${message}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: config.sms.recipients
  });
}
```

### Niveaux d'Alerte

#### Définition des Niveaux
```javascript
const alertLevels = {
  info: {
    color: '#3b82f6',
    icon: 'ℹ️',
    description: 'Information',
    channels: ['logs']
  },
  warning: {
    color: '#f59e0b',
    icon: '⚠️',
    description: 'Avertissement',
    channels: ['logs', 'email', 'slack']
  },
  critical: {
    color: '#ef4444',
    icon: '🚨',
    description: 'Critique',
    channels: ['logs', 'email', 'slack', 'sms']
  }
};
```

#### Exemples d'Alertes par Niveau

**Info:**
- Déploiement réussi
- Pic d'utilisation normal
- Maintenance planifiée

**Warning:**
- Temps de traitement anormalement long
- Utilisation mémoire élevée
- Taux d'erreur utilisateur en hausse

**Critical:**
- Application inaccessible
- Crash répété
- Fuite mémoire sévère
- Erreurs de sécurité

## 🔍 Dashboards de Monitoring

### Dashboard Performance

```javascript
// Exemple de configuration Grafana
const performanceDashboard = {
  title: 'Oxbow Barcode Checker - Performance',
  panels: [
    {
      title: 'Temps de Chargement',
      type: 'graph',
      datasource: 'Prometheus',
      targets: [
        { expr: 'avg(oxbow_fcp)', legendFormat: 'FCP' },
        { expr: 'avg(oxbow_lcp)', legendFormat: 'LCP' },
        { expr: 'avg(oxbow_tti)', legendFormat: 'TTI' }
      ],
      yaxes: [
        { format: 'ms', min: 0 }
      ],
      thresholds: [
        { value: 1500, colorMode: 'warning', op: 'gt', line: true, fill: false },
        { value: 3000, colorMode: 'critical', op: 'gt', line: true, fill: false }
      ]
    },
    {
      title: 'Utilisation Mémoire',
      type: 'graph',
      datasource: 'Prometheus',
      targets: [
        { expr: 'avg(oxbow_memory_used)', legendFormat: 'Utilisée' },
        { expr: 'avg(oxbow_memory_total)', legendFormat: 'Totale' }
      ],
      yaxes: [
        { format: 'bytes', min: 0 }
      ],
      thresholds: [
        { value: 300000000, colorMode: 'warning', op: 'gt', line: true, fill: false },
        { value: 500000000, colorMode: 'critical', op: 'gt', line: true, fill: false }
      ]
    },
    // Autres panels...
  ]
};
```

### Dashboard Erreurs

```javascript
// Exemple de configuration Grafana
const errorsDashboard = {
  title: 'Oxbow Barcode Checker - Erreurs',
  panels: [
    {
      title: 'Taux d\'Erreur',
      type: 'graph',
      datasource: 'Prometheus',
      targets: [
        { expr: 'sum(rate(oxbow_errors_total[5m])) / sum(rate(oxbow_requests_total[5m])) * 100', legendFormat: 'Taux d\'erreur (%)' }
      ],
      yaxes: [
        { format: 'percent', min: 0, max: 100 }
      ],
      thresholds: [
        { value: 5, colorMode: 'warning', op: 'gt', line: true, fill: false },
        { value: 10, colorMode: 'critical', op: 'gt', line: true, fill: false }
      ]
    },
    {
      title: 'Erreurs par Type',
      type: 'bar',
      datasource: 'Prometheus',
      targets: [
        { expr: 'sum(oxbow_errors_total) by (type)', legendFormat: '{{type}}' }
      ]
    },
    // Autres panels...
  ]
};
```

### Dashboard Utilisation

```javascript
// Exemple de configuration Grafana
const usageDashboard = {
  title: 'Oxbow Barcode Checker - Utilisation',
  panels: [
    {
      title: 'Utilisateurs Actifs',
      type: 'stat',
      datasource: 'Prometheus',
      targets: [
        { expr: 'sum(oxbow_active_users)' }
      ],
      options: {
        colorMode: 'value',
        graphMode: 'area',
        justifyMode: 'auto'
      }
    },
    {
      title: 'Fichiers Traités',
      type: 'graph',
      datasource: 'Prometheus',
      targets: [
        { expr: 'sum(rate(oxbow_files_processed_total[1h])) by (type)', legendFormat: '{{type}}' }
      ]
    },
    // Autres panels...
  ]
};
```

## 🛠️ Procédures d'Intervention

### Niveaux d'Escalade

#### Niveau 1: Surveillance Automatique
- **Déclencheur**: Alertes de niveau "warning"
- **Actions**:
  - Notification Slack
  - Enregistrement dans les logs
  - Surveillance accrue

#### Niveau 2: Support Technique
- **Déclencheur**: Alertes répétées ou de niveau "critical"
- **Actions**:
  - Notification email à l'équipe technique
  - Création ticket JIRA
  - Analyse initiale

#### Niveau 3: Intervention Développeur
- **Déclencheur**: Problème confirmé par support technique
- **Actions**:
  - Notification développeur de garde
  - Accès aux logs et dashboards
  - Diagnostic approfondi

#### Niveau 4: Escalade Management
- **Déclencheur**: Problème critique non résolu après 1h
- **Actions**:
  - Notification responsable technique
  - Communication utilisateurs
  - Mobilisation équipe élargie

### Procédures par Type d'Incident

#### Indisponibilité Application
1. Vérifier statut serveur/hébergement
2. Vérifier logs d'erreur
3. Vérifier déploiements récents
4. Rollback si nécessaire
5. Communiquer statut aux utilisateurs

#### Performance Dégradée
1. Identifier goulot d'étranglement (CPU, mémoire, réseau)
2. Vérifier charge utilisateurs
3. Appliquer optimisations d'urgence
4. Surveiller amélioration
5. Planifier optimisations permanentes

#### Erreurs Fonctionnelles
1. Reproduire l'erreur
2. Identifier composant défaillant
3. Vérifier changements récents
4. Appliquer correctif temporaire
5. Planifier correctif permanent

## 📝 Rapports et Analyses

### Rapport Hebdomadaire

```javascript
// Exemple de structure rapport
const weeklyReport = {
  period: '2024-01-08 au 2024-01-14',
  summary: {
    availability: '99.98%',
    averageResponseTime: '1.2s',
    errorRate: '0.3%',
    activeUsers: 127,
    filesProcessed: 1842
  },
  performance: {
    averageFCP: '1.3s',
    averageLCP: '2.1s',
    averageTTI: '2.8s',
    averageMemoryUsage: '180MB'
  },
  errors: {
    total: 24,
    byType: {
      'JS Error': 12,
      'API Error': 5,
      'File Processing': 7
    },
    topErrors: [
      { message: 'Cannot read property of undefined', count: 8 },
      { message: 'Memory limit exceeded', count: 3 }
    ]
  },
  usage: {
    peakConcurrentUsers: 42,
    averageSessionDuration: '12m 34s',
    topFeatures: [
      { name: 'PDF Extraction', usage: 1842 },
      { name: 'Excel Export', usage: 1256 }
    ]
  },
  recommendations: [
    'Optimiser l\'extraction PDF pour réduire l\'utilisation mémoire',
    'Corriger l\'erreur "Cannot read property" dans le composant ResultsTable'
  ]
};
```

### Analyse Tendances

```javascript
// Exemple de fonction d'analyse
function analyzeTrends(metrics, period = '30d') {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - (period === '30d' ? 30 : 7));
  
  // Filtrer par période
  const filteredMetrics = metrics.filter(m => 
    new Date(m.timestamp) >= startDate && new Date(m.timestamp) <= now
  );
  
  // Grouper par jour
  const dailyMetrics = {};
  filteredMetrics.forEach(m => {
    const day = m.timestamp.split('T')[0];
    if (!dailyMetrics[day]) {
      dailyMetrics[day] = [];
    }
    dailyMetrics[day].push(m);
  });
  
  // Calculer moyennes journalières
  const trends = Object.entries(dailyMetrics).map(([day, dayMetrics]) => {
    const fcp = average(dayMetrics.map(m => m.fcp));
    const lcp = average(dayMetrics.map(m => m.lcp));
    const memory = average(dayMetrics.map(m => m.memory?.used || 0));
    const errorRate = (dayMetrics.filter(m => m.hasError).length / dayMetrics.length) * 100;
    
    return {
      day,
      fcp,
      lcp,
      memory,
      errorRate
    };
  });
  
  // Calculer tendances
  const fcpTrend = calculateTrend(trends.map(t => t.fcp));
  const lcpTrend = calculateTrend(trends.map(t => t.lcp));
  const memoryTrend = calculateTrend(trends.map(t => t.memory));
  const errorRateTrend = calculateTrend(trends.map(t => t.errorRate));
  
  return {
    period,
    metrics: trends,
    trends: {
      fcp: fcpTrend,
      lcp: lcpTrend,
      memory: memoryTrend,
      errorRate: errorRateTrend
    },
    summary: {
      improving: [
        fcpTrend < 0 ? 'FCP' : null,
        lcpTrend < 0 ? 'LCP' : null,
        memoryTrend < 0 ? 'Memory Usage' : null,
        errorRateTrend < 0 ? 'Error Rate' : null
      ].filter(Boolean),
      degrading: [
        fcpTrend > 0 ? 'FCP' : null,
        lcpTrend > 0 ? 'LCP' : null,
        memoryTrend > 0 ? 'Memory Usage' : null,
        errorRateTrend > 0 ? 'Error Rate' : null
      ].filter(Boolean)
    }
  };
}

// Fonctions utilitaires
function average(values) {
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateTrend(values) {
  // Calcul simple de tendance linéaire
  // Valeur négative = amélioration, positive = dégradation
  // ...
  return trend;
}
```

---

Pour toute question sur le monitoring ou les alertes, contactez l'équipe DevOps à devops@oxbow.com.