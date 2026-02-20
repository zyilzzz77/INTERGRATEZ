"use client";

export default function SkeletonCard() {
    return (
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
            {/* Thumbnail skeleton */}
            <div className="skeleton h-40 w-full shrink-0 sm:h-32 sm:w-56" />

            {/* Text skeletons */}
            <div className="flex flex-1 flex-col gap-3">
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-4 w-1/3" />
                <div className="skeleton h-4 w-1/2" />
                <div className="mt-auto flex gap-2">
                    <div className="skeleton h-9 w-24 rounded-lg" />
                    <div className="skeleton h-9 w-24 rounded-lg" />
                </div>
            </div>
        </div>
    );
}
