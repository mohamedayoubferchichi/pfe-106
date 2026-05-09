package com.example.back_end.controller;

import com.example.back_end.model.Sinistre;
import com.example.back_end.service.SinistreService;
import com.example.back_end.service.UtilisateurService;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sinistres")
@CrossOrigin("*")
public class SinistreController {

    private final SinistreService sinistreService;
    private final UtilisateurService utilisateurService;

    public SinistreController(SinistreService sinistreService, UtilisateurService utilisateurService) {
        this.sinistreService = sinistreService;
        this.utilisateurService = utilisateurService;
    }

    @GetMapping("/me")
    public ResponseEntity<List<Sinistre>> mesSinistres(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(List.of());
        }

        String cin = utilisateurService.getProfileByEmail(authentication.getName()).getCin();
        return ResponseEntity.ok(sinistreService.findByCinUtilisateur(cin));
    }

    @PostMapping(value = "/declarer", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Sinistre> declarerSinistre(
            @RequestParam("cin") String cin,
            @RequestParam("typeSinistre") String typeSinistre,
            @RequestParam("description") String description,
            @RequestParam("lieu") String lieu,
            @RequestParam("date") String dateStr,
            @RequestParam(value = "numeroContrat", required = false) String numeroContrat,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "images", required = false) MultipartFile[] images,
            @RequestParam(value = "contrat", required = false) MultipartFile contrat,
            @RequestParam(value = "documents", required = false) MultipartFile[] documents,
            @RequestParam(value = "preClaimAnalysis", required = false) String preClaimAnalysis,
            @RequestParam(value = "preImageAnalysis", required = false) String preImageAnalysis) {

        LocalDateTime date;
        try {
            date = LocalDateTime.parse(dateStr);
        } catch (Exception e) {
            System.out.println("FALLBACK DATE: " + dateStr);
            date = LocalDateTime.now();
        }
        List<MultipartFile> imageParts = normalizeParts(images);
        List<MultipartFile> docParts = normalizeParts(documents);
        System.out.println("DEBUG declarer multipart: imageField=" + (image != null && !image.isEmpty()) + " imagesParts="
                + imageParts.size() + " documentsParts=" + docParts.size());
        Sinistre result = sinistreService.declarerSinistre(cin, typeSinistre, description, lieu, date, image, imageParts,
            contrat, docParts, numeroContrat, preClaimAnalysis, preImageAnalysis);

        return ResponseEntity.ok(result);
    }

    private static List<MultipartFile> normalizeParts(MultipartFile[] parts) {
        if (parts == null || parts.length == 0) {
            return List.of();
        }
        return Arrays.stream(parts)
                .filter(f -> f != null && !f.isEmpty())
                .collect(Collectors.toList());
    }
}
