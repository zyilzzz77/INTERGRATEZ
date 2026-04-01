package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	tele "gopkg.in/telebot.v3"
)

// -----------------------------------------------------------------------
// Donate Session – tracks user state while waiting for custom amount input
// -----------------------------------------------------------------------

type DonateSession struct {
	Step      string // "awaiting_amount"
	CreatedAt time.Time
}

var (
	donateSessionMu sync.Mutex
	donateSessions  = map[int64]*DonateSession{} // chatID -> session
)

func setDonateSession(chatID int64, step string) {
	donateSessionMu.Lock()
	defer donateSessionMu.Unlock()
	donateSessions[chatID] = &DonateSession{Step: step, CreatedAt: time.Now()}
}

func getDonateSession(chatID int64) *DonateSession {
	donateSessionMu.Lock()
	defer donateSessionMu.Unlock()
	s := donateSessions[chatID]
	if s == nil {
		return nil
	}
	if time.Since(s.CreatedAt) > 10*time.Minute {
		delete(donateSessions, chatID)
		return nil
	}
	return s
}

func clearDonateSession(chatID int64) {
	donateSessionMu.Lock()
	defer donateSessionMu.Unlock()
	delete(donateSessions, chatID)
}

// -----------------------------------------------------------------------
// Preset nominal amounts
// -----------------------------------------------------------------------

var donatePresets = []int{5000, 10000, 15000, 20000, 50000}

// -----------------------------------------------------------------------
// Keyboard Builders
// -----------------------------------------------------------------------

// buildDonateKeyboard returns the nominal picker keyboard.
func buildDonateKeyboard(selector *tele.ReplyMarkup) {
	var rows []tele.Row
	// 2 presets per row
	for i := 0; i < len(donatePresets); i += 2 {
		left := selector.Data(
			fmt.Sprintf("Rp %s", formatRupiah(donatePresets[i])),
			"donate_pick",
			strconv.Itoa(donatePresets[i]),
		)
		if i+1 < len(donatePresets) {
			right := selector.Data(
				fmt.Sprintf("Rp %s", formatRupiah(donatePresets[i+1])),
				"donate_pick",
				strconv.Itoa(donatePresets[i+1]),
			)
			rows = append(rows, selector.Row(left, right))
		} else {
			rows = append(rows, selector.Row(left))
		}
	}
	btnCustom := selector.Data("💬 Nominal Bebas", "donate_custom", "0")
	btnCancel := selector.Data("❌ Batal", "donate_cancel", "0")
	rows = append(rows, selector.Row(btnCustom))
	rows = append(rows, selector.Row(btnCancel))
	selector.Inline(rows...)
}

// -----------------------------------------------------------------------
// Handlers
// -----------------------------------------------------------------------

// handleDonate shows the donate intro + nominal picker.
func handleDonate(c tele.Context) error {
	selector := &tele.ReplyMarkup{}
	buildDonateKeyboard(selector)

	text := "💖 *Terima kasih sudah menggunakan bot ini!*\n\n" +
		"Bot ini gratis dan open-source. Bantu kami terus berkembang dengan donasi kecilmu! 🙏\n\n" +
		"*Pilih nominal donasi:*"

	return c.Send(text, selector, tele.ModeMarkdown)
}

