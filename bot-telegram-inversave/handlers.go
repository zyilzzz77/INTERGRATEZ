package main

import (
	"fmt"
	"log"
	"mime"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	tele "gopkg.in/telebot.v3"
)

// maxUploadBytes is Telegram's hard limit for bot uploads (50 MB).
const maxUploadBytes = 50 * 1024 * 1024 // 50 MB

// Retry settings for unstable connections.
const (
	maxRetryAttempts = 3
)

// MediaSession caches everything needed to reconstruct buttons and resend files.
type MediaSession struct {
	Title   string
	Formats []Format
}

var mediaCache sync.Map // messageID(int) -> MediaSession

// sharedHTTPClient uses an optimized transport:
// HTTP/2, keep-alive, connection pooling for fast & stable downloads.
var sharedHTTPClient = &http.Client{
	Timeout: 10 * time.Minute,
	Transport: &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: 60 * time.Second,
		}).DialContext,
		MaxIdleConns:          5000,
		MaxIdleConnsPerHost:   5000,
		MaxConnsPerHost:       5000,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
		ForceAttemptHTTP2:     false, // Stick to HTTP/1.1 for pure binary streams
		WriteBufferSize:       128 * 1024,
		ReadBufferSize:        128 * 1024,
	},
}

// -----------------------------------------------------------------------
// Keyboard Builders
// -----------------------------------------------------------------------

// buildFormatKeyboard builds one button per format with smart labels.
// For carousel (same type, e.g. all images), it also adds a "Download Semua" button.
// For mixed types (video + audio), it only shows individual format buttons.
func buildFormatKeyboard(selector *tele.ReplyMarkup, formats []Format, isCarousel bool) {
	var rows []tele.Row
	for i, f := range formats {
		label := formatBtnLabel(i, f)
		btn := selector.Data(label, "dl", strconv.Itoa(i))
		rows = append(rows, selector.Row(btn))
	}
	if isCarousel {
		btnAll := selector.Data(
			fmt.Sprintf("📥 Download Semua (%d file)", len(formats)),
			"dl_all", "0",
		)
		rows = append(rows, selector.Row(btnAll))
	}
	selector.Inline(rows...)
}

// formatBtnLabel returns a human-friendly button label for a format.
func formatBtnLabel(idx int, f Format) string {
	switch normalizeType(f.Type) {
	case "video":
		if f.Quality != "" {
			return fmt.Sprintf("🎬 Video %s", f.Quality)
		}
		return "🎬 Video"
	case "audio":
		ext := strings.ToUpper(f.Type)
		if ext == "AUDIO" {
			ext = "MP3"
		}
		if f.Quality != "" {
			return fmt.Sprintf("🎵 %s %s", ext, f.Quality)
		}
		return "🎵 " + ext
	case "image":
		if f.Quality != "" {
			return fmt.Sprintf("🖼️ Gambar %s", f.Quality)
		}
		return "🖼️ Gambar"
	default:
		if f.Quality != "" {
			return fmt.Sprintf("📄 %s %s", strings.ToUpper(f.Type), f.Quality)
		}
		return fmt.Sprintf("📄 %s", strings.ToUpper(f.Type))
	}
}

// -----------------------------------------------------------------------
// Handlers
// -----------------------------------------------------------------------

func handleStart(c tele.Context) error {
	selector := &tele.ReplyMarkup{}
	btnDonate := selector.Data("💖 Donasi / Dukung Bot", "donate_open", "0")
	selector.Inline(selector.Row(btnDonate))

	msg := "👋 *Selamat datang di Bot Downloader!*\n\n" +
		"Kirimkan link video/audio dari:\n" +
		"🎵 TikTok • Instagram • YouTube • Twitter\n" +
		"🎧 Spotify • Pinterest • Facebook & lainnya\n\n" +
		"Bot akan langsung merespons dengan file yang kamu minta!\n\n" +
		"_Bot ini gratis — jika membantu, pertimbangkan untuk berdonasi ya!_ 🙏"
	return c.Send(msg, selector, tele.ModeMarkdown)
}

