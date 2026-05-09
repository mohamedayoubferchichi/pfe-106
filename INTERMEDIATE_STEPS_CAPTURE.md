# Architecture d'Analyse des Sinistres — Capture des Étapes Intermédiaires

## 🎯 Problème Résolu

**Avant :** L'orchestrateur AI retournait une **seule synthèse finale** JSON, perdant toutes les analyses intermédiaires des 3 agents :
- ❌ Analyse du Sinistre (Claim Agent) → **PERDUE**
- ❌ Analyse d'Image (Vision Agent) → **PERDUE**  
- ✅ Décision Finale (Orchestrator) → **RETENUE SEULE**

**Après :** Capture complète de **toutes les étapes du pipeline** :
- ✅ Analyse du Sinistre (Claim Agent) → **PERSISTÉE**
- ✅ Analyse d'Image (Vision Agent) → **PERSISTÉE**
- ✅ Décision Finale (Orchestrator) → **PERSISTÉE**

---

## 🏗️ Architecture Améliorée

### 1. **DTOs (Couche Transport)**

#### `ClaimAnalysisResult.java` (NEW)
```java
/**
 * Structure retournée par OrchestratorAgent.processClaimWithIntermediateResults()
 * Contient les 4 étapes complètes du pipeline d'analyse
 */
public class ClaimAnalysisResult {
    String claimAgentAnalysis;      // JSON du Claim Agent (Step 1)
    String visionAgentAnalysis;     // JSON du Vision Agent (Step 2)
    String orchestratorFinalDecision; // JSON du Orchestrator (Step 3)
    String synthesisForDisplay;     // Synthèse pour affichage
}
```

#### `PipelineResponse.java` (NEW)
```java
/**
 * Structure interne dans ClaimOrchestrationService
 * Encapsule les NvidiaResponse de chaque étape
 */
public class PipelineResponse {
    NvidiaResponse claimAnalysisResponse;
    NvidiaResponse visionAnalysisResponse;
    NvidiaResponse finalDecisionResponse;
}
```

---

### 2. **Services (Logique Métier)**

#### `ClaimOrchestrationService.java` — Pipeline Complet

**NOUVELLE MÉTHODE :**
```java
public PipelineResponse processClaimWithIntermediateSteps(
    String claimDescription,
    String claimType,
    String contractSummary,
    String legalDocumentText,
    String ragContext,
    String imageBase64,
    String imageMimeType,
    String insuredId,
    String supportingDocumentsText)
```

**Flux :**
1. **Step 1:** Appelle `runClaimAnalysisStep()` → retourne `NvidiaResponse` avec JSON Claim Agent
2. **Step 2:** Appelle `runImageAnalysis()` → retourne `NvidiaResponse` avec JSON Vision Agent
3. **Step 3:** Appelle `runOrchestratorStep()` → retourne `NvidiaResponse` avec JSON Orchestrator enrichi
4. **Retour:** Encapsule les 3 réponses dans `PipelineResponse`

**MODIFICATION EXISTANTE :**
```java
// L'ancienne méthode processClaim() est maintenant un wrapper :
public NvidiaResponse processClaim(...) {
    PipelineResponse pipeline = processClaimWithIntermediateSteps(...);
    return pipeline.isSuccess() ? pipeline.getFinalDecisionResponse() 
                                : NvidiaResponse.error(...);
}
```

---

#### `OrchestratorAgent.java` — Orchestrateur

**NOUVELLE MÉTHODE :**
```java
public ClaimAnalysisResult processClaimWithIntermediateResults(
    String userMessage,
    MultipartFile imageFile,
    String contractContent,
    String claimType,
    String supportingDocumentsText,
    String insuredId,
    String preClaimAnalysis,
    String preImageAnalysis)
```

**Flux :**
1. Si pré-analyses fournies → mode synthèse finale rapide
2. Sinon → **appelle `claimOrchestrationService.processClaimWithIntermediateSteps()`**
3. Extrait les contenus JSON de chaque `NvidiaResponse`
4. Retourne `ClaimAnalysisResult` avec toutes les étapes

**MODIFICATION EXISTANTE :**
```java
// L'ancienne méthode processClaim() reste pour backward compatibility :
public String processClaim(...) {
    ClaimAnalysisResult result = processClaimWithIntermediateResults(...);
    return result.getSynthesisForDisplay(); // Retourne juste la synthèse
}
```

---

#### `SinistreService.java` — Déclaration

**MODIFICATION :**
```java
// Avant :
String aiAnalysis = orchestratorAgent.processClaim(...);
sinistre.setAiAnalysis(aiAnalysis);

// Après :
ClaimAnalysisResult analysisResult = orchestratorAgent.processClaimWithIntermediateResults(...);
sinistre.setAiAnalysis(analysisResult.getSynthesisForDisplay());
sinistre.setPreClaimAnalysis(analysisResult.getClaimAgentAnalysis());
sinistre.setPreImageAnalysis(analysisResult.getVisionAgentAnalysis());
```

---

### 3. **Modèle de Données (MongoDB)**

