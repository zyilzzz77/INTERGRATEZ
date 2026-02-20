import { showToast } from "@/components/Toast";

export async function downloadMedia(e: React.MouseEvent | null, url: string, filename: string) {
    if (e) e.preventDefault();
    
    showToast("Mulai mengunduh...", "info");

    try {
        // Construct proxy URL to ensure correct headers and avoid CORS
        // This forces the browser to handle the download instead of playing it
        const isAlreadyProxy = url.includes("/api/proxy-download");
        let finalUrl = url;

        if (!isAlreadyProxy) {
            finalUrl = `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&download=true`;
        } else {
            // Append params if missing
            const urlObj = new URL(url, window.location.origin);
            urlObj.searchParams.set("download", "true");
            if (!urlObj.searchParams.has("filename")) {
                urlObj.searchParams.set("filename", filename);
            }
            finalUrl = urlObj.toString();
        }

        // Trigger download via invisible anchor tag
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = finalUrl;
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
        }, 100);

    } catch (error) {
        console.error("Download error:", error);
        showToast("Gagal memulai download otomatis.", "error");
        // Fallback: open in new tab if something really weird happens
        window.open(url, '_blank');
    }
}