func handleMessage(c tele.Context) error {
	// Check if user is in donate custom-amount input state
	if handleDonateCustomAmount(c) {
		return nil
	}

	text := c.Text()
	parsedUrl := parseURL(text)
	if parsedUrl == "" {
		return nil
	}

	platform := detectPlatform(parsedUrl)
	if platform == "" {
		return c.Reply("Platform belum didukung atau link tidak valid.")
	}

	log.Printf("[msg] platform=%s url=%s", platform, parsedUrl)

	processingMsg, err := c.Bot().Reply(c.Message(), "⚡ Sedang memproses link...")
	if err != nil {
		processingMsg, _ = c.Bot().Send(c.Chat(), "⚡ Sedang memproses link...")
	}

	result, err := fetchDownloadInfo(parsedUrl, platform)
	if err != nil {
		log.Printf("[msg] API error: %v", err)
		c.Bot().Edit(processingMsg, "❌ Terjadi kesalahan saat memproses link.\n\nPastikan link valid dan coba lagi.")
		return err
	}

	if result == nil || len(result.Formats) == 0 {
		log.Printf("[msg] No formats found for %s", parsedUrl)
		c.Bot().Edit(processingMsg, "❌ Gagal menemukan media dari link tersebut.")
		return nil
	}

	log.Printf("[msg] Found %d format(s) for %q", len(result.Formats), result.Title)
	c.Bot().Delete(processingMsg)

	// Detect if it's a carousel (all formats have the same media type) or diverse formats (e.g. video + audio)
	isCarousel := true
	firstType := normalizeType(result.Formats[0].Type)
	for _, f := range result.Formats {
		if normalizeType(f.Type) != firstType {
			isCarousel = false
			break
		}
	}

	caption := fmt.Sprintf("✅ *%s*\n", escapeMarkdown(result.Title))
	if len(result.Formats) > 1 {
		if isCarousel {
			caption += fmt.Sprintf("📦 *Ditemukan %d file/slide.*", len(result.Formats))
		} else {
			caption += fmt.Sprintf("🗂 *Tersedia %d format lain.*", len(result.Formats)-1)
		}
	}

	selector := &tele.ReplyMarkup{}
	btnDonate := selector.Data("💖 Donasi / Nggak dulu", "donate_open", "0")

	if len(result.Formats) == 1 {
		// Single format → just add donate button
		selector.Inline(selector.Row(btnDonate))
	} else {
		// Multiple formats → individual format buttons + (optionally) Download Semua
		formatSelector := &tele.ReplyMarkup{}
		buildFormatKeyboard(formatSelector, result.Formats, isCarousel)
		// Merge: format rows first, then donate
		// We rebuild selector with all rows
		var rows []tele.Row
		for i, f := range result.Formats {
			label := formatBtnLabel(i, f)
			btn := selector.Data(label, "dl", strconv.Itoa(i))
			rows = append(rows, selector.Row(btn))
		}
		if isCarousel {
			btnAll := selector.Data(
				fmt.Sprintf("📥 Download Semua (%d file)", len(result.Formats)),
				"dl_all", "0",
			)
			rows = append(rows, selector.Row(btnAll))
		}
		rows = append(rows, selector.Row(btnDonate))
		selector.Inline(rows...)
		_ = formatSelector
	}

	statMsg := sendingStatusMsg(c, result.Formats[0].Type)
	msg2, err := sendMedia(c, result.Formats[0].URL, result.Formats[0].Type, result.Title, caption, selector)
	if statMsg != nil {
		c.Bot().Delete(statMsg)
	}

	if err != nil {
		log.Printf("[msg] Error sending media: %v", err)
		c.Bot().Send(c.Chat(), "❌ Gagal mengirim file. Mungkin format tidak didukung atau file terlalu besar.")
		return err
	}

	// Cache session ONLY if there are MORE formats for user to pick
	if len(result.Formats) > 1 && msg2 != nil {
		session := MediaSession{Title: result.Title, Formats: result.Formats}
		mediaCache.Store(msg2.ID, session)
		go func(msgID int) {
			time.Sleep(15 * time.Minute)
			mediaCache.Delete(msgID)
			log.Printf("[cache] Evicted session for msgID=%d", msgID)
		}(msg2.ID)
	}

	return nil
}

