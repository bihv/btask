package services

import (
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"

	"github.com/mello/backend/internal/repository"
)

// PluginService handles all plugin-related business logic
// Methods are organized in separate files:
// - plugin_management.go: CRUD operations
// - plugin_installation.go: Install/Uninstall operations
// - plugin_data_service.go: Data storage operations
// - plugin_signature.go: Signature verification
type PluginService struct {
	repo *repository.PluginRepository
}

func NewPluginService(repo *repository.PluginRepository) *PluginService {
	return &PluginService{repo: repo}
}

// Helper functions

func generateRandomString(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes)[:length], nil
}

func hashString(s string) string {
	hash := sha256.Sum256([]byte(s))
	return hex.EncodeToString(hash[:])
}

// PluginSignature represents a verified plugin signature
type PluginSignature struct {
	Algorithm string // e.g., "ed25519"
	PublicKey string // Base64 encoded public key
	Signature string // Base64 encoded signature
}

// VerifyPluginSignature verifies that a plugin bundle was signed by the claimed author
func VerifyPluginSignature(bundleHash []byte, signature *PluginSignature) error {
	if signature == nil {
		return errors.New("signature is required for plugin verification")
	}

	if signature.Algorithm != "ed25519" {
		return errors.New("unsupported signature algorithm: " + signature.Algorithm)
	}

	// Decode public key
	publicKeyBytes, err := base64.StdEncoding.DecodeString(signature.PublicKey)
	if err != nil {
		return errors.New("invalid public key encoding")
	}

	if len(publicKeyBytes) != ed25519.PublicKeySize {
		return errors.New("invalid public key size")
	}

	// Decode signature
	signatureBytes, err := base64.StdEncoding.DecodeString(signature.Signature)
	if err != nil {
		return errors.New("invalid signature encoding")
	}

	// Verify signature
	publicKey := ed25519.PublicKey(publicKeyBytes)
	if !ed25519.Verify(publicKey, bundleHash, signatureBytes) {
		return errors.New("invalid plugin signature")
	}

	return nil
}

// GeneratePluginKeyPair generates a new Ed25519 key pair for plugin signing
// This is a utility function for plugin developers
func GeneratePluginKeyPair() (publicKey, privateKey string, err error) {
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return "", "", err
	}

	publicKey = base64.StdEncoding.EncodeToString(pub)
	privateKey = base64.StdEncoding.EncodeToString(priv)
	return publicKey, privateKey, nil
}

// SignPluginBundle signs a plugin bundle hash with the given private key
// This is a utility function for plugin developers
func SignPluginBundle(bundleHash []byte, privateKeyBase64 string) (string, error) {
	privateKeyBytes, err := base64.StdEncoding.DecodeString(privateKeyBase64)
	if err != nil {
		return "", errors.New("invalid private key encoding")
	}

	if len(privateKeyBytes) != ed25519.PrivateKeySize {
		return "", errors.New("invalid private key size")
	}

	privateKey := ed25519.PrivateKey(privateKeyBytes)
	signature := ed25519.Sign(privateKey, bundleHash)

	return base64.StdEncoding.EncodeToString(signature), nil
}

// ComputeBundleHash computes SHA256 hash of a plugin bundle
func ComputeBundleHash(bundleBytes []byte) []byte {
	hash := sha256.Sum256(bundleBytes)
	return hash[:]
}
