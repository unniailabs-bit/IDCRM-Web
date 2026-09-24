import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Users, Edit } from 'lucide-react';
import { trustService } from '@/api/trustService';
import { schoolService } from '@/api/schoolService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Label } from '../../ui/label';
import { useTranslation } from 'react-i18next';

interface TrustDetail {
  id: number;
  trust_name: string;
  custom_id: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  full_name: string;
  designation: string;
  admin_email: string;
  admin_phone: string;
  allot_ids: number;
  registration_status: string;
  created_at: string;
}

export function TrustDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trust, setTrust] = useState<TrustDetail | null>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTrustDetail();
      fetchTrustSchools();
    }
  }, [id]);

  const fetchTrustDetail = async () => {
    try {
      setLoading(true);
      const response = await trustService.getAllTrusts();
      if (response.success && response.data) {
        const foundTrust = response.data.find((t: any) => t.id === parseInt(id!));
        if (foundTrust) {
          setTrust(foundTrust);
        } else {
          toast.error(t('trusts.trustNotFound'));
          navigate('/dashboard/trusts');
        }
      }
    } catch (error: any) {
      console.error('Error fetching trust detail:', error);
      toast.error(error.response?.data?.message || t('trusts.fetchError'));
      navigate('/dashboard/trusts');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrustSchools = async () => {
    try {
      const response = await schoolService.getAllSchools();
      if (response.success && response.data) {
        const trustSchools = response.data.filter((s: any) => s.trust_id === parseInt(id!));
        setSchools(trustSchools);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!trust) {
    return (
      <div className="p-4 md:p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">{t('trusts.trustNotFound')}</p>
            <Button onClick={() => navigate('/dashboard/trusts')} className="mt-4">
              {t('trusts.backToTrusts')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-dvh">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/trusts')}
            className="flex items-center text-orange-500 border border-orange-600 hover:bg-orange-500 hover:text-white group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:scale-130" />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{trust.trust_name}</h1>
            <p className="text-gray-600 mt-1">{t('trusts.details')}</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/dashboard/trusts/create-trust/${trust.id}`)}
          className="flex items-center text-green-600 border border-green-600 hover:bg-green-500 hover:text-white group"
        >
          <Edit className="w-4 h-4 mr-2 group-hover:scale-130" />
          {t('common.edit')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full">
        {/* LEFT : BASIC INFORMATION */}
        <Card className="lg:col-span-3 rounded-2xl border border-gray-300 shadow-lg h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold">{t('trusts.basicInfo')}</CardTitle>
          </CardHeader>

          <CardContent className="px-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 text-sm">
              <div>
                <p className="text-black font-semibold">{t('trusts.trustName')}</p>
                <p className="font-medium mt-1 ml-4">{trust.trust_name}</p>
              </div>

              <div>
                <p className="text-black font-semibold">{t('trusts.customId')}</p>
                <p className="font-medium mt-1 ml-4">{trust.custom_id || t('teachers.na')}</p>
              </div>

              <div>
                <p className="text-black font-semibold">{t('common.status')}</p>
                <Badge
                  variant="outline"
                  className={`mt-1 ml-4 text-xs px-3 py-1 ${trust.registration_status === 'approved'
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                    }`}
                >
                  {trust.registration_status === 'Active' ? t('common.active') : t('common.inactive')}
                </Badge>
              </div>

              <div>
                <p className="text-black font-semibold">{t('trusts.allocatedIds')}</p>
                <p className="font-medium mt-1 ml-4">{trust.allot_ids || 0}</p>
              </div>

              <div>
                <p className="text-black font-semibold">{t('common.email')}</p>
                <p className="font-medium mt-1 ml-4 break-all">{trust.email}</p>
              </div>

              <div>
                <p className="text-black font-semibold">{t('common.phone')}</p>
                <p className="font-medium mt-1 ml-4">{trust.phone || t('teachers.na')}</p>
              </div>

              <div className="col-span-2">
                <p className="text-black font-semibold">{t('schools.address')}</p>
                <p className="font-medium mt-1 ml-4">{trust.address || t('teachers.na')}</p>
                {trust.city && (
                  <p className="text-sm text-gray-600 mt-1 ml-4">
                    {trust.city}, {trust.state}
                    {trust.pincode && ` - ${trust.pincode}`}
                  </p>
                )}
              </div>

              <div className="col-span-2 sm:col-span-1 justify-self-end">
                <p className="text-black font-semibold">{t('schools.createdAt')}</p>
                <p className="font-medium mt-1 ml-4">
                  {new Date(trust.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Information - Hidden as per requirement */}
        {/* <Card className="mb-6">
          <CardHeader>
            <CardTitle>Admin Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm text-gray-500">Full Name</Label>
                <p className="font-medium mt-1">{trust.full_name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Designation</Label>
                <p className="font-medium mt-1">{trust.designation || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Admin Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="font-medium">{trust.admin_email || 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Admin Phone</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="font-medium">{trust.admin_phone || 'N/A'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* RIGHT : SCHOOLS LIST */}
        <Card className="lg:col-span-2 rounded-2xl border border-gray-300 shadow-lg h-[80vh]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">{t('trusts.schoolsCount', { count: schools.length })}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard/schools')}
                className="flex items-center text-green-600 border border-green-600 hover:bg-green-500 hover:text-white group"
              >
                {t('trusts.viewAll')}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="max-h-[80vh] overflow-y-auto px-6">
            {schools.length > 0 ? (
              <div className="space-y-2">
                {schools.map((school) => (
                  <div
                    key={school.id}
                    onClick={() => navigate(`/dashboard/schools/${school.id}`)}
                    className="flex items-center justify-between rounded-xl border p-4
                    cursor-pointer transition hover:shadow-md hover:bg-green-100/50 group"
                  >
                    <div>
                      <p className="font-medium">{school.school_name}</p>
                      <p className="text-sm text-gray-600 truncate max-w-[220px]">{school.email}</p>
                    </div>
                    <Building2 className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:scale-130" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">{t('trusts.noSchoolsFound')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
