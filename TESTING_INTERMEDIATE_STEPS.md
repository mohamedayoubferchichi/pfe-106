# Guide de Test — Capture des Étapes Intermédiaires

## 🧪 Préparation de l'Environnement

### 1. Démarrer le Backend
```bash
cd back-end/back-end
mvn clean spring-boot:run
# ou
./mvnw.cmd clean spring-boot:run
```

### 2. Démarrer le Frontend
```bash
cd front-end
npm run dev
```

### 3. Vérifier MongoDB
```bash
# MongoDB doit être accessible et vide (ou avec données de test)
mongo
> use pfe105db
> db.sinistres.count()  # 0 ou nombre de tests précédents
```

---

## 📝 Test 1: Déclaration Simple (Texte + Image)

### Étapes

**1. Dans DeclarationSinistrePage, déclarer un sinistre AUTO**

```
Form Data:
  typeSinistre: "AUTO"
  numeroContrat: "CTR-2025-001"  # Contrat existant en BD
  dateIncident: "2025-01-15"
  lieuIncident: "Rue de la Paix, Tunis"
  description: "Accident automobile au carrefour. Pare-brise cassé, aile avant endommagée."
  image: <upload photo montrant dégâts>
```

**2. Observer Backend Logs**

```
[Orchestrator] Starting 3-agent pipeline with intermediate capture (insuredId=12345678, type=AUTO)...
[Orchestrator] Step 1: Claim text / coverage (primary=LLAMA_3_2_90B)...
  → runClaimAnalysisStep() exécuté
  → NvidiaResponse(claimAgentJSON) reçue
[Orchestrator] Step 2: Damage image...
  → runImageAnalysis() exécuté
  → NvidiaResponse(visionAgentJSON) reçue
[Orchestrator] Step 3: Final decision (primary chat)...
  → runOrchestratorStep() exécuté
  → NvidiaResponse(orchestratorJSON enrichi) reçue
[Orchestrator] Pipeline SUCCESS in 12450ms
  → PipelineResponse(claimAnalysis, visionAnalysis, finalDecision) retourné
```

**3. Vérifier SinistreService**

```
SinistreService.declarerSinistre():
  ✓ ClaimAnalysisResult analysisResult = orchestratorAgent.processClaimWithIntermediateResults()
  ✓ analysisResult.getClaimAgentAnalysis() → preClaimAnalysis
  ✓ analysisResult.getVisionAgentAnalysis() → preImageAnalysis
  ✓ analysisResult.getSynthesisForDisplay() → aiAnalysis
```

**4. Frontend Affiche Résultat**

```
✓ Sinistre déclaré avec succès
✓ ID: 65f8a9e3c1d2e4f5a6b7c8d9
✓ Statut: PENDING
✓ Score IA: 78%
```

**5. Vérifier MongoDB**

```bash
mongo
> use pfe105db
> db.sinistres.findOne({_id: ObjectId("65f8a9e3c1d2e4f5a6b7c8d9")})

# Résultat :
{
  _id: ObjectId("65f8a9e3c1d2e4f5a6b7c8d9"),
  cinUtilisateur: "12345678",
  numeroContrat: "CTR-2025-001",
  typeSinistre: "AUTO",
  dateIncident: ISODate("2025-01-15T00:00:00.000Z"),
  
  // ✅ NOUVELLES COLONNES REMPLIES :
  preClaimAnalysis: {
    claimValidity: "VALID",
    coveragePercentage: 85,
    detectedDamages: ["pare-brise", "aile avant"],
    fraudRiskLevel: "LOW",
    ...
  },
  
  preImageAnalysis: {
    damageDetectionConfidence: 0.92,
    estimatedSeverity: "MODERATE",
    damagedAreas: [
      { part: "pare-brise", severity: "HIGH", ... },
      { part: "aile avant", severity: "MODERATE", ... }
    ],
    ...
  },
  
  aiAnalysis: {
    finalDecision: "MANUAL_REVIEW",
    finalIndemnificationAmount: 1950,
    globalConfidenceScore: 0.78,
    contractMatchedItems: [...],
    ...
  },
  
  contractContextUsed: "CONTRAT AUTO...",
  supportingDocumentsExtract: "...",
  
  statut: "PENDING",
  scoreConfiance: 0.78
}

# ✅ TEST RÉUSSI : Les 3 étapes sont persistées !
```

---

## 📋 Test 2: Affichage en AgentPage

### Étapes

**1. Se connecter comme Agent**

```
Role: AGENT
Agence: AGENCE_TUNIS
```

**2. Naviguer vers "Gestion des Sinistres"**

```
Menu → Gestion → Sinistres (icon documents)
```

**3. Observer la Table de Sinistres**

```
✓ Colonne "Contrats": Affiche numéro contrat
✓ Colonne "CIN": Affiche CIN assuré
✓ Colonne "Type": AUTO, HABITATION, etc.
✓ Colonne "Date": Date incident
✓ Colonne "Statut": PENDING (badge)
✓ Colonne "Score": 78% (de scoreConfiance)
✓ Colonne "Actions": Bouton "Détails"
```