func handleCallback(c tele.Context) error {
	if c.Callback() == nil {
		return nil
	}

	data := c.Callback().Data
	action := parseCallbackAction(data)
	log.Printf("[cb] action=%q data=%q msgID=%d", action, data, c.Message().ID)

	// ── Donate callbacks (no mediaCache needed) ────────────────────────
	switch action {
	case "donate_open":
		c.Respond()
		return handleDonate(c)
	case "donate_pick", "donate_custom", "donate_cancel":
		return handleDonateCallback(c)
	case "donate_check":
		return handleDonateCheckCallback(c)
	case "donate_cancel_qr":
		return handleDonateCancelQRCallback(c)
	}

	// ── Download callbacks (need mediaCache) ───────────────────────────
	msgID := c.Message().ID
	val, ok := mediaCache.Load(msgID)
	if !ok {
		log.Printf("[cb] Cache miss for msgID=%d", msgID)
		return c.Respond(&tele.CallbackResponse{Text: "Sesi telah kedaluwarsa, kirim ulang link."})
	}
	session := val.(MediaSession)
	formats := session.Formats

	switch action {

	// ── Download semua file sekaligus ─────────────────────────────────
	case "dl_all":
		total := len(formats)
		c.Respond(&tele.CallbackResponse{Text: fmt.Sprintf("Sedang memproses %d file...", total)})

		go func() {
			success, failed := 0, 0
			for i, f := range formats {
				log.Printf("[dl_all] %d/%d type=%s", i+1, total, f.Type)
				statMsg, _ := c.Bot().Send(c.Chat(),
					fmt.Sprintf("%s Sedang mengirim %s ke-*%d* dari *%d*...",
						mediaEmoji(f.Type), mediaLabel(f.Type), i+1, total),
					&tele.SendOptions{ParseMode: tele.ModeMarkdown})
				err := withRetry(maxRetryAttempts, func() error {
					_, err := sendMedia(c, f.URL, f.Type, session.Title, "", nil)
					return err
				})
				if statMsg != nil {
					c.Bot().Delete(statMsg)
				}
				if err != nil {
					failed++
					log.Printf("[dl_all] Final error %d/%d: %v", i+1, total, err)
					c.Send(fmt.Sprintf("❌ Gagal file %d/%d\n📎 %s", i+1, total, f.URL))
				} else {
					success++
					log.Printf("[dl_all] OK %d/%d", i+1, total)
				}
				time.Sleep(50 * time.Millisecond) // ultra-fast dispatching
			}
			log.Printf("[dl_all] Done: success=%d failed=%d", success, failed)
			sendDonateReminder(c)
		}()

	// ── Tampilkan daftar format pilihan (REMOVED – buttons shown directly now) ──
	// Kept as no-op for backward compat if old messages still exist in cache
	case "dl_pick":
		c.Respond(&tele.CallbackResponse{Text: "Tombol ini sudah tidak aktif, kirim ulang link."})

	// ── Kembali (REMOVED – no longer needed) ─────────────────────────
	case "dl_back":
		c.Respond()

	// ── Download satu format tertentu ──────────────────────────────────
	case "dl":
		parts := strings.Split(data, "|")
		idxStr := parts[len(parts)-1]
		idx, err := strconv.Atoi(idxStr)
		if err != nil || idx < 0 || idx >= len(formats) {
			log.Printf("[dl] Invalid idx %q: %v", idxStr, err)
			return c.Respond(&tele.CallbackResponse{Text: "Pilihan tidak valid."})
		}

		format := formats[idx]
		log.Printf("[dl] Single download idx=%d type=%s", idx, format.Type)

		c.Respond(&tele.CallbackResponse{Text: "Memproses permintaan..."})
		
		statMsg, _ := c.Bot().Reply(c.Message(),
			fmt.Sprintf("⚡ %s Sedang mengirim %s, mohon tunggu...",
				mediaEmoji(format.Type), mediaLabel(format.Type)))

		err = withRetry(maxRetryAttempts, func() error {
			_, err := sendMedia(c, format.URL, format.Type, session.Title, "", nil)
			return err
		})
		
		if statMsg != nil {
			c.Bot().Delete(statMsg)
		}

		if err != nil {
			log.Printf("[dl] Final error: %v", err)
			c.Send(fmt.Sprintf("❌ Gagal mengirim file.\n📎 %s", format.URL))
			return err
		}
		
		sendDonateReminder(c)

	default:
		log.Printf("[cb] Unknown action %q", action)
		c.Respond()
	}

	return nil
}

