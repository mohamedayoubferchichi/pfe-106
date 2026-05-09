package com.example.back_end.controller;

import com.example.back_end.config.AssurGoSystemPrompts;
import com.example.back_end.config.NvidiaModel;
import com.example.back_end.dto.NvidiaResponse;
import com.example.back_end.model.AppDocument;
import com.example.back_end.model.ContratReference;
import com.example.back_end.repository.AppDocumentRepository;
import com.example.back_end.repository.ContratReferenceRepository;
import com.example.back_end.service.ClaimOrchestrationService;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * REST controller for the NVIDIA AI assistant.
 *
 * Routes:
 * POST /api/assistant/v1/chat → Free-form chat with the AI assistant
 * POST /api/assistant/v1/analyze-claim → Full 3-agent claim analysis pipeline
 * POST /api/assistant/v1/analyze-image → Image-only damage analysis
 * POST /api/assistant/v1/extract-document → Document OCR / extraction
 * POST /api/assistant/v1/embed → Text embedding vector
 */
@RestController
@RequestMapping("/api/assistant/v1")
@CrossOrigin("*")
public class NvidiaAssistantController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NvidiaAssistantController.class);
    private static final int MAX_CONTRACT_SUMMARY_CHARS = 9000;
    private static final int MAX_ADMIN_DOCS_CHARS = 14000;
    private static final int MAX_RAG_CONTEXT_CHARS = 4000;
    private static final Set<String> RAG_STOPWORDS = Set.of(
            "avec", "sans", "dans", "pour", "vous", "nous", "leur", "leurs", "cette", "cet", "that", "this",
            "from", "into", "about", "have", "with", "your", "ours", "mais", "alors", "type", "sinistre", "claim",
            "declaration", "incident", "assure", "assuree", "assurgo");

    private final ClaimOrchestrationService orchestrationService;
    private final AppDocumentRepository appDocumentRepository;
    private final ContratReferenceRepository contratReferenceRepository;

    public NvidiaAssistantController(
            ClaimOrchestrationService orchestrationService,
            AppDocumentRepository appDocumentRepository,
            ContratReferenceRepository contratReferenceRepository) {
        this.orchestrationService = orchestrationService;
        this.appDocumentRepository = appDocumentRepository;
        this.contratReferenceRepository = contratReferenceRepository;
    }

    // ── 1. Free-form chat ─────────────────────────────────────────────────────
    // Route: POST http://localhost:8080/api/assistant/v1/chat
    // Body (JSON): { "message": "...", "systemPrompt": "...", "model":
    // "MISTRAL_LARGE_3" }
    @PostMapping("/chat")
    public ResponseEntity<NvidiaResponse> chat(
            @RequestBody Map<String, String> body) {
        String message = body.getOrDefault("message", "");
        String systemPrompt = body.getOrDefault("systemPrompt", AssurGoSystemPrompts.GENERAL_ASSISTANT);
        String modelName = body.getOrDefault("model", "MISTRAL_LARGE_3");

        NvidiaModel model;
        try {
            model = NvidiaModel.valueOf(modelName);
        } catch (IllegalArgumentException e) {
            model = NvidiaModel.MISTRAL_LARGE_3;
        }

        NvidiaResponse response = orchestrationService.quickChat(model, systemPrompt, message);
        return ResponseEntity.ok(response);
    }

    // ── 2. Full claim analysis pipeline ───────────────────────────────────────
    // Route: POST http://localhost:8080/api/assistant/v1/analyze-claim
    @PostMapping("/analyze-claim")
    public ResponseEntity<NvidiaResponse> analyzeClaim(
            @RequestParam String claimDescription,
            @RequestParam String claimType,
            @RequestParam(defaultValue = "") String contractSummary,
            @RequestParam(defaultValue = "") String legalDocumentText,
            @RequestParam(defaultValue = "") String ragContext,
            @RequestParam(required = false) MultipartFile damageImage,
            @RequestParam(defaultValue = "unknown") String insuredId,
            @RequestParam(required = false) String numeroContrat) {

        try {
                log.info("=== [analyze-claim] DÉBUT REQUÊTE ===");
                log.info("[analyze-claim] PARAMS REÇUS: numeroContrat={}, insuredId={}, claimType={}", numeroContrat, insuredId, claimType);
                
                String claimTypeCode = normalizeTypeCode(claimType);
                ClaimKnowledgeContext context = buildKnowledgeContext(claimDescription, claimTypeCode, insuredId, numeroContrat);

            String imageBase64 = null;
            String imageMime = null;

            if (damageImage != null && !damageImage.isEmpty()) {
                imageBase64 = Base64.getEncoder().encodeToString(damageImage.getBytes());
                imageMime = damageImage.getContentType();
            }

                // Kept for backward compatibility only: we now use DB-derived context.
                if (StringUtils.hasText(contractSummary)
                    || StringUtils.hasText(legalDocumentText)
                    || StringUtils.hasText(ragContext)) {
                log.info("[analyze-claim] Ignoring client-provided context in favor of DB context (type={}, insuredId={}).",
                    claimTypeCode, insuredId);
                }

            NvidiaResponse response = orchestrationService.processClaim(
                    claimDescription,
                    claimTypeCode,
                    context.contractSummary,
                    context.legalDocumentText,
                    context.ragContext,
                    imageBase64,
                    imageMime,
                    insuredId,
                    context.supportingDocumentsText);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("CRITICAL: Error in analyze-claim pipeline", e);
            return ResponseEntity.internalServerError()
                    .body(NvidiaResponse.error("none", "Pipeline error: " + e.getMessage(), 500));
        }
    }

    // ── 3. Image-only damage analysis ─────────────────────────────────────────
    // Route: POST http://localhost:8080/api/assistant/v1/analyze-image
    @PostMapping("/analyze-image")
    public ResponseEntity<NvidiaResponse> analyzeImage(
            @RequestParam MultipartFile image,
            @RequestParam(defaultValue = "Analyze the damage in this image.") String prompt,
            @RequestParam(defaultValue = "LLAMA_3_2_90B_VISION") String model) throws Exception {
        String base64 = Base64.getEncoder().encodeToString(image.getBytes());
        NvidiaModel nvidiaModel;
        try {
            nvidiaModel = NvidiaModel.valueOf(model);
        } catch (IllegalArgumentException e) {
            nvidiaModel = NvidiaModel.LLAMA_3_2_90B_VISION;
        }
        NvidiaResponse response = orchestrationService.quickImageAnalysis(nvidiaModel, prompt, base64,
                image.getContentType());
        return ResponseEntity.ok(response);
    }

    // ── 4. Document extraction ─────────────────────────────────────────────────
        @PostMapping("/analyze-contrat")
            public ResponseEntity<NvidiaResponse> analyzeContrat(
                @RequestParam("contrat") MultipartFile contrat,
                @RequestParam String claimType,
                @RequestParam String claimDescription,
                @RequestParam String numeroContrat) throws Exception {
            String contratText = extractPlainTextFromMultipart(contrat);
            if (contratText.isBlank()) {
                return ResponseEntity.ok(NvidiaResponse.success("assurgo-contrat-parser",
                        "{\"isContratValid\":false,\"validityReason\":\"Contrat illisible ou non exploitable\"," +
                                "\"liabilityDecision\":\"INDETERMINEE\",\"responsibilityExplanation\":\"Impossible de déterminer l'analyse avec le fichier fourni\"," +
                                "\"confidenceScore\":0.2,\"missingInformation\":[\"Contrat lisible (PDF/TXT) ou photos plus nettes\"]}"));
        }

        // Resolve contract content from DB when numeroContrat provided
        String contenuContrat = "";
        if (StringUtils.hasText(numeroContrat)) {
            try {
                ContratReference cr = contratReferenceRepository.findByNumeroContrat(numeroContrat.trim()).orElse(null);
                if (cr != null && StringUtils.hasText(cr.getContenuContrat())) {
                    contenuContrat = cr.getContenuContrat().trim();
                    log.info("[analyze-contrat] loaded contenuContrat from DB: numeroContrat={}, length={}", numeroContrat, contenuContrat.length());
                } else {
                    log.warn("[analyze-contrat] no contenuContrat found for numeroContrat={}", numeroContrat);
                }
            } catch (Exception e) {
                log.warn("[analyze-contrat] error reading contract from DB for numeroContrat={}: {}", numeroContrat, e.getMessage());
            }
        }

        NvidiaResponse response = orchestrationService.analyzeContratText(claimDescription, claimType, contratText, numeroContrat, contenuContrat);
        return ResponseEntity.ok(response);
    }

    // ── 5. Document extraction ─────────────────────────────────────────────────
    // Route: POST http://localhost:8080/api/assistant/v1/extract-document
    @PostMapping("/extract-document")
    public ResponseEntity<NvidiaResponse> extractDocument(
            @RequestParam MultipartFile document) throws Exception {
        String base64 = Base64.getEncoder().encodeToString(document.getBytes());
        NvidiaResponse response = orchestrationService.extractDocument(base64, document.getContentType());
        return ResponseEntity.ok(response);
    }

    // ── 6. Text embedding ─────────────────────────────────────────────────────
    // Route: POST http://localhost:8080/api/assistant/v1/embed
    @PostMapping("/embed")
    public ResponseEntity<NvidiaResponse> embed(@RequestParam String text) {
        return ResponseEntity.ok(orchestrationService.embed(text));
    }

    private ClaimKnowledgeContext buildKnowledgeContext(String claimDescription, String claimTypeCode, String insuredId, String numeroContrat) {
        String contract = resolveInsuredContractSummary(insuredId, claimTypeCode, numeroContrat);
        List<AdminDocExtract> adminDocs = loadAdminDocsByType(claimTypeCode);
        String legal = buildAdminDocsBlock(claimTypeCode, adminDocs);
        String rag = buildRagFromAdminDocs(claimDescription, claimTypeCode, adminDocs);
        String ragWithContract = buildRagContextWithContract(contract, rag);
        return new ClaimKnowledgeContext(contract, legal, ragWithContract, legal);
    }

    private String buildRagContextWithContract(String contractSummary, String ragContext) {
        StringBuilder sb = new StringBuilder();
        if (StringUtils.hasText(contractSummary)) {
            sb.append("=== CONTENU CONTRAT EN BASE (contenuContrat) ===\n");
            sb.append(contractSummary.trim()).append("\n\n");
        }
        if (StringUtils.hasText(ragContext)) {
            sb.append("=== RAG DOCUMENTS ADMINISTRATIFS ===\n");
            sb.append(ragContext.trim()).append("\n");
        }
        return truncate(sb.toString(), MAX_RAG_CONTEXT_CHARS);
    }

    private String resolveInsuredContractSummary(String insuredId, String claimTypeCode, String numeroContrat) {
        log.info("[analyze-claim] == resolveInsuredContractSummary DÉBUT == numeroContrat={}, insuredId={}, claimTypeCode={}", 
            numeroContrat, insuredId, claimTypeCode);

        ContratReference selected = null;
        
        // Priorité absolue: récupérer le contrat officiel en base à partir du numéro de contrat.
        if (StringUtils.hasText(numeroContrat)) {
            log.info("[analyze-claim] ✓ numeroContrat EST FOURNI: '{}' → Recherche en base...", numeroContrat.trim());
            selected = contratReferenceRepository.findByNumeroContrat(numeroContrat.trim())
                    .orElse(null);
            if (selected == null) {
                log.warn("[analyze-claim] ✗ CONTRAT NON TROUVÉ en base pour numeroContrat='{}'. Véri fier que le contrat existe!", numeroContrat.trim());
                return "Contrat non trouve pour le numero: " + numeroContrat.trim();
            }
            log.info("[analyze-claim] ✓ Contrat trouvé! numeroContrat={}, typeContrat={}, statut={}, contenuContrat longueur={}", 
                selected.getNumeroContrat(),
                selected.getTypeContrat(),
                selected.getStatut(),
                selected.getContenuContrat() != null ? selected.getContenuContrat().length() : 0);
        } else {
            if (!StringUtils.hasText(insuredId)) {
                return "Aucun numeroContrat ni identifiant assure fourni. Contrat non recuperable depuis la base.";
            }
            log.info("[analyze-claim] ✗ numeroContrat NON FOURNI → Recherche par CIN et type...");
            // Sinon, chercher le meilleur contrat par type
            List<ContratReference> contracts = contratReferenceRepository.findByCinOrderByDateFinContratDesc(insuredId.trim());
            if (contracts.isEmpty()) {
                log.warn("[analyze-claim] Aucun contrat trouvé pour CIN={}", insuredId.trim());
                return "Aucun contrat trouve en base pour l'assure " + insuredId + ".";
            }
            selected = selectBestContractForType(contracts, claimTypeCode);
            log.info("[analyze-claim] Contrat sélectionné par type: numeroContrat={}, contenuContrat longueur={}", 
                selected != null ? selected.getNumeroContrat() : "NULL",
                selected != null && selected.getContenuContrat() != null ? selected.getContenuContrat().length() : 0);
        }

        boolean matchesType = selected != null
                && normalizeTypeCode(selected.getTypeContrat()).equals(claimTypeCode);

        StringBuilder sb = new StringBuilder();
        sb.append("Type de sinistre demande: ").append(claimTypeCode).append("\n");
        sb.append("CIN assure: ").append(insuredId.trim()).append("\n");

        if (selected == null) {
            sb.append("Aucun contrat exploitable n'a pu etre selectionne.");
            return sb.toString();
        }

        sb.append("Numero contrat: ").append(StringUtils.hasText(selected.getNumeroContrat())
                ? selected.getNumeroContrat().trim()
                : "N/A").append("\n");
        sb.append("Type contrat: ").append(StringUtils.hasText(selected.getTypeContrat())
                ? selected.getTypeContrat().trim()
                : "N/A").append("\n");
        sb.append("Statut: ").append(StringUtils.hasText(selected.getStatut())
                ? selected.getStatut().trim()
                : "N/A").append("\n");
        sb.append("Date fin: ").append(selected.getDateFinContrat() != null
                ? selected.getDateFinContrat()
                : "N/A").append("\n");

        if (!matchesType) {
            sb.append("Alerte: aucun contrat strictement du type ").append(claimTypeCode)
                    .append(" trouve; contrat alternatif utilise pour contexte minimal.\n");
        }

        if (StringUtils.hasText(selected.getContenuContrat())) {
            sb.append("\n=== CONTENU CONTRAT EN BASE (contenuContrat) ===\n");
            sb.append(selected.getContenuContrat().trim());
            log.info("[analyze-claim] ragContext avec contenuContrat complété - longueur totale: {} caractères", sb.length());
        } else {
            sb.append("\nLe contenu textuel du contrat n'est pas disponible dans la base.");
            log.warn("[analyze-claim] Aucun contenuContrat disponible pour numeroContrat={}", 
                selected.getNumeroContrat());
        }

        String result = truncate(sb.toString(), MAX_CONTRACT_SUMMARY_CHARS);
        log.info("[analyze-claim] ragContext final - longueur: {} caractères (max: {})", result.length(), MAX_CONTRACT_SUMMARY_CHARS);
        return result;
    }

    private static ContratReference selectBestContractForType(List<ContratReference> contracts, String claimTypeCode) {
        if (contracts == null || contracts.isEmpty()) {
            return null;
        }

        ContratReference matchingActive = contracts.stream()
                .filter(c -> normalizeTypeCode(c.getTypeContrat()).equals(claimTypeCode))
                .filter(NvidiaAssistantController::isActiveContract)
                .findFirst()
                .orElse(null);
        if (matchingActive != null) {
            return matchingActive;
        }

        ContratReference matchingAny = contracts.stream()
                .filter(c -> normalizeTypeCode(c.getTypeContrat()).equals(claimTypeCode))
                .findFirst()
                .orElse(null);
        if (matchingAny != null) {
            return matchingAny;
        }

        ContratReference activeAny = contracts.stream()
                .filter(NvidiaAssistantController::isActiveContract)
                .findFirst()
                .orElse(null);
        if (activeAny != null) {
            return activeAny;
        }

        return contracts.get(0);
    }

    private static boolean isActiveContract(ContratReference contract) {
        if (contract == null) {
            return false;
        }
        String statut = String.valueOf(contract.getStatut() == null ? "" : contract.getStatut()).trim().toUpperCase();
        if ("DESACTIVE".equals(statut) || "EXPIRE".equals(statut)) {
            return false;
        }
        LocalDate end = contract.getDateFinContrat();
        return end == null || !end.isBefore(LocalDate.now());
    }

    private List<AdminDocExtract> loadAdminDocsByType(String claimTypeCode) {
        List<AppDocument> allDocs = appDocumentRepository.findAll();
        List<AdminDocExtract> selected = new ArrayList<>();

        for (AppDocument doc : allDocs) {
            if (doc == null) {
                continue;
            }

            String docType = normalizeTypeCode(doc.getTypeDocument());
            if (!claimTypeCode.equals(docType)) {
                continue;
            }

            String fileName = StringUtils.hasText(doc.getFileName()) ? doc.getFileName().trim() : "document-admin";
            String text = extractPlainTextFromStoredDocument(doc);
            if (!StringUtils.hasText(text)) {
                text = "Document present en base mais texte non extractible automatiquement.";
            }
            selected.add(new AdminDocExtract(fileName, truncate(text.trim(), 5000)));
        }

        selected.sort(Comparator.comparing(AdminDocExtract::fileName));
        return selected;
    }

    private String buildAdminDocsBlock(String claimTypeCode, List<AdminDocExtract> docs) {
        if (docs == null || docs.isEmpty()) {
            return "Aucun document administratif AssurGo trouve en base pour le type de sinistre "
                    + claimTypeCode + ".";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Documents administratifs AssurGo filtres par type = ").append(claimTypeCode).append("\n\n");
        for (AdminDocExtract doc : docs) {
            sb.append("--- DOC ADMIN : ").append(doc.fileName()).append(" ---\n");
            sb.append(doc.text()).append("\n\n");
        }
        return truncate(sb.toString(), MAX_ADMIN_DOCS_CHARS);
    }

    private String buildRagFromAdminDocs(String claimDescription, String claimTypeCode, List<AdminDocExtract> docs) {
        if (docs == null || docs.isEmpty()) {
            return "Aucun passage RAG disponible: aucun document admin pour type " + claimTypeCode + ".";
        }

        LinkedHashSet<String> terms = new LinkedHashSet<>();
        terms.add(normalizeForSearch(claimTypeCode));
        for (String token : normalizeForSearch(claimDescription).split("\\s+")) {
            if (token.length() < 4 || RAG_STOPWORDS.contains(token)) {
                continue;
            }
            terms.add(token);
            if (terms.size() >= 14) {
                break;
            }
        }

        List<PassageCandidate> candidates = new ArrayList<>();
        for (AdminDocExtract doc : docs) {
            for (String passage : splitIntoPassages(doc.text())) {
                int score = scorePassage(passage, terms, claimTypeCode);
                if (score <= 0) {
                    continue;
                }
                candidates.add(new PassageCandidate(doc.fileName(), passage, score));
            }
        }

        candidates.sort(Comparator.comparingInt(PassageCandidate::score).reversed()
                .thenComparing((a, b) -> Integer.compare(b.text().length(), a.text().length())));

        StringBuilder rag = new StringBuilder();
        int kept = 0;
        for (PassageCandidate candidate : candidates) {
            if (kept >= 5) {
                break;
            }
            if (candidate.score() <= 0 && kept >= 2) {
                break;
            }
            rag.append("[RAG DOC: ").append(candidate.fileName()).append(" | score=")
                    .append(candidate.score()).append("]\n");
            rag.append(candidate.text()).append("\n\n");
            kept += 1;
        }

        if (rag.length() == 0) {
            rag.append("Aucun passage pertinent trouve automatiquement pour type ")
                    .append(claimTypeCode).append(".");
        }

        return truncate(rag.toString(), MAX_RAG_CONTEXT_CHARS);
    }

    private static List<String> splitIntoPassages(String text) {
        List<String> passages = new ArrayList<>();
        if (!StringUtils.hasText(text)) {
            return passages;
        }

        String[] blocks = text.replace("\r\n", "\n").replace("\r", "\n").split("\\n{2,}");
        for (String block : blocks) {
            String trimmed = block == null ? "" : block.trim();
            if (!StringUtils.hasText(trimmed)) {
                continue;
            }
            if (trimmed.length() <= 700) {
                passages.add(trimmed);
                continue;
            }

            int cursor = 0;
            while (cursor < trimmed.length()) {
                int end = Math.min(trimmed.length(), cursor + 700);
                passages.add(trimmed.substring(cursor, end).trim());
                if (end == trimmed.length()) {
                    break;
                }
                cursor = Math.max(0, end - 120);
            }
        }

        return passages;
    }

    private static int scorePassage(String passage, Set<String> terms, String claimTypeCode) {
        String normalizedPassage = normalizeForSearch(passage);
        int score = 0;
        String claimTypeToken = normalizeForSearch(claimTypeCode);
        if (StringUtils.hasText(claimTypeToken) && normalizedPassage.contains(claimTypeToken)) {
            score += 3;
        }

        for (String term : terms) {
            if (!StringUtils.hasText(term)) {
                continue;
            }
            if (normalizedPassage.contains(term)) {
                score += 1;
            }
        }
        return score;
    }

    private String extractPlainTextFromStoredDocument(AppDocument doc) {
        try {
            byte[] bytes = doc.getData();
            if (bytes == null || bytes.length == 0) {
                return "";
            }

            String ct = doc.getContentType();
            String name = doc.getFileName() != null ? doc.getFileName() : "";
            boolean isPdf = (ct != null && "application/pdf".equalsIgnoreCase(ct))
                    || name.toLowerCase().endsWith(".pdf");
            if (isPdf) {
                try (PDDocument pdf = PDDocument.load(bytes)) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    return stripper.getText(pdf);
                }
            }

            boolean isText = (ct != null && ct.toLowerCase().startsWith("text/"))
                    || name.toLowerCase().endsWith(".txt");
            if (isText) {
                return new String(bytes, StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            log.warn("Impossible d'extraire le texte d'un document admin {}: {}",
                    doc != null ? doc.getFileName() : "unknown", e.getMessage());
        }
        return "";
    }

    private static String normalizeTypeCode(String value) {
        String normalized = Normalizer.normalize(String.valueOf(value == null ? "" : value), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim()
                .toUpperCase()
                .replaceAll("\\s+", "_")
                .replaceAll("[^A-Z0-9_]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");

        switch (normalized) {
            case "VOITURE":
            case "AUTOMOBILE":
            case "CAR":
            case "AUTO":
                return "AUTO";
            case "HABITATION":
            case "MAISON":
            case "LOGEMENT":
            case "HOME":
                return "HABITATION";
            case "VOYAGE":
            case "TRAVEL":
                return "VOYAGE";
            case "PREVOYANCE":
            case "LIFE":
            case "PROTECTION":
                return "PREVOYANCE";
            default:
                return normalized;
        }
    }

    private static String normalizeForSearch(String value) {
        return Normalizer.normalize(String.valueOf(value == null ? "" : value), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", " ")
                .trim();
    }

    private static String truncate(String value, int maxChars) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        if (value.length() <= maxChars) {
            return value;
        }
        return value.substring(0, maxChars) + "\n... [tronque]";
    }

    private static final class ClaimKnowledgeContext {
        private final String contractSummary;
        private final String legalDocumentText;
        private final String ragContext;
        private final String supportingDocumentsText;

        private ClaimKnowledgeContext(String contractSummary, String legalDocumentText, String ragContext,
                String supportingDocumentsText) {
            this.contractSummary = contractSummary;
            this.legalDocumentText = legalDocumentText;
            this.ragContext = ragContext;
            this.supportingDocumentsText = supportingDocumentsText;
        }
    }

    private static final class AdminDocExtract {
        private final String fileName;
        private final String text;

        private AdminDocExtract(String fileName, String text) {
            this.fileName = fileName;
            this.text = text;
        }

        private String fileName() {
            return fileName;
        }

        private String text() {
            return text;
        }
    }

    private static final class PassageCandidate {
        private final String fileName;
        private final String text;
        private final int score;

        private PassageCandidate(String fileName, String text, int score) {
            this.fileName = fileName;
            this.text = text;
            this.score = score;
        }

        private String fileName() {
            return fileName;
        }

        private String text() {
            return text;
        }

        private int score() {
            return score;
        }
    }

    private static String extractPlainTextFromMultipart(MultipartFile file) {
        try {
            String ct = file.getContentType();
            String name = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
            byte[] bytes = file.getBytes();
            boolean isPdf = (ct != null && "application/pdf".equalsIgnoreCase(ct))
                    || name.toLowerCase().endsWith(".pdf");
            if (isPdf) {
                try (PDDocument pdf = PDDocument.load(bytes)) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    return stripper.getText(pdf);
                }
            }
            boolean isText = (ct != null && ct.toLowerCase().startsWith("text/"))
                    || name.toLowerCase().endsWith(".txt");
            if (isText) {
                return new String(bytes, StandardCharsets.UTF_8);
            }
        } catch (Exception ignored) {
            // keep blank => handled by caller
        }
        return "";
    }
}
