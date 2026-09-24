import React from 'react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Potentially a public header/navbar here */}
      <main>{children}</main>
      {/* Potentially a public footer here */}
    </div>
  );
}
