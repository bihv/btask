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

	jwtExpiry, err := time.ParseDuration(getEnv("JWT_EXPIRY", "24h"))
	if err != nil {
		jwtExpiry = 24 * time.Hour
	}

	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://mello:mello123@localhost:5432/mello?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "your-super-secret-key"),
		JWTExpiry:   jwtExpiry,
		ServerPort:  getEnv("SERVER_PORT", "8080"),
		ServerEnv:   getEnv("SERVER_ENV", "development"),

		// MinIO config
		MinioEndpoint:  getEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinioAccessKey: getEnv("MINIO_ACCESS_KEY", "minioadmin"),
		MinioSecretKey: getEnv("MINIO_SECRET_KEY", "minioadmin"),
		MinioBucket:    getEnv("MINIO_BUCKET", "mello-uploads"),
		MinioUseSSL:    getEnv("MINIO_USE_SSL", "false") == "true",
		MinioPublicURL: getEnv("MINIO_PUBLIC_URL", "http://localhost:9000"),

		// SMTP config
		SMTPHost:     getEnv("SMTP_HOST", ""),
		SMTPPort:     getEnv("SMTP_PORT", "587"),
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		SMTPFrom:     getEnv("SMTP_FROM", ""),
		AppURL:       getEnv("APP_URL", "http://localhost:3000"),

		// Admin
		InitialAdminEmail: getEnv("INITIAL_ADMIN_EMAIL", ""),
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

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
