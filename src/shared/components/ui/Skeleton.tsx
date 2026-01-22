
import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
    return (
        <div className={`animate-shimmer rounded ${className}`}></div>
    );
};

export const BookCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col h-[330px]">
            <Skeleton className="h-[180px] w-full rounded-xl mb-3" />
            <div className="space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-3 w-1/2 mt-1 mb-auto" />

            <div className="pt-2 border-t border-slate-50 mt-2 flex items-end justify-between">
                <div className="flex flex-col gap-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
        </div>
    );
};

export const AdminRowSkeleton: React.FC = () => {
    return (
        <div className="flex items-center gap-4 py-4 px-6 border-b border-slate-50">
            <Skeleton className="w-12 h-16 rounded-lg" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="w-20 h-8 rounded-full" />
        </div>
    );
};

export const BookDetailsSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden flex flex-col lg:flex-row">
                    <div className="w-full lg:w-1/2 p-8 lg:p-16 bg-slate-50 flex items-center justify-center">
                        <Skeleton className="w-full max-w-[400px] aspect-[3/4] rounded-2xl shadow-2xl" />
                    </div>
                    <div className="w-full lg:w-1/2 p-8 lg:p-16">
                        <Skeleton className="h-4 w-24 rounded-full mb-6" />
                        <Skeleton className="h-12 w-3/4 mb-4" />
                        <Skeleton className="h-6 w-1/2 mb-8" />
                        <div className="flex gap-4 mb-12">
                            <Skeleton className="h-12 w-32 rounded-xl" />
                            <Skeleton className="h-12 w-32 rounded-xl" />
                        </div>
                        <div className="space-y-4 mb-12">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                        <div className="flex items-center justify-between mb-8">
                            <Skeleton className="h-10 w-40" />
                            <Skeleton className="h-12 w-32 rounded-2xl" />
                        </div>
                        <Skeleton className="h-16 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        </div>
    );
};
