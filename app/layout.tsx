import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Asesores',
  description: 'Gestión de disponibilidad de asesores',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
