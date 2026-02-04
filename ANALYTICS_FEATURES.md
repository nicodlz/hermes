# 📊 Analytics Dashboard - New Features

## ✨ What's New

Le dashboard Hermes dispose maintenant d'un système d'analytics professionnel avec graphiques temps réel et métriques de conversion.

## 🎯 Features Implémentées

### 1. **Lead Pipeline Timeline** 📈
- Graphe en aires empilées montrant l'évolution des leads par jour/semaine
- Filtres : Daily vs Weekly view
- Données : NEW, QUALIFIED, CONTACTED, RESPONDED, WON
- Visual : Area chart avec couleurs distinctes par étape

### 2. **Conversion Funnel** 🔥
- Graphe horizontal en barres montrant la conversion à chaque étape
- Taux de conversion affiché pour chaque transition
- Étapes : Scraped → Qualified → Contacted → Responded → Won
- Code couleur : vert (>50%), jaune (25-50%), rouge (<25%)

### 3. **Response Rate par Template** ✉️
- Performance de chaque template d'email
- Métriques : envoyés, réponses reçues, taux de réponse
- Graphe en barres + table détaillée
- Tri par usage

### 4. **Top Sources de Leads** 🌐
- Graphe en camembert des 6 meilleures sources
- Breakdown détaillé : nombre total, taux de conversion
- Sources : Reddit, HN, IndieHackers, etc.

### 5. **Temps Moyen de Conversion** ⏱️
- Temps moyen en jours pour chaque étape du funnel
- Graphe en barres
- Affichage du cycle total moyen

### 6. **Filtres de Date Range** 📅
- 7 jours, 30 jours, 90 jours, ou All time
- Appliqués sur funnel, sources, et export CSV
- UI : pills sélectionnables

### 7. **Export CSV** 💾
- Export des leads ou timeline
- Headers : Date, New, Qualified, Contacted, Responded, Won
- Format : `hermes-[type]-YYYY-MM-DD.csv`
- Bouton download avec icon

## 🔌 API Endpoints Ajoutés

### Backend (`apps/api/src/routes/stats.ts`)

```typescript
GET /api/stats/timeline
  ?days=30 (optional, default: 30)
  &groupBy=day|week (optional, default: day)
  
GET /api/stats/templates
  // No params - returns all template performance stats

GET /api/stats/sources
  ?since=YYYY-MM-DD (optional)
  &until=YYYY-MM-DD (optional)

GET /api/stats/conversion-time
  // No params - calculates avg time between stages

GET /api/stats/export
  ?type=leads|timeline (required)
  &days=30 (optional for timeline)
  // Returns CSV file

GET /api/stats/funnel (UPDATED)
  ?since=YYYY-MM-DD (optional)
  &until=YYYY-MM-DD (optional)
```

## 📦 Dependencies Ajoutées

```json
{
  "recharts": "^2.12.0"  // Charts library
}
```

## 🎨 UI/UX

### Layout
- Page `/stats` → nouvelle page `Analytics.tsx`
- 4 KPI cards en haut : Total Leads, Response Rate, Conversion Rate, Avg Cycle Time
- 2 colonnes de graphiques responsive
- Dark mode supporté

### Colors
- Primary: `#3b82f6` (blue)
- Success: `#10b981` (green)
- Warning: `#f59e0b` (orange)
- Danger: `#ef4444` (red)
- Purple, Cyan, Indigo pour variété

### Charts (Recharts)
- Area Chart : timeline des leads
- Horizontal Bar Chart : conversion funnel
- Bar Chart : conversion time, template performance
- Pie Chart : sources de leads

## 🚀 Comment Tester

### Local
```bash
cd /home/ubuntu/.openclaw/workspace/hermes

# Backend
cd apps/api
npm run build
npm run dev

# Frontend (autre terminal)
cd apps/web
npm run dev
```

### Production (Coolify)
Le push sur `main` déclenche automatiquement le déploiement via Coolify.

URL: https://hermes.ndlz.net/stats

## 📊 Données de Test

Pour avoir des données intéressantes :
1. Ajouter des leads avec différents statuts
2. Créer des templates et envoyer des emails
3. Marquer des leads comme RESPONDED, WON, LOST
4. Les timestamps (qualifiedAt, contactedAt, etc.) sont utilisés pour les graphes

## 🔮 Améliorations Futures

- [ ] Cache des stats (éviter recalcul permanent)
- [ ] Filtres par source spécifique
- [ ] Comparaison période vs période (MoM, YoY)
- [ ] Goals/targets configurables
- [ ] Notifications si métriques en baisse
- [ ] Export PDF des rapports
- [ ] Drill-down sur chaque étape du funnel

## 📝 Notes Techniques

### Performance
- Les stats sont calculées à la volée (pas de cache pour l'instant)
- Pour optimiser : utiliser `DailyStats` model et un cron job
- Recharts charge ~200kb gzippé (acceptable)

### TypeScript
- Tous les types sont définis dans `apps/web/src/lib/api.ts`
- Interfaces : `TimelineData`, `TemplateStats`, `SourceStats`, `ConversionTimeStats`

### Responsive
- Mobile-first design
- Graphiques adaptent leur taille automatiquement (ResponsiveContainer)
- Tables scrollables horizontalement sur mobile

---

**Commit:** `036ae68` - feat: Add professional analytics dashboard with charts and metrics
**Branch:** `main`
**Status:** ✅ Pushed to GitHub
