package services

import (
	"errors"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/mello/backend/internal/config"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
)

type AuthService struct {
	userRepo *repository.UserRepository
	config   *config.Config
}

func NewAuthService(config *config.Config) *AuthService {
	return &AuthService{
		userRepo: repository.NewUserRepository(),
		config:   config,
	}
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
	Token string              `json:"token"`
	User  models.UserResponse `json:"user"`
}

// Cookie names
const (
	TokenCookieName = "auth_token"
)

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

func (s *AuthService) Login(req LoginRequest) (*AuthResponse, error) {
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

	return &AuthResponse{
		Token: token,
		User:  user.ToResponse(),
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
