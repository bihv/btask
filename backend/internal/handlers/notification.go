package handlers

import (
	"github.com/btask/backend/internal/middleware"
	"github.com/btask/backend/internal/services"
	"github.com/btask/backend/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type NotificationHandler struct {
	service *services.NotificationService
}

func NewNotificationHandler() *NotificationHandler {
	return &NotificationHandler{
		service: services.NewNotificationService(),
	}
}

// GetNotifications gets all notifications for the current user
func (h *NotificationHandler) GetNotifications(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	notifications, err := h.service.GetByUserID(userID, 50) // Limit to 50
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}

	return utils.SuccessResponse(c, notifications)
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
