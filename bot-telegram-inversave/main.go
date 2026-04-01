package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
	tele "gopkg.in/telebot.v3"
)

func main() {
	_ = godotenv.Load()

	token := os.Getenv("BOT_TOKEN")
	if token == "" {
		log.Fatal("FATAL: BOT_TOKEN is not set in .env")
	}

	// Use a custom HTTP client with a long timeout for large file uploads.
	// Telegram can be slow accepting big multipart uploads; 15 minutes is safe.
	// Added extreme connection pooling so the bot handles hundreds of concurrent sends.
	botHTTPClient := &http.Client{
		Timeout: 15 * time.Minute,
		Transport: &http.Transport{
			MaxIdleConns:          1000,
			MaxIdleConnsPerHost:   100,
			MaxConnsPerHost:       100,
			IdleConnTimeout:       90 * time.Second,
			TLSHandshakeTimeout:   10 * time.Second,
			ExpectContinueTimeout: 1 * time.Second,
			ForceAttemptHTTP2:     false, // For thick file streaming, HTTP/1.1 avoids head-of-line multiplexing blocking
			WriteBufferSize:       128 * 1024, // 128 KB socket write buffer
			ReadBufferSize:        128 * 1024, // 128 KB socket read buffer
		},
	}

	pref := tele.Settings{
		Token:  token,
		Poller: &tele.LongPoller{Timeout: 10 * time.Second},
		Client: botHTTPClient,
	}

	b, err := tele.NewBot(pref)
	if err != nil {
		log.Fatal(err)
		return
	}

	// Route Handlers
	b.Handle("/start", handleStart)
	b.Handle("/donate", handleDonate)
	b.Handle(tele.OnText, handleMessage)
	b.Handle(tele.OnCallback, handleCallback)

	log.Println("⚡ Bot is running successfully...")
	b.Start()
}
