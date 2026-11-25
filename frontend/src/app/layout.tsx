import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { VehicleProvider } from '@/context/VehicleContext';
import { MainLayout } from '@/components/layout/MainLayout';

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
    <html lang="en" data-theme="day" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('voltsense_theme') || 'day';
                document.documentElement.setAttribute('data-theme', theme);
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-background text-primary-text min-h-screen antialiased`}>
        <ThemeProvider>
          <VehicleProvider>
            <MainLayout>{children}</MainLayout>
          </VehicleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
