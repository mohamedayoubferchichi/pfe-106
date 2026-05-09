package com.example.back_end.controller;

import com.example.back_end.model.AppDocument;
import com.example.back_end.repository.AppDocumentRepository;
import com.example.back_end.repository.TypeSinistreRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.Locale;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin("*")
public class AppDocumentController {

    private final AppDocumentRepository repository;
    private final TypeSinistreRepository typeSinistreRepository;

    public AppDocumentController(AppDocumentRepository repository, TypeSinistreRepository typeSinistreRepository) {
        this.repository = repository;
        this.typeSinistreRepository = typeSinistreRepository;
    }

    private String normalizeDocumentType(String rawType) {
        if (rawType == null || rawType.trim().isEmpty()) {
            return null;
        }

        String normalized = Normalizer.normalize(rawType, Normalizer.Form.NFD)
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
            case "AUTO":
                return "AUTO";
            case "HABITATION":
                return "HABITATION";
            case "VOYAGE":
                return "VOYAGE";
            case "PREVOYANCE":
                return "PREVOYANCE";
            default:
                return normalized;
        }
    }

    private boolean isKnownSinistreType(String normalizedType) {
        if (normalizedType == null || normalizedType.isEmpty()) {
            return false;
        }
        return typeSinistreRepository.findByCodeIgnoreCase(normalizedType).isPresent();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> addDocument(
            @RequestParam("typeDocument") String typeDocument,
            @RequestParam("file") MultipartFile file) {
        try {
            String normalizedType = normalizeDocumentType(typeDocument);

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Le fichier est obligatoire.");
            }
            if (!"application/pdf".equalsIgnoreCase(file.getContentType())) {
                return ResponseEntity.badRequest().body("Fichier invalide, seul le format PDF est accepté.");
            }
            if (normalizedType == null || normalizedType.isEmpty()) {
                return ResponseEntity.badRequest().body("Le type de document est obligatoire.");
            }
            if (!isKnownSinistreType(normalizedType)) {
                return ResponseEntity.badRequest().body("Type de document invalide. Selectionnez un type de sinistre existant.");
            }

            AppDocument doc = new AppDocument();
            doc.setTypeDocument(normalizedType);
            doc.setDateCreation(LocalDate.now());
            doc.setFileName(file.getOriginalFilename());
            doc.setContentType(file.getContentType());
            doc.setData(file.getBytes());

            AppDocument saved = repository.save(doc);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<AppDocument>> getAllDocuments() {
        return ResponseEntity.ok(repository.findAll());
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateDocument(
            @PathVariable String id,
            @RequestParam("typeDocument") String typeDocument,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            String normalizedType = normalizeDocumentType(typeDocument);
            Optional<AppDocument> existingOpt = repository.findById(id);
            if (!existingOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            if (normalizedType == null || normalizedType.isEmpty()) {
                return ResponseEntity.badRequest().body("Le type de document est obligatoire.");
            }
            if (!isKnownSinistreType(normalizedType)) {
                return ResponseEntity.badRequest().body("Type de document invalide. Selectionnez un type de sinistre existant.");
            }

            AppDocument doc = existingOpt.get();
            doc.setTypeDocument(normalizedType);

            if (file != null && !file.isEmpty()) {
                if (!"application/pdf".equalsIgnoreCase(file.getContentType())) {
                    return ResponseEntity.badRequest().body("Fichier invalide, seul le format PDF est accepté.");
                }
                doc.setFileName(file.getOriginalFilename());
                doc.setContentType(file.getContentType());
                doc.setData(file.getBytes());
            }

            AppDocument saved = repository.save(doc);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable String id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable String id) {
        Optional<AppDocument> docOpt = repository.findById(id);
        if (!docOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        AppDocument doc = docOpt.get();
        if (doc.getData() == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getFileName() + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(doc.getData());
    }
}
