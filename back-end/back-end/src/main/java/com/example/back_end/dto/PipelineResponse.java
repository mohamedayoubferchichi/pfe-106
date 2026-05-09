package com.example.back_end.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Complete pipeline response containing all 3 agent outputs: Claim Analysis, Vision/Image, and Final Decision.
 * Used internally by ClaimOrchestrationService to capture intermediate steps.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PipelineResponse {

    /** NvidiaResponse from Step 1: Claim Analysis Agent */
    private NvidiaResponse claimAnalysisResponse;

    /** NvidiaResponse from Step 2: Vision/Image Agent (may be null if no image) */
    private NvidiaResponse visionAnalysisResponse;

    /** NvidiaResponse from Step 3: Final Orchestrator Agent */
    private NvidiaResponse finalDecisionResponse;

    public PipelineResponse(
            NvidiaResponse claimAnalysisResponse,
            NvidiaResponse visionAnalysisResponse,
            NvidiaResponse finalDecisionResponse) {
        this.claimAnalysisResponse = claimAnalysisResponse;
        this.visionAnalysisResponse = visionAnalysisResponse;
        this.finalDecisionResponse = finalDecisionResponse;
    }

    public PipelineResponse() {
    }

    public NvidiaResponse getClaimAnalysisResponse() {
        return claimAnalysisResponse;
    }

    public void setClaimAnalysisResponse(NvidiaResponse claimAnalysisResponse) {
        this.claimAnalysisResponse = claimAnalysisResponse;
    }

    public NvidiaResponse getVisionAnalysisResponse() {
        return visionAnalysisResponse;
    }

    public void setVisionAnalysisResponse(NvidiaResponse visionAnalysisResponse) {
        this.visionAnalysisResponse = visionAnalysisResponse;
    }

    public NvidiaResponse getFinalDecisionResponse() {
        return finalDecisionResponse;
    }

    public void setFinalDecisionResponse(NvidiaResponse finalDecisionResponse) {
        this.finalDecisionResponse = finalDecisionResponse;
    }

    public boolean isSuccess() {
        return finalDecisionResponse != null && finalDecisionResponse.isSuccess();
    }
}