// -----------------------------------------------------------------------
// sendMedia – main entry point to deliver a file to the user
// Strategy: public URL → try direct (fast, zero bandwidth on our side)
//           local URL  → stream directly (Telegram can't reach localhost)
//           fallback   → stream upload, then link if >50 MB
// -----------------------------------------------------------------------

func sendMedia(c tele.Context, urlStr string, mediaType string, title string, caption string, selector *tele.ReplyMarkup) (*tele.Message, error) {
	resolvedURL := resolveURL(urlStr)
	log.Printf("[sendMedia] url=%q type=%q resolved=%q", urlStr, mediaType, resolvedURL)

	// Local URL → Telegram can't reach it, must stream ourselves
	if isLocalURL(resolvedURL) {
		log.Printf("[sendMedia] Local URL → streaming")
		return sendViaStream(c, resolvedURL, mediaType, title, caption, selector)
	}

	// Public URL → let Telegram fetch it directly (fastest, no latency on our side)
	log.Printf("[sendMedia] Trying direct URL")
	if msg, err := sendViaURL(c, urlStr, mediaType, caption, selector); err == nil {
		log.Printf("[sendMedia] Direct URL OK")
		return msg, nil
	} else {
		log.Printf("[sendMedia] Direct URL failed: %v → trying stream upload", err)
	}

	// Stream it ourselves (handles up to 50 MB)
	if msg, err := sendViaStream(c, resolvedURL, mediaType, title, caption, selector); err == nil {
		log.Printf("[sendMedia] Stream upload OK")
		return msg, nil
	} else {
		log.Printf("[sendMedia] Stream upload failed: %v → sending link fallback", err)
		return sendLinkFallback(c, urlStr, resolvedURL, mediaType, title)
	}
}

// -----------------------------------------------------------------------
// sendViaURL – passes a public URL to Telegram (Telegram downloads it)
// Telegram limit: ~20 MB for URL-based sends, no bandwidth on our side.
// -----------------------------------------------------------------------

func sendViaURL(c tele.Context, rawURL string, mediaType string, caption string, selector *tele.ReplyMarkup) (*tele.Message, error) {
	switch normalizeType(mediaType) {
	case "video":
		return c.Bot().Send(c.Chat(), &tele.Video{File: tele.FromURL(rawURL), Caption: caption}, selector, tele.ModeMarkdown)
	case "audio":
		return c.Bot().Send(c.Chat(), &tele.Audio{File: tele.FromURL(rawURL), Caption: caption}, selector, tele.ModeMarkdown)
	case "image":
		return c.Bot().Send(c.Chat(), &tele.Photo{File: tele.FromURL(rawURL), Caption: caption}, selector, tele.ModeMarkdown)
	default:
		return c.Bot().Send(c.Chat(), &tele.Document{File: tele.FromURL(rawURL), Caption: caption}, selector, tele.ModeMarkdown)
	}
}

// -----------------------------------------------------------------------
// sendViaStream – downloads the file and streams it to Telegram.
// Uses tele.FromReader so the file body is piped directly without
// loading the entire file into memory first.
// -----------------------------------------------------------------------

