export default function BackgroundAnimation() {
    return (
        <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
            {/* Plain solid background — theme-aware */}
            <div className="absolute inset-0 bg-background" />
        </div>
    );
}
