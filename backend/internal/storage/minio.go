package storage

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/config"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type MinioStorage struct {
	client    *minio.Client
	bucket    string
	publicURL string
}

var minioInstance *MinioStorage

// InitMinioStorage initializes the MinIO client
func InitMinioStorage(cfg *config.Config) error {
	client, err := minio.New(cfg.MinioEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.MinioAccessKey, cfg.MinioSecretKey, ""),
		Secure: cfg.MinioUseSSL,
	})
	if err != nil {
		return fmt.Errorf("failed to create minio client: %w", err)
	}

	// Check if bucket exists
	ctx := context.Background()
	exists, err := client.BucketExists(ctx, cfg.MinioBucket)
	if err != nil {
		return fmt.Errorf("failed to check bucket existence: %w", err)
	}

	if !exists {
		err = client.MakeBucket(ctx, cfg.MinioBucket, minio.MakeBucketOptions{})
		if err != nil {
			return fmt.Errorf("failed to create bucket: %w", err)
		}
	}

	minioInstance = &MinioStorage{
		client:    client,
		bucket:    cfg.MinioBucket,
		publicURL: cfg.MinioPublicURL,
	}

	return nil
}

// GetMinioStorage returns the singleton instance
func GetMinioStorage() *MinioStorage {
	return minioInstance
}

// UploadFile uploads a file to MinIO and returns the public URL
func (s *MinioStorage) UploadFile(ctx context.Context, file io.Reader, filename string, contentType string, size int64) (string, error) {
	return s.UploadFileWithPrefix(ctx, file, filename, contentType, size, "")
}

// UploadFileWithPrefix uploads a file to MinIO with a custom prefix (e.g., users/{userId})
func (s *MinioStorage) UploadFileWithPrefix(ctx context.Context, file io.Reader, filename string, contentType string, size int64, prefix string) (string, error) {
	// Generate unique filename
	ext := filepath.Ext(filename)
	uniqueName := fmt.Sprintf("%s-%s%s", time.Now().Format("20060102"), uuid.New().String(), ext)

	// Add prefix if provided
	objectName := uniqueName
	if prefix != "" {
		objectName = fmt.Sprintf("%s/%s", prefix, uniqueName)
	}

	// Upload file
	_, err := s.client.PutObject(ctx, s.bucket, objectName, file, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %w", err)
	}

	// Return public URL
	url := fmt.Sprintf("%s/%s/%s", s.publicURL, s.bucket, objectName)
	return url, nil
}

// DeleteFile deletes a file from MinIO
func (s *MinioStorage) DeleteFile(ctx context.Context, fileURL string) error {
	// Extract object name from URL
	objectName := extractObjectName(fileURL, s.bucket)
	if objectName == "" {
		return fmt.Errorf("invalid file URL")
	}

	err := s.client.RemoveObject(ctx, s.bucket, objectName, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return nil
}

// extractObjectName extracts the object name from a full URL
func extractObjectName(url, bucket string) string {
	// URL format: http://localhost:9000/mello-uploads/filename.jpg
	parts := strings.Split(url, "/"+bucket+"/")
	if len(parts) < 2 {
		return ""
	}
	return parts[1]
}

// GetPluginContentTypes returns content types allowed for plugin files
func GetPluginContentTypes() map[string]bool {
	return map[string]bool{
		"application/javascript": true,
		"text/javascript":        true,
		"application/json":       true,
		"text/css":               true,
		"application/zip":        true,
	}
}

// MaxPluginSize is the maximum allowed plugin bundle size (10MB)
const MaxPluginSize = 10 * 1024 * 1024

// UploadPluginFile uploads a plugin file with exact filename (no UUID)
func (s *MinioStorage) UploadPluginFile(ctx context.Context, file io.Reader, filename string, contentType string, size int64, pluginID string) (string, error) {
	// Use exact path: plugins/{pluginID}/{filename}
	objectName := fmt.Sprintf("plugins/%s/%s", pluginID, filename)

	// Upload file
	_, err := s.client.PutObject(ctx, s.bucket, objectName, file, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload plugin file: %w", err)
	}

	// Return public URL
	url := fmt.Sprintf("%s/%s/%s", s.publicURL, s.bucket, objectName)
	return url, nil
}

// DeletePluginFiles deletes all files for a plugin
func (s *MinioStorage) DeletePluginFiles(ctx context.Context, pluginID string) error {
	prefix := fmt.Sprintf("plugins/%s/", pluginID)

	objectsCh := s.client.ListObjects(ctx, s.bucket, minio.ListObjectsOptions{
		Prefix:    prefix,
		Recursive: true,
	})

	for object := range objectsCh {
		if object.Err != nil {
			return fmt.Errorf("error listing plugin files: %w", object.Err)
		}
		err := s.client.RemoveObject(ctx, s.bucket, object.Key, minio.RemoveObjectOptions{})
		if err != nil {
			return fmt.Errorf("failed to delete plugin file %s: %w", object.Key, err)
		}
	}

	return nil
}