// handleDonateCallback processes all donate_* callbacks.
func handleDonateCallback(c tele.Context) error {
	if c.Callback() == nil {
		return nil
	}
	data := c.Callback().Data
	action := parseCallbackAction(data)

	switch action {

	// ── User picks a preset amount ─────────────────────────────────────
	case "donate_pick":
		parts := strings.Split(strings.TrimPrefix(data, "\f"), "|")
		amountStr := parts[len(parts)-1]
		amount, err := strconv.Atoi(amountStr)
		if err != nil || amount < 1000 {
			return c.Respond(&tele.CallbackResponse{Text: "Nominal tidak valid."})
		}
		_ = c.Respond(&tele.CallbackResponse{
			Text: fmt.Sprintf("⏳ Membuat QRIS Rp %s...", formatRupiah(amount)),
		})
		_, _ = c.Bot().Edit(c.Message(),
			fmt.Sprintf("⏳ Membuat QRIS untuk Rp *%s*, mohon tunggu...", formatRupiah(amount)),
			&tele.SendOptions{ParseMode: tele.ModeMarkdown})
		go processDonatePay(c, amount)

	// ── User wants custom amount ─────────────────────────────────────
	case "donate_custom":
		setDonateSession(c.Chat().ID, "awaiting_amount")
		_ = c.Respond()

		_, _ = c.Bot().Edit(c.Message(),
			"💬 *Masukkan nominal donasi kamu:*\n\n_Ketik angka saja, contoh: 7500 (minimal Rp 1.000)_",
			tele.ModeMarkdown)

		// Send ForceReply nudge
		forceReply := &tele.ReplyMarkup{ForceReply: true, Selective: true}
		_, _ = c.Bot().Send(c.Chat(),
			"✏️ Ketik nominal donasi:",
			forceReply)

	// ── Cancel donate ────────────────────────────────────────────────
	case "donate_cancel":
		clearDonateSession(c.Chat().ID)
		_ = c.Respond(&tele.CallbackResponse{Text: "Dibatalkan."})
		return c.Bot().Delete(c.Message())
	}

	return nil
}

// handleDonateCustomAmount is called from handleMessage when user is in awaiting_amount state.
// Returns true if the message was consumed by donate flow.
func handleDonateCustomAmount(c tele.Context) bool {
	text := strings.TrimSpace(c.Text())
	sess := getDonateSession(c.Chat().ID)
	hasSession := (sess != nil && sess.Step == "awaiting_amount")

	// Clean formatting: "7.500" or "7,500" or "1.000.000" → "7500", "1000000"
	cleanText := strings.ReplaceAll(text, ".", "")
	cleanText = strings.ReplaceAll(cleanText, ",", "")

	amount, err := strconv.Atoi(cleanText)

	if !hasSession {
		// Passthrough condition:
		// If the user didn't click "Nominal Bebas", only intercept if the EXACT 
		// entire message is a valid numeric quantity between 1K and 1M.
		if err != nil || amount < 1000 || amount > 1000000 {
			return false // Ignore, let other handlers process it (e.g. download links)
		}
	} else {
		// If user clicked "Nominal Bebas", we consume this message NO MATTER WHAT.
		clearDonateSession(c.Chat().ID)
		if err != nil || amount < 1000 || amount > 1000000 {
			_ = c.Reply("❌ Nominal tidak valid. Masukkan angka minimal *1.000* dan maksimal *1.000.000*.\n\nContoh: `10000` atau `10.000`",
				&tele.SendOptions{ParseMode: tele.ModeMarkdown})
			return true
		}
	}

	loadMsg, _ := c.Bot().Send(c.Chat(),
		fmt.Sprintf("⏳ Membuat QRIS untuk Rp *%s*, mohon tunggu...", formatRupiah(amount)),
		tele.ModeMarkdown, &tele.SendOptions{ReplyTo: c.Message()})
	go processDonatePay2(c, loadMsg, amount)
	return true
}

// -----------------------------------------------------------------------
// Core: generate QRIS and poll payment
// -----------------------------------------------------------------------

// processDonatePay is used for preset-amount flow (via callback → edit message).
func processDonatePay(c tele.Context, amount int) {
	qrURL, paymentID, err := createSaweriaPayment(amount, "Donasi via Bot Telegram")
	if err != nil {
		log.Printf("[donate] createPayment error: %v", err)
		_, _ = c.Bot().Edit(c.Message(),
			fmt.Sprintf("❌ Gagal membuat QRIS: %v\n\nCoba lagi dengan /donate", err),
			&tele.SendOptions{ParseMode: tele.ModeMarkdown})
		return
	}

	// Delete the loading edit, then send fresh QRIS message
	_ = c.Bot().Delete(c.Message())
	qrisMsg := sendQRISMessage(c, amount, paymentID, qrURL)
	if qrisMsg == nil {
		return
	}
	pollPayment(c, qrisMsg, paymentID, amount)
}

