package config

import (
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL string
	JWTSecret   string
	JWTExpiry   time.Duration
	ServerPort  string
	ServerEnv   string

	// MinIO config
	MinioEndpoint  string
	MinioAccessKey string
	MinioSecretKey string
	MinioBucket    string
	MinioUseSSL    bool
	MinioPublicURL string

	// Email config (SMTP)
	SMTPHost     string
	SMTPPort     string
	SMTPUser     string
	SMTPPassword string
	SMTPFrom     string
	AppURL       string

	// Admin
	InitialAdminEmail string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	jwtExpiry, err := time.ParseDuration(GetEnv("JWT_EXPIRY", "24h"))
	if err != nil {
		jwtExpiry = 24 * time.Hour
	}

	return &Config{
		DatabaseURL: GetEnv("DATABASE_URL", "postgres://mello:mello123@localhost:5432/mello?sslmode=disable"),
		JWTSecret:   GetEnv("JWT_SECRET", "your-super-secret-key"),
		JWTExpiry:   jwtExpiry,
		ServerPort:  GetEnv("SERVER_PORT", "8080"),
		ServerEnv:   GetEnv("SERVER_ENV", "development"),

		// MinIO config
		MinioEndpoint:  GetEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinioAccessKey: GetEnv("MINIO_ACCESS_KEY", "minioadmin"),
		MinioSecretKey: GetEnv("MINIO_SECRET_KEY", "minioadmin"),
		MinioBucket:    GetEnv("MINIO_BUCKET", "mello-uploads"),
		MinioUseSSL:    GetEnv("MINIO_USE_SSL", "false") == "true",
		MinioPublicURL: GetEnv("MINIO_PUBLIC_URL", "http://localhost:9000"),

		// SMTP config
		SMTPHost:     GetEnv("SMTP_HOST", ""),
		SMTPPort:     GetEnv("SMTP_PORT", "587"),
		SMTPUser:     GetEnv("SMTP_USER", ""),
		SMTPPassword: GetEnv("SMTP_PASSWORD", ""),
		SMTPFrom:     GetEnv("SMTP_FROM", ""),
		AppURL:       GetEnv("APP_URL", "http://localhost:3000"),

		// Admin
		InitialAdminEmail: GetEnv("INITIAL_ADMIN_EMAIL", ""),
	}, nil
}

var globalConfig *Config

// GetConfig returns the global config (must call Load first)
func GetConfig() *Config {
	if globalConfig == nil {
		cfg, _ := Load()
		globalConfig = cfg
	}
	return globalConfig
}

// SetConfig sets the global config (used during initialization)
func SetConfig(cfg *Config) {
	globalConfig = cfg
}

// GetEnv is a helper to get environment variables
func GetEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
