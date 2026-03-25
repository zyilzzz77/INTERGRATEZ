"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, ClipboardList, Clipboard, Disc3 } from "lucide-react";
import { showToast } from "@/components/Toast";

/* ─── Types ─────────────────────────────────────────── */
interface SpotifyResult {
    title: string;
    artist: string;
    cover: string;
    thumbnail: string;
    duration: string;
    url: string;
    album: string;
    release_date: string;
    popularity: number;
}

interface PlaylistTrack {
    cover: string;
    title: string;
    artists: string;
    album: string;
    duration: string;
    url: string;
}

interface PlaylistData {
    cover: string;
    title: string;
}

interface NewRelease {
    thumbnail: string;
    name: string;
    artist: string;
    release_date: string;
    url: string;
}

/* ─── Component ─────────────────────────────────────── */
export default function SpotifySearchPage() {
    const router = useRouter();

    // Tab state
    const [activeTab, setActiveTab] = useState<"search" | "playlist" | "new">("search");

    // Search state
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SpotifyResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Playlist state
    const [playlistUrl, setPlaylistUrl] = useState("");
    const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
    const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([]);
    const [playlistLoading, setPlaylistLoading] = useState(false);
    const [playlistError, setPlaylistError] = useState<string | null>(null);

    const playlistInputRef = useRef<HTMLInputElement>(null);

    // New Releases state
    const [newReleases, setNewReleases] = useState<NewRelease[]>([]);
    const [newLoading, setNewLoading] = useState(false);
    const [newFetched, setNewFetched] = useState(false);

    /* ─── Search Handler ────────────────────────────── */
    async function handleSearch(query: string) {
        setLoading(true);
        setHasSearched(true);
        setResults([]);

        try {
            showToast("Mencari lagu...", "info");
            const res = await fetch(
                `/api/search/spotify?q=${encodeURIComponent(query)}`
            );
            const data = await res.json();
            if (data.items) {
                setResults(data.items);
                showToast("Pencarian selesai", "success");
            } else {
                showToast("Hasil tidak ditemukan", "info");
            }
        } catch {
            showToast("Gagal melakukan pencarian", "error");
        } finally {
            setLoading(false);
        }
    }

    function handleSelect(r: SpotifyResult) {
        if (!r.url) return;
        router.push(`/?url=${encodeURIComponent(r.url)}&auto=true`);
    }

    /* ─── Playlist Handler ──────────────────────────── */
    async function handlePlaylistLoad() {
        if (!playlistUrl.trim()) return;
        if (!playlistUrl.includes("open.spotify.com/playlist/")) {
            setPlaylistError("Masukkan link playlist Spotify yang valid");
            return;
        }

        setPlaylistLoading(true);
        setPlaylistError(null);
        setPlaylistData(null);
        setPlaylistTracks([]);

        try {
            showToast("Memuat playlist...", "info");
            const res = await fetch(
                `/api/spotify/playlist?url=${encodeURIComponent(playlistUrl)}`
            );
            const data = await res.json();

            if (!data.status) {
                setPlaylistError(data.error || "Gagal memuat playlist");
                showToast(data.error || "Gagal memuat playlist", "error");
                return;
            }

            setPlaylistData(data.data);
            setPlaylistTracks(data.tracks || []);
            showToast("Playlist berhasil dimuat", "success");
        } catch {
            setPlaylistError("Terjadi kesalahan. Coba lagi.");
            showToast("Terjadi kesalahan sistem", "error");
        } finally {
            setPlaylistLoading(false);
        }
    }

    function handleTrackDownload(track: PlaylistTrack) {
        if (!track.url) return;
        router.push(`/?url=${encodeURIComponent(track.url)}&auto=true`);
    }

    /* ─── New Releases Handler ──────────────────────── */
    async function fetchNewReleases() {
        if (newFetched) return;
        setNewLoading(true);
        try {
            showToast("Memuat lagu terbaru...", "info");
            const res = await fetch("/api/search/spotify-new?limit=50");
            const data = await res.json();
            if (data.items) {
                setNewReleases(data.items);
                showToast("Lagu terbaru dimuat", "success");
            }
            setNewFetched(true);
        } catch {
            showToast("Gagal memuat lagu terbaru", "error");
        } finally {
            setNewLoading(false);
        }
    }

    function handleNewTab() {
        setActiveTab("new");
        fetchNewReleases();
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            {/* Header */}
            <div className="mb-10 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-black bg-[#b3e5fc] text-2xl font-black text-black shadow-neo">
                    🎵
                </div>
                <h1 className="text-3xl font-black text-black">Spotify Search</h1>
                <p className="mt-2 text-sm font-bold text-black/70">
                    Cari lagu, playlist, atau rilis terbaru dengan gaya Neobrutalism
                </p>
            </div>

            {/* Tab Switcher */}
            <div className="mb-8 flex justify-center gap-2">
                {[{ key: "search", label: "Search", icon: Search }, { key: "playlist", label: "Playlist", icon: ClipboardList }, { key: "new", label: "New Releases", icon: Disc3 }].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => {
                                if (tab.key === "new") handleNewTab(); else setActiveTab(tab.key as typeof activeTab);
                            }}
                            className={`flex items-center gap-2 rounded-xl border-[3px] border-black px-4 py-2.5 text-sm font-black transition-all shadow-neo-sm ${isActive ? "bg-[#1db954] text-black" : "bg-white text-black hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-neo-sm"}`}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ─── SEARCH TAB ───────────────────────────── */}
            {activeTab === "search" && (
                <>
                    {/* Search Bar */}
                    <form
                        onSubmit={(e: FormEvent) => {
                            e.preventDefault();
                            if (!query.trim()) return;
                            handleSearch(query.trim());
                        }}
                        className="mx-auto w-full max-w-xl"
                    >
                        <div className="flex overflow-hidden rounded-xl border-[3px] border-black bg-white shadow-neo transition-all focus-within:shadow-neo-sm focus-within:-translate-y-1 focus-within:-translate-x-1">
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        showToast("Membaca clipboard...", "info");
                                        const text = await navigator.clipboard.readText();
                                        if (text) setQuery(text);
                                        else showToast("Clipboard kosong", "error");
                                    } catch {
                                        searchInputRef.current?.focus();
                                        showToast("Clipboard tidak diizinkan", "error");
                                    }
                                }}
                                className="flex items-center justify-center px-4 md:px-5 pl-5 md:pl-6 text-black/50 hover:text-black transition-colors"
                                title="Paste dari clipboard"
                            >
                                <Clipboard className="h-5 w-5" strokeWidth={3} />
                            </button>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Cari lagu atau artis..."
                                className="flex-1 bg-transparent px-2 py-4 text-sm font-bold text-black outline-none placeholder:text-black/50 placeholder:font-medium"
                            />
                            <div className="m-2 md:m-2.5 mr-2 md:mr-3 flex gap-1.5">
                                <button
                                    type="submit"
                                    disabled={loading || !query.trim()}
                                    className="flex items-center gap-2 rounded-xl bg-[#ffeb3b] px-4 md:px-5 py-2.5 text-xs md:text-sm font-black text-black transition-all border-2 border-transparent hover:border-black hover:bg-white hover:shadow-neo-sm disabled:opacity-50"
                                >
                                    {loading ? (
                                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                                        </svg>
                                    ) : (
                                        <Search className="h-4 w-4" strokeWidth={3} />
                                    )}
                                    Cari
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuery("");
                                        setResults([]);
                                        setHasSearched(false);
                                    }}
                                    className="flex items-center gap-2 rounded-xl bg-[#b3e5fc] px-4 md:px-5 py-2.5 text-xs md:text-sm font-black text-black transition-all border-2 border-transparent hover:border-black hover:bg-white hover:shadow-neo-sm"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="mt-10">
                        {loading && (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="rounded-2xl border-[3px] border-black bg-white p-3 shadow-neo"
                                    >
                                        <div className="skeleton mb-3 h-16 w-16 rounded-xl" />
                                        <div className="skeleton mb-2 h-4 w-3/4 rounded-md" />
                                        <div className="skeleton h-3 w-1/2 rounded-md" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loading && results.length > 0 && (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {results.map((r, i) => (
                                    <div
                                        key={i}
                                        onClick={() => handleSelect(r)}
                                        className="group flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border-[3px] border-black bg-white p-3 shadow-neo transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-sm"
                                    >
                                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-[3px] border-black bg-[#e8f5e9]">
                                            <Image
                                                src={r.cover || r.thumbnail}
                                                alt={r.title}
                                                width={64}
                                                height={64}
                                                className="h-full w-full object-cover"
                                                onContextMenu={(e) => e.preventDefault()}
                                                draggable={false}
                                            />
                                            <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
                                        </div>

                                        <div className="flex min-w-0 flex-1 flex-col justify-center">
                                            <h4 className="line-clamp-1 text-sm font-black text-black group-hover:text-[#1db954]">
                                                {r.title}
                                            </h4>
                                            <p className="line-clamp-1 text-xs font-bold text-black/70">
                                                {r.artist}
                                            </p>
                                            <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-black/60">
                                                <span>⏱ {r.duration}</span>
                                                {r.release_date && (
                                                    <span>📅 {r.release_date.split("-")[0]}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mr-2 text-black transition-colors group-hover:text-[#1db954]">
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loading && hasSearched && results.length === 0 && (
                            <div className="mt-20 text-center">
                                <p className="text-lg font-black text-black/80">
                                    Tidak ada hasil ditemukan
                                </p>
                                <p className="mt-1 text-sm font-bold text-black/60">
                                    Coba kata kunci yang berbeda
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ─── PLAYLIST TAB ─────────────────────────── */}
            {activeTab === "playlist" && (
                <div>
                    {/* Playlist URL Input */}
                    <div className="mx-auto mb-8 flex w-full max-w-xl">
                        <div className="flex flex-1 overflow-hidden rounded-xl border-[3px] border-black bg-white shadow-neo transition-all focus-within:shadow-neo-sm focus-within:-translate-y-1 focus-within:-translate-x-1">
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        showToast("Membaca clipboard...", "info");
                                        const text = await navigator.clipboard.readText();
                                        if (text) setPlaylistUrl(text);
                                        else showToast("Clipboard kosong", "error");
                                    } catch {
                                        playlistInputRef.current?.focus();
                                        showToast("Clipboard tidak diizinkan", "error");
                                    }
                                }}
                                className="flex items-center justify-center px-5 pl-6 text-black/50 hover:text-black transition-colors"
                            >
                                <Clipboard className="h-5 w-5" strokeWidth={3} />
                            </button>
                            <input
                                ref={playlistInputRef}
                                type="text"
                                value={playlistUrl}
                                onChange={(e) => setPlaylistUrl(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handlePlaylistLoad()}
                                placeholder="Paste link playlist Spotify..."
                                className="flex-1 bg-transparent px-2 py-4 text-sm font-bold text-black outline-none placeholder:text-black/50 placeholder:font-medium"
                            />
                            <button
                                onClick={handlePlaylistLoad}
                                disabled={playlistLoading || !playlistUrl.trim()}
                                className="m-1.5 mr-2 flex items-center gap-2 rounded-xl border-2 border-transparent bg-[#ffeb3b] px-6 py-2.5 text-sm font-black text-black transition-all hover:border-black hover:bg-white hover:shadow-neo-sm disabled:opacity-50"
                            >
                                {playlistLoading ? (
                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                                    </svg>
                                ) : (
                                    <Search className="h-4 w-4" strokeWidth={3} />
                                )}
                                Muat
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {playlistError && (
                        <div className="mb-6 rounded-xl border-[3px] border-black bg-[#ffb3c6] p-4 text-sm font-black text-black shadow-neo-sm text-center">
                            {playlistError}
                        </div>
                    )}

                    {/* Loading Skeleton */}
                    {playlistLoading && (
                        <div>
                            <div className="mb-8 flex items-center gap-5 rounded-2xl border-[3px] border-black bg-white p-5 shadow-neo">
                                <div className="skeleton h-20 w-20 rounded-xl border-[3px] border-black shrink-0" />
                                <div className="flex-1">
                                    <div className="skeleton mb-2 h-5 w-48 rounded-md" />
                                    <div className="skeleton h-3 w-24 rounded-md" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 rounded-2xl border-[3px] border-black bg-white p-3 shadow-neo-sm">
                                        <div className="skeleton h-12 w-12 rounded-xl border-[3px] border-black shrink-0" />
                                        <div className="flex-1">
                                            <div className="skeleton mb-2 h-4 w-3/4 rounded-md" />
                                            <div className="skeleton h-3 w-1/2 rounded-md" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Playlist Info & Tracks */}
                    {!playlistLoading && playlistData && (
                        <div>
                            {/* Playlist Header */}
                            <div className="mb-8 flex items-center gap-5 rounded-2xl border-[3px] border-black bg-white p-5 shadow-neo">
                                {playlistData.cover && (
                                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-[3px] border-black bg-[#e8f5e9]">
                                        <Image
                                            src={playlistData.cover}
                                            alt={playlistData.title}
                                            width={80}
                                            height={80}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                )}
                                <div>
                                    <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-black">Playlist</p>
                                    <h2 className="text-xl font-black text-black leading-tight">{playlistData.title}</h2>
                                    <p className="mt-1 text-xs font-bold text-black/70">{playlistTracks.length} lagu</p>
                                </div>
                            </div>

                            {/* Track List */}
                            <div className="space-y-2">
                                {playlistTracks.map((track, i) => (
                                    <div
                                        key={i}
                                        onClick={() => handleTrackDownload(track)}
                                        className="group flex cursor-pointer items-center gap-4 rounded-2xl border-[3px] border-black bg-white p-3 shadow-neo-sm transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-neo-sm"
                                    >
                                        <span className="w-7 shrink-0 text-center text-xs font-black text-black">{i + 1}</span>
                                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border-[3px] border-black bg-[#e8f5e9]">
                                            <Image
                                                src={track.cover}
                                                alt={track.title}
                                                width={48}
                                                height={48}
                                                className="h-full w-full object-cover"
                                                onContextMenu={(e) => e.preventDefault()}
                                                draggable={false}
                                            />
                                            <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="line-clamp-1 text-sm font-black text-black group-hover:text-[#1db954] transition-colors">
                                                {track.title}
                                            </h4>
                                            <p className="line-clamp-1 text-xs font-bold text-black/70">
                                                {track.artists} · {track.album}
                                            </p>
                                        </div>
                                        <span className="hidden shrink-0 text-xs font-bold text-black/60 sm:block">{track.duration}</span>
                                        <div className="shrink-0 text-black transition-colors group-hover:text-[#1db954]">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!playlistLoading && !playlistData && !playlistError && (
                        <div className="mt-16 text-center">
                            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-black bg-[#b3e5fc] text-3xl font-black text-black shadow-neo-sm">
                                📋
                            </div>
                            <p className="text-lg font-black text-black/80">
                                Muat Playlist Spotify
                            </p>
                            <p className="mt-1 text-sm font-bold text-black/60 max-w-sm mx-auto">
                                Paste link playlist Spotify di atas untuk melihat semua lagu dan download satu per satu
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ─── NEW RELEASES TAB ───────────────────────── */}
            {activeTab === "new" && (
                <div className="mt-2">
                    {/* Loading */}
                    {newLoading && (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <div key={i} className="rounded-2xl border-[3px] border-black bg-white p-3 shadow-neo">
                                    <div className="skeleton mb-3 h-16 w-16 rounded-xl" />
                                    <div className="skeleton mb-2 h-4 w-3/4 rounded-md" />
                                    <div className="skeleton h-3 w-1/2 rounded-md" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Results */}
                    {!newLoading && newReleases.length > 0 && (
                        <div>
                            <p className="mb-4 text-xs font-black uppercase tracking-wider text-black/70">🔥 Lagu Terbaru di Spotify Indonesia</p>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {newReleases.map((r, i) => (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            if (r.url) router.push(`/?url=${encodeURIComponent(r.url)}&auto=true`);
                                        }}
                                        className="group flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border-[3px] border-black bg-white p-3 shadow-neo-sm transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-neo-sm"
                                    >
                                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-[3px] border-black bg-[#e8f5e9]">
                                            <Image
                                                src={r.thumbnail}
                                                alt={r.name}
                                                width={64}
                                                height={64}
                                                className="h-full w-full object-cover"
                                                onContextMenu={(e) => e.preventDefault()}
                                                draggable={false}
                                            />
                                            <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
                                        </div>

                                        <div className="flex min-w-0 flex-1 flex-col justify-center">
                                            <h4 className="line-clamp-1 text-sm font-black text-black group-hover:text-[#1db954]">
                                                {r.name}
                                            </h4>
                                            <p className="line-clamp-1 text-xs font-bold text-black/70">
                                                {r.artist}
                                            </p>
                                            {r.release_date && (
                                                <p className="mt-1 text-[10px] font-bold text-black/60">
                                                    📅 {r.release_date}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mr-2 text-black transition-colors group-hover:text-[#1db954]">
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty */}
                    {!newLoading && newFetched && newReleases.length === 0 && (
                        <div className="mt-20 text-center">
                            <p className="text-lg font-black text-black/80">Tidak ada new releases</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
