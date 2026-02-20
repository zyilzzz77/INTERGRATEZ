export interface PlatformInfo {
    name: string;
    label: string;
    color: string;
    icon: string;
    localIconSvg?: string;
}

interface PlatformDef extends PlatformInfo {
    patterns: RegExp[];
}

const PLATFORMS: PlatformDef[] = [
    {
        name: "youtube",
        label: "YouTube",
        color: "#ffffffff",
        icon: "/logo-yt.webp",
        localIconSvg: "/icons/youtube.svg",
        patterns: [
            /(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtube\.com\/watch\?.*v=/i,
            /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/shorts\//i,
            /(?:https?:\/\/)?youtu\.be\//i,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\//i,
        ],
    },
    {
        name: "tiktok",
        label: "TikTok",
        color: "#ffffffff",
        icon: "/logo-tiktok.webp",
        localIconSvg: "/icons/tiktok.svg",
        patterns: [
            /(?:https?:\/\/)?(?:www\.|m\.|vm\.|vt\.)?tiktok\.com\//i,
        ],
    },
    {
        name: "instagram",
        label: "Instagram",
        color: "#E1306C",
        icon: "📷",
        localIconSvg: "/icons/instagram.svg",
        patterns: [
            /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv|stories)\//i,
            /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[^\/]+\/?$/i, // Profile
        ],
    },
    {
        name: "facebook",
        label: "Facebook",
        color: "#1877F2",
        icon: "f",
        localIconSvg: "/icons/facebook.svg",
        patterns: [
            /(?:https?:\/\/)?(?:www\.|web\.|m\.|touch\.)?facebook\.com\/.+/i,
            /(?:https?:\/\/)?fb\.watch\//i,
        ],
    },
    {
        name: "twitter",
        label: "Twitter / X",
        color: "#1DA1F2",
        icon: "𝕏",
        localIconSvg: "/icons/x.svg",
        patterns: [
            /(?:https?:\/\/)?(?:www\.|mobile\.)?(?:twitter|x)\.com\/.+\/status\//i,
        ],
    },
    {
        name: "capcut",
        label: "CapCut",
        color: "#00E5FF",
        icon: "/logo-capcut.webp",
        patterns: [/(?:https?:\/\/)?(?:www\.)?capcut\.com\//i],
    },
    {
        name: "spotify",
        label: "Spotify",
        color: "#1DB954",
        icon: "🎵",
        localIconSvg: "/icons/spotify.svg",
        patterns: [
            /(?:https?:\/\/)?open\.spotify\.com\/(track|album|playlist)\//i,
        ],
    },
    {
        name: "pinterest",
        label: "Pinterest",
        color: "#E60023",
        icon: "📌",
        localIconSvg: "/icons/pinterest.svg",
        patterns: [
            /(?:https?:\/\/)?(?:www\.)?pinterest\.com\/pin\//i,
            /(?:https?:\/\/)?(?:\w+\.)?pinterest\.com\/pin\//i,
            /(?:https?:\/\/)?pin\.it\//i,
        ],
    },
    {
        name: "douyin",
        label: "Douyin",
        color: "#FE2C55",
        icon: "抖",
        patterns: [
            /(?:https?:\/\/)?(?:www\.)?douyin\.com\//i,
            /(?:https?:\/\/)?v\.douyin\.com\//i,
        ],
    },
    {
        name: "bilibili",
        label: "Bilibili",
        color: "#00A1D6",
        icon: "📺",
        localIconSvg: "/icons/bilibili.svg",
        patterns: [
            /(?:https?:\/\/)?(?:www\.)?bilibili\.tv\//i,
            /(?:https?:\/\/)?(?:www\.)?bilibili\.com\/video\//i,
        ],
    },
    {
        name: "snackvideo",
        label: "SnackVideo",
        color: "#FFFC00",
        icon: "🍿",
        patterns: [
            /(?:https?:\/\/)?(?:www\.)?snackvideo\.com\//i,
            /(?:https?:\/\/)?sck\.io\//i,
        ],
    },
    {
        name: "terabox",
        label: "Terabox",
        color: "#2B7CE9",
        icon: "/logo-terabox.webp",
        patterns: [
            /(?:https?:\/\/)?(?:www\.)?terabox\.com\//i,
            /(?:https?:\/\/)?(?:www\.)?1024terabox\.com\//i,
            /(?:https?:\/\/)?(?:www\.)?teraboxapp\.com\//i,
            /(?:https?:\/\/)?(?:www\.)?terafileshare\.com\//i,
        ],
    },
    {
        name: "scribd",
        label: "Scribd",
        color: "#1A7BBA",
        icon: "📄",
        patterns: [
            /(?:https?:\/\/)?(?:www\.)?scribd\.com\/document\//i,
            /(?:https?:\/\/)?(?:www\.)?scribd\.com\/doc\//i,
        ],
    },
    {
        name: "mediafire",
        label: "MediaFire",
        color: "#326CE5",
        icon: "🔥",
        localIconSvg: "/icons/mediafire.svg",
        patterns: [
            /(?:https?:\/\/)?(?:www\.)?mediafire\.com\/file\//i,
            /(?:https?:\/\/)?(?:www\.)?mediafire\.com\/download\//i,
        ],
    },
    {
        name: "applemusic",
        label: "Apple Music",
        color: "#FA243C",
        icon: "🎵",
        localIconSvg: "/icons/applemusic.svg",
        patterns: [
            /(?:https?:\/\/)?music\.apple\.com\/.+/i,
        ],
    },
    {
        name: "soundcloud",
        label: "SoundCloud",
        color: "#FF5500",
        icon: "☁️",
        localIconSvg: "/icons/soundcloud.svg",
        patterns: [
            /(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/.+/i,
            /(?:https?:\/\/)?on\.soundcloud\.com\/.+/i,
        ],
    },
];

// detectPlatform
export function detectPlatform(url: string): PlatformInfo | null {
    if (!url || typeof url !== "string") return null;
    const trimmed = url.trim();
    for (const p of PLATFORMS) {
        for (const re of p.patterns) {
            if (re.test(trimmed)) {
                return {
                    name: p.name,
                    label: p.label,
                    color: p.color,
                    icon: p.icon,
                    localIconSvg: p.localIconSvg,
                };
            }
        }
    }
    return null;
}

export function getAllPlatforms(): PlatformInfo[] {
    return PLATFORMS.map(({ name, label, color, icon, localIconSvg }) => ({
        name,
        label,
        color,
        icon,
        localIconSvg,
    }));
}
