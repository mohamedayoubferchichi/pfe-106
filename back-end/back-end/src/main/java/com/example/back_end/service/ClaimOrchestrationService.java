package com.example.back_end.service;

import com.example.back_end.config.AssurGoSystemPrompts;
import com.example.back_end.config.NvidiaModel;
import com.example.back_end.config.NvidiaProperties;
import com.example.back_end.dto.NvidiaRequest;
import com.example.back_end.dto.NvidiaResponse;
import com.example.back_end.dto.PipelineResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * AssurGo Claim Orchestration Service — 3-agent pipeline with truncation, fast-model
 * retry, and structured JSON fallback when NVIDIA is unavailable.
 *
 * FIXES APPLIED (strict mode, as requested):
 * - Never accept LLM-proposed monetary amounts unless confirmed via contract catalog reconciliation.
 * - included defaults to FALSE unless explicitly true.
 * - Sum uses priceTnd ONLY (never coverageCapTnd/amountTnd).
 * - Reconciliation: item is included only if (contract match exists) AND (evidence mentions the damage).
 * - Notification respects finalDecision: AUTO_APPROVED => approved; MANUAL_REVIEW => manual review even if amount exists.
 */
@Service
public class ClaimOrchestrationService {

    private static final Logger log = LoggerFactory.getLogger(ClaimOrchestrationService.class);
    private static final ObjectMapper PRE_ANALYSIS_MAPPER = new ObjectMapper();

