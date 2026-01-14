package database

import (
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/pkg/logger"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(databaseURL string) error {
	var err error

	config := &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Info),
	}

	DB, err = gorm.Open(postgres.Open(databaseURL), config)
	if err != nil {
		logger.Error("Failed to connect to database", zap.Error(err))
		return err
	}

	logger.Info("Connected to database")
	return nil
}

func Migrate() error {
	logger.Info("Running database migrations")

	err := DB.AutoMigrate(
		&models.User{},
		&models.Workspace{},
		&models.WorkspaceMember{},
		&models.Board{},
		&models.List{},
		&models.Card{},
		&models.Label{},
		&models.CardLabel{},
		&models.CardMember{},
		&models.Comment{},
		&models.Checklist{},
		&models.ChecklistItem{},
		&models.Attachment{},
		&models.Notification{},
		&models.ListWatcher{},
		&models.BoardWatcher{},
		&models.CustomField{},
		&models.CustomFieldOption{},
		&models.CardCustomFieldValue{},
	)

	if err != nil {
		logger.Error("Failed to run migrations", zap.Error(err))
		return err
	}

	logger.Info("Database migrations completed")
	return nil
}
