package com.example.back_end.service;

import com.example.back_end.model.AppDocument;
import com.example.back_end.model.ContratReference;
import com.example.back_end.model.Sinistre;
import com.example.back_end.repository.AppDocumentRepository;
import com.example.back_end.repository.ContratReferenceRepository;
import com.example.back_end.repository.SinistreRepository;
import com.example.back_end.util.CinValidator;
import com.example.back_end.dto.ClaimAnalysisResult;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Comparator;
import java.util.regex.Pattern;

@Service
public class SinistreService {

    private static final Logger log = LoggerFactory.getLogger(SinistreService.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final int MAX_SUPPORTING_DOC_CHARS = 14000;
    private static final int MAX_FALLBACK_CONTRACT_CHARS = 12000;
    private static final int MAX_ADMIN_DOC_CHARS = 10000;
        private static final Pattern INSURANCE_CONTRACT_HINT_PATTERN = Pattern.compile(
            "\\b(contrat|assurance|garantie|indemnisation|sinistre|franchise|couverture|prise\\s+en\\s+charge|plafond|remboursement)\\b",
            Pattern.CASE_INSENSITIVE);

    private final SinistreRepository sinistreRepository;
    private final AppDocumentRepository appDocumentRepository;
    private final ContratReferenceRepository contratReferenceRepository;
    private final OrchestratorAgent orchestratorAgent;

    public SinistreService(SinistreRepository sinistreRepository,
            AppDocumentRepository appDocumentRepository,
            ContratReferenceRepository contratReferenceRepository,
            OrchestratorAgent orchestratorAgent) {
        this.sinistreRepository = sinistreRepository;
        this.appDocumentRepository = appDocumentRepository;
        this.contratReferenceRepository = contratReferenceRepository;
        this.orchestratorAgent = orchestratorAgent;
    }

    public List<Sinistre> findByCinUtilisateur(String cin) {
        if (!StringUtils.hasText(cin)) {
            return List.of();
        }

        try {
            String normalizedCin = CinValidator.validateAndNormalize(cin);
            return sinistreRepository.findByCinUtilisateurOrderByDateIncidentDesc(normalizedCin);
        } catch (IllegalArgumentException invalidCin) {
            log.warn("[Sinistre] CIN invalide pour historique sinistres: {}", cin);
            return List.of();
        }
    }

    public List<Sinistre> findByNumeroContrats(List<String> numerosContrat) {
        if (numerosContrat == null || numerosContrat.isEmpty()) {
            return List.of();
        }

        List<String> normalized = numerosContrat.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .toList();

        if (normalized.isEmpty()) {
            return List.of();
        }

        return sinistreRepository.findByNumeroContratInOrderByDateIncidentDesc(normalized);
    }

    public Sinistre updateStatut(String sinistreId, String statut) {
        if (!StringUtils.hasText(sinistreId)) {
            throw new IllegalArgumentException("Identifiant sinistre invalide.");
        }
        if (!StringUtils.hasText(statut)) {
            throw new IllegalArgumentException("Statut de sinistre invalide.");
        }

        String normalized = statut.trim().toUpperCase(Locale.ROOT);
        if (!List.of("PENDING", "APPROVED", "REJECTED", "CLOSED").contains(normalized)) {
            throw new IllegalArgumentException("Statut non supporté: " + statut);
        }

        Sinistre sinistre = sinistreRepository.findById(sinistreId)
                .orElseThrow(() -> new IllegalArgumentException("Sinistre introuvable: " + sinistreId));
        sinistre.setStatut(normalized);
        return sinistreRepository.save(sinistre);
    }

    public void delete(String sinistreId) {
        if (!StringUtils.hasText(sinistreId)) {
            throw new IllegalArgumentException("Identifiant sinistre invalide.");
        }

        Sinistre sinistre = sinistreRepository.findById(sinistreId)
                .orElseThrow(() -> new IllegalArgumentException("Sinistre introuvable: " + sinistreId));
        sinistreRepository.delete(sinistre);
    }

    /**
     * Déclare un sinistre avec analyse IA.
     *
     * Le contenuContrat est récupéré directement depuis la base de données via le numéro de contrat.
     * L'IA analyse le contenuContrat officiel + les photos + la description de l'assuré.
     * Plus besoin de document constat : le contrat officiel en base fait foi.
     */
    public Sinistre declarerSinistre(String cin, String typeSinistre, String description, String lieu,
            LocalDateTime date, MultipartFile image, List<MultipartFile> images, MultipartFile contrat,
            List<MultipartFile> documents, String numeroContrat,
            String preClaimAnalysis, String preImageAnalysis) {
        // Validate CIN is 8 digits
        try {
            cin = CinValidator.validateAndNormalize(cin);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("CIN invalide pour sinistre: " + e.getMessage(), e);
        }
        log.info("[Sinistre] Début déclaration pour CIN={}, typeSinistre={}, numeroContrat={}", cin, typeSinistre, numeroContrat);

        try {
            MultipartFile primaryImage = resolvePrimaryImage(image, images);
            String supportingExtract = buildSupportingDocumentsExtract(null, documents);
            String adminDocsExtract = buildAdminDocumentsExtract(typeSinistre);
            String supportingWithAdminDocs = supportingExtract + (StringUtils.hasText(adminDocsExtract) ? (supportingExtract.isEmpty() ? "" : "\n") + adminDocsExtract : "");
            List<String> pieceNoms = collectOriginalFilenames(contrat, documents);
            List<String> imageNoms = collectOriginalFilenames(image, images, true);
            StringBuilder processingNotes = new StringBuilder();

            log.info("[Sinistre] Recherche contrats en base pour CIN={}", cin);
            List<ContratReference> contracts = contratReferenceRepository.findByCinOrderByDateFinContratDesc(cin);
            log.info("[Sinistre] Nombre de contrats trouvés pour CIN={}: {}", cin, contracts.size());
            
            ContratReference selectedContract = null;
            try {
                selectedContract = resolveSelectedContract(contracts, typeSinistre, cin, numeroContrat);
            } catch (IllegalArgumentException contractError) {
                log.warn("[Sinistre] Contrat non résolu, déclaration conservée: {}", contractError.getMessage());
                processingNotes.append(contractError.getMessage());
            }
            log.info("[Sinistre] Contrat sélectionné: {}", selectedContract != null ? selectedContract.getNumeroContrat() : "NULL");
            
            String contractTextFromReference = extractPlainTextFromContractReference(selectedContract);
            log.info("[Sinistre] Longueur contenuContrat extrait: {} caractères", StringUtils.hasText(contractTextFromReference) ? contractTextFromReference.length() : 0);

            String contractNum = selectedContract != null && StringUtils.hasText(selectedContract.getNumeroContrat())
                    ? selectedContract.getNumeroContrat().trim()
                    : StringUtils.hasText(numeroContrat) ? numeroContrat.trim() : "Inconnu";

            String uploadedContractText = contrat != null ? extractPlainTextFromMultipart(contrat) : "";
                if (!StringUtils.hasText(uploadedContractText) && !StringUtils.hasText(contractTextFromReference)) {
                log.warn("[Sinistre] Aucun contenu contractuel exploitable (mode strict contrat assuré) pour CIN={} type={}",
                    cin,
                    normalizeTypeCode(typeSinistre));
                }

                String contractForAi = buildContractContextForAi(
                    uploadedContractText,
                    selectedContract,
                    contractTextFromReference,
                    typeSinistre,
                    cin);
                
                log.info("[Sinistre] Context contractuel envoyé à l'IA - Longueur totale: {} caractères", contractForAi.length());
                log.debug("[Sinistre] Contenu contractuel: {}", contractForAi);

                boolean selectedTypeMatches = selectedContract != null
                    && normalizeTypeCode(selectedContract.getTypeContrat()).equals(normalizeTypeCode(typeSinistre));

            log.info(
                    "[Sinistre] Contract diagnostics CIN={} type={} totalContracts={} selectedContract={} selectedType={} selectedTypeMatches={} selectedHasContent={} uploadedContractProvided={} strictInsuredContractOnly=true",
                    cin,
                    normalizeTypeCode(typeSinistre),
                    contracts.size(),
                    selectedContract != null ? selectedContract.getNumeroContrat() : "NONE",
                    selectedContract != null ? selectedContract.getTypeContrat() : "NONE",
                    selectedTypeMatches,
                    StringUtils.hasText(contractTextFromReference),
                    StringUtils.hasText(uploadedContractText));

            // 2. Lancer l'analyse complète (description enrichie lieu/date pour cohérence agents)
            String declarationBlock = buildDeclarationForAi(description, lieu, date);
            ClaimAnalysisResult analysisResult = orchestratorAgent.processClaimWithIntermediateResults(
                    declarationBlock, primaryImage, contractForAi, typeSinistre, supportingWithAdminDocs, cin,
                    preClaimAnalysis, preImageAnalysis);

            // 3. Score
            String aiAnalysis = analysisResult.getSynthesisForDisplay();
            ClaimResult claimResult = extractClaimResult(aiAnalysis);

            // 4. Créer et sauvegarder
            Sinistre sinistre = new Sinistre();
            // persist raw orchestrator JSON for audit
            sinistre.setOrchestratorFinalDecision(analysisResult.getOrchestratorFinalDecision());

            // try to parse structured orchestrator output to populate dedicated fields
            JsonNode orchestratorNode = parseJsonCandidate(analysisResult.getOrchestratorFinalDecision());
            sinistre.setCinUtilisateur(cin);
            sinistre.setNumeroContrat(contractNum);
            sinistre.setTypeSinistre(typeSinistre);
            sinistre.setDescription(description);
            sinistre.setLieuIncident(lieu);
            sinistre.setDateIncident(date != null ? date : LocalDateTime.now());
            sinistre.setAiAnalysis(aiAnalysis);
            sinistre.setPreClaimAnalysis(StringUtils.hasText(preClaimAnalysis) ? preClaimAnalysis.trim() : (StringUtils.hasText(analysisResult.getClaimAgentAnalysis()) ? analysisResult.getClaimAgentAnalysis().trim() : ""));
            sinistre.setPreImageAnalysis(StringUtils.hasText(preImageAnalysis) ? preImageAnalysis.trim() : (StringUtils.hasText(analysisResult.getVisionAgentAnalysis()) ? analysisResult.getVisionAgentAnalysis().trim() : ""));
            sinistre.setSupportingDocumentsExtract(supportingWithAdminDocs);
            sinistre.setContractContextUsed(contractForAi);
            if (processingNotes.length() > 0) {
                sinistre.setProcessingNotes(processingNotes.toString());
            }
            // prefer confidence coming from orchestrator structured output when available
            if (orchestratorNode != null) {
                sinistre.setScoreConfiance(readConfidencePercent(orchestratorNode));
            } else {
                sinistre.setScoreConfiance(claimResult.scoreConfiance);
            }
            // persist final decision if available
            if (orchestratorNode != null && orchestratorNode.hasNonNull("finalDecision")) {
                sinistre.setFinalDecision(orchestratorNode.path("finalDecision").asText());
            }
            sinistre.setStatut(claimResult.statut);

            if (orchestratorNode != null) {
                if (orchestratorNode.hasNonNull("fraudRiskLevel")) {
                    sinistre.setFraudRiskLevel(orchestratorNode.path("fraudRiskLevel").asText());
                }
                if (orchestratorNode.hasNonNull("finalIndemnificationAmount")) {
                    sinistre.setFinalIndemnificationAmount(orchestratorNode.path("finalIndemnificationAmount").asDouble());
                }
                if (orchestratorNode.hasNonNull("currency")) {
                    sinistre.setCurrency(orchestratorNode.path("currency").asText());
                }
                if (orchestratorNode.hasNonNull("coveragePercentageApplied")) {
                    sinistre.setCoveragePercentageApplied(orchestratorNode.path("coveragePercentageApplied").asDouble());
                }
                if (orchestratorNode.hasNonNull("indemnificationApproved")) {
                    sinistre.setIndemnificationApproved(orchestratorNode.path("indemnificationApproved").asBoolean());
                }
                if (orchestratorNode.hasNonNull("executiveSummary")) {
                    sinistre.setExecutiveSummary(orchestratorNode.path("executiveSummary").asText());
                }
                if (orchestratorNode.hasNonNull("synthesisBullets") && orchestratorNode.path("synthesisBullets").isArray()) {
                    List<String> bullets = new ArrayList<>();
                    orchestratorNode.path("synthesisBullets").forEach(n -> bullets.add(n.asText()));
                    sinistre.setSynthesisBullets(bullets);
                }
            }

            if (primaryImage != null && !primaryImage.isEmpty()) {
                sinistre.setImageUrl("uploads/" + primaryImage.getOriginalFilename());
            }
            if (!pieceNoms.isEmpty()) {
                sinistre.setPieceJointesNoms(pieceNoms);
            }
            if (!imageNoms.isEmpty()) {
                sinistre.setImageJointesNoms(imageNoms);
            }

            return sinistreRepository.save(sinistre);

        } catch (OrchestratorAgent.AiUnavailableException e) {
            log.error("AI unavailable during claim declaration: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("CRITICAL FALLBACK ACTIVATED: {}", e.getMessage(), e);

            // Simulation ultime en cas de crash total
            Sinistre fallback = new Sinistre();
            fallback.setCinUtilisateur(cin);
            fallback.setTypeSinistre(typeSinistre);
            fallback.setDescription(description);
            fallback.setLieuIncident(lieu);
            fallback.setDateIncident(date != null ? date : LocalDateTime.now());
            fallback.setNumeroContrat(StringUtils.hasText(numeroContrat) ? numeroContrat.trim() : "Inconnu");
            fallback.setPreClaimAnalysis(StringUtils.hasText(preClaimAnalysis) ? preClaimAnalysis.trim() : "");
            fallback.setPreImageAnalysis(StringUtils.hasText(preImageAnalysis) ? preImageAnalysis.trim() : "");
            fallback.setSupportingDocumentsExtract(buildSupportingDocumentsExtract(null, documents));
            fallback.setContractContextUsed(contrat != null ? extractPlainTextFromMultipart(contrat) : "");
            fallback.setProcessingNotes("AI fallback path used: " + e.getMessage());
            fallback.setAiAnalysis(
                    "⚖️ **Analyse de Secours**\n\nVotre déclaration a été enregistrée avec succès. Notre IA de secours estime que votre dossier est recevable sous réserve de vérification manuelle.\n\nScore de Confiance : 70%");
            fallback.setScoreConfiance(70);
            fallback.setStatut("PENDING");
            return sinistreRepository.save(fallback);
        }
    }

        private ContratReference resolveSelectedContract(List<ContratReference> contracts, String claimTypeCode, String cin,
                String numeroContrat) {
        if (StringUtils.hasText(numeroContrat)) {
            ContratReference explicit = contratReferenceRepository.findByNumeroContrat(numeroContrat.trim())
                    .orElseThrow(() -> new IllegalArgumentException("Contrat introuvable: " + numeroContrat.trim()));

            if (!StringUtils.hasText(explicit.getCin()) || !explicit.getCin().trim().equals(cin)) {
                throw new IllegalArgumentException("Le contrat sélectionné n'appartient pas à cet assuré.");
            }
            if (!isActiveContract(explicit)) {
                throw new IllegalArgumentException("Le contrat sélectionné n'est pas actif.");
            }
            if (!normalizeTypeCode(explicit.getTypeContrat()).equals(normalizeTypeCode(claimTypeCode))) {
                throw new IllegalArgumentException("Le contrat sélectionné ne correspond pas au type de sinistre.");
            }
            return explicit;
        }

        return selectBestContractForType(contracts, claimTypeCode);
    }

    private static ContratReference selectBestContractForType(List<ContratReference> contracts, String claimTypeCode) {
        if (contracts == null || contracts.isEmpty()) {
            return null;
        }

        String targetType = normalizeTypeCode(claimTypeCode);

        for (ContratReference contract : contracts) {
            if (contract == null) {
                continue;
            }
            if (isActiveContract(contract)
                    && normalizeTypeCode(contract.getTypeContrat()).equals(targetType)
                    && hasContractData(contract)) {
                return contract;
            }
        }

        for (ContratReference contract : contracts) {
            if (contract == null) {
                continue;
            }
            if (normalizeTypeCode(contract.getTypeContrat()).equals(targetType)
                    && hasContractData(contract)) {
                return contract;
            }
        }

        for (ContratReference contract : contracts) {
            if (contract == null) {
                continue;
            }
            if (isActiveContract(contract)
                    && normalizeTypeCode(contract.getTypeContrat()).equals(targetType)) {
                return contract;
            }
        }

        for (ContratReference contract : contracts) {
            if (contract != null && normalizeTypeCode(contract.getTypeContrat()).equals(targetType)) {
                return contract;
            }
        }

        return null;
    }

    private static boolean isActiveContract(ContratReference contract) {
        if (contract == null) {
            return false;
        }
        String statut = String.valueOf(contract.getStatut() == null ? "" : contract.getStatut())
                .trim()
                .toUpperCase(Locale.ROOT);
        if ("DESACTIVE".equals(statut) || "EXPIRE".equals(statut) || "EXPIRÉ".equals(statut)) {
            return false;
        }
        return contract.getDateFinContrat() == null || !contract.getDateFinContrat().isBefore(java.time.LocalDate.now());
    }

    private static boolean hasContractData(ContratReference contract) {
        if (contract == null) {
            return false;
        }
        return StringUtils.hasText(contract.getContenuContrat())
                || (contract.getFichier() != null && contract.getFichier().length > 0);
    }

    private static String buildContractContextForAi(String uploadedContractText, ContratReference selectedContract,
            String contractTextFromReference,
            String claimTypeCode, String cin) {
        StringBuilder sb = new StringBuilder();
        String normalizedClaimType = normalizeTypeCode(claimTypeCode);

        sb.append("Type de sinistre demandé: ").append(normalizedClaimType).append("\n");
        sb.append("CIN assuré: ").append(cin).append("\n");
        sb.append("Mode strict: utiliser uniquement le contrat de l'assuré correspondant à ce type de sinistre, trouvé en base par numéro de contrat et CIN.\n");

        if (selectedContract == null) {
            sb.append("Aucun contrat de type ").append(normalizedClaimType).append(" trouvé en base pour cet assuré.");
            return sb.toString();
        }

        sb.append("Contrat sélectionné: ")
                .append(StringUtils.hasText(selectedContract.getNumeroContrat()) ? selectedContract.getNumeroContrat().trim() : "N/A")
                .append("\n");
        sb.append("Type contrat sélectionné: ")
                .append(StringUtils.hasText(selectedContract.getTypeContrat()) ? selectedContract.getTypeContrat().trim() : "N/A")
                .append("\n");
        sb.append("Statut contrat sélectionné: ")
                .append(StringUtils.hasText(selectedContract.getStatut()) ? selectedContract.getStatut().trim() : "N/A")
                .append("\n");

        if (StringUtils.hasText(contractTextFromReference)) {
            sb.append("\n=== CONTRAT OFFICIEL EN BASE (contenuContrat) ===\n");
            sb.append(contractTextFromReference.trim());
        } else if (StringUtils.hasText(uploadedContractText)) {
            sb.append("\n=== CONTRAT FOURNI EN PIÈCE JOINTE (SECOURS) ===\n");
            sb.append(uploadedContractText.trim());
        } else {
            sb.append("\nLe contrat sélectionné n'a pas de contenu textuel exploitable.");
        }

        return sb.toString();
    }

    private static String extractPlainTextFromContractReference(ContratReference contract) {
        if (contract == null) {
            return "";
        }

        if (StringUtils.hasText(contract.getContenuContrat())) {
            return contract.getContenuContrat().trim();
        }

        byte[] bytes = contract.getFichier();
        if (bytes == null || bytes.length == 0) {
            return "";
        }

        try (PDDocument pdf = PDDocument.load(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(pdf);
            if (text != null && !text.isBlank()) {
                return text;
            }
        } catch (Exception ignored) {
            // Not a PDF or unreadable PDF, try plain text fallback below.
        }

        try {
            String asText = new String(bytes, StandardCharsets.UTF_8);
            return asText == null ? "" : asText.trim();
        } catch (Exception ignored) {
            return "";
        }
    }

    private String loadFallbackContractFromAdminDocs(String claimTypeCode) {
        String normalizedType = normalizeTypeCode(claimTypeCode);
        List<AppDocument> docs = appDocumentRepository.findAll();

        StringBuilder sb = new StringBuilder();

        docs.stream()
                .filter(doc -> doc != null && normalizeTypeCode(doc.getTypeDocument()).equals(normalizedType))
                .sorted(Comparator.comparing(AppDocument::getFileName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .forEach(doc -> {
                    if (sb.length() >= MAX_FALLBACK_CONTRACT_CHARS) {
                        return;
                    }
                    String text = extractPlainTextFromStoredDocument(doc);
                    if (!StringUtils.hasText(text)) {
                        return;
                    }
                    if (!isLikelyInsuranceContractText(text)) {
                        return;
                    }
                    String fileName = StringUtils.hasText(doc.getFileName()) ? doc.getFileName().trim() : "document-admin";
                    sb.append("--- DOC ADMIN: ").append(fileName).append(" ---\n");
                    sb.append(text.trim()).append("\n\n");
                });

        if (!StringUtils.hasText(sb.toString())) {
            long typedDocs = docs.stream()
                    .filter(doc -> doc != null && normalizeTypeCode(doc.getTypeDocument()).equals(normalizedType))
                    .count();
            if (typedDocs > 0) {
                log.warn("[Sinistre] Aucun document admin contractuel pertinent trouvé pour type={} (docsType={}).",
                        normalizedType,
                        typedDocs);
            }
            return "";
        }

        String full = sb.toString();
        if (full.length() > MAX_FALLBACK_CONTRACT_CHARS) {
            return full.substring(0, MAX_FALLBACK_CONTRACT_CHARS) + "\n... [tronqué]";
        }
        return full;
    }

    private static boolean isLikelyInsuranceContractText(String text) {
        if (!StringUtils.hasText(text)) {
            return false;
        }
        return INSURANCE_CONTRACT_HINT_PATTERN.matcher(text).find();
    }

    private static String extractPlainTextFromStoredDocument(AppDocument doc) {
        try {
            if (doc == null) {
                return "";
            }
            byte[] bytes = doc.getData();
            if (bytes == null || bytes.length == 0) {
                return "";
            }

            String ct = doc.getContentType();
            String name = doc.getFileName() != null ? doc.getFileName() : "";

            boolean isPdf = (ct != null && "application/pdf".equalsIgnoreCase(ct))
                    || name.toLowerCase(Locale.ROOT).endsWith(".pdf");
            if (isPdf) {
                try (PDDocument pdf = PDDocument.load(bytes)) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    return stripper.getText(pdf);
                }
            }

            boolean isText = (ct != null && ct.toLowerCase(Locale.ROOT).startsWith("text/"))
                    || name.toLowerCase(Locale.ROOT).endsWith(".txt");
            if (isText) {
                return new String(bytes, StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            log.warn("[Sinistre] Impossible d'extraire un document admin: {}", e.getMessage());
        }
        return "";
    }

    private static String normalizeTypeCode(String value) {
        String normalized = Normalizer.normalize(String.valueOf(value == null ? "" : value), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim()
                .toUpperCase(Locale.ROOT)
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

    private ClaimResult extractClaimResult(String text) {
        int confidence = 50;
        String decision = "MANUAL_REVIEW";

        JsonNode node = parseJsonCandidate(text);
        if (node != null) {
            confidence = readConfidencePercent(node);
            decision = readDecision(node);
        }

        String status;
        if (confidence < 70) {
            status = "PENDING";
        } else if ("AUTO_REJECTED".equalsIgnoreCase(decision) || "REJECTED".equalsIgnoreCase(decision)
                || "NOT_COVERED".equalsIgnoreCase(decision)) {
            status = "REJECTED";
        } else {
            status = "APPROVED";
        }

        return new ClaimResult(confidence, status);
    }

    private static JsonNode parseJsonCandidate(String text) {
        if (!StringUtils.hasText(text)) {
            return null;
        }

        String candidate = text.trim();
        if (candidate.startsWith("```")) {
            candidate = candidate.replaceFirst("^```json\\s*", "").replaceFirst("^```\\s*", "");
            candidate = candidate.replaceFirst("```\\s*$", "").trim();
        }

        int first = candidate.indexOf('{');
        int last = candidate.lastIndexOf('}');
        if (first >= 0 && last > first) {
            candidate = candidate.substring(first, last + 1);
        }

        try {
            return OBJECT_MAPPER.readTree(candidate);
        } catch (Exception ignored) {
            return null;
        }
    }

    private static int readConfidencePercent(JsonNode node) {
        if (node == null) {
            return 50;
        }

        double raw = Double.NaN;
        if (node.hasNonNull("globalConfidenceScore")) {
            raw = node.path("globalConfidenceScore").asDouble(Double.NaN);
        }
        if (Double.isNaN(raw) && node.hasNonNull("confidenceScore")) {
            raw = node.path("confidenceScore").asDouble(Double.NaN);
        }
        if (Double.isNaN(raw)) {
            return 50;
        }

        if (raw <= 1.0) {
            raw = raw * 100.0;
        }
        return (int) Math.round(Math.max(0, Math.min(100, raw)));
    }

    private static String readDecision(JsonNode node) {
        if (node == null) {
            return "MANUAL_REVIEW";
        }
        if (node.hasNonNull("finalDecision")) {
            return node.path("finalDecision").asText("MANUAL_REVIEW");
        }
        if (node.hasNonNull("decision")) {
            return node.path("decision").asText("MANUAL_REVIEW");
        }
        if (node.hasNonNull("recommendedAction")) {
            return node.path("recommendedAction").asText("MANUAL_REVIEW");
        }
        return "MANUAL_REVIEW";
    }

    private static MultipartFile resolvePrimaryImage(MultipartFile image, List<MultipartFile> images) {
        if (image != null && !image.isEmpty()) {
            return image;
        }
        if (images != null) {
            for (MultipartFile f : images) {
                if (f != null && !f.isEmpty()) {
                    return f;
                }
            }
        }
        return null;
    }

    private static List<String> collectOriginalFilenames(MultipartFile primary,
            List<MultipartFile> additional) {
        return collectOriginalFilenames(primary, additional, false);
    }

    private static List<String> collectOriginalFilenames(MultipartFile primary,
            List<MultipartFile> additional, boolean imageFallback) {
        List<String> noms = new ArrayList<>();
        if (primary != null && !primary.isEmpty()) {
            String n = primary.getOriginalFilename();
            noms.add(n != null && !n.isBlank() ? n : (imageFallback ? "image" : "contrat"));
        }
        if (additional == null) {
            return noms;
        }
        for (MultipartFile file : additional) {
            if (file != null && !file.isEmpty()) {
                String n = file.getOriginalFilename();
                noms.add(n != null && !n.isBlank() ? n : (imageFallback ? "image" : "piece-jointe"));
            }
        }
        return noms;
    }

    /**
     * Builds text extract from supporting documents (pièces jointes).
     * No longer includes constat — contract content comes from contenuContrat in DB.
     */
    private static String buildSupportingDocumentsExtract(MultipartFile contrat,
            List<MultipartFile> documents) {
        StringBuilder sb = new StringBuilder();
        appendExtract(sb, contrat, "Contrat d'assurance fourni");
        if (documents != null) {
            for (MultipartFile doc : documents) {
                appendExtract(sb, doc, "Pièce jointe");
            }
        }
        if (sb.length() == 0) {
            return "";
        }
        String full = sb.toString();
        if (full.length() > MAX_SUPPORTING_DOC_CHARS) {
            return full.substring(0, MAX_SUPPORTING_DOC_CHARS) + "\n… [extrait tronqué pour limite de contexte IA]";
        }
        return full;
    }

    private String buildAdminDocumentsExtract(String claimTypeCode) {
        String normalizedType = normalizeTypeCode(claimTypeCode);
        List<AppDocument> docs = appDocumentRepository.findAll();

        StringBuilder sb = new StringBuilder();

        docs.stream()
                .filter(doc -> doc != null && normalizeTypeCode(doc.getTypeDocument()).equals(normalizedType))
                .sorted(Comparator.comparing(AppDocument::getFileName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .forEach(doc -> {
                    if (sb.length() >= MAX_ADMIN_DOC_CHARS) {
                        return;
                    }
                    String text = extractPlainTextFromStoredDocument(doc);
                    if (!StringUtils.hasText(text)) {
                        return;
                    }
                    String fileName = StringUtils.hasText(doc.getFileName()) ? doc.getFileName().trim() : "document-admin";
                    sb.append("--- Document administratif: ").append(fileName).append(" ---\n");
                    sb.append(text.trim()).append("\n\n");
                });

        if (sb.length() == 0) {
            return "";
        }
        String full = sb.toString();
        if (full.length() > MAX_ADMIN_DOC_CHARS) {
            return full.substring(0, MAX_ADMIN_DOC_CHARS) + "\n… [extrait tronqué pour limite de contexte IA]";
        }
        return full;
    }

    private static void appendExtract(StringBuilder sb, MultipartFile file, String label) {
        if (file == null || file.isEmpty()) {
            return;
        }
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename() : "fichier";
        String extracted = extractPlainTextFromMultipart(file);
        if (!extracted.isBlank()) {
            sb.append("--- ").append(label).append(" (").append(name).append(") ---\n");
            sb.append(extracted.trim()).append("\n\n");
        }
    }

    private static String buildDeclarationForAi(String description, String lieu, LocalDateTime date) {
        StringBuilder b = new StringBuilder();
        if (lieu != null && !lieu.isBlank()) {
            b.append("Lieu déclaré de l'incident : ").append(lieu.trim()).append("\n");
        }
        if (date != null) {
            b.append("Date déclarée de l'incident : ").append(date.toLocalDate()).append("\n");
        }
        b.append("\nDescription du sinistre (assuré) :\n");
        b.append(description != null && !description.isBlank() ? description.trim() : "(non renseignée)");
        return b.toString();
    }

    private static final class ClaimResult {
        private final int scoreConfiance;
        private final String statut;

        private ClaimResult(int scoreConfiance, String statut) {
            this.scoreConfiance = scoreConfiance;
            this.statut = statut;
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
        } catch (Exception e) {
            log.warn("WARN extraction pièce jointe: {}", e.getMessage());
        }
        return "";
    }
}
