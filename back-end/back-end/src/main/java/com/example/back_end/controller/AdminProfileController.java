package com.example.back_end.controller;

import com.example.back_end.dto.AdminProfileResponse;
import com.example.back_end.dto.AdminProfileUpdateRequest;
import com.example.back_end.service.AdminProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/profile")
@CrossOrigin("*")
public class AdminProfileController {

    private final AdminProfileService adminProfileService;

    public AdminProfileController(AdminProfileService adminProfileService) {
        this.adminProfileService = adminProfileService;
    }

    @GetMapping
    public ResponseEntity<AdminProfileResponse> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(adminProfileService.getCurrentProfile(authentication));
    }

    @PutMapping
    public ResponseEntity<AdminProfileResponse> updateMyProfile(
            @RequestBody AdminProfileUpdateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(adminProfileService.updateCurrentProfile(request, authentication));
    }
}
