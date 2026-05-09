package com.example.back_end.repository;

import com.example.back_end.model.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    List<ChatMessage> findBySenderIdAndReceiverIdOrSenderIdAndReceiverIdOrderByCreatedAt(
            String s1, String r1, String s2, String r2);
            
    List<ChatMessage> findBySenderIdOrReceiverIdOrderByCreatedAt(String senderId, String receiverId);

    // Efficient: get conversation between two users without loading all
    List<ChatMessage> findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByCreatedAtAsc(
            String senderId1, String receiverId1, String senderId2, String receiverId2);

    // Unread count: messages sent to this user that are not read
    long countByReceiverIdAndIsRead(String receiverId, boolean isRead);

    // Unread messages for a specific receiver from a specific sender
    long countBySenderIdAndReceiverIdAndIsRead(String senderId, String receiverId, boolean isRead);

    // Mark messages as read: find unread messages in a conversation
    List<ChatMessage> findByReceiverIdAndSenderIdAndIsRead(String receiverId, String senderId, boolean isRead);

    // All messages where user is sender or receiver
    List<ChatMessage> findBySenderIdOrReceiverIdOrderByCreatedAtAsc(String senderId, String receiverId);
}
