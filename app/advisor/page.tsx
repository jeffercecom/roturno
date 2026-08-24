'use client';

import { useEffect, useState } from 'react';
import MediaCarousel from '@/components/MediaCarousel';
import PhotoCapture from '@/components/PhotoCapture';

export default function AdvisorPage() {
  const [data, setData] = useState<any>(null);
  const [offices, setOffices] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [section, setSection] = useState('overview');
  const [historyMode, setHistoryMode] = useState('daily');
  const [carousel, setCarousel] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [presentation, setPresentation] = useState('');
  const [newMedia, setNewMedia] = useState<any[]>([]);
  const [newSpeciality, setNewSpeciality] = useState('');
  const [profile, setProfile] = useState<any>({ inPerson: false, virtual: false, atHome: false, age: '', eyeColor: '', skinColor: '', hairColor: '', hairType: '', heightCm: '', customAttributes: [] });

  async function load() {
    const [profileResponse, officesResponse, historyResponse] = await Promise.all([fetch('/api/advisor/me'), fetch('/api/offices'), fetch(`/api/advisor/history?mode=${historyMode}`)]);
    setData(await profileResponse.json());
    setOffices((await officesResponse.json()).data || []);
    setHistory((await historyResponse.json()).data || []);
  }

  useEffect(() => { load(); }, [historyMode]);

  async function togglePresence() {
    const result = await (await fetch('/api/advisor/presence', { method: 'POST' })).json();
    setMessage(result.ok ? (result.action === 'checkin' ? 'Turno abierto.' : 'Turno cerrado.') : result.error);
    if (result.ok) load();
  }

  async function requestOfficeChange(officeId: string) {
    const result = await (await fetch('/api/advisor/office-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ officeId }) })).json();
    setMessage(result.ok ? 'Solicitud enviada. Espera aprobación.' : result.error);
    if (result.ok) load();
  }

  async function toggleSpeciality(id: string, active: boolean) {
    await fetch('/api/advisor/speciality-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ advisorSpecialityId: id, active }) });
    load();
  }

  async function savePresentation() {
    const result = await (await fetch('/api/advisor/presentation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ presentation }) })).json();
    setMessage(result.ok ? 'Presentación enviada para aprobación.' : result.error);
    if (result.ok) load();
  }

  async function addMedia() {
    const result = await (await fetch('/api/advisor/media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ media: newMedia }) })).json();
    setMessage(result.ok ? 'Multimedia enviada para aprobación.' : result.error);
    if (result.ok) { setNewMedia([]); load(); }
  }

  async function addSpeciality() {
    const result = await (await fetch('/api/advisor/speciality', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSpeciality }) })).json();
    setMessage(result.ok ? 'Especialidad enviada para aprobación.' : result.error);
    if (result.ok) { setNewSpeciality(''); load(); }
  }

  async function saveProfile() {
    const result = await (await fetch('/api/advisor/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) })).json();
    setMessage(result.ok ? 'Perfil actualizado.' : result.error);
    if (result.ok) load();
  }

  if (!data) return <main style={{ padding: '2rem' }}>Cargando...</main>;
  if (!data.ok) return <main style={{ padding: '2rem' }}>No autorizado. <a href="/login">Inicia sesión</a>.</main>;
  const advisor = data.advisor;
  const active = advisor.presences?.[0]?.status === 'ACTIVE';
  const approvedMedia = advisor.photos.filter((media: any) => media.reviewStatus === 'APPROVED' || media.approved);
  const rejectedMedia = advisor.photos.filter((media: any) => media.reviewStatus === 'REJECTED');
  const approvedSpecialities = advisor.specialities.filter((item: any) => item.reviewStatus === 'APPROVED' && item.activeByAdvisor && !item.hiddenByOwner);
  const rejectedSpecialities = advisor.specialities.filter((item: any) => item.reviewStatus === 'REJECTED' || !item.activeByAdvisor || item.hiddenByOwner);
  const profileValues = { ...profile, ...advisor, customAttributes: advisor.customAttributes || [] };

  return (
    <main style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ position: 'fixed', top: 0, left: 220, right: 0, zIndex: 10, padding: 10, background: '#111', color: 'white' }}>Usuario: {data.user.username} en {advisor.office?.name || 'sin sede'}</div>
      <aside style={{ width: 220, padding: 16, borderRight: '1px solid #ddd' }}>
        <h1 style={{ fontSize: 20 }}>Asesor</h1>
        <button type="button" onClick={togglePresence} style={{ width: '100%', padding: 14, marginBottom: 16, fontWeight: 700 }}>{active ? 'Cerrar turno' : 'Abrir turno'}</button>
        {['overview', 'multimedia', 'office', 'specialities', 'history'].map((item) => <button key={item} type="button" onClick={() => setSection(item)} style={{ display: 'block', width: '100%', padding: 10, textAlign: 'left' }}>{item === 'overview' ? 'Resumen' : item === 'multimedia' ? 'Multimedia' : item === 'office' ? 'Sede' : item === 'specialities' ? 'Especialidades' : 'Historial de turnos'}</button>)}
      </aside>
      <section style={{ flex: 1, maxWidth: 1000, padding: '2rem' }}>
        <h2>{advisor.name}</h2>
        <p>Usuario: {data.user.username} | Perfil: {advisor.approved ? 'Aprobado' : 'Pendiente'}</p>
        <p>Presentación: {advisor.presentation || 'Pendiente de completar'} ({advisor.presentationStatus || 'PENDING'})</p>
        {message && <p>{message}</p>}
        {section === 'overview' && <div><p>Sede actual: {advisor.office?.name || 'Sin sede asignada'}</p><p>Turno: {active ? 'ACTIVO' : 'AÚN NO ACTIVO'}</p><p>Especialidades aprobadas: {approvedSpecialities.map((item: any) => item.speciality.name).join(', ') || 'Ninguna'}</p><textarea value={presentation || advisor.presentation || ''} onChange={(event) => setPresentation(event.target.value)} disabled={advisor.presentationStatus === 'APPROVED'} maxLength={500} /><button type="button" onClick={savePresentation} disabled={advisor.presentationStatus === 'APPROVED'}>Guardar presentación</button><h3>Perfil físico y atención</h3>{[['inPerson', 'Presencial'], ['virtual', 'Virtual'], ['atHome', 'Domicilio']].map(([key, label]) => <label key={key} style={{ marginRight: 10 }}><input type="checkbox" checked={Boolean(profileValues[key])} onChange={(e) => setProfile({ ...profileValues, [key]: e.target.checked })} /> {label}</label>)}<div>{Object.entries({ age: 'Edad', eyeColor: 'Color de ojos', skinColor: 'Color de piel', hairColor: 'Color de cabello', hairType: 'Tipo de cabello', heightCm: 'Estatura (cm)' }).map(([key, label]) => <label key={key} style={{ display: 'block', marginTop: 6 }}>{label}<input value={(profileValues as any)[key] || ''} onChange={(e) => setProfile({ ...profileValues, [key]: e.target.value })} /></label>)}</div><button type="button" onClick={saveProfile}>Guardar perfil</button></div>}
        {section === 'multimedia' && <div><h3>Aprobados</h3><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{approvedMedia.map((media: any, index: number) => <button key={media.id} type="button" onClick={() => setCarousel({ media: approvedMedia, index })}>{media.mediaType === 'VIDEO' ? <video src={media.url} muted style={{ width: 110, height: 138, objectFit: 'cover' }} /> : <img src={media.url} alt="Aprobada" style={{ width: 110, height: 138, objectFit: 'cover' }} />}</button>)}</div><PhotoCapture onImage={(media) => setNewMedia((items) => [...items, media])} /><button type="button" onClick={addMedia} disabled={!newMedia.length}>Agregar multimedia</button><h3>Rechazados</h3><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{rejectedMedia.map((media: any) => <div key={media.id}>{media.mediaType === 'VIDEO' ? <video src={media.url} controls style={{ width: 110, height: 138, objectFit: 'cover' }} /> : <img src={media.url} alt="Rechazada" style={{ width: 110, height: 138, objectFit: 'cover' }} />}<small>❌ Rechazada</small></div>)}</div></div>}
        {section === 'office' && <div><h3>Sedes disponibles</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>{offices.map((office) => <button key={office.id} type="button" disabled={active || office.id === advisor.officeId} onClick={() => requestOfficeChange(office.id)} style={{ minHeight: 130, border: office.id === advisor.officeId ? '3px solid #22c55e' : '2px solid #aaa', background: office.id === advisor.officeId ? '#f0fff4' : 'white', borderRadius: 8, padding: 16, textAlign: 'left' }}><strong>{office.name}</strong><p>{office.id === advisor.officeId ? 'Sede actual' : 'Solicitar cambio'}</p></button>)}</div></div>}
        {section === 'specialities' && <div><h3>Aprobadas</h3><input value={newSpeciality} onChange={(event) => setNewSpeciality(event.target.value)} placeholder="Nueva especialidad" /><button type="button" onClick={addSpeciality}>Agregar</button><table><tbody>{approvedSpecialities.map((item: any) => <tr key={item.id}><td style={{ padding: 8 }}>{item.speciality.name}</td><td><button type="button" onClick={() => toggleSpeciality(item.id, false)}>Desactivar</button></td></tr>)}</tbody></table><h3>Rechazadas u ocultas</h3><table><tbody>{rejectedSpecialities.map((item: any) => <tr key={item.id}><td style={{ padding: 8 }}>{item.speciality.name}</td><td>❌</td></tr>)}</tbody></table></div>}
        {section === 'history' && <div><select value={historyMode} onChange={(event) => setHistoryMode(event.target.value)}><option value="daily">Diario</option><option value="weekly">Semanal</option><option value="monthly">Mensual</option></select><table style={{ width: '100%', marginTop: 16 }}><thead><tr><th>Fecha</th><th>Ingreso</th><th>Salida</th><th>Total</th></tr></thead><tbody>{history.map((row) => { const minutes = row.checkInAt && row.checkOutAt ? Math.round((new Date(row.checkOutAt).getTime() - new Date(row.checkInAt).getTime()) / 60000) : 0; return <tr key={row.id}><td>{new Date(row.date).toLocaleDateString()}</td><td>{row.checkInAt ? new Date(row.checkInAt).toLocaleTimeString() : '-'}</td><td>{row.checkOutAt ? new Date(row.checkOutAt).toLocaleTimeString() : '-'}</td><td>{Math.floor(minutes / 60)}h {minutes % 60}m</td></tr>; })}</tbody></table></div>}
      </section>
      {carousel && <MediaCarousel media={carousel.media} initialIndex={carousel.index} onClose={() => setCarousel(null)} />}
    </main>
  );
}
