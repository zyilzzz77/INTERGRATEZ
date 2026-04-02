"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Activity, DownloadCloud, History, Link2, RefreshCw, UserCircle2 } from "lucide-react";
import UrlInput from "@/components/UrlInput";

interface StatusPayload {
  online: boolean;
  status?: number;
  latencyMs?: number;
  error?: string;
}

export default function BotTeleMiniApp({ lang }: { lang: string }) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [platform, setPlatform] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const userId = searchParams.get("user_id") || searchParams.get("id") || "-";
  const fullName = searchParams.get("name") || searchParams.get("full_name") || "Pengguna Telegram";
  const username = searchParams.get("username") ? `@${searchParams.get("username")}` : "-";
  const usageCount = Number(searchParams.get("usage") || searchParams.get("count") || 0);

  const subtitle = useMemo(() => {
    return lang === "id"
      ? "Pantau status downloader dan jalankan mini apps langsung dari Telegram."
      : "Monitor downloader status and run the mini app directly from Telegram.";
  }, [lang]);

  useEffect(() => {
    const fetchStatus = async () => {
      setStatusLoading(true);
      try {
        const res = await fetch("/api/downloader-status", { cache: "no-store" });
        const data = await res.json();
        setStatus({
          online: Boolean(data.online),
          status: data.status,
          latencyMs: data.latencyMs,
          error: data.error,
        });
      } catch (error) {
        setStatus({ online: false, error: error instanceof Error ? error.message : "unknown" });
      } finally {
        setLastChecked(new Date());
        setStatusLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const statusLabel = status?.online ? "Online" : "Offline";
  const statusBadge = status?.online ? "bg-emerald-400 text-black" : "bg-red-400 text-black";
  const latencyText = status?.latencyMs ? `${status.latencyMs} ms` : "-";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border-[3px] border-black bg-white p-6 shadow-neo lg:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Mini Apps • Telegram</p>
            <h1 className="text-3xl font-black text-neutral-900 md:text-4xl">Bot Telegram Downloader</h1>
            <p className="mt-2 text-neutral-600">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border-[3px] border-black bg-neutral-100 px-4 py-3 shadow-neo-sm">
            <Activity className="h-5 w-5" />
            <div className="text-sm font-semibold text-neutral-800">
              Status Downloader: <span className={`ml-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${statusBadge}`}>{statusLabel}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border-[3px] border-black bg-[#f8f8ff] p-4 shadow-neo-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-800">
                <DownloadCloud className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">Kirim Link ke Bot</p>
                  <p className="text-xs text-neutral-500">Tempel URL dari Telegram WebApp dan proses langsung.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Link2 className="h-4 w-4" />
                <span>Platform: {platform || "-"}</span>
              </div>
            </div>
            <UrlInput onResult={() => { }} onLoading={setLoading} onPlatform={(value) => setPlatform(value)} />
            {loading && <p className="mt-3 text-sm font-semibold text-neutral-700">Sedang memproses link...</p>}
          </div>

          <div className="rounded-2xl border-[3px] border-black bg-white p-4 shadow-neo-sm">
            <div className="flex items-center gap-2 text-neutral-800">
              <UserCircle2 className="h-5 w-5" />
              <p className="text-sm font-semibold">Profil Telegram</p>
            </div>
            <div className="mt-3 space-y-2 text-sm text-neutral-700">
              <div className="flex items-center justify-between">
                <span>ID</span>
                <span className="font-semibold text-neutral-900">{userId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Nama</span>
                <span className="font-semibold text-neutral-900">{fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Username</span>
                <span className="font-semibold text-neutral-900">{username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1"><History className="h-4 w-4" /> Pemakaian</span>
                <span className="font-semibold text-neutral-900">{usageCount.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border-[3px] border-black bg-white p-4 shadow-neo-sm">
          <div className="flex items-center gap-2 text-neutral-800">
            <Activity className="h-5 w-5" />
            <p className="text-sm font-semibold">Status Downloader</p>
          </div>
          <div className="mt-3 space-y-1 text-sm text-neutral-700">
            <p className="font-semibold text-neutral-900">{statusLabel}</p>
            <p>HTTP: {status?.status ?? "-"}</p>
            <p>Latency: {latencyText}</p>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <RefreshCw className="h-4 w-4" />
              <span>{statusLoading ? "Mengecek..." : lastChecked ? lastChecked.toLocaleTimeString() : "-"}</span>
            </div>
            {!status?.online && status?.error && (
              <p className="text-xs font-semibold text-red-600">{status.error}</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border-[3px] border-black bg-white p-4 shadow-neo-sm">
          <div className="flex items-center gap-2 text-neutral-800">
            <History className="h-5 w-5" />
            <p className="text-sm font-semibold">Riwayat Ringkas</p>
          </div>
          <div className="mt-3 space-y-1 text-sm text-neutral-700">
            <p className="font-semibold text-neutral-900">{usageCount.toLocaleString("id-ID")}</p>
            <p className="text-neutral-500">Jumlah penggunaan mini apps di bot ini.</p>
            <p className="text-xs text-neutral-500">Data dikirim dari Telegram WebApp query string.</p>
          </div>
        </div>

        <div className="rounded-2xl border-[3px] border-black bg-white p-4 shadow-neo-sm">
          <div className="flex items-center gap-2 text-neutral-800">
            <Link2 className="h-5 w-5" />
            <p className="text-sm font-semibold">Cara Pakai</p>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-neutral-700 list-disc list-inside">
            <li>Buka bot Telegram dan tap tombol "Mini Apps".</li>
            <li>Bot otomatis meneruskan data user (ID, nama, username, riwayat).</li>
            <li>Tempel URL di kolom di atas, pilih format, unduh di bot.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