// processDonatePay2 is used for custom-amount flow (via message reply with loadMsg).
func processDonatePay2(c tele.Context, loadMsg *tele.Message, amount int) {
	qrURL, paymentID, err := createSaweriaPayment(amount, "Donasi via Bot Telegram")
	if err != nil {
		log.Printf("[donate] createPayment error: %v", err)
		if loadMsg != nil {
			_, _ = c.Bot().Edit(loadMsg,
				fmt.Sprintf("❌ Gagal membuat QRIS: %v\n\nCoba lagi dengan /donate", err),
				&tele.SendOptions{ParseMode: tele.ModeMarkdown})
		}
		return
	}

	if loadMsg != nil {
		_ = c.Bot().Delete(loadMsg)
	}

	qrisMsg := sendQRISMessage(c, amount, paymentID, qrURL)
	if qrisMsg == nil {
		return
	}
	pollPayment(c, qrisMsg, paymentID, amount)
}

// sendQRISMessage sends the QRIS photo + caption.
// Tries: URL photo → download & stream → text-only fallback.
func sendQRISMessage(c tele.Context, amount int, paymentID string, qrImageURL string) *tele.Message {
	caption := fmt.Sprintf(
		"💳 *QRIS Donasi — Rp %s*\n\n"+
			"Scan QR di atas atau bayar via:\n"+
			"• QRIS (GoPay, OVO, Dana, LinkAja, dll)\n"+
			"• Transfer Bank\n\n"+
			"⏱ QR berlaku *5 menit*\n"+
			"🔄 Status diperbarui otomatis setelah bayar.\n\n"+
			"_Payment ID: %s_",
		formatRupiah(amount),
		paymentID,
	)

	selector := &tele.ReplyMarkup{}
	btnCheck := selector.Data("🔄 Cek Status Sekarang", "donate_check", paymentID)
	btnCancel := selector.Data("❌ Batalkan", "donate_cancel_qr", "0")
	selector.Inline(selector.Row(btnCheck), selector.Row(btnCancel))

	// Strategy 0: Data URI (base64) - This is what Saweria typically returns
	if strings.HasPrefix(qrImageURL, "data:image") {
		idx := strings.Index(qrImageURL, ";base64,")
		if idx != -1 {
			b64data := qrImageURL[idx+8:]
			imgBytes, err := base64.StdEncoding.DecodeString(b64data)
			if err == nil {
				photo := &tele.Photo{
					File:    tele.FromReader(bytes.NewReader(imgBytes)),
					Caption: caption,
				}
				msg, err := c.Bot().Send(c.Chat(), photo, selector, tele.ModeMarkdown)
				if err == nil {
					log.Printf("[donate] QRIS base64 photo sent OK")
					return msg
				}
				log.Printf("[donate] Base64 photo send failed: %v", err)
			} else {
				log.Printf("[donate] Base64 decode failed: %v", err)
			}
		}
	} else if qrImageURL != "" {
		log.Printf("[donate] Trying to send QRIS photo via URL: %s", qrImageURL)
		photo := &tele.Photo{File: tele.FromURL(qrImageURL), Caption: caption}
		msg, err := c.Bot().Send(c.Chat(), photo, selector, tele.ModeMarkdown)
		if err == nil {
			log.Printf("[donate] QRIS photo via URL sent OK, msgID=%d", msg.ID)
			return msg
		}
		log.Printf("[donate] URL photo failed: %v — trying stream", err)

		// Strategy 2: Download image and stream to Telegram
		msg, err = sendQRISViaStream(c, qrImageURL, caption, selector)
		if err == nil {
			log.Printf("[donate] QRIS photo via stream sent OK")
			return msg
		}
		log.Printf("[donate] Stream also failed: %v — text fallback", err)
	}

	// Strategy 3: Text-only fallback with payment link
	fallbackURL := qrImageURL
	if len(fallbackURL) > 100 {
		fallbackURL = "(Link terlalu panjang/berbentuk data gambar)"
	}
	textCaption := fmt.Sprintf(
		"💳 *QRIS Donasi — Rp %s*\n\n"+
			"Link bayar: %s\n\n"+
			"⏱ Berlaku *5 menit*\n"+
			"_Payment ID: %s_",
		formatRupiah(amount), fallbackURL, paymentID,
	)
	msg, err := c.Bot().Send(c.Chat(), textCaption, selector, tele.ModeMarkdown)
	if err != nil {
		log.Printf("[donate] Text fallback send failed: %v", err)
		return nil
	}
	return msg
}

