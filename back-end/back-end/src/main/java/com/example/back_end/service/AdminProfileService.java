package com.example.back_end.service;

import com.example.back_end.dto.AdminProfileResponse;
import com.example.back_end.dto.AdminProfileUpdateRequest;
import com.example.back_end.model.Administrateur;
import com.example.back_end.repository.AdminRepository;
import com.example.back_end.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminProfileService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AdminProfileService(
            AdminRepository adminRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AdminProfileResponse getCurrentProfile(Authentication authentication) {
        Administrateur admin = loadCurrentAdmin(authentication);
        return toResponse(admin);
    }

    public AdminProfileResponse updateCurrentProfile(AdminProfileUpdateRequest request, Authentication authentication) {
        Administrateur admin = loadCurrentAdmin(authentication);

        String nextEmail = StringUtils.hasText(request.getEmail()) ? request.getEmail().trim() : admin.getEmail();
        boolean isEmailChanged = StringUtils.hasText(request.getEmail())
                && !nextEmail.equalsIgnoreCase(admin.getEmail());

        if (StringUtils.hasText(request.getEmail())) {
            adminRepository.findByEmailIgnoreCase(nextEmail).ifPresent(otherAdmin -> {
                if (!otherAdmin.getId().equals(admin.getId())) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet email admin existe deja.");
                }
            });

            admin.setEmail(nextEmail);
        }

        boolean hasCurrentPassword = StringUtils.hasText(request.getCurrentPassword());
        boolean hasNewPassword = StringUtils.hasText(request.getNewPassword());
        boolean hasConfirmNewPassword = StringUtils.hasText(request.getConfirmNewPassword());
        boolean wantsPasswordChange = hasNewPassword || hasConfirmNewPassword;

        if (!isEmailChanged && !wantsPasswordChange) {
            return toResponse(adminRepository.save(admin));
        }

        if (!wantsPasswordChange) {
            return toResponse(adminRepository.save(admin));
        }

        if (!hasCurrentPassword) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mot de passe actuel obligatoire.");
        }

        if (!hasNewPassword) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nouveau mot de passe obligatoire.");
        }
        if (!hasConfirmNewPassword) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Confirmation du nouveau mot de passe obligatoire.");
        }

        String currentPassword = request.getCurrentPassword().trim();
        String newPassword = request.getNewPassword().trim();
        String confirmNewPassword = request.getConfirmNewPassword().trim();

        if (!passwordEncoder.matches(currentPassword, admin.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mot de passe actuel incorrect.");
        }

        if (!newPassword.equals(confirmNewPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Confirmation du nouveau mot de passe invalide.");
        }

        admin.setPassword(passwordEncoder.encode(newPassword));

        Administrateur savedAdmin = adminRepository.save(admin);
        return toResponse(savedAdmin);
    }

    private Administrateur loadCurrentAdmin(Authentication authentication) {
        if (authentication == null || !StringUtils.hasText(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session admin invalide.");
        }

        String adminEmail = authentication.getName();
        return adminRepository.findByEmailIgnoreCase(adminEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compte admin introuvable."));
    }

    private AdminProfileResponse toResponse(Administrateur admin) {
        AdminProfileResponse response = new AdminProfileResponse();
        response.setId(admin.getId());
        response.setEmail(admin.getEmail());
        response.setRole(admin.getRole());
        response.setToken(jwtService.generateToken(admin.getEmail(), admin.getRole(), admin.getId()));
        return response;
    }
}
