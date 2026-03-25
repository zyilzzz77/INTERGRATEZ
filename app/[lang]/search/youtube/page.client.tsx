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
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-black bg-[#ffb3c6] text-2xl font-black text-black shadow-neo">
                    ▶
                </div>
                <h1 className="text-3xl font-black text-black">
                    {dict.title.split(' ')[0]} <span className="text-red-600">{dict.title.split(' ')[1]}</span>
                </h1>
                <p className="mt-2 text-sm font-bold text-black/70">
                    {dict.subtitle}
                </p>
            </div>

            {/* Search Bar with two buttons */}
            <form onSubmit={handleSubmit} className="mx-auto w-full max-w-xl">
                <div className="flex overflow-hidden rounded-xl border-[3px] border-black bg-white shadow-neo transition-all focus-within:shadow-neo-sm focus-within:-translate-y-1 focus-within:-translate-x-1">
                    <button
                        type="button"
                        onClick={handlePaste}
                        className="flex items-center justify-center px-4 md:px-5 pl-5 md:pl-6 text-black/50 hover:text-black transition-colors"
                        title="Paste from clipboard"
                    >
                        <Clipboard className="h-5 w-5" strokeWidth={3} />
                    </button>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={dict.placeholder}
                        className="flex-1 bg-transparent px-2 py-4 text-sm font-bold text-black outline-none placeholder:text-black/50 placeholder:font-medium"
                        ref={inputRef}
                    />
                    <div className="m-2 md:m-2.5 mr-2 md:mr-3 flex gap-1.5">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-xl bg-[#ffeb3b] px-4 md:px-5 py-2.5 text-xs md:text-sm font-black text-black transition-all border-2 border-transparent hover:border-black hover:bg-white hover:shadow-neo-sm disabled:opacity-50"
                        >
                            {loading ? (
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                                </svg>
                            ) : (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <circle cx="11" cy="11" r="7" />
                                    <path strokeLinecap="round" d="m16 16 4 4" />
                                </svg>
                            )}
                            {dict.searchBtn}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowPlaylistModal(true)}
                            className="flex items-center gap-2 rounded-xl bg-[#ffb3c6] px-4 md:px-5 py-2.5 text-xs md:text-sm font-black text-black transition-all border-2 border-transparent hover:border-black hover:bg-white hover:shadow-neo-sm"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10M4 18h10" />
                            </svg>
                            {dict.playlistBtn}
                        </button>
                    </div>
                </div>
            </form>

            {/* Playlist Modal */}
            {showPlaylistModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowPlaylistModal(false)}>
                    <div
                        className="mx-4 w-full max-w-md rounded-2xl border-[3px] border-black bg-white p-6 shadow-neo"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-black text-black">{dict.playlistModalTitle}</h2>
                            <button
                                onClick={() => setShowPlaylistModal(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-black hover:bg-[#ffb3c6] border-2 border-transparent hover:border-black transition-all font-black"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="mb-4 text-sm font-bold text-black/70">
                            {dict.playlistModalDesc}
                        </p>
                        <input
                            type="text"
                            value={playlistUrl}
                            onChange={(e) => setPlaylistUrl(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handlePlaylistSubmit()}
                            placeholder={dict.playlistModalPlaceholder}
                            className="mb-3 w-full rounded-xl border-[3px] border-black bg-white px-4 py-3 text-sm font-bold text-black outline-none placeholder:text-black/50 shadow-neo-sm focus:-translate-y-0.5 focus:-translate-x-0.5 transition-all"
                            autoFocus
                        />
                        {playlistError && (
                            <p className="mb-3 text-sm font-bold text-red-600">{playlistError}</p>
                        )}
                        <button
                            onClick={handlePlaylistSubmit}
                            disabled={playlistLoading || !playlistUrl.trim()}
                            className="w-full rounded-xl bg-[#c4b5fd] py-3 text-sm font-black text-black transition-all border-2 border-black hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-neo disabled:opacity-50"
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
                <div className="mt-10 rounded-2xl border-[3px] border-black bg-white p-6 shadow-neo">
                    <div className="mb-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c4b5fd] border-2 border-black text-lg shadow-neo-sm">📋</div>
                            <div>
                                <h2 className="text-xl font-black text-black">{dict.playlistResultTitle}</h2>
                                <p className="text-sm font-bold text-black/70">{playlistResults.length} {dict.playlistResultFound}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setShowPlaylistResults(false); setPlaylistResults([]); }}
                            className="rounded-xl border-2 border-transparent hover:border-black hover:bg-[#ffb3c6] hover:shadow-neo-sm px-3 py-1.5 text-sm font-black text-black transition-all"
                        >
                            ✕ {dict.close}
                        </button>
                    </div>
                    <div className="space-y-3">
                        {playlistResults.map((item, i) => (
                            <div
                                key={i}
                                className="group flex items-center gap-4 rounded-xl border-[3px] border-black bg-white p-3 transition-all hover:shadow-neo-sm hover:-translate-y-0.5 hover:-translate-x-0.5"
                            >
                                {/* Number */}
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#a0d1d6] border-2 border-black text-sm font-black text-black">
                                    {i + 1}
                                </div>

                                {/* Title */}
                                <p className="flex-1 text-sm font-bold text-black line-clamp-1 group-hover:text-black">
                                    {item.title}
                                </p>

                                {/* Actions */}
                                <div className="flex flex-shrink-0 gap-2">
                                    <button
                                        onClick={(e) => handleWatch(e, item.url)}
                                        className="flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs font-black text-black transition-all hover:bg-[#ffeb3b] hover:shadow-neo-sm hover:-translate-y-0.5"
                                        title="Watch"
                                    >
                                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                        <span className="hidden sm:inline">{dict.watch}</span>
                                    </button>
                                    <button
                                        onClick={(e) => handleDownload(e, item.url)}
                                        className="flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs font-black text-black transition-all hover:bg-[#c4b5fd] hover:shadow-neo-sm hover:-translate-y-0.5"
                                        title="Download"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                        </svg>
                                        <span className="hidden sm:inline">{dict.download}</span>
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
                            <div key={i} className="rounded-2xl border-[3px] border-black bg-white p-2 shadow-neo">
                                <div className="skeleton mb-2 aspect-video w-full rounded-xl" />
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
                                className="group flex h-full cursor-pointer flex-col rounded-2xl border-[3px] border-black bg-white shadow-neo transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-sm"
                            >
                                {/* Thumbnail + Duration */}
                                <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl border-b-[3px] border-black bg-[#ffece5]">
                                    <img
                                        src={r.thumbnail}
                                        alt={r.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onContextMenu={(e) => e.preventDefault()}
                                        draggable={false}
                                    />
                                    <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />

                                    {r.duration && (
                                        <span className="absolute bottom-2 right-2 z-20 rounded-xl border-[3px] border-black bg-white px-2 py-1 text-[11px] font-black text-black shadow-neo-sm">
                                            {r.duration}
                                        </span>
                                    )}
                                    <div className="absolute top-2 left-2 z-20 flex items-center gap-2 rounded-xl border-[3px] border-black bg-white px-2.5 py-1 text-xs font-black text-black shadow-neo-sm">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-lg border-[3px] border-black bg-[#c4b5fd] text-xs font-black text-black">
                                            {r.channel.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="line-clamp-1 max-w-[120px] text-left">{r.channel}</span>
                                    </div>

                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/5 opacity-0 transition-opacity group-hover:opacity-100">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border-[3px] border-black bg-[#ffb3c6] text-black shadow-neo-sm">
                                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex flex-1 flex-col gap-3 p-4">
                                    <h3 className="line-clamp-2 text-base font-black leading-tight text-black group-hover:text-red-600">
                                        {r.title}
                                    </h3>

                                    <div className="mt-1 flex items-center gap-2 text-xs font-bold text-black/70">
                                        <span className="inline-flex items-center gap-1 rounded-full border-[3px] border-black bg-[#a0d1d6] px-2 py-1 text-[11px] font-black text-black shadow-neo-sm">
                                            👁 {r.views || '—'}
                                        </span>
                                        {r.publishedAt && (
                                            <span className="inline-flex items-center gap-1 rounded-full border-[3px] border-black bg-[#ffeb3b] px-2 py-1 text-[11px] font-black text-black shadow-neo-sm">
                                                📅 {r.publishedAt}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                                        <div className="flex flex-col text-[11px] font-black text-black/70">
                                            {r.views && <span>{dict.viewsLabel ? `${dict.viewsLabel} ${r.views}` : `👁 ${r.views}`}</span>}
                                            {r.duration && <span>{dict.durationLabel ? `${dict.durationLabel} ${r.duration}` : `${r.duration}`}</span>}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => handleWatch(e, r.url)}
                                                className="flex items-center gap-2 rounded-xl border-[3px] border-black bg-[#ffeb3b] px-3 py-2 text-xs font-black text-black transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-neo-sm"
                                                title="Watch"
                                            >
                                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                                {dict.watch}
                                            </button>
                                            <button
                                                onClick={(e) => handleDownload(e, r.url)}
                                                className="flex items-center gap-2 rounded-xl border-[3px] border-black bg-[#c4b5fd] px-3 py-2 text-xs font-black text-black transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-neo-sm"
                                                title="Download"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                                </svg>
                                                {dict.download}
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
                        <p className="text-lg font-black text-black/80">
                            {dict.noResultFound}
                        </p>
                        <p className="mt-1 text-sm font-bold text-black/60">
                            {dict.tryDifferentKeyword}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
