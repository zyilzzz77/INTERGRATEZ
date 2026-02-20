"use client";

export interface PlatformBadgeProps {
    platform: string;
    color?: string;
}

const platformColors: Record<string, string> = {
    youtube: "#FF0000",
    tiktok: "#010101",
    instagram: "#E1306C",
    facebook: "#1877F2",
    twitter: "#1DA1F2",
    capcut: "#00E5FF",
    spotify: "#1DB954",
    pinterest: "#E60023",
    douyin: "#FE2C55",
};

export default function PlatformDetector({ platform, color }: PlatformBadgeProps) {
    const bg = color || platformColors[platform] || "#6b7280";
    return (
        <span
            className="badge"
            style={{ backgroundColor: bg }}
        >
            {platform}
        </span>
    );
}
