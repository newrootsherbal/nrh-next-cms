// components/blocks/PostCardSkeleton.tsx
import React from 'react';

const PostCardSkeleton: React.FC = () => {
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm bg-card">
      <div className="aspect-video bg-muted animate-pulse"></div>
      <div className="p-4">
        <div className="h-6 bg-muted rounded w-3/4 mb-3 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-full mb-1 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-5/6 mb-3 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
      </div>
    </div>
  );
};

export default PostCardSkeleton;