# API de Gestion des Sinistres par Agents — Utilisation des Analyses Complètes

## Endpoint: GET /api/agent/sinistres/{agenceId}

**Description:** Récupère tous les sinistres associés aux contrats de l'agence avec **TOUTES les analyses**.

### Réponse

```json
{
  "sinistres": [
    {
      "id": "65f8a9e3c1d2e4f5a6b7c8d9",
      "cinUtilisateur": "12345678",
      "numeroContrat": "CTR-2025-001",
      "typeSinistre": "AUTO",
      "description": "Accident automobile au carrefour...",
      "dateIncident": "2025-01-15T14:30:00",
      "lieuIncident": "Rue de la Paix, Tunis",
      "statut": "PENDING",
      "scoreConfiance": 0.78,
      "imageUrl": "uploads/claim-001.jpg",
      
      "preClaimAnalysis": {
        "claimValidity": "VALID",
        "coverageEligibility": "ELIGIBLE",
        "coveragePercentageApplied": 85,
        "detectedDamages": [
          "pare-brise",
          "aile avant",
          "phare avant"
        ],
        "estimatedAmount": 2500,
        "fraudRiskLevel": "LOW",
        "shortJustification": "Dégâts visibles cohérents avec sinistre automobile déclaré"
      },
      
      "preImageAnalysis": {
        "damageDetectionConfidence": 0.92,
        "estimatedSeverity": "MODERATE",
        "damagedAreas": [
          {
            "part": "pare-brise",
            "severity": "HIGH",
            "location": "avant gauche"
          },
          {
            "part": "aile avant",
            "severity": "MODERATE",
            "location": "côté conducteur"
          }
        ],
        "visibleEvidence": "Impacts de verre, déformation de l'aile, peinture écaillée",
        "estimatedRepairCost": 2800
      },
      
      "aiAnalysis": {
        "finalDecision": "MANUAL_REVIEW",
        "finalIndemnificationAmount": 2375,
        "currency": "TND",
        "globalConfidenceScore": 0.78,
        "detectedDamages": ["pare-brise", "aile avant", "phare avant"],
        "contractMatchedItems": [
          {
            "damage": "pare-brise",
            "contractItem": "pare-brise (toutes directions)",
            "priceTnd": 750,
            "included": true
          },
          {
            "damage": "aile avant",
            "contractItem": "aile carrosserie",
            "priceTnd": 1200,
            "included": true
          },
          {
            "damage": "phare avant",
            "contractItem": "phare avant",
            "priceTnd": 425,
            "included": true
          }
        ],
        "fraudRiskLevel": "LOW",
        "insuredNotification": {
          "subject": "Revue manuelle requise",
          "body": "Un montant provisoire a été calculé selon votre contrat: 2375 TND. Un expert va confirmer le dossier."
        },
        "internalAuditNote": "Diagnostic calcul: contratsPrix=15, includedItems=3, sommeIncluse=2375.00..."
      },
      
      "contractContextUsed": "CONTRAT AUTO ASSURGO 2025\nGaranties:\n- Responsabilité Civile: Obligatoire\n- Dommages Collision: 500,000 TND\n- Pare-brise: 750 TND\n- Aile carrosserie: 1200 TND...",
      
      "supportingDocumentsExtract": "Document 1: Constat amiable signé par les deux parties\nDocument 2: Photos de dégâts avant et après...",
      
      "pieceJointesNoms": ["constat_amiable.pdf", "photos_degats.jpg"]
    }
  ]
}
```

---

## Endpoint: GET /api/agent/sinistres/{id}

**Description:** Récupère les **détails complets** d'un sinistre incluant toutes les analyses.

### Utilisation dans AgentPage.jsx

