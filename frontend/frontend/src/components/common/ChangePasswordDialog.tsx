import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { KeyRound, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../../api/authService';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';

interface ChangePasswordDialogProps {
    isOpen: boolean;
    onClose: () => void;
    userRole: 'platform-admin' | 'super-admin' | 'school-admin' | 'teacher';
}

export function ChangePasswordDialog({ isOpen, onClose, userRole }: ChangePasswordDialogProps) {
    const { t } = useTranslation();
    const { userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword) {
            toast.error(t('common.passwordRequired'));
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error(t('common.passwordsDoNotMatch'));
            return;
        }
        setLoading(true);
        try {
            await authService.changePasswordSuperAdmin({
                name: userData?.name || userData?.username || '',
                email: userData?.email || '',
                password: newPassword,
            });
            toast.success(t('common.passwordChanged'));
            setNewPassword('');
            setConfirmPassword('');
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('common.failedToChangePassword'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[90vw] max-w-[260px] p-0 border-none shadow-xl rounded-xl overflow-hidden">
                {/* Compact Header */}
                <div className="bg-green-600 px-4 py-3 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-orange-400 shrink-0" />
                    <DialogTitle className="text-sm font-semibold text-white tracking-tight">
                        {t('common.changePassword')}
                    </DialogTitle>
                </div>

                {/* Compact Form */}
                <form onSubmit={handleSubmit} className="bg-white px-4 py-4 space-y-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {t('common.newPassword')}
                        </label>
                        <Input
                            type="password"
                            placeholder="New password"
                            className="h-8 text-xs rounded-lg bg-gray-50 border-gray-100 px-3 focus:ring-1 focus:ring-orange-200"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {t('common.confirmPassword')}
                        </label>
                        <Input
                            type="password"
                            placeholder="Confirm password"
                            className="h-8 text-xs rounded-lg bg-gray-50 border-gray-100 px-3 focus:ring-1 focus:ring-orange-200"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 h-8 text-xs rounded-lg text-gray-400 hover:bg-gray-50 font-semibold"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-8 text-xs rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold flex items-center justify-center gap-1"
                        >
                            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                            {t('common.save')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
