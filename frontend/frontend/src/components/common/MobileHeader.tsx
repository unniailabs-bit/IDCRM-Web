import React from 'react';
import { Menu, UserCircle } from 'lucide-react';
import { UserRole } from '../../routes/routeConfig';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from 'react-i18next';

interface MobileHeaderProps {
  onMenuClick: () => void;
  userRole: UserRole;
}

export function MobileHeader({ onMenuClick, userRole }: MobileHeaderProps) {
  const { t } = useTranslation();
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/60 px-4 py-0 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <button
        onClick={onMenuClick}
        className="p-2 -ml-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-200"
        aria-label={t('common.openMenu', 'Open menu')}
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      <div className="flex items-center gap-2 w-full justify-center">
        <img src="/asha-logo.png" alt="Asha Softwares" className="h-auto w-1/3 object-contain" />
      </div>

      <div className="flex items-center gap-2">
        <LanguageSelector />
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
          <UserCircle className="w-5 h-5 text-white" />
        </div>
      </div>
    </header>
  );
}
