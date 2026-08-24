"use client";

import React, { useEffect, useState } from 'react';
import MediaCarousel from '@/components/MediaCarousel';

type Speciality = { id: string; name: string };
type Photo = { id: string; url: string; isMain: boolean; approved: boolean; reviewStatus?: string; mediaType: 'IMAGE' | 'VIDEO' };
type Advisor = {
  id: string;
  userId: string;
  name: string;
  presentation?: string | null;
  presentationStatus?: string;
  approved: boolean;
  officeId: string | null;
  photos: Photo[];
  specialities: any[];
  user: { username?: string; email: string; blocked?: boolean };
  office: { name: string } | null;
  presences: any[];
};
type Office = { id: string; name: string };

export default function AdminPage() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState<string | null>(null);
  const [selectedOffice, setSelectedOffice] = useState<string | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [officeSelections, setOfficeSelections] = useState<Record<string, string>>({});
  const [officeRequests, setOfficeRequests] = useState<any[]>([]);
  const [pendingSpecialities, setPendingSpecialities] = useState<Speciality[]>([]);
  const [officeSettings, setOfficeSettings] = useState<any[]>([]);
  const [newAccount, setNewAccount] = useState({ username: '', password: '', name: '', role: 'ADVISOR', officeId: '' });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [section, setSection] = useState('active');
  const [carousel, setCarousel] = useState<{ media: Photo[]; index: number } | null>(null);
  const [presentationDrafts, setPresentationDrafts] = useState<Record<string, string>>({});
  const [newOffice, setNewOffice] = useState({ name: '', address: '', adminUserId: '' });
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', minutes: '60', price: '0' });

  const getMainPhoto = (a: Advisor) => a.photos.find((p) => p.isMain && p.approved)?.url ?? a.photos.find((p) => p.approved)?.url ?? null;

  async function approvePhoto(photoId: string, approved: boolean) {
    const response = await fetch('/api/admin/photo-approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId, approved }),
    });
    const result = await response.json();
    setMessage(result.ok ? (approved ? 'Foto aprobada.' : 'Foto rechazada.') : 'Error: ' + (result.error || 'desconocido'));
    if (result.ok) setAdvisors((items) => items.map((advisor) => ({ ...advisor, photos: advisor.photos.map((photo) => photo.id === photoId ? { ...photo, approved, reviewStatus: approved ? 'APPROVED' : 'REJECTED' } : photo) })));
  }

  async function reviewPresentation(advisorId: string, action: 'APPROVED' | 'REJECTED') {
    const response = await fetch('/api/admin/presentation-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ advisorId, presentation: presentationDrafts[advisorId], action }) });
    const result = await response.json();
    setMessage(result.ok ? 'Presentación actualizada.' : 'Error: ' + (result.error || 'desconocido'));
    if (result.ok) setAdvisors((items) => items.map((advisor) => advisor.id === advisorId ? { ...advisor, presentation: result.advisor.presentation, presentationStatus: action } : advisor));
  }

  function PhotoGallery({ advisor }: { advisor: Advisor }) {
    const visiblePhotos = advisor.photos.filter((photo) => photo.reviewStatus !== 'REJECTED');
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {visiblePhotos.map((photo, index) => (
          <div key={photo.id} style={{ position: 'relative', width: 100, height: 125 }}>
            {photo.mediaType === 'VIDEO' ? <video src={photo.url} controls style={{ width: 100, height: 125, objectFit: 'cover', borderRadius: 4 }} /> : <img src={photo.url} alt={`${advisor.name} foto`} style={{ width: 100, height: 125, objectFit: 'cover', borderRadius: 4 }} />}
            <button type="button" onClick={() => setCarousel({ media: visiblePhotos, index })} title="Ampliar multimedia" style={{ position: 'absolute', top: 4, right: 4, cursor: 'pointer' }}>⤢</button>
            {user?.role === 'OWNER' && !photo.approved && <button type="button" onClick={() => approvePhoto(photo.id, true)} style={{ display: 'block', marginTop: 4, fontSize: 11 }}>✅</button>}
            {user?.role === 'OWNER' && <button type="button" onClick={() => approvePhoto(photo.id, false)} style={{ display: 'block', marginTop: 4, fontSize: 11 }}>❌</button>}
            <small style={{ display: 'block', color: photo.approved ? 'green' : '#a60' }}>{photo.approved ? 'Aprobada' : 'Pendiente'}</small>
          </div>
        ))}
      </div>
    );
  }

  useEffect(() => {
    (async () => {
      // check auth
      const me = await fetch('/api/auth/me').then((r) => r.json());
      if (!me.ok || !['OWNER', 'OFFICE_ADMIN'].includes(me.user?.role)) {
        setMessage('No autorizado.');
        setLoading(false);
        return;
      }
      setUser(me.user);

      // load data
      const [advRes, offRes, requestRes, specialityRes, settingsRes, usersRes, categoryRes] = await Promise.all([
        fetch('/api/admin/advisors-all').then((r) => r.json()),
        fetch('/api/offices').then((r) => r.json()),
        fetch('/api/admin/office-requests').then((r) => r.json()),
        fetch('/api/admin/specialities').then((r) => r.json()),
        fetch('/api/admin/offices/settings').then((r) => r.json()),
        fetch('/api/admin/users').then((r) => r.json()),
        fetch('/api/admin/service-categories').then((r) => r.json()),
      ]);

      setAdvisors(advRes.data || []);
      setOffices(offRes.data || []);
      setOfficeRequests(requestRes.data || []);
      setPendingSpecialities(me.user.role === 'OWNER' ? specialityRes.data || [] : []);
      setOfficeSettings(settingsRes.data || []);
      setAccounts(usersRes.data || []);
      setCategories(categoryRes.data || []);
      setLoading(false);
    })();
  }, []);

  async function approve(advisorId: string) {
    setMessage(null);
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advisorId }),
      });
      const data = await res.json();
      if (data.ok) {
        setAdvisors((a) =>
          a.map((x) =>
            x.id === advisorId
              ? {
                  ...x,
                  approved: true,
                  photos: x.photos.some((p) => p.isMain)
                    ? x.photos
                    : x.photos.length > 0
                      ? [{ ...x.photos[0], isMain: true }, ...x.photos.slice(1)]
                      : x.photos,
                }
              : x
          )
        );
        setMessage('Asesor aprobado. Las fotos se aprueban por separado.');
      } else {
        setMessage('Error: ' + (data.error || 'desconocido'));
      }
    } catch (err) {
      setMessage('Error: ' + String(err));
    }
  }

  async function reviewOfficeRequest(requestId: string, action: 'APPROVE' | 'REJECT') {
    const res = await fetch('/api/admin/office-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action }),
    });
    const data = await res.json();
    setMessage(data.ok ? 'Solicitud de sede actualizada.' : 'Error: ' + (data.error || 'desconocido'));
    if (data.ok) setOfficeRequests((requests) => requests.filter((request) => request.id !== requestId));
  }

  async function approveSpeciality(specialityId: string) {
    const res = await fetch('/api/admin/specialities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specialityId }),
    });
    const data = await res.json();
    setMessage(data.ok ? 'Especialidad aprobada.' : 'Error: ' + (data.error || 'desconocido'));
    if (data.ok) setPendingSpecialities((items) => items.filter((item) => item.id !== specialityId));
  }

  async function reviewAdvisorSpeciality(advisorSpecialityId: string, action: 'APPROVED' | 'REJECTED') {
    const response = await fetch('/api/admin/speciality-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ advisorSpecialityId, action }) });
    const result = await response.json();
    setMessage(result.ok ? 'Especialidad actualizada.' : 'Error: ' + (result.error || 'desconocido'));
    if (result.ok) setAdvisors((items) => items.map((advisor) => ({ ...advisor, specialities: advisor.specialities.map((item: any) => item.id === advisorSpecialityId ? { ...item, reviewStatus: action } : item) })));
  }

  async function createAccount() {
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAccount) });
    const data = await res.json();
    setMessage(data.ok ? 'Cuenta creada.' : 'Error: ' + (data.error || 'desconocido'));
    if (data.ok) setNewAccount({ username: '', password: '', name: '', role: 'ADVISOR', officeId: '' });
  }

  async function saveOfficeSettings(office: any) {
    const res = await fetch('/api/admin/offices/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ officeId: office.id, autoCloseAtEndOfDay: !office.continuous24Hours, openingTime: office.openingTime, closingTime: office.closingTime }) });
    const data = await res.json();
    setMessage(data.ok ? 'Horario de sede actualizado.' : 'Error: ' + (data.error || 'desconocido'));
    if (data.ok) setOfficeSettings((items) => items.map((item) => item.id === office.id ? data.office : item));
  }

  async function closeShift(advisorId: string) {
    const res = await fetch('/api/admin/presence-close', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ advisorId }) });
    const data = await res.json();
    setMessage(data.ok ? 'Turno cerrado manualmente.' : 'Error: ' + (data.error || 'desconocido'));
    if (data.ok) setAdvisors((items) => items.map((item) => item.id === advisorId ? { ...item, presences: item.presences.map((presence: any) => ({ ...presence, status: 'INACTIVE' })) } : item));
  }

  async function toggleOffice(officeId: string, open: boolean) {
    const response = await fetch('/api/admin/offices/open', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ officeId, open }) });
    const result = await response.json();
    setMessage(result.ok ? (open ? 'Sede abierta.' : 'Sede cerrada y turnos finalizados.') : 'Error: ' + (result.error || 'desconocido'));
    if (result.ok) setOfficeSettings((items) => items.map((item) => item.id === officeId ? { ...item, openToday: open } : item));
  }

  async function createOffice() {
    const result = await (await fetch('/api/admin/offices/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newOffice) })).json();
    setMessage(result.ok ? 'Sede creada.' : 'Error: ' + (result.error || 'desconocido'));
    if (result.ok) { setOffices((items) => [...items, result.office]); setOfficeSettings((items) => [...items, result.office]); setNewOffice({ name: '', address: '', adminUserId: '' }); }
  }

  async function createCategory() {
    const result = await (await fetch('/api/admin/service-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCategory.name, durations: [{ minutes: newCategory.minutes, price: newCategory.price }] }) })).json();
    setMessage(result.ok ? 'Categoría creada.' : 'Error: ' + (result.error || 'desconocido'));
    if (result.ok) { setCategories((items) => [...items, result.category]); setNewCategory({ name: '', minutes: '60', price: '0' }); }
  }

  async function blockUser(userId: string) {
    const res = await fetch('/api/admin/users/block', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
    const data = await res.json();
    setMessage(data.ok ? 'Usuario bloqueado.' : 'Error: ' + (data.error || 'desconocido'));
    if (data.ok) setAccounts((items) => items.map((item) => item.id === userId ? { ...item, blocked: true } : item));
  }

  async function unblockUser(userId: string) {
    const res = await fetch('/api/admin/users/unblock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
    const data = await res.json();
    setMessage(data.ok ? 'Usuario desbloqueado.' : 'Error: ' + (data.error || 'desconocido'));
    if (data.ok) setAccounts((items) => items.map((item) => item.id === userId ? { ...item, blocked: false } : item));
  }

  async function assign(advisorId: string, officeId: string) {
    if (!officeId) {
      setMessage('Selecciona una oficina.');
      return;
    }

    const advisor = advisors.find((a) => a.id === advisorId);
    const hasActivePresence = advisor?.presences?.some(
      (presence: any) => presence.status === 'ACTIVE' && new Date(presence.date).toDateString() === new Date().toDateString()
    );

    if (hasActivePresence) {
      setMessage('No se puede cambiar la sede porque el asesor está en turno ACTIVO.');
      return;
    }

    setMessage(null);
    try {
      const res = await fetch('/api/admin/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advisorId, officeId }),
      });
      const data = await res.json();
      if (data.ok) {
        setAdvisors((a) =>
          a.map((x) =>
            x.id === advisorId
              ? {
                  ...x,
                  officeId,
                  office: offices.find((o) => o.id === officeId) || null,
                }
              : x
          )
        );
        setSelectedAdvisor(null);
        setSelectedOffice(null);
        setOfficeSelections((prev) => ({ ...prev, [advisorId]: officeId }));
        setMessage('Asesor asignado a oficina.');
      } else {
        setMessage('Error: ' + (data.error || 'desconocido'));
      }
    } catch (err) {
      setMessage('Error: ' + String(err));
    }
  }

  if (loading) return <main style={{ padding: '2rem' }}>Cargando...</main>;
  if (!user) return <main style={{ padding: '2rem' }}>{message}</main>;

  const unapproved = advisors.filter((a) => !a.approved);
  const approvedWithoutOffice = advisors.filter((a) => a.approved && !a.officeId);
  const approvedWithOffice = advisors.filter((a) => a.approved && a.officeId);
  const blockedAdvisors = advisors.filter((a) => a.user?.blocked);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      <h1>Panel Administrativo</h1>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, padding: 10, background: '#111', color: 'white' }}>Usuario: {user.username || user.email} {user.role === 'OWNER' ? 'en todas las sedes' : `en ${user.officeName || 'su sede'}`}</div>
      {message && <div style={{ padding: 12, marginBottom: 16, backgroundColor: '#f0f0f0', borderRadius: 4 }}>{message}</div>}

      <section style={{ marginBottom: 32 }}>
        <h2>Crear cuenta manual</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input placeholder="Usuario" value={newAccount.username} onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })} />
          <input placeholder="Contraseña" value={newAccount.password} onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })} />
          <input placeholder="Nombre" value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} />
          <select value={newAccount.role} onChange={(e) => setNewAccount({ ...newAccount, role: e.target.value })}>
            <option value="ADVISOR">Asesor</option>
            {user.role === 'OWNER' && <option value="OFFICE_ADMIN">Admin de sede</option>}
            {user.role === 'OFFICE_ADMIN' && <option value="OFFICE_ADMIN">Admin suplente</option>}
          </select>
          <select value={newAccount.officeId} onChange={(e) => setNewAccount({ ...newAccount, officeId: e.target.value })}><option value="">Sede</option>{offices.map((office) => <option key={office.id} value={office.id}>{office.name}</option>)}</select>
          <button type="button" onClick={createAccount}>Crear</button>
        </div>
      </section>

      {user.role === 'OWNER' && <section style={{ marginBottom: 32 }}>
        <h2>Sedes</h2>
        <input placeholder="Nombre de sede" value={newOffice.name} onChange={(e) => setNewOffice({ ...newOffice, name: e.target.value })} />
        <input placeholder="Dirección" value={newOffice.address} onChange={(e) => setNewOffice({ ...newOffice, address: e.target.value })} />
        <select value={newOffice.adminUserId} onChange={(e) => setNewOffice({ ...newOffice, adminUserId: e.target.value })}><option value="">Sin admin</option>{accounts.filter((account) => account.role === 'OFFICE_ADMIN').map((account) => <option key={account.id} value={account.id}>{account.username || account.email}</option>)}</select>
        <button type="button" onClick={createOffice}>Crear sede</button>
      </section>}

      <section style={{ marginBottom: 32 }}>
        <h2>Configuración de sedes</h2>
        {officeSettings.map((office) => <div key={office.id} style={{ padding: 10, borderBottom: '1px solid #ddd' }}>
          <strong>{office.name}</strong>
          <button type="button" onClick={() => toggleOffice(office.id, !office.openToday)} style={{ marginLeft: 12 }}>{office.openToday ? 'Cerrar sede' : 'Abrir sede'}</button>
          <label style={{ marginLeft: 12 }}>Desde <input type="time" value={office.openingTime || '00:00'} onChange={(e) => setOfficeSettings((items) => items.map((item) => item.id === office.id ? { ...item, openingTime: e.target.value } : item))} /></label>
          <label style={{ marginLeft: 12 }}>Hasta <input type="time" value={office.closingTime || '23:59'} onChange={(e) => setOfficeSettings((items) => items.map((item) => item.id === office.id ? { ...item, closingTime: e.target.value } : item))} /></label>
          {user.role === 'OWNER' && <>
          <label style={{ marginLeft: 12 }}><input type="radio" name={`close-policy-${office.id}`} checked={!office.continuous24Hours} onChange={() => setOfficeSettings((items) => items.map((item) => item.id === office.id ? { ...item, continuous24Hours: false } : item))} /> Cerrar turno automáticamente al terminar el día</label>
          <label style={{ marginLeft: 12 }}><input type="radio" name={`close-policy-${office.id}`} checked={office.continuous24Hours} onChange={() => setOfficeSettings((items) => items.map((item) => item.id === office.id ? { ...item, continuous24Hours: true } : item))} /> Nunca cerrar turno automáticamente</label>
          <button type="button" onClick={() => saveOfficeSettings(office)} style={{ marginLeft: 12 }}>Guardar horario</button>
          </>}
        </div>)}
      </section>

      <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid #ddd', paddingBottom: 12, marginBottom: 20 }}>
        <button type="button" onClick={() => setSection('active')}>Asesores / Activos ({approvedWithOffice.length})</button>
        <button type="button" onClick={() => setSection('pending')}>Pendientes ({unapproved.length})</button>
        <button type="button" onClick={() => setSection('blocked')}>Bloqueados ({accounts.filter((account) => account.blocked && account.role === 'ADVISOR').length})</button>
        <button type="button" onClick={() => setSection('office-admins')}>Admin de sede</button>
        <button type="button" onClick={() => setSection('substitutes')}>Admin suplente</button>
        <button type="button" onClick={() => setSection('offices')}>Sedes +</button>
        <button type="button" onClick={() => setSection('specialities')}>Especialidades +</button>
        {user.role === 'OWNER' && <button type="button" onClick={() => setSection('categories')}>Categorías +</button>}
      </nav>

      {carousel && <MediaCarousel media={carousel.media} initialIndex={carousel.index} onClose={() => setCarousel(null)} />}

      {expandedPhoto && (
        <div
          onClick={() => setExpandedPhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              type="button"
              onClick={() => setExpandedPhoto(null)}
              style={{ position: 'absolute', top: 12, right: 12, cursor: 'pointer' }}
            >
              ✕
            </button>
            <img src={expandedPhoto} alt="Foto ampliada" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} />
          </div>
        </div>
      )}

      {section === 'specialities' && <section style={{ marginBottom: 32 }}>
        <h2>Especialidades pendientes ({pendingSpecialities.length})</h2>
        {pendingSpecialities.map((speciality) => (
          <div key={speciality.id} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
            <span>{speciality.name}</span>
            {user?.role === 'OWNER' && <button type="button" onClick={() => approveSpeciality(speciality.id)}>Aprobar especialidad</button>}
          </div>
        ))}
        {pendingSpecialities.length === 0 && <p>No hay especialidades pendientes.</p>}
      </section>}

      {section === 'categories' && user.role === 'OWNER' && <section><h2>Categorías de servicio</h2><input placeholder="Nombre" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} /><input type="number" placeholder="Minutos" value={newCategory.minutes} onChange={(e) => setNewCategory({ ...newCategory, minutes: e.target.value })} /><input type="number" step="0.01" placeholder="Precio" value={newCategory.price} onChange={(e) => setNewCategory({ ...newCategory, price: e.target.value })} /><button type="button" onClick={createCategory}>Crear categoría</button>{categories.map((category) => <div key={category.id}><strong>{category.name}</strong>{category.durations.map((duration: any) => <span key={duration.id}> {duration.minutes} min: ${duration.price}</span>)}<select defaultValue="" onChange={(e) => e.target.value && fetch('/api/admin/service-categories', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ advisorId: e.target.value, categoryId: category.id }) }).then(() => setMessage('Categoría asignada.'))}><option value="">Asignar asesor</option>{advisors.map((advisor) => <option key={advisor.id} value={advisor.id}>{advisor.name}</option>)}</select></div>)}</section>}

      {section === 'active' && <section style={{ marginBottom: 32 }}>
        <h2>Cambios de sede pendientes ({officeRequests.length})</h2>
        {officeRequests.map((request) => (
          <div key={request.id} style={{ padding: 12, background: '#f9f9f9', marginBottom: 8 }}>
            <strong>{request.advisor.name}</strong>: {request.fromOffice?.name || 'Sin sede'} {'->'} {request.toOffice.name}
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => reviewOfficeRequest(request.id, 'APPROVE')}>Aprobar cambio</button>
              <button type="button" onClick={() => reviewOfficeRequest(request.id, 'REJECT')}>Rechazar</button>
            </div>
          </div>
        ))}
        {officeRequests.length === 0 && <p>No hay cambios de sede pendientes.</p>}
      </section>}

      {/* Unapproved */}
      {section === 'pending' && <section style={{ marginBottom: 32 }}>
        <h2>Asesores pendientes de aprobación ({unapproved.length})</h2>
        <h3>Presentaciones sin aprobar</h3>
        {unapproved.filter((advisor) => advisor.presentationStatus !== 'APPROVED').map((advisor) => <div key={`presentation-${advisor.id}`} style={{ marginBottom: 8 }}><strong>{advisor.name}</strong><p style={{ whiteSpace: 'pre-wrap' }}>{advisor.presentation || 'Sin presentación'}</p><button type="button" onClick={() => reviewPresentation(advisor.id, 'APPROVED')}>✅</button><button type="button" onClick={() => reviewPresentation(advisor.id, 'REJECTED')}>❌</button></div>)}
        {unapproved.length === 0 ? (
          <p>Ninguno.</p>
        ) : (
          <div>
            {unapproved.map((a) => {
              const photo = getMainPhoto(a);
              return (
                <div key={a.id} style={{ marginBottom: 20, padding: 12, backgroundColor: '#f9f9f9', borderRadius: 4, display: 'flex', gap: 16 }}>
                  <PhotoGallery advisor={a} />
                  <div style={{ flex: 1 }}>
                    <strong>{a.name}</strong>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: 4 }}>Especialidades: {a.specialities.map((s: any) => s.speciality.name).join(', ')}</div>
                    <textarea value={presentationDrafts[a.id] ?? a.presentation ?? ''} onChange={(e) => setPresentationDrafts((drafts) => ({ ...drafts, [a.id]: e.target.value }))} maxLength={500} placeholder="Presentación profesional" style={{ width: '100%', marginTop: 8 }} />
                    <div>Presentación: {a.presentationStatus || 'PENDING'} <button type="button" onClick={() => reviewPresentation(a.id, 'APPROVED')}>✅</button> <button type="button" onClick={() => reviewPresentation(a.id, 'REJECTED')}>❌</button></div>
                    {a.specialities.filter((s: any) => s.reviewStatus === 'PENDING').map((item: any) => <div key={item.id} style={{ marginTop: 6 }}><span>{item.speciality.name}</span> <button type="button" onClick={() => reviewAdvisorSpeciality(item.id, 'APPROVED')}>✅</button> <button type="button" onClick={() => reviewAdvisorSpeciality(item.id, 'REJECTED')}>❌</button></div>)}
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: 4 }}>Fotos: {a.photos.length}</div>
                    {user?.role === 'OWNER' && <button onClick={() => approve(a.id)} style={{ marginTop: 8, padding: '6px 12px', cursor: 'pointer' }}>
                      Aprobar
                    </button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>}

      {/* Approved without office */}
      {section === 'pending' && <section style={{ marginBottom: 32 }}>
        <h2>Asesores aprobados sin oficina ({approvedWithoutOffice.length})</h2>
        {approvedWithoutOffice.length === 0 ? (
          <p>Ninguno.</p>
        ) : (
          <div>
            {approvedWithoutOffice.map((a) => {
              const photo = getMainPhoto(a);
              const selectedValue = officeSelections[a.id] ?? '';
              return (
                <div key={a.id} style={{ marginBottom: 16, padding: 12, backgroundColor: '#f9f9f9', borderRadius: 4, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <PhotoGallery advisor={a} />
                  <div style={{ flex: 1 }}>
                    <strong>{a.name}</strong>
                    <div style={{ marginTop: 8 }}>
                      <select
                        value={selectedValue}
                        onChange={(e) => {
                          setSelectedAdvisor(a.id);
                          setSelectedOffice(e.target.value);
                          setOfficeSelections((prev) => ({ ...prev, [a.id]: e.target.value }));
                        }}
                        style={{ padding: 6, marginRight: 8 }}
                      >
                        <option value="">Selecciona oficina</option>
                        {offices.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => assign(a.id, selectedValue || selectedOffice || '')}
                        style={{ padding: '6px 12px', cursor: 'pointer' }}
                      >
                        Asignar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>}

      {/* Approved with office */}
      {section === 'active' && <section>
        <h2>Asesores activos ({approvedWithOffice.length})</h2>
        {approvedWithOffice.length === 0 ? (
          <p>Ninguno.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Fotos</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Nombre</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Oficina</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Turno hoy</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Cambiar sede</th>
              </tr>
            </thead>
            <tbody>
              {approvedWithOffice.map((a) => {
                const hasPresenceToday = a.presences.some((presence: any) => presence.status === 'ACTIVE' && new Date(presence.date).toDateString() === new Date().toDateString());
                const currentOfficeValue = officeSelections[a.id] ?? a.officeId ?? '';
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 8 }}>
                      {getMainPhoto(a) && <button type="button" onClick={() => setCarousel({ media: a.photos.filter((photo) => photo.approved), index: Math.max(0, a.photos.findIndex((photo) => photo.isMain && photo.approved)) })} style={{ position: 'relative', padding: 0, border: 0, background: 'transparent' }}>
                        <img src={getMainPhoto(a)!} alt={a.name} style={{ width: 54, height: 68, objectFit: 'cover', borderRadius: 4 }} />
                        {a.photos.filter((photo) => photo.approved).length > 1 && <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'white', background: 'rgba(0,0,0,0.38)', fontWeight: 700 }}>+{a.photos.filter((photo) => photo.approved).length - 1}</span>}
                      </button>}
                    </td>
                    <td style={{ padding: 8 }}>{a.name}<br /><small>Usuario: {a.user?.username || a.user?.email}</small></td>
                    <td style={{ padding: 8 }}>{a.office?.name}</td>
                    <td style={{ padding: 8, color: hasPresenceToday ? 'green' : 'gray' }}>
                      {hasPresenceToday ? '✓ ACTIVO' : '— Inactivo'}
                      {hasPresenceToday && <button type="button" onClick={() => closeShift(a.id)} style={{ marginLeft: 8 }}>Cerrar</button>}
                    </td>
                    <td style={{ padding: 8 }}>
                      {hasPresenceToday ? (
                        <span style={{ color: '#b00' }}>Bloqueado: ACTIVO</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <select
                            value={currentOfficeValue}
                            onChange={(e) => {
                              const value = e.target.value;
                              setOfficeSelections((prev) => ({ ...prev, [a.id]: value }));
                            }}
                            style={{ padding: 6 }}
                          >
                            <option value="">Selecciona oficina</option>
                            {offices.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => assign(a.id, currentOfficeValue)}
                            style={{ padding: '6px 12px', cursor: 'pointer' }}
                          >
                            Cambiar sede
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>}

      {section === 'blocked' && <section>
        <h2>Asesores bloqueados ({blockedAdvisors.length})</h2>
        {blockedAdvisors.length === 0 ? <p>No hay asesores bloqueados.</p> : blockedAdvisors.map((a) => <div key={a.id} style={{ padding: 12, borderBottom: '1px solid #ddd' }}><strong>{a.name}</strong> <span>({a.user?.username || a.user?.email || 'sin usuario'})</span> <span>Bloqueado</span> {user?.role === 'OWNER' && <button type="button" onClick={() => unblockUser(a.userId)}>Desbloquear</button>}</div>)}
      </section>}
    </main>
  );
}
