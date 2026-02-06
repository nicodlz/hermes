# Settings Page - Audit Complet

**Date:** 2026-02-06  
**Branche:** fix/settings-page

## Structure de la page

Le composant Settings (`apps/web/src/pages/Settings.tsx`) contient 4 tabs:
1. **Profile** - Informations du compte
2. **API Keys** - Gestion des clés API
3. **Notifications** - Préférences de notifications
4. **Appearance** - Choix du thème (Light/Dark/System)

---

## ✅ FONCTIONNEL

### 1. Profile Tab
- **Status:** ✅ OK
- **Features:**
  - Affiche email (user.email)
  - Affiche organization (user.orgName)
  - Affiche le nombre de clés API
- **Backend:** Utilise le contexte auth (`useAuth()`)
- **Types:** Correctement typé avec `User` interface

### 2. API Keys Tab
- **Status:** ✅ OK
- **Features:**
  - Liste les clés API existantes
  - Création de nouvelles clés
  - Suppression de clés
  - Warning pour copier la clé après création
  - Exemple d'usage cURL
- **Backend:** 
  - `GET /api/auth/api-keys` - Liste
  - `POST /api/auth/api-keys` - Création
  - `DELETE /api/auth/api-keys/:id` - Suppression
- **UI/UX:** Complet et bien structuré

---

## ❌ CASSÉ - À FIXER

### 3. Notifications Tab
- **Status:** ❌ CASSÉ
- **Problèmes:**
  1. Les toggles ne font que modifier le state local (useState)
  2. **AUCUN appel API** pour persister les préférences
  3. **AUCUN endpoint backend** pour les notifications
  4. Les préférences sont perdues au refresh
  5. Pas de chargement initial depuis le backend
  
- **Features affichées (non fonctionnelles):**
  - New Lead Alerts
  - Response Notifications
  - Task Reminders
  - Weekly Digest
  
- **Fix requis:**
  - [ ] Créer endpoint backend `/api/settings/notifications` (GET/PUT)
  - [ ] Ajouter méthodes dans `api.ts`
  - [ ] Implémenter useQuery/useMutation pour persister
  - [ ] Ou: Afficher un message "Coming soon" si pas prioritaire

### 4. Appearance Tab
- **Status:** ❌ CASSÉ
- **Problèmes:**
  1. **Aucun système de theming** implémenté
  2. Pas de ThemeContext/ThemeProvider
  3. Les boutons n'ont **pas de onClick** fonctionnel
  4. Le theme "Dark" est hard-coded (`active={true}`)
  5. Les classes `dark:` dans le CSS ne fonctionnent pas car pas de dark mode toggle
  6. Le choix de theme n'est pas persisté (localStorage manquant)

- **Fix requis:**
  - [ ] Créer ThemeContext avec ThemeProvider
  - [ ] Implémenter localStorage pour persister le choix
  - [ ] Ajouter logic pour détecter system preference
  - [ ] Connecter les boutons au context
  - [ ] Tester le dark mode sur toute l'app
  - [ ] Ou: Simplifier en retirant "System" et ne garder que Light/Dark

---

## Priorités de Fix

### HIGH (Critical - bloque l'UX)
1. **Appearance Tab** - Les utilisateurs ne peuvent pas changer de thème
   - Impact: Toute l'app utilise des classes dark: mais pas de toggle
   - Effort: Medium (créer ThemeProvider)

### MEDIUM (Feature cassée mais non-bloquante)
2. **Notifications Tab** - Feature non fonctionnelle
   - Impact: Utilisateurs pensent qu'ils peuvent configurer des notifs (fausse promesse)
   - Effort: HIGH (nécessite backend) OU LOW (afficher "Coming soon")

---

## Plan d'action

1. **Fix Appearance** (priorité 1)
   - Créer `src/lib/theme.tsx` avec ThemeProvider
   - Wrapper App avec ThemeProvider
   - Connecter les boutons dans Settings
   - Tester sur plusieurs pages

2. **Fix Notifications** (priorité 2)
   - Option A: Implémenter backend complet (si besoin)
   - Option B: Afficher "Coming soon" + désactiver toggles
   - Recommandation: Option B pour l'instant

3. **Tests finaux**
   - Build doit passer
   - Typecheck doit passer
   - Test manuel de chaque tab
   - Test dark mode sur plusieurs pages

---

## Commits prévus

1. `feat(settings): implement theme provider and dark mode toggle`
2. `fix(settings): disable non-functional notification toggles with coming soon message`
3. `docs: update settings audit with fixes`
