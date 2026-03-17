"use client";

import { showToast } from "@/components/Toast";
import {
    addDownload, updateDownload, finishDownload, errorDownload,
} from "@/lib/downloadStore";

import { isAndroid } from "@/lib/capacitor";

let dlCounter = 0;

export async function downloadMedia(e: React.MouseEvent | null, url: string, filename: string) {
    if (e) e.preventDefault();

    const dlId = `dl-${Date.now()}-${++dlCounter}`;
    addDownload(dlId, filename);

    if (isAndroid()) {
        try {
            const isAlreadyProxy = url.includes("/api/proxy-download") || url.includes("/api/convert-m3u8");
            let finalUrl = url;
            if (!isAlreadyProxy) {
                finalUrl = window.location.origin + `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&download=true`;
            } else if (!url.startsWith('http')) {
                finalUrl = window.location.origin + url;
            }
            
            triggerAnchorDownload(finalUrl, filename);
            finishDownload(dlId);
            return;
        } catch (error) {
            errorDownload(dlId);
            showToast("Gagal memulai unduhan", "error");
            return;
        }
    }

    try {
        const isAlreadyProxy = url.includes("/api/proxy-download") || url.includes("/api/convert-m3u8");
        let finalUrl = url;

        if (!isAlreadyProxy) {
            finalUrl = `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&download=true`;
        } else {
            const urlObj = new URL(url, window.location.origin);
            urlObj.searchParams.set("download", "true");
            if (!urlObj.searchParams.has("filename")) {
                urlObj.searchParams.set("filename", filename);
            }
            finalUrl = urlObj.toString();
        }

        const response = await fetch(finalUrl);

        if (!response.ok) {
            errorDownload(dlId);
            triggerAnchorDownload(finalUrl, filename);
            return;
        }

        // Read the stream to track progress
        const contentLength = response.headers.get("content-length");
        const total = contentLength ? parseInt(contentLength, 10) : 0;

        if (response.body) {
            const reader = response.body.getReader();
            const chunks: Uint8Array[] = [];
            let loaded = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                loaded += value.length;
                updateDownload(dlId, loaded, total);
            }

            // Combine chunks into a single blob
            const blob = new Blob(chunks as BlobPart[]);

            // Fix MIME type based on extension
            const ext = filename.split('.').pop()?.toLowerCase();
            const mimeMap: Record<string, string> = {
                mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg',
                webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg',
                png: 'image/png', gif: 'image/gif', pdf: 'application/pdf',
                zip: 'application/zip', m4a: 'audio/mp4', aac: 'audio/aac',
            };
            const correctType = ext && mimeMap[ext] ? mimeMap[ext] : blob.type;
            const typedBlob = blob.type === 'application/octet-stream' && correctType !== blob.type
                ? new Blob(chunks as BlobPart[], { type: correctType })
                : blob;

            const blobUrl = URL.createObjectURL(typedBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            a.setAttribute('download', filename);
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            }, 1000);
        } else {
            // Fallback: no ReadableStream support
            const blob = await response.blob();
            const ext = filename.split('.').pop()?.toLowerCase();
            const mimeMap: Record<string, string> = {
                mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg',
                webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg',
                png: 'image/png', gif: 'image/gif', pdf: 'application/pdf',
                zip: 'application/zip', m4a: 'audio/mp4', aac: 'audio/aac',
            };
            const correctType = ext && mimeMap[ext] ? mimeMap[ext] : blob.type;
            const typedBlob = blob.type === 'application/octet-stream' && correctType !== blob.type
                ? new Blob([blob], { type: correctType })
                : blob;

            const blobUrl = URL.createObjectURL(typedBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            a.setAttribute('download', filename);
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            }, 1000);
        }

        finishDownload(dlId);

    } catch (error) {
        console.error("Download error:", error);
        errorDownload(dlId);
        // Last resort fallback: try direct <a> tag
        try {
            const isAlreadyProxy = url.includes("/api/proxy-download") || url.includes("/api/convert-m3u8");
            let finalUrl = url;
            if (!isAlreadyProxy) {
                finalUrl = `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&download=true`;
            }
            triggerAnchorDownload(finalUrl, filename);
        } catch {
            showToast("Gagal memulai download otomatis.", "error");
        }
    }
}

function triggerAnchorDownload(url: string, filename: string) {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.setAttribute('download', filename);
    a.target = '_self';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 100);
}
