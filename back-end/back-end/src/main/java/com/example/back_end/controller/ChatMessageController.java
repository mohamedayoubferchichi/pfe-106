package com.example.back_end.controller;

import com.example.back_end.model.ChatMessage;
import com.example.back_end.service.ChatMessageService;
import com.example.back_end.service.ChatMessageService.Interlocutor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin("*")
public class ChatMessageController {

    private final ChatMessageService chatMessageService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatMessageController(ChatMessageService chatMessageService,
            SimpMessagingTemplate messagingTemplate) {
        this.chatMessageService = chatMessageService;
        this.messagingTemplate = messagingTemplate;
    }

    // ─── Endpoint REST (existant, gardé pour la compatibilité) ────────────────

    @PostMapping("/send")
    public ChatMessage sendMessageRest(@RequestBody ChatMessage message) {
        ChatMessage saved = chatMessageService.sendMessage(message);
        // Notifier en temps réel les deux participants via WebSocket
        notifyParticipants(saved);
        return saved;
    }

    @GetMapping("/conversation/{userId}/{partnerId}")
    public List<ChatMessage> getConversation(@PathVariable String userId, @PathVariable String partnerId) {
        return chatMessageService.getMessages(userId, partnerId);
    }

    @GetMapping("/interlocutors/{userId}/{role}")
    public List<Interlocutor> getInterlocutors(@PathVariable String userId, @PathVariable String role) {
        return chatMessageService.getInterlocutors(userId, role);
    }

    @GetMapping("/all-my-messages/{userId}")
    public List<ChatMessage> getAllMyMessages(@PathVariable String userId) {
        return chatMessageService.getAllMyMessages(userId);
    }

    // ─── Unread count endpoints ───────────────────────────────────────────────

    /**
     * Get the total unread message count for a user.
     */
    @GetMapping("/unread-count/{userId}")
    public Map<String, Long> getUnreadCount(@PathVariable String userId) {
        long count = chatMessageService.getUnreadCount(userId);
        return Map.of("unreadCount", count);
    }

    /**
     * Get unread counts grouped by partner (senderId).
     */
    @GetMapping("/unread-by-partner/{userId}")
    public Map<String, Long> getUnreadByPartner(@PathVariable String userId) {
        return chatMessageService.getUnreadCountByPartner(userId);
    }

    /**
     * Mark all messages from senderId to receiverId as read.
     * Called when a user opens a conversation.
     */
    @PostMapping("/mark-read")
    public Map<String, Object> markAsRead(@RequestBody Map<String, String> request) {
        String receiverId = request.get("receiverId");
        String senderId = request.get("senderId");
        int markedCount = chatMessageService.markAsRead(receiverId, senderId);
        return Map.of("markedCount", markedCount, "success", true);
    }

    // ─── Endpoint WebSocket STOMP ─────────────────────────────────────────────

    /**
     * Reçoit un message via WebSocket (client publie sur /app/chat.send)
     * et le diffuse en temps réel à l'expéditeur et au destinataire.
     */
    @MessageMapping("/chat.send")
    public void sendMessageWs(@Payload ChatMessage message) {
        ChatMessage saved = chatMessageService.sendMessage(message);
        notifyParticipants(saved);
    }

    // ─── Méthode utilitaire ───────────────────────────────────────────────────

    private void notifyParticipants(ChatMessage message) {
        // Only notify the RECEIVER via WebSocket (sender already has the message locally)
        if (message.getReceiverId() != null) {
            messagingTemplate.convertAndSendToUser(
                    message.getReceiverId(), "/queue/messages", message);
        }
    }
}
