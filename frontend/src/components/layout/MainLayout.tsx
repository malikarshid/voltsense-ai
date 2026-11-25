'use client';

import React from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSidebarCollapsed } = useVehicle();

  return (
    <div className="flex min-h-screen bg-background text-primary-text">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          isSidebarCollapsed ? 'md:ml-[76px]' : 'md:ml-[250px]'
        }`}
      >
        <TopNav />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
