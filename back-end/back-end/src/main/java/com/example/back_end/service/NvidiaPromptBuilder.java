package com.example.back_end.service;

import com.example.back_end.dto.NvidiaRequest;
import org.springframework.stereotype.Component;

/**
 * Builds the final user-facing prompt by injecting RAG context,
 * contract summaries, legal documents, and claim metadata into
 * a structured template that the LLM can reliably parse.
 */
@Component
public class NvidiaPromptBuilder {

    /**
     * Builds the full user message for the CLAIM_ANALYSIS agent.
     */
    public String buildClaimAnalysisPrompt(NvidiaRequest req) {
        StringBuilder sb = new StringBuilder();

        if (req.getUserPrompt() != null && !req.getUserPrompt().isBlank()) {
            sb.append("=== INSURED'S CLAIM DECLARATION ===\n");
            sb.append(req.getUserPrompt()).append("\n\n");
        }

        sb.append("=== CLAIM TYPE ===\n");
        sb.append(req.getClaimType() != null ? req.getClaimType() : "UNSPECIFIED").append("\n\n");

        if (req.getContractSummary() != null && !req.getContractSummary().isBlank()) {
            sb.append("=== INSURED'S CONTRACT SUMMARY (BASE OFFICIELLE) ===\n");
            sb.append(req.getContractSummary()).append("\n\n");
            sb.append("RÈGLE: si un fichier contrat uploadé existe ailleurs dans le dossier, ignore-le et utilise uniquement ce contrat officiel en base.\n\n");
        }

        if (req.getLegalDocumentText() != null && !req.getLegalDocumentText().isBlank()) {
            sb.append("=== APPLICABLE LEGAL FRAMEWORK ===\n");
            sb.append(req.getLegalDocumentText()).append("\n\n");
        }

        if (req.getSupportingDocumentsText() != null && !req.getSupportingDocumentsText().isBlank()) {
            sb.append("=== PIÈCES & RÉFÉRENCES DOCUMENTAIRES (ASSURGO + ASSURÉ) ===\n");
            sb.append(req.getSupportingDocumentsText()).append("\n\n");
        }

        if (req.getRagContext() != null && !req.getRagContext().isBlank()) {
            sb.append("=== MOST RELEVANT RETRIEVED PASSAGES (RAG) ===\n");
            sb.append(req.getRagContext()).append("\n\n");
        }

        sb.append("\n\n---\n");
        sb.append("Based on ALL the above information, produce your JSON analysis now. ");
        sb.append("The insured's declaration and the official contract summary are primary evidence; attachments are secondary evidence.");

        return sb.toString();
    }

    /**
     * Builds the user message for the IMAGE_DAMAGE_ANALYSIS agent.
     */
    public String buildImageAnalysisPrompt(NvidiaRequest req) {
        StringBuilder sb = new StringBuilder();

        sb.append("Please analyze the damage visible in the attached image.\n\n");
        sb.append("Claim context:\n");
        sb.append("- Claim type: ").append(req.getClaimType() != null ? req.getClaimType() : "UNSPECIFIED")
                .append("\n");

        if (req.getUserPrompt() != null && !req.getUserPrompt().isBlank()) {
            sb.append("- Insured's description: ").append(req.getUserPrompt()).append("\n");
        }

        sb.append("\nProvide your damage severity assessment as a JSON object per your instructions.");
        return sb.toString();
    }

    /**
     * Builds the orchestrator prompt: déclaration + pièces + JSON agents pour une synthèse cohérente.
     */
    public String buildOrchestratorPrompt(
            String insuredDeclaration,
            String claimAnalysisJson,
            String imageAnalysisJson,
            String claimType,
            String insuredId,
            String documentsExcerpt) {
        String safeDecl = insuredDeclaration != null && !insuredDeclaration.isBlank() ? insuredDeclaration : "(aucune description détaillée)";
        String safeDocs = documentsExcerpt != null && !documentsExcerpt.isBlank() ? documentsExcerpt
                : "(aucun texte extrait des pièces jointes)";
        String safeImage = imageAnalysisJson != null && !imageAnalysisJson.isBlank() ? imageAnalysisJson
                : "{\"note\":\"Pas d'analyse vision disponible\",\"severityLevel\":\"UNKNOWN\",\"confidenceScore\":0.0}";

        return "=== ASSURGO — DONNÉES BRUTES DU DOSSIER ===\n" +
                "Type de sinistre: " + (claimType != null ? claimType : "NON PRÉCISÉ") + "\n" +
                "Référence assuré / dossier (interne): " + (insuredId != null ? insuredId : "N/A") + "\n\n" +
                "=== DÉCLARATION DE L'ASSURÉ (champ texte formulaire) ===\n" +
                safeDecl + "\n\n" +
            "ATTENTION: la déclaration de l'assuré et le contrat officiel en base priment sur les pièces jointes si un écart existe.\n\n" +
                "=== EXTRAITS DES PIÈCES JOINTES (factures, constats, PDF, etc.) ===\n" +
                safeDocs + "\n\n" +
                "=== SORTIE AGENT COUVERTURE & CONTRAT (JSON) ===\n" +
                claimAnalysisJson + "\n\n" +
                "=== SORTIE AGENT ANALYSE PHOTO (JSON) ===\n" +
                safeImage + "\n\n" +
                "---\n" +
                "Tu es l'orchestrateur AssurGo : croise description, pièces et image. " +
                "Produis le JSON final (decision, scores, pourcentages et textes) en respectant tes règles de cohérence.";
    }

