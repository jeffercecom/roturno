"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.ok) {
        // cookie se guardó automáticamente
        router.push(data.user?.role === 'ADVISOR' ? '/advisor' : '/admin');
      } else {
        setError(data.error || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error: ' + String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: '4rem auto', padding: '0 1rem' }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 8 }}>Usuario</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ width: '100%', padding: 8, marginBottom: 12, boxSizing: 'border-box' }}
        />

        <label style={{ display: 'block', marginBottom: 8 }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: 8, marginBottom: 12, boxSizing: 'border-box' }}
        />

        <button type="submit" disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer', width: '100%' }}>
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>

      {error && <div style={{ marginTop: 12, color: 'darkred' }}>{error}</div>}

      <hr style={{ margin: '2rem 0' }} />
      <p style={{ fontSize: '0.9rem', color: '#666' }}>
        <strong>Demo credenciales:</strong><br />
        Usuario: <code>owner</code><br />
        Password: <code>ownerpass</code><br />
        Asesor: <code>asesor1</code> / <code>pass1</code><br />
        Admin de sede: <code>admin1</code> / <code>adminpass</code>
      </p>
    </main>
  );
}