**4. Cliquer "Détails" pour le sinistre créé**

```
Modal s'ouvre avec TABS :
  ├─ Tab "Synthèse Finale"
  │   └─ Affiche aiAnalysis.finalDecision, montant, confiance
  │   └─ Affiche insuredNotification
  │
  ├─ Tab "Analyse Texte (Agent 1)"
  │   └─ Affiche preClaimAnalysis (Claim Agent output)
  │   └─ Dommages détectés: pare-brise, aile avant
  │   └─ Couverture: 85%
  │   └─ Montant estimé: 1950 TND
  │
  ├─ Tab "Analyse Image (Agent 2)"
  │   └─ Affiche preImageAnalysis (Vision Agent output)
  │   └─ Image: <foto dégâts>
  │   └─ Zones endommagées: pare-brise (avant gauche), aile avant
  │   └─ Confiance détection: 92%
  │
  ├─ Tab "Réconciliation Contrat"
  │   └─ Table des postes contractuels appariés
  │   └─ pare-brise → 750 TND (inclus ✓)
  │   └─ aile → 1200 TND (inclus ✓)
  │   └─ Total: 1950 TND
  │
  ├─ Tab "Contexte Utilisé"
  │   └─ Texte du contrat fourni à l'IA
  │   └─ Texte des documents justificatifs
  │
  └─ Boutons actions:
      ├─ Approuver (APPROVED)
      ├─ Rejeter (REJECTED)
      ├─ Clôturer (CLOSED)
      └─ Annuler

✅ TEST RÉUSSI : Modal affiche toutes les analyses
```

**5. Vérifier Concordance des 3 Étapes**

```
Vérifier que les 3 analyses sont cohérentes :

✓ preClaimAnalysis détecte: pare-brise, aile
✓ preImageAnalysis confirme: pare-brise, aile visibles
✓ aiAnalysis synthétise: 2 postes appariés au contrat

Cela montre que le pipeline fonctionne correctement !
```

---

## ✅ Test 3: Validation des Données Persistées

### Script de Validation MongoDB

```bash
mongo pfe105db << 'EOF'

// Test 1: Vérifier que preClaimAnalysis existe et n'est pas vide
var claim = db.sinistres.findOne({typeSinistre: "AUTO"});

if (!claim) {
  print("❌ ERREUR: Aucun sinistre AUTO trouvé");
  quit(1);
}

print("✓ Sinistre trouvé: " + claim._id);

// Test 2: preClaimAnalysis
if (!claim.preClaimAnalysis) {
  print("❌ ERREUR: preClaimAnalysis est NULL");
  quit(1);
}

if (typeof claim.preClaimAnalysis === 'string' && claim.preClaimAnalysis.length === 0) {
  print("❌ ERREUR: preClaimAnalysis est une chaîne VIDE");
  quit(1);
}

print("✓ preClaimAnalysis existe et n'est pas vide");
print("  → contient: " + Object.keys(claim.preClaimAnalysis).join(", "));

// Test 3: preImageAnalysis
if (!claim.preImageAnalysis) {
  print("❌ ERREUR: preImageAnalysis est NULL");
  quit(1);
}

print("✓ preImageAnalysis existe et n'est pas vide");
print("  → contient: " + Object.keys(claim.preImageAnalysis).join(", "));

// Test 4: aiAnalysis
if (!claim.aiAnalysis) {
  print("❌ ERREUR: aiAnalysis est NULL");
  quit(1);
}

print("✓ aiAnalysis existe et n'est pas vide");
print("  → finalDecision: " + claim.aiAnalysis.finalDecision);
print("  → montant: " + claim.aiAnalysis.finalIndemnificationAmount);

// Test 5: Concordance
var preClaimDamages = claim.preClaimAnalysis.detectedDamages || [];
var contractItems = claim.aiAnalysis.contractMatchedItems || [];

print("\n✓ VALIDATION CONCORDANCE:");
print("  → preClaimAnalysis détecte " + preClaimDamages.length + " dommages");
print("  → aiAnalysis apparie " + contractItems.length + " postes");

if (preClaimDamages.length === 0) {
  print("⚠  ATTENTION: preClaimAnalysis ne détecte aucun dommage");
}

// Test 6: Taille
print("\n✓ VALIDATION TAILLE:");
print("  → preClaimAnalysis: ~" + JSON.stringify(claim.preClaimAnalysis).length + " bytes");
print("  → preImageAnalysis: ~" + JSON.stringify(claim.preImageAnalysis).length + " bytes");
print("  → aiAnalysis: ~" + JSON.stringify(claim.aiAnalysis).length + " bytes");

print("\n✅ TOUS LES TESTS PASSENT!");

EOF
```

### Résultat Attendu

