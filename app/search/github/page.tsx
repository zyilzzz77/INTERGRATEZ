"use client";

import { useState } from "react";
import Image from "next/image";
import SearchBar from "@/components/SearchBar";

interface GithubProfile {
    username: string;
    name: string;
    id: number;
    avatar: string;
    url: string;
    type: string;
    company: string;
    blog: string;
    location: string;
    email: string;
    bio: string;
    publicRepos: number;
    publicGists: number;
    followers: number;
    following: number;
    createdAt: string;
    updatedAt: string;
}

export default function GithubSearchPage() {
    const [result, setResult] = useState<GithubProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState("");

    // Proxy images to bypass restrictions and use obfuscated URLs
    function proxyImg(url: string) {
        if (!url) return "";
        return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }

    async function handleSearch(query: string) {
        setLoading(true);
        setHasSearched(true);
        setResult(null);
        setError("");

        try {
            const res = await fetch(`/api/search/github?username=${encodeURIComponent(query)}`);
            const data = await res.json();

            if (data.error) {
                setError(data.error);
            } else {
                setResult(data);
            }
        } catch {
            setError("Gagal mengambil data GitHub");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-2xl text-white shadow-lg ring-1 ring-white/20 overflow-hidden">
                    <Image src="/logo-github.webp" alt="GitHub" width={56} height={56} className="h-full w-full object-cover" />
                </div>
                <h1 className="text-3xl font-black text-white">
                    GitHub <span className="text-white">Search</span>
                </h1>
                <p className="mt-2 text-sm text-neutral-500">
                    Cari profil GitHub, repository & followers
                </p>
            </div>

            <SearchBar
                placeholder="Masukkan username GitHub..."
                onSearch={handleSearch}
                loading={loading}
            />

            {/* Results */}
            <div className="mt-10">
                {/* Loading skeleton */}
                {loading && (
                    <div className="mx-auto max-w-2xl rounded-2xl bg-white/5 p-6 border border-white/5">
                        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                            <div className="skeleton h-24 w-24 rounded-full" />
                            <div className="flex-1 space-y-2 w-full">
                                <div className="skeleton h-6 w-3/4" />
                                <div className="skeleton h-4 w-1/2" />
                                <div className="skeleton h-20 w-full rounded-lg" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Card */}
                {!loading && result && (
                    <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                        {/* Banner */}
                        <div className="h-32 bg-gradient-to-r from-gray-800 to-gray-900" />
                        
                        <div className="px-6 pb-6">
                            {/* Avatar & Basic Info */}
                            <div className="relative -mt-16 mb-6 flex flex-col items-center sm:flex-row sm:items-end sm:gap-6">
                                <img
                                    src={proxyImg(result.avatar)}
                                    alt={result.username}
                                    className="h-32 w-32 rounded-full border-4 border-neutral-900 bg-neutral-800 object-cover shadow-xl"
                                    onContextMenu={(e) => e.preventDefault()}
                                    draggable={false}
                                />
                                <div className="mt-4 text-center sm:mb-2 sm:mt-0 sm:text-left">
                                    <h2 className="text-2xl font-bold text-white">{result.name}</h2>
                                    <p className="text-neutral-400">@{result.username}</p>
                                </div>
                                <div className="mb-2 mt-4 flex gap-2 sm:ml-auto sm:mt-0">
                                    <a
                                        href={result.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-neutral-200"
                                    >
                                        View on GitHub
                                    </a>
                                </div>
                            </div>

                            {/* Bio */}
                            {result.bio && result.bio !== "-" && (
                                <div className="mb-6 rounded-xl bg-white/5 p-4">
                                    <p className="text-sm text-neutral-300 italic">"{result.bio}"</p>
                                </div>
                            )}

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                <div className="rounded-xl bg-white/5 p-3 text-center transition hover:bg-white/10">
                                    <p className="text-lg font-black text-white">{result.publicRepos}</p>
                                    <p className="text-xs text-neutral-500">Repositories</p>
                                </div>
                                <div className="rounded-xl bg-white/5 p-3 text-center transition hover:bg-white/10">
                                    <p className="text-lg font-black text-white">{result.publicGists}</p>
                                    <p className="text-xs text-neutral-500">Gists</p>
                                </div>
                                <div className="rounded-xl bg-white/5 p-3 text-center transition hover:bg-white/10">
                                    <p className="text-lg font-black text-white">{result.followers}</p>
                                    <p className="text-xs text-neutral-500">Followers</p>
                                </div>
                                <div className="rounded-xl bg-white/5 p-3 text-center transition hover:bg-white/10">
                                    <p className="text-lg font-black text-white">{result.following}</p>
                                    <p className="text-xs text-neutral-500">Following</p>
                                </div>
                            </div>

                            {/* Details List */}
                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 text-sm text-neutral-300">
                                    <span className="text-lg">🏢</span>
                                    <span className="truncate">{result.company}</span>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 text-sm text-neutral-300">
                                    <span className="text-lg">📍</span>
                                    <span className="truncate">{result.location}</span>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 text-sm text-neutral-300">
                                    <span className="text-lg">📧</span>
                                    <span className="truncate">{result.email}</span>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 text-sm text-neutral-300">
                                    <span className="text-lg">🔗</span>
                                    <a href={result.blog !== "-" && !result.blog.startsWith("http") ? `https://${result.blog}` : result.blog} target="_blank" rel="noopener noreferrer" className="truncate hover:text-white hover:underline">
                                        {result.blog}
                                    </a>
                                </div>
                            </div>

                            <div className="mt-6 text-center text-xs text-neutral-500">
                                Joined {new Date(result.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="mt-10 text-center">
                        <p className="text-lg font-bold text-red-400">❌ {error}</p>
                        <p className="mt-1 text-sm text-neutral-600">Pastikan username GitHub benar</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && hasSearched && !result && !error && (
                    <div className="mt-20 text-center">
                        <p className="text-lg font-bold text-neutral-500">
                            Tidak ada hasil ditemukan
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
