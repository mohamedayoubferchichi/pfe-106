package com.example.back_end.config;

import com.example.back_end.model.Administrateur;
import com.example.back_end.model.TypeSinistre;
import com.example.back_end.repository.AdminRepository;
import com.example.back_end.repository.TypeSinistreRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer {

    private final AdminRepository adminRepository;
    private final TypeSinistreRepository typeSinistreRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            AdminRepository adminRepository,
            TypeSinistreRepository typeSinistreRepository,
            PasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.typeSinistreRepository = typeSinistreRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    public void init() {
        if (adminRepository.findByEmail("admin@gmail.com").isEmpty()) {

            Administrateur admin = new Administrateur();
            admin.setEmail("admin@gmail.com");
            admin.setPassword(passwordEncoder.encode("admin"));
            admin.setRole("ADMIN");

            adminRepository.save(admin);
        }

        if (typeSinistreRepository.count() == 0) {
            TypeSinistre auto = new TypeSinistre();
            auto.setCode("AUTO");
            auto.setLabel("Accident automobile");

            TypeSinistre habitation = new TypeSinistre();
            habitation.setCode("HABITATION");
            habitation.setLabel("Sinistre habitation");

            TypeSinistre voyage = new TypeSinistre();
            voyage.setCode("VOYAGE");
            voyage.setLabel("Sinistre voyage");

            TypeSinistre prevoyance = new TypeSinistre();
            prevoyance.setCode("PREVOYANCE");
            prevoyance.setLabel("Sinistre prevoyance");

            typeSinistreRepository.saveAll(List.of(auto, habitation, voyage, prevoyance));
        }
    }
}
