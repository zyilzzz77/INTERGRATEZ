import { showToast } from "@/components/Toast";

export async function downloadMedia(e: React.MouseEvent | null, url: string, filename: string) {
    if (e) e.preventDefault();
    
    showToast("Mulai mengunduh...", "info");

    try {
        const isAlreadyProxy = url.includes("/api/proxy-download");
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

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = finalUrl;
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
        }, 100);

    } catch (error) {
        console.error("Download error:", error);
        showToast("Gagal memulai download otomatis.", "error");
        window.open(url, '_blank');
    }
}
