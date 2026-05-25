import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/sidebar';

export const metadata: Metadata = {
  title: 'ACS Inteligente — SMS Rio',
  description: 'Apoio à decisão para Agentes Comunitários de Saúde',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-bg-page text-text antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 px-8 py-6 ml-[240px] min-h-screen overflow-x-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
