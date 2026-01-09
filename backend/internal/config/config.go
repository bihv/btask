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
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	jwtExpiry, err := time.ParseDuration(getEnv("JWT_EXPIRY", "24h"))
	if err != nil {
		jwtExpiry = 24 * time.Hour
	}

	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://btask:btask123@localhost:5432/btask?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "your-super-secret-key"),
		JWTExpiry:   jwtExpiry,
		ServerPort:  getEnv("SERVER_PORT", "8080"),
		ServerEnv:   getEnv("SERVER_ENV", "development"),

		// MinIO config
		MinioEndpoint:  getEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinioAccessKey: getEnv("MINIO_ACCESS_KEY", "minioadmin"),
		MinioSecretKey: getEnv("MINIO_SECRET_KEY", "minioadmin"),
		MinioBucket:    getEnv("MINIO_BUCKET", "btask-uploads"),
		MinioUseSSL:    getEnv("MINIO_USE_SSL", "false") == "true",
		MinioPublicURL: getEnv("MINIO_PUBLIC_URL", "http://localhost:9000"),
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
