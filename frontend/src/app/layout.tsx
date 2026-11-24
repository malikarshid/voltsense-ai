import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { VehicleProvider } from '@/context/VehicleContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VoltSense AI — Intelligent EV Battery Management & Predictive Health',
  description: 'Enterprise EV Battery Analytics, Real-time Cell Diagnostics, AI Health Prediction & 3D Vehicle Powertrain Digital Twin.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#080D18] text-[#F4F7FB] min-h-screen antialiased`}>
        <VehicleProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col min-w-0">
              <TopNav />
              <main className="flex-1 p-6 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        </VehicleProvider>
      </body>
    </html>
  );
}
