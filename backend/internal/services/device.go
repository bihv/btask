package services

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/mello/backend/internal/models"
)

type DeviceService struct {
	db *gorm.DB
}

func NewDeviceService(db *gorm.DB) *DeviceService {
	return &DeviceService{db: db}
}

type CreateDeviceInput struct {
	UserID            uuid.UUID
	DeviceFingerprint string
	DeviceName        string
	IPAddress         string
	UserAgent         string
	ExpiresAt         time.Time
}

func (s *DeviceService) CreateOrUpdateDevice(input CreateDeviceInput) (*models.RememberedDevice, error) {
	var device models.RememberedDevice

	result := s.db.Where("user_id = ? AND device_fingerprint = ?", input.UserID, input.DeviceFingerprint).First(&device)

	if result.Error == gorm.ErrRecordNotFound {
		device = models.RememberedDevice{
			ID:                uuid.New(),
			UserID:            input.UserID,
			DeviceFingerprint: input.DeviceFingerprint,
			DeviceName:        input.DeviceName,
			IPAddress:         input.IPAddress,
			UserAgent:         input.UserAgent,
			CreatedAt:         time.Now(),
			ExpiresAt:         input.ExpiresAt,
			LastUsedAt:        time.Now(),
		}
		if err := s.db.Create(&device).Error; err != nil {
			return nil, err
		}
		return &device, nil
	} else if result.Error != nil {
		return nil, result.Error
	}

	device.ExpiresAt = input.ExpiresAt
	device.LastUsedAt = time.Now()
	if input.DeviceName != "" {
		device.DeviceName = input.DeviceName
	}
	if input.IPAddress != "" {
		device.IPAddress = input.IPAddress
	}

	if err := s.db.Save(&device).Error; err != nil {
		return nil, err
	}

	return &device, nil
}

func (s *DeviceService) GetUserDevices(userID uuid.UUID) ([]models.DeviceResponse, error) {
	var devices []models.RememberedDevice
	if err := s.db.Where("user_id = ?", userID).Order("last_used_at DESC").Find(&devices).Error; err != nil {
		return nil, err
	}

	responses := make([]models.DeviceResponse, 0, len(devices))
	for _, d := range devices {
		responses = append(responses, d.ToResponse())
	}

	return responses, nil
}

func (s *DeviceService) GetValidDevice(userID uuid.UUID, fingerprint string) (*models.RememberedDevice, error) {
	var device models.RememberedDevice
	result := s.db.Where("user_id = ? AND device_fingerprint = ? AND expires_at > ?", 
		userID, fingerprint, time.Now()).First(&device)

	if result.Error == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if result.Error != nil {
		return nil, result.Error
	}

	return &device, nil
}

func (s *DeviceService) DeleteDevice(deviceID, userID uuid.UUID) error {
	return s.db.Where("id = ? AND user_id = ?", deviceID, userID).Delete(&models.RememberedDevice{}).Error
}

func (s *DeviceService) DeleteAllUserDevices(userID uuid.UUID) error {
	return s.db.Where("user_id = ?", userID).Delete(&models.RememberedDevice{}).Error
}

func (s *DeviceService) DeleteExpiredDevices() error {
	return s.db.Where("expires_at < ?", time.Now()).Delete(&models.RememberedDevice{}).Error
}
