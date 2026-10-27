'use client';

import type { VideoHTMLAttributes } from 'react';

export function SiteVideo(props: VideoHTMLAttributes<HTMLVideoElement>) {
  return <video {...props} disablePictureInPicture draggable={false} onContextMenu={event => event.preventDefault()} onDragStart={event => event.preventDefault()} />;
}
