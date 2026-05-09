package com.example.back_end.service;

import com.example.back_end.model.Publication;
import com.example.back_end.repository.PublicationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PublicationService {

    private final PublicationRepository publicationRepository;

    public PublicationService(PublicationRepository publicationRepository) {
        this.publicationRepository = publicationRepository;
    }

    public List<Publication> findAll() {
        return publicationRepository.findAllByOrderByDatePublicationDesc();
    }

    public Publication findById(String id) {
        return publicationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Publication non trouvée"));
    }

    public Publication create(Publication request) {
        if (!StringUtils.hasText(request.getTitreFr()) || !StringUtils.hasText(request.getTitreEn())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Les titres FR et EN sont obligatoires");
        }
        Publication publication = new Publication();
        applyFields(publication, request);
        return publicationRepository.save(publication);
    }

    public Publication update(String id, Publication request) {
        Publication publication = publicationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Publication non trouvée"));
        if (!StringUtils.hasText(request.getTitreFr()) || !StringUtils.hasText(request.getTitreEn())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Les titres FR et EN sont obligatoires");
        }
        applyFields(publication, request);
        return publicationRepository.save(publication);
    }

    public void delete(String id) {
        if (!publicationRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Publication non trouvée");
        }
        publicationRepository.deleteById(id);
    }

    private void applyFields(Publication target, Publication source) {
        target.setTitreFr(normalize(source.getTitreFr()));
        target.setTitreEn(normalize(source.getTitreEn()));
        target.setCategorieFr(normalize(source.getCategorieFr()));
        target.setCategorieEn(normalize(source.getCategorieEn()));
        target.setImageUrl(normalize(source.getImageUrl()));
        target.setDescriptionFr(normalize(source.getDescriptionFr()));
        target.setDescriptionEn(normalize(source.getDescriptionEn()));
        target.setDatePublication(source.getDatePublication());
        target.setALaUne(source.isALaUne());
    }

    private String normalize(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

}