func sendViaStream(c tele.Context, resolvedURL string, mediaType string, title string, caption string, selector *tele.ReplyMarkup) (*tele.Message, error) {
	resp, err := sharedHTTPClient.Get(resolvedURL)
	if err != nil {
		return nil, fmt.Errorf("GET %s: %w", resolvedURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d from %s", resp.StatusCode, resolvedURL)
	}

	// Auto-detect mediaType from Content-Type header if not set
	if mediaType == "" {
		mediaType = typeFromContentType(resp.Header.Get("Content-Type"))
		log.Printf("[stream] Auto-detected mediaType=%s", mediaType)
	}

	// Reject if Content-Length exceeds Telegram limit
	if cl := resp.ContentLength; cl > maxUploadBytes {
		return nil, fmt.Errorf("file too large: %.1f MB (limit 50 MB)", float64(cl)/1024/1024)
	}

	filename := buildFilename(resolvedURL, mediaType, title)
	log.Printf("[stream] Uploading filename=%q content-length=%d", filename, resp.ContentLength)

	// Stream directly from the specialized TCP socket body
	file := tele.FromReader(resp.Body)

	switch normalizeType(mediaType) {
	case "video":
		return c.Bot().Send(c.Chat(), &tele.Video{File: file, FileName: filename, Caption: caption}, selector, tele.ModeMarkdown)
	case "audio":
		return c.Bot().Send(c.Chat(), &tele.Audio{File: file, FileName: filename, Caption: caption}, selector, tele.ModeMarkdown)
	case "image":
		// Send as Document to preserve original quality
		return c.Bot().Send(c.Chat(), &tele.Document{File: file, FileName: filename, Caption: caption}, selector, tele.ModeMarkdown)
	default:
		return c.Bot().Send(c.Chat(), &tele.Document{File: file, FileName: filename, Caption: caption}, selector, tele.ModeMarkdown)
	}
}

// -----------------------------------------------------------------------
// sendLinkFallback – when the file is too big, send a download link
// -----------------------------------------------------------------------

func sendLinkFallback(c tele.Context, originalURL, resolvedURL, mediaType, title string) (*tele.Message, error) {
	linkURL := originalURL
	if isLocalURL(originalURL) {
		linkURL = resolvedURL
	}

	name := "File"
	if title != "" {
		name = title
	}

	msg := fmt.Sprintf(
		"⚠️ *%s*\n\n"+
			"File ini melebihi batas upload Telegram (50 MB).\n"+
			"📥 [Klik di sini untuk download langsung](%s)",
		escapeMarkdown(name), linkURL,
	)
	log.Printf("[fallback] Sending link fallback for url=%s", linkURL)
	return c.Bot().Send(c.Chat(), msg, &tele.SendOptions{ParseMode: tele.ModeMarkdown})
}

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

// parseCallbackAction extracts the endpoint key from telebot callback data.
// Telebot encodes callback data as "\f<unique>|<params...>"
func parseCallbackAction(data string) string {
	trimmed := strings.TrimPrefix(data, "\f")
	parts := strings.SplitN(trimmed, "|", 2)
	return parts[0]
}

// sendingStatusMsg sends a "sedang mengirim..." notification before upload.
// Returns the sent message so the caller can delete it after upload completes.
func sendingStatusMsg(c tele.Context, mediaType string) *tele.Message {
	text := fmt.Sprintf("%s Sedang mengirim %s, mohon tunggu...",
		mediaEmoji(mediaType), mediaLabel(mediaType))
	msg, err := c.Bot().Reply(c.Message(), text)
	if err != nil {
		msg, _ = c.Bot().Send(c.Chat(), text)
	}
	return msg
}

// sendDonateReminder sends a donate nudge after successful download.
func sendDonateReminder(c tele.Context) {
	selector := &tele.ReplyMarkup{}
	btnDonate := selector.Data("💖 Donasi Sekarang", "donate_open", "0")
	selector.Inline(selector.Row(btnDonate))
	_, _ = c.Bot().Send(c.Chat(),
		"✅ File berhasil dikirim! Jika bot ini berguna, pertimbangkan untuk berdonasi ya 🙏",
		selector, tele.ModeMarkdown)
}

// mediaEmoji returns a fitting emoji for the media type.
func mediaEmoji(mediaType string) string {
	switch normalizeType(mediaType) {
	case "video":
		return "🎬"
	case "audio":
		return "🎵"
	case "image":
		return "🖼️"
	default:
		return "📄"
	}
}

// mediaLabel returns a human-readable Bahasa Indonesia label for the media type.
func mediaLabel(mediaType string) string {
	switch normalizeType(mediaType) {
	case "video":
		return "video"
	case "audio":
		return "audio"
	case "image":
		return "gambar"
	default:
		return "file"
	}
}

// resolveURL turns relative/localhost paths into the full origin URL.
func resolveURL(urlStr string) string {
	if strings.HasPrefix(urlStr, "/") {
		apiBase := os.Getenv("DOWNLOAD_API_URL")
		if apiBase == "" {
			apiBase = "http://127.0.0.1:3000"
		}
		if u, err := url.Parse(apiBase); err == nil {
			apiBase = u.Scheme + "://" + u.Host
		}
		return apiBase + urlStr
	}
	return urlStr
}

// isLocalURL returns true if Telegram cannot reach the URL directly.
func isLocalURL(urlStr string) bool {
	return strings.HasPrefix(urlStr, "/") ||
		strings.Contains(urlStr, "localhost") ||
		strings.Contains(urlStr, "127.0.0.1") ||
		strings.Contains(urlStr, "::1")
}

// normalizeType maps raw extension/type strings to video/audio/image/document.
func normalizeType(t string) string {
	switch strings.ToLower(t) {
	case "mp4", "mov", "webm", "mkv", "avi", "video":
		return "video"
	case "mp3", "ogg", "wav", "flac", "aac", "m4a", "audio":
		return "audio"
	case "jpg", "jpeg", "png", "webp", "gif", "image":
		return "image"
	default:
		return "document"
	}
}

// typeFromContentType converts a MIME type into a simple category string.
func typeFromContentType(ct string) string {
	ct, _, _ = mime.ParseMediaType(ct)
	switch {
	case strings.HasPrefix(ct, "video/"):
		return "video"
	case strings.HasPrefix(ct, "audio/"):
		return "audio"
	case strings.HasPrefix(ct, "image/"):
		return "image"
	default:
		return "document"
	}
}

// buildFilename constructs a sensible filename for the downloaded media.
func buildFilename(rawURL, mediaType, title string) string {
	u, err := url.Parse(rawURL)
	ext := ""
	if err == nil {
		ext = filepath.Ext(u.Path)
	}
	if ext == "" {
		ext = extFromType(mediaType)
	}

	base := "download"
	if title != "" && len(title) <= 64 {
		sanitized := strings.Map(func(r rune) rune {
			if strings.ContainsRune(`/\:*?"<>|`, r) {
				return '_'
			}
			return r
		}, title)
		if sanitized != "" {
			base = sanitized
		}
	}
	return base + ext
}

func extFromType(t string) string {
	switch normalizeType(t) {
	case "video":
		return ".mp4"
	case "audio":
		return ".mp3"
	case "image":
		return ".jpg"
	default:
		return ""
	}
}

// escapeMarkdown escapes special characters for Telegram MarkdownV1.
func escapeMarkdown(s string) string {
	return strings.NewReplacer(
		"*", "\\*",
		"_", "\\_",
		"`", "\\`",
		"[", "\\[",
	).Replace(s)
}

// -----------------------------------------------------------------------
// Retry helpers
// -----------------------------------------------------------------------

// withRetry runs fn up to maxAttempts times with exponential backoff.
// It stops early on permanent (non-retryable) errors.
// Backoff: 1s → 2s → 4s (doubles each attempt).
func withRetry(maxAttempts int, fn func() error) error {
	var lastErr error
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		lastErr = fn()
		if lastErr == nil {
			return nil
		}
		if !isRetryableErr(lastErr) {
			log.Printf("[retry] Permanent error (no retry): %v", lastErr)
			return lastErr
		}
		if attempt < maxAttempts {
			delay := time.Duration(1<<uint(attempt-1)) * time.Second // 1s, 2s, 4s
			log.Printf("[retry] Attempt %d/%d failed: %v — retrying in %s",
				attempt, maxAttempts, lastErr, delay)
			time.Sleep(delay)
		}
	}
	return fmt.Errorf("all %d attempts failed, last error: %w", maxAttempts, lastErr)
}

// isRetryableErr returns true for transient network/server errors
// and false for permanent failures that retrying won't fix.
func isRetryableErr(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())

	// Permanent — do NOT retry
	permanentKeywords := []string{
		"too large",        // file size limit
		"413",              // HTTP 413 Payload Too Large
		"400 bad request",  // malformed request
		"401 unauthorized", // auth failure
		"403 forbidden",    // permission denied
		"404 not found",    // file not found
		"not found",
		"invalid url",
		"unsupported",
	}
	for _, kw := range permanentKeywords {
		if strings.Contains(msg, kw) {
			return false
		}
	}

	// Retryable — connection issues, timeouts, server errors
	return true
}
