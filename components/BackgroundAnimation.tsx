export default function BackgroundAnimation() {
    return (
        <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
            {/* Base Background */}
            <div className="absolute inset-0 bg-neutral-950" />

            {/* Grid Pattern */}
            <div 
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
                }}
            />

            {/* Animated Blobs (CSS Animation) */}
            <div className="blob blob-1" />
            <div className="blob blob-2" />
            <div className="blob blob-3" />
        </div>
    );
}
