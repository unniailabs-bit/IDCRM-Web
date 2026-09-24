import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function LanguageSelector() {
    const { i18n, t } = useTranslation();

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'Hindi (हिंदी)' },
        { code: 'mr', name: 'Marathi (मराठी)' },
    ];

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const currentLanguageName = languages.find((l) => l.code === i18n.language)?.name || 'English';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-slate-600">
                    <Languages className="h-4 w-4" />
                    <span className="hidden sm:inline">{currentLanguageName}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map((lng) => (
                    <DropdownMenuItem
                        key={lng.code}
                        onClick={() => changeLanguage(lng.code)}
                        className={i18n.language === lng.code ? 'bg-primary/10 text-primary font-medium' : ''}
                    >
                        {lng.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
