package middleware

import (
	"strings"

	"github.com/btask/backend/internal/config"
	"github.com/btask/backend/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	UserID uuid.UUID `json:"user_id"`
	Email  string    `json:"email"`
	jwt.RegisteredClaims
}

func AuthMiddleware(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return utils.UnauthorizedResponse(c, "Missing authorization header")
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return utils.UnauthorizedResponse(c, "Invalid authorization header format")
		}

		tokenString := parts[1]

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(cfg.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			return utils.UnauthorizedResponse(c, "Invalid or expired token")
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			return utils.UnauthorizedResponse(c, "Invalid token claims")
		}

		c.Locals("userID", claims.UserID)
		c.Locals("userEmail", claims.Email)

		return c.Next()
	}
}

func GetUserID(c *fiber.Ctx) uuid.UUID {
	userID, ok := c.Locals("userID").(uuid.UUID)
	if !ok {
		return uuid.Nil
	}
	return userID
}

func GetUserEmail(c *fiber.Ctx) string {
	email, ok := c.Locals("userEmail").(string)
	if !ok {
		return ""
	}
	return email
}

// GetUserIDFromWS extracts user ID from WebSocket connection query params
func GetUserIDFromWS(c interface {
	Query(string, ...string) string
}) uuid.UUID {
	tokenString := c.Query("token")
	if tokenString == "" {
		return uuid.Nil
	}

	cfg := config.GetConfig()
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		return uuid.Nil
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return uuid.Nil
	}

	return claims.UserID
}
