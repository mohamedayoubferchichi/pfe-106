package com.example.back_end.repository;

import com.example.back_end.model.TypeSinistre;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface TypeSinistreRepository extends MongoRepository<TypeSinistre, String> {
    boolean existsByCodeIgnoreCase(String code);

    Optional<TypeSinistre> findByCodeIgnoreCase(String code);

    List<TypeSinistre> findAllByOrderByLabelAsc();
}