```jsx
// 1. Charger les sinistres
const loadSinistres = async () => {
  const response = await axios.get(`/api/agent/sinistres/${agenceId}`);
  setSinistres(response.data.sinistres);
};

// 2. Afficher la liste avec recherche
<table>
  <thead>
    <tr>
      <th>Numéro Contrat</th>
      <th>CIN</th>
      <th>Type</th>
      <th>Date</th>
      <th>Statut</th>
      <th>Score IA</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {sinistres.map(s => (
      <tr key={s.id}>
        <td>{s.numeroContrat}</td>
        <td>{s.cinUtilisateur}</td>
        <td>{s.typeSinistre}</td>
        <td>{formatDate(s.dateIncident)}</td>
        <td><StatusBadge status={s.statut}/></td>
        <td>{Math.round(s.scoreConfiance * 100)}%</td>
        <td>
          <Button onClick={() => showDetailModal(s)}>Détails</Button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

// 3. Modal Détails avec toutes les analyses
const DetailModal = ({ sinistre }) => (
  <Modal>
    <Tabs>
      
      <Tab label="Synthèse Finale">
        <Card>
          <h3>Décision: {sinistre.aiAnalysis.finalDecision}</h3>
          <p>Montant: {sinistre.aiAnalysis.finalIndemnificationAmount} TND</p>
          <p>Confiance: {Math.round(sinistre.aiAnalysis.globalConfidenceScore * 100)}%</p>
          <p>Risque Fraude: {sinistre.aiAnalysis.fraudRiskLevel}</p>
          <PreAnalysisCard 
            title="Notification Assuré"
            content={sinistre.aiAnalysis.insuredNotification}
          />
        </Card>
      </Tab>
      
      <Tab label="Analyse Texte (Agent 1)">
        <Card>
          <h3>Analyse du Sinistre</h3>
          <PreAnalysisCard 
            title="Validité & Éligibilité"
            response={sinistre.preClaimAnalysis}
          />
          <div>
            <strong>Dommages Détectés:</strong>
            <ul>
              {sinistre.preClaimAnalysis.detectedDamages?.map(d => 
                <li key={d}>{d}</li>
              )}
            </ul>
          </div>
          <div>
            <strong>Couverture:</strong> {sinistre.preClaimAnalysis.coveragePercentageApplied}%
          </div>
          <div>
            <strong>Montant Estimé:</strong> {sinistre.preClaimAnalysis.estimatedAmount} TND
          </div>
        </Card>
      </Tab>
      
      <Tab label="Analyse Image (Agent 2)">
        <Card>
          <h3>Analyse des Dégâts</h3>
          {sinistre.imageUrl && (
            <img 
              src={sinistre.imageUrl} 
              alt="Dégâts"
              style={{maxWidth: '100%', maxHeight: '400px'}}
            />
          )}
          <PreAnalysisCard 
            title="Détection Visuelle"
            response={sinistre.preImageAnalysis}
          />
          <div>
            <strong>Zones Endommagées:</strong>
            <ul>
              {sinistre.preImageAnalysis.damagedAreas?.map((area, i) => 
                <li key={i}>
                  {area.part} - Sévérité: {area.severity} ({area.location})
                </li>
              )}
            </ul>
          </div>
          <div>
            <strong>Confiance Détection:</strong> {Math.round(sinistre.preImageAnalysis.damageDetectionConfidence * 100)}%
          </div>
        </Card>
      </Tab>
      
      <Tab label="Réconciliation Contrat">
        <Card>
          <h3>Postes Contractuels Appariés</h3>
          <table>
            <thead>
              <tr>
                <th>Dommage</th>
                <th>Poste Contrat</th>
                <th>Prix TND</th>
                <th>Inclus</th>
              </tr>
            </thead>
            <tbody>
              {sinistre.aiAnalysis.contractMatchedItems?.map((item, i) => (
                <tr key={i} style={{backgroundColor: item.included ? '#c8e6c9' : '#ffcdd2'}}>
                  <td>{item.damage}</td>
                  <td>{item.contractItem}</td>
                  <td>{item.priceTnd}</td>
                  <td>{item.included ? '✓' : '✗'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <strong style={{fontSize: '18px', color: '#00695c'}}>
            Total Inclus: {sinistre.aiAnalysis.finalIndemnificationAmount} TND
          </strong>
        </Card>
      </Tab>
      
      <Tab label="Contexte Utilisé">
        <Card>
          <h3>Contrat Fourni à l'IA</h3>
          <textarea 
            readOnly 
            value={sinistre.contractContextUsed}
            style={{width: '100%', height: '300px'}}
          />
          
          <h3>Documents Justificatifs</h3>
          <textarea 
            readOnly 
            value={sinistre.supportingDocumentsExtract}
            style={{width: '100%', height: '200px'}}
          />
        </Card>
      </Tab>
      
    </Tabs>
    
    <StatusUpdateButtons 
      sinistre={sinistre}
      onStatusChange={handleStatusUpdate}
    />
  </Modal>
);
```

---

## Endpoint: PATCH /api/agent/sinistres/{id}/statut

**Description:** Met à jour le statut d'un sinistre (Agent Workflow).

### Requête

```json
{
  "statut": "APPROVED",
  "notes": "Approuvé après révision manuelle. Tous les postes contractuels confirmés."
}
```

### Réponse

```json
{
  "id": "65f8a9e3c1d2e4f5a6b7c8d9",
  "statut": "APPROVED",
  "updatedAt": "2025-01-20T10:45:00",
  "updatedBy": "agent@assurgo.tn"
}
```

