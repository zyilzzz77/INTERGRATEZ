import axios from "axios";
import * as cheerio from "cheerio";

/* ── Config ────────────────────────────────────────── */

const CONFIG = {
    timeout: 15000,
    userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

const DEFAULT_COOKIE =
    '_auth=1; _pinterest_sess=TWc9PSZzN1VKRTV1cGczQ1ZMRStzVE4xZ2pCd1JzV3JGeUVrblBteVJRMnBZajVIWGpRMmdIOEJmRDhhc0JuSXNKaGU5YUJrTzZMOFdmMmhHSW81aEI5dWd6Vk8rQU43S0IxTVpiRFIraE11MElyRlQzeHFnQXRNNEhZRWNzOHlLeThkVVU0bFRWSC95d2gyb2pDOXR1SXA5TjBNWFpsVmczYUZRdDQreDV2Ukc3ZG5MSHliemlmTGtVTlQxdVVqLzNOYUFoNUlHWk5ReUt1UEpLZ0poSFE2SzgzZVB5R202UjAvRXJUbE1vUEhzWVIvMXhwQ0orSVQrMzJ0RVo0d1cxN2pUdExzVU55dU5JbzhzMVpweEs0bWZ6ZGFaUHpaMS9RdVVsRVNySVFGbVBpRmFJc2hLT3NYek16WXMzYkUvZSt4Z09LMW9NVHJCTmxweUdLcUxWU0ZNNElxOTFwYkRGK1E5WDRRR3RYeFdOa0grUDUwT2txS2xUaHhibk5FdHJxSi9kTzBDeHJyZXhkY3A5RzBXVElMVndML3cyZG16bzdzOGZIVDVRRjZITnZIbThjb1djR1pUeEg0Vk53V0w1TVZjQ3N1UnozQnF0TGVuNFV2OVlTN2lzQkppR1h1SVZtR25Lb2ozTlZRYkowSnMwMkdhZ0tsaytXbTVSS29VdVNiNzRaRmJEbTNOTEFDSGk2dFlVNkNOckJzblVIQWdHSW9kdzd0QWV0SFdSOSt5ZEI0THZ1U2ViNThZcGFobnNXdFc3U0I3Tjh1ZG5hL29wWlRCSjhjeTcxZEdUdk51Y3czbThjcjhpYldOa3krZysrWmp4WC9SMWNRbnZwSDNHeWRiQzIxZk5Bajc5VVRFYTdtL3FFaUhXRm12b2RWN2EydGFlbVltalFEQkMvYzk1Yk8wOXFxQjhYdFEvOSsyV3R2bkd6c0Y5eVNUclFKWTROajg5SnVVbWdyT0IwWWh3QlFXeGZFQURKTmRvNm9ZekdLdGQrZFJ4TWhRMEFaNFRQWnNpeFRwR2luYzhsM1FsUUczUE0vUEo5YXowbWk1Mno5RHZZUTdYOCtERlhTdEhnenRmQTdvQ1REbDJxSlNrMjZvanhPVnlDbnZycGk4ZVUxRC9yUmNnMm5Fc0F3eGl5L1V3OW5kREN3RFNLcEVhTXkvRnJDQ2ZMNnFEc3k4WjJqWHcxVk00TmVqNnNzTTM0RXBJQnVWaEFTcHBvK0VpekVpai8wRHBsbHBWYjBETFZOayttZnhRMytUY0gyOTkxOEZNTXJWb3g0bTJQbHJoUDlNZnNDZFN0QmtZZG4xVlkyaHpXTk5DajE1WVJ6WFFLY1ZrU2NPUHdZV1VBRGlOZEJic2pyaWxINndTbTRZcmR4cHdEL0hudDBUaElZZEx5emU0V3huWGQ0QW9NNVhoczY3VHZoQ2pDUjM0TENrRC9nbGRoSGN3RnY4ZUU3dnBTYUhFUWJCL0dUTWhVN2pobTVONkN6alpDN2liN0FFelgvZjNxWXlwRmxXNUJtVUYzLy9LaGVwVmZ0TzhMWmFuMk5zUlhQazlDbjRhcUpTVXBnSVRGVnVZZnVwWkhmUnU0YzJiT2U2VVBKSm4zWFNkUzZWQ2FoWTVSb0J0WHczN1dXMFoxUHN2Y2l1K1ZDWEQ1aElic0Z1cEwybkNibWZvdk0vakNFRGJHaUNQUFRHZEJac0xsc3lacjJnVVRIZGFVSXF0bVBwaEZCbEJvODhzeTdtdE92Ly9jY1VFNnR1UGY1YTRIdEhHMERLQVQ3Q1hmZHAmZkVNZDQ5bmNBbGk2YW5uSkQ1bDYvSkE3WWVFPQ==; _b="AY/QYeBYT05JO4DuinNfKY/vtdPx4HIzqArBwrO1rHKKQl3k4hSQZa8jHO92YUn4dN4="; _ir=0';

/* ── Types ─────────────────────────────────────────── */

/** Pinner info from NexRay API */
export interface PinterestPinner {
    username: string;
    full_name: string;
    follower_count: number;
    image_small_url: string;
}

/** Board info from NexRay API */
export interface PinterestBoard {
    id: string;
    name: string;
    url: string;
    pin_count: number;
}

/** Single pin from NexRay API (excluding "link" which contains ads) */
export interface PinterestPin {
    pin: string;
    created_at: string;
    id: string;
    images_url: string;
    grid_title: string;
    description: string;
    type: string;
    pinner: PinterestPinner;
    board: PinterestBoard;
    reaction_counts: Record<string, number>;
    dominant_color: string;
    seo_alt_text: string;
}

/** Search result wrapper */
export interface PinterestSearchResult {
    success: boolean;
    keyword: string;
    count: number;
    pins: PinterestPin[];
    error?: string;
}

/* ── Types for download (kept for backward compatibility) ── */

export interface PinterestMedia {
    type: "video" | "image";
    format: string;
    url: string;
    quality?: string;
}

export interface PinterestDownloadResult {
    success: boolean;
    title: string;
    description?: string;
    url: string;
    results: PinterestMedia[];
    error?: string;
}

/* ── Helpers ───────────────────────────────────────── */

function upgradeImageQuality(url: string): string {
    if (!url) return url;
    if (url.match(/\/\d+x\//)) {
        return url.replace(/\/\d+x\//, "/originals/");
    }
    return url;
}

/* ── Search (NexRay REST API) ─────────────────────── */

export async function searchPinterest(
    keyword: string,
): Promise<PinterestSearchResult> {
    if (!keyword || keyword.trim().length === 0) {
        return { success: false, keyword, count: 0, pins: [], error: "Empty keyword" };
    }

    try {
        const apiUrl = `https://api.nexray.web.id/search/pinterest?q=${encodeURIComponent(keyword.trim())}`;

        const response = await axios.get(apiUrl, {
            timeout: CONFIG.timeout,
            headers: {
                "User-Agent": CONFIG.userAgent,
                Accept: "application/json",
            },
        });

        const data = response.data;

        if (!data?.status || !Array.isArray(data.result)) {
            return {
                success: false,
                keyword,
                count: 0,
                pins: [],
                error: "Invalid API response",
            };
        }

        // Map results, excluding "link" field (contains ads)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pins: PinterestPin[] = data.result.map((item: any) => ({
            pin: item.pin || "",
            created_at: item.created_at || "",
            id: item.id || "",
            images_url: item.images_url || "",
            grid_title: item.grid_title || "",
            description: item.description || "",
            type: item.type || "image",
            pinner: {
                username: item.pinner?.username || "",
                full_name: item.pinner?.full_name || "",
                follower_count: item.pinner?.follower_count || 0,
                image_small_url: item.pinner?.image_small_url || "",
            },
            board: {
                id: item.board?.id || "",
                name: item.board?.name || "",
                url: item.board?.url || "",
                pin_count: item.board?.pin_count || 0,
            },
            reaction_counts: item.reaction_counts || {},
            dominant_color: item.dominant_color || "",
            seo_alt_text: item.seo_alt_text || "",
        }));

        return {
            success: true,
            keyword,
            count: pins.length,
            pins,
        };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[pinterest] NexRay API error: ${msg}`);
        return {
            success: false,
            keyword,
            count: 0,
            pins: [],
            error: `API request failed: ${msg}`,
        };
    }
}

/* ── Download (single pin) ─────────────────────────── */

export async function getPinData(url: string): Promise<PinterestDownloadResult> {
    try {
        return await getPinDirectly(url);
    } catch {
        try {
            return await getPinViaSavePin(url);
        } catch (e2) {
            const msg = e2 instanceof Error ? e2.message : String(e2);
            return { success: false, title: "Pinterest Pin", url, results: [], error: msg };
        }
    }
}

/** Method 1: Direct OG-meta scraping */
async function getPinDirectly(url: string): Promise<PinterestDownloadResult> {
    const response = await axios.get(url, {
        headers: {
            "User-Agent": CONFIG.userAgent,
            Cookie: DEFAULT_COOKIE,
            Referer: "https://www.pinterest.com/",
        },
        timeout: CONFIG.timeout,
    });

    const $ = cheerio.load(response.data);
    const ogVideo = $('meta[property="og:video"]').attr("content");
    const ogImage = $('meta[property="og:image"]').attr("content");
    const ogTitle = $('meta[property="og:title"]').attr("content") || $("title").text();
    const ogDesc = $('meta[property="og:description"]').attr("content");

    const results: PinterestMedia[] = [];

    if (ogVideo) {
        results.push({ type: "video", format: "MP4", url: ogVideo });
    }
    if (ogImage) {
        results.push({ type: "image", format: "JPG", url: upgradeImageQuality(ogImage) });
    }
    if (results.length === 0) {
        const videoSrc = $("video").attr("src");
        if (videoSrc) results.push({ type: "video", format: "MP4", url: videoSrc });
    }

    if (results.length === 0) throw new Error("No media found");

    return {
        success: true,
        title: ogTitle || "Pinterest Pin",
        description: ogDesc || "",
        url,
        results,
    };
}

/** Method 2: Fallback via savepin.app */
async function getPinViaSavePin(url: string): Promise<PinterestDownloadResult> {
    const response = await axios.get(
        `https://www.savepin.app/download.php?url=${encodeURIComponent(url)}&lang=en&type=redirect`,
        { timeout: CONFIG.timeout, headers: { "User-Agent": CONFIG.userAgent } },
    );

    const $ = cheerio.load(response.data);
    const results: PinterestMedia[] = [];

    $("td.video-quality").each((_i, el) => {
        const typeLabel = $(el).text().trim().toLowerCase();
        const link = $(el).nextAll().find("a").attr("href");
        if (!link) return;

        let finalLink = link;
        if (link.includes("force-save.php?url=")) {
            finalLink = decodeURIComponent(link.split("force-save.php?url=")[1]);
        }
        results.push({ type: "video", format: "MP4", quality: typeLabel, url: finalLink });
    });

    if (results.length === 0) {
        $("a[download], .download-link").each((_i, el) => {
            const href = $(el).attr("href");
            if (href && !href.startsWith("#")) {
                results.push({
                    type: href.includes(".mp4") ? "video" : "image",
                    format: href.includes(".mp4") ? "MP4" : "JPG",
                    url: href,
                });
            }
        });
    }

    if (results.length === 0) throw new Error("No download links found");

    return {
        success: true,
        title: $("h1").text().trim() || "Pinterest Pin",
        url,
        results,
    };
}
