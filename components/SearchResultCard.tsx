"use client";

interface SearchResultCardProps {
    title: string;
    subtitle?: string;
    image?: string;
    url?: string;
    extra?: React.ReactNode;
    actions?: React.ReactNode;
}

export default function SearchResultCard({
    title,
    subtitle,
    image,
    url,
    extra,
    actions,
}: SearchResultCardProps) {
    return (
        <div className="card-hover overflow-hidden rounded-xl border border-gray-900/10 bg-white shadow-sm shadow-sky-100/50">
            {image && (
                <div className="relative overflow-hidden bg-sky-50">
                    <img
                        src={image}
                        alt={title}
                        className="h-40 w-full object-cover transition-transform hover:scale-105"
                    />
                </div>
            )}
            <div className="flex flex-col gap-2 p-4">
                <h4 className="line-clamp-2 text-sm font-bold text-gray-900">{title}</h4>
                {subtitle && (
                    <p className="line-clamp-1 text-xs font-medium text-gray-500">{subtitle}</p>
                )}
                {extra}
                <div className="mt-auto flex items-center gap-2 pt-2">
                    {actions}
                    {url && (
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-shine inline-flex items-center gap-1 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-sky-600"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                            </svg>
                            Download
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
