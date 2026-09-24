import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import {
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  User,
  GraduationCap,
  Eye,
  AlertCircle,
  FileText,
  MoreVertical,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';

import { trustService } from '@/api/trustService';
import { schoolService } from '@/api/schoolService';
import { approvalService } from '@/api/platform_admin/approvalService';

// Interfaces based on API responses
interface Trust {
  id: number;
  trust_name: string;
  registration_number: string;
  super_admin_name: string;
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
  username: string;
  registration_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface SchoolAPIResponse { // Renamed to avoid confusion with the UI's School interface
  id: number;
  trust_id: number;
  school_name: string;
  trust_name: string; // This seems redundant if we are grouping by trust, but keep for now
  school_admin_name: string;
  email: string;
  phone: string;
  address: string;
  total_students: number;
  // No registration_status or detailed structure from API for schools based on SchoolManagement.tsx
}

// Interface for schools to be displayed in the UI (derived from SchoolAPIResponse)
interface SchoolDisplay {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalClasses: number; // Using total_students as totalClasses
  // structure is not available from API, so omit or handle as placeholder
}

// Combined interface for display in ApprovalQueue
interface TrustRegistrationDisplay extends Omit<Trust, 'id' | 'created_at' | 'updated_at' | 'full_name' | 'admin_email' | 'admin_phone' | 'username' | 'designation' | 'registration_status'> {
  id: string; // Convert number id to string for consistency with original mock data's interface
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string; // Using created_at as submittedAt
  schools: SchoolDisplay[];
  admin: { // Mapping the admin details to fit the UI
    name: string;
    email: string;
    phone: string;
    designation: string;
    username: string;
  };
}


export function ApprovalQueue() {
  const { t, i18n } = useTranslation();
  const [registrations, setRegistrations] = useState<TrustRegistrationDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<TrustRegistrationDisplay | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const trustResponse = await trustService.getAllTrusts();
      const allTrusts: Trust[] = trustResponse.data;

      const schoolResponse = await schoolService.getAllSchools();
      const allSchools: SchoolAPIResponse[] = schoolResponse.data;

      const formattedRegistrations: TrustRegistrationDisplay[] = allTrusts.map(trust => {
        const schoolsForTrust: SchoolDisplay[] = allSchools
          .filter(school => school.trust_id === trust.id)
          .map(school => ({
            id: school.id,
            name: school.school_name,
            email: school.email,
            phone: school.phone,
            address: school.address,
            totalClasses: school.total_students, // Using total_students as totalClasses
          }));

        return {
          id: String(trust.id),
          status: trust.registration_status,
          submittedAt: trust.created_at,
          schools: schoolsForTrust,
          trust_name: trust.trust_name,
          registration_number: trust.registration_number,
          super_admin_name: trust.super_admin_name,
          email: trust.email,
          phone: trust.phone,
          address: trust.address,
          city: trust.city,
          state: trust.state,
          pincode: trust.pincode,
          admin: {
            name: trust.full_name,
            email: trust.admin_email,
            phone: trust.admin_phone,
            designation: trust.designation,
            username: trust.username,
          },
        };
      });

      setRegistrations(formattedRegistrations);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error(t('common.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (registration: TrustRegistrationDisplay) => {
    setSelectedRegistration(registration);
    setShowDetailsDialog(true);
  };

  const handleApproveClick = (registration: TrustRegistrationDisplay) => {
    setSelectedRegistration(registration);
    setShowApprovalDialog(true);
  };

  const handleRejectClick = (registration: TrustRegistrationDisplay) => {
    setSelectedRegistration(registration);
    setShowRejectionDialog(true);
  };

  const handleApprove = async () => {
    if (!selectedRegistration) return;

    setActionLoading(true);
    try {
      await approvalService.updateTrustStatus(Number(selectedRegistration.id), 'approved');
      toast.success(t('approvals.approvedSuccess', { name: selectedRegistration.trust_name }));
      setShowApprovalDialog(false);
      setSelectedRegistration(null);
      fetchRegistrations(); // Re-fetch to update UI
    } catch (error) {
      console.error('Failed to approve registration:', error);
      toast.error(t('approvals.approveError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRegistration || !rejectionReason.trim()) {
      toast.error(t('approvals.reasonRequired'));
      return;
    }

    setActionLoading(true);
    try {
      await approvalService.updateTrustStatus(Number(selectedRegistration.id), 'rejected');
      toast.success(t('approvals.rejectedSuccess', { name: selectedRegistration.trust_name }));
      setShowRejectionDialog(false);
      setSelectedRegistration(null);
      setRejectionReason('');
      fetchRegistrations(); // Re-fetch to update UI
    } catch (error) {
      console.error('Failed to reject registration:', error);
      toast.error(t('approvals.rejectError'));
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = i18n.language === 'mr' ? 'mr-IN' : (i18n.language === 'hi' ? 'hi-IN' : 'en-IN');
    return date.toLocaleString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingRegistrations = registrations.filter(r => r.status === 'pending');
  const approvedRegistrations = registrations.filter(r => r.status === 'approved');
  const rejectedRegistrations = registrations.filter(r => r.status === 'rejected');

  const RegistrationCard = ({ registration }: { registration: TrustRegistrationDisplay }) => (
    <Card className="border border-[#dadce0] rounded-lg shadow-none hover:shadow-google-sm transition-shadow duration-280">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 bg-[#e8f0fe] rounded-full flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-[#1a73e8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-normal text-[#202124] mb-1 truncate leading-6">{registration.trust_name}</h3>
                <div className="flex items-center gap-3 text-sm text-[#5f6368] leading-5">
                  <span className="font-mono text-xs">{registration.registration_number}</span>
                  <span className="text-[#dadce0]">•</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">{formatDate(registration.submittedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={`h-6 px-3 text-xs font-medium rounded-full border-0 ${registration.status === 'pending' ? 'bg-[#fef7e0] text-[#c5221f]' :
                registration.status === 'approved' ? 'bg-[#e6f4ea] text-[#137333]' :
                  'bg-[#fce8e6] text-[#c5221f]'
                }`}
            >
              {registration.status === 'pending' && <Clock className="w-3 h-3 mr-1.5" />}
              {registration.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1.5" />}
              {registration.status === 'rejected' && <XCircle className="w-3 h-3 mr-1.5" />}
              {t(`approvals.${registration.status}`)}
            </Badge>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-sm text-[#5f6368] leading-5">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="truncate text-[#202124]">{registration.admin.name}</span>
              <span className="text-xs text-[#5f6368]">({registration.admin.designation})</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#5f6368] leading-5">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate text-[#202124]">{registration.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#5f6368] leading-5">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span className="text-[#202124]">{registration.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#5f6368] leading-5">
              <GraduationCap className="w-4 h-4 flex-shrink-0" />
              <span className="text-[#202124]">{t('approvals.schoolCount', { count: registration.schools.length })}</span>
            </div>
          </div>

          {/* Schools */}
          <div className="flex flex-wrap gap-2">
            {registration.schools.map(school => (
              <Badge
                key={school.id}
                variant="outline"
                className="h-7 px-3 text-xs font-normal bg-[#f1f3f4] border-[#dadce0] text-[#5f6368] hover:bg-[#e8eaed]"
              >
                {school.name} · {t('approvals.classCount', { count: school.totalClasses })}
              </Badge>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              className="h-9 px-6 flex-1 rounded border-[#dadce0] hover:bg-[#f8f9fa] hover:border-[#dadce0] text-[#1a73e8] font-medium"
              onClick={() => handleViewDetails(registration)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {t('approvals.viewDetails')}
            </Button>
            {registration.status === 'pending' && (
              <>
                <Button
                  className="h-9 px-6 flex-1 bg-[#1a73e8] hover:bg-[#1765cc] text-white font-medium shadow-google-sm hover:shadow-google-md rounded"
                  onClick={() => handleApproveClick(registration)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('approvals.approve')}
                </Button>
                <Button
                  variant="outline"
                  className="h-9 px-6 flex-1 border-[#dadce0] text-[#d93025] hover:bg-[#fce8e6] hover:border-[#d93025] font-medium rounded"
                  onClick={() => handleRejectClick(registration)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {t('approvals.reject')}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-6">
            <div className="w-10 h-10 border-4 border-[#1a73e8] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-[#5f6368] text-sm">{t('approvals.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] leading-9 font-normal text-[#202124] mb-2">{t('approvals.title')}</h1>
        <p className="text-[14px] leading-5 text-[#5f6368]">{t('approvals.description')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border border-[#dadce0] rounded-lg shadow-none hover:shadow-google-sm transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm leading-5 text-[#5f6368] mb-2">{t('approvals.pendingReview')}</p>
                <p className="text-[36px] leading-[44px] font-normal text-[#202124]">{pendingRegistrations.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#fef7e0] rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#ea8600]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#dadce0] rounded-lg shadow-none hover:shadow-google-sm transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm leading-5 text-[#5f6368] mb-2">{t('approvals.approved')}</p>
                <p className="text-[36px] leading-[44px] font-normal text-[#202124]">{approvedRegistrations.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#e6f4ea] rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#137333]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#dadce0] rounded-lg shadow-none hover:shadow-google-sm transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm leading-5 text-[#5f6368] mb-2">{t('approvals.rejected')}</p>
                <p className="text-[36px] leading-[44px] font-normal text-[#202124]">{rejectedRegistrations.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#fce8e6] rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-[#d93025]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registrations List */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="h-12 bg-white border border-[#dadce0] p-1 rounded-lg inline-flex">
          <TabsTrigger
            value="pending"
            className="h-10 px-6 data-[state=active]:bg-[#e8f0fe] data-[state=active]:text-[#1a73e8] data-[state=active]:shadow-none rounded font-medium text-sm"
          >
            {t('approvals.pendingReview')}
            {pendingRegistrations.length > 0 && (
              <Badge className="ml-2 h-5 px-2 bg-[#1a73e8] text-white hover:bg-[#1a73e8] text-xs rounded-full">
                {pendingRegistrations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="h-10 px-6 data-[state=active]:bg-[#e8f0fe] data-[state=active]:text-[#1a73e8] data-[state=active]:shadow-none rounded font-medium text-sm"
          >
            {t('approvals.approved')}
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="h-10 px-6 data-[state=active]:bg-[#e8f0fe] data-[state=active]:text-[#1a73e8] data-[state=active]:shadow-none rounded font-medium text-sm"
          >
            {t('approvals.rejected')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingRegistrations.length === 0 ? (
            <Card className="border border-[#dadce0] rounded-lg shadow-none">
              <CardContent className="p-16 text-center">
                <CheckCircle className="w-12 h-12 text-[#dadce0] mx-auto mb-4" />
                <p className="text-[#5f6368] text-sm">{t('approvals.noPending')}</p>
              </CardContent>
            </Card>
          ) : (
            pendingRegistrations.map(registration => (
              <RegistrationCard key={registration.id} registration={registration} />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-6">
          {approvedRegistrations.length === 0 ? (
            <Card className="border border-[#dadce0] rounded-lg shadow-none">
              <CardContent className="p-16 text-center">
                <AlertCircle className="w-12 h-12 text-[#dadce0] mx-auto mb-4" />
                <p className="text-[#5f6368] text-sm">{t('approvals.noApproved')}</p>
              </CardContent>
            </Card>
          ) : (
            approvedRegistrations.map(registration => (
              <RegistrationCard key={registration.id} registration={registration} />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-6">
          {rejectedRegistrations.length === 0 ? (
            <Card className="border border-[#dadce0] rounded-lg shadow-none">
              <CardContent className="p-16 text-center">
                <AlertCircle className="w-12 h-12 text-[#dadce0] mx-auto mb-4" />
                <p className="text-[#5f6368] text-sm">{t('approvals.noRejected')}</p>
              </CardContent>
            </Card>
          ) : (
            rejectedRegistrations.map(registration => (
              <RegistrationCard key={registration.id} registration={registration} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-[80vw] w-auto max-h-[90vh] overflow-y-auto border border-[#dadce0] shadow-google-lg rounded-lg">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-[28px] leading-9 font-normal text-[#202124]">{t('approvals.details')}</DialogTitle>
            <DialogDescription className="text-base leading-6 text-[#5f6368]">
              {t('approvals.detailsDesc')}
            </DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-10 pt-4">
              {/* Trust Information */}
              <div>
                <h3 className="text-[22px] leading-7 font-normal text-[#202124] mb-6 flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#e8f0fe] rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-[#1a73e8]" />
                  </div>
                  {t('approvals.trustInfo')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-[#f8f9fa] p-8 rounded-lg border border-[#dadce0]">
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">{t('trusts.trustName')}</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">{selectedRegistration.trust_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">{t('approvals.regNumber')}</Label>
                    <p className="text-base leading-6 font-mono font-normal text-[#202124]">{selectedRegistration.registration_number}</p>
                  </div>
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">{t('common.email')}</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">{selectedRegistration.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">{t('common.phone')}</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">{selectedRegistration.phone}</p>
                  </div>
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">{t('approvals.city')}</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">{selectedRegistration.city}</p>
                  </div>
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">{t('approvals.state')}</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">{selectedRegistration.state}</p>
                  </div>
                  <div className="lg:col-span-3">
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">{t('approvals.address')}</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">
                      {selectedRegistration.address}
                      {selectedRegistration.city && `, ${selectedRegistration.city}`}
                      {selectedRegistration.state && `, ${selectedRegistration.state}`}
                      {selectedRegistration.pincode && ` - ${selectedRegistration.pincode}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Information */}
              <div>
                <h3 className="text-[22px] leading-7 font-normal text-[#202124] mb-6 flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#e8f0fe] rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-[#1a73e8]" />
                  </div>
                  {t('approvals.adminInfo')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-[#f8f9fa] p-8 rounded-lg border border-[#dadce0]">
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">{t('common.name')}</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">{selectedRegistration.admin.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">{t('approvals.designation')}</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">{selectedRegistration.admin.designation}</p>
                  </div>
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">{t('common.email')}</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">{selectedRegistration.admin.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">{t('common.phone')}</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">{selectedRegistration.admin.phone}</p>
                  </div>
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">{t('approvals.username')}</Label>
                    <p className="text-base leading-6 font-mono font-normal text-[#202124] bg-[#e8eaed] px-4 py-2 rounded inline-block">{selectedRegistration.admin.username}</p>
                  </div>
                </div>
              </div>

              {/* Schools Information */}
              <div>
                <h3 className="text-[22px] leading-7 font-normal text-[#202124] mb-6 flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#e8f0fe] rounded-full flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-[#1a73e8]" />
                  </div>
                  {t('schools.schools')} ({selectedRegistration.schools.length})
                </h3>
                <div className="space-y-6">
                  {selectedRegistration.schools.map((school, schoolIndex) => (
                    <Card key={school.id} className="border border-[#dadce0] rounded-lg shadow-none">
                      <CardContent className="p-8">
                        <div className="flex items-start gap-4 mb-6">
                          <div className="w-10 h-10 bg-[#e8f0fe] rounded-full flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-5 h-5 text-[#1a73e8]" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-[18px] leading-6 font-medium text-[#202124] mb-2">{school.name}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-center gap-3 text-base text-[#5f6368]">
                                <Mail className="w-5 h-5" />
                                <span className="text-[#202124]">{school.email}</span>
                              </div>
                              <div className="flex items-center gap-3 text-base text-[#5f6368]">
                                <Phone className="w-5 h-5" />
                                <span className="text-[#202124]">{school.phone}</span>
                              </div>
                              <div className="flex items-center gap-3 text-base text-[#5f6368] md:col-span-2">
                                <MapPin className="w-5 h-5" />
                                <span className="text-[#202124]">{school.address}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Classes and Divisions Table */}
                        <div className="mt-6">
                          <h5 className="text-base leading-6 font-medium text-[#202124] mb-4">{t('approvals.classStructure', { count: school.totalClasses })}</h5>
                          <div className="border border-[#dadce0] rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-[#f8f9fa]">
                                <tr>
                                  <th className="text-left px-6 py-4 text-sm font-medium text-[#5f6368] uppercase tracking-wider border-b border-[#dadce0]">
                                    {t('approvals.section')}
                                  </th>
                                  <th className="text-left px-6 py-4 text-sm font-medium text-[#5f6368] uppercase tracking-wider border-b border-[#dadce0]">
                                    {t('approvals.classes')}
                                  </th>
                                  <th className="text-left px-6 py-4 text-sm font-medium text-[#5f6368] uppercase tracking-wider border-b border-[#dadce0]">
                                    {t('approvals.divisionsPerClass')}
                                  </th>
                                  <th className="text-right px-6 py-4 text-sm font-medium text-[#5f6368] uppercase tracking-wider border-b border-[#dadce0]">
                                    {t('approvals.totalClasses')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white">
                                {/* Since actual structure is not available, these are placeholders */}
                                <tr className="border-b border-[#dadce0]">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-[#e8f0fe] rounded flex items-center justify-center">
                                        <span className="text-xs font-medium text-[#1a73e8]">T</span>
                                      </div>
                                      <span className="text-base text-[#202124]">{t('approvals.total')}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-base text-[#202124]">
                                    N/A
                                  </td>
                                  <td className="px-6 py-4 text-base text-[#202124]">
                                    N/A
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <Badge className="h-7 px-3 bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8] text-sm">
                                      {t('approvals.classCount', { count: school.totalClasses })}
                                    </Badge>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-6 mt-6 border-t border-[#dadce0]">
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
              className="h-9 px-6 rounded border-[#dadce0] hover:bg-[#f8f9fa]"
            >
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-[80vw] w-[80vw] border border-[#dadce0] shadow-google-lg rounded-lg">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-[28px] leading-9 font-normal text-[#202124]">{t('approvals.approveTitle')}</DialogTitle>
            <DialogDescription className="text-base leading-6 text-[#5f6368]">
              {t('approvals.approveDesc')}
            </DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-6 py-4">
              <div className="bg-[#e8f0fe] rounded-lg p-8 border border-[#1a73e8]">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#1a73e8] rounded-full flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[22px] leading-7 text-[#202124] mb-2 font-normal">
                      {selectedRegistration.trust_name}
                    </p>
                    <p className="text-base leading-6 text-[#5f6368]">
                      {t('approvals.regNumberLabel')} <span className="font-mono text-[#202124]">{selectedRegistration.registration_number}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-base font-medium text-[#202124] mb-3">{t('approvals.approvalSummary')}</h4>
                  <ul className="text-base leading-6 text-[#5f6368] space-y-4">
                    <li className="flex items-start gap-4">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#1a73e8]" />
                      <div>
                        <span className="text-[#202124] font-medium">{t('approvals.schoolCount', { count: selectedRegistration.schools.length })}</span> {t('approvals.activatedDesc')}
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#1a73e8]" />
                      <div>
                        <span className="text-[#202124] font-medium">{t('approvals.adminInfo')}:</span> {selectedRegistration.super_admin_name} ({selectedRegistration.admin.email})
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#1a73e8]" />
                      <div>
                        {t('approvals.credentialsDesc')}
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#1a73e8]" />
                      <div>
                        {t('approvals.accessDesc')}
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-6 border-t border-[#dadce0]">
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={actionLoading}
              className="h-10 px-8 rounded border-[#dadce0] hover:bg-[#f8f9fa] text-base"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleApprove}
              className="h-10 px-8 bg-[#1a73e8] hover:bg-[#1765cc] text-white font-medium shadow-google-sm hover:shadow-google-md rounded text-base"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t('approvals.approving')}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {t('approvals.approveTrust')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent className="max-w-[80vw] w-[80vw] border border-[#dadce0] shadow-google-lg rounded-lg">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-[28px] leading-9 font-normal text-[#202124]">{t('approvals.rejectTitle')}</DialogTitle>
            <DialogDescription className="text-base leading-6 text-[#5f6368]">
              {t('approvals.rejectDesc')}
            </DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="mb-6">
              <div className="flex items-start gap-4 p-6 bg-[#fce8e6] rounded-lg border border-[#d93025]">
                <div className="w-12 h-12 bg-[#d93025] rounded-full flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[18px] leading-6 text-[#202124] mb-1 font-medium">
                    {selectedRegistration.trust_name}
                  </p>
                  <p className="text-sm leading-5 text-[#5f6368]">
                    {t('approvals.regNumberLabel')} <span className="font-mono text-[#202124]">{selectedRegistration.registration_number}</span>
                  </p>
                  <p className="text-sm leading-5 text-[#5f6368] mt-2">
                    {t('approvals.submittedBy')}: <span className="text-[#202124]">{selectedRegistration.super_admin_name}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label htmlFor="reason" className="text-base font-medium text-[#202124]">{t('approvals.rejectionReason')} *</Label>
              <Textarea
                id="reason"
                placeholder={t('approvals.rejectionReasonPlaceholder')}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={6}
                className="resize-none border-[#dadce0] focus:border-[#d93025] focus:ring-1 focus:ring-[#d93025] rounded text-base leading-6 p-4"
              />
              <p className="text-sm leading-5 text-[#5f6368] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{t('approvals.rejectionNote')}</span>
              </p>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-[#dadce0]">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectionDialog(false);
                setRejectionReason('');
              }}
              disabled={actionLoading}
              className="h-10 px-8 rounded border-[#dadce0] hover:bg-[#f8f9fa] text-base"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
              className="h-10 px-8 bg-[#d93025] hover:bg-[#c5221f] rounded text-base"
            >
              {actionLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t('approvals.rejecting')}
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 mr-2" />
                  {t('approvals.rejectTrust')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}