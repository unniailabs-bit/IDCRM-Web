import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { authService } from '@/api/authService';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth
import { Eye, EyeOff, Globe, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../components/common/LanguageSelector';

export function LoginPage() {
  // Removed onLogin prop
  // console.log('LoginPage: Component rendered.');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // Get login function from useAuth
  const { t } = useTranslation();

  const [authMode, setAuthMode] = useState<'login' | 'forgot' | 'otp' | 'reset' | 'teacher-select'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [teacherSelectionToken, setTeacherSelectionToken] = useState<string | null>(null);
  const [teacherSchoolOptions, setTeacherSchoolOptions] = useState<any[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Attempt School Admin API login
      try {
        const schoolAdminResponse = await authService.schoolAdminLogin(email, password);
        if (schoolAdminResponse.token) {
          login('school-admin', schoolAdminResponse.data);
          navigate('/', { replace: true });
          return;
        }
      } catch (error: any) {
        if (error.response && error.response.status === 401) throw new Error('Invalid credentials');
      }

      // Attempt Trust Super Admin API login
      try {
        const trustAdminResponse = await authService.loginTrustAdmin(email, password);
        if (trustAdminResponse.token) {
          login('super-admin', trustAdminResponse.trust);
          navigate('/', { replace: true });
          return;
        }
      } catch (error: any) {
        if (error.response && error.response.status === 401) throw new Error('Invalid credentials');
      }

      // Attempt Teacher API login
      try {
        const teacherResponse = await authService.loginTeacher(email, password);
        if (teacherResponse.requires_selection && teacherResponse.options?.length) {
          setTeacherSelectionToken(teacherResponse.selection_token);
          setTeacherSchoolOptions(teacherResponse.options);
          setAuthMode('teacher-select');
          return;
        }
        if (teacherResponse.token) {
          login('teacher', teacherResponse.teacher);
          navigate('/', { replace: true });
          return;
        }
      } catch (error: any) {
        if (error.response && error.response.status === 401) throw new Error('Invalid credentials');
      }

      // Attempt Platform Admin API login
      try {
        const platformAdminResponse = await authService.login(email, password);
        if (platformAdminResponse.token) {
          login('platform-admin', platformAdminResponse.data);
          navigate('/', { replace: true });
          return;
        } else {
          throw new Error('User not found');
        }
      } catch (error: any) {
        if (error.response && error.response.status === 401) throw new Error('Invalid credentials');
        throw new Error('User not found');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherSchoolSelect = async (teacherId: number) => {
    if (!teacherSelectionToken) {
      setError('Selection expired. Please login again.');
      setAuthMode('login');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await authService.selectTeacherProfile(teacherSelectionToken, teacherId);
      if (response.token) {
        login('teacher', response.teacher);
        navigate('/', { replace: true });
        return;
      }
      setError('Unable to complete login. Please try again.');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Unable to complete login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const [resetRole, setResetRole] = useState<'trust' | 'school' | 'teacher' | 'platform-admin'>('trust');

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Try Trust Admin first
      try {
        await authService.forgotPasswordTrustAdmin(resetEmail);
        setResetRole('trust');
        setAuthMode('otp');
        return;
      } catch (trustError: any) {
        if (trustError.response?.status !== 404) throw trustError;

        // Try school admin
        try {
          await authService.forgotPasswordSchoolAdmin(resetEmail);
          setResetRole('school');
          setAuthMode('otp');
          return;
        } catch (schoolError: any) {
          if (schoolError.response?.status !== 404) throw schoolError;

          // Try teacher
          try {
            await authService.forgotPasswordTeacher(resetEmail);
            setResetRole('teacher');
            setAuthMode('otp');
            return;
          } catch (teacherError: any) {
            if (teacherError.response?.status !== 404) throw teacherError;

            // Try platform-admin (superadmin)
            await authService.forgotPasswordSuperAdmin(resetEmail);
            setResetRole('platform-admin');
            setAuthMode('otp');
          }
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send OTP. User not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }
    setAuthMode('reset');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        email: resetEmail,
        otp: otp,
        newPassword: newPassword
      };

      if (resetRole === 'trust') {
        await authService.resetPasswordTrustAdmin(payload);
      } else if (resetRole === 'school') {
        await authService.resetPasswordSchoolAdmin(payload);
      } else if (resetRole === 'teacher') {
        await authService.resetPasswordTeacher(payload);
      } else {
        await authService.resetPasswordSuperAdmin(payload);
      }

      setAuthMode('login');
      setEmail(resetEmail);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 font-outfit">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <Card
        className="w-full max-w-md mx-auto relative z-10 border-0 shadow-2xl shadow-blue-500/10 bg-white/80 backdrop-blur-sm animate-fade-in"
        style={{ maxWidth: '450px' }}
      >
        <CardHeader className="text-center space-y-4 pb-0">
          <div className="flex justify-center min-h-[80px] items-center">
            <img
              src="/asha-logo.png"
              alt="Asha Softwares"
              className="w-3/4 object-contain max-w-full transition-transform duration-300 hover:scale-105"
            />
          </div>
        </CardHeader>

        <CardContent className="px-10 pb-12">
          <div className="space-y-6">
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700 ml-1">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-12 bg-slate-50/80 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('forgot'); setError(null); }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-12 pr-12 bg-slate-50/80 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="p-3.5 rounded-lg bg-red-50 border border-red-100 animate-in fade-in slide-in-from-top-1">
                    <p className="text-xs text-red-600 font-semibold text-center uppercase tracking-wider">{error}</p>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 shadow-md shadow-blue-500/20 rounded-lg transition-all"
                  disabled={loading}
                >
                  {loading ? 'Sign In...' : 'Sign In'}
                </Button>
              </form>
            )}

            {authMode === 'teacher-select' && (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <CardTitle className="text-xl font-bold text-slate-800">Select School</CardTitle>
                  <CardDescription>
                    Your account is linked to multiple schools. Choose one to continue.
                  </CardDescription>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {teacherSchoolOptions.map((option) => (
                    <button
                      key={option.teacher_id}
                      type="button"
                      disabled={loading}
                      onClick={() => handleTeacherSchoolSelect(option.teacher_id)}
                      className="w-full text-left p-4 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-blue-50 hover:border-blue-200 transition-colors disabled:opacity-60"
                    >
                      <p className="font-semibold text-slate-800">{option.school_name || 'School'}</p>
                      {option.subject && (
                        <p className="text-sm text-slate-500 mt-1">{option.subject}</p>
                      )}
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="p-3.5 rounded-lg bg-red-50 border border-red-100">
                    <p className="text-xs text-red-600 font-semibold text-center uppercase tracking-wider">{error}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setTeacherSelectionToken(null);
                    setTeacherSchoolOptions([]);
                    setError(null);
                  }}
                  className="w-full text-center text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            )}

            {authMode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-sm font-medium text-slate-700 ml-1">
                    Email Address
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="h-12 bg-slate-50/80 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-slate-600"
                  />
                </div>
                {error && (
                  <div className="p-3.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold text-center uppercase tracking-wider">{error}</div>
                )}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 shadow-md shadow-blue-500/20 rounded-lg transition-all"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="w-full text-center text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Back to Login
                </button>
              </form>
            )}

            {authMode === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium text-slate-700 ml-1 text-center block">
                    Verification Code
                  </Label>
                  <Input
                    id="otp"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000 000"
                    className="h-14 text-center text-2xl font-black tracking-[0.3em] bg-slate-50/80 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                  />
                </div>
                {error && (
                  <div className="p-3.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold text-center uppercase tracking-wider">{error}</div>
                )}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 shadow-md shadow-blue-500/20 rounded-lg transition-all"
                >
                  Verify & Continue
                </Button>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm font-bold text-blue-600 hover:underline"
                  >
                    Resend Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-sm font-bold text-slate-400"
                  >
                    Change Email
                  </button>
                </div>
              </form>
            )}

            {authMode === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-medium text-slate-700 ml-1">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="h-12 bg-slate-50/80 border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium text-slate-700 ml-1">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="h-12 bg-slate-50/80 border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
                {error && (
                  <div className="p-3.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold text-center uppercase tracking-wider">{error}</div>
                )}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 shadow-md shadow-blue-500/20 rounded-lg transition-all"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Reset Password'}
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      <style>{`
        @font-face {
          font-family: 'Outfit';
          src: url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;300;400;500;600;700;800;900&display=swap');
        }
        .font-outfit { font-family: 'Outfit', sans-serif; }
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}
