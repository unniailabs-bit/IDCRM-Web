import { useState, useEffect } from 'react';
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

interface TrustRegistration {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  trust: {
    name: string;
    regNumber: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  admin: {
    name: string;
    email: string;
    phone: string;
    designation: string;
    username: string;
  };
  schools: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    totalClasses: number;
    structure: {
      prePrimary: number;
      primary: number;
      secondary: number;
      higherSecondary: number;
      graduate: number;
      postGraduate: number;
      custom: number;
    };
  }>;
}

export function ApprovalQueue() {
  const [registrations, setRegistrations] = useState<TrustRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<TrustRegistration | null>(null);
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: TrustRegistration[] = [
        {
          id: '1',
          status: 'pending',
          submittedAt: '2025-01-15T10:30:00',
          trust: {
            name: 'ABC Education Trust',
            regNumber: 'TR-2025-001',
            email: 'admin@abctrust.edu',
            phone: '+91 98765 43210',
            address: '123 Education Lane, Knowledge Park',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          },
          admin: {
            name: 'Rajesh Kumar',
            email: 'rajesh@abctrust.edu',
            phone: '+91 98765 43211',
            designation: 'Trust Director',
            username: 'rajesh.kumar'
          },
          schools: [
            {
              id: 's1',
              name: 'ABC Primary School',
              email: 'primary@abctrust.edu',
              phone: '+91 98765 43212',
              address: 'Sector 15, Mumbai',
              totalClasses: 12,
              structure: {
                prePrimary: 4,
                primary: 4,
                secondary: 4,
                higherSecondary: 0,
                graduate: 0,
                postGraduate: 0,
                custom: 0
              }
            },
            {
              id: 's2',
              name: 'ABC High School',
              email: 'high@abctrust.edu',
              phone: '+91 98765 43213',
              address: 'Sector 16, Mumbai',
              totalClasses: 8,
              structure: {
                prePrimary: 0,
                primary: 0,
                secondary: 6,
                higherSecondary: 2,
                graduate: 0,
                postGraduate: 0,
                custom: 0
              }
            }
          ]
        },
        {
          id: '2',
          status: 'pending',
          submittedAt: '2025-01-14T14:20:00',
          trust: {
            name: 'XYZ Learning Foundation',
            regNumber: 'TR-2025-002',
            email: 'contact@xyzfoundation.org',
            phone: '+91 87654 32109',
            address: '456 Learning Street',
            city: 'Pune',
            state: 'Maharashtra',
            pincode: '411001'
          },
          admin: {
            name: 'Priya Sharma',
            email: 'priya@xyzfoundation.org',
            phone: '+91 87654 32110',
            designation: 'Managing Trustee',
            username: 'priya.sharma'
          },
          schools: [
            {
              id: 's3',
              name: 'XYZ International School',
              email: 'international@xyzfoundation.org',
              phone: '+91 87654 32111',
              address: 'Hinjewadi, Pune',
              totalClasses: 15,
              structure: {
                prePrimary: 4,
                primary: 4,
                secondary: 5,
                higherSecondary: 2,
                graduate: 0,
                postGraduate: 0,
                custom: 0
              }
            }
          ]
        }
      ];

      setRegistrations(mockData);
    } catch (error) {
      toast.error('Failed to fetch registrations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (registration: TrustRegistration) => {
    setSelectedRegistration(registration);
    setShowDetailsDialog(true);
  };

  const handleApproveClick = (registration: TrustRegistration) => {
    setSelectedRegistration(registration);
    setShowApprovalDialog(true);
  };

  const handleRejectClick = (registration: TrustRegistration) => {
    setSelectedRegistration(registration);
    setShowRejectionDialog(true);
  };

  const handleApprove = async () => {
    if (!selectedRegistration) return;

    setActionLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      setRegistrations(registrations.map(reg => 
        reg.id === selectedRegistration.id 
          ? { ...reg, status: 'approved' }
          : reg
      ));

      toast.success(`${selectedRegistration.trust.name} has been approved!`);
      setShowApprovalDialog(false);
      setSelectedRegistration(null);
    } catch (error) {
      toast.error('Failed to approve registration');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRegistration || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      setRegistrations(registrations.map(reg => 
        reg.id === selectedRegistration.id 
          ? { ...reg, status: 'rejected' }
          : reg
      ));

      toast.success(`${selectedRegistration.trust.name} has been rejected`);
      setShowRejectionDialog(false);
      setSelectedRegistration(null);
      setRejectionReason('');
    } catch (error) {
      toast.error('Failed to reject registration');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
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

  const RegistrationCard = ({ registration }: { registration: TrustRegistration }) => (
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
                <h3 className="text-base font-normal text-[#202124] mb-1 truncate leading-6">{registration.trust.name}</h3>
                <div className="flex items-center gap-3 text-sm text-[#5f6368] leading-5">
                  <span className="font-mono text-xs">{registration.trust.regNumber}</span>
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
              className={`h-6 px-3 text-xs font-medium rounded-full border-0 ${
                registration.status === 'pending' ? 'bg-[#fef7e0] text-[#c5221f]' :
                registration.status === 'approved' ? 'bg-[#e6f4ea] text-[#137333]' : 
                'bg-[#fce8e6] text-[#c5221f]'
              }`}
            >
              {registration.status === 'pending' && <Clock className="w-3 h-3 mr-1.5" />}
              {registration.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1.5" />}
              {registration.status === 'rejected' && <XCircle className="w-3 h-3 mr-1.5" />}
              {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
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
              <span className="truncate text-[#202124]">{registration.trust.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#5f6368] leading-5">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span className="text-[#202124]">{registration.trust.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#5f6368] leading-5">
              <GraduationCap className="w-4 h-4 flex-shrink-0" />
              <span className="text-[#202124]">{registration.schools.length} School{registration.schools.length > 1 ? 's' : ''}</span>
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
                {school.name} · {school.totalClasses} classes
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
              View Details
            </Button>
            {registration.status === 'pending' && (
              <>
                <Button
                  className="h-9 px-6 flex-1 bg-[#1a73e8] hover:bg-[#1765cc] text-white font-medium shadow-google-sm hover:shadow-google-md rounded"
                  onClick={() => handleApproveClick(registration)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="h-9 px-6 flex-1 border-[#dadce0] text-[#d93025] hover:bg-[#fce8e6] hover:border-[#d93025] font-medium rounded"
                  onClick={() => handleRejectClick(registration)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
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
            <p className="text-[#5f6368] text-sm">Loading registrations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] leading-9 font-normal text-[#202124] mb-2">Trust Approvals</h1>
        <p className="text-[14px] leading-5 text-[#5f6368]">Review and manage trust registration requests</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border border-[#dadce0] rounded-lg shadow-none hover:shadow-google-sm transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm leading-5 text-[#5f6368] mb-2">Pending Review</p>
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
                <p className="text-sm leading-5 text-[#5f6368] mb-2">Approved</p>
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
                <p className="text-sm leading-5 text-[#5f6368] mb-2">Rejected</p>
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
            Pending
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
            Approved
          </TabsTrigger>
          <TabsTrigger 
            value="rejected" 
            className="h-10 px-6 data-[state=active]:bg-[#e8f0fe] data-[state=active]:text-[#1a73e8] data-[state=active]:shadow-none rounded font-medium text-sm"
          >
            Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingRegistrations.length === 0 ? (
            <Card className="border border-[#dadce0] rounded-lg shadow-none">
              <CardContent className="p-16 text-center">
                <CheckCircle className="w-12 h-12 text-[#dadce0] mx-auto mb-4" />
                <p className="text-[#5f6368] text-sm">No pending approvals</p>
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
                <p className="text-[#5f6368] text-sm">No approved registrations yet</p>
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
                <p className="text-[#5f6368] text-sm">No rejected registrations</p>
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
            <DialogTitle className="text-[28px] leading-9 font-normal text-[#202124]">Registration Details</DialogTitle>
            <DialogDescription className="text-base leading-6 text-[#5f6368]">
              Complete information about the trust registration
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
                  Trust Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-[#f8f9fa] p-8 rounded-lg border border-[#dadce0]">
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">Trust Name</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">{selectedRegistration.trust.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">Registration Number</Label>
                    <p className="text-base leading-6 font-mono font-normal text-[#202124]">{selectedRegistration.trust.regNumber}</p>
                  </div>
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">Email</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">{selectedRegistration.trust.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">Phone</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">{selectedRegistration.trust.phone}</p>
                  </div>
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">City</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">{selectedRegistration.trust.city}</p>
                  </div>
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">State</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">{selectedRegistration.trust.state}</p>
                  </div>
                  <div className="lg:col-span-3">
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">Address</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">
                      {selectedRegistration.trust.address}
                      {selectedRegistration.trust.city && `, ${selectedRegistration.trust.city}`}
                      {selectedRegistration.trust.state && `, ${selectedRegistration.trust.state}`}
                      {selectedRegistration.trust.pincode && ` - ${selectedRegistration.trust.pincode}`}
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
                  Trust Super Admin
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-[#f8f9fa] p-8 rounded-lg border border-[#dadce0]">
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">Name</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">{selectedRegistration.admin.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">Designation</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">{selectedRegistration.admin.designation}</p>
                  </div>
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">Email</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">{selectedRegistration.admin.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">Phone</Label>
                    <p className="text-base leading-6 font-normal text-[#202124]">{selectedRegistration.admin.phone}</p>
                  </div>
                  <div>
                    <Label className="text-xs leading-4 text-[#5f6368] uppercase tracking-wider mb-3 block">Username</Label>
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
                  Schools ({selectedRegistration.schools.length})
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
                          <h5 className="text-base leading-6 font-medium text-[#202124] mb-4">Class Structure ({school.totalClasses} classes)</h5>
                          <div className="border border-[#dadce0] rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-[#f8f9fa]">
                                <tr>
                                  <th className="text-left px-6 py-4 text-sm font-medium text-[#5f6368] uppercase tracking-wider border-b border-[#dadce0]">
                                    Section
                                  </th>
                                  <th className="text-left px-6 py-4 text-sm font-medium text-[#5f6368] uppercase tracking-wider border-b border-[#dadce0]">
                                    Classes
                                  </th>
                                  <th className="text-left px-6 py-4 text-sm font-medium text-[#5f6368] uppercase tracking-wider border-b border-[#dadce0]">
                                    Divisions per Class
                                  </th>
                                  <th className="text-right px-6 py-4 text-sm font-medium text-[#5f6368] uppercase tracking-wider border-b border-[#dadce0]">
                                    Total Classes
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white">
                                {school.structure.prePrimary > 0 && (
                                  <tr className="border-b border-[#dadce0]">
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#e8f0fe] rounded flex items-center justify-center">
                                          <span className="text-xs font-medium text-[#1a73e8]">PP</span>
                                        </div>
                                        <span className="text-base text-[#202124]">Pre-Primary</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-base text-[#202124]">
                                      Nursery, LKG, UKG, Pre-KG
                                    </td>
                                    <td className="px-6 py-4 text-base text-[#202124]">
                                      A, B, C (3 divisions)
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <Badge className="h-7 px-3 bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8] text-sm">
                                        {school.structure.prePrimary} classes
                                      </Badge>
                                    </td>
                                  </tr>
                                )}
                                {school.structure.primary > 0 && (
                                  <tr className="border-b border-[#dadce0]">
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#e6f4ea] rounded flex items-center justify-center">
                                          <span className="text-xs font-medium text-[#137333]">P</span>
                                        </div>
                                        <span className="text-base text-[#202124]">Primary</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-base text-[#202124]">
                                      Class 1, 2, 3, 4, 5
                                    </td>
                                    <td className="px-6 py-4 text-base text-[#202124]">
                                      A, B, C, D (4 divisions)
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <Badge className="h-7 px-3 bg-[#e6f4ea] border-[#137333] text-[#137333] text-sm">
                                        {school.structure.primary} classes
                                      </Badge>
                                    </td>
                                  </tr>
                                )}
                                {school.structure.secondary > 0 && (
                                  <tr className="border-b border-[#dadce0]">
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#fef7e0] rounded flex items-center justify-center">
                                          <span className="text-xs font-medium text-[#ea8600]">S</span>
                                        </div>
                                        <span className="text-base text-[#202124]">Secondary</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-base text-[#202124]">
                                      Class 6, 7, 8, 9, 10
                                    </td>
                                    <td className="px-6 py-4 text-base text-[#202124]">
                                      A, B, C (3 divisions)
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <Badge className="h-7 px-3 bg-[#fef7e0] border-[#ea8600] text-[#ea8600] text-sm">
                                        {school.structure.secondary} classes
                                      </Badge>
                                    </td>
                                  </tr>
                                )}
                                {school.structure.higherSecondary > 0 && (
                                  <tr className="border-b border-[#dadce0]">
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#fce8e6] rounded flex items-center justify-center">
                                          <span className="text-xs font-medium text-[#d93025]">HS</span>
                                        </div>
                                        <span className="text-base text-[#202124]">Higher Secondary</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-base text-[#202124]">
                                      Class 11, 12
                                    </td>
                                    <td className="px-6 py-4 text-base text-[#202124]">
                                      Science, Commerce, Arts (3 streams)
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <Badge className="h-7 px-3 bg-[#fce8e6] border-[#d93025] text-[#d93025] text-sm">
                                        {school.structure.higherSecondary} classes
                                      </Badge>
                                    </td>
                                  </tr>
                                )}
                                {school.structure.graduate > 0 && (
                                  <tr className="border-b border-[#dadce0]">
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#f3e8fd] rounded flex items-center justify-center">
                                          <span className="text-xs font-medium text-[#9334e6]">G</span>
                                        </div>
                                        <span className="text-base text-[#202124]">Graduate</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-base text-[#202124]">
                                      BA, BSc, BCom, BBA
                                    </td>
                                    <td className="px-6 py-4 text-base text-[#202124]">
                                      Various departments
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <Badge className="h-7 px-3 bg-[#f3e8fd] border-[#9334e6] text-[#9334e6] text-sm">
                                        {school.structure.graduate} programs
                                      </Badge>
                                    </td>
                                  </tr>
                                )}
                                {school.structure.postGraduate > 0 && (
                                  <tr>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#e8f0fe] rounded flex items-center justify-center">
                                          <span className="text-xs font-medium text-[#1a73e8]">PG</span>
                                        </div>
                                        <span className="text-base text-[#202124]">Post Graduate</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-base text-[#202124]">
                                      MA, MSc, MCom, MBA
                                    </td>
                                    <td className="px-6 py-4 text-base text-[#202124]">
                                      Various departments
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <Badge className="h-7 px-3 bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8] text-sm">
                                        {school.structure.postGraduate} programs
                                      </Badge>
                                    </td>
                                  </tr>
                                )}
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
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-[80vw] w-[80vw] border border-[#dadce0] shadow-google-lg rounded-lg">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-[28px] leading-9 font-normal text-[#202124]">Approve Trust Registration</DialogTitle>
            <DialogDescription className="text-base leading-6 text-[#5f6368]">
              Are you sure you want to approve this trust registration?
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
                      {selectedRegistration.trust.name}
                    </p>
                    <p className="text-base leading-6 text-[#5f6368]">
                      Registration Number: <span className="font-mono text-[#202124]">{selectedRegistration.trust.regNumber}</span>
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-base font-medium text-[#202124] mb-3">Approval Summary:</h4>
                  <ul className="text-base leading-6 text-[#5f6368] space-y-4">
                    <li className="flex items-start gap-4">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#1a73e8]" />
                      <div>
                        <span className="text-[#202124] font-medium">{selectedRegistration.schools.length} school(s)</span> will be activated and made operational
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#1a73e8]" />
                      <div>
                        <span className="text-[#202124] font-medium">Trust Super Admin:</span> {selectedRegistration.admin.name} ({selectedRegistration.admin.email})
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#1a73e8]" />
                      <div>
                        <span className="text-[#202124] font-medium">Login credentials</span> will be sent via email to the administrator
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#1a73e8]" />
                      <div>
                        The trust will have <span className="text-[#202124] font-medium">full access</span> to the CRM platform immediately
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
              Cancel
            </Button>
            <Button 
              onClick={handleApprove} 
              className="h-10 px-8 bg-[#1a73e8] hover:bg-[#1765cc] text-white font-medium shadow-google-sm hover:shadow-google-md rounded text-base"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Approve Trust
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
            <DialogTitle className="text-[28px] leading-9 font-normal text-[#202124]">Reject Trust Registration</DialogTitle>
            <DialogDescription className="text-base leading-6 text-[#5f6368]">
              Please provide a detailed reason for rejecting this registration. This information will be sent to the trust administrator.
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
                    {selectedRegistration.trust.name}
                  </p>
                  <p className="text-sm leading-5 text-[#5f6368]">
                    Registration Number: <span className="font-mono text-[#202124]">{selectedRegistration.trust.regNumber}</span>
                  </p>
                  <p className="text-sm leading-5 text-[#5f6368] mt-2">
                    Submitted by: <span className="text-[#202124]">{selectedRegistration.admin.name}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label htmlFor="reason" className="text-base font-medium text-[#202124]">Rejection Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a clear and detailed reason for rejecting this trust registration. This message will be sent to the trust administrator via email."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={6}
                className="resize-none border-[#dadce0] focus:border-[#d93025] focus:ring-1 focus:ring-[#d93025] rounded text-base leading-6 p-4"
              />
              <p className="text-sm leading-5 text-[#5f6368] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>This reason will be sent to the trust administrator. Please be clear and professional in your explanation.</span>
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
              Cancel
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
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 mr-2" />
                  Reject Trust
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