// sendQRISViaStream downloads the QR image and sends it as a file stream.
func sendQRISViaStream(c tele.Context, imageURL string, caption string, selector *tele.ReplyMarkup) (*tele.Message, error) {
	resp, err := sharedHTTPClient.Get(imageURL)
	if err != nil {
		return nil, fmt.Errorf("download error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d downloading QR", resp.StatusCode)
	}

	imgBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read error: %w", err)
	}

	photo := &tele.Photo{
		File:    tele.FromReader(bytes.NewReader(imgBytes)),
		Caption: caption,
	}
	return c.Bot().Send(c.Chat(), photo, selector, tele.ModeMarkdown)
}

// pollPayment polls Saweria every 5s for up to 5 minutes.
func pollPayment(c tele.Context, qrisMsg *tele.Message, paymentID string, amount int) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	deadline := time.Now().Add(5 * time.Minute)

	for range ticker.C {
		paid, err := checkSaweriaPayment(paymentID)
		if err != nil {
			log.Printf("[donate] pollPayment check error: %v", err)
			continue
		}
		if paid {
			_ = c.Bot().Delete(qrisMsg)
			sendDonateThankYou(c, amount)
			return
		}
		if time.Now().After(deadline) {
			selector := &tele.ReplyMarkup{}
			btnRetry := selector.Data("🔁 Coba Lagi", "donate_open", "0")
			selector.Inline(selector.Row(btnRetry))
			_, _ = c.Bot().Edit(qrisMsg,
				"⌛ *QR sudah kedaluwarsa.*\n\nTekan tombol di bawah untuk membuat QRIS baru.",
				selector, tele.ModeMarkdown)
			return
		}
	}
}

// sendDonateThankYou sends a heartfelt thank you after payment confirmed.
func sendDonateThankYou(c tele.Context, amount int) {
	text := fmt.Sprintf(
		"🎉 *Terima kasih banyak atas donasimu!*\n\n"+
			"💝 Kamu baru saja mendonasikan *Rp %s*\n\n"+
			"Berkat dukunganmu, bot ini bisa terus berkembang dan tetap gratis untuk semua orang. "+
			"Kamu luar biasa! 🙏✨\n\n"+
			"_— Tim InverSave Bot_",
		formatRupiah(amount),
	)
	_, _ = c.Bot().Send(c.Chat(), text, tele.ModeMarkdown)
}

// -----------------------------------------------------------------------
// handleDonateCheckCallback – manual "Cek Status" button
// -----------------------------------------------------------------------

func handleDonateCheckCallback(c tele.Context) error {
	if c.Callback() == nil {
		return nil
	}
	data := c.Callback().Data
	parts := strings.Split(strings.TrimPrefix(data, "\f"), "|")
	paymentID := parts[len(parts)-1]

	_ = c.Respond(&tele.CallbackResponse{Text: "Mengecek status pembayaran..."})

	paid, err := checkSaweriaPayment(paymentID)
	if err != nil {
		log.Printf("[donate_check] error: %v", err)
		return c.Respond(&tele.CallbackResponse{Text: "❌ Gagal cek status, coba lagi."})
	}
	if paid {
		amount := parseAmountFromCaption(c.Message())
		_ = c.Bot().Delete(c.Message())
		sendDonateThankYou(c, amount)
		return nil
	}
	return c.Respond(&tele.CallbackResponse{Text: "⏳ Belum dibayar — silakan scan QRIS dulu."})
}

// handleDonateCancelQRCallback deletes the QRIS message.
func handleDonateCancelQRCallback(c tele.Context) error {
	_ = c.Respond(&tele.CallbackResponse{Text: "Dibatalkan."})
	return c.Bot().Delete(c.Message())
}

// parseAmountFromCaption tries to extract rupiah amount from a message caption.
func parseAmountFromCaption(msg *tele.Message) int {
	if msg == nil {
		return 0
	}
	text := msg.Caption
	if text == "" {
		text = msg.Text
	}
	if idx := strings.Index(text, "Rp "); idx >= 0 {
		raw := strings.Fields(text[idx+3:])
		if len(raw) > 0 {
			clean := strings.ReplaceAll(raw[0], ".", "")
			clean = strings.ReplaceAll(clean, ",", "")
			n, _ := strconv.Atoi(clean)
			return n
		}
	}
	return 0
}

// -----------------------------------------------------------------------
// Saweria API helpers
// -----------------------------------------------------------------------

type saweriaCreateResp struct {
	Status bool   `json:"status"`
	Msg    string `json:"msg"`
	Data   struct {
		ID      string `json:"id"`
		Amount  int    `json:"amount"`
		URL     string `json:"url"`
		Receipt string `json:"receipt"`
		QRImage string `json:"qr_image"`
	} `json:"data"`
}

type saweriaCheckResp struct {
	Status bool   `json:"status"`
	Msg    string `json:"msg"`
}

func saweriaAPIBase() string {
	base := os.Getenv("NEOXR_API_BASE_URL")
	if base == "" {
		base = "https://api.neoxr.eu"
	}
	return base
}

func saweriaAPIKey() string {
	key := os.Getenv("TAKO_API_KEY")
	if key == "" {
		key = os.Getenv("NEOXR_API_KEY")
	}
	return strings.Trim(key, `"`)
}

func saweriaUserID() string {
	uid := os.Getenv("SAWERIA_USER_ID")
	if uid == "" {
		uid = "a4a04e34-3392-4c93-adcc-06eb79264c03"
	}
	return strings.Trim(uid, `"`)
}

// createSaweriaPayment calls Saweria create API.
// Returns (qrImageURL, paymentID, error).
func createSaweriaPayment(amount int, message string) (string, string, error) {
	userID := saweriaUserID()
	apiKey := saweriaAPIKey()
	base := saweriaAPIBase()

	reqURL := fmt.Sprintf("%s/api/saweria-create?userid=%s&amount=%d&message=%s&apikey=%s",
		base,
		url.QueryEscape(userID),
		amount,
		url.QueryEscape(message),
		url.QueryEscape(apiKey),
	)

	log.Printf("[saweria] createPayment → %s", reqURL)

	resp, err := sharedHTTPClient.Get(reqURL)
	if err != nil {
		return "", "", fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	log.Printf("[saweria] createPayment HTTP %d body: %s", resp.StatusCode, string(body))

	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("API HTTP %d: %s", resp.StatusCode, string(body))
	}

	var result saweriaCreateResp
	if err := json.NewDecoder(bytes.NewReader(body)).Decode(&result); err != nil {
		return "", "", fmt.Errorf("decode error: %w (body: %s)", err, string(body))
	}
	if !result.Status {
		return "", "", fmt.Errorf("saweria error: %s", result.Msg)
	}

	qrImage := result.Data.QRImage
	if qrImage == "" {
		qrImage = result.Data.URL
	}
	if qrImage == "" {
		qrImage = result.Data.Receipt
	}

	log.Printf("[saweria] paymentID=%s qrImage=%s", result.Data.ID, qrImage)
	return qrImage, result.Data.ID, nil
}

// checkSaweriaPayment returns true if payment is confirmed.
func checkSaweriaPayment(paymentID string) (bool, error) {
	userID := saweriaUserID()
	apiKey := saweriaAPIKey()
	base := saweriaAPIBase()

	reqURL := fmt.Sprintf("%s/api/saweria-check?userid=%s&id=%s&apikey=%s",
		base,
		url.QueryEscape(userID),
		url.QueryEscape(paymentID),
		url.QueryEscape(apiKey),
	)

	resp, err := sharedHTTPClient.Get(reqURL)
	if err != nil {
		return false, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	log.Printf("[saweria] checkPayment id=%s body: %s", paymentID, string(body))

	var result saweriaCheckResp
	if err := json.NewDecoder(bytes.NewReader(body)).Decode(&result); err != nil {
		return false, fmt.Errorf("decode error: %w", err)
	}
	return result.Status, nil
}

// -----------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------

// formatRupiah formats 10000 → "10.000"
func formatRupiah(n int) string {
	s := strconv.Itoa(n)
	out := ""
	for i, ch := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			out += "."
		}
		out += string(ch)
	}
	return out
}
