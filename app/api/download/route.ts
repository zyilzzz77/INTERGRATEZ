import { NextRequest, NextResponse } from "next/server";
import { getPinData } from "@/lib/pinterest";

// Helper to obfuscate URL
function obfuscate(str: string) {
    if (!str) return "";
    return Buffer.from(str).toString('base64');
}

const API_BASE = process.env.API_BASE_URL || "http://70.153.144.239:2420";

interface Format {
    quality: string;
    url: string;
    type: string;
}

interface DownloadResult {
    title: string;
    thumbnail: string;
    duration: string;
    platform: string;
    formats: Format[];
    artist?: string;
    album?: string;
    release_date?: string;
}

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: CORS });
}

/* ── helpers ─────────────────────────────────────────── */

async function fetchProxy(endpoint: string): Promise<unknown> {
    const res = await fetch(`${API_BASE}${endpoint}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Upstream ${res.status}`);
    return res.json();
}

/** Wrap a thumbnail URL through our proxy to avoid CORS / referrer blocks */
function proxyThumb(url: string): string {
    if (!url) return "";
    if (url.startsWith("/api/proxy-image?url=")) return url;
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

function pickTikTokThumb(d: any, data: any): string {
    const imageFromD = Array.isArray(d?.images) ? d.images[0] : "";
    const imageFromData = Array.isArray(data?.images) ? data.images[0] : "";
    return (
        imageFromD ||
        d?.ai_dynamic_cover ||
        d?.cover ||
        d?.origin_cover ||
        d?.thumbnail ||
        data?.cover ||
        data?.thumbnail ||
        imageFromData ||
        ""
    );
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Recursively search an object for keys that typically hold download URLs.
 * Returns an array of { quality, url, type }.
 */
function deepExtractFormats(obj: any, depth = 0): Format[] {
    const formats: Format[] = [];
    if (!obj || typeof obj !== "object" || depth > 5) return formats;

    const videoKeys = [
        "play", "hdplay", "wmplay", "nowatermark", "watermark",
        "video", "hd", "sd", "download", "download_url", "downloadUrl",
        "mp4", "url_list",
    ];
    const audioKeys = ["music", "audio", "mp3", "music_url"];

    for (const [key, val] of Object.entries(obj)) {
        if (typeof val === "string" && val.startsWith("http")) {
            const lk = key.toLowerCase();
            if (videoKeys.includes(lk)) {
                formats.push({
                    quality: key === "hdplay" || key === "hd" ? "HD"
                        : key === "sd" ? "SD"
                            : key === "wmplay" || key === "watermark" ? "Watermark"
                                : key === "play" || key === "nowatermark" ? "No Watermark"
                                    : key.charAt(0).toUpperCase() + key.slice(1),
                    url: val as string,
                    type: "mp4",
                });
            } else if (audioKeys.includes(lk)) {
                formats.push({ quality: "Audio", url: val as string, type: "mp3" });
            }
        } else if (Array.isArray(val)) {
            // url_list style arrays
            if (val.length > 0 && typeof val[0] === "string" && (val[0] as string).startsWith("http")) {
                const lk = key.toLowerCase();
                if (lk.includes("video") || lk.includes("play") || lk === "url_list") {
                    formats.push({ quality: "HD", url: val[0] as string, type: "mp4" });
                }
            } else {
                for (const item of val) {
                    formats.push(...deepExtractFormats(item, depth + 1));
                }
            }
        } else if (typeof val === "object" && val !== null) {
            formats.push(...deepExtractFormats(val, depth + 1));
        }
    }
    return formats;
}

/** Deduplicate formats by URL */
function dedup(formats: Format[]): Format[] {
    const seen = new Set<string>();
    return formats.filter((f) => {
        if (!f.url || seen.has(f.url)) return false;
        seen.add(f.url);
        return true;
    });
}

function normaliseYouTube(data: any): DownloadResult {
    const formats: Format[] = [];
    if (data?.formats) {
        for (const f of data.formats) {
            formats.push({
                quality: f.quality || f.resolution || "default",
                url: f.url || f.download || "",
                type: f.type || (f.ext === "mp3" ? "mp3" : "mp4"),
            });
        }
    }
    if (data?.audio) {
        formats.push({ quality: "mp3", url: data.audio, type: "mp3" });
    }
    if (data?.url && formats.length === 0) {
        formats.push({ quality: "default", url: data.url, type: "mp4" });
    }
    // fallback: deep scan
    if (formats.length === 0) {
        formats.push(...deepExtractFormats(data));
    }
    return {
        title: data?.title || "YouTube Video",
        thumbnail: data?.thumbnail || data?.thumb || "",
        duration: data?.duration || data?.lengthSeconds || "-",
        platform: "youtube",
        formats: dedup(formats),
    };
}

function normaliseTikTok(data: any): DownloadResult {
    const formats: Format[] = [];

    // Handle nested .data or .result wrapper
    const d = data?.result || data?.data || data;

    // ── Primary: parse medias[] array (actual API format) ──
    if (Array.isArray(d?.medias)) {
        for (const m of d.medias) {
            if (!m.url) continue;
            const qualityMap: Record<string, string> = {
                hd_no_watermark: "HD (No Watermark)",
                no_watermark: "No Watermark",
                watermark: "Watermark",
                hd: "HD",
                sd: "SD",
                audio: "Audio",
            };
            formats.push({
                quality: qualityMap[m.quality] || m.quality || "default",
                url: m.url,
                type: m.type === "audio" || m.extension === "mp3" ? "mp3" : "mp4",
            });
        }
    }

    // ── Fallback: flat fields (other API variants) ──
    if (formats.length === 0) {
        if (d?.play) formats.push({ quality: "No Watermark", url: d.play, type: "mp4" });
        if (d?.hdplay) formats.push({ quality: "HD", url: d.hdplay, type: "mp4" });
        if (d?.wmplay) formats.push({ quality: "Watermark", url: d.wmplay, type: "mp4" });
        if (d?.nowatermark) formats.push({ quality: "No Watermark", url: d.nowatermark, type: "mp4" });
        if (d?.watermark) formats.push({ quality: "Watermark", url: d.watermark, type: "mp4" });
        if (d?.video) formats.push({ quality: "HD", url: d.video, type: "mp4" });
        if (d?.music) formats.push({ quality: "Audio", url: d.music, type: "mp3" });
        if (d?.audio) formats.push({ quality: "Audio", url: d.audio, type: "mp3" });
    }

    // ── Images (slideshow / photomode) ──
    if (Array.isArray(d?.images)) {
        d.images.forEach((img: string, i: number) => {
            if (!img) return;
            formats.push({ quality: `Image ${i + 1}`, url: img, type: "jpg" });
        });
    }

    // ── Deep scan fallback ──
    if (formats.length === 0) {
        formats.push(...deepExtractFormats(data));
    }

    // Last resort
    if (formats.length === 0 && d?.url) {
        formats.push({ quality: "default", url: d.url, type: "mp4" });
    }

    const title = d?.title || d?.desc || data?.title || data?.desc || "TikTok Video";
    const thumb = pickTikTokThumb(d, data);
    // Duration from API is in milliseconds (e.g. 14834 → "14s")
    const rawDur = d?.duration || data?.duration;
    const dur = rawDur ? (rawDur > 1000 ? `${Math.round(rawDur / 1000)}s` : `${rawDur}s`) : "-";

    return {
        title,
        thumbnail: proxyThumb(thumb),
        duration: dur,
        platform: "tiktok",
        formats: dedup(formats),
    };
}

function normaliseIG(data: any): DownloadResult {
    const formats: Format[] = [];

    // Handle nested .result wrapper (actual API format)
    const d = data?.result || data?.data || data;

    // ── Primary: parse medias[] array ──
    if (Array.isArray(d?.medias)) {
        for (const m of d.medias) {
            if (!m.url) continue;
            const isImage = m.type === "image" || m.extension === "jpg" || m.extension === "webp" || m.extension === "png";
            const qualityLabel = m.quality || (isImage ? `Image` : `Video`);
            formats.push({
                quality: qualityLabel,
                url: m.url,
                type: isImage ? "jpg" : "mp4",
            });
        }
    }

    // ── Fallback: flat array or nested data ──
    if (formats.length === 0) {
        const items = Array.isArray(data) ? data
            : Array.isArray(d) ? d
                : d?.data ? (Array.isArray(d.data) ? d.data : [d.data])
                    : [];
        items.forEach((item: any, i: number) => {
            const url = item.url || item.download || "";
            if (url) formats.push({ quality: `Media ${i + 1}`, url, type: "mp4" });
        });
    }

    // ── Single URL fallback ──
    if (formats.length === 0 && d?.url && !d.url.includes("instagram.com")) {
        formats.push({ quality: "default", url: d.url, type: "mp4" });
    }

    // ── Deep scan fallback ──
    if (formats.length === 0) {
        formats.push(...deepExtractFormats(data));
    }

    // Truncate long IG captions to first line or 100 chars
    const rawTitle = d?.title || data?.title || "Instagram Media";
    const title = rawTitle.length > 100 ? rawTitle.slice(0, 100).trim() + "…" : rawTitle;
    const author = d?.author || d?.owner?.username || "";
    const displayTitle = author ? `${title} — @${author}` : title;

    return {
        title: displayTitle,
        thumbnail: d?.thumbnail || data?.thumbnail || "",
        duration: "-",
        platform: "instagram",
        formats: dedup(formats),
    };
}

function normaliseFB(data: any): DownloadResult {
    const formats: Format[] = [];
    if (data?.hd) formats.push({ quality: "HD", url: data.hd, type: "mp4" });
    if (data?.sd) formats.push({ quality: "SD", url: data.sd, type: "mp4" });
    if (data?.url) formats.push({ quality: "default", url: data.url, type: "mp4" });
    if (formats.length === 0) formats.push(...deepExtractFormats(data));
    return {
        title: data?.title || "Facebook Video",
        thumbnail: data?.thumbnail || "",
        duration: data?.duration || "-",
        platform: "facebook",
        formats: dedup(formats),
    };
}

function normaliseCapCut(data: any): DownloadResult {
    const formats: Format[] = [];
    if (data?.url) formats.push({ quality: "default", url: data.url, type: "mp4" });
    if (data?.video) formats.push({ quality: "HD", url: data.video, type: "mp4" });
    if (formats.length === 0) formats.push(...deepExtractFormats(data));
    return {
        title: data?.title || "CapCut Video",
        thumbnail: data?.thumbnail || "",
        duration: data?.duration || "-",
        platform: "capcut",
        formats: dedup(formats),
    };
}

function normaliseSpotify(data: any): DownloadResult {
    const d = data?.result || data;
    const formats: Format[] = [];

    // NexRay v1 structure: { result: { url: "...", artist: ["..."], duration: 123 } }
    if (d?.url) {
        formats.push({ quality: "Audio", url: d.url, type: "mp3" });
    }

    if (formats.length === 0) {
        formats.push(...deepExtractFormats(data));
    }

    const artist = Array.isArray(d?.artist) ? d.artist.join(", ") : d?.artist || "";
    const title = d?.title || "Spotify Track";
    const displayTitle = artist ? `${artist} - ${title}` : title;

    let duration: string = typeof d?.duration === "string" ? d.duration : "-";
    if (typeof d?.duration === "number") {
        const ms = d.duration;
        const min = Math.floor(ms / 60000);
        const sec = Math.floor((ms % 60000) / 1000);
        duration = `${min}:${sec.toString().padStart(2, "0")}`;
    }

    return {
        title: displayTitle,
        thumbnail: d?.thumbnail || d?.cover || d?.image || "",
        duration,
        platform: "spotify",
        formats: dedup(formats),
        artist: artist || undefined,
        album: d?.album || undefined,
        release_date: d?.release_at || undefined,
    };
}

function normalisePinterest(data: any): DownloadResult {
    const formats: Format[] = [];

    if (Array.isArray(data?.results)) {
        for (const m of data.results) {
            if (!m.url) continue;
            const isVideo = m.type === "video" || m.format === "MP4";
            formats.push({
                quality: m.quality || (isVideo ? "Video" : "Image"),
                url: m.url,
                type: isVideo ? "mp4" : "jpg",
            });
        }
    }

    // Deep scan fallback
    if (formats.length === 0) {
        formats.push(...deepExtractFormats(data));
    }

    return {
        title: data?.title || "Pinterest Pin",
        thumbnail: formats.find((f) => f.type === "jpg")?.url || "",
        duration: "-",
        platform: "pinterest",
        formats: dedup(formats),
    };
}

/* ── Twitter via twitsave.com HTML scraping ─────────── */
async function fetchTwitter(url: string): Promise<DownloadResult> {
    const res = await fetch(`https://twitsave.com/info?url=${encodeURIComponent(url)}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        cache: "no-store",
    });
    const html = await res.text();
    const formats: Format[] = [];

    const linkRe = /https?:\/\/[^"'\s]+\.mp4[^"'\s]*/g;
    const links = [...new Set(html.match(linkRe) || [])];
    links.forEach((l, i) => {
        formats.push({ quality: i === 0 ? "HD" : `Quality ${i + 1}`, url: l, type: "mp4" });
    });

    const titleMatch = html.match(/<p class="m-2"[^>]*>([\s\S]*?)<\/p>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim().slice(0, 120) : "Twitter Video";

    const thumbMatch = html.match(/poster="([^"]+)"/);
    const thumbnail = thumbMatch ? thumbMatch[1] : "";

    return { title, thumbnail, duration: "-", platform: "twitter", formats };
}

/* ── main GET handler ──────────────────────────────── */

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const url = searchParams.get("url");
        const platform = searchParams.get("platform");

        if (!url) {
            return NextResponse.json({ error: "Missing url parameter" }, { status: 400, headers: CORS });
        }
        if (!platform) {
            return NextResponse.json({ error: "Missing platform parameter" }, { status: 400, headers: CORS });
        }

        let result: DownloadResult;

        switch (platform) {
            case "youtube": {
                let title = "YouTube Video";
                let thumbnail = "";
                let duration = "-";
                let artist = "";
                let release_date = "";

                // 1. Try NexRay v1 API (New Primary)
                try {
                    const nexUrl = `https://api.nexray.web.id/downloader/v1/ytmp4?url=${encodeURIComponent(url)}&resolusi=1080`;
                    const res = await fetch(nexUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
                    
                    if (res.ok) {
                        const data = await res.json();
                        if (data.status && data.result) {
                            const r = data.result;
                            title = r.title || title;
                            thumbnail = r.thumbnail || thumbnail;
                            artist = r.author || artist;
                            
                            if (r.duration) {
                                const sec = Number(r.duration);
                                const m = Math.floor(sec / 60);
                                const s = sec % 60;
                                duration = `${m}:${s.toString().padStart(2, "0")}`;
                            }
                        }
                    }
                } catch (e) {
                    console.warn("[YouTube] NexRay v1 metadata failed:", e);
                }

                // 2. Fallback to NexRay if title is still default (Slow but reliable?)
                if (title === "YouTube Video") {
                    try {
                        // Use 360p to fetch metadata
                        const nexUrl = `https://api.nexray.web.id/downloader/ytmp4?url=${encodeURIComponent(url)}&resolusi=360`;
                        const res = await fetch(nexUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
                        if (res.ok) {
                            const data = await res.json();
                            if (data.status && data.result) {
                                const r = data.result;
                                title = r.title || title;
                                thumbnail = r.thumbnail || thumbnail;
                                if (r.duration) {
                                    const sec = Number(r.duration);
                                    const m = Math.floor(sec / 60);
                                    const s = sec % 60;
                                    duration = `${m}:${s.toString().padStart(2, "0")}`;
                                }
                            }
                        }
                    } catch (e) {
                        console.error("[YouTube] NexRay metadata failed:", e);
                    }
                }

                const formats: Format[] = [];
                const origin = req.nextUrl.origin;

                // Add resolution options using resolve-youtube API
                // We list all potential resolutions. NexRay will handle availability (or fail).
                const resolutions = ["2160", "1440", "1080", "720", "480", "360", "240", "144"];
                
                for (const res of resolutions) {
                    formats.push({
                        quality: `${res}p`,
                        url: `${origin}/api/resolve-youtube?url=${encodeURIComponent(url)}&resolusi=${res}`,
                        type: "mp4",
                    });
                }

                // Add virtual MP3 format (Lazy Loading)
                formats.push({
                    quality: "Audio (MP3)",
                    url: `${origin}/api/resolve-audio?url=${encodeURIComponent(url)}`,
                    type: "mp3",
                });

                result = {
                    title,
                    thumbnail,
                    duration,
                    platform: "youtube",
                    formats: dedup(formats),
                    artist,
                    release_date,
                };
                break;
            }
            case "tiktok":
            case "douyin": {
                // 1. Try TikWM (Official Public API)
                try {
                    const tikRes = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`, {
                        headers: { "User-Agent": "Mozilla/5.0" },
                    });
                    if (tikRes.ok) {
                        const tikData = await tikRes.json();
                        if (tikData.code === 0 && tikData.data) {
                            const d = tikData.data;
                            const formats: Format[] = [];
                            
                            if (d.play) formats.push({ quality: "No Watermark", url: d.play, type: "mp4" });
                            if (d.wmplay) formats.push({ quality: "Watermark", url: d.wmplay, type: "mp4" });
                            if (d.hdplay) formats.push({ quality: "HD", url: d.hdplay, type: "mp4" });
                            if (d.music) formats.push({ quality: "Audio", url: d.music, type: "mp3" });
                            
                            // Images (slideshow)
                            if (d.images && Array.isArray(d.images)) {
                                d.images.forEach((img: string, i: number) => {
                                    formats.push({ quality: `Image ${i + 1}`, url: img, type: "jpg" });
                                });
                            }

                            result = {
                                title: d.title || "TikTok Video",
                                thumbnail: proxyThumb(pickTikTokThumb(d, tikData)),
                                duration: d.duration ? `${d.duration}s` : "-",
                                platform: "tiktok",
                                formats: dedup(formats),
                                artist: d.author?.nickname ? `@${d.author.nickname}` : undefined,
                            };
                            break; // Success, exit switch
                        }
                    }
                } catch (e) {
                    console.warn("[TikTok] TikWM failed:", e);
                }

                // 2. Try NexRay
                try {
                    const nexRes = await fetch(`https://api.nexray.web.id/downloader/tiktok?url=${encodeURIComponent(url)}`, {
                        headers: { "User-Agent": "Mozilla/5.0" },
                    });
                    if (nexRes.ok) {
                        const nexData = await nexRes.json();
                        if (nexData.status && nexData.result) {
                            result = normaliseTikTok(nexData);
                            break;
                        }
                    }
                } catch (e) {
                    console.warn("[TikTok] NexRay failed:", e);
                }

                // 3. Try Original Proxy (Last Resort)
                try {
                    const data = await fetchProxy(`/download/tiktok?url=${encodeURIComponent(url)}`);
                    result = normaliseTikTok(data);
                    if (platform === "douyin") result.platform = "douyin";
                } catch (e) {
                     console.error("[TikTok] All APIs failed:", e);
                     throw new Error("Gagal mengambil data TikTok dari semua sumber");
                }
                break;
            }
            case "instagram": {
                const igRes = await fetch(
                    "https://api.nexray.web.id/downloader/v2/instagram?url=" +
                    encodeURIComponent(url),
                    { headers: { "User-Agent": "Mozilla/5.0" } }
                );
                if (!igRes.ok) throw new Error("Instagram API " + igRes.status);
                const igData = await igRes.json();
                const igResult = igData?.result || {};
                const igMedia = Array.isArray(igResult.media)
                    ? igResult.media
                    : [];
                const igFormats: Format[] = igMedia.map(
                    (m: { type?: string; url?: string }, i: number) => ({
                        quality:
                            m.type === "mp4"
                                ? "Video (MP4)"
                                : m.type === "jpg"
                                    ? "Photo (JPG)"
                                    : "Media " + (i + 1),
                        url: m.url || "",
                        type: m.type || "mp4",
                    })
                );
                if (igFormats.length === 0)
                    throw new Error("Tidak ada media ditemukan");
                const igTitle =
                    igResult.title ||
                    (igResult.username
                        ? "@" + igResult.username
                        : "Instagram Post");
                result = {
                    title:
                        igTitle.length > 80
                            ? igTitle.substring(0, 80) + "..."
                            : igTitle,
                    thumbnail: igResult.thumbnail || "",
                    duration: "-",
                    platform: "instagram",
                    formats: dedup(igFormats),
                    artist: igResult.username
                        ? "@" + igResult.username
                        : undefined,
                };
                break;
            }
            case "facebook": {
                const fbRes = await fetch(
                    "https://api.vreden.my.id/api/v1/download/facebook?url=" +
                    encodeURIComponent(url),
                    { headers: { "User-Agent": "Mozilla/5.0" } }
                );
                if (!fbRes.ok) throw new Error("Facebook API " + fbRes.status);
                const fbData = await fbRes.json();
                if (!fbData.status || !fbData.result)
                    throw new Error("Gagal mengambil data Facebook");

                const fb = fbData.result;
                const fbFormats: Format[] = [];

                if (fb.download?.hd) {
                    fbFormats.push({
                        quality: "Video HD (720p)",
                        url: fb.download.hd,
                        type: "mp4",
                    });
                }
                if (fb.download?.sd) {
                    fbFormats.push({
                        quality: "Video SD (360p)",
                        url: fb.download.sd,
                        type: "mp4",
                    });
                }

                if (fbFormats.length === 0)
                    throw new Error("Tidak ada format tersedia");

                result = {
                    title: fb.title || "Facebook Video",
                    thumbnail: fb.thumbnail || "",
                    duration: fb.durasi || "-",
                    platform: "facebook",
                    formats: dedup(fbFormats),
                };
                break;
            }
            case "twitter": {
                result = await fetchTwitter(url);
                break;
            }
            case "capcut": {
                const data = await fetchProxy(`/download/capcut?url=${encodeURIComponent(url)}`);
                result = normaliseCapCut(data);
                break;
            }
            case "spotify": {
                const res = await fetch(
                    `https://api.nexray.web.id/downloader/v1/spotify?url=${encodeURIComponent(
                        url
                    )}`,
                    { headers: { "User-Agent": "Mozilla/5.0" } }
                );
                if (!res.ok) throw new Error(`Spotify API ${res.status}`);
                const data = await res.json();
                result = normaliseSpotify(data);
                break;
            }
            case "pinterest": {
                const pinData = await getPinData(url);
                result = normalisePinterest(pinData);
                break;
            }
            case "bilibili": {
                const biliRes = await fetch(
                    "https://api.nexray.web.id/downloader/bilibili?url=" +
                    encodeURIComponent(url),
                    { headers: { "User-Agent": "Mozilla/5.0" } }
                );
                if (!biliRes.ok) throw new Error("Bilibili API " + biliRes.status);
                const biliData = await biliRes.json();
                if (!biliData.status || !biliData.result)
                    throw new Error("Gagal mengambil data Bilibili");

                const br = biliData.result;
                const biliFormats: Format[] = [];

                // Deduplicate video by quality (API sometimes returns duplicates)
                const seenQ = new Set<string>();
                if (Array.isArray(br.media)) {
                    for (const m of br.media) {
                        const q = m.quality || "Video";
                        if (seenQ.has(q)) continue;
                        seenQ.add(q);
                        biliFormats.push({
                            quality: `Video ${q}` + (m.size ? ` (${m.size})` : ""),
                            url: m.url || "",
                            type: "mp4",
                        });
                    }
                }

                // Audio
                if (Array.isArray(br.audio)) {
                    br.audio.forEach((a: any, idx: number) => {
                        biliFormats.push({
                            quality: `Audio ${idx + 1}` + (a.size ? ` (${a.size})` : ""),
                            url: a.url || "",
                            type: "mp3",
                        });
                    });
                }

                if (biliFormats.length === 0)
                    throw new Error("Tidak ada format tersedia");

                result = {
                    title: br.title || "Bilibili Video",
                    thumbnail: br.thumbnail || "",
                    duration: "-",
                    platform: "bilibili",
                    formats: dedup(biliFormats),
                };
                break;
            }
            case "snackvideo": {
                const svRes = await fetch(
                    "https://api.nexray.web.id/downloader/snackvideo?url=" +
                    encodeURIComponent(url),
                    { headers: { "User-Agent": "Mozilla/5.0" } }
                );
                if (!svRes.ok) throw new Error("SnackVideo API " + svRes.status);
                const svData = await svRes.json();
                if (!svData.status || !svData.result)
                    throw new Error("Gagal mengambil data SnackVideo");

                const sv = svData.result;
                const svFormats: Format[] = [];

                if (sv.download_url) {
                    svFormats.push({
                        quality: "Video",
                        url: sv.download_url,
                        type: "mp4",
                    });
                }

                if (svFormats.length === 0)
                    throw new Error("Tidak ada format tersedia");

                // Parse duration from "183 seconds" format
                let svDur = "-";
                if (sv.duration) {
                    const secs = parseInt(sv.duration);
                    if (!isNaN(secs)) {
                        const m = Math.floor(secs / 60);
                        const s = secs % 60;
                        svDur = `${m}:${String(s).padStart(2, "0")}`;
                    }
                }

                result = {
                    title: sv.title || "SnackVideo",
                    thumbnail: sv.thumbnail || "",
                    duration: svDur,
                    platform: "snackvideo",
                    formats: dedup(svFormats),
                };
                break;
            }
            case "terabox": {
                const tbRes = await fetch(
                    "https://api.nexray.web.id/downloader/terabox?url=" +
                    encodeURIComponent(url),
                    { headers: { "User-Agent": "Mozilla/5.0" } }
                );
                if (!tbRes.ok) throw new Error("Terabox API " + tbRes.status);
                const tbData = await tbRes.json();
                if (!tbData.status || !tbData.result)
                    throw new Error("Gagal mengambil data Terabox");

                const tb = tbData.result;
                const tbFormats: Format[] = [];
                let tbThumb = "";

                // Add each file as a format entry
                if (tb.files && Array.isArray(tb.files)) {
                    for (const file of tb.files) {
                        if (!file.download_url && !file.fast_download_url) continue;

                        // Use first file's thumbnail as main thumbnail
                        if (!tbThumb && file.thumbnail) tbThumb = file.thumbnail;

                        const label = file.name || "File";
                        const quality = file.quality || "";
                        const size = file.size || "";
                        const info = [quality, size].filter(Boolean).join(" · ");

                        tbFormats.push({
                            quality: info ? `${label} (${info})` : label,
                            url: file.fast_download_url || file.download_url,
                            type: "mp4",
                        });
                    }
                }

                // Add zip download if available and multiple files
                if (tb.zip_download_url && tb.total_files > 1) {
                    tbFormats.push({
                        quality: `📦 Download All (${tb.total_files} files) ZIP`,
                        url: tb.zip_download_url,
                        type: "zip",
                    });
                }

                if (tbFormats.length === 0)
                    throw new Error("Tidak ada file tersedia");

                result = {
                    title: `Terabox — ${tb.total_files || 1} file${(tb.total_files || 1) > 1 ? "s" : ""}`,
                    thumbnail: tbThumb,
                    duration: "-",
                    platform: "terabox",
                    formats: dedup(tbFormats),
                };
                break;
            }
            case "scribd": {
                const scRes = await fetch(
                    "https://api.nexray.web.id/downloader/scribd?url=" +
                    encodeURIComponent(url),
                    { headers: { "User-Agent": "Mozilla/5.0" } }
                );
                if (!scRes.ok) throw new Error("Scribd API " + scRes.status);
                const scData = await scRes.json();
                if (!scData.status || !scData.result)
                    throw new Error("Gagal mengambil dokumen Scribd");

                const sc = scData.result;

                if (!sc.url) throw new Error("Download URL tidak tersedia");

                const scTitle = sc.title || "Scribd Document";
                const scInfo = [
                    sc.author ? `by ${sc.author}` : "",
                    sc.page_count ? `${sc.page_count} halaman` : "",
                ].filter(Boolean).join(" · ");

                result = {
                    title: scInfo ? `${scTitle} (${scInfo})` : scTitle,
                    thumbnail: sc.thumbnail || "",
                    duration: sc.page_count ? `${sc.page_count} hal` : "-",
                    platform: "scribd",
                    formats: [{
                        quality: `📄 Download PDF${sc.page_count ? ` (${sc.page_count} halaman)` : ""}`,
                        url: sc.url,
                        type: "pdf",
                    }],
                };
                break;
            }
            case "mediafire": {
                const mfRes = await fetch(
                    "https://api.nexray.web.id/downloader/mediafire?url=" +
                    encodeURIComponent(url),
                    { headers: { "User-Agent": "Mozilla/5.0" } }
                );
                if (!mfRes.ok) throw new Error("MediaFire API " + mfRes.status);
                const mfData = await mfRes.json();
                if (!mfData.status || !mfData.result)
                    throw new Error("Gagal mengambil data MediaFire");

                const mf = mfData.result;
                if (!mf.download_url)
                    throw new Error("Download URL tidak tersedia");

                // Extract real filename from download URL if API returns "unknown_file"
                let mfName = mf.filename || "File";
                if (mfName === "unknown_file" || !mfName.includes(".")) {
                    // Try to extract from download URL path
                    try {
                        const urlPath = decodeURIComponent(
                            new URL(mf.download_url).pathname.split("/").pop() || ""
                        );
                        if (urlPath && urlPath.includes(".")) mfName = urlPath;
                    } catch { /* keep original */ }
                }

                const mfSize = mf.filesize && mf.filesize !== "unknown" ? mf.filesize : "";

                // Detect extension: from filename first, then mimetype
                const mimeToExt: Record<string, string> = {
                    "application/zip": "zip",
                    "application/x-rar-compressed": "rar",
                    "application/pdf": "pdf",
                    "application/x-7z-compressed": "7z",
                    "video/mp4": "mp4",
                    "audio/mpeg": "mp3",
                    "image/jpeg": "jpg",
                    "image/png": "png",
                };
                const mfExt = mfName.includes(".")
                    ? (mfName.split(".").pop() || "file")
                    : (mimeToExt[mf.mimetype] || "file");

                result = {
                    title: mfName,
                    thumbnail: "",
                    duration: mfSize || "-",
                    platform: "mediafire",
                    formats: [{
                        quality: `📥 Download${mfSize ? ` (${mfSize})` : ""}`,
                        url: mf.download_url,
                        type: mfExt,
                    }],
                };
                break;
            }
            // ─── APPLE MUSIC ───
            // ─── APPLE MUSIC ───
            case "applemusic": {
                // 1. Try Vreden API (Primary - usually more stable)
                try {
                    const vredenUrl = `https://api.vreden.my.id/api/v1/download/applemusic?url=${encodeURIComponent(url)}`;
                    const vRes = await fetch(vredenUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
                    
                    if (vRes.ok) {
                        const vData = await vRes.json();
                        // Adjust parsing based on Vreden's response structure
                        const r = vData.result;
                        if (r) {
                            result = {
                                title: r.title || "Apple Music Track",
                                thumbnail: r.cover || r.thumbnail || "",
                                duration: "-",
                                platform: "applemusic",
                                artist: r.artist,
                                formats: [{
                                    quality: "🎵 High Quality",
                                    url: r.download || r.music || r.url,
                                    type: "mp3",
                                }],
                            };
                            break; // Success, exit switch
                        }
                    }
                } catch (e) {
                    console.warn("[Apple Music] Vreden failed:", e);
                }

                // 2. Try Apocalypse (Fallback)
                try {
                    const apiUrl = `https://api.apocalypse.web.id/download/applemusic?url=${url}`;
                    const apiRes = await fetch(apiUrl, {
                        headers: { "User-Agent": "Mozilla/5.0" },
                    });

                    if (apiRes.ok) {
                        const data = await apiRes.json();
                        if (data.status && data.result) {
                            const metadata = data.result.metadata;
                            const download = data.result.download;

                            result = {
                                title: `${metadata.artist} - ${metadata.title}`,
                                thumbnail: metadata.thumbnail || "",
                                duration: metadata.duration || "-",
                                platform: "applemusic",
                                formats: [{
                                    quality: `🎵 ${metadata.quality || "High Quality"}`,
                                    url: download.url,
                                    type: download.format || "AAC",
                                }],
                            };
                            break; // Success
                        }
                    }
                } catch (e) {
                    console.warn("[Apple Music] Apocalypse failed:", e);
                }

                throw new Error("Gagal mengambil data Apple Music dari semua sumber");
            }
            // ─── SOUNDCLOUD ───
            case "soundcloud": {
                const scUrl = `https://api.ferdev.my.id/downloader/soundcloud?link=${encodeURIComponent(url)}&apikey=fdv_ZlC8qRyJLrcGcjcedw1eZg`;
                const scRes = await fetch(scUrl, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                });

                if (!scRes.ok) throw new Error("Gagal mengambil data dari SoundCloud API");
                const scData = await scRes.json();
                if (!scData.success || !scData.result) throw new Error("Gagal mendapatkan link download SoundCloud");

                const res = scData.result;

                result = {
                    title: res.title || "SoundCloud Track",
                    thumbnail: res.thumbnail || "",
                    duration: "-",
                    platform: "soundcloud",
                    artist: res.author || "Unknown Artist",
                    formats: [{
                        quality: "🎵 Audio (MP3)",
                        url: res.downloadUrl,
                        type: "mp3",
                    }],
                };
                break;
            }

            default:
                return NextResponse.json({ error: "Platform tidak didukung" }, { status: 400, headers: CORS });
        }

        // Remove formats with empty URLs
        result.formats = result.formats.filter((f) => !!f.url);

        // Proxy all thumbnails through our image proxy
        if (result.thumbnail) {
            result.thumbnail = proxyThumb(result.thumbnail);
        }

        // Wrap all format URLs through proxy-download for auto-download
        // Use relative URL to avoid HTTP/HTTPS mismatch behind proxy
        const safeTitle = (result.title || "download")
            .replace(/[^a-zA-Z0-9\u00C0-\u024F\u4E00-\u9FFF\s\.\-\(\)]/g, "")
            .trim()
            .slice(0, 100);

        result.formats = result.formats.map((f) => {
            const ext = f.type || "mp4";
            const filename = `${safeTitle}.${ext}`;
            // Obfuscate the actual download URL
            const obfuscatedUrl = obfuscate(f.url);
            return {
                ...f,
                url: `/api/proxy-download?url=${encodeURIComponent(obfuscatedUrl)}&filename=${encodeURIComponent(filename)}&download=true`,
            };
        });

        // Log for debugging (visible in terminal)
        console.log(`[download] ${platform} → ${result.formats.length} formats, thumb=${!!result.thumbnail}`);

        return NextResponse.json(result, { headers: CORS });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json(
            { error: "Gagal mengambil data, coba lagi", detail: message },
            { status: 500, headers: CORS },
        );
    }
}
