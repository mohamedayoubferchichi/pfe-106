package com.example.back_end.controller;

import com.example.back_end.service.OrchestratorAgent;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class AiExceptionHandler {

    @ExceptionHandler(OrchestratorAgent.AiUnavailableException.class)
    public ResponseEntity<Map<String, Object>> handleAiUnavailable(OrchestratorAgent.AiUnavailableException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "errorCode", "ERROR_AI_UNAVAILABLE",
                "message", ex.getMessage() != null && !ex.getMessage().isBlank()
                        ? ex.getMessage()
                        : "AI service unavailable"));
    }
}
