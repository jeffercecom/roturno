export default function HomePage() {
  return (
    <main style={{ maxWidth: 760, margin: '3rem auto', padding: '0 1rem' }}>
      <h1>Asesores</h1>
      <p>Gestión de disponibilidad de asesores.</p>
      <ul>
        <li><a href="/advisors/register">Registro de asesor</a></li>
        <li><a href="/login">Iniciar sesión</a></li>
        <li><a href="/advisor">Dashboard de asesor</a></li>
        <li><a href="/admin">Panel administrativo (propietario)</a></li>
        <li><a href="/disponibilidad">Ver disponibilidad pública</a></li>
        <li><a href="/api/public/disponibilidad">API pública de disponibilidad</a> (JSON)</li>
      </ul>
    </main>
  );
}
