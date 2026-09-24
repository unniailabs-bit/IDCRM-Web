import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import {
  Settings,
  User,
  Lock,
  Building2,
  Mail,
  Phone,
  MapPin,
  Save,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Trash2,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import axiosInstance from '@/api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface SchoolProfile {
  id: number;
  school_name: string;
  school_code: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  section: string;
  school_admin_name: string;
  school_logo?: string;
  principal_signature?: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

export function SchoolSettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    school_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    school_admin_name: '',
    school_logo: '',
    principal_signature: '',
  });

  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [pendingSignature, setPendingSignature] = useState<File | null>(null);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getAcademicYear = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // January = 0

    if (month >= 6) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/school/settings/profile');
      if (response.data.success) {
        const schoolData = response.data.data;
        setProfile(schoolData);

        // Initial form state with explicit fields
        let logoUrl = '';
        let signatureUrl = '';

        // Fetch Logo and Signature separately
        if (schoolData.id) {
          try {
            const [logoRes, signRes] = await Promise.allSettled([
              axiosInstance.get(`/api/school/${schoolData.id}/logo`),
              axiosInstance.get(`/api/school/${schoolData.id}/principal-sign`),
            ]);

            if (
              logoRes.status === 'fulfilled' &&
              logoRes.value.data.success &&
              logoRes.value.data.logo
            ) {
              logoUrl = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${
                logoRes.value.data.logo
              }`;
            }

            if (
              signRes.status === 'fulfilled' &&
              signRes.value.data.success &&
              signRes.value.data.principal_sign
            ) {
              signatureUrl = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${
                signRes.value.data.principal_sign
              }`;
            }
          } catch (err) {
            console.error('Error fetching brand assets:', err);
          }
        }

        setProfileForm({
          school_name: schoolData.school_name || '',
          email: schoolData.email || '',
          phone: schoolData.phone || '',
          address: schoolData.address || '',
          city: schoolData.city || '',
          state: schoolData.state || '',
          pincode: schoolData.pincode || '',
          school_admin_name: schoolData.school_admin_name || '',
          school_logo: logoUrl,
          principal_signature: signatureUrl,
        });

        // Update profile state with fetched images as well so they persist
        setProfile((prev) =>
          prev ? { ...prev, school_logo: logoUrl, principal_signature: signatureUrl } : null
        );
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error(t('schoolSettings.messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    // Validation
    const requiredFields = [
      { key: 'school_name', label: 'School Name' },
      { key: 'school_admin_name', label: 'Admin Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'address', label: 'Full Address' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'pincode', label: 'Pincode' },
    ];

    for (const field of requiredFields) {
      if (!profileForm[field.key as keyof typeof profileForm]?.toString().trim()) {
        toast.error(t('schoolSettings.messages.fieldRequired', { field: field.label }));
        return;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileForm.email)) {
      toast.error(t('schoolSettings.messages.emailInvalid'));
      return;
    }

    // Phone validation (10 digits)
    if (!/^\d{10}$/.test(profileForm.phone)) {
      toast.error(t('schoolSettings.messages.phoneInvalid'));
      return;
    }

    // Pincode validation (6 digits)
    if (!/^\d{6}$/.test(profileForm.pincode)) {
      toast.error(t('schoolSettings.messages.pincodeInvalid'));
      return;
    }

    setSaving(true);
    try {
      // 1. Update Profile Information
      // Exclude logo/signature from the profile update payload as they are handled by separate APIs
      const { school_logo, principal_signature, ...profileUpdateData } = profileForm;
      const response = await axiosInstance.patch('/api/school/settings/profile', profileUpdateData);
      if (response.data.success) {
        setProfile(response.data.data);
        toast.success(t('schoolSettings.messages.updateSuccess'));

        // 2. Upload Pending Files if any
        if (pendingLogo) {
          await handleFileUpload(pendingLogo, 'logo');
          setPendingLogo(null); // Clear pending after success
        }
        if (pendingSignature) {
          await handleFileUpload(pendingSignature, 'signature');
          setPendingSignature(null); // Clear pending after success
        }
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || t('schoolSettings.messages.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('schoolSettings.password.validation.matchError'));
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error(t('schoolSettings.password.validation.minLength'));
      return;
    }

    setSaving(true);
    try {
      const response = await axiosInstance.post('/api/school/settings/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (response.data.success) {
        toast.success(t('schoolSettings.messages.passwordSuccess'));
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || t('schoolSettings.messages.passwordError'));
    } finally {
      setSaving(false);
    }
  };

  // File upload handlers
  const handleFileUpload = async (file: File, type: 'logo' | 'signature') => {
    if (!profile?.id) return;

    const formData = new FormData();
    const endpoint = type === 'logo' ? 'logo' : 'principal-sign';
    const fieldName = type === 'logo' ? 'logo' : 'principal_sign';

    formData.append(fieldName, file);

    const isUpdate = type === 'logo' ? !!profile.school_logo : !!profile.principal_signature;
    const method = isUpdate ? 'patch' : 'post';
    const url = `/api/school/${profile.id}/${endpoint}`;

    const loadingToast = toast.loading(
      type === 'logo'
        ? t('schoolSettings.messages.uploadLogoStatus')
        : t('schoolSettings.messages.uploadSignatureStatus')
    );

    try {
      const response = await axiosInstance[method](url, formData);

      if (response.data.success) {
        const newUrl = type === 'logo' ? response.data.logo : response.data.principal_sign;

        // Update both profile and profileForm
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                [type === 'logo' ? 'school_logo' : 'principal_signature']: newUrl,
              }
            : null
        );

        setProfileForm((prev) => ({
          ...prev,
          [type === 'logo' ? 'school_logo' : 'principal_signature']: `${
            import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
          }${newUrl}`,
        }));

        toast.success(
          type === 'logo'
            ? t('schoolSettings.messages.uploadLogoSuccess')
            : t('schoolSettings.messages.uploadSignatureSuccess')
        );
      }
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      toast.error(
        error.response?.data?.message ||
          t('schoolSettings.messages.uploadError', {
            type:
              type === 'logo'
                ? t('schoolSettings.messages.logo')
                : t('schoolSettings.messages.signature'),
          })
      );
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const handleFileDelete = async (type: 'logo' | 'signature') => {
    if (!profile?.id) return;

    const endpoint = type === 'logo' ? 'logo' : 'principal-sign';
    const url = `/api/school/${profile.id}/${endpoint}`;

    if (!confirm(t('schoolSettings.messages.deleteConfirm'))) return;

    const loadingToast = toast.loading(
      type === 'logo'
        ? t('schoolSettings.messages.deleteLogoStatus')
        : t('schoolSettings.messages.deleteSignatureStatus')
    );

    try {
      const response = await axiosInstance.delete(url);

      if (response.data.success) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                [type === 'logo' ? 'school_logo' : 'principal_signature']: undefined,
              }
            : null
        );

        setProfileForm((prev) => ({
          ...prev,
          [type === 'logo' ? 'school_logo' : 'principal_signature']: '',
        }));

        toast.success(
          type === 'logo'
            ? t('schoolSettings.messages.deleteLogoSuccess')
            : t('schoolSettings.messages.deleteSignatureSuccess')
        );
      }
    } catch (error: any) {
      console.error(`Error deleting ${type}:`, error);
      toast.error(
        error.response?.data?.message ||
          t('schoolSettings.messages.deleteError', {
            type:
              type === 'logo'
                ? t('schoolSettings.messages.logo')
                : t('schoolSettings.messages.signature'),
          })
      );
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="px-8 py-5 bg-white">
      <div className="mb-6 md:mb-8 flex justify-between items-center">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            {t('schoolSettings.title')}
          </h1>
          <p className="text-base md:text-lg text-gray-600 font-medium">
            {t('schoolSettings.subtitle')}
          </p>
        </div>
        <button
          className="w-fit self-end text-white hover:text-white bg-gradient-to-r from-violet-400 via-violet-600 to-violet-600
          hover:from-violet-400 hover:via-violet-600 hover:to-voilet-600 hover:scale-105 group
          flex flex-row justify-center items-center gap-2 py-2 px-3 rounded-lg text-lg font-semibold transition-all duration-200"
          onClick={() => navigate('/school-dashboard/id-editor')}
        >
          {t('schoolSettings.editIdTemplate')}
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-300">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-5 h-5 text-orange-500" />
            {t('schoolSettings.tabs.profile')}
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-2">
            <Lock className="w-5 h-5 text-orange-500" />
            {t('schoolSettings.tabs.password')}
          </TabsTrigger>
          <TabsTrigger value="academic" className="gap-2">
            <Building2 className="w-5 h-5 text-orange-500" />
            {t('schoolSettings.tabs.academic')}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="shadow-xl border rounded-xl px-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                <User className="w-7 h-7" />
                {t('schoolSettings.profile.title')}
              </CardTitle>
              <CardDescription className="text-gray-600 font-medium">
                {t('schoolSettings.profile.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* General Information */}
                  <section className="col-span-1 border-r-2 border-gray-300 pr-2">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Building2 className="w-6 h-6 text-green-700" />
                      {t('schoolSettings.profile.general.title')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="school_name">
                          {t('schoolSettings.profile.general.schoolName')}
                        </Label>
                        <Input
                          id="school_name"
                          value={profileForm.school_name}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, school_name: e.target.value })
                          }
                          placeholder={t('schoolSettings.profile.general.placeholders.schoolName')}
                          className="focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="school_admin_name">
                          {t('schoolSettings.profile.general.adminName')}
                        </Label>
                        <Input
                          id="school_admin_name"
                          value={profileForm.school_admin_name}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, school_admin_name: e.target.value })
                          }
                          placeholder={t('schoolSettings.profile.general.placeholders.adminName')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="school_code">
                          {t('schoolSettings.profile.general.schoolCode')}
                        </Label>
                        <Input
                          id="school_code"
                          value={profile?.school_code || ''}
                          disabled
                          className="bg-gray-50 border-gray-200 text-gray-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="section">
                          {t('schoolSettings.profile.general.section')}
                        </Label>
                        <Input
                          id="section"
                          value={profile?.section || ''}
                          disabled
                          className="bg-gray-50 border-gray-200 text-gray-500"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Contact Information */}
                  <section className="col-span-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Mail className="w-6 h-6 text-red-600" />
                      {t('schoolSettings.profile.contact.title')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">{t('schoolSettings.profile.contact.email')}</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            value={profileForm.email}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, email: e.target.value })
                            }
                            className="pl-10"
                            placeholder={t('schoolSettings.profile.contact.placeholders.email')}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t('schoolSettings.profile.contact.phone')}</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="phone"
                            value={profileForm.phone}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, phone: e.target.value })
                            }
                            className="pl-10"
                            placeholder={t('schoolSettings.profile.contact.placeholders.phone')}
                            maxLength={10}
                            pattern="[0-9]{10}"
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Address Details */}
                <section className="border-t-2 border-gray-300 pt-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-yellow-500" />
                    {t('schoolSettings.profile.location.title')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3 space-y-2">
                      <Label htmlFor="address">
                        {t('schoolSettings.profile.location.address')}
                      </Label>
                      <Input
                        id="address"
                        value={profileForm.address}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, address: e.target.value })
                        }
                        placeholder={t('schoolSettings.profile.location.placeholders.address')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">{t('schoolSettings.profile.location.city')}</Label>
                      <Input
                        id="city"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        placeholder={t('schoolSettings.profile.location.placeholders.city')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">{t('schoolSettings.profile.location.state')}</Label>
                      <Input
                        id="state"
                        value={profileForm.state}
                        onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                        placeholder={t('schoolSettings.profile.location.placeholders.state')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode">
                        {t('schoolSettings.profile.location.pincode')}
                      </Label>
                      <Input
                        id="pincode"
                        value={profileForm.pincode}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, pincode: e.target.value })
                        }
                        placeholder={t('schoolSettings.profile.location.placeholders.pincode')}
                        maxLength={6}
                      />
                    </div>
                  </div>
                </section>

                {/* Brand Assets - Now below */}
                <section className="border-t-2 border-gray-300 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    {t('schoolSettings.profile.brand.title')}
                  </h3>
                  <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* School Logo */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">
                          {t('schoolSettings.profile.brand.schoolLogo')}
                        </Label>
                        <div className="relative group">
                          {profileForm.school_logo ? (
                            <div className="relative h-40 w-40 mx-auto bg-white rounded-2xl shadow-xl border-4 border-white overflow-hidden group">
                              <img
                                src={profileForm.school_logo}
                                alt="School Logo"
                                className="h-full w-full object-contain"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8 rounded-full"
                                  onClick={() =>
                                    document.getElementById('school_logo_input')?.click()
                                  }
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => handleFileDelete('logo')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => document.getElementById('school_logo_input')?.click()}
                              className="h-40 w-full bg-white border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                            >
                              <div className="p-3 bg-blue-50 rounded-full text-blue-500 group-hover:scale-110 transition-transform">
                                <ImageIcon className="w-8 h-8" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-semibold text-blue-600">
                                  {t('schoolSettings.profile.brand.uploadLogo')}
                                </p>
                                <p className="text-xs text-gray-400 px-4">
                                  {t('schoolSettings.profile.brand.logoHint')}
                                </p>
                              </div>
                            </button>
                          )}
                        </div>
                        <Input
                          id="school_logo_input"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Preview
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setProfileForm({
                                  ...profileForm,
                                  school_logo: reader.result as string,
                                });
                              };
                              reader.readAsDataURL(file);
                              // Store for upload
                              setPendingLogo(file);
                            }
                          }}
                        />
                      </div>

                      {/* Principal Signature */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">
                          {t('schoolSettings.profile.brand.principalSignature')}
                        </Label>
                        <div className="relative group">
                          {profileForm.principal_signature ? (
                            <div className="relative h-40 w-full bg-white rounded-2xl shadow-xl border-4 border-white overflow-hidden group">
                              <img
                                src={profileForm.principal_signature}
                                alt="Principal Signature"
                                className="h-full w-full object-contain"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8 rounded-full"
                                  onClick={() =>
                                    document.getElementById('principal_signature_input')?.click()
                                  }
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => handleFileDelete('signature')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                document.getElementById('principal_signature_input')?.click()
                              }
                              className="h-40 w-full bg-white border-2 border-dashed border-purple-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-purple-400 hover:bg-purple-50/50 transition-all group"
                            >
                              <div className="p-3 bg-purple-50 rounded-full text-purple-500 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-semibold text-purple-600">
                                  {t('schoolSettings.profile.brand.uploadSignature')}
                                </p>
                                <p className="text-xs text-gray-400 px-4">
                                  {t('schoolSettings.profile.brand.signatureHint')}
                                </p>
                              </div>
                            </button>
                          )}
                        </div>
                        <Input
                          id="principal_signature_input"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Preview
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setProfileForm({
                                  ...profileForm,
                                  principal_signature: reader.result as string,
                                });
                              };
                              reader.readAsDataURL(file);
                              // Store for upload
                              setPendingSignature(file);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={loadProfile}>
                  {t('schoolSettings.buttons.cancel')}
                </Button>
                <Button
                  onClick={handleProfileUpdate}
                  disabled={saving}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('schoolSettings.buttons.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t('schoolSettings.buttons.save')}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password">
          <Card className="shadow-xl border rounded-xl px-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                <Lock className="w-7 h-7" />
                {t('schoolSettings.password.title')}
              </CardTitle>
              <CardDescription className="text-gray-600 font-medium">
                {t('schoolSettings.password.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-10">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">
                    {t('schoolSettings.password.currentPassword')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      className="pr-10"
                      placeholder={t('schoolSettings.password.placeholders.currentPassword')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-orange-100"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('schoolSettings.password.newPassword')}</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      className="pr-10"
                      placeholder={t('schoolSettings.password.placeholders.newPassword')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-orange-100"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-500 hover:text-orange-600" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    {t('schoolSettings.password.confirmPassword')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      className="pr-10"
                      placeholder={t('schoolSettings.password.placeholders.confirmPassword')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-orange-100"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  {passwordForm.newPassword &&
                    passwordForm.confirmPassword &&
                    passwordForm.newPassword !== passwordForm.confirmPassword && (
                      <p className="text-sm text-red-600">
                        {t('schoolSettings.password.validation.matchError')}
                      </p>
                    )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() =>
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    })
                  }
                >
                  {t('schoolSettings.buttons.cancel')}
                </Button>
                <Button
                  onClick={handlePasswordChange}
                  disabled={
                    saving ||
                    !passwordForm.currentPassword ||
                    !passwordForm.newPassword ||
                    passwordForm.newPassword !== passwordForm.confirmPassword
                  }
                  className="gap-2 bg-orange-500 hover:bg-orange-600"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('schoolSettings.password.buttons.changing')}
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      {t('schoolSettings.password.buttons.change')}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic">
          <Card className="shadow-xl border rounded-xl px-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                <Building2 className="w-7 h-7" />
                {t('schoolSettings.academic.title')}
              </CardTitle>
              <CardDescription className="text-gray-600 font-medium">
                {t('schoolSettings.academic.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t('schoolSettings.academic.academicYear')}</Label>
                  <Input value={getAcademicYear()} disabled className="bg-gray-100" />
                  <p className="text-xs text-gray-500">
                    {t('schoolSettings.academic.hints.academicYear')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t('schoolSettings.academic.schoolSection')}</Label>
                  <Input value={profile?.section || 'N/A'} disabled className="bg-gray-100" />
                  <p className="text-xs text-gray">
                    {t('schoolSettings.academic.hints.schoolSection')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t('schoolSettings.academic.totalCredits')}</Label>
                  <Input value={profile?.credits || 0} disabled className="bg-gray-100" />
                  <p className="text-xs text-gray-500">
                    {t('schoolSettings.academic.hints.credits')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t('schoolSettings.academic.schoolCreated')}</Label>
                  <Input
                    value={
                      profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString()
                        : 'N/A'
                    }
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