```javascript
// Collection: sinistres
{
  _id: ObjectId,
  cinUtilisateur: "12345678",
  numeroContrat: "CTR-2025-001",
  typeSinistre: "AUTO",
  dateIncident: ISODate("2025-01-15"),
  
  // ✅ NOUVELLES COLONNES :
  preClaimAnalysis: {
    // JSON brut du Claim Agent (Step 1)
    "claimValidity": "VALID",
    "coveragePercentage": 85,
    "detectedDamages": ["pare-brise", "aile avant"],
    ...
  },
  
  preImageAnalysis: {
    // JSON brut du Vision Agent (Step 2)
    "damageDetection": "HIGH_CONFIDENCE",
    "estimatedSeverity": "MODERATE",
    "damagedAreas": [...],
    ...
  },
  
  aiAnalysis: {
    // JSON enrichi du Orchestrator (Step 3) — synthèse finale
    "finalDecision": "MANUAL_REVIEW",
    "finalIndemnificationAmount": 2500,
    "scoreConfiance": 0.78,
    ...
  },
  
  // ✅ CONTEXTE UTILISÉ :
  contractContextUsed: "Texte du contrat fourni à l'IA",
  supportingDocumentsExtract: "Texte des documents justificatifs"
}
```

---

## 🔄 Flux Complet d'une Déclaration

```
utilisateur.declarer() 
    ↓
SinistreController.declarer() 
    ↓
SinistreService.declarerSinistre()
    ├─ Récupère le contrat
    ├─ Construit le bloc de déclaration
    ├─ Appelle orchestratorAgent.processClaimWithIntermediateResults()
    │   ├─ Encode l'image en base64
    │   ├─ Appelle claimOrchestrationService.processClaimWithIntermediateSteps()
    │   │   ├─ Step 1: runClaimAnalysisStep() 
    │   │   │   └─ Claim Agent analyse texte + contrat
    │   │   │   └─ Retourne: NvidiaResponse(claimAgentJSON)
    │   │   ├─ Step 2: runImageAnalysis()
    │   │   │   └─ Vision Agent analyse image
    │   │   │   └─ Retourne: NvidiaResponse(visionAgentJSON)
    │   │   ├─ Step 3: runOrchestratorStep()
    │   │   │   └─ Orchestrator synthétise Step 1 + Step 2
    │   │   │   └─ Retourne: NvidiaResponse(orchestratorJSON enrichi)
    │   │   └─ Retourne: PipelineResponse(step1, step2, step3)
    │   ├─ Extrait les 3 JSON
    │   └─ Retourne: ClaimAnalysisResult(claimAgent, visionAgent, orchestrator, synthesis)
    ├─ Crée Sinistre document
    ├─ Persiste preClaimAnalysis ← de analysisResult.getClaimAgentAnalysis()
    ├─ Persiste preImageAnalysis ← de analysisResult.getVisionAgentAnalysis()
    ├─ Persiste aiAnalysis ← de analysisResult.getSynthesisForDisplay()
    └─ Retourne Sinistre persisté avec toutes les analyses
```

---

## 📊 Persistance des Analyses

### Avant (PERDU)
```
Pipeline AI produit :
  [Step 1: Claim Agent] → détecte dommages, couverture, franchise
  [Step 2: Vision Agent] → analyse image, sévérité
  [Step 3: Orchestrator] → synthèse finale seule persistée

Résultat BD : ONLY `aiAnalysis` = synthèse finale
```

### Après (COMPLÈTE)
```
Pipeline AI produit :
  [Step 1: Claim Agent] → détecte dommages, couverture, franchise
  [Step 2: Vision Agent] → analyse image, sévérité
  [Step 3: Orchestrator] → synthèse finale

Résultat BD :
  ✅ `preClaimAnalysis` = Step 1 JSON complet
  ✅ `preImageAnalysis` = Step 2 JSON complet
  ✅ `aiAnalysis` = Step 3 JSON enrichi (synthèse)
```

---

## 🎯 Avantages

1. **Audit Trail Complet** : Traçabilité de chaque décision d'agent
2. **Debugging Facilité** : Localiser où s'est produit le problème (quel agent)
3. **Apprentissage** : Analyser les différences entre Step 1, 2, et Step 3
4. **Décisions Manuelles** : Agents ont accès aux analyses brutes pour révision
5. **Compliance** : Documentation complète du processus de décision d'indemnisation

---

## 🔧 Backward Compatibility

### Changements de Signature

| Méthode | Avant | Après | Backward Compatible? |
|---------|-------|-------|----------------------|
| `orchestratorAgent.processClaim()` | Retourne `String` | Retourne `String` | ✅ OUI |
| `orchestratorAgent.processClaimWithIntermediateResults()` | N/A | Retourne `ClaimAnalysisResult` | ✅ NEW API |
| `claimOrchestrationService.processClaim()` | Retourne `NvidiaResponse` | Retourne `NvidiaResponse` | ✅ OUI |
| `claimOrchestrationService.processClaimWithIntermediateSteps()` | N/A | Retourne `PipelineResponse` | ✅ NEW API |

**Code existant non affecté :** Les anciennes signatures restent fonctionnelles.

---

## 📈 Performance

- **Coût Additionnel** : Aucun — les 3 étapes existent déjà, juste encapsulées différemment
- **Stockage** : ~3-5 KB additionnel par sinistre (analyses JSON)
- **Latence** : Identique (appels réseau identiques)

---

## ✅ Validation

✅ Backend compile sans erreur (91 fichiers source)  
✅ Backward compatibility maintenue  
✅ Toutes les étapes persistées en MongoDB  
✅ Synthèse finale reste disponible pour affichage utilisateur  
✅ Agents peuvent accéder aux analyses détaillées pour décisions

