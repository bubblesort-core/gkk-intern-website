import React from 'react';

const SkeletonLoader: React.FC = () => {
    return (
        <div className="w-full h-full min-h-screen bg-[var(--bg-primary)] p-8 flex flex-col justify-center items-center overflow-hidden">
            <div className="max-w-6xl w-full space-y-12 animate-pulse">
                {/* Header / Title area skeleton */}
                <div className="flex flex-col items-center space-y-4">
                    <div className="h-12 bg-[var(--bg-surface)] rounded w-1/3 md:w-1/4"></div>
                    <div className="h-4 bg-[var(--bg-surface)] rounded w-1/2 md:w-1/3"></div>
                </div>

                {/* Content area skeleton - grid layout simulation */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full mt-12">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex flex-col space-y-4 p-6 bg-[var(--bg-surface)] rounded-xl shadow-sm h-64 border border-[var(--border)]">
                            <div className="h-32 bg-[var(--bg-elevated)] rounded-lg w-full"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-[var(--bg-elevated)] rounded w-3/4"></div>
                                <div className="h-3 bg-[var(--bg-elevated)] rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SkeletonLoader;
