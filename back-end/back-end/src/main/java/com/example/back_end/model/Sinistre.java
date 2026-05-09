package com.example.back_end.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "sinistres")
public class Sinistre {

    @Id
    private String id;
    private String cinUtilisateur;
    private String numeroContrat;
    private String typeSinistre; // Nom de la catégorie identifiée (Bris de glace, Accident, etc.)
    private String description;
    private LocalDateTime dateIncident;
    private String lieuIncident;
    private String statut; // PENDING, APPROVED, REJECTED
    private String aiAnalysis; // Synthèse de l'Orchestrateur
    private String preClaimAnalysis;
    private String preImageAnalysis;
    private String supportingDocumentsExtract;
    private String contractContextUsed;
    private int scoreConfiance;
    // New structured fields extracted from orchestrator result for UI and audit
    private String finalDecision;
    private String fraudRiskLevel;
    private Double finalIndemnificationAmount;
    private String currency;
    private Double coveragePercentageApplied;
    private Boolean indemnificationApproved;
    private String executiveSummary;
    private List<String> synthesisBullets;
    private String orchestratorFinalDecision;
    private String processingNotes;
    private String imageUrl;
    /** Noms des fichiers documents joints à la déclaration */
    private List<String> pieceJointesNoms;
    private List<String> imageJointesNoms;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCinUtilisateur() {
        return cinUtilisateur;
    }

    public void setCinUtilisateur(String cinUtilisateur) {
        this.cinUtilisateur = cinUtilisateur;
    }

    public String getNumeroContrat() {
        return numeroContrat;
    }

    public void setNumeroContrat(String numeroContrat) {
        this.numeroContrat = numeroContrat;
    }

    public String getTypeSinistre() {
        return typeSinistre;
    }

    public void setTypeSinistre(String typeSinistre) {
        this.typeSinistre = typeSinistre;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getDateIncident() {
        return dateIncident;
    }

    public void setDateIncident(LocalDateTime dateIncident) {
        this.dateIncident = dateIncident;
    }

    public String getLieuIncident() {
        return lieuIncident;
    }

    public void setLieuIncident(String lieuIncident) {
        this.lieuIncident = lieuIncident;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public String getAiAnalysis() {
        return aiAnalysis;
    }

    public void setAiAnalysis(String aiAnalysis) {
        this.aiAnalysis = aiAnalysis;
    }

    public String getPreClaimAnalysis() {
        return preClaimAnalysis;
    }

    public void setPreClaimAnalysis(String preClaimAnalysis) {
        this.preClaimAnalysis = preClaimAnalysis;
    }

    public String getPreImageAnalysis() {
        return preImageAnalysis;
    }

    public void setPreImageAnalysis(String preImageAnalysis) {
        this.preImageAnalysis = preImageAnalysis;
    }

    public String getSupportingDocumentsExtract() {
        return supportingDocumentsExtract;
    }

    public void setSupportingDocumentsExtract(String supportingDocumentsExtract) {
        this.supportingDocumentsExtract = supportingDocumentsExtract;
    }

    public String getContractContextUsed() {
        return contractContextUsed;
    }

    public void setContractContextUsed(String contractContextUsed) {
        this.contractContextUsed = contractContextUsed;
    }

    public int getScoreConfiance() {
        return scoreConfiance;
    }

    public void setScoreConfiance(int scoreConfiance) {
        this.scoreConfiance = scoreConfiance;
    }

    public String getFinalDecision() {
        return finalDecision;
    }

    public void setFinalDecision(String finalDecision) {
        this.finalDecision = finalDecision;
    }

    public String getFraudRiskLevel() {
        return fraudRiskLevel;
    }

    public void setFraudRiskLevel(String fraudRiskLevel) {
        this.fraudRiskLevel = fraudRiskLevel;
    }

    public Double getFinalIndemnificationAmount() {
        return finalIndemnificationAmount;
    }

    public void setFinalIndemnificationAmount(Double finalIndemnificationAmount) {
        this.finalIndemnificationAmount = finalIndemnificationAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Double getCoveragePercentageApplied() {
        return coveragePercentageApplied;
    }

    public void setCoveragePercentageApplied(Double coveragePercentageApplied) {
        this.coveragePercentageApplied = coveragePercentageApplied;
    }

    public Boolean getIndemnificationApproved() {
        return indemnificationApproved;
    }

    public void setIndemnificationApproved(Boolean indemnificationApproved) {
        this.indemnificationApproved = indemnificationApproved;
    }

    public String getExecutiveSummary() {
        return executiveSummary;
    }

    public void setExecutiveSummary(String executiveSummary) {
        this.executiveSummary = executiveSummary;
    }

    public List<String> getSynthesisBullets() {
        return synthesisBullets;
    }

    public void setSynthesisBullets(List<String> synthesisBullets) {
        this.synthesisBullets = synthesisBullets;
    }

    public String getOrchestratorFinalDecision() {
        return orchestratorFinalDecision;
    }

    public void setOrchestratorFinalDecision(String orchestratorFinalDecision) {
        this.orchestratorFinalDecision = orchestratorFinalDecision;
    }

    public String getProcessingNotes() {
        return processingNotes;
    }

    public void setProcessingNotes(String processingNotes) {
        this.processingNotes = processingNotes;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public List<String> getPieceJointesNoms() {
        return pieceJointesNoms;
    }

    public void setPieceJointesNoms(List<String> pieceJointesNoms) {
        this.pieceJointesNoms = pieceJointesNoms;
    }

    public List<String> getImageJointesNoms() {
        return imageJointesNoms;
    }

    public void setImageJointesNoms(List<String> imageJointesNoms) {
        this.imageJointesNoms = imageJointesNoms;
    }
}
