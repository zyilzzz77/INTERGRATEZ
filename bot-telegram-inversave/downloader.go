package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"time"
)

// apiRESTClient uses a highly optimized transport for calling our own Next.js API.
// Keep-Alive and pooling make repeated requests extremely fast.
var apiRESTClient = &http.Client{
	Timeout: 15 * time.Second,
	Transport: &http.Transport{
		DialContext: (&net.Dialer{
			Timeout:   5 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		MaxIdleConns:          1000,
		MaxIdleConnsPerHost:   1000,
		MaxConnsPerHost:       1000,
		IdleConnTimeout:       90 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
		ForceAttemptHTTP2:     true,
	},
}

type Format struct {
	Quality string `json:"quality"`
	URL     string `json:"url"`
	Type    string `json:"type"`
}

type DownloadResult struct {
	Title     string   `json:"title"`
	Thumbnail string   `json:"thumbnail"`
	Duration  string   `json:"duration"`
	Platform  string   `json:"platform"`
	Formats   []Format `json:"formats"`
}

func fetchDownloadInfo(targetURL, platform string) (*DownloadResult, error) {
	apiBase := os.Getenv("DOWNLOAD_API_URL")
	if apiBase == "" {
		apiBase = "http://127.0.0.1:3000/api/download"
	}

	reqURL := fmt.Sprintf("%s?url=%s&platform=%s&free=1", apiBase, url.QueryEscape(targetURL), platform)
	
	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create req: %v", err)
	}

	resp, err := apiRESTClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch API: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error (%d): %s", resp.StatusCode, string(body))
	}

	var result DownloadResult
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return nil, fmt.Errorf("failed decoding JSON: %v", err)
	}

	return &result, nil
}
