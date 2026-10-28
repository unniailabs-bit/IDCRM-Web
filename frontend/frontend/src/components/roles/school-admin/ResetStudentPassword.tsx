import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../../ui/dialog';
import {
    Phone,
    Search,
    Key,
    Eye,
    EyeOff,
    CheckCircle,
    AlertTriangle,
    Loader2,
    Users,
    ShieldCheck,
    RefreshCw,
} from 'lucide-react';
import { resetPasswordService } from '@/api/resetPasswordService';

interface StudentPreview {
    id: number;
    name: string;
    roll_number: string;
    class_name: string;
    division_name: string;
    password_status: 'encrypted' | 'plain' | 'not_set';
}

interface ResetResult {
    success: boolean;
    message: string;
    students_reset: StudentPreview[];
}

export function ResetStudentPassword() {
    const [phone, setPhone] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [searchResults, setSearchResults] = useState<StudentPreview[]>([]);
    const [searchDone, setSearchDone] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState('');

    const [resetLoading, setResetLoading] = useState(false);
    const [resetResult, setResetResult] = useState<ResetResult | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleSearch = async () => {
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 10) {
            setSearchError('Please enter a valid 10-digit phone number');
            return;
        }
        setSearchLoading(true);
        setSearchError('');
        setSearchResults([]);
        setSearchDone(false);
        setResetResult(null);
        try {
            const res = await resetPasswordService.searchByPhone(phone);
            setSearchResults(res.students || []);
            setSearchDone(true);
            if (res.students?.length === 0) {
                setSearchError('No students found with this phone number in your school.');
            }
        } catch (err: any) {
            setSearchError(err?.response?.data?.message || 'Search failed. Please try again.');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleReset = async () => {
        setConfirmOpen(false);
        setResetLoading(true);
        try {
            const res = await resetPasswordService.resetPassword(phone, newPassword);
            setResetResult(res);
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setResetResult({
                success: false,
                message: err?.response?.data?.message || 'Password reset failed.',
                students_reset: [],
            });
        } finally {
            setResetLoading(false);
        }
    };

    const canReset =
        searchResults.length > 0 &&
        newPassword.length >= 4 &&
        newPassword === confirmPassword &&
        !resetLoading;

    const passwordStatusBadge = (status: string) => {
        if (status === 'encrypted')
            return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Encrypted</Badge>;
        if (status === 'plain')
            return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">Plain text</Badge>;
        return <Badge className="bg-gray-100 text-gray-600 text-xs">Not set</Badge>;
    };

    return (
        <div className="px-4 sm:px-8 py-5 bg-white min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-violet-100 rounded-xl">
                        <Key className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reset Student Password</h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Reset login password for parents / students by mobile number
                        </p>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                        This resets the app login password for <strong>all students linked to this phone number</strong>.
                        Parents must use the new password to login on the mobile app.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Step 1: Search */}
                <Card className="border shadow-sm rounded-2xl">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                            Find Students by Phone
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                Parent / Father / Mother Phone Number
                            </Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="reset-phone-input"
                                        placeholder="Enter 10-digit mobile number"
                                        value={phone}
                                        onChange={(e) => {
                                            setPhone(e.target.value);
                                            setSearchDone(false);
                                            setSearchResults([]);
                                            setSearchError('');
                                            setResetResult(null);
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="pl-10 rounded-xl"
                                        maxLength={13}
                                    />
                                </div>
                                <Button
                                    id="reset-search-btn"
                                    onClick={handleSearch}
                                    disabled={searchLoading || !phone}
                                    className="bg-violet-600 hover:bg-violet-700 rounded-xl px-4"
                                >
                                    {searchLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Search className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {searchError && (
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-4 py-3 text-sm">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                {searchError}
                            </div>
                        )}

                        {/* Search Results */}
                        {searchDone && searchResults.length > 0 && (
                            <div className="rounded-xl border border-gray-100 overflow-hidden">
                                <div className="flex items-center gap-2 bg-violet-50 px-4 py-2.5">
                                    <Users className="w-4 h-4 text-violet-600" />
                                    <span className="text-sm font-semibold text-violet-700">
                                        {searchResults.length} student{searchResults.length > 1 ? 's' : ''} found
                                    </span>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {searchResults.map((s) => (
                                        <div key={s.id} className="flex items-center justify-between px-4 py-3">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    Roll: {s.roll_number || '—'} · {s.class_name || '—'} {s.division_name || ''}
                                                </p>
                                            </div>
                                            {passwordStatusBadge(s.password_status)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Step 2: Set New Password */}
                <Card className={`border shadow-sm rounded-2xl transition-opacity ${searchResults.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                            Set New Password
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">New Password</Label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="new-password-input"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Minimum 4 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="pl-10 pr-10 rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Confirm Password</Label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="confirm-password-input"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Re-enter new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-10 rounded-xl"
                                />
                            </div>
                            {confirmPassword && newPassword !== confirmPassword && (
                                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                            )}
                            {confirmPassword && newPassword === confirmPassword && newPassword.length >= 4 && (
                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Passwords match
                                </p>
                            )}
                        </div>

                        <Button
                            id="reset-password-btn"
                            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold py-2.5 mt-2 flex items-center gap-2"
                            disabled={!canReset}
                            onClick={() => setConfirmOpen(true)}
                        >
                            {resetLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4" />
                            )}
                            Reset Password for {searchResults.length} Student{searchResults.length !== 1 ? 's' : ''}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Success / Error Result */}
            {resetResult && (
                <div className={`mt-6 rounded-2xl border p-5 ${resetResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-3">
                        {resetResult.success ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`font-semibold text-sm ${resetResult.success ? 'text-green-800' : 'text-red-800'}`}>
                            {resetResult.message}
                        </span>
                    </div>
                    {resetResult.success && resetResult.students_reset?.length > 0 && (
                        <div className="space-y-1">
                            {resetResult.students_reset.map((s) => (
                                <div key={s.id} className="flex items-center gap-2 text-sm text-green-700">
                                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                    {s.name} — Roll: {s.roll_number || '—'} · {s.class_name} {s.division_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Confirm Dialog */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Confirm Password Reset
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600 mt-2">
                            This will immediately reset the app login password for{' '}
                            <strong>{searchResults.length} student{searchResults.length !== 1 ? 's' : ''}</strong>{' '}
                            linked to <strong>{phone}</strong>. Parents will need to use the new password to login.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-gray-50 rounded-xl p-3 my-2">
                        {searchResults.map((s) => (
                            <p key={s.id} className="text-sm text-gray-700 py-0.5">
                                • {s.name} ({s.class_name} {s.division_name})
                            </p>
                        ))}
                    </div>
                    <div className="flex gap-3 mt-2">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl"
                            onClick={() => setConfirmOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            id="confirm-reset-btn"
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                            onClick={handleReset}
                        >
                            Yes, Reset Password
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
