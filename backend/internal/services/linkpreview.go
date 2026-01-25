package services

import (
	"crypto/tls"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"
)

// LinkPreview contains metadata extracted from a URL
type LinkPreview struct {
	URL         string `json:"url"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Image       string `json:"image"`
	SiteName    string `json:"site_name"`
	Favicon     string `json:"favicon"`
}

// LinkPreviewService handles URL unfurling and metadata extraction
type LinkPreviewService struct {
	client *http.Client
}

// NewLinkPreviewService creates a new LinkPreviewService
func NewLinkPreviewService() *LinkPreviewService {
	transport := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: false},
	}
	
	client := &http.Client{
		Timeout:   10 * time.Second,
		Transport: transport,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 5 {
				return http.ErrUseLastResponse
			}
			return nil
		},
	}
	
	return &LinkPreviewService{
		client: client,
	}
}

// IsURL checks if a string is a valid URL
func (s *LinkPreviewService) IsURL(str string) bool {
	str = strings.TrimSpace(str)
	if !strings.HasPrefix(str, "http://") && !strings.HasPrefix(str, "https://") {
		return false
	}
	_, err := url.ParseRequestURI(str)
	return err == nil
}

// FetchPreview fetches metadata from a URL
func (s *LinkPreviewService) FetchPreview(urlStr string) (*LinkPreview, error) {
	urlStr = strings.TrimSpace(urlStr)
	
	// Parse URL to get base URL for favicon
	parsedURL, err := url.Parse(urlStr)
	if err != nil {
		return nil, err
	}
	
	req, err := http.NewRequest("GET", urlStr, nil)
	if err != nil {
		return nil, err
	}
	
	// Set User-Agent to avoid being blocked
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; MelloBot/1.0; +https://mello.app)")
	req.Header.Set("Accept", "text/html,application/xhtml+xml")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	// Limit read to 1MB
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1024*1024))
	if err != nil {
		return nil, err
	}
	
	html := string(body)
	
	preview := &LinkPreview{
		URL: urlStr,
	}
	
	// Extract Open Graph metadata
	preview.Title = s.extractMetaContent(html, "og:title")
	if preview.Title == "" {
		preview.Title = s.extractMetaContent(html, "twitter:title")
	}
	if preview.Title == "" {
		preview.Title = s.extractTitle(html)
	}
	
	preview.Description = s.extractMetaContent(html, "og:description")
	if preview.Description == "" {
		preview.Description = s.extractMetaContent(html, "twitter:description")
	}
	if preview.Description == "" {
		preview.Description = s.extractMetaContent(html, "description")
	}
	
	preview.Image = s.extractMetaContent(html, "og:image")
	if preview.Image == "" {
		preview.Image = s.extractMetaContent(html, "twitter:image")
	}
	// Make image URL absolute if relative
	if preview.Image != "" && !strings.HasPrefix(preview.Image, "http") {
		preview.Image = s.makeAbsoluteURL(parsedURL, preview.Image)
	}
	
	preview.SiteName = s.extractMetaContent(html, "og:site_name")
	if preview.SiteName == "" {
		preview.SiteName = parsedURL.Host
	}
	
	// Extract favicon
	preview.Favicon = s.extractFavicon(html, parsedURL)
	
	return preview, nil
}

// extractMetaContent extracts content from meta tags
func (s *LinkPreviewService) extractMetaContent(html, property string) string {
	// Try property attribute first (Open Graph)
	patterns := []string{
		`<meta[^>]*property=["']` + regexp.QuoteMeta(property) + `["'][^>]*content=["']([^"']*)["']`,
		`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']` + regexp.QuoteMeta(property) + `["']`,
		// Try name attribute (standard meta tags)
		`<meta[^>]*name=["']` + regexp.QuoteMeta(property) + `["'][^>]*content=["']([^"']*)["']`,
		`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']` + regexp.QuoteMeta(property) + `["']`,
	}
	
	for _, pattern := range patterns {
		re := regexp.MustCompile(`(?i)` + pattern)
		matches := re.FindStringSubmatch(html)
		if len(matches) > 1 {
			return strings.TrimSpace(s.decodeHTMLEntities(matches[1]))
		}
	}
	
	return ""
}

// extractTitle extracts title from <title> tag
func (s *LinkPreviewService) extractTitle(html string) string {
	re := regexp.MustCompile(`(?i)<title[^>]*>([^<]*)</title>`)
	matches := re.FindStringSubmatch(html)
	if len(matches) > 1 {
		return strings.TrimSpace(s.decodeHTMLEntities(matches[1]))
	}
	return ""
}

// extractFavicon extracts favicon URL
func (s *LinkPreviewService) extractFavicon(html string, baseURL *url.URL) string {
	// Try to find link rel="icon" or rel="shortcut icon"
	patterns := []string{
		`<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']`,
		`<link[^>]*href=["']([^"']*)["'][^>]*rel=["'](?:shortcut )?icon["']`,
		`<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']*)["']`,
	}
	
	for _, pattern := range patterns {
		re := regexp.MustCompile(`(?i)` + pattern)
		matches := re.FindStringSubmatch(html)
		if len(matches) > 1 {
			faviconURL := matches[1]
			if !strings.HasPrefix(faviconURL, "http") {
				faviconURL = s.makeAbsoluteURL(baseURL, faviconURL)
			}
			return faviconURL
		}
	}
	
	// Default to /favicon.ico
	return baseURL.Scheme + "://" + baseURL.Host + "/favicon.ico"
}

// makeAbsoluteURL converts a relative URL to absolute
func (s *LinkPreviewService) makeAbsoluteURL(base *url.URL, relative string) string {
	relURL, err := url.Parse(relative)
	if err != nil {
		return relative
	}
	return base.ResolveReference(relURL).String()
}

// decodeHTMLEntities decodes common HTML entities
func (s *LinkPreviewService) decodeHTMLEntities(str string) string {
	replacements := map[string]string{
		"&amp;":   "&",
		"&lt;":    "<",
		"&gt;":    ">",
		"&quot;":  "\"",
		"&#39;":   "'",
		"&apos;":  "'",
		"&nbsp;":  " ",
		"&#x27;":  "'",
		"&#x2F;":  "/",
		"&#x60;":  "`",
	}
	
	for entity, char := range replacements {
		str = strings.ReplaceAll(str, entity, char)
	}
	
	return str
}