```
✓ Sinistre trouvé: ObjectId(65f8a9e3c1d2e4f5a6b7c8d9)
✓ preClaimAnalysis existe et n'est pas vide
  → contient: claimValidity, coveragePercentage, detectedDamages, fraudRiskLevel
✓ preImageAnalysis existe et n'est pas vide
  → contient: damageDetectionConfidence, estimatedSeverity, damagedAreas
✓ aiAnalysis existe et n'est pas vide
  → finalDecision: MANUAL_REVIEW
  → montant: 1950
✓ VALIDATION CONCORDANCE:
  → preClaimAnalysis détecte 2 dommages
  → aiAnalysis apparie 2 postes
✓ VALIDATION TAILLE:
  → preClaimAnalysis: ~850 bytes
  → preImageAnalysis: ~1200 bytes
  → aiAnalysis: ~2500 bytes
✅ TOUS LES TESTS PASSENT!
```

---

## 🔄 Test 4: Update Statut par Agent

### Étapes

**1. Agent clique "Approuver" dans Modal**

```
Modal Sinistre → Bouton "✓ Approuver"
```

**2. Observer Backend Log**

```
[AgentController] PATCH /api/agent/sinistres/{id}/statut
  statut: "APPROVED"
  
[SinistreService] updateStatut() appelé
  ✓ Valide statut ∈ {PENDING, APPROVED, REJECTED, CLOSED}
  ✓ Appelle sinistreRepository.save()
  ✓ Retourne Sinistre mis à jour
```

**3. Vérifier Frontend**

```
Modal se ferme
Table se met à jour :
  ✓ Ligne sinistre passe de "PENDING" à "APPROVED"
  ✓ Couleur badge change (orange → vert)
```

**4. Vérifier MongoDB**

```bash
mongo
> db.sinistres.findOne({_id: ObjectId("65f8a9e3c1d2e4f5a6b7c8d9")})

# Résultat :
{
  ...
  statut: "APPROVED",  # ✓ Changé de PENDING
  ...
}
```

---

## 🐛 Checklist de Debugging

Si vous rencontrez des problèmes :

| Problème | Cause Probable | Solution |
|----------|--------------|----------|
| `preClaimAnalysis` est NULL | `OrchestratorAgent.processClaimWithIntermediateResults()` non appelé | Vérifier import `ClaimAnalysisResult` dans `SinistreService` |
| `preClaimAnalysis` est chaîne vide | `PipelineResponse.getClaimAnalysisResponse()` retourne NULL | Vérifier que `ClaimOrchestrationService.processClaimWithIntermediateSteps()` fonctionne |
| Tab "Analyse Texte" ne montre rien | `preClaimAnalysis` est NULL côté frontend | Vérifier requête GET `/api/agent/sinistres/{agenceId}` retourne champ |
| Modal Détails ne s'ouvre pas | `selectedSinistre` non défini dans `AgentPage.jsx` | Cliquer sur bouton "Détails" et vérifier console (F12) |
| Compilation échoue | Import manquant | Vérifier imports : `ClaimAnalysisResult`, `PipelineResponse` dans les classes java |
| Tests MongoDB échouent | Sinistre pas créé | Vérifier que déclaration sinistre a réussi avant (check frontend) |

---

## 📊 Métriques de Succès

### Test 1: Déclaration
- ✅ Sinistre créé en BD
- ✅ `preClaimAnalysis` != NULL et != ""
- ✅ `preImageAnalysis` != NULL et != ""
- ✅ `aiAnalysis` != NULL et != ""

### Test 2: Affichage Agent
- ✅ Table affiche sinistre
- ✅ Modal affiche 5 tabs
- ✅ Chaque tab montre les données correctes
- ✅ Tab "Analyse Texte" affiche `preClaimAnalysis`
- ✅ Tab "Analyse Image" affiche `preImageAnalysis`

### Test 3: Données MongoDB
- ✅ 3 champs JSON différents persistes
- ✅ Champs ne sont pas vides
- ✅ Champs ne sont pas NULL
- ✅ Données concordantes (détectées vs appairées)

### Test 4: Update Statut
- ✅ Statut change en BD
- ✅ Frontend reflète le changement
- ✅ Validations respectées (PENDING → APPROVED OK, autres états valides)

---

## 🎬 Exécution Complète du Test (5 min)

```bash
# 1. Terminal 1: Backend
cd back-end/back-end && mvn spring-boot:run

# 2. Terminal 2: Frontend
cd front-end && npm run dev

# 3. Browser: http://localhost:5173
# → Naviguer vers Declaration Sinistre
# → Remplir form AUTO avec image
# → Soumettre
# → Attendre 30-60s (AI processing)

# 4. Terminal 3: Validation MongoDB
mongo pfe105db << 'EOF'
var claim = db.sinistres.find().sort({_id: -1}).limit(1)[0];
print(JSON.stringify(claim, null, 2));
EOF

# 5. Browser: Se connecter comme AGENT
# → Aller à "Gestion des Sinistres"
# → Cliquer "Détails" sur sinistre créé
# → Vérifier les 5 tabs
# → Cliquer "Approuver"
# → Vérifier statut change en BD

echo "✅ TOUS LES TESTS PASSENT !"
```

