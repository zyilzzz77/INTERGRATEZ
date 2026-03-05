"use client";

import { showToast } from "@/components/Toast";

export async function downloadMedia(e: React.MouseEvent | null, url: string, filename: string) {
    if (e) e.preventDefault();

    showToast("Mulai mengunduh...", "info");

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

        // Use fetch+blob to force download instead of <a> navigation
        // This avoids 404 issues when the browser opens the URL as a page
        const response = await fetch(finalUrl);

        if (!response.ok) {
            // Fallback: try <a> tag approach if fetch fails
            triggerAnchorDownload(finalUrl, filename);
            return;
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        }, 1000);

        showToast("Download dimulai!", "success");

    } catch (error) {
        console.error("Download error:", error);
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
