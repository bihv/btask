package services

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
	"github.com/skip2/go-qrcode"
)

const (
	TOTPIssuer         = "BTask"
	TOTPDigits         = otp.DigitsSix
	TOTPAlgorithm      = otp.AlgorithmSHA1
	TOTPPeriod         = uint(30)
	TOTPSecretSize     = 20
	RecoveryCodeCount  = 8
	RecoveryCodeLength = 8
	RememberDeviceDays = 30
)

type TOTPService struct{}

func NewTOTPService() *TOTPService {
	return &TOTPService{}
}

type SetupResponse struct {
	Secret     string `json:"secret"`
	QRCodeURL  string `json:"qrCodeUrl"`
	OTPAuthURL string `json:"otpauthUrl"`
}

func (s *TOTPService) GenerateSetup(userEmail string) (*SetupResponse, error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      TOTPIssuer,
		AccountName: userEmail,
		Algorithm:   TOTPAlgorithm,
		Digits:      TOTPDigits,
		Period:      TOTPPeriod,
		SecretSize:  TOTPSecretSize,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to generate TOTP key: %w", err)
	}

	// Build minimal otpauth URI per Google Authenticator Key URI Format spec:
	// https://github.com/google/google-authenticator/wiki/Key-Uri-Format
	// Only include secret + issuer (algorithm/digits/period omitted = defaults)
	// Label MUST use literal colon ":" (not %3A) - Authy rejects encoded colons
	otpauthURL := fmt.Sprintf("otpauth://totp/%s:%s?secret=%s&issuer=%s",
		TOTPIssuer, userEmail, key.Secret(), TOTPIssuer)

	qrCode, err := qrcode.Encode(otpauthURL, qrcode.Medium, 256)
	if err != nil {
		return nil, fmt.Errorf("failed to generate QR code: %w", err)
	}

	return &SetupResponse{
		Secret:     key.Secret(),
		QRCodeURL:  "data:image/png;base64," + base64.StdEncoding.EncodeToString(qrCode),
		OTPAuthURL: otpauthURL,
	}, nil
}

func (s *TOTPService) ValidateCode(secret, code string) bool {
	return totp.Validate(code, secret)
}

func (s *TOTPService) ValidateCodeWithWindow(secret, code string, window int) bool {
	valid := totp.Validate(code, secret)
	if valid {
		return true
	}

	for i := 1; i <= window; i++ {
		prevTime := time.Now().Add(-time.Duration(i) * time.Second * time.Duration(TOTPPeriod))
		validPrev, _ := totp.ValidateCustom(code, secret, prevTime, totp.ValidateOpts{
			Period:    TOTPPeriod,
			Digits:    TOTPDigits,
			Algorithm: TOTPAlgorithm,
		})
		if validPrev {
			return true
		}

		nextTime := time.Now().Add(time.Duration(i) * time.Second * time.Duration(TOTPPeriod))
		validNext, _ := totp.ValidateCustom(code, secret, nextTime, totp.ValidateOpts{
			Period:    TOTPPeriod,
			Digits:    TOTPDigits,
			Algorithm: TOTPAlgorithm,
		})
		if validNext {
			return true
		}
	}

	return false
}

func GenerateRecoveryCodes() []string {
	codes := make([]string, RecoveryCodeCount)
	for i := 0; i < RecoveryCodeCount; i++ {
		codes[i] = generateRandomCode(RecoveryCodeLength)
	}
	return codes
}

func generateRandomCode(length int) string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	if err != nil {
		return ""
	}
	for i := range bytes {
		bytes[i] = chars[int(bytes[i])%len(chars)]
	}
	return string(bytes)
}

func GetRememberDeviceExpiry() time.Time {
	return time.Now().AddDate(0, 0, RememberDeviceDays)
}
