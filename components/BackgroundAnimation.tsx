"use client";

import { usePathname } from "next/navigation";

export default function BackgroundAnimation() {
    const pathname = usePathname();
    const isDramaPage = /\/(dramawave|melolo|netshort|dramabox|stardusttv)(\/|$)/.test(pathname);

    if (isDramaPage) {
        return (
            <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
                <div className="absolute inset-0" style={{ background: 'var(--drama-bg)' }} />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-background" />
        </div>
    );
}

