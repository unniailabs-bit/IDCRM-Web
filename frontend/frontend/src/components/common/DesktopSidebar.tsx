import React from 'react';
import { LucideIcon, UserCircle, LogOut, ChevronRight, KeyRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { UserRole } from '../../routes/routeConfig';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './LanguageSelector';
import { ChangePasswordDialog } from './ChangePasswordDialog';

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

interface DesktopSidebarProps {
  menuItems: MenuItem[];
  userRole: UserRole;
}

export function DesktopSidebar({ menuItems, userRole }: DesktopSidebarProps) {
  const { logout, userData } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [openPopover, setOpenPopover] = React.useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false);

  const getRoleLabel = (role: UserRole) => {
    return t(`roles.${role}`, 'Admin');
  };

  const getUserName = () => {
    if (userData?.name) {
      return userData.name;
    }
    if (userData?.trust_name) {
      return userData.trust_name;
    }
    if (userData?.username) {
      return userData.username;
    }
    return 'Admin User';
  };

  return (
    <aside
      className={`w-72 ${userRole === 'teacher'
        ? 'bg-indigo-50 border-indigo-200'
        : userRole === 'super-admin'
          ? 'bg-orange-50 border-orange-200'
          : userRole === 'school-admin'
            ? 'bg-violet-50 border-violet-200'
            : 'bg-gray-100 border-gray-300'
        } backdrop-blur-md border-r-2 flex flex-col h-full shadow-xl`}
    >
      <div
        className={`border-b-2 ${userRole === 'teacher'
          ? 'border-indigo-200'
          : userRole === 'super-admin'
            ? 'border-orange-200'
            : userRole === 'school-admin'
              ? 'border-violet-200'
              : 'border-gray-300'
          } flex items-center`}
      >
        <img
          src="/asha-logo.png"
          alt="Asha edge Softwares"
          className="h-auto w-auto object-contain max-w-full transition-transform duration-300 hover:scale-105"
        />
      </div>

      <nav
        className={`flex-1 p-4 overflow-y-auto scrollbar-thin ${userRole === 'teacher'
          ? 'scrollbar-thumb-indigo-200'
          : userRole === 'super-admin'
            ? 'scrollbar-thumb-orange-200'
            : userRole === 'school-admin'
              ? 'scrollbar-thumb-violet-200'
              : 'scrollbar-thumb-gray-300'
          } scrollbar-track-transparent`}
      >
        <ul className="space-y-1.5">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            // Define active and hover styles based on role
            const activeStyle =
              userRole === 'teacher'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : userRole === 'super-admin'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                  : userRole === 'school-admin'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                    : 'bg-green-600 text-white shadow-lg shadow-green-500/30';

            const hoverStyle =
              userRole === 'teacher'
                ? 'text-indigo-900 hover:bg-indigo-100/80 hover:text-indigo-900'
                : userRole === 'super-admin'
                  ? 'text-orange-900 hover:bg-orange-100/80 hover:text-orange-900'
                  : userRole === 'school-admin'
                    ? 'text-violet-900 hover:bg-violet-100/80 hover:text-violet-900'
                    : 'text-gray-700 hover:bg-gray-200/80 hover:text-gray-900';

            return (
              <li
                key={item.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Link
                  to={item.path}
                  className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? activeStyle : hoverStyle
                    }`}
                >
                  <Icon
                    className={`w-6 h-6 transition-transform duration-200 ${isActive
                      ? 'text-white'
                      : userRole === 'teacher'
                        ? 'group-hover:text-indigo-700 group-hover:scale-115'
                        : userRole === 'super-admin'
                          ? 'group-hover:text-orange-700 group-hover:scale-115'
                          : userRole === 'school-admin'
                            ? 'group-hover:text-violet-700 group-hover:scale-115'
                            : 'group-hover:text-green-700 group-hover:scale-115'
                      }`}
                  />
                  <span className="text-sm font-medium">{t(`menu.${item.id}`)}</span>
                  {isActive && <ChevronRight className="w-6 h-6 text-white ml-auto" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        className={`p-4 border-t-2 ${userRole === 'teacher'
          ? 'border-indigo-200 from-indigo-200'
          : userRole === 'super-admin'
            ? 'border-orange-200 from-orange-200'
            : userRole === 'school-admin'
              ? 'border-violet-200 from-violet-200'
              : 'border-gray-300 from-gray-200'
          } bg-gradient-to-t to-transparent`}
      >
        <Popover onOpenChange={setOpenPopover}>
          <PopoverTrigger asChild>
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white cursor-pointer ${openPopover ? 'bg-white' : ''
                } transition-all duration-200 group`}
            >
              <div
                className={`w-10 h-10 rounded-full ${openPopover
                  ? 'bg-gradient-to-br from-orange-600 to-orange-500'
                  : userRole === 'teacher'
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-600'
                    : userRole === 'super-admin'
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                      : userRole === 'school-admin'
                        ? 'bg-gradient-to-br from-violet-500 to-violet-600'
                        : 'bg-gradient-to-br from-green-500 to-green-600'
                  }  group-hover:bg-gradient-to-br group-hover:from-orange-600 group-hover:to-orange-500 transition-colors duration-200 flex items-center justify-center shadow-md group-hover:shadow-lg `}
              >
                <UserCircle className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p
                  className="text-sm font-semibold text-gray-900 truncate w-full"
                  title={getUserName()}
                >
                  {getUserName()}
                </p>
                <p className="text-xs text-gray-500 font-medium">{getRoleLabel(userRole)}</p>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-56 p-2 shadow-xl border-gray-200"
            sideOffset={12}
            align="end"
          >
            <div className="p-2 border-b border-gray-200 mb-1 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 px-2 py-1 ">{t('common.account')}</p>
              <LanguageSelector />
            </div>
            <div className="space-y-1">
              {(userRole === 'platform-admin' || userRole === 'super-admin') && (
                <Button
                  variant="ghost"
                  className="cursor-pointer w-full justify-start gap-3 h-10 hover:bg-orange-50 hover:text-orange-600 focus-visible:ring-0 focus-visible:border-none transition-colors"
                  onClick={() => setIsPasswordDialogOpen(true)}
                >
                  <KeyRound className="w-4 h-4 ml-0.5" />
                  <span className="text-sm font-medium">{t('common.changePassword')}</span>
                </Button>
              )}
              <Button
                variant="ghost"
                className="cursor-pointer w-full justify-start gap-3 h-10 hover:bg-red-50 hover:text-red-600 focus-visible:ring-0 focus-visible:border-none transition-colors"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 ml-0.5" />
                <span className="text-sm font-medium">{t('common.signOut')}</span>
              </Button>
            </div>
            <ChangePasswordDialog
              isOpen={isPasswordDialogOpen}
              onClose={() => setIsPasswordDialogOpen(false)}
              userRole={userRole}
            />
          </PopoverContent>
        </Popover>
      </div>
    </aside>
  );
}
