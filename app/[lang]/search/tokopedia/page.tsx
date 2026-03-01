"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface TokopediaResult {
    id: number;
    name: string;
    price: string;
    price_number: number;
    shop: {
        name: string;
        city: string;
    };
    url: string;
    thumbnail: string;
}

export default function TokopediaSearchPage() {
    const router = useRouter();
    const [results, setResults] = useState<TokopediaResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);

    async function handleSearch(query: string) {
        setLoading(true);
        setHasSearched(true);
        setResults([]);
        setSortOrder(null); // Reset sort on new search

        try {
            const res = await fetch(`/api/search/tokopedia?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.items) {
                setResults(data.items);
            }
        } catch (e) {
            console.error("Search failed:", e);
        } finally {
            setLoading(false);
        }
    }

    const proxyImg = (url: string) => `/api/proxy-image?url=${encodeURIComponent(url)}`;

    const sortedResults = [...results].sort((a, b) => {
        if (sortOrder === "asc") return a.price_number - b.price_number;
        if (sortOrder === "desc") return b.price_number - a.price_number;
        return 0;
    });

    return (
        <div className="mx-auto max-w-7xl px-4 py-10">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500 text-2xl text-white shadow-lg shadow-green-500/20 overflow-hidden">
                    <Image src="/logo-tokped.webp" alt="Tokopedia" width={56} height={56} className="h-full w-full object-cover" />
                </div>
                <h1 className="text-3xl font-black text-white">
                    Tokopedia <span className="text-white">Search</span>
                </h1>
                <p className="mt-2 text-sm text-neutral-500">
                    Cari produk termurah dari jutaan toko di Tokopedia
                </p>
            </div>

            <SearchBar
                placeholder="Cari barang (ex: iPhone 15, Sepatu Nike)..."
                onSearch={handleSearch}
                loading={loading}
            />

            {/* Results */}
            <div className="mt-10">
                {/* Sort Controls */}
                {!loading && results.length > 0 && (
                    <div className="mb-6 flex justify-end">
                        <select
                            value={sortOrder || ""}
                            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc" | null || null)}
                            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-green-500 focus:outline-none dark:bg-white/5 dark:text-white light:bg-white light:border-black/10 light:text-black"
                        >
                            <option value="" className="text-black">Urutkan: Relevansi</option>
                            <option value="asc" className="text-black">Harga Terendah</option>
                            <option value="desc" className="text-black">Harga Tertinggi</option>
                        </select>
                    </div>
                )}

                {loading && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-white/5 bg-white/5 p-2">
                                <div className="skeleton mb-2 aspect-square w-full rounded-lg" />
                                <div className="p-2">
                                    <div className="skeleton mb-2 h-4 w-3/4" />
                                    <div className="skeleton h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && hasSearched && results.length === 0 && (
                    <div className="rounded-xl border border-dashed border-neutral-800 p-12 text-center text-neutral-500">
                        <p>Tidak ada produk ditemukan.</p>
                    </div>
                )}

                {!loading && sortedResults.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {sortedResults.map((r) => (
                            <a
                                key={r.id}
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="card-hover group flex flex-col overflow-hidden rounded-xl border border-white/5 bg-white/5 shadow-sm backdrop-blur-sm transition-all hover:border-green-500/30 hover:shadow-md dark:bg-white/5 light:bg-white light:border-black/10"
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-square w-full overflow-hidden bg-white p-4">
                                    <img
                                        src={proxyImg(r.thumbnail)}
                                        alt={r.name}
                                        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                        onContextMenu={(e) => e.preventDefault()}
                                        draggable={false}
                                    />
                                    {/* Transparent Overlay for protection */}
                                    <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
                                </div>

                                {/* Info */}
                                <div className="flex flex-1 flex-col p-4">
                                    <h3 className="line-clamp-2 text-sm font-medium leading-tight text-white group-hover:text-green-500 dark:text-white light:text-neutral-900">
                                        {r.name}
                                    </h3>

                                    <div className="mt-2 text-lg font-bold text-white dark:text-white light:text-neutral-900">
                                        {r.price}
                                    </div>

                                    <div className="mt-auto pt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs">
                                                🏪
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="truncate text-xs font-semibold text-neutral-300 dark:text-neutral-300 light:text-neutral-700">
                                                    {r.shop.name}
                                                </span>
                                                <span className="text-[10px] text-neutral-500">
                                                    {r.shop.city}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
