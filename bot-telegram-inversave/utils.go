package main

import (
	"regexp"
)

var urlRegex = regexp.MustCompile(`(http|https):\/\/[^\s]+`)

func parseURL(text string) string {
	return urlRegex.FindString(text)
}

func detectPlatform(urlStr string) string {
	if regexp.MustCompile(`(?i)(tiktok\.com|douyin\.com)`).MatchString(urlStr) {
		return "tiktok"
	}
	if regexp.MustCompile(`(?i)(youtube\.com|youtu\.be)`).MatchString(urlStr) {
		return "youtube"
	}
	if regexp.MustCompile(`(?i)(instagram\.com)`).MatchString(urlStr) {
		return "instagram"
	}
	if regexp.MustCompile(`(?i)(facebook\.com|fb\.watch|fb\.gg)`).MatchString(urlStr) {
		return "facebook"
	}
	if regexp.MustCompile(`(?i)(twitter\.com|x\.com)`).MatchString(urlStr) {
		return "twitter"
	}
	if regexp.MustCompile(`(?i)(threads\.net)`).MatchString(urlStr) {
		return "threads"
	}
	if regexp.MustCompile(`(?i)(capcut\.com|capcut\.net|capcut\.link)`).MatchString(urlStr) {
		return "capcut"
	}
	if regexp.MustCompile(`(?i)(spotify\.com)`).MatchString(urlStr) {
		return "spotify"
	}
	if regexp.MustCompile(`(?i)(pinterest\.com|pin\.it)`).MatchString(urlStr) {
		return "pinterest"
	}
	if regexp.MustCompile(`(?i)(bilibili\.com|b23\.tv)`).MatchString(urlStr) {
		return "bilibili"
	}
	return ""
}
