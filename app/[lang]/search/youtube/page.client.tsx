"use client";

import { useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Clipboard } from "lucide-react";
import { showToast } from "@/components/Toast";

interface YTResult {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    channel: string;
    publishedAt: string;
    url: string;
    views: string;
    duration: string;
}

interface PlaylistItem {
    title: string;
    url: string;
}

export default function YouTubeSearchClient({ dict, lang }: { dict: any; lang: string }) {
    const router = useRouter();
    const [results, setResults] = useState<YTResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [currentQuery, setCurrentQuery] = useState("");
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Playlist states
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [playlistUrl, setPlaylistUrl] = useState("");
    const [playlistLoading, setPlaylistLoading] = useState(false);
    const [playlistResults, setPlaylistResults] = useState<PlaylistItem[]>([]);
    const [playlistError, setPlaylistError] = useState("");
    const [showPlaylistResults, setShowPlaylistResults] = useState(false);

    async function handleSearch(q: string) {
        if (!q.trim()) return;
        setLoading(true);
        setHasSearched(true);
        setResults([]);
        setShowPlaylistResults(false);
        setCurrentQuery(q);

        try {
            showToast("Mencari video...", "info");
            const res = await fetch(
                `/api/search/youtube?q=${encodeURIComponent(q)}`
            );
            const data = await res.json();
            if (data.items) {
                setResults(data.items);
                showToast("Pencarian selesai", "success");
            } else {
                showToast("Video tidak ditemukan", "info");
            }
        } catch {
            showToast("Gagal melakukan pencarian", "error");
        } finally {
            setLoading(false);
        }
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        handleSearch(query.trim());
    }

    const handlePaste = async () => {
        try {
            showToast(dict.toastClipboardPerm, "info");
            const text = await navigator.clipboard.readText();
            if (text) {
                setQuery(text);
            } else {
                showToast(dict.toastClipboardEmpty, "error");
            }
        } catch {
            inputRef.current?.focus();
            showToast(dict.toastClipboardDenied, "error");
        }
    };

    const handleDownload = (e: React.MouseEvent, url: string) => {
        e.stopPropagation();
        router.push(`/${lang}/?url=${encodeURIComponent(url)}&auto=true`);
    };

    const handleWatch = (e: React.MouseEvent, url: string) => {
        e.stopPropagation();
        router.push(`/${lang}/search/youtube/watch?url=${encodeURIComponent(url)}&q=${encodeURIComponent(currentQuery)}`);
    };

    const handlePlaylistSubmit = async () => {
        const url = playlistUrl.trim();
        if (!url) return;

        setPlaylistLoading(true);
        setPlaylistError("");
        setPlaylistResults([]);

        try {
            showToast("Mencari playlist...", "info");
            const res = await fetch(
                `/api/search/youtube-playlist?url=${encodeURIComponent(url)}`
            );
            const data = await res.json();
            if (data.error) {
                setPlaylistError(data.error);
                showToast(data.error, "error");
            } else if (data.data && Array.isArray(data.data)) {
                setPlaylistResults(data.data);
                setShowPlaylistResults(true);
                setShowPlaylistModal(false);
                setHasSearched(false);
                setResults([]);
                showToast("Playlist ditemukan", "success");
            } else {
                setPlaylistError(dict.playlistErrorNoData);
                showToast(dict.playlistErrorNoData, "error");
            }
        } catch {
            setPlaylistError(dict.playlistErrorFailed);
            showToast(dict.playlistErrorFailed, "error");
        } finally {
            setPlaylistLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-2xl text-white shadow-lg shadow-red-600/20">
                    ▶
                </div>
                <h1 className="text-3xl font-black text-white">
                    {dict.title.split(' ')[0]} <span className="text-white">{dict.title.split(' ')[1]}</span>
                </h1>
                <p className="mt-2 text-sm text-neutral-500">
                    {dict.subtitle}
                </p>
            </div>

            {/* Search Bar with two buttons */}
            <form onSubmit={handleSubmit} className="mx-auto w-full max-w-xl">
                <div className="flex overflow-hidden rounded-full border border-neutral-800 bg-neutral-900 shadow-md transition-shadow focus-within:border-neutral-700 focus-within:shadow-lg">
                    <button
                        type="button"
                        onClick={handlePaste}
                        className="flex items-center justify-center px-5 pl-6 text-neutral-500 hover:text-white transition-colors"
                        title="Paste from clipboard"
                    >
                        <Clipboard className="h-5 w-5" />
                    </button>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={dict.placeholder}
                        className="flex-1 bg-transparent px-2 py-4 text-sm text-white outline-none placeholder:text-neutral-500"
                        ref={inputRef}
                    />
                    <div className="m-1.5 mr-2 flex gap-1.5">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-neutral-200 disabled:opacity-50"
                        >
                            {loading ? (
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                                </svg>
                            ) : (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="7" />
                                    <path strokeLinecap="round" d="m16 16 4 4" />
                                </svg>
                            )}
                            {dict.searchBtn}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowPlaylistModal(true)}
                            className="flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-500"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10M4 18h10" />
                            </svg>
                            {dict.playlistBtn}
                        </button>
                    </div>
                </div>
            </form>

            {/* Playlist Modal */}
            {showPlaylistModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPlaylistModal(false)}>
                    <div
                        className="mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white">{dict.playlistModalTitle}</h2>
                            <button
                                onClick={() => setShowPlaylistModal(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="mb-4 text-sm text-neutral-500">
                            {dict.playlistModalDesc}
                        </p>
                        <input
                            type="text"
                            value={playlistUrl}
                            onChange={(e) => setPlaylistUrl(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handlePlaylistSubmit()}
                            placeholder={dict.playlistModalPlaceholder}
                            className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-red-500/50"
                            autoFocus
                        />
                        {playlistError && (
                            <p className="mb-3 text-sm text-red-400">{playlistError}</p>
                        )}
                        <button
                            onClick={handlePlaylistSubmit}
                            disabled={playlistLoading || !playlistUrl.trim()}
                            className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition-all hover:bg-red-500 disabled:opacity-50"
                        >
                            {playlistLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                                    </svg>
                                    {dict.playlistModalLoading}
                                </span>
                            ) : (
                                dict.playlistModalGetBtn
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Playlist Results */}
            {showPlaylistResults && playlistResults.length > 0 && (
                <div className="mt-10">
                    <div className="mb-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/20 text-lg">📋</div>
                            <div>
                                <h2 className="text-lg font-bold text-white">{dict.playlistResultTitle}</h2>
                                <p className="text-xs text-neutral-500">{playlistResults.length} {dict.playlistResultFound}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setShowPlaylistResults(false); setPlaylistResults([]); }}
                            className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            ✕ {dict.close}
                        </button>
                    </div>
                    <div className="space-y-2">
                        {playlistResults.map((item, i) => (
                            <div
                                key={i}
                                className="group flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-3 transition-all hover:border-red-500/20 hover:bg-white/[0.06]"
                            >
                                {/* Number */}
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-neutral-500">
                                    {i + 1}
                                </div>

                                {/* Title */}
                                <p className="flex-1 text-sm font-medium text-neutral-300 line-clamp-1 group-hover:text-white">
                                    {item.title}
                                </p>

                                {/* Actions */}
                                <div className="flex flex-shrink-0 gap-2">
                                    <button
                                        onClick={(e) => handleWatch(e, item.url)}
                                        className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:bg-red-500 hover:text-white"
                                        title="Watch"
                                    >
                                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                        <span className="hidden sm:inline">{dict.watch}</span>
                                    </button>
                                    <button
                                        onClick={(e) => handleDownload(e, item.url)}
                                        className="rounded-lg bg-red-500/10 p-1.5 text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                                        title="Download"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search Results */}
            <div className="mt-10">
                {loading && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-white/5 bg-white/5 p-2">
                                <div className="skeleton mb-2 aspect-video w-full rounded-lg" />
                                <div className="p-2">
                                    <div className="skeleton mb-2 h-4 w-3/4" />
                                    <div className="skeleton h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {results.map((r, i) => (
                            <div
                                key={i}
                                onClick={(e) => handleWatch(e, r.url)}
                                className="card-hover group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-white/5 bg-white/5 shadow-sm backdrop-blur-sm transition-all hover:border-red-500/30 hover:shadow-md"
                            >
                                {/* Thumbnail + Duration */}
                                <div className="relative aspect-video w-full overflow-hidden bg-neutral-800">
                                    <img
                                        src={r.thumbnail}
                                        alt={r.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onContextMenu={(e) => e.preventDefault()}
                                        draggable={false}
                                    />
                                    {/* Transparent Overlay for protection */}
                                    <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />

                                    {r.duration && (
                                        <span className="absolute bottom-1 right-1 z-20 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                            {r.duration}
                                        </span>
                                    )}
                                    {/* Play Overlay */}
                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex flex-1 flex-col p-3">
                                    <h3 className="line-clamp-2 text-sm font-bold leading-tight text-white group-hover:text-red-400">
                                        {r.title}
                                    </h3>

                                    <div className="mt-2 flex items-center gap-1.5">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-neutral-400">
                                            {r.channel.charAt(0).toUpperCase()}
                                        </div>
                                        <p className="line-clamp-1 text-xs font-medium text-neutral-400">
                                            {r.channel}
                                        </p>
                                    </div>

                                    <div className="mt-auto flex items-end justify-between pt-3">
                                        <div className="flex flex-col text-[10px] text-neutral-500">
                                            {r.views && <span>👁 {r.views} views</span>}
                                            {r.publishedAt && <span>📅 {r.publishedAt}</span>}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => handleWatch(e, r.url)}
                                                className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:bg-red-500 hover:text-white"
                                                title="Watch"
                                            >
                                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                                {dict.watch}
                                            </button>
                                            <button
                                                onClick={(e) => handleDownload(e, r.url)}
                                                className="rounded-lg bg-red-500/10 p-1.5 text-red-400 transition-colors hover:bg-red-500/20 group-hover:text-red-300"
                                                title="Download"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && hasSearched && results.length === 0 && (
                    <div className="mt-20 text-center">
                        <p className="text-lg font-bold text-neutral-500">
                            {dict.noResultFound}
                        </p>
                        <p className="mt-1 text-sm text-neutral-600">
                            {dict.tryDifferentKeyword}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
