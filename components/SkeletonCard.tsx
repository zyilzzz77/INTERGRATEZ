import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SkeletonCard() {
    return (
        <Card className="mx-auto w-full max-w-2xl overflow-hidden border-white/10 bg-white/5 backdrop-blur-sm shadow-xl">
            <div className="flex flex-col sm:flex-row">
                {/* Thumbnail Skeleton */}
                <div className="relative shrink-0 sm:w-56">
                    <Skeleton className="h-48 w-full sm:h-full rounded-none" />
                </div>

                {/* Info Skeleton */}
                <div className="flex flex-1 flex-col p-4 gap-4">
                    <CardHeader className="p-0 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    
                    <CardContent className="p-0 grow space-y-2">
                        <div className="flex flex-col gap-2 mt-2">
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-1/3" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 mt-4">
                            <Skeleton className="h-9 w-full" />
                            <Skeleton className="h-9 w-full" />
                            <Skeleton className="h-9 w-full" />
                        </div>
                    </CardContent>
                </div>
            </div>
        </Card>
    );
}
