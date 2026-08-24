'use client';

import { useState } from 'react';

type Media = { id: string; url: string; mediaType: 'IMAGE' | 'VIDEO'; approved?: boolean; reviewStatus?: string };

export default function MediaCarousel({ media, initialIndex = 0, onClose }: { media: Media[]; initialIndex?: number; onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex);
  if (!media.length) return null;
  const current = media[index];
  const move = (offset: number) => setIndex((value) => (value + offset + media.length) % media.length);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.82)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(event) => event.stopPropagation()} style={{ width: 'min(920px, 96vw)', background: '#111', color: 'white', padding: 16, borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{index + 1} / {media.length}</span>
          <button type="button" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 420, justifyContent: 'center' }}>
          <button type="button" onClick={() => move(-1)} aria-label="Anterior" style={{ fontSize: 28 }}>‹</button>
          {current.mediaType === 'VIDEO' ? <video src={current.url} controls autoPlay style={{ maxWidth: '75vw', maxHeight: '62vh' }} /> : <img src={current.url} alt="Multimedia ampliada" style={{ maxWidth: '75vw', maxHeight: '62vh', objectFit: 'contain' }} />}
          <button type="button" onClick={() => move(1)} aria-label="Siguiente" style={{ fontSize: 28 }}>›</button>
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingTop: 12 }}>
          {media.map((item, itemIndex) => <button key={item.id} type="button" onClick={() => setIndex(itemIndex)} style={{ border: itemIndex === index ? '2px solid #4ade80' : '2px solid transparent', padding: 0, flex: '0 0 auto' }}>
            {item.mediaType === 'VIDEO' ? <video src={item.url} muted style={{ width: 64, height: 80, objectFit: 'cover' }} /> : <img src={item.url} alt="Miniatura" style={{ width: 64, height: 80, objectFit: 'cover' }} />}
          </button>)}
        </div>
      </div>
    </div>
  );
}
