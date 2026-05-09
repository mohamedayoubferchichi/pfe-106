package com.example.back_end.controller;

import com.example.back_end.dto.TypeSinistreRequest;
import com.example.back_end.model.TypeSinistre;
import com.example.back_end.service.TypeSinistreService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sinistre-types")
@CrossOrigin("*")
public class TypeSinistreController {

    private final TypeSinistreService typeSinistreService;

    public TypeSinistreController(TypeSinistreService typeSinistreService) {
        this.typeSinistreService = typeSinistreService;
    }

    @GetMapping
    public List<TypeSinistre> listAll() {
        return typeSinistreService.listAll();
    }

    @PostMapping
    public ResponseEntity<TypeSinistre> create(@RequestBody TypeSinistreRequest request) {
        return ResponseEntity.ok(typeSinistreService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TypeSinistre> update(@PathVariable String id, @RequestBody TypeSinistreRequest request) {
        return ResponseEntity.ok(typeSinistreService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        typeSinistreService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
