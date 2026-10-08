'use client';

import type { ImgHTMLAttributes } from 'react';

export function SiteImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  return <img {...props} draggable={false} onContextMenu={event => event.preventDefault()} onDragStart={event => event.preventDefault()} />;
}
