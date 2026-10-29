import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'PharmaAcademic AI | Investigación con criterio', description: 'Herramientas académicas para evaluar títulos de tesis, documentar criterios y consultar fuentes científicas reales.' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="es"><body>{children}</body></html>;
}
