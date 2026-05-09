package com.example.back_end.service;

import com.example.back_end.dto.TypeSinistreRequest;
import com.example.back_end.model.TypeSinistre;
import com.example.back_end.repository.TypeSinistreRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TypeSinistreService {

    private final TypeSinistreRepository typeSinistreRepository;

    public TypeSinistreService(TypeSinistreRepository typeSinistreRepository) {
        this.typeSinistreRepository = typeSinistreRepository;
    }

    public List<TypeSinistre> listAll() {
        return typeSinistreRepository.findAllByOrderByLabelAsc();
    }

    public TypeSinistre create(TypeSinistreRequest request) {
        String label = normalizeLabel(request.getLabel());
        String code = normalizeCode(StringUtils.hasText(request.getCode()) ? request.getCode() : label);

        if (typeSinistreRepository.existsByCodeIgnoreCase(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce code de type existe deja.");
        }

        TypeSinistre typeSinistre = new TypeSinistre();
        typeSinistre.setCode(code);
        typeSinistre.setLabel(label);
        typeSinistre.setLabelEn(normalizeOptionalText(request.getLabelEn()));
        applyPageContent(typeSinistre, request);
        typeSinistre.setCreatedAt(LocalDateTime.now());
        typeSinistre.setUpdatedAt(LocalDateTime.now());
        return typeSinistreRepository.save(typeSinistre);
    }

    public TypeSinistre update(String id, TypeSinistreRequest request) {
        TypeSinistre existingType = typeSinistreRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Type de sinistre introuvable."));

        String nextLabel = normalizeLabel(request.getLabel());
        String nextCode = normalizeCode(StringUtils.hasText(request.getCode()) ? request.getCode() : nextLabel);

        typeSinistreRepository.findByCodeIgnoreCase(nextCode).ifPresent(other -> {
            if (!other.getId().equals(existingType.getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce code de type existe deja.");
            }
        });

        existingType.setLabel(nextLabel);
        existingType.setCode(nextCode);
        existingType.setLabelEn(normalizeOptionalText(request.getLabelEn()));
        applyPageContent(existingType, request);
        existingType.setUpdatedAt(LocalDateTime.now());
        return typeSinistreRepository.save(existingType);
    }

    public void delete(String id) {
        if (!typeSinistreRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Type de sinistre introuvable.");
        }
        typeSinistreRepository.deleteById(id);
    }

    private String normalizeLabel(String rawLabel) {
        if (!StringUtils.hasText(rawLabel)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le label du type de sinistre est obligatoire.");
        }
        return rawLabel.trim();
    }

    private String normalizeCode(String rawCode) {
        if (!StringUtils.hasText(rawCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le code du type de sinistre est obligatoire.");
        }

        String normalized = rawCode
                .trim()
                .replaceAll("\\s+", "_")
                .replaceAll("[^A-Za-z0-9_]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "")
                .toUpperCase();

        if (!StringUtils.hasText(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le code du type de sinistre est invalide.");
        }

        return normalized;
    }

    private void applyPageContent(TypeSinistre typeSinistre, TypeSinistreRequest request) {
        typeSinistre.setPageKicker(normalizeOptionalText(request.getPageKicker()));
        typeSinistre.setPageKickerEn(normalizeOptionalText(request.getPageKickerEn()));
        typeSinistre.setHeroTitle(normalizeOptionalText(request.getHeroTitle()));
        typeSinistre.setHeroTitleEn(normalizeOptionalText(request.getHeroTitleEn()));
        typeSinistre.setHeroTag(normalizeOptionalText(request.getHeroTag()));
        typeSinistre.setHeroTagEn(normalizeOptionalText(request.getHeroTagEn()));
        typeSinistre.setHeroHeadline(normalizeOptionalText(request.getHeroHeadline()));
        typeSinistre.setHeroHeadlineEn(normalizeOptionalText(request.getHeroHeadlineEn()));
        typeSinistre.setHeroDescription(normalizeOptionalText(request.getHeroDescription()));
        typeSinistre.setHeroDescriptionEn(normalizeOptionalText(request.getHeroDescriptionEn()));
        typeSinistre.setHeroImageUrl(normalizeOptionalText(request.getHeroImageUrl()));
        typeSinistre.setGuaranteesTitle(normalizeOptionalText(request.getGuaranteesTitle()));
        typeSinistre.setGuaranteesTitleEn(normalizeOptionalText(request.getGuaranteesTitleEn()));
        typeSinistre.setGuaranteesRaw(normalizeOptionalMultilineText(request.getGuaranteesRaw()));
        typeSinistre.setGuaranteesRawEn(normalizeOptionalMultilineText(request.getGuaranteesRawEn()));
        typeSinistre.setServicesKicker(normalizeOptionalText(request.getServicesKicker()));
        typeSinistre.setServicesKickerEn(normalizeOptionalText(request.getServicesKickerEn()));
        typeSinistre.setServicesTitle(normalizeOptionalText(request.getServicesTitle()));
        typeSinistre.setServicesTitleEn(normalizeOptionalText(request.getServicesTitleEn()));
        typeSinistre.setServicesRaw(normalizeOptionalMultilineText(request.getServicesRaw()));
        typeSinistre.setServicesRawEn(normalizeOptionalMultilineText(request.getServicesRawEn()));
        typeSinistre.setFlowKicker(normalizeOptionalText(request.getFlowKicker()));
        typeSinistre.setFlowKickerEn(normalizeOptionalText(request.getFlowKickerEn()));
        typeSinistre.setFlowTitle(normalizeOptionalText(request.getFlowTitle()));
        typeSinistre.setFlowTitleEn(normalizeOptionalText(request.getFlowTitleEn()));
        typeSinistre.setStepsRaw(normalizeOptionalMultilineText(request.getStepsRaw()));
        typeSinistre.setStepsRawEn(normalizeOptionalMultilineText(request.getStepsRawEn()));
        typeSinistre.setStatsTitle(normalizeOptionalText(request.getStatsTitle()));
        typeSinistre.setStatsTitleEn(normalizeOptionalText(request.getStatsTitleEn()));
        typeSinistre.setStatsDescription(normalizeOptionalText(request.getStatsDescription()));
        typeSinistre.setStatsDescriptionEn(normalizeOptionalText(request.getStatsDescriptionEn()));
        typeSinistre.setStatsRaw(normalizeOptionalMultilineText(request.getStatsRaw()));
        typeSinistre.setStatsRawEn(normalizeOptionalMultilineText(request.getStatsRawEn()));
    }

    private String normalizeOptionalText(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String normalizeOptionalMultilineText(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String normalized = value
                .replace("\r\n", "\n")
                .replace("\r", "\n")
                .trim();

        return StringUtils.hasText(normalized) ? normalized : null;
    }
}
