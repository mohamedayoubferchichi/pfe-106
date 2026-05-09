package com.example.back_end.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Complete claim analysis result containing all intermediate stages from the orchestrator pipeline.
 * This structure preserves the Claim Agent, Vision Agent, and Final Orchestrator outputs.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ClaimAnalysisResult {

    /** Raw JSON response from Step 1: Claim Analysis Agent */
    private String claimAgentAnalysis;

    /** Raw JSON response from Step 2: Vision/Image Agent (may be null if no image) */
    private String visionAgentAnalysis;

    /** Raw JSON response from Step 3: Final Orchestrator Agent (synthesis + indemnification) */
    private String orchestratorFinalDecision;

    /** Concatenated analysis for backward compatibility / display */
    private String synthesisForDisplay;

    public ClaimAnalysisResult() {
    }

    public ClaimAnalysisResult(
            String claimAgentAnalysis,
            String visionAgentAnalysis,
            String orchestratorFinalDecision,
            String synthesisForDisplay) {
        this.claimAgentAnalysis = claimAgentAnalysis;
        this.visionAgentAnalysis = visionAgentAnalysis;
        this.orchestratorFinalDecision = orchestratorFinalDecision;
        this.synthesisForDisplay = synthesisForDisplay;
    }

    public String getClaimAgentAnalysis() {
        return claimAgentAnalysis;
    }

    public void setClaimAgentAnalysis(String claimAgentAnalysis) {
        this.claimAgentAnalysis = claimAgentAnalysis;
    }

    public String getVisionAgentAnalysis() {
        return visionAgentAnalysis;
    }

    public void setVisionAgentAnalysis(String visionAgentAnalysis) {
        this.visionAgentAnalysis = visionAgentAnalysis;
    }

    public String getOrchestratorFinalDecision() {
        return orchestratorFinalDecision;
    }

    public void setOrchestratorFinalDecision(String orchestratorFinalDecision) {
        this.orchestratorFinalDecision = orchestratorFinalDecision;
    }

    public String getSynthesisForDisplay() {
        return synthesisForDisplay;
    }

    public void setSynthesisForDisplay(String synthesisForDisplay) {
        this.synthesisForDisplay = synthesisForDisplay;
    }
}
