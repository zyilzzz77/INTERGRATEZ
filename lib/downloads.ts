import { showToast } from "@/components/Toast";

export async function downloadMedia(e: React.MouseEvent | null, url: string, filename: string) {
    if (e) e.preventDefault();
    
    showToast("Sedang mendownload...", "info");

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Download failed");
        
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
        
        showToast("Sukses mendownload!", "success");
    } catch (error) {
        console.error(error);
        showToast("Gagal mendownload otomatis. Membuka di tab baru...", "error");
        // Fallback
        window.open(url, '_blank');
    }
}