### États Possibles

| Statut | Signification | Peut être défini par Agent |
|--------|---------------|---------------------------|
| `PENDING` | En attente d'examen | ❌ (défaut) |
| `APPROVED` | Approuvé pour paiement | ✅ |
| `REJECTED` | Rejeté (non couvert) | ✅ |
| `CLOSED` | Clos (paiement effectué) | ✅ |

---

## Utilité pour les Agents

### 1. **Audit Trail Complet**
Agent peut tracer chaque décision :
- Step 1: "Quels dommages ont été détectés dans le texte ?"
- Step 2: "La photo confirme-t-elle ces dommages ?"
- Step 3: "Comment l'IA a synthétisé les deux ?"

### 2. **Désaccords Agent-IA**
Si l'agent n'est pas d'accord avec la décision finale :
```
Agent voit :
- preClaimAnalysis dit: "3 dommages"
- preImageAnalysis dit: "Seulement 2 dommages visibles"
- aiAnalysis dit: "MANUAL_REVIEW (3 dommages)"

Agent peut décider : "Je vais REJECT car l'image confirme seulement 2 dommages"
```

### 3. **Approbation Rapide**
Si confiance élevée et analyses concordantes :
```
Agent voit :
- scoreConfiance: 0.95 ✅
- preClaimAnalysis et preImageAnalysis: D'accord ✅
- aiAnalysis: MANUAL_REVIEW (conservateur) ✅

Agent peut : "Je confirme APPROVED (j'accepte la recommandation)"
```

### 4. **Révision de Doute**
Si analyses conflictuelles :
```
Agent voit :
- preClaimAnalysis: "Couverture: 100%"
- preImageAnalysis: "Sévérité: SEVERE (coûteux)"
- aiAnalysis: "Montant: 8500 TND" 

Agent : "Je vais demander expertise externe → MANUAL_REVIEW confirmé"
```

---

## Structure MongoDB — Requête Agent

```javascript
db.sinistres.find({
  numeroContrat: { $in: agencyContractNumbers },
  statut: "PENDING"
}).projection({
  preClaimAnalysis: 1,
  preImageAnalysis: 1,
  aiAnalysis: 1,
  contractContextUsed: 1,
  supportingDocumentsExtract: 1
})
```

---

## Cas d'Usage: Workflow Complet

### Scénario: Sinistre AUTO — Pare-brise cassé

**1. Utilisateur déclare**
```
POST /api/sinistres/declarer
{
  typeSinistre: "AUTO",
  description: "Pare-brise cassé par caillou route",
  numeroContrat: "CTR-2025-001",
  image: <photo pare-brise cassé>
}
```

**2. Pipeline AI s'exécute**
```
Step 1 (Claim Agent):
  ✅ Détecte: "pare-brise"
  ✅ Couverture: "100%"
  ✅ Montant estimé: "750 TND"

Step 2 (Vision Agent):
  ✅ Détecte visuellement: "pare-brise cassé"
  ✅ Localisation: "avant, côté conducteur"
  ✅ Sévérité: "HIGH"

Step 3 (Orchestrator):
  ✅ Réconcilie contrat: "pare-brise: 750 TND = inclus"
  ✅ Décision: "AUTO_APPROVED"
  ✅ Montant final: "750 TND"
```

**3. Sinistre persisté en BD avec TOUT**
```
{
  preClaimAnalysis: { "couverture": "100%", "montant": 750, ... },
  preImageAnalysis: { "localisation": "avant", "severite": "HIGH", ... },
  aiAnalysis: { "finalDecision": "AUTO_APPROVED", "montant": 750, ... }
}
```

**4. Agent examine dans AgentPage**
```
Agent voit:
  - Synthèse IA: AUTO_APPROVED, 750 TND
  - Tab "Analyse Texte": Valide, couverture OK
  - Tab "Analyse Image": Dégâts confirmés visuellement
  - Tab "Réconciliation": Contrat appair

e correctement
  
Agent peut:
  - Cliquer "Détails" → voir toutes les analyses
  - Confirmer → APPROVED
  - Ou rejeter si doute
```

**5. Sinistre transmis à paiement**
```
statut: "APPROVED"
Les données complètes permettent traçabilité totale
```

---

## Performance & Stockage

| Métrique | Avant | Après | Impact |
|----------|-------|-------|--------|
| Taille sinistre BD | ~2 KB | ~8 KB | +300% (acceptable) |
| Latence requête | Identique | Identique | 0% |
| Latence stockage | Identique | Identique | 0% |
| Complexité requête Agent | Simple | Moderate (3 JSON à lire) | ✅ Valeur > Coût |

