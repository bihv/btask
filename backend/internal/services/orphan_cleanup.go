package services

import (
	"context"
	"time"

	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/internal/storage"
	"github.com/mello/backend/pkg/logger"
	"go.uber.org/zap"
)

type OrphanCleanupService struct {
	attachmentRepo *repository.AttachmentRepository
	settingsRepo   *repository.SystemSettingsRepository
	stopChan       chan struct{}
}

func NewOrphanCleanupService() *OrphanCleanupService {
	return &OrphanCleanupService{
		attachmentRepo: repository.NewAttachmentRepository(),
		settingsRepo:   repository.NewSystemSettingsRepository(),
		stopChan:       make(chan struct{}),
	}
}

// Start starts the cleanup job that runs daily
func (s *OrphanCleanupService) Start() {
	logger.Info("Starting orphan cleanup service")
	go s.runCleanupLoop()
}

// Stop stops the cleanup job
func (s *OrphanCleanupService) Stop() {
	close(s.stopChan)
	logger.Info("Orphan cleanup service stopped")
}

func (s *OrphanCleanupService) runCleanupLoop() {
	// Run cleanup immediately on start
	s.runCleanup()

	// Then run every 24 hours
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.runCleanup()
		case <-s.stopChan:
			return
		}
	}
}

func (s *OrphanCleanupService) runCleanup() {
	settings, err := s.settingsRepo.Get()
	if err != nil {
		logger.Error("Failed to get system settings for orphan cleanup", zap.Error(err))
		return
	}

	if !settings.OrphanCleanupEnabled {
		logger.Debug("Orphan cleanup is disabled, skipping")
		return
	}

	logger.Info("Running orphan cleanup job",
		zap.Int("cleanup_days", settings.OrphanCleanupDays),
	)

	// Get orphaned attachments older than X days
	orphanedAttachments, err := s.attachmentRepo.GetOrphanedAttachments(settings.OrphanCleanupDays)
	if err != nil {
		logger.Error("Failed to get orphaned attachments", zap.Error(err))
		return
	}

	if len(orphanedAttachments) == 0 {
		logger.Debug("No orphaned attachments to clean up")
		return
	}

	logger.Info("Found orphaned attachments to clean up",
		zap.Int("count", len(orphanedAttachments)),
	)

	minioStorage := storage.GetMinioStorage()
	if minioStorage == nil {
		logger.Error("MinIO storage not initialized, cannot clean up files")
		return
	}

	ctx := context.Background()
	deletedCount := 0
	failedCount := 0

	for _, attachment := range orphanedAttachments {
		// Delete file from storage
		if err := minioStorage.DeleteFile(ctx, attachment.FileURL); err != nil {
			logger.Warn("Failed to delete orphaned file from storage",
				zap.String("file_url", attachment.FileURL),
				zap.Error(err),
			)
			failedCount++
			continue
		}

		// Delete attachment record
		if err := s.attachmentRepo.Delete(attachment.ID); err != nil {
			logger.Warn("Failed to delete orphaned attachment record",
				zap.String("id", attachment.ID.String()),
				zap.Error(err),
			)
			failedCount++
			continue
		}

		deletedCount++
	}

	// Update last cleanup time
	now := time.Now()
	settings.LastOrphanCleanupAt = &now
	if err := s.settingsRepo.Update(settings); err != nil {
		logger.Warn("Failed to update last cleanup time", zap.Error(err))
	}

	logger.Info("Orphan cleanup completed",
		zap.Int("deleted", deletedCount),
		zap.Int("failed", failedCount),
	)
}

// RunManualCleanup runs cleanup immediately (for admin trigger)
func (s *OrphanCleanupService) RunManualCleanup() (deleted int, failed int, err error) {
	settings, err := s.settingsRepo.Get()
	if err != nil {
		return 0, 0, err
	}

	orphanedAttachments, err := s.attachmentRepo.GetOrphanedAttachments(settings.OrphanCleanupDays)
	if err != nil {
		return 0, 0, err
	}

	minioStorage := storage.GetMinioStorage()
	if minioStorage == nil {
		return 0, 0, nil
	}

	ctx := context.Background()

	for _, attachment := range orphanedAttachments {
		if err := minioStorage.DeleteFile(ctx, attachment.FileURL); err != nil {
			failed++
			continue
		}

		if err := s.attachmentRepo.Delete(attachment.ID); err != nil {
			failed++
			continue
		}

		deleted++
	}

	// Update last cleanup time
	now := time.Now()
	settings.LastOrphanCleanupAt = &now
	s.settingsRepo.Update(settings)

	return deleted, failed, nil
}
