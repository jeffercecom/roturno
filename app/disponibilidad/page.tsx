"use client";

import { useEffect, useState } from 'react';

type OfficeGroup = { id: string; name: string; advisors: { id: string; name: string; photos: { id: string; url: string; mediaType: 'IMAGE' | 'VIDEO'; isMain: boolean }[]; specialities: string[] }[] };

export default function DisponibilidadPage() {
  const [list, setList] = useState<OfficeGroup[] | null>(null);
  const [officeId, setOfficeId] = useState('');

  useEffect(() => {
    fetch('/api/public/disponibilidad')
      .then((r) => r.json())
      .then((d) => setList(d.data || []))
      .catch(() => setList([]));
  }, []);

  return (
    <main style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <h2>Asesores disponibles</h2>
      {!list ? (
        <p>Cargando...</p>
      ) : list.length === 0 ? (
        <p>No hay asesores disponibles.</p>
      ) : (
        <div><nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>{list.map((office) => <button type="button" key={office.id} onClick={() => setOfficeId(office.id)}>{office.name}</button>)}</nav>{list.filter((office) => !officeId || office.id === officeId).map((office) => <section key={office.id}><h3>{office.name}</h3><ul>{office.advisors.map((a) => (
            <li key={a.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {a.photos.map((media) => media.mediaType === 'VIDEO' ? <video key={media.id} src={media.url} controls style={{ width: 100, height: 125, objectFit: 'cover' }} /> : <img key={media.id} src={media.url} alt={a.name} style={{ width: 80, height: 100, objectFit: 'cover' }} />)}
              </div>
              <strong>{a.name}</strong>
              <div>{a.specialities.join(', ')}</div>
            </li>))}</ul></section>)}</div>
      )}
    </main>
  );
}
