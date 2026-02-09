package seeders

import (
	"fmt"

	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/pkg/logger"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// DefaultLabels contains all pre-defined system labels
var DefaultLabels = []models.LabelSeed{
	// ============ Validation Errors ============
	{
		Key:          "ERROR_USER_NOT_FOUND",
		Category:     "error",
		DefaultValue: "User not found",
		Translations: map[string]string{"vi": "Không tìm thấy người dùng"},
	},
	{
		Key:          "ERROR_INVALID_USER_ID",
		Category:     "error",
		DefaultValue: "Invalid user ID",
		Translations: map[string]string{"vi": "ID người dùng không hợp lệ"},
	},
	{
		Key:          "ERROR_INVALID_REQUEST_BODY",
		Category:     "error",
		DefaultValue: "Invalid request body",
		Translations: map[string]string{"vi": "Nội dung yêu cầu không hợp lệ"},
	},
	{
		Key:          "ERROR_UNAUTHORIZED_PROFILE_UPDATE",
		Category:     "error",
		DefaultValue: "Can only update your own profile",
		Translations: map[string]string{"vi": "Chỉ có thể cập nhật hồ sơ của bạn"},
	},
	{
		Key:          "ERROR_EMAIL_QUERY_REQUIRED",
		Category:     "error",
		DefaultValue: "Email query is required",
		Translations: map[string]string{"vi": "Cần có tham số email"},
	},
	{
		Key:          "ERROR_PASSWORD_REQUIRED",
		Category:     "error",
		DefaultValue: "Current password and new password are required",
		Translations: map[string]string{"vi": "Cần nhập mật khẩu hiện tại và mật khẩu mới"},
	},
	{
		Key:          "ERROR_PASSWORD_TOO_SHORT",
		Category:     "error",
		DefaultValue: "New password must be at least 6 characters",
		Translations: map[string]string{"vi": "Mật khẩu mới phải có ít nhất 6 ký tự"},
	},
	{
		Key:          "ERROR_PASSWORD_INCORRECT",
		Category:     "error",
		DefaultValue: "Current password is incorrect",
		Translations: map[string]string{"vi": "Mật khẩu hiện tại không đúng"},
	},
	{
		Key:          "ERROR_EMAIL_PASSWORD_REQUIRED",
		Category:     "error",
		DefaultValue: "New email and password are required",
		Translations: map[string]string{"vi": "Cần nhập email mới và mật khẩu"},
	},
	{
		Key:          "ERROR_EMAIL_SAME_AS_CURRENT",
		Category:     "error",
		DefaultValue: "New email must be different from current email",
		Translations: map[string]string{"vi": "Email mới phải khác với email hiện tại"},
	},
	{
		Key:          "ERROR_EMAIL_IN_USE",
		Category:     "error",
		DefaultValue: "Email is already in use",
		Translations: map[string]string{"vi": "Email đã được sử dụng"},
	},
	{
		Key:          "ERROR_TOKEN_REQUIRED",
		Category:     "error",
		DefaultValue: "Verification token is required",
		Translations: map[string]string{"vi": "Cần có mã xác minh"},
	},
	{
		Key:          "ERROR_TOKEN_INVALID",
		Category:     "error",
		DefaultValue: "Invalid or expired verification token",
		Translations: map[string]string{"vi": "Mã xác minh không hợp lệ hoặc đã hết hạn"},
	},
	{
		Key:          "ERROR_TOKEN_EXPIRED",
		Category:     "error",
		DefaultValue: "Verification token has expired",
		Translations: map[string]string{"vi": "Mã xác minh đã hết hạn"},
	},
	{
		Key:          "ERROR_NO_PENDING_EMAIL",
		Category:     "error",
		DefaultValue: "No pending email change found",
		Translations: map[string]string{"vi": "Không có yêu cầu đổi email nào đang chờ"},
	},
	{
		Key:          "ERROR_PASSWORD_DELETE_REQUIRED",
		Category:     "error",
		DefaultValue: "Password is required to delete account",
		Translations: map[string]string{"vi": "Cần nhập mật khẩu để xóa tài khoản"},
	},
	// ============ Internal Errors ============
	{
		Key:          "ERROR_UPDATE_USER_FAILED",
		Category:     "error",
		DefaultValue: "Failed to update user",
		Translations: map[string]string{"vi": "Cập nhật người dùng thất bại"},
	},
	{
		Key:          "ERROR_UPDATE_PASSWORD_FAILED",
		Category:     "error",
		DefaultValue: "Failed to update password",
		Translations: map[string]string{"vi": "Cập nhật mật khẩu thất bại"},
	},
	{
		Key:          "ERROR_SET_PASSWORD_FAILED",
		Category:     "error",
		DefaultValue: "Failed to set new password",
		Translations: map[string]string{"vi": "Thiết lập mật khẩu mới thất bại"},
	},
	{
		Key:          "ERROR_GENERATE_TOKEN_FAILED",
		Category:     "error",
		DefaultValue: "Failed to generate verification token",
		Translations: map[string]string{"vi": "Tạo mã xác minh thất bại"},
	},
	{
		Key:          "ERROR_SAVE_VERIFICATION_FAILED",
		Category:     "error",
		DefaultValue: "Failed to save verification request",
		Translations: map[string]string{"vi": "Lưu yêu cầu xác minh thất bại"},
	},
	{
		Key:          "ERROR_SEND_EMAIL_FAILED",
		Category:     "error",
		DefaultValue: "Failed to send verification email",
		Translations: map[string]string{"vi": "Gửi email xác minh thất bại"},
	},
	{
		Key:          "ERROR_UPDATE_EMAIL_FAILED",
		Category:     "error",
		DefaultValue: "Failed to update email",
		Translations: map[string]string{"vi": "Cập nhật email thất bại"},
	},
	{
		Key:          "ERROR_UPDATE_PREFERENCES_FAILED",
		Category:     "error",
		DefaultValue: "Failed to update preferences",
		Translations: map[string]string{"vi": "Cập nhật tùy chọn thất bại"},
	},
	{
		Key:          "ERROR_DELETE_ACCOUNT_FAILED",
		Category:     "error",
		DefaultValue: "Failed to delete account",
		Translations: map[string]string{"vi": "Xóa tài khoản thất bại"},
	},
	{
		Key:          "ERROR_SAVE_PREFERENCE_FAILED",
		Category:     "error",
		DefaultValue: "Failed to save preference",
		Translations: map[string]string{"vi": "Lưu tùy chọn thất bại"},
	},
	// ============ Success Messages ============
	{
		Key:          "SUCCESS_PASSWORD_CHANGED",
		Category:     "notification",
		DefaultValue: "Password changed successfully",
		Translations: map[string]string{"vi": "Đổi mật khẩu thành công"},
	},
	{
		Key:          "SUCCESS_EMAIL_VERIFICATION_SENT",
		Category:     "notification",
		DefaultValue: "Verification email sent. Please check your inbox.",
		Translations: map[string]string{"vi": "Email xác minh đã được gửi. Vui lòng kiểm tra hộp thư."},
	},
	{
		Key:          "SUCCESS_EMAIL_CHANGED",
		Category:     "notification",
		DefaultValue: "Email changed successfully",
		Translations: map[string]string{"vi": "Đổi email thành công"},
	},
	{
		Key:          "SUCCESS_ACCOUNT_DELETED",
		Category:     "notification",
		DefaultValue: "Account deleted successfully",
		Translations: map[string]string{"vi": "Tài khoản đã được xóa thành công"},
	},
	{
		Key:          "SUCCESS_PREFERENCE_SAVED",
		Category:     "notification",
		DefaultValue: "Preference saved",
		Translations: map[string]string{"vi": "Đã lưu tùy chọn"},
	},
	// ============ Frontend-only Labels ============
	{
		Key:          "ERROR_PASSWORD_MISMATCH",
		Category:     "error",
		DefaultValue: "New passwords do not match",
		Translations: map[string]string{"vi": "Mật khẩu mới không khớp"},
	},
	{
		Key:          "ERROR_EMAIL_CHANGE_FAILED",
		Category:     "error",
		DefaultValue: "Failed to change email",
		Translations: map[string]string{"vi": "Thay đổi email thất bại"},
	},
	// ============ UI Labels ============
	// Titles
	{
		Key:          "UI_CHANGE_EMAIL",
		Category:     "ui",
		DefaultValue: "Change Email",
		Translations: map[string]string{"vi": "Đổi Email"},
	},
	{
		Key:          "UI_CHANGE_PASSWORD",
		Category:     "ui",
		DefaultValue: "Change Password",
		Translations: map[string]string{"vi": "Đổi Mật Khẩu"},
	},
	{
		Key:          "UI_DELETE_ACCOUNT",
		Category:     "ui",
		DefaultValue: "Delete Account",
		Translations: map[string]string{"vi": "Xóa Tài Khoản"},
	},
	{
		Key:          "UI_DELETE_MY_ACCOUNT",
		Category:     "ui",
		DefaultValue: "Delete My Account",
		Translations: map[string]string{"vi": "Xóa Tài Khoản Của Tôi"},
	},
	// Form labels
	{
		Key:          "UI_CURRENT_EMAIL",
		Category:     "ui",
		DefaultValue: "Current email:",
		Translations: map[string]string{"vi": "Email hiện tại:"},
	},
	{
		Key:          "UI_NEW_EMAIL",
		Category:     "ui",
		DefaultValue: "New Email",
		Translations: map[string]string{"vi": "Email Mới"},
	},
	{
		Key:          "UI_CURRENT_PASSWORD",
		Category:     "ui",
		DefaultValue: "Current Password",
		Translations: map[string]string{"vi": "Mật Khẩu Hiện Tại"},
	},
	{
		Key:          "UI_NEW_PASSWORD",
		Category:     "ui",
		DefaultValue: "New Password",
		Translations: map[string]string{"vi": "Mật Khẩu Mới"},
	},
	{
		Key:          "UI_CONFIRM_NEW_PASSWORD",
		Category:     "ui",
		DefaultValue: "Confirm New Password",
		Translations: map[string]string{"vi": "Xác Nhận Mật Khẩu Mới"},
	},
	{
		Key:          "UI_ENTER_PASSWORD_CONFIRM",
		Category:     "ui",
		DefaultValue: "Enter your password to confirm",
		Translations: map[string]string{"vi": "Nhập mật khẩu để xác nhận"},
	},
	// Placeholders
	{
		Key:          "UI_PLACEHOLDER_NEW_EMAIL",
		Category:     "ui",
		DefaultValue: "Enter new email",
		Translations: map[string]string{"vi": "Nhập email mới"},
	},
	{
		Key:          "UI_PLACEHOLDER_CURRENT_PASSWORD",
		Category:     "ui",
		DefaultValue: "Enter current password",
		Translations: map[string]string{"vi": "Nhập mật khẩu hiện tại"},
	},
	{
		Key:          "UI_PLACEHOLDER_NEW_PASSWORD",
		Category:     "ui",
		DefaultValue: "Enter new password",
		Translations: map[string]string{"vi": "Nhập mật khẩu mới"},
	},
	{
		Key:          "UI_PLACEHOLDER_CONFIRM_PASSWORD",
		Category:     "ui",
		DefaultValue: "Confirm new password",
		Translations: map[string]string{"vi": "Xác nhận mật khẩu mới"},
	},
	{
		Key:          "UI_PLACEHOLDER_PASSWORD",
		Category:     "ui",
		DefaultValue: "Enter password",
		Translations: map[string]string{"vi": "Nhập mật khẩu"},
	},
	// Validation messages
	{
		Key:          "UI_REQUIRED_NEW_EMAIL",
		Category:     "ui",
		DefaultValue: "Please enter new email",
		Translations: map[string]string{"vi": "Vui lòng nhập email mới"},
	},
	{
		Key:          "UI_REQUIRED_VALID_EMAIL",
		Category:     "ui",
		DefaultValue: "Please enter a valid email",
		Translations: map[string]string{"vi": "Vui lòng nhập email hợp lệ"},
	},
	{
		Key:          "UI_REQUIRED_PASSWORD",
		Category:     "ui",
		DefaultValue: "Please enter your password",
		Translations: map[string]string{"vi": "Vui lòng nhập mật khẩu"},
	},
	{
		Key:          "UI_REQUIRED_CURRENT_PASSWORD",
		Category:     "ui",
		DefaultValue: "Please enter current password",
		Translations: map[string]string{"vi": "Vui lòng nhập mật khẩu hiện tại"},
	},
	{
		Key:          "UI_REQUIRED_NEW_PASSWORD",
		Category:     "ui",
		DefaultValue: "Please enter new password",
		Translations: map[string]string{"vi": "Vui lòng nhập mật khẩu mới"},
	},
	{
		Key:          "UI_REQUIRED_CONFIRM_PASSWORD",
		Category:     "ui",
		DefaultValue: "Please confirm new password",
		Translations: map[string]string{"vi": "Vui lòng xác nhận mật khẩu mới"},
	},
	{
		Key:          "UI_PASSWORD_MIN_LENGTH",
		Category:     "ui",
		DefaultValue: "Password must be at least 6 characters",
		Translations: map[string]string{"vi": "Mật khẩu phải có ít nhất 6 ký tự"},
	},
	// Warning/info messages
	{
		Key:          "UI_DELETE_WARNING",
		Category:     "ui",
		DefaultValue: "Once you delete your account, there is no going back. Please be certain.",
		Translations: map[string]string{"vi": "Sau khi xóa tài khoản, bạn không thể khôi phục lại. Vui lòng cân nhắc kỹ."},
	},
	{
		Key:          "UI_DELETE_CONFIRM_WARNING",
		Category:     "ui",
		DefaultValue: "This action cannot be undone. All your workspaces, boards, and data will be permanently deleted.",
		Translations: map[string]string{"vi": "Hành động này không thể hoàn tác. Tất cả workspace, board và dữ liệu sẽ bị xóa vĩnh viễn."},
	},
	// Buttons
	{
		Key:          "UI_CANCEL",
		Category:     "ui",
		DefaultValue: "Cancel",
		Translations: map[string]string{"vi": "Hủy"},
	},
	// Form labels (Settings)
	{
		Key:          "UI_LANGUAGE",
		Category:     "ui",
		DefaultValue: "Language",
		Translations: map[string]string{"vi": "Ngôn Ngữ"},
	},
	{
		Key:          "UI_TIMEZONE",
		Category:     "ui",
		DefaultValue: "Timezone",
		Translations: map[string]string{"vi": "Múi Giờ"},
	},
	{
		Key:          "UI_DATE_FORMAT",
		Category:     "ui",
		DefaultValue: "Date Format",
		Translations: map[string]string{"vi": "Định Dạng Ngày"},
	},
	// ============ Notifications Section ============
	// Titles
	{
		Key:          "UI_EMAIL_NOTIFICATIONS",
		Category:     "ui",
		DefaultValue: "Email Notifications",
		Translations: map[string]string{"vi": "Thông Báo Email"},
	},
	// Toggle options
	{
		Key:          "UI_NOTIFY_WHEN_ASSIGNED",
		Category:     "ui",
		DefaultValue: "When assigned to a card",
		Translations: map[string]string{"vi": "Khi được giao thẻ"},
	},
	{
		Key:          "UI_NOTIFY_WHEN_ASSIGNED_DESC",
		Category:     "ui",
		DefaultValue: "Get notified when someone assigns you to a card",
		Translations: map[string]string{"vi": "Nhận thông báo khi ai đó giao thẻ cho bạn"},
	},
	{
		Key:          "UI_NOTIFY_DUE_DATE",
		Category:     "ui",
		DefaultValue: "Due date reminders",
		Translations: map[string]string{"vi": "Nhắc nhở ngày hết hạn"},
	},
	{
		Key:          "UI_NOTIFY_DUE_DATE_DESC",
		Category:     "ui",
		DefaultValue: "Get notified when a card's due date is approaching",
		Translations: map[string]string{"vi": "Nhận thông báo khi thẻ sắp hết hạn"},
	},
	{
		Key:          "UI_NOTIFY_NEW_COMMENTS",
		Category:     "ui",
		DefaultValue: "New comments",
		Translations: map[string]string{"vi": "Bình luận mới"},
	},
	{
		Key:          "UI_NOTIFY_NEW_COMMENTS_DESC",
		Category:     "ui",
		DefaultValue: "Get notified when someone comments on your cards",
		Translations: map[string]string{"vi": "Nhận thông báo khi ai đó bình luận trên thẻ của bạn"},
	},
	{
		Key:          "UI_NOTIFY_MENTIONS",
		Category:     "ui",
		DefaultValue: "Mentions",
		Translations: map[string]string{"vi": "Đề cập"},
	},
	{
		Key:          "UI_NOTIFY_MENTIONS_DESC",
		Category:     "ui",
		DefaultValue: "Get notified when someone mentions you",
		Translations: map[string]string{"vi": "Nhận thông báo khi ai đó đề cập đến bạn"},
	},
	// Coming soon features
	{
		Key:          "UI_COMING_SOON",
		Category:     "ui",
		DefaultValue: "Coming soon",
		Translations: map[string]string{"vi": "Sắp ra mắt"},
	},
	{
		Key:          "UI_NOTIFY_PUSH",
		Category:     "ui",
		DefaultValue: "Push notifications",
		Translations: map[string]string{"vi": "Thông báo đẩy"},
	},
	{
		Key:          "UI_NOTIFY_PUSH_DESC",
		Category:     "ui",
		DefaultValue: "Receive push notifications in your browser",
		Translations: map[string]string{"vi": "Nhận thông báo đẩy trong trình duyệt"},
	},
	{
		Key:          "UI_EMAIL_DIGEST_FREQUENCY",
		Category:     "ui",
		DefaultValue: "Email digest frequency",
		Translations: map[string]string{"vi": "Tần suất email tổng hợp"},
	},
	{
		Key:          "UI_EMAIL_DIGEST_FREQUENCY_DESC",
		Category:     "ui",
		DefaultValue: "How often to receive email summaries",
		Translations: map[string]string{"vi": "Tần suất nhận email tổng hợp"},
	},
	{
		Key:          "UI_IMMEDIATELY",
		Category:     "ui",
		DefaultValue: "Immediately",
		Translations: map[string]string{"vi": "Ngay lập tức"},
	},
	// ============ Theme & Appearance Section ============
	// Titles
	{
		Key:          "UI_COLOR_MODE",
		Category:     "ui",
		DefaultValue: "Color Mode",
		Translations: map[string]string{"vi": "Chế Độ Màu"},
	},
	{
		Key:          "UI_COLOR_SCHEME",
		Category:     "ui",
		DefaultValue: "Color Scheme",
		Translations: map[string]string{"vi": "Bảng Màu"},
	},
	{
		Key:          "UI_COLOR_SCHEME_DESC",
		Category:     "ui",
		DefaultValue: "Customize your primary color theme",
		Translations: map[string]string{"vi": "Tùy chỉnh màu chủ đạo của bạn"},
	},
	// Theme options
	{
		Key:          "UI_THEME_LIGHT",
		Category:     "ui",
		DefaultValue: "Light",
		Translations: map[string]string{"vi": "Sáng"},
	},
	{
		Key:          "UI_THEME_LIGHT_DESC",
		Category:     "ui",
		DefaultValue: "Clean & bright",
		Translations: map[string]string{"vi": "Gọn gàng & sáng sủa"},
	},
	{
		Key:          "UI_THEME_DARK",
		Category:     "ui",
		DefaultValue: "Dark",
		Translations: map[string]string{"vi": "Tối"},
	},
	{
		Key:          "UI_THEME_DARK_DESC",
		Category:     "ui",
		DefaultValue: "Easy on the eyes",
		Translations: map[string]string{"vi": "Dễ chịu cho mắt"},
	},
	{
		Key:          "UI_THEME_SYSTEM",
		Category:     "ui",
		DefaultValue: "System",
		Translations: map[string]string{"vi": "Hệ thống"},
	},
	{
		Key:          "UI_THEME_SYSTEM_DESC",
		Category:     "ui",
		DefaultValue: "Match OS setting",
		Translations: map[string]string{"vi": "Theo cài đặt hệ điều hành"},
	},
	// ============ Sessions & Security Section ============
	// Titles
	{
		Key:          "UI_ACTIVE_SESSIONS",
		Category:     "ui",
		DefaultValue: "Active Sessions",
		Translations: map[string]string{"vi": "Phiên Hoạt Động"},
	},
	{
		Key:          "UI_ACTIVE_SESSIONS_DESC",
		Category:     "ui",
		DefaultValue: "View and manage your active sessions",
		Translations: map[string]string{"vi": "Xem và quản lý các phiên hoạt động của bạn"},
	},
	{
		Key:          "UI_TWO_FACTOR_AUTH",
		Category:     "ui",
		DefaultValue: "Two-Factor Authentication",
		Translations: map[string]string{"vi": "Xác Thực Hai Yếu Tố"},
	},
	{
		Key:          "UI_TWO_FACTOR_AUTH_DESC",
		Category:     "ui",
		DefaultValue: "Add an extra layer of security to your account",
		Translations: map[string]string{"vi": "Thêm một lớp bảo mật cho tài khoản của bạn"},
	},
	{
		Key:          "UI_LOGOUT_ALL_DEVICES",
		Category:     "ui",
		DefaultValue: "Logout from all devices",
		Translations: map[string]string{"vi": "Đăng xuất khỏi tất cả thiết bị"},
	},
	{
		Key:          "UI_LOGOUT_ALL_DEVICES_DESC",
		Category:     "ui",
		DefaultValue: "This will log you out from all devices except this one",
		Translations: map[string]string{"vi": "Thao tác này sẽ đăng xuất khỏi tất cả thiết bị ngoại trừ thiết bị hiện tại"},
	},
	{
		Key:          "UI_LOGOUT_EVERYWHERE",
		Category:     "ui",
		DefaultValue: "Logout Everywhere",
		Translations: map[string]string{"vi": "Đăng Xuất Mọi Nơi"},
	},
}

// SeedLabels seeds the default labels into the database using batch operations
func SeedLabels(db *gorm.DB) error {
	logger.Info("Seeding system labels...")
	repo := repository.NewSystemLabelRepository()

	// 1. Get existing keys to avoid duplicates
	existingKeys := make(map[string]bool)
	var existing []models.SystemLabel
	// We only need keys, so select Key to be efficient
	db.Select("key").Find(&existing)
	for _, l := range existing {
		existingKeys[l.Key] = true
	}

	// 2. Filter new labels
	var labelsToInsert []models.LabelSeed
	for _, l := range DefaultLabels {
		if !existingKeys[l.Key] {
			labelsToInsert = append(labelsToInsert, l)
		}
	}

	if len(labelsToInsert) == 0 {
		logger.Info("No new labels to seed")
		return nil
	}

	// 3. Batch insert using Repository
	if err := repo.BulkInsert(db, labelsToInsert); err != nil {
		logger.Error("Failed to bulk insert labels", zap.Error(err))
		return fmt.Errorf("failed to bulk insert labels: %w", err)
	}

	logger.Info("Seeded labels", zap.Int("count", len(labelsToInsert)))
	return nil
}
