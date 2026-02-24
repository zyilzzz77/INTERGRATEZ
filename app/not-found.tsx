import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-900 px-4 text-center">
            {/* Animated 404 */}
            <div className="relative mb-8">
                <h1 className="text-[150px] font-black leading-none text-white opacity-10 blur-sm md:text-[200px]">
                    404
                </h1>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="float-anim flex items-center justify-center rounded-3xl bg-gradient-to-br from-neutral-800 to-black p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-20 w-20 text-neutral-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            <path d="M12 4c-3.31 0-6 2.69-6 6 0 1.83.82 3.45 2.1 4.54.49.42.79 1.03.8 1.68v2.28c0 .83.67 1.5 1.5 1.5h3.2c.83 0 1.5-.67 1.5-1.5v-2.28c0-.65.31-1.26.8-1.68C17.18 13.45 18 11.83 18 10c0-3.31-2.69-6-6-6z" className="fill-neutral-900" />
                            <circle cx="9" cy="11.5" r="2.5" className="fill-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] shadow-red-500" stroke="none" />
                            <circle cx="15" cy="11.5" r="2.5" className="fill-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] shadow-red-500" stroke="none" />
                            <path d="M12 14.5l-1 1h2l-1-1z" className="fill-neutral-600" stroke="none" />
                            <path d="M10 17v2" />
                            <path d="M12 17v2" />
                            <path d="M14 17v2" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Content */}
            <h2 className="mb-2 text-3xl font-bold text-white md:text-4xl">
                Halaman Hilang di Angkasa
            </h2>
            <p className="mb-8 max-w-md text-neutral-400">
                nyari apa ka? Cari di halaman <Link href="/search" className="text-white"> Klik Disini</Link>
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                    href="/"
                    className="group relative overflow-hidden rounded-xl bg-white px-8 py-3 text-sm font-bold text-black transition hover:bg-neutral-200"
                >
                    <span className="relative z-10">🏠 Kembali ke Home</span>
                </Link>
                <Link
                    href="/search"
                    className="rounded-xl border border-white/10 bg-white/5 px-8 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                    🔍 Cari Sesuatu
                </Link>
            </div>

            {/* Decorative Elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-[10%] top-[20%] h-2 w-2 rounded-full bg-blue-500 opacity-50 blur-[1px]" />
                <div className="absolute right-[20%] top-[10%] h-3 w-3 rounded-full bg-purple-500 opacity-50 blur-[2px]" />
                <div className="absolute bottom-[20%] left-[30%] h-1 w-1 rounded-full bg-white opacity-30" />
                <div className="absolute bottom-[30%] right-[10%] h-2 w-2 rounded-full bg-yellow-500 opacity-40 blur-[1px]" />
            </div>
        </div>
    );
}
