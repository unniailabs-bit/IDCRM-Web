import React from 'react';
import { DesktopSidebar } from '../components/common/DesktopSidebar';
import { MobileHeader } from '../components/common/MobileHeader';
import { MobileSidebar } from '../components/common/MobileSidebar';
import { InstallPrompt } from '../components/common/InstallPrompt';
import { UserRole } from '../routes/routeConfig';

interface DashboardLayoutProps {
  children: React.ReactNode;
  menuItems: any[]; // Define a proper type for menuItems later
  userRole: UserRole;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  showInstallPrompt: boolean;
  handleInstallClick: () => void;
  handleDismissInstallPrompt: () => void;
}

export function DashboardLayout({
  children,
  menuItems,
  userRole,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  showInstallPrompt,
  handleInstallClick,
  handleDismissInstallPrompt,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DesktopSidebar menuItems={menuItems} userRole={userRole} />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        menuItems={menuItems}
        userRole={userRole}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden">
          <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} userRole={userRole} />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-transparent to-blue-50/20">{children}</main>
      </div>

      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <InstallPrompt onInstall={handleInstallClick} onDismiss={handleDismissInstallPrompt} />
      )}
    </div>
  );
}
