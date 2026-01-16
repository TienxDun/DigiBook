
import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
    return (
        <div className={`animate-pulse bg-slate-200 rounded ${className}`}></div>
    );
};

export const BookCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col h-full">
            <Skeleton className="aspect-[3/4] w-full rounded-2xl mb-4" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2 mb-4" />
            <div className="mt-auto flex items-center justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
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
