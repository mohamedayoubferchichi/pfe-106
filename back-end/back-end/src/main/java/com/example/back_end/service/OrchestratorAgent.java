package com.example.back_end.service;

import com.example.back_end.dto.NvidiaResponse;
import com.example.back_end.dto.PipelineResponse;
import com.example.back_end.dto.ClaimAnalysisResult;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class OrchestratorAgent {

    public static class AiUnavailableException extends RuntimeException {
        public AiUnavailableException(String message) {
            super(message);
        }
    }

    private final ClaimOrchestrationService claimOrchestrationService;

    public OrchestratorAgent(ClaimOrchestrationService claimOrchestrationService) {
        this.claimOrchestrationService = claimOrchestrationService;
    }

    /**
     * Déclaration sans pré-analyses persistées : pipeline complet (3 agents).
     * Retourne une chaîne JSON pour la synthèse finale (backward compatibility).
     */
    public String processClaim(String userMessage, org.springframework.web.multipart.MultipartFile imageFile,
            String contractContent, String claimType, String supportingDocumentsText, String insuredId) {
        return processClaim(userMessage, imageFile, contractContent, claimType, supportingDocumentsText, insuredId, null,
                null);
    }

    /**
     * Si {@code preClaimAnalysis} ou {@code preImageAnalysis} sont fournis : une seule étape de synthèse
     * combine les sorties des APIs analyze-claim / analyze-image. Sinon : pipeline complet.
     *
     * Le contenuContrat est récupéré directement depuis la base de données via le numéro de contrat.
     * Plus besoin de constat amiable : l'IA analyse le contrat officiel en base.
     *
     * @param insuredId CIN ou identifiant assuré
     * @return Chaîne JSON de la synthèse finale (pour backward compatibility)
     */
    public String processClaim(String userMessage, org.springframework.web.multipart.MultipartFile imageFile,
            String contractContent, String claimType, String supportingDocumentsText, String insuredId,
            String preClaimAnalysis, String preImageAnalysis) {

        ClaimAnalysisResult result = processClaimWithIntermediateResults(userMessage, imageFile, contractContent,
                claimType, supportingDocumentsText, insuredId, preClaimAnalysis, preImageAnalysis);
        return result.getSynthesisForDisplay();
    }

    /**
     * Retourne toutes les étapes intermédiaires du pipeline (Claim Agent, Vision Agent, Orchestrator).
     * Cette méthode capture les analyses complètes pour persistance en base de données.
     */
    public ClaimAnalysisResult processClaimWithIntermediateResults(
            String userMessage, org.springframework.web.multipart.MultipartFile imageFile,
            String contractContent, String claimType, String supportingDocumentsText, String insuredId,
            String preClaimAnalysis, String preImageAnalysis) {

        try {
            String id = StringUtils.hasText(insuredId) ? insuredId : "unknown";
            String support = supportingDocumentsText != null ? supportingDocumentsText : "";

            boolean usePreAnalyses = StringUtils.hasText(preClaimAnalysis)
                    || StringUtils.hasText(preImageAnalysis);

            if (usePreAnalyses) {
                // Mode synthèse finale avec pré-analyses
                NvidiaResponse finalDecision = claimOrchestrationService.processFinalSynthesisFromPreAnalyses(
                        userMessage, claimType, contractContent, id, support, preClaimAnalysis, preImageAnalysis);

                if (finalDecision.isSuccess()) {
                    return new ClaimAnalysisResult(
                            preClaimAnalysis,
                            preImageAnalysis,
                            finalDecision.getContent(),
                            finalDecision.getContent());
                }

                throw new AiUnavailableException(finalDecision.getErrorMessage() != null
                        ? finalDecision.getErrorMessage()
                        : "ERROR_AI_UNAVAILABLE");

            } else {
                // Pipeline complet 3 agents avec capture des étapes intermédiaires
                String imageBase64 = null;
                String imageMime = null;
                if (imageFile != null && !imageFile.isEmpty()) {
                    imageBase64 = java.util.Base64.getEncoder().encodeToString(imageFile.getBytes());
                    imageMime = imageFile.getContentType();
                }

                // Utilise la nouvelle méthode pour capturer toutes les étapes
                PipelineResponse pipelineResponse = claimOrchestrationService.processClaimWithIntermediateSteps(
                        userMessage, claimType, contractContent, "", "", imageBase64, imageMime, id, support);

                if (pipelineResponse.isSuccess()) {
                    String claimAgentAnalysis = pipelineResponse.getClaimAnalysisResponse() != null
                            ? pipelineResponse.getClaimAnalysisResponse().getContent()
                            : null;
                    String visionAgentAnalysis = pipelineResponse.getVisionAnalysisResponse() != null
                            ? pipelineResponse.getVisionAnalysisResponse().getContent()
                            : null;
                    String finalDecisionContent = pipelineResponse.getFinalDecisionResponse().getContent();

                    return new ClaimAnalysisResult(
                            claimAgentAnalysis,
                            visionAgentAnalysis,
                            finalDecisionContent,
                            finalDecisionContent);
                }

                String errorMessage = pipelineResponse.getFinalDecisionResponse() != null
                        ? pipelineResponse.getFinalDecisionResponse().getErrorMessage()
                        : "ERROR_AI_UNAVAILABLE";
                throw new AiUnavailableException(errorMessage != null ? errorMessage : "ERROR_AI_UNAVAILABLE");
            }

        } catch (Exception e) {
            throw new AiUnavailableException("ERROR_AI_UNAVAILABLE: " + e.getClass().getSimpleName());
        }
    }
}
