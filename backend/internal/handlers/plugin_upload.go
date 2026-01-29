package handlers

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/internal/services"
	"github.com/mello/backend/internal/storage"
	"github.com/mello/backend/pkg/logger"
	"github.com/mello/backend/pkg/utils"
	"go.uber.org/zap"
)

type PluginUploadHandler struct {
	service *services.PluginService
}

func NewPluginUploadHandler() *PluginUploadHandler {
	repo := repository.NewPluginRepository(database.DB)
	service := services.NewPluginService(repo)
	return &PluginUploadHandler{service: service}
}

// PluginManifest represents the manifest.json structure
type PluginManifest struct {
	Name         string   `json:"name"`
	Version      string   `json:"version"`
	Description  string   `json:"description"`
	Capabilities []string `json:"capabilities"`
	Permissions  []string `json:"permissions"`
}

// UploadPluginBundle handles uploading a plugin zip bundle
// POST /api/plugins/:id/upload
func (h *PluginUploadHandler) UploadPluginBundle(c *fiber.Ctx) error {
	pluginID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid plugin ID")
	}

	userID := middleware.GetUserID(c)
	isAdmin := middleware.IsAdmin(c)

	// Get plugin and check ownership
	plugin, err := h.service.GetPlugin(pluginID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch plugin")
	}
	if plugin == nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Plugin not found")
	}

	// Only author or admin can upload
	if !isAdmin && (plugin.AuthorID == nil || *plugin.AuthorID != userID) {
		return utils.ErrorResponse(c, fiber.StatusForbidden, "You don't have permission to upload to this plugin")
	}

	// Get file from form
	file, err := c.FormFile("file")
	if err != nil {
		return utils.ValidationErrorResponse(c, "No file provided")
	}

	// Check file size
	if file.Size > storage.MaxPluginSize {
		return utils.ValidationErrorResponse(c, fmt.Sprintf("Plugin bundle size exceeds maximum allowed size of %d MB", storage.MaxPluginSize/(1024*1024)))
	}

	// Check content type
	contentType := file.Header.Get("Content-Type")
	if contentType != "application/zip" && !strings.HasSuffix(file.Filename, ".zip") {
		return utils.ValidationErrorResponse(c, "Plugin bundle must be a ZIP file")
	}

	// Open file
	src, err := file.Open()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to open file")
	}
	defer src.Close()

	// Read entire file into memory for zip processing
	fileBytes, err := io.ReadAll(src)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to read file")
	}

	// Open as zip
	zipReader, err := zip.NewReader(bytes.NewReader(fileBytes), int64(len(fileBytes)))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid ZIP file")
	}

	// Validate and collect files
	var manifestFile *zip.File
	var clientFile *zip.File
	var stylesFile *zip.File
	var signatureFile *zip.File
	var manifest PluginManifest

	for _, f := range zipReader.File {
		name := filepath.Base(f.Name)
		switch name {
		case "manifest.json":
			manifestFile = f
		case "client.js":
			clientFile = f
		case "styles.css":
			stylesFile = f
		case "SIGNATURE":
			signatureFile = f
		}
	}

	// Validate required files
	if manifestFile == nil {
		return utils.ValidationErrorResponse(c, "Plugin bundle must contain manifest.json")
	}
	if clientFile == nil {
		return utils.ValidationErrorResponse(c, "Plugin bundle must contain client.js")
	}

	// Parse manifest
	manifestReader, err := manifestFile.Open()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to read manifest.json")
	}
	defer manifestReader.Close()

	if err := json.NewDecoder(manifestReader).Decode(&manifest); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid manifest.json format")
	}

	// Verify plugin signature if provided
	if signatureFile != nil {
		sigReader, err := signatureFile.Open()
		if err != nil {
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to read SIGNATURE file")
		}
		defer sigReader.Close()

		sigBytes, err := io.ReadAll(sigReader)
		if err != nil {
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to read SIGNATURE content")
		}

		// Parse signature JSON: { "algorithm": "ed25519", "publicKey": "...", "signature": "..." }
		var sig services.PluginSignature
		if err := json.Unmarshal(sigBytes, &sig); err != nil {
			return utils.ValidationErrorResponse(c, "Invalid SIGNATURE format")
		}

		// Compute bundle hash and verify
		bundleHash := services.ComputeBundleHash(fileBytes)
		if err := services.VerifyPluginSignature(bundleHash, &sig); err != nil {
			logger.Warn("Plugin signature verification failed",
				zap.String("plugin_id", pluginID.String()),
				zap.Error(err),
			)
			return utils.ValidationErrorResponse(c, "Plugin signature verification failed: "+err.Error())
		}

		logger.Info("Plugin signature verified successfully",
			zap.String("plugin_id", pluginID.String()),
		)
	} else {
		// Log warning for unsigned plugins
		logger.Warn("Plugin uploaded without signature",
			zap.String("plugin_id", pluginID.String()),
			zap.String("plugin_name", manifest.Name),
		)
	}

	// Get MinIO storage
	minioStorage := storage.GetMinioStorage()
	if minioStorage == nil {
		logger.Error("Upload failed: MinIO storage not initialized")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Storage not initialized")
	}

	ctx := context.Background()
	pluginIDStr := pluginID.String()

	// Delete existing plugin files first
	if err := minioStorage.DeletePluginFiles(ctx, pluginIDStr); err != nil {
		logger.Warn("Failed to delete existing plugin files", zap.Error(err))
	}

	// Upload manifest.json
	manifestReader2, _ := manifestFile.Open()
	defer manifestReader2.Close()
	manifestBytes, _ := io.ReadAll(manifestReader2)
	manifestURL, err := minioStorage.UploadPluginFile(ctx, bytes.NewReader(manifestBytes), "manifest.json", "application/json", int64(len(manifestBytes)), pluginIDStr)
	if err != nil {
		logger.Error("Failed to upload manifest.json", zap.Error(err))
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to upload manifest.json")
	}

	// Upload client.js
	clientReader, _ := clientFile.Open()
	defer clientReader.Close()
	clientBytes, _ := io.ReadAll(clientReader)
	clientURL, err := minioStorage.UploadPluginFile(ctx, bytes.NewReader(clientBytes), "client.js", "application/javascript", int64(len(clientBytes)), pluginIDStr)
	if err != nil {
		logger.Error("Failed to upload client.js", zap.Error(err))
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to upload client.js")
	}

	// Upload styles.css if exists
	var stylesURL string
	if stylesFile != nil {
		stylesReader, _ := stylesFile.Open()
		defer stylesReader.Close()
		stylesBytes, _ := io.ReadAll(stylesReader)
		stylesURL, err = minioStorage.UploadPluginFile(ctx, bytes.NewReader(stylesBytes), "styles.css", "text/css", int64(len(stylesBytes)), pluginIDStr)
		if err != nil {
			logger.Warn("Failed to upload styles.css", zap.Error(err))
		}
	}

	// Update plugin with new URLs
	updateReq := &models.UpdatePluginRequest{
		ManifestURL: manifestURL,
		ClientURL:   clientURL,
	}

	// Update name/version/description from manifest if provided
	if manifest.Name != "" {
		updateReq.Name = manifest.Name
	}
	if manifest.Version != "" {
		updateReq.Version = manifest.Version
	}
	if manifest.Description != "" {
		updateReq.Description = manifest.Description
	}
	if len(manifest.Capabilities) > 0 {
		updateReq.Capabilities = manifest.Capabilities
	}
	if len(manifest.Permissions) > 0 {
		updateReq.Permissions = manifest.Permissions
	}

	_, err = h.service.UpdatePlugin(pluginID, updateReq)
	if err != nil {
		logger.Error("Failed to update plugin", zap.Error(err))
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update plugin")
	}

	return utils.SuccessResponse(c, fiber.Map{
		"manifest_url": manifestURL,
		"client_url":   clientURL,
		"styles_url":   stylesURL,
		"message":      "Plugin bundle uploaded successfully",
	})
}
