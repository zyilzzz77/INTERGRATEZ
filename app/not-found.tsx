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
                    <div className="float-anim rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 p-6 text-6xl shadow-2xl shadow-orange-500/20">
                        🛸
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
