package com.example.back_end.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;

@Document(collection = "publications")
public class Publication {
    @Id
    private String id;
    private String titreFr;
    private String titreEn;
    private String categorieFr;
    private String categorieEn;
    private String imageUrl;
    private String descriptionFr;
    private String descriptionEn;
    private LocalDate datePublication;
    @JsonProperty("aLaUne")
    private boolean aLaUne;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitreFr() {
        return titreFr;
    }

    public void setTitreFr(String titreFr) {
        this.titreFr = titreFr;
    }

    public String getTitreEn() {
        return titreEn;
    }

    public void setTitreEn(String titreEn) {
        this.titreEn = titreEn;
    }

    public String getCategorieFr() {
        return categorieFr;
    }

    public void setCategorieFr(String categorieFr) {
        this.categorieFr = categorieFr;
    }

    public String getCategorieEn() {
        return categorieEn;
    }

    public void setCategorieEn(String categorieEn) {
        this.categorieEn = categorieEn;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getDescriptionFr() {
        return descriptionFr;
    }

    public void setDescriptionFr(String descriptionFr) {
        this.descriptionFr = descriptionFr;
    }

    public String getDescriptionEn() {
        return descriptionEn;
    }

    public void setDescriptionEn(String descriptionEn) {
        this.descriptionEn = descriptionEn;
    }

    public LocalDate getDatePublication() {
        return datePublication;
    }

    public void setDatePublication(LocalDate datePublication) {
        this.datePublication = datePublication;
    }

    public boolean isALaUne() {
        return aLaUne;
    }

    public void setALaUne(boolean aLaUne) {
        this.aLaUne = aLaUne;
    }
}
