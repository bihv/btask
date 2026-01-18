package services

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/smtp"
	"strconv"

	"github.com/mello/backend/internal/config"
)

// EmailService handles sending emails
type EmailService struct {
	config *config.Config
}

// NewEmailService creates a new email service
func NewEmailService(cfg *config.Config) *EmailService {
	return &EmailService{
		config: cfg,
	}
}

// IsConfigured checks if SMTP is configured
func (s *EmailService) IsConfigured() bool {
	return s.config.SMTPHost != "" && s.config.SMTPFrom != ""
}

// SendEmailVerification sends an email verification link
func (s *EmailService) SendEmailVerification(toEmail, token string) error {
	verifyURL := fmt.Sprintf("%s/verify-email?token=%s", s.config.AppURL, token)

	subject := "Verify your new email address - Mello"
	body := fmt.Sprintf(`
Hello,

You requested to change your email address on Mello. Please click the link below to verify your new email:

%s

This link will expire in 24 hours.

If you did not request this change, please ignore this email.

Best regards,
Mello Team
`, verifyURL)

	return s.sendEmail(toEmail, subject, body)
}

// sendEmail sends an email via SMTP
func (s *EmailService) sendEmail(to, subject, body string) error {
	if !s.IsConfigured() {
		// Log to console if SMTP is not configured (development mode)
		log.Printf("[EMAIL] To: %s, Subject: %s\n%s", to, subject, body)
		return nil
	}

	from := s.config.SMTPFrom
	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s",
		from, to, subject, body)

	port, err := strconv.Atoi(s.config.SMTPPort)
	if err != nil {
		port = 587
	}

	addr := fmt.Sprintf("%s:%d", s.config.SMTPHost, port)

	// For port 465, use TLS directly (SSL)
	if port == 465 {
		return s.sendEmailSSL(to, msg, addr)
	}

	// For other ports (587, 25), use STARTTLS
	return s.sendEmailSTARTTLS(to, msg, addr)
}

// sendEmailSTARTTLS sends email using STARTTLS (port 587)
func (s *EmailService) sendEmailSTARTTLS(to, msg, addr string) error {
	auth := smtp.PlainAuth("", s.config.SMTPUser, s.config.SMTPPassword, s.config.SMTPHost)

	err := smtp.SendMail(addr, auth, s.config.SMTPFrom, []string{to}, []byte(msg))
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}
	return nil
}

// sendEmailSSL sends email using direct SSL/TLS (port 465)
func (s *EmailService) sendEmailSSL(to, msg, addr string) error {
	tlsConfig := &tls.Config{
		ServerName: s.config.SMTPHost,
	}

	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		return fmt.Errorf("failed to connect to SMTP server: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, s.config.SMTPHost)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %w", err)
	}
	defer client.Close()

	// Auth
	auth := smtp.PlainAuth("", s.config.SMTPUser, s.config.SMTPPassword, s.config.SMTPHost)
	if err = client.Auth(auth); err != nil {
		return fmt.Errorf("SMTP auth failed: %w", err)
	}

	// Set sender and recipient
	if err = client.Mail(s.config.SMTPFrom); err != nil {
		return fmt.Errorf("SMTP MAIL FROM failed: %w", err)
	}
	if err = client.Rcpt(to); err != nil {
		return fmt.Errorf("SMTP RCPT TO failed: %w", err)
	}

	// Send message body
	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("SMTP DATA failed: %w", err)
	}

	_, err = w.Write([]byte(msg))
	if err != nil {
		return fmt.Errorf("failed to write email body: %w", err)
	}

	err = w.Close()
	if err != nil {
		return fmt.Errorf("failed to close email body: %w", err)
	}

	return client.Quit()
}
