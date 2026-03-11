package services

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/config"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
)

const (
	TokenCookieName    = "auth_token"
	MaxSessionsPerUser = 10
)

type AuthService struct {
	userRepo     *repository.UserRepository
	sessionRepo  *repository.SessionRepository
	config       *config.Config
}

func NewAuthService(config *config.Config) *AuthService {
	return &AuthService{
		userRepo:    repository.NewUserRepository(),
		sessionRepo: repository.NewSessionRepository(),
		config:      config,
	}
}

func (s *AuthService) GetUserRepo() *repository.UserRepository {
	return s.userRepo
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token     string               `json:"token"`
	SessionID string               `json:"session_id,omitempty"`
	User      models.UserResponse  `json:"user"`
}

type CreateSessionParams struct {
	UserID    uuid.UUID
	TokenHash string
	IPAddress string
	UserAgent string
}

func (s *AuthService) Register(req RegisterRequest) (*AuthResponse, error) {
	if s.userRepo.EmailExists(req.Email) {
		return nil, errors.New("email already exists")
	}

	user := &models.User{
		Email:    req.Email,
		FullName: req.FullName,
	}

	// Set as admin if email matches InitialAdminEmail
	if s.config.InitialAdminEmail != "" && strings.EqualFold(req.Email, s.config.InitialAdminEmail) {
		user.IsAdmin = true
	}

	if err := user.SetPassword(req.Password); err != nil {
		return nil, err
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token: token,
		User:  user.ToResponse(),
	}, nil
}

func (s *AuthService) Login(req LoginRequest, params CreateSessionParams) (*AuthResponse, error) {
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	if !user.CheckPassword(req.Password) {
		return nil, errors.New("invalid email or password")
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, err
	}

	// Create session if params provided
	var sessionID string
	if params.UserID != uuid.Nil {
		session, err := s.CreateSession(params)
		if err != nil {
			return nil, err
		}
		sessionID = session.ID.String()
	}

	return &AuthResponse{
		Token:     token,
		SessionID: sessionID,
		User:      user.ToResponse(),
	}, nil
}

func (s *AuthService) generateToken(user *models.User) (string, error) {
	claims := middleware.Claims{
		UserID: user.ID,
		Email:  user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.config.JWTExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.config.JWTSecret))
}

// HashToken creates a SHA256 hash of the token for storage
func HashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

// CreateSession creates a new user session
func (s *AuthService) CreateSession(params CreateSessionParams) (*models.UserSession, error) {
	// Check session limit
	count, err := s.sessionRepo.CountByUserID(params.UserID)
	if err != nil {
		return nil, err
	}

	if count >= MaxSessionsPerUser {
		// Delete oldest session to make room
		if err := s.sessionRepo.DeleteOldestByUserID(params.UserID); err != nil {
			return nil, err
		}
	}

	// Unset current flag from all other sessions
	if err := s.sessionRepo.SetCurrentSession(params.UserID, uuid.Nil); err != nil {
		return nil, err
	}

	deviceType, deviceName := parseUserAgent(params.UserAgent)

	session := &models.UserSession{
		UserID:     params.UserID,
		TokenHash:  params.TokenHash,
		DeviceType: deviceType,
		DeviceName: deviceName,
		IPAddress:  params.IPAddress,
		UserAgent:  params.UserAgent,
		IsCurrent:  true,
		ExpiresAt:  time.Now().Add(s.config.JWTExpiry),
	}

	if err := s.sessionRepo.Create(session); err != nil {
		return nil, err
	}

	return session, nil
}

// parseUserAgent extracts device type and name from UserAgent string
func parseUserAgent(userAgent string) (deviceType, deviceName string) {
	ua := strings.ToLower(userAgent)

	// Detect device type
	if strings.Contains(ua, "mobile") || strings.Contains(ua, "android") {
		deviceType = "mobile"
	} else if strings.Contains(ua, "tablet") || strings.Contains(ua, "ipad") {
		deviceType = "tablet"
	} else {
		deviceType = "desktop"
	}

	// Detect browser/OS name
	if strings.Contains(ua, "chrome") {
		deviceName = "Chrome"
	} else if strings.Contains(ua, "firefox") {
		deviceName = "Firefox"
	} else if strings.Contains(ua, "safari") && !strings.Contains(ua, "chrome") {
		deviceName = "Safari"
	} else if strings.Contains(ua, "edge") {
		deviceName = "Edge"
	} else if strings.Contains(ua, "opera") || strings.Contains(ua, "opr") {
		deviceName = "Opera"
	} else {
		deviceName = "Unknown Browser"
	}

	// Add OS info
	if strings.Contains(ua, "windows") {
		deviceName += " (Windows)"
	} else if strings.Contains(ua, "mac os") || strings.Contains(ua, "darwin") {
		deviceName += " (macOS)"
	} else if strings.Contains(ua, "linux") {
		deviceName += " (Linux)"
	} else if strings.Contains(ua, "android") {
		deviceName += " (Android)"
	} else if strings.Contains(ua, "ios") || strings.Contains(ua, "iphone") || strings.Contains(ua, "ipad") {
		deviceName += " (iOS)"
	}

	return deviceType, deviceName
}

// RevokeSession revokes a specific session
func (s *AuthService) RevokeSession(sessionID uuid.UUID) error {
	return s.sessionRepo.Delete(sessionID)
}

// RevokeAllSessions revokes all sessions for a user except the current one
func (s *AuthService) RevokeAllSessions(userID uuid.UUID, exceptSessionID uuid.UUID) error {
	return s.sessionRepo.DeleteOtherSessions(userID, exceptSessionID)
}

// GetSessions returns all sessions for a user
func (s *AuthService) GetSessions(userID uuid.UUID) ([]models.SessionResponse, error) {
	sessions, err := s.sessionRepo.FindByUserID(userID)
	if err != nil {
		return nil, err
	}

	responses := make([]models.SessionResponse, len(sessions))
	for i, session := range sessions {
		responses[i] = session.ToResponse()
	}

	return responses, nil
}

// SetTokenCookie sets the JWT token as an httpOnly cookie
func SetTokenCookie(c *fiber.Ctx, token string) error {
	cfg := config.GetConfig()
	isProduction := cfg.ServerEnv == "production"

	cookie := fiber.Cookie{
		Name:     TokenCookieName,
		Value:    token,
		Path:     "/",
		HTTPOnly: true,
		Secure:   isProduction, // Only HTTPS in production
		SameSite: "Lax",
		MaxAge:   int(cfg.JWTExpiry.Seconds()),
	}
	c.Cookie(&cookie)
	return nil
}

// ClearTokenCookie clears the auth token cookie
func ClearTokenCookie(c *fiber.Ctx) error {
	cookie := fiber.Cookie{
		Name:   TokenCookieName,
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	}
	c.Cookie(&cookie)
	return nil
}
