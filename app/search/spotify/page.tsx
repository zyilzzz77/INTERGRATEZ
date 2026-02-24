"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, ClipboardList, Clipboard, Disc3 } from "lucide-react";
import SearchBar from "@/components/SearchBar";

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
    const [results, setResults] = useState<SpotifyResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Playlist state
    const [playlistUrl, setPlaylistUrl] = useState("");
    const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
    const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([]);
    const [playlistLoading, setPlaylistLoading] = useState(false);
    const [playlistError, setPlaylistError] = useState<string | null>(null);

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
            const res = await fetch(
                `/api/search/spotify?q=${encodeURIComponent(query)}`
            );
            const data = await res.json();
            if (data.items) setResults(data.items);
        } catch {
            // handled silently
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
            const res = await fetch(
                `/api/spotify/playlist?url=${encodeURIComponent(playlistUrl)}`
            );
            const data = await res.json();

            if (!data.status) {
                setPlaylistError(data.error || "Gagal memuat playlist");
                return;
            }

            setPlaylistData(data.data);
            setPlaylistTracks(data.tracks || []);
        } catch {
            setPlaylistError("Terjadi kesalahan. Coba lagi.");
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
            const res = await fetch("/api/search/spotify-new?limit=50");
            const data = await res.json();
            if (data.items) setNewReleases(data.items);
            setNewFetched(true);
        } catch {
            // silent
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
            <div className="mb-8 text-center">
                <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500 text-2xl text-white shadow-lg shadow-green-500/20">
                    🎵
                </div>
                <h1 className="text-3xl font-black text-white">
                    Spotify <span className="text-white">Search</span>
                </h1>
                <p className="mt-2 text-sm text-neutral-500">
                    Cari lagu, pilih untuk download otomatis
                </p>
            </div>

            {/* Tab Switcher */}
            <div className="mb-8 flex justify-center">
                <div className="inline-flex rounded-full border border-neutral-800 bg-neutral-900 p-1.5 shadow-sm">
                    <button
                        onClick={() => setActiveTab("search")}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === "search"
                            ? "bg-[#1DB954] text-white shadow-md shadow-[#1DB954]/20"
                            : "text-neutral-500 hover:text-white"
                            }`}
                    >
                        <Search className="w-4 h-4" />
                        Search
                    </button>
                    <button
                        onClick={() => setActiveTab("playlist")}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === "playlist"
                            ? "bg-[#1DB954] text-white shadow-md shadow-[#1DB954]/20"
                            : "text-neutral-500 hover:text-white"
                            }`}
                    >
                        <ClipboardList className="w-4 h-4" />
                        Playlist
                    </button>
                    <button
                        onClick={handleNewTab}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === "new"
                            ? "bg-[#1DB954] text-white shadow-md shadow-[#1DB954]/20"
                            : "text-neutral-500 hover:text-white"
                            }`}
                    >
                        <Disc3 className="w-4 h-4" />
                        New Releases
                    </button>
                </div>
            </div>

            {/* ─── SEARCH TAB ───────────────────────────── */}
            {activeTab === "search" && (
                <>
                    <SearchBar
                        placeholder="Cari lagu atau artis..."
                        onSearch={handleSearch}
                        loading={loading}
                    />

                    <div className="mt-10">
                        {loading && (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="rounded-xl border border-white/5 bg-white/5 p-3"
                                    >
                                        <div className="skeleton mb-3 h-16 w-16 rounded-lg" />
                                        <div className="skeleton mb-2 h-4 w-3/4" />
                                        <div className="skeleton h-3 w-1/2" />
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
                                        className="card-hover group flex cursor-pointer items-center gap-4 overflow-hidden rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm transition-all hover:border-green-500/30 hover:bg-green-500/5"
                                    >
                                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg shadow-sm">
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
                                            <h4 className="line-clamp-1 text-sm font-bold text-white group-hover:text-green-400">
                                                {r.title}
                                            </h4>
                                            <p className="line-clamp-1 text-xs font-medium text-neutral-500">
                                                {r.artist}
                                            </p>
                                            <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-600">
                                                <span>⏱ {r.duration}</span>
                                                {r.release_date && (
                                                    <span>📅 {r.release_date.split("-")[0]}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mr-2 text-neutral-600 transition-colors group-hover:text-green-400">
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loading && hasSearched && results.length === 0 && (
                            <div className="mt-20 text-center">
                                <p className="text-lg font-bold text-neutral-500">
                                    Tidak ada hasil ditemukan
                                </p>
                                <p className="mt-1 text-sm text-neutral-600">
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
                    <div className="mx-auto flex w-full max-w-xl mb-8">
                        <div className="flex flex-1 overflow-hidden rounded-full border border-neutral-800 bg-neutral-900 shadow-md transition-shadow focus-within:border-neutral-700 focus-within:shadow-lg">
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const text = await navigator.clipboard.readText();
                                        if (text) setPlaylistUrl(text);
                                    } catch { }
                                }}
                                className="flex items-center justify-center px-5 pl-6 text-neutral-500 hover:text-white transition-colors"
                            >
                                <Clipboard className="h-5 w-5" />
                            </button>
                            <input
                                type="text"
                                value={playlistUrl}
                                onChange={(e) => setPlaylistUrl(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handlePlaylistLoad()}
                                placeholder="Paste link playlist Spotify..."
                                className="flex-1 bg-transparent px-2 py-4 text-sm text-white outline-none placeholder:text-neutral-500"
                            />
                            <button
                                onClick={handlePlaylistLoad}
                                disabled={playlistLoading || !playlistUrl.trim()}
                                className="m-1.5 mr-2 flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:bg-neutral-200 disabled:opacity-50"
                            >
                                {playlistLoading ? (
                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                                    </svg>
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                                Muat
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {playlistError && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
                            {playlistError}
                        </div>
                    )}

                    {/* Loading Skeleton */}
                    {playlistLoading && (
                        <div>
                            <div className="flex items-center gap-5 mb-8 p-5 rounded-2xl bg-white/5 border border-white/10">
                                <div className="skeleton h-20 w-20 rounded-xl shrink-0" />
                                <div className="flex-1">
                                    <div className="skeleton h-5 w-48 mb-2" />
                                    <div className="skeleton h-3 w-24" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="skeleton h-12 w-12 rounded-lg shrink-0" />
                                        <div className="flex-1">
                                            <div className="skeleton h-4 w-3/4 mb-2" />
                                            <div className="skeleton h-3 w-1/2" />
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
                            <div className="flex items-center gap-5 mb-8 p-5 rounded-2xl bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20">
                                {playlistData.cover && (
                                    <div className="relative h-20 w-20 rounded-xl overflow-hidden shadow-lg shadow-green-500/20 shrink-0">
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
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-green-400 mb-1">Playlist</p>
                                    <h2 className="text-xl font-black text-white leading-tight">{playlistData.title}</h2>
                                    <p className="text-xs text-neutral-400 mt-1">{playlistTracks.length} lagu</p>
                                </div>
                            </div>

                            {/* Track List */}
                            <div className="space-y-2">
                                {playlistTracks.map((track, i) => (
                                    <div
                                        key={i}
                                        onClick={() => handleTrackDownload(track)}
                                        className="group flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.03] cursor-pointer hover:bg-green-500/5 hover:border-green-500/20 transition-all"
                                    >
                                        {/* Number */}
                                        <span className="text-xs font-bold text-neutral-600 w-6 text-center shrink-0">
                                            {i + 1}
                                        </span>

                                        {/* Cover */}
                                        <div className="relative h-12 w-12 rounded-lg overflow-hidden shrink-0">
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

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-green-400 transition-colors">
                                                {track.title}
                                            </h4>
                                            <p className="text-xs text-neutral-500 line-clamp-1">
                                                {track.artists} · {track.album}
                                            </p>
                                        </div>

                                        {/* Duration */}
                                        <span className="text-xs text-neutral-600 font-medium shrink-0 hidden sm:block">
                                            {track.duration}
                                        </span>

                                        {/* Download Icon */}
                                        <div className="text-neutral-600 group-hover:text-green-400 transition-colors shrink-0">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-3xl mb-4">
                                📋
                            </div>
                            <p className="text-lg font-bold text-neutral-500">
                                Muat Playlist Spotify
                            </p>
                            <p className="mt-1 text-sm text-neutral-600 max-w-sm mx-auto">
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
                                <div key={i} className="rounded-xl border border-white/5 bg-white/5 p-3">
                                    <div className="skeleton mb-3 h-16 w-16 rounded-lg" />
                                    <div className="skeleton mb-2 h-4 w-3/4" />
                                    <div className="skeleton h-3 w-1/2" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Results */}
                    {!newLoading && newReleases.length > 0 && (
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-4">🔥 Lagu Terbaru di Spotify Indonesia</p>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {newReleases.map((r, i) => (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            if (r.url) router.push(`/?url=${encodeURIComponent(r.url)}&auto=true`);
                                        }}
                                        className="card-hover group flex cursor-pointer items-center gap-4 overflow-hidden rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm transition-all hover:border-green-500/30 hover:bg-green-500/5"
                                    >
                                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg shadow-sm">
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
                                            <h4 className="line-clamp-1 text-sm font-bold text-white group-hover:text-green-400">
                                                {r.name}
                                            </h4>
                                            <p className="line-clamp-1 text-xs font-medium text-neutral-500">
                                                {r.artist}
                                            </p>
                                            {r.release_date && (
                                                <p className="mt-1 text-[10px] text-neutral-600">
                                                    📅 {r.release_date}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mr-2 text-neutral-600 transition-colors group-hover:text-green-400">
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
                            <p className="text-lg font-bold text-neutral-500">Tidak ada new releases</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