    private static final Pattern CONTRACT_COVERAGE_PATTERN = Pattern.compile(
            "(?:couverture|prise\\s+en\\s+charge|taux\\s+de\\s+remboursement)\\D{0,20}(\\d{1,3}(?:[\\.,]\\d+)?)\\s*%",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern CONTRACT_DEDUCTIBLE_PATTERN = Pattern.compile(
            "(?:franchise|deductible)\\D{0,20}(\\d{1,7}(?:[\\.,]\\d{1,2})?)\\s*(?:tnd|dt)?",
            Pattern.CASE_INSENSITIVE);

    private static final String AMOUNT_TOKEN = "(\\d{1,7}(?:[\\.,]\\d{1,2})?|\\d{1,3}(?:[\\s.,]\\d{3})+(?:[\\.,]\\d{1,2})?)";
    private static final String CURRENCY_TOKEN = "(?:tnd|dt|dinar(?:s)?|euro(?:s)?|eur)";

    private static final Pattern CONTRACT_PRICE_LINE_PATTERN = Pattern.compile(
            "(?m)^\\s*[-*•]?\\s*([^\\r\\n:]{2,}?)\\s*(?::|-|=)\\s*" + AMOUNT_TOKEN + "\\s*(?:tnd|dt)?\\s*$",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern CONTRACT_PRICE_TABLE_PATTERN = Pattern.compile(
            "(?m)^\\s*([^\\r\\n]{3,}?)\\s{2,}" + AMOUNT_TOKEN + "\\s*(?:tnd|dt)?\\s*$",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern CONTRACT_PRICE_INLINE_PATTERN = Pattern.compile(
            "([^\\r\\n]{3,}?)\\s+" + AMOUNT_TOKEN + "\\s*(?:tnd|dt)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern CONTRACT_KEYWORD_PRICE_PATTERN = Pattern.compile(
            "(pare\\s*-?\\s*brise|phare(?:s)?|feu(?:x)?|optique(?:s)?|retroviseur(?:s)?|retro(?:s)?|vitre(?:s)?|vitrage(?:s)?|lunette\\s+arriere|pare\\s*-?\\s*choc(?:s)?|aile(?:s)?|portiere(?:s)?|capot|radiateur|carrosserie)[^\\n\\r\\d]{0,90}"
                    + AMOUNT_TOKEN + "\\s*(?:" + CURRENCY_TOKEN + ")?",
            Pattern.CASE_INSENSITIVE);

    private static final Map<String, String> EVIDENCE_DAMAGE_KEYWORDS = buildEvidenceDamageKeywords();

    private final NvidiaAIService aiService;
    private final NvidiaPromptBuilder promptBuilder;
    private final NvidiaProperties props;
    private final ClaimAnalysisFallbackService fallbackService;

    public ClaimOrchestrationService(
            NvidiaAIService aiService,
            NvidiaPromptBuilder promptBuilder,
            NvidiaProperties props,
            ClaimAnalysisFallbackService fallbackService) {
        this.aiService = aiService;
        this.promptBuilder = promptBuilder;
        this.props = props;
        this.fallbackService = fallbackService;
    }

    public NvidiaResponse processClaim(
            String claimDescription,
            String claimType,
            String contractSummary,
            String legalDocumentText,
            String ragContext,
            String imageBase64,
            String imageMimeType,
            String insuredId,
            String supportingDocumentsText) {
        PipelineResponse pipeline = processClaimWithIntermediateSteps(claimDescription, claimType, contractSummary,
                legalDocumentText, ragContext, imageBase64, imageMimeType, insuredId, supportingDocumentsText);
        return pipeline.isSuccess() ? pipeline.getFinalDecisionResponse() : NvidiaResponse.error("ERROR_AI_UNAVAILABLE",
                "ERROR_AI_UNAVAILABLE: orchestrateur indisponible", 503);
    }

    /**
     * Complete 3-agent pipeline that captures all intermediate steps.
     * Returns all three agent responses: Claim Analysis, Vision, and Final Decision.
     */
    public PipelineResponse processClaimWithIntermediateSteps(
            String claimDescription,
            String claimType,
            String contractSummary,
            String legalDocumentText,
            String ragContext,
            String imageBase64,
            String imageMimeType,
            String insuredId,
            String supportingDocumentsText) {
        long start = System.currentTimeMillis();
        log.info("[Orchestrator] Starting 3-agent pipeline with intermediate capture (insuredId={}, type={})", insuredId, claimType);

        String contractTrunc = truncate(contractSummary, props.getMaxContractChars());
        String supportTrunc = truncate(supportingDocumentsText, props.getMaxSupportingDocChars());
        String ragTrunc = truncate(ragContext, 4000);

        NvidiaModel primaryChat = props.getDefaultChatModel();
        if (primaryChat == null) {
            log.error("[Orchestrator] Default chat model is NULL. Check properties.");
            return new PipelineResponse(null, null, NvidiaResponse.error("none", "Configuration error: default chat model not found", 500));
        }
        NvidiaModel fastChat = props.getFastFallbackChatModel();

        // ── Step 1: Claim analysis ────────────────────────────────────────────
        log.info("[Orchestrator] Step 1: Claim text / coverage (primary={})...", primaryChat.name());
        NvidiaResponse claimAnalysis = runClaimAnalysisStep(claimDescription, claimType, contractTrunc,
                legalDocumentText, ragTrunc, supportTrunc, primaryChat);

        if (!claimAnalysis.isSuccess() && !primaryChat.equals(fastChat)) {
            log.warn("[Orchestrator] Step 1 failed on primary; retry with fast model {}...", fastChat.name());
            claimAnalysis = runClaimAnalysisStep(claimDescription, claimType, contractTrunc,
                    legalDocumentText, ragTrunc, supportTrunc, fastChat);
        }

        if (!claimAnalysis.isSuccess()) {
            log.error("[Orchestrator] Step 1 failed completely: {}", claimAnalysis.getErrorMessage());
            return new PipelineResponse(null, null, NvidiaResponse.error("ERROR_AI_UNAVAILABLE",
                    "ERROR_AI_UNAVAILABLE: étape analyse sinistre indisponible", 503));
        }

        // ── Step 2: Vision (optional) — try lighter vision if primary times out ─
        NvidiaResponse imageAnalysis = null;
        if (imageBase64 != null && !imageBase64.isBlank()) {
            log.info("[Orchestrator] Step 2: Damage image...");
            imageAnalysis = runImageAnalysis(claimDescription, claimType, imageBase64, imageMimeType,
                    props.getDefaultVisionModel());
            if (!imageAnalysis.isSuccess()) {
                NvidiaModel altVision = alternativeVisionModel(props.getDefaultVisionModel());
                if (altVision != null) {
                    log.warn("[Orchestrator] Vision retry with {}...", altVision.name());
                    imageAnalysis = runImageAnalysis(claimDescription, claimType, imageBase64, imageMimeType,
                            altVision);
                }
            }
            if (!imageAnalysis.isSuccess()) {
                log.warn("[Orchestrator] Image analysis skipped: {}", imageAnalysis != null
                        ? imageAnalysis.getErrorMessage()
                        : "null");
                return new PipelineResponse(claimAnalysis, null, NvidiaResponse.error("ERROR_AI_UNAVAILABLE",
                        "ERROR_AI_UNAVAILABLE: analyse image indisponible", 503));
            }
        }

        String claimJson = claimAnalysis.getContent();
        String imageJson = (imageAnalysis != null && imageAnalysis.isSuccess()) ? imageAnalysis.getContent()
                : "{}";
        String docExcerptForOrch = buildOrchestratorDocExcerpt(supportTrunc);

        // ── Step 3: Final orchestrator ───────────────────────────────────────
        log.info("[Orchestrator] Step 3: Final decision (primary chat)...");
        NvidiaResponse finalDecision = runOrchestratorStep(claimDescription, claimJson, imageJson, claimType,
                insuredId, docExcerptForOrch, primaryChat);

        if (!finalDecision.isSuccess() && !primaryChat.equals(fastChat)) {
            log.warn("[Orchestrator] Step 3 failed; retry orchestrator with fast model...");
            finalDecision = runOrchestratorStep(claimDescription, claimJson, imageJson, claimType, insuredId,
                    docExcerptForOrch, fastChat);
        }

        long duration = System.currentTimeMillis() - start;
        if (finalDecision.isSuccess()) {
            NvidiaResponse enriched = applyBestEffortIndemnification(finalDecision, claimJson, imageJson, contractTrunc);
            log.info("[Orchestrator] Pipeline SUCCESS in {}ms", duration);
            return new PipelineResponse(claimAnalysis, imageAnalysis, enriched);
        }

        log.error("[Orchestrator] Pipeline FAILED after retries: {}", finalDecision.getErrorMessage());
        return new PipelineResponse(claimAnalysis, imageAnalysis, NvidiaResponse.error("ERROR_AI_UNAVAILABLE",
                "ERROR_AI_UNAVAILABLE: orchestrateur indisponible", 503));
    }

    public NvidiaResponse processFinalSynthesisFromPreAnalyses(
            String claimDescription,
            String claimType,
            String contractSummary,
            String insuredId,
            String supportingDocumentsText,
            String preClaimRaw,
            String preImageRaw) {
        long start = System.currentTimeMillis();
        log.info("[Orchestrator] Final synthesis from pré-analyses (insuredId={})", insuredId);

        NvidiaModel primaryChat = props.getDefaultChatModel();
        NvidiaModel fastChat = props.getFastFallbackChatModel();
        if (primaryChat == null) {
            log.error("[Orchestrator] Default chat model is NULL.");
            return NvidiaResponse.error("none", "Configuration error: default chat model not found", 500);
        }

        String contractTrunc = truncate(contractSummary, props.getMaxContractChars());
        String supportTrunc = truncate(supportingDocumentsText, props.getMaxSupportingDocChars());
        String docExcerpt = buildOrchestratorDocExcerpt(supportTrunc);

        String claimSlot = wrapPreAnalysisSlot("analyze-claim", preClaimRaw);
        String imageSlot = wrapPreAnalysisSlot("analyze-image", preImageRaw);

        NvidiaResponse finalDecision = runFinalSynthesisOrchestratorStep(
                claimDescription,
                contractTrunc,
                claimSlot,
                imageSlot,
                claimType,
                insuredId,
                docExcerpt,
                primaryChat);

        if (!finalDecision.isSuccess() && !primaryChat.equals(fastChat)) {
            log.warn("[Orchestrator] Final synthesis retry with fast model...");
            finalDecision = runFinalSynthesisOrchestratorStep(
                    claimDescription,
                    contractTrunc,
                    claimSlot,
                    imageSlot,
                    claimType,
                    insuredId,
                    docExcerpt,
                    fastChat);
        }

        long duration = System.currentTimeMillis() - start;
        if (finalDecision.isSuccess()) {
            NvidiaResponse enriched = applyBestEffortIndemnification(finalDecision, claimSlot, imageSlot, contractTrunc);
            log.info("[Orchestrator] Final synthesis SUCCESS in {}ms", duration);
            return enriched;
        }

        log.error("[Orchestrator] Final synthesis FAILED: {}", finalDecision.getErrorMessage());
        return NvidiaResponse.error("ERROR_AI_UNAVAILABLE",
            "ERROR_AI_UNAVAILABLE: synthèse finale indisponible", 503);
    }

    private static String wrapPreAnalysisSlot(String source, String raw) {
        try {
            ObjectNode n = PRE_ANALYSIS_MAPPER.createObjectNode();
            n.put("source", source);
            if (raw == null || raw.isBlank()) {
                n.put("note", "Non disponible — pré-analyse non fournie ou vide.");
                return PRE_ANALYSIS_MAPPER.writeValueAsString(n);
            }
            n.put("rawContent", truncate(raw, 14000));
            return PRE_ANALYSIS_MAPPER.writeValueAsString(n);
        } catch (Exception e) {
            log.warn("wrapPreAnalysisSlot {}: {}", source, e.getMessage());
            return "{\"source\":\"" + source + "\",\"note\":\"erreur encodage\"}";
        }
    }

    private NvidiaResponse runFinalSynthesisOrchestratorStep(String claimDescription, String contractSummary,
                                                            String claimJson, String imageJson,
                                                            String claimType, String insuredId,
                                                            String documentsExcerpt, NvidiaModel chatModel) {
        NvidiaRequest orchReq = NvidiaRequest.builder()
                .model(chatModel)
                .systemPrompt(AssurGoSystemPrompts.FINAL_SYNTHESIS_FROM_PRE_ANALYSES)
                .userPrompt(promptBuilder.buildFinalSynthesisFromPreAnalysesPrompt(
                        claimDescription, contractSummary, claimJson, imageJson, claimType, insuredId, documentsExcerpt))
                .temperature(0.0)
                .maxTokens(3600)
                .build();
        return aiService.call(orchReq);
    }

    private NvidiaResponse applyBestEffortIndemnification(
            NvidiaResponse finalDecision,
            String claimEvidenceJson,
            String imageEvidenceJson,
            String contractSummary) {

        if (finalDecision == null || !finalDecision.isSuccess()
                || finalDecision.getContent() == null || finalDecision.getContent().isBlank()) {
            return finalDecision;
        }

        ObjectNode root = parseObjectNodeCandidate(finalDecision.getContent());
        if (root == null) {
            return finalDecision;
        }

        String decision = root.path("finalDecision").asText("");
        if ("AUTO_REJECTED".equalsIgnoreCase(decision)) {
            return finalDecision;
        }

        // NOTE: existing LLM amount is treated as untrusted and will be ignored unless contract-confirmed.
        Double existing = readDoubleField(root, "finalIndemnificationAmount");

        Map<String, ContractCatalogEntry> contractCatalog = extractContractPriceCatalog(contractSummary);
        String evidenceText = buildEvidenceText(root, claimEvidenceJson, imageEvidenceJson);
        Set<String> evidenceDamageSignals = extractEvidenceDamageSignals(evidenceText, contractCatalog);

        ensureDetectedDamagesContainEvidence(root, evidenceDamageSignals, contractCatalog);

        double reconciledSum = reconcileContractMatchedItems(root, contractCatalog, evidenceText, evidenceDamageSignals);
        Double itemizedBaseAmount = reconciledSum > 0 ? round2(reconciledSum) : null;

        Double finalAmount = null;
        if (itemizedBaseAmount != null && itemizedBaseAmount > 0) {
            finalAmount = round2(itemizedBaseAmount);

            if (existing == null || existing <= 0 || Math.abs(existing - finalAmount) > 1.0) {
                String correctionNote = existing != null && existing > 0
                        ? String.format(Locale.ROOT,
                        "Correction automatique: montant précédent %.2f TND remplacé par %.2f TND via lignes contractuelles confirmées.",
                        existing, finalAmount)
                        : String.format(Locale.ROOT,
                        "Montant calculé strictement depuis le contrat (items inclus): %.2f TND.",
                        finalAmount);
                appendInternalAuditNote(root, correctionNote);
            }
        } else {
            // Strict mode: do not accept any LLM amount if we could not confirm at least one contract-priced item.
            if (existing != null && existing > 0) {
                appendInternalAuditNote(root, String.format(Locale.ROOT,
                        "Montant IA %.2f TND ignoré: aucun poste contractuel confirmé.",
                        existing));
            }
        }

        if (finalAmount != null && finalAmount > 0) {
            root.put("finalIndemnificationAmount", finalAmount);
            if (root.has("finalTotalTnd")) {
                root.put("finalTotalTnd", finalAmount);
            }
            if (!root.hasNonNull("currency")) {
                root.put("currency", "TND");
            }

            String shortJustification = root.path("shortJustification").asText("");
            if (shortJustification == null || shortJustification.isBlank()
                    || shortJustification.toLowerCase(Locale.ROOT).contains("données insuffisantes")
                    || shortJustification.toLowerCase(Locale.ROOT).contains("donnees insuffisantes")) {
                root.put("shortJustification", "Indemnisation calculée à partir des postes contractuels inclus.");
            }
        } else {
            root.putNull("finalIndemnificationAmount");
            if (root.has("finalTotalTnd")) {
                root.putNull("finalTotalTnd");
            }
            root.put("shortJustification", "Données insuffisantes");
        }

        // Decision policy:
        // - If we have a contract-confirmed amount and fraudRisk not HIGH => AUTO_APPROVED
        // - else => MANUAL_REVIEW (unless AUTO_REJECTED)
        String fraudRiskLevel = root.path("fraudRiskLevel").asText("");
        boolean isHighFraudRisk = "HIGH".equalsIgnoreCase(fraudRiskLevel);

        if (finalAmount != null && finalAmount > 0 && !isHighFraudRisk) {
            root.put("finalDecision", "AUTO_APPROVED");
        } else {
            root.put("finalDecision", "MANUAL_REVIEW");
        }

        int includedCount = countIncludedContractItems(root);
        appendInternalAuditNote(root, String.format(Locale.ROOT,
                "Diagnostic calcul: contratsPrix=%d, includedItems=%d, sommeIncluse=%s, montantInitial=%s, montantFinal=%s.",
                contractCatalog.size(),
                includedCount,
                itemizedBaseAmount != null ? String.format(Locale.ROOT, "%.2f", itemizedBaseAmount) : "null",
                existing != null ? String.format(Locale.ROOT, "%.2f", existing) : "null",
                finalAmount != null ? String.format(Locale.ROOT, "%.2f", finalAmount) : "null"));

        setInsuredNotification(root, finalAmount, root.path("currency").asText("TND"));

        log.info("[Orchestrator] amount resolution: decision={}, catalogItems={}, includedItems={}, sumIncluded={}, initialAmount={}, finalAmount={}",
                root.path("finalDecision").asText(decision),
                contractCatalog.size(),
                includedCount,
                itemizedBaseAmount,
                existing,
                finalAmount);
        log.info("[Orchestrator] matching diagnostics: detectedDamages={}, contractMatchedItems={}",
                root.path("detectedDamages"),
                root.path("contractMatchedItems"));

        return serializeDecision(finalDecision, root);
    }

    private NvidiaResponse serializeDecision(NvidiaResponse originalResponse, ObjectNode payload) {
        try {
            return NvidiaResponse.success(originalResponse.getModelUsed(), PRE_ANALYSIS_MAPPER.writeValueAsString(payload));
        } catch (Exception e) {
            log.warn("[Orchestrator] Unable to serialize enriched final decision: {}", e.getMessage());
            return originalResponse;
        }
    }

    private static void appendInternalAuditNote(ObjectNode root, String note) {
        if (note == null || note.isBlank()) {
            return;
        }

        String previous = root.path("internalAuditNote").asText("");
        if (previous.contains(note)) {
            return;
        }

        if (previous.isBlank()) {
            root.put("internalAuditNote", note);
            return;
        }

        root.put("internalAuditNote", previous + "\n" + note);
    }

    /**
     * FIX: Notification depends on finalDecision (not only on amount).
     */
    private static void setInsuredNotification(ObjectNode root, Double amount, String currency) {
        JsonNode notificationNode = root.get("insuredNotification");
        ObjectNode notification;
        if (notificationNode instanceof ObjectNode existingNotification) {
            notification = existingNotification;
        } else {
            notification = PRE_ANALYSIS_MAPPER.createObjectNode();
            root.set("insuredNotification", notification);
        }

        String safeCurrency = (currency == null || currency.isBlank()) ? "TND" : currency;
        String finalDecision = root.path("finalDecision").asText("");

        if (amount != null && amount > 0) {
            if ("MANUAL_REVIEW".equalsIgnoreCase(finalDecision)) {
                notification.put("subject", "Revue manuelle requise");
                notification.put("body", String.format(Locale.ROOT,
                        "Un montant provisoire a été calculé selon votre contrat: %.2f %s. Un expert va confirmer le dossier.",
                        amount, safeCurrency));
                return;
            }

            notification.put("subject", "Indemnisation approuvée");
            notification.put("body", String.format(Locale.ROOT,
                    "Indemnisation approuvée: %.2f %s.",
                    amount,
                    safeCurrency));
            return;
        }

        notification.put("subject", "Données insuffisantes");
        notification.put("body", "Données insuffisantes.");
    }

    private static String buildEvidenceText(ObjectNode root, String claimEvidenceJson, String imageEvidenceJson) {
        StringBuilder sb = new StringBuilder();
        sb.append(unwrapEvidencePayload(claimEvidenceJson)).append('\n');
        sb.append(unwrapEvidencePayload(imageEvidenceJson)).append('\n');

        JsonNode detectedDamages = root.get("detectedDamages");
        if (detectedDamages != null && detectedDamages.isArray()) {
            for (JsonNode n : detectedDamages) {
                if (n != null && n.isTextual()) {
                    sb.append(n.asText()).append('\n');
                }
            }
        }

        return sb.toString();
    }

    private static Map<String, String> buildEvidenceDamageKeywords() {
        LinkedHashMap<String, String> map = new LinkedHashMap<>();
        map.put("parebrise", "pare-brise");
        map.put("parechoc avant", "pare-chocs avant");
        map.put("parechoc arriere", "pare-chocs arriere");
        map.put("phare avant", "phare avant");
        map.put("phare arriere", "phare arriere");
        map.put("phare", "phare");
        map.put("retro", "retroviseur");
        map.put("vitrage", "vitrage");
        map.put("lunette arriere", "lunette arriere");
        map.put("parechoc", "pare-choc");
        map.put("aile", "aile");
        map.put("portiere", "portiere");
        map.put("capot", "capot");
        map.put("radiateur", "radiateur");
        map.put("carrosserie", "carrosserie");
        return map;
    }

    private static Set<String> extractEvidenceDamageSignals(String evidenceText,
                                                           Map<String, ContractCatalogEntry> contractCatalog) {
        LinkedHashSet<String> signals = new LinkedHashSet<>();
        String normalizedEvidence = normalizeDamageLabel(evidenceText);
        if (normalizedEvidence.isBlank()) {
            return signals;
        }

        for (Map.Entry<String, String> entry : EVIDENCE_DAMAGE_KEYWORDS.entrySet()) {
            if (normalizedEvidence.contains(entry.getKey())) {
                signals.add(normalizeDamageLabel(entry.getValue()));
            }
        }

        if (contractCatalog != null && !contractCatalog.isEmpty()) {
            for (ContractCatalogEntry catalogEntry : contractCatalog.values()) {
                if (evidenceMentions(normalizedEvidence, catalogEntry.normalizedLabel)) {
                    signals.add(catalogEntry.normalizedLabel);
                }
            }
        }

        return signals;
    }

    private static void ensureDetectedDamagesContainEvidence(ObjectNode root,
                                                            Set<String> evidenceDamageSignals,
                                                            Map<String, ContractCatalogEntry> contractCatalog) {
        if (root == null || evidenceDamageSignals == null || evidenceDamageSignals.isEmpty()) {
            return;
        }

        ArrayNode detectedDamages;
        JsonNode detectedNode = root.get("detectedDamages");
        if (detectedNode instanceof ArrayNode existingArray) {
            detectedDamages = existingArray;
        } else {
            detectedDamages = PRE_ANALYSIS_MAPPER.createArrayNode();
            root.set("detectedDamages", detectedDamages);
        }

        LinkedHashSet<String> existingNormalized = new LinkedHashSet<>();
        for (JsonNode node : detectedDamages) {
            if (node != null && node.isTextual()) {
                existingNormalized.add(normalizeDamageLabel(node.asText("")));
            }
        }

        for (String normalizedDamage : evidenceDamageSignals) {
            if (normalizedDamage == null || normalizedDamage.isBlank()) {
                continue;
            }
            if (containsEquivalentDamage(existingNormalized, normalizedDamage)) {
                continue;
            }

            detectedDamages.add(renderDamageLabel(normalizedDamage, contractCatalog));
            existingNormalized.add(normalizedDamage);
        }
    }

    private static String renderDamageLabel(String normalizedDamage,
                                           Map<String, ContractCatalogEntry> contractCatalog) {
        if (normalizedDamage == null || normalizedDamage.isBlank()) {
            return "";
        }

        if (contractCatalog != null) {
            ContractCatalogEntry direct = contractCatalog.get(normalizedDamage);
            if (direct != null && direct.label != null && !direct.label.isBlank()) {
                return direct.label;
            }
        }

        if (normalizedDamage.contains("parebrise")) return "pare-brise";
        if (normalizedDamage.contains("phare")) return "phare";
        if (normalizedDamage.contains("retro")) return "retroviseur";
        if (normalizedDamage.contains("vitrage")) return "vitrage";
        if (normalizedDamage.contains("parechoc")) return "pare-choc";

        return normalizedDamage;
    }

    private static boolean containsEquivalentDamage(Set<String> normalizedDamages, String normalizedCandidate) {
        if (normalizedDamages == null || normalizedDamages.isEmpty()
                || normalizedCandidate == null || normalizedCandidate.isBlank()) {
            return false;
        }

        for (String existing : normalizedDamages) {
            if (existing == null || existing.isBlank()) {
                continue;
            }
            if (!isDirectionCompatible(existing, normalizedCandidate)) {
                continue;
            }
            if (existing.equals(normalizedCandidate) || similarityScore(existing, normalizedCandidate) >= 3) {
                return true;
            }
        }

        return false;
    }

    private static boolean isDirectionCompatible(String a, String b) {
        if (a == null || b == null) {
            return true;
        }

        boolean aAvant = a.contains("avant");
        boolean bAvant = b.contains("avant");
        boolean aArriere = a.contains("arriere");
        boolean bArriere = b.contains("arriere");

        if ((aAvant || bAvant) && aAvant != bAvant) return false;
        if ((aArriere || bArriere) && aArriere != bArriere) return false;

        return true;
    }

    private static Map<String, ContractCatalogEntry> extractContractPriceCatalog(String contractSummary) {
        LinkedHashMap<String, ContractCatalogEntry> catalog = new LinkedHashMap<>();
        if (contractSummary == null || contractSummary.isBlank()) {
            return catalog;
        }

        Matcher lineMatcher = CONTRACT_PRICE_LINE_PATTERN.matcher(contractSummary);
        while (lineMatcher.find()) {
            addContractCatalogEntry(catalog, lineMatcher.group(1), lineMatcher.group(2));
        }

        Matcher inlineMatcher = CONTRACT_PRICE_INLINE_PATTERN.matcher(contractSummary);
        while (inlineMatcher.find()) {
            addContractCatalogEntry(catalog, inlineMatcher.group(1), inlineMatcher.group(2));
        }

        Matcher tableMatcher = CONTRACT_PRICE_TABLE_PATTERN.matcher(contractSummary);
        while (tableMatcher.find()) {
            addContractCatalogEntry(catalog, tableMatcher.group(1), tableMatcher.group(2));
        }

        Matcher keywordMatcher = CONTRACT_KEYWORD_PRICE_PATTERN.matcher(contractSummary);
        while (keywordMatcher.find()) {
            addContractCatalogEntry(catalog,
                    canonicalizeDamageKeyword(keywordMatcher.group(1)),
                    keywordMatcher.group(2));
        }

        return catalog;
    }

    private static String canonicalizeDamageKeyword(String rawKeyword) {
        String normalized = normalizeDamageLabel(rawKeyword);
        if (normalized.contains("parebrise")) return "pare-brise";
        if (normalized.contains("phare")) return "phare";
        if (normalized.contains("vitrage") || normalized.contains("vitre") || normalized.contains("lunette")) return "vitrage";
        if (normalized.contains("parechoc")) return "pare-choc";
        if (normalized.contains("aile")) return "aile";
        if (normalized.contains("portiere")) return "portiere";
        if (normalized.contains("capot")) return "capot";
        if (normalized.contains("radiateur")) return "radiateur";
        if (normalized.contains("carrosserie")) return "carrosserie";
        return rawKeyword == null ? "" : rawKeyword.trim();
    }

    private static void addContractCatalogEntry(Map<String, ContractCatalogEntry> catalog,
                                                String rawLabel,
                                                String rawAmount) {
        if (catalog == null) return;

        String normalizedLabel = normalizeDamageLabel(rawLabel);
        Double amount = parseAmountString(rawAmount);

        if (normalizedLabel.isBlank() || amount == null || amount <= 0) return;

        // Filter non-item monetary lines (franchise, plafonds, etc.)
        if (normalizedLabel.contains("franchise")
                || normalizedLabel.contains("deductible")
                || normalizedLabel.contains("cotisation")
                || normalizedLabel.contains("prime")
                || normalizedLabel.contains("plafond")
                || normalizedLabel.contains("taux")
                || normalizedLabel.contains("valeur du vehicule")
                || normalizedLabel.contains("valeur vehicule")
                || normalizedLabel.contains("resume des garanties")
                || normalizedLabel.contains("recapitulatif")
                || normalizedLabel.equals("carrosserie")
                || normalizedLabel.equals("bris de glace")
                || normalizedLabel.equals("accessoires exterieurs")
                || normalizedLabel.contains("type de sinistre")
                || normalizedLabel.contains("cin assure")
                || normalizedLabel.contains("nombre de contrats")
                || normalizedLabel.contains("contrat selectionne")
                || normalizedLabel.contains("type contrat selectionne")
                || normalizedLabel.contains("statut contrat selectionne")) {
            return;
        }

        catalog.putIfAbsent(normalizedLabel,
                new ContractCatalogEntry(rawLabel == null ? normalizedLabel : rawLabel.trim(), normalizedLabel, round2(amount)));
    }

    private static double reconcileContractMatchedItems(ObjectNode root,
                                                        Map<String, ContractCatalogEntry> contractCatalog,
                                                        String evidenceText,
                                                        Set<String> evidenceDamageSignals) {
        if (root == null) return 0.0;

        ArrayNode itemsArray;
        JsonNode existingItems = root.get("contractMatchedItems");
        if (existingItems instanceof ArrayNode arr) {
            itemsArray = arr;
        } else {
            itemsArray = PRE_ANALYSIS_MAPPER.createArrayNode();
            root.set("contractMatchedItems", itemsArray);
        }

        Set<String> safeEvidenceDamageSignals = evidenceDamageSignals == null ? Set.of() : evidenceDamageSignals;

        // Reconcile existing items deterministically
        for (JsonNode node : itemsArray) {
            if (!(node instanceof ObjectNode item)) continue;

            String damageText = firstNonBlank(item.path("damage").asText(""), item.path("contractItem").asText(""));
            String normalizedDamage = normalizeDamageLabel(damageText);

            ContractCatalogEntry matchedEntry = findBestContractEntry(damageText, contractCatalog);
                // Deterministic evidence: rely only on extracted evidence signals, never on free-form LLM text.
                boolean evidenceSupported = matchedEntry != null
                    && containsEquivalentDamage(safeEvidenceDamageSignals, matchedEntry.normalizedLabel);

                if (evidenceSupported) {
                item.put("contractItem", matchedEntry.label);
                item.put("priceTnd", round2(matchedEntry.amount));
                item.put("included", true);
                item.put("reason", "Poste confirmé par le contrat.");
                if (item.has("excludeReason")) item.put("excludeReason", "");
                // Ensure no other numeric fields are used later
                if (item.has("coverageCapTnd")) item.putNull("coverageCapTnd");
                if (item.has("amountTnd")) item.putNull("amountTnd");
            } else {
                item.put("included", false);
                item.putNull("priceTnd");
                if (item.has("coverageCapTnd")) item.putNull("coverageCapTnd");
                if (item.has("amountTnd")) item.putNull("amountTnd");
                item.put("reason", "Non retenu: non confirmé par le contrat.");
                if (item.has("excludeReason")) item.put("excludeReason", "Non retenu: non confirmé par le contrat.");
            }
        }

        // Add missing damages from detectedDamages
        JsonNode detectedDamages = root.get("detectedDamages");
        if (detectedDamages != null && detectedDamages.isArray()) {
            for (JsonNode damageNode : detectedDamages) {
                if (damageNode == null || !damageNode.isTextual()) continue;

                String damageText = damageNode.asText("");
                String normalizedDamage = normalizeDamageLabel(damageText);

                if (normalizedDamage.isBlank() || isDamageAlreadyRepresented(itemsArray, normalizedDamage)) continue;

                ObjectNode item = itemsArray.addObject();
                item.put("damage", damageText);

                ContractCatalogEntry matchedEntry = findBestContractEntry(damageText, contractCatalog);
                // Deterministic evidence: rely only on extracted evidence signals.
                boolean evidenceSupported = matchedEntry != null
                    && containsEquivalentDamage(safeEvidenceDamageSignals, matchedEntry.normalizedLabel);

                if (evidenceSupported) {
                    item.put("contractItem", matchedEntry.label);
                    item.put("priceTnd", round2(matchedEntry.amount));
                    item.put("included", true);
                    item.put("reason", "Poste confirmé par le contrat.");
                } else {
                    item.put("contractItem", "");
                    item.putNull("priceTnd");
                    item.put("included", false);
                    item.put("reason", "Non retenu: non confirmé par le contrat.");
                }
            }
        }

        // As a last deterministic fallback: if no included items, include catalog entries ONLY if evidence mentions them.
        if (countIncludedContractItems(root) == 0 && contractCatalog != null && !contractCatalog.isEmpty()
                && !safeEvidenceDamageSignals.isEmpty()) {
            for (ContractCatalogEntry entry : contractCatalog.values()) {
                if (!containsEquivalentDamage(safeEvidenceDamageSignals, entry.normalizedLabel)
                        || isDamageAlreadyRepresented(itemsArray, entry.normalizedLabel)) {
                    continue;
                }
                ObjectNode item = itemsArray.addObject();
                item.put("damage", entry.label);
                item.put("contractItem", entry.label);
                item.put("priceTnd", round2(entry.amount));
                item.put("included", true);
                item.put("reason", "Poste confirmé par le contrat.");
            }
        }

        // STRICT SUM: priceTnd only, included must be explicitly true
        Double sum = sumIncludedContractItems(root);
        return sum == null ? 0.0 : sum;
    }

    private static ContractCatalogEntry findBestContractEntry(String candidate,
                                                              Map<String, ContractCatalogEntry> contractCatalog) {
        if (contractCatalog == null || contractCatalog.isEmpty()) return null;

        String normalizedCandidate = normalizeDamageLabel(candidate);
        if (normalizedCandidate.isBlank()) return null;

        ContractCatalogEntry exact = contractCatalog.get(normalizedCandidate);
        if (exact != null) return exact;

        ContractCatalogEntry best = null;
        int bestScore = 0;

        for (Map.Entry<String, ContractCatalogEntry> entry : contractCatalog.entrySet()) {
            int score = similarityScore(normalizedCandidate, entry.getKey());
            if (score > bestScore) {
                bestScore = score;
                best = entry.getValue();
            }
        }
        return bestScore >= 2 ? best : null;
    }

    private static int similarityScore(String a, String b) {
        if (a == null || b == null || a.isBlank() || b.isBlank()) return 0;
        if (a.equals(b)) return 5;
        if (a.contains(b) || b.contains(a)) return 4;

        Set<String> aTokens = toTokenSet(a);
        Set<String> bTokens = toTokenSet(b);
        int overlap = 0;
        for (String token : aTokens) {
            if (bTokens.contains(token)) overlap += 1;
        }
        return overlap;
    }

    private static Set<String> toTokenSet(String normalizedText) {
        LinkedHashSet<String> set = new LinkedHashSet<>();
        if (normalizedText == null || normalizedText.isBlank()) return set;
        for (String token : normalizedText.split("\\s+")) {
            if (token == null) continue;
            String t = token.trim();
            if (t.length() >= 3) set.add(t);
        }
        return set;
    }

    private static boolean evidenceMentions(String normalizedEvidence, String normalizedLabel) {
        if (normalizedEvidence == null || normalizedEvidence.isBlank()
                || normalizedLabel == null || normalizedLabel.isBlank()) {
            return false;
        }

        if (normalizedEvidence.contains(normalizedLabel)) return true;

        Set<String> labelTokens = toTokenSet(normalizedLabel);
        if (labelTokens.isEmpty()) return false;

        int overlap = 0;
        for (String token : labelTokens) {
            if (token.length() >= 4 && normalizedEvidence.contains(token)) overlap += 1;
        }

        if (labelTokens.size() == 1) return overlap >= 1;
        return overlap >= 2;
    }

    private static boolean isDamageAlreadyRepresented(ArrayNode itemsArray, String normalizedDamage) {
        if (itemsArray == null || normalizedDamage == null || normalizedDamage.isBlank()) return false;

        for (JsonNode node : itemsArray) {
            if (!(node instanceof ObjectNode item)) continue;

            String represented = firstNonBlank(item.path("damage").asText(""), item.path("contractItem").asText(""));
            String normalizedRepresented = normalizeDamageLabel(represented);

            if (normalizedRepresented.equals(normalizedDamage)
                    || similarityScore(normalizedRepresented, normalizedDamage) >= 3) {
                return true;
            }
        }
        return false;
    }

    private static Double parseAmountString(String rawAmount) {
        if (rawAmount == null || rawAmount.isBlank()) return null;

        String normalized = rawAmount.trim().replaceAll("\\s+", "");
        normalized = normalized.replaceAll("[^0-9,.-]", "");

        int lastComma = normalized.lastIndexOf(',');
        int lastDot = normalized.lastIndexOf('.');

        if (lastComma >= 0 && lastDot >= 0) {
            if (lastComma > lastDot) {
                normalized = normalized.replace(".", "");
                normalized = normalized.replace(',', '.');
            } else {
                normalized = normalized.replace(",", "");
            }
        } else if (lastComma >= 0) {
            if (normalized.chars().filter(ch -> ch == ',').count() > 1) {
                int i = normalized.lastIndexOf(',');
                normalized = normalized.substring(0, i).replace(",", "") + "." + normalized.substring(i + 1);
            } else {
                normalized = normalized.replace(',', '.');
            }
        } else if (lastDot >= 0 && normalized.chars().filter(ch -> ch == '.').count() > 1) {
            int i = normalized.lastIndexOf('.');
            normalized = normalized.substring(0, i).replace(".", "") + "." + normalized.substring(i + 1);
        }

        if (normalized.isBlank() || "-".equals(normalized) || ".".equals(normalized)) return null;

        try {
            return Double.parseDouble(normalized);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static String firstNonBlank(String... values) {
        if (values == null) return "";
        for (String v : values) {
            if (v != null && !v.isBlank()) return v.trim();
        }
        return "";
    }

    private static String normalizeDamageLabel(String value) {
        String normalized = Normalizer.normalize(String.valueOf(value == null ? "" : value), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim();

        normalized = normalized
                .replace("pare brise", "parebrise")
                .replace("pare choc", "parechoc")
                .replace("pare chocs", "parechoc")
                .replace("phares", "phare")
                .replace("feux", "phare")
                .replace("feu", "phare")
                .replace("optiques", "phare")
                .replace("optique", "phare")
                .replace("retroviseurs", "retro")
                .replace("retroviseur", "retro")
                .replace("vitrages", "vitrage")
                .replace("vitres", "vitrage")
                .replaceAll("\\s+", " ")
                .trim();

        return normalized;
    }

    private static final class ContractCatalogEntry {
        private final String label;
        private final String normalizedLabel;
        private final double amount;

        private ContractCatalogEntry(String label, String normalizedLabel, double amount) {
            this.label = label;
            this.normalizedLabel = normalizedLabel;
            this.amount = amount;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // JSON parsing helpers
    // ─────────────────────────────────────────────────────────────────────────

    private static ObjectNode parseObjectNodeCandidate(String raw) {
        if (raw == null || raw.isBlank()) return null;

        try {
            JsonNode n = PRE_ANALYSIS_MAPPER.readTree(sanitizeJsonCandidate(raw));
            if (n instanceof ObjectNode objectNode) return objectNode;
        } catch (Exception ignored) {
            // non-JSON or malformed payload
        }
        return null;
    }

    private static String sanitizeJsonCandidate(String raw) {
        String s = raw == null ? "" : raw.trim();
        if (s.startsWith("```")) {
            s = s.replaceFirst("^```json\\s*", "").replaceFirst("^```\\s*", "");
            s = s.replaceFirst("```\\s*$", "").trim();
        }
        int first = s.indexOf('{');
        int last = s.lastIndexOf('}');
        if (first >= 0 && last > first) return s.substring(first, last + 1);
        return s;
    }

    private static String unwrapEvidencePayload(String rawEvidence) {
        if (rawEvidence == null || rawEvidence.isBlank()) return "";
        ObjectNode wrapper = parseObjectNodeCandidate(rawEvidence);
        if (wrapper != null && wrapper.has("rawContent") && wrapper.get("rawContent").isTextual()) {
            String rawContent = wrapper.get("rawContent").asText();
            if (rawContent != null && !rawContent.isBlank()) return rawContent;
        }
        return rawEvidence;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Strict contractMatchedItems summation
    // ─────────────────────────────────────────────────────────────────────────

    private static Double sumIncludedContractItems(ObjectNode node) {
        if (node == null) return null;

        JsonNode itemsNode = node.get("contractMatchedItems");
        if (itemsNode == null || !itemsNode.isArray()) return null;

        double sum = 0.0;
        int includedCount = 0;

        for (JsonNode item : itemsNode) {
            if (item == null || !item.isObject()) continue;

            JsonNode includedNode = item.get("included");
            boolean included = includedNode != null && parseBooleanNode(includedNode); // strict: default false
            if (!included) continue;

            Double amount = parseDoubleNode(item.get("priceTnd")); // strict: price only
            if (amount == null || amount <= 0) continue;

            sum += amount;
            includedCount += 1;
        }

        if (includedCount == 0 || sum <= 0) return null;
        return round2(sum);
    }

    private static int countIncludedContractItems(ObjectNode node) {
        if (node == null) return 0;

        JsonNode itemsNode = node.get("contractMatchedItems");
        if (itemsNode == null || !itemsNode.isArray()) return 0;

        int count = 0;
        for (JsonNode item : itemsNode) {
            if (item == null || !item.isObject()) continue;

            JsonNode includedNode = item.get("included");
            boolean included = includedNode != null && parseBooleanNode(includedNode); // strict
            if (included) count += 1;
        }
        return count;
    }

    private static Double readDoubleField(ObjectNode node, String fieldName) {
        if (node == null || fieldName == null || fieldName.isBlank()) return null;

        JsonNode direct = node.get(fieldName);
        Double parsed = parseDoubleNode(direct);
        if (parsed != null) return parsed;

        var it = node.fieldNames();
        while (it.hasNext()) {
            String key = it.next();
            if (fieldName.equalsIgnoreCase(key)) {
                return parseDoubleNode(node.get(key));
            }
        }
        return null;
    }

    private static Double parseDoubleNode(JsonNode node) {
        if (node == null || node.isNull()) return null;
        if (node.isNumber()) return node.asDouble();

        if (node.isTextual()) {
            String raw = node.asText();
            if (raw == null || raw.isBlank()) return null;
            String normalized = raw.trim().replace(',', '.').replaceAll("[^0-9.\\-]", "");
            if (normalized.isBlank() || "-".equals(normalized) || ".".equals(normalized)) return null;
            try {
                return Double.parseDouble(normalized);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private static boolean parseBooleanNode(JsonNode node) {
        if (node == null || node.isNull()) return false;
        if (node.isBoolean()) return node.asBoolean();
        if (node.isNumber()) return node.asDouble() != 0.0;
        if (node.isTextual()) {
            String value = node.asText().trim().toLowerCase(Locale.ROOT);
            return "true".equals(value)
                    || "1".equals(value)
                    || "yes".equals(value)
                    || "oui".equals(value)
                    || "inclu".equals(value)
                    || "included".equals(value);
        }
        return false;
    }

    private static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Remaining pipeline methods (unchanged)
    // ─────────────────────────────────────────────────────────────────────────

    public NvidiaResponse analyzeContratText(String claimDescription, String claimType, String contratText,
                                             String numeroContrat, String contenuContrat) {
        NvidiaModel model = props.getDefaultChatModel();
        if (model == null) {
            return NvidiaResponse.error("none", "Configuration error: default chat model not found", 500);
        }

        StringBuilder prompt = new StringBuilder();
        prompt.append("=== TYPE SINISTRE ===\n").append(claimType != null ? claimType : "AUTO").append("\n\n");
        prompt.append("=== DÉCLARATION ASSURÉ ===\n").append(claimDescription != null ? claimDescription : "(non fournie)").append("\n\n");
        if (StringUtils.hasText(numeroContrat)) {
            prompt.append("=== NUMERO CONTRAT FOURNI ===\n").append(numeroContrat.trim()).append("\n\n");
        }
        if (StringUtils.hasText(contenuContrat)) {
            prompt.append("=== CONTENU CONTRAT EN BASE (contenuContrat) ===\n").append(truncate(contenuContrat, 12000)).append("\n\n");
        } else {
            prompt.append("=== CONTENU CONTRAT EN BASE (non disponible) ===\n");
        }
        prompt.append("=== CONTRAT EXTRAIT ===\n").append(contratText != null ? truncate(contratText, 12000) : "(vide)");

        NvidiaResponse r = quickChat(model, AssurGoSystemPrompts.CONTRAT_ANALYSIS, prompt.toString());
        if (r.isSuccess()) {
            return r;
        }
        NvidiaModel fast = props.getFastFallbackChatModel();
        if (fast != null && !fast.equals(model)) {
            return quickChat(fast, AssurGoSystemPrompts.CONTRAT_ANALYSIS, prompt.toString());
        }
        return r;
    }

    private NvidiaResponse runClaimAnalysisStep(String claimDescription, String claimType,
                                               String contractSummary, String legalDocumentText, String ragContext,
                                               String supportingDocumentsText, NvidiaModel chatModel) {

        NvidiaRequest claimReq = NvidiaRequest.builder()
                .model(chatModel)
                .systemPrompt(AssurGoSystemPrompts.CLAIM_ANALYSIS)
                .userPrompt(claimDescription)
                .claimType(claimType)
                .contractSummary(contractSummary)
                .legalDocumentText(legalDocumentText)
                .supportingDocumentsText(supportingDocumentsText != null ? supportingDocumentsText : "")
                .ragContext(ragContext)
                .temperature(0.10)
                .maxTokens(2048)
                .build();

        NvidiaRequest claimReqFull = NvidiaRequest.builder()
                .model(chatModel)
                .systemPrompt(AssurGoSystemPrompts.CLAIM_ANALYSIS)
                .userPrompt(promptBuilder.buildClaimAnalysisPrompt(claimReq))
                .temperature(0.10)
                .maxTokens(2048)
                .build();

        return aiService.call(claimReqFull);
    }

    private NvidiaResponse runImageAnalysis(String claimDescription, String claimType,
                                           String imageBase64, String imageMimeType, NvidiaModel visionModel) {
        NvidiaRequest imgRequest = NvidiaRequest.builder()
                .model(visionModel)
                .systemPrompt(AssurGoSystemPrompts.IMAGE_DAMAGE_ANALYSIS)
                .userPrompt(promptBuilder.buildImageAnalysisPrompt(
                        NvidiaRequest.builder()
                                .model(visionModel)
                                .claimType(claimType)
                                .userPrompt(claimDescription)
                                .build()))
                .imageBase64(imageBase64, imageMimeType != null ? imageMimeType : "image/jpeg")
                .temperature(0.10)
                .maxTokens(1024)
                .build();
        return aiService.call(imgRequest);
    }

    private static NvidiaModel alternativeVisionModel(NvidiaModel current) {
        if (current == NvidiaModel.LLAMA_3_2_90B_VISION) return NvidiaModel.LLAMA_3_2_11B_VISION;
        if (current == NvidiaModel.LLAMA_3_2_11B_VISION) return NvidiaModel.PHI_3_5_VISION;
        return null;
    }

    private NvidiaResponse runOrchestratorStep(String claimDescription, String claimJson, String imageJson,
                                              String claimType, String insuredId, String documentsExcerpt, NvidiaModel chatModel) {
        NvidiaRequest orchReq = NvidiaRequest.builder()
                .model(chatModel)
                .systemPrompt(AssurGoSystemPrompts.ORCHESTRATOR)
                .userPrompt(promptBuilder.buildOrchestratorPrompt(
                        claimDescription, claimJson, imageJson, claimType, insuredId, documentsExcerpt))
                .temperature(0.0)
                .maxTokens(3200)
                .build();
        return aiService.call(orchReq);
    }

    private static String buildOrchestratorDocExcerpt(String supportTrunc) {
        if (supportTrunc == null || supportTrunc.isBlank()) {
            return "(Aucun texte n'a été extrait des pièces jointes — fichiers absents, illisibles ou non PDF/TXT.)";
        }
        int max = 1800;
        if (supportTrunc.length() <= max) return supportTrunc;
        return supportTrunc.substring(0, max) + "\n… [tronqué]";
    }

    private static String truncate(String s, int maxLen) {
        if (s == null || s.isBlank()) return s == null ? "" : s;
        if (s.length() <= maxLen) return s;
        return s.substring(0, maxLen) + "\n… [texte tronqué pour limite API]";
    }

    public NvidiaResponse quickChat(NvidiaModel model, String systemPrompt, String userMessage) {
        return aiService.call(NvidiaRequest.builder()
                .model(model)
                .systemPrompt(systemPrompt)
                .userPrompt(userMessage)
                .temperature(0.3)
                .build());
    }

    public NvidiaResponse quickImageAnalysis(NvidiaModel model, String prompt, String base64, String mime) {
        return aiService.call(NvidiaRequest.builder()
                .model(model)
                .systemPrompt(AssurGoSystemPrompts.IMAGE_DAMAGE_ANALYSIS)
                .userPrompt(prompt)
                .imageBase64(base64, mime)
                .temperature(0.10)
                .build());
    }

    public NvidiaResponse embed(String text) {
        return aiService.call(NvidiaRequest.builder()
                .model(NvidiaModel.EMBED_NV_EMBED_V2)
                .textToEmbed(text)
                .build());
    }

    public NvidiaResponse extractDocument(String base64Image, String mimeType) {
        return aiService.call(NvidiaRequest.builder()
                .model(NvidiaModel.NEMOTRON_TABLE_STRUCTURE)
                .userPrompt("Extract all structured data from this insurance document.")
                .imageBase64(base64Image, mimeType)
                .build());
    }
}
