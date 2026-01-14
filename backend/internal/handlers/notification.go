package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/services"
	"github.com/mello/backend/pkg/utils"
)

type NotificationHandler struct {
	service *services.NotificationService
}

func NewNotificationHandler() *NotificationHandler {
	return &NotificationHandler{
		service: services.NewNotificationService(),
	}
}

// GetNotifications gets notifications for the current user with pagination
func (h *NotificationHandler) GetNotifications(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	// Parse pagination parameters
	limit := 20
	offset := 0
	unreadOnly := false

	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 50 {
			limit = parsed
		}
	}

	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	if c.Query("unread_only") == "true" {
		unreadOnly = true
	}

	notifications, total, err := h.service.GetByUserIDPaginated(userID, limit, offset, unreadOnly)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}

	hasMore := offset+len(notifications) < int(total)

	return utils.SuccessResponse(c, fiber.Map{
		"notifications": notifications,
		"total":         total,
		"has_more":      hasMore,
		"offset":        offset,
		"limit":         limit,
	})
}

// GetUnreadCount gets unread notification count
func (h *NotificationHandler) GetUnreadCount(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	count, err := h.service.GetUnreadCount(userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}

	return utils.SuccessResponse(c, fiber.Map{"count": count})
}

// MarkAsRead marks a notification as read
func (h *NotificationHandler) MarkAsRead(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid notification ID")
	}

	if err := h.service.MarkAsRead(notificationID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Notification marked as read")
}

// MarkAsUnread marks a notification as unread
func (h *NotificationHandler) MarkAsUnread(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid notification ID")
	}

	if err := h.service.MarkAsUnread(notificationID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Notification marked as unread")
}

// MarkAllAsRead marks all notifications as read
func (h *NotificationHandler) MarkAllAsRead(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	if err := h.service.MarkAllAsRead(userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}

	return utils.SuccessMessageResponse(c, "All notifications marked as read")
}

// WatchList subscribes user to list notifications
func (h *NotificationHandler) WatchList(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	listID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid list ID")
	}

	if err := h.service.Watch(listID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Now watching list")
}

// UnwatchList unsubscribes user from list notifications
func (h *NotificationHandler) UnwatchList(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	listID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid list ID")
	}

	if err := h.service.Unwatch(listID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Stopped watching list")
}

// IsWatching checks if user is watching a list
func (h *NotificationHandler) IsWatching(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	listID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid list ID")
	}

	isWatching := h.service.IsWatching(listID, userID)

	return utils.SuccessResponse(c, fiber.Map{"is_watching": isWatching})
}
