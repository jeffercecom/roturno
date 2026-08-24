"use client";

import React, { useEffect, useState } from 'react';
import PhotoCapture from '@/components/PhotoCapture';

type Speciality = { id: string; name: string };
type UploadedMedia = { url: string; mediaType: 'IMAGE' | 'VIDEO' };

export default function AdvisorRegisterPage() {
  const [name, setName] = useState('');
  const [presentation, setPresentation] = useState('');
  const [attention, setAttention] = useState({ inPerson: false, virtual: false, atHome: false });
  const [physical, setPhysical] = useState({ age: '', eyeColor: '', skinColor: '', hairColor: '', hairType: '', heightCm: '' });
  const [attributes, setAttributes] = useState<{ name: string; value: string }[]>([]);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [customSpeciality, setCustomSpeciality] = useState('');
  const [customSpecialities, setCustomSpecialities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<UploadedMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/specialities')
      .then((r) => r.json())
      .then((d) => setSpecialities(d.data || []))
      .catch(() => setSpecialities([]));
  }, []);

  function toggleSpec(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  function handleImage(media: UploadedMedia) {
    setPhotos((p) => [...p, media]);
  }

  function addCustomSpeciality() {
    const value = customSpeciality.trim();
    if (value && !customSpecialities.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setCustomSpecialities((items) => [...items, value]);
    }
    setCustomSpeciality('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const specialityIds = Object.keys(selected).filter((k) => selected[k]);
    try {
      const res = await fetch('/api/advisors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, presentation, username, email: email || null, password, ...attention, ...physical, customAttributes: attributes, specialityIds, customSpecialities, photos }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage('Registro enviado. El perfil quedará pendiente de aprobación.');
        setName('');
        setPresentation('');
        setAttention({ inPerson: false, virtual: false, atHome: false });
        setPhysical({ age: '', eyeColor: '', skinColor: '', hairColor: '', hairType: '', heightCm: '' });
        setAttributes([]);
        setUsername('');
        setEmail('');
        setPassword('');
        setSelected({});
        setCustomSpecialities([]);
        setPhotos([]);
        window.location.href = '/advisor';
      } else {
        setMessage('Error: ' + (data.error || 'unknown'));
      }
    } catch (err) {
      setMessage('Error: ' + String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Registro de Asesor</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 8 }}>Nombre (no subir contacto)</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: 8, marginBottom: 12 }} />

        <label style={{ display: 'block', marginBottom: 8 }}>Presentación profesional</label>
        <textarea value={presentation} onChange={(e) => setPresentation(e.target.value)} required maxLength={500} placeholder="Describe brevemente tu perfil profesional" style={{ width: '100%', minHeight: 100, padding: 8, marginBottom: 12 }} />

        <label style={{ display: 'block', marginBottom: 8 }}>Usuario para iniciar sesión</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: 8, marginBottom: 12 }} />

        <label style={{ display: 'block', marginBottom: 8 }}>Email opcional</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 12 }} />

        <label style={{ display: 'block', marginBottom: 8 }}>Contraseña</label>
        <input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: 8, marginBottom: 12 }} />

        <fieldset><legend>Tipo de atención</legend>{[['inPerson', 'Presencial'], ['virtual', 'Virtual'], ['atHome', 'Domicilio']].map(([key, label]) => <label key={key} style={{ marginRight: 12 }}><input type="checkbox" checked={(attention as any)[key]} onChange={(e) => setAttention({ ...attention, [key]: e.target.checked })} /> {label}</label>)}</fieldset>

        <fieldset><legend>Condición física</legend>{Object.entries({ age: 'Edad', eyeColor: 'Color de ojos', skinColor: 'Color de piel', hairColor: 'Color de cabello', hairType: 'Tipo de cabello', heightCm: 'Estatura (cm)' }).map(([key, label]) => <label key={key} style={{ display: 'block', marginTop: 6 }}>{label}<input value={(physical as any)[key]} onChange={(e) => setPhysical({ ...physical, [key]: e.target.value })} style={{ marginLeft: 8 }} /></label>)}</fieldset>

        <fieldset><legend>Atributos personalizados</legend>{attributes.map((attribute, index) => <div key={index}><input placeholder="Atributo" value={attribute.name} onChange={(e) => setAttributes((items) => items.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} /><input placeholder="Valor" value={attribute.value} onChange={(e) => setAttributes((items) => items.map((item, i) => i === index ? { ...item, value: e.target.value } : item))} /></div>)}<button type="button" onClick={() => setAttributes((items) => [...items, { name: '', value: '' }])}>Agregar atributo</button></fieldset>

        <div style={{ marginBottom: 12 }}>
          <strong>Especialidades (elige al menos una)</strong>
          <div style={{ marginTop: 8 }}>
            {specialities.length === 0 ? (
              <div>Cargando especialidades...</div>
            ) : (
              specialities.map((s) => (
                <label key={s.id} style={{ display: 'block', marginBottom: 6 }}>
                  <input type="checkbox" checked={!!selected[s.id]} onChange={() => toggleSpec(s.id)} /> {s.name}
                </label>
              ))
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              value={customSpeciality}
              onChange={(e) => setCustomSpeciality(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomSpeciality();
                }
              }}
              placeholder="Escribe otra especialidad y pulsa Enter"
              style={{ flex: 1, padding: 8 }}
            />
          </div>
          {customSpecialities.map((speciality) => (
            <div key={speciality} style={{ marginTop: 6 }}>
              {speciality} <button type="button" onClick={() => setCustomSpecialities((items) => items.filter((item) => item !== speciality))}>Quitar</button>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 12 }}>
          <strong>Fotos</strong>
          <PhotoCapture onImage={handleImage} />
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {photos.map((p, i) => (
              p.mediaType === 'VIDEO'
                ? <video key={i} src={p.url} controls style={{ width: 100, height: 125, objectFit: 'cover', borderRadius: 4 }} />
                : <img key={i} src={p.url} alt={`preview-${i}`} style={{ width: 100, height: 125, objectFit: 'cover', borderRadius: 4 }} />
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading || name.trim() === ''} style={{ padding: '8px 16px' }}>
          {loading ? 'Enviando...' : 'Enviar registro'}
        </button>
      </form>
      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </main>
  );
}
