# 🚀 Hermes Analytics Dashboard - Deployment Status

## ✅ Completed

### Backend
- ✅ 5 nouveaux endpoints API ajoutés dans `/apps/api/src/routes/stats.ts`
- ✅ Support des filtres de date (since/until)
- ✅ Export CSV fonctionnel
- ✅ Build TypeScript réussi sans erreurs

### Frontend
- ✅ Installation de Recharts (`^2.12.0`)
- ✅ Nouvelle page `Analytics.tsx` avec tous les graphes
- ✅ Composants KPI cards, filtres de date, boutons export
- ✅ Support dark mode
- ✅ Responsive design (mobile + desktop)
- ✅ Build production réussi (`npm run build`)

### Git
- ✅ Commit: `036ae68` - "feat: Add professional analytics dashboard with charts and metrics"
- ✅ Push sur GitHub `nicodlz/hermes:main`
- ✅ 8 files changed, 1755 insertions(+)

## 🔄 En Cours

### Auto-Deploy (Coolify)
- ⏳ Déploiement automatique déclenché par le push sur `main`
- ⏳ Backend rebuild en cours
- ⏳ Frontend rebuild en cours

**Comment vérifier :**
```bash
# Test l'endpoint timeline (devrait retourner du JSON une fois déployé)
curl -H "X-API-Key: hms_821540f1e0971977622484d04492bb2cede73445" \
  https://hermes.ndlz.net/api/stats/timeline | jq '.'

# Si ça retourne du HTML, le déploiement n'est pas terminé
# Si ça retourne du JSON avec [{date, new, qualified, ...}], c'est bon !
```

## 📋 Endpoints API Disponibles (après déploiement)

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/stats/timeline` | GET | Évolution des leads par jour/semaine |
| `/api/stats/templates` | GET | Performance des email templates |
| `/api/stats/sources` | GET | Statistiques par source (Reddit, HN, etc.) |
| `/api/stats/conversion-time` | GET | Temps moyen entre chaque étape |
| `/api/stats/export` | GET | Export CSV (leads ou timeline) |
| `/api/stats/funnel` | GET | Funnel de conversion (mis à jour avec filtres) |

## 🎨 UI Features

### Page /stats (Analytics Dashboard)
- **KPI Cards** : Total Leads, Response Rate, Conversion Rate, Avg Cycle Time
- **Timeline Chart** : Area chart avec évolution par jour/semaine
- **Conversion Funnel** : Horizontal bar chart avec taux de conversion
- **Conversion Time** : Bar chart du temps moyen par étape
- **Top Sources** : Pie chart + breakdown des sources
- **Template Performance** : Bar chart + table détaillée

### Filtres
- Date range : 7d, 30d, 90d, all time
- Timeline view : Daily vs Weekly
- Export CSV : Leads ou Timeline

## 🧪 Tests à Effectuer (une fois déployé)

1. **Accéder au dashboard**
   ```
   https://hermes.ndlz.net/stats
   ```

2. **Tester les filtres de date**
   - Cliquer sur 7d, 30d, 90d, all time
   - Vérifier que les graphes se mettent à jour

3. **Tester l'export CSV**
   - Cliquer sur "Export CSV"
   - Vérifier que le fichier se télécharge

4. **Tester les graphes**
   - Timeline : passer de Daily à Weekly
   - Vérifier que tous les graphes s'affichent correctement
   - Tester en dark mode

## 📊 Données de Test

Actuellement il y a **11 leads scrapés** mais aucun n'a été qualifié/contacté.

Pour tester visuellement :
```bash
# Via API - marquer un lead comme qualifié
curl -X PATCH -H "X-API-Key: hms_..." \
  -H "Content-Type: application/json" \
  -d '{"status":"QUALIFIED","qualifiedAt":"2026-02-04T12:00:00Z"}' \
  https://hermes.ndlz.net/api/leads/<LEAD_ID>
```

Ou via l'interface web :
1. Aller sur /leads
2. Ouvrir un lead
3. Changer son status
4. Retourner sur /stats pour voir les graphes se mettre à jour

## 🔗 Liens Utiles

- **Repo GitHub** : https://github.com/nicodlz/hermes
- **App Prod** : https://hermes.ndlz.net
- **Analytics** : https://hermes.ndlz.net/stats
- **API Docs** : Voir `ANALYTICS_FEATURES.md`

## 🎯 Prochaines Étapes (optionnel)

1. Ajouter un cache pour les stats (éviter recalcul à chaque requête)
2. Créer un cron job pour pré-calculer les stats quotidiennes
3. Ajouter plus de métriques (CAC, LTV, etc.)
4. Dashboard temps réel avec WebSocket
5. Alertes si métriques en baisse

---

**Status:** ✅ Code prêt, ⏳ Déploiement en cours
**ETA:** ~5-10 minutes (temps de rebuild Coolify)
