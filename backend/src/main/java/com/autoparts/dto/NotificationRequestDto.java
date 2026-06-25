package com.autoparts.dto;

import com.autoparts.entity.NotificationRequest;
import lombok.Data;

@Data
public class NotificationRequestDto {
    private Long articleId;
    private NotificationRequest.NotificationType type;
    private String contactValue;
}