    /**
     * Même structure que {@link #buildOrchestratorPrompt} mais intitulés alignés avec la synthèse à partir des
     * pré-analyses ({@code CLAIM_ANALYSIS_RESULT} / {@code IMAGE_ANALYSIS_RESULT}).
     *
     * Le contenuContrat est inclus dans contractSummary, récupéré directement depuis la base de données.
     */
    public String buildFinalSynthesisFromPreAnalysesPrompt(
            String insuredDeclaration,
            String contractSummary,
            String claimAnalysisResultJson,
            String imageAnalysisResultJson,
            String claimTypeForDisplay,
            String insuredId,
            String documentsExcerpt) {
        String safeDecl = insuredDeclaration != null && !insuredDeclaration.isBlank() ? insuredDeclaration
                : "(aucune description détaillée)";
        String safeContract = contractSummary != null && !contractSummary.isBlank() ? contractSummary
            : "(résumé contrat indisponible)";
        String safeDocs = documentsExcerpt != null && !documentsExcerpt.isBlank() ? documentsExcerpt
                : "(aucun texte extrait des pièces jointes)";
        String claimSlot = claimAnalysisResultJson != null && !claimAnalysisResultJson.isBlank()
                ? claimAnalysisResultJson
                : "{\"source\":\"analyze-claim\",\"note\":\"Non disponible\"}";
        String imageSlot = imageAnalysisResultJson != null && !imageAnalysisResultJson.isBlank()
                ? imageAnalysisResultJson
                : "{\"source\":\"analyze-image\",\"note\":\"Non disponible\"}";

        return "=== ASSURGO — SYNTHÈSE FINALE (pré-analyses déjà produites) ===\n" +
                "Type de sinistre: " + (claimTypeForDisplay != null ? claimTypeForDisplay : "NON PRÉCISÉ") + "\n" +
                "Référence assuré / dossier (interne): " + (insuredId != null ? insuredId : "N/A") + "\n\n" +
                "=== DÉCLARATION DE L'ASSURÉ (champ texte formulaire) ===\n" +
                safeDecl + "\n\n" +
                "=== CONTRAT DE L'ASSURÉ (BASE OFFICIELLE — contenuContrat) ===\n" +
                safeContract + "\n\n" +
                "RÈGLE: Le contrat officiel en base (contenuContrat) est la source de vérité. " +
                "Si un contrat uploadé est présent dans les pièces jointes, il ne doit pas remplacer le contrat officiel.\n\n" +
                "=== EXTRAITS DES PIÈCES JOINTES (factures, photos, PDF, etc.) ===\n" +
                safeDocs + "\n\n" +
                "=== CLAIM_ANALYSIS_RESULT (JSON — sortie analyze-claim, champ rawContent ou note) ===\n" +
                claimSlot + "\n\n" +
                "=== IMAGE_ANALYSIS_RESULT (JSON — sortie analyze-image, champ rawContent ou note) ===\n" +
                imageSlot + "\n\n" +
                "---\n" +
                "Produis l'objet JSON final demandé par le prompt système (executiveSummary obligatoire, champs décision). " +
                "Analyse le contrat officiel (contenuContrat) pour déterminer les garanties, exclusions, plafonds et franchises applicables. " +
                "Si la déclaration ou le contrat officiel contredisent les pièces jointes, donne priorité à la déclaration et au contrat officiel. " +
                "Si des montants numériques sont disponibles dans le contrat ou CLAIM_ANALYSIS_RESULT, " +
                "renseigne finalIndemnificationAmount avec un calcul cohérent (ne pas laisser null).";
    }

    /**
     * Builds the RAG ranker prompt.
     */
    public String buildRagRankerPrompt(String claimDescription, String[] chunks) {
        StringBuilder sb = new StringBuilder();
        sb.append("CLAIM DESCRIPTION:\n").append(claimDescription).append("\n\n");
        sb.append("CANDIDATE CHUNKS:\n");
        for (int i = 0; i < chunks.length; i++) {
            sb.append("[").append(i).append("] ").append(chunks[i]).append("\n\n");
        }
        sb.append("Rank the chunks by relevance to answering the coverage question for this claim.");
        return sb.toString();
    }
}
