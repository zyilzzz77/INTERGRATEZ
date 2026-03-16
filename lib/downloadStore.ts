"use client";

// ── Reactive Download Store ──
// Lightweight pub/sub store to track active downloads across components.

export type DownloadStatus = "downloading" | "done" | "error";

export interface DownloadItem {
    id: string;
    filename: string;
    progress: number;       // 0–100
    status: DownloadStatus;
    loaded: number;         // bytes loaded
    total: number;          // total bytes (0 if unknown)
    startedAt: number;
}

type Listener = () => void;

let downloads: DownloadItem[] = [];
const listeners = new Set<Listener>();

function emit() {
    listeners.forEach((l) => l());
}

/** Subscribe to store changes. Returns unsubscribe function. */
export function subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** Get current snapshot of downloads */
export function getDownloads(): DownloadItem[] {
    return downloads;
}

/** Add a new download entry */
export function addDownload(id: string, filename: string): void {
    downloads = [
        ...downloads,
        { id, filename, progress: 0, status: "downloading", loaded: 0, total: 0, startedAt: Date.now() },
    ];
    emit();
}

/** Update progress for a download */
export function updateDownload(id: string, loaded: number, total: number): void {
    downloads = downloads.map((d) =>
        d.id === id
            ? { ...d, loaded, total, progress: total > 0 ? Math.round((loaded / total) * 100) : 0 }
            : d
    );
    emit();
}

/** Mark a download as done */
export function finishDownload(id: string): void {
    downloads = downloads.map((d) =>
        d.id === id ? { ...d, status: "done", progress: 100 } : d
    );
    emit();
}

/** Mark a download as error */
export function errorDownload(id: string): void {
    downloads = downloads.map((d) =>
        d.id === id ? { ...d, status: "error" } : d
    );
    emit();
}

/** Remove a download item from the list */
export function removeDownload(id: string): void {
    downloads = downloads.filter((d) => d.id !== id);
    emit();
}

/** Clear all completed/errored downloads */
export function clearFinished(): void {
    downloads = downloads.filter((d) => d.status === "downloading");
    emit();
}
