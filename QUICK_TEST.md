# ⚡ Quick Start — Test en 5 Minutes

## 🎯 Objectif

Vérifier que le pipeline AI capture les 3 étapes et les persiste en MongoDB.

---

## 🚀 Setup (1 min)

### Terminal 1: Backend
```bash
cd c:\Users\conta\OneDrive\Bureau\pfee\pfe-105-main\pfe-105-main\back-end\back-end
mvn clean spring-boot:run
# Attendez : BUILD SUCCESS
```

### Terminal 2: Frontend  
```bash
cd c:\Users\conta\OneDrive\Bureau\pfee\pfe-105-main\pfe-105-main\front-end
npm run dev
# Attendez : VITE ready
```

### Terminal 3: MongoDB
```bash
mongo
use pfe105db
# Restera ouvert pour vérifications
```

---

## 📋 Test Rapide (4 min)

### Étape 1: Déclarer Sinistre (1 min)

**Browser:** http://localhost:5173

1. Cliquer "Déclarer Sinistre"
2. Remplir formulaire:
   ```
   Type: AUTO
   Contrat: CTR-2025-001
   Date: 2025-01-15
   Lieu: Rue test, Tunis
   Description: Dégâts pare-brise et aile
   Image: <upload any image>
   ```
3. Cliquer "Déclarer"
4. Attendre 30-60s (AI processing)

**Résultat attendu:**
```
✅ Sinistre créé avec ID xxx
✅ Statut: PENDING
✅ Score IA: 0.78
```

---

### Étape 2: Vérifier MongoDB (1 min)

**Terminal 3 (MongoDB):**

```bash
db.sinistres.find().sort({_id: -1}).limit(1).pretty()
```

**Chercher dans résultat:**

```json
{
  preClaimAnalysis: {
    claimValidity: "VALID",
    coveragePercentage: 85,
    detectedDamages: ["pare-brise", "aile"],
    ...
  },
  preImageAnalysis: {
    damageDetectionConfidence: 0.92,
    damagedAreas: [
      { part: "pare-brise", severity: "HIGH" },
      { part: "aile", severity: "MODERATE" }
    ],
    ...
  },
  aiAnalysis: {
    finalDecision: "MANUAL_REVIEW",
    finalIndemnificationAmount: 1950,
    ...
  }
}
```

**✅ Si ces 3 champs existent et ne sont pas vides:** TEST RÉUSSI

---

### Étape 3: Vérifier Frontend Agent (1 min)

**Browser:**
1. Se déconnecter
2. Se connecter comme Agent:
   - Email: agent@assurgo.tn
   - Password: AgentTest123
   - Agence: AGENCE_TUNIS

3. Menu → Gestion → Sinistres
4. Chercher le sinistre créé
5. Cliquer "Détails"

**Résultat attendu:**

Modal avec TABS:
- ✅ Tab "Synthèse Finale" → affiche aiAnalysis
- ✅ Tab "Analyse Texte" → affiche preClaimAnalysis
- ✅ Tab "Analyse Image" → affiche preImageAnalysis
- ✅ Tab "Réconciliation Contrat" → affiche contractMatchedItems
- ✅ Tab "Contexte Utilisé" → affiche contractContextUsed

**Si tous les tabs affichent des données:** TEST RÉUSSI

---

### Étape 4: Tester Update Statut (1 min)

**Browser - Modal Détails:**

1. Cliquer bouton "✓ Approuver"
2. Attendre 1s
3. Modal se ferme
4. Table: Statut change à "APPROVED"

**Vérifier MongoDB:**

```bash
db.sinistres.findOne({_id: ObjectId("...")}) | grep statut
# Résultat: "statut": "APPROVED"
```

**Si statut a changé:** TEST RÉUSSI

---

## ✅ Résultat Final

Si vous avez ✅ sur les 4 points:

1. ✅ Sinistre créé avec toutes les analyses
2. ✅ MongoDB contient preClaimAnalysis, preImageAnalysis, aiAnalysis
3. ✅ AgentPage affiche 5 tabs avec données correctes
4. ✅ Update statut fonctionne

**→ L'implémentation est COMPLÈTE et FONCTIONNELLE** 🎉

---

## 🐛 Troubleshooting Rapide

### Tab "Analyse Texte" vide?
```bash
# Vérifier MongoDB
db.sinistres.findOne().preClaimAnalysis
# Si NULL ou "", vérifier logs backend pour erreur AI
```

### Modal Détails ne s'ouvre pas?
```javascript
// Console browser (F12)
// Chercher erreur fetch
// Vérifier status code 200 de GET /api/agent/sinistres/{id}
```

### Statut ne change pas?
```bash
# Vérifier logs backend
grep "updateStatut" log.txt
# Chercher "PATCH /api/agent/sinistres/xxx/statut"
```

### Compilation échoue?
```bash
cd back-end/back-end
mvn clean compile
# Chercher erreur import ClaimAnalysisResult
```

---

## 📊 Metriques de Succès

| Métrique | Cible | Résultat |
|----------|-------|----------|
| Sinistre créé | 1 | ✅ |
| preClaimAnalysis != NULL | OUI | ✅ |
| preImageAnalysis != NULL | OUI | ✅ |
| aiAnalysis != NULL | OUI | ✅ |
| Tabs affichent données | 5/5 | ✅ |
| Update statut | OUI | ✅ |

---

## 🎬 Vidéo de Démonstration (Texte)

```
00:00 - Déclarer sinistre
  → Form rempli
  → Image uploadée
  → Cliquer "Déclarer"

00:10 - Processing...
  → Logs backend: Step 1, Step 2, Step 3
  → Attendre 30-60s

01:15 - Sinistre créé
  → ID affiché
  → Statut PENDING
  → Score 78%

01:30 - Vérifier MongoDB
  → 3 analyses présentes
  → Données cohérentes

02:00 - Login Agent
  → Se déconnecter
  → Login agent@assurgo.tn

02:15 - AgentPage
  → Menu → Gestion
  → Chercher sinistre
  → Cliquer Détails

02:30 - Modal Détails
  → Tab Synthèse Finale
  → Tab Analyse Texte
  → Tab Analyse Image
  → Tab Réconciliation
  → Tab Contexte

03:15 - Update Statut
  → Cliquer Approuver
  → Vérifier statut change
  → Vérifier MongoDB

03:45 - Test Terminé
  → ✅ SUCCESS
```

---

## 📞 Support

**Si test échoue:**

1. Vérifier logs backend pour "ERROR"
2. Vérifier MongoDB accessible
3. Vérifier frontend logs (F12)
4. Vérifier compilatio

n réussie
5. Contacter développeur avec logs

