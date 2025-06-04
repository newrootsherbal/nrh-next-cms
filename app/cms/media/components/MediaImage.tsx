// app/cms/media/components/MediaImage.tsx
"use client";

import React from 'react';
import Image from 'next/image';

interface MediaImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL?: string | null;
  className?: string;
  priority?: boolean; // Optional: to allow prioritizing critical images
}

const MediaImage: React.FC<MediaImageProps> = ({
  src,
  alt,
  width,
  height,
  blurDataURL,
  className,
  priority = false
}) => {
  // Basic error handling: if src is missing, or width/height are invalid, render a placeholder or nothing.
  // next/image will throw an error if width/height are 0 or not numbers.
  if (!src || !width || !height || width <= 0 || height <= 0) {
    // You could return a placeholder component here if desired
    // For now, returning null or a simple div to indicate an issue.
    return <div className={`bg-muted text-muted-foreground flex items-center justify-center ${className || ''}`} style={{width: width || 100, height: height || 100}}>Invalid Image</div>;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      placeholder={blurDataURL ? 'blur' : 'empty'}
      blurDataURL={blurDataURL || undefined}
      priority={priority}
      // onError can be used, but it's more for logging or setting a state
      // It doesn't allow changing the src directly like the old img tag.
      // For a visual fallback, you'd typically handle it outside or use a wrapper.
    />
  );
};

export default MediaImage;