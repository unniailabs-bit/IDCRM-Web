import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  AlertCircle,
  Users,
  Pencil,
  Save,
  X,
} from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import { CustomDialog } from './CustomDialog';
import { useTranslation } from 'react-i18next';
import { t } from 'i18next';

interface PendingForm {
  id: number;
  rollNo: string;
  id_number?: string;
  gr_number?: string;
  sr_number?: string;
  admission_number?: string;
  registration_number?: string;
  bus_number?: string;
  studentName: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  class: string;
  division: string;
  fatherName: string;
  father_phone?: string;
  father_email?: string;
  father_occupation?: string;
  father_office_address?: string;
  father_photo?: string;
  motherName: string;
  mother_phone?: string;
  mother_email?: string;
  mother_occupation?: string;
  mother_office_address?: string;
  mother_photo?: string;
  guardian_name?: string;
  guardian_contact?: string;
  guardian_email?: string;
  guardian_occupation?: string;
  guardian_office_address?: string;
  guardian_photo?: string;
  guardian_relation?: string;
  submittedOn: string;
  daysWaiting: number;
  photo?: string;
  dob?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
  street_address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  emergency_contact?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  status?: string;
  sign?: string;
}

const mockPendingForms: any[] = [
  {
    id: 1,
    rollNo: 15,
    studentName: 'Aarav Sharma',
    class: 'Class 3',
    division: 'B',
    fatherName: 'Mr. Rajesh Sharma',
    motherName: 'Mrs. Priya Sharma',
    submittedOn: '2024-11-05 10:30 AM',
    daysWaiting: 3,
  },
  {
    id: 3,
    rollNo: 22,
    studentName: 'Arjun Kumar',
    class: 'Class 3',
    division: 'B',
    fatherName: 'Mr. Vikram Kumar',
    motherName: 'Mrs. Anjali Kumar',
    submittedOn: '2024-11-04 02:20 PM',
    daysWaiting: 4,
  },
  {
    id: 4,
    rollNo: 5,
    studentName: 'Ananya Singh',
    class: 'Class 4',
    division: 'A',
    fatherName: 'Mr. Rahul Singh',
    motherName: 'Mrs. Kavita Singh',
    submittedOn: '2024-11-06 09:15 AM',
    daysWaiting: 2,
  },
  {
    id: 5,
    rollNo: 18,
    studentName: 'Ishaan Mehta',
    class: 'Class 4',
    division: 'A',
    fatherName: 'Mr. Suresh Mehta',
    motherName: 'Mrs. Deepa Mehta',
    submittedOn: '2024-11-01 04:45 PM',
    daysWaiting: 7,
  },
];

const EditableField = ({
  label,
  value,
  name,
  isEditing,
  onChange,
  type = 'text',
  placeholder = '',
}: {
  label: string;
  value: any;
  name: string;
  isEditing: boolean;
  onChange: (name: string, value: string | null) => void;
  type?: string;
  placeholder?: string;
}) => (
  <div>
    <p
      style={{
        fontSize: '9px',
        fontWeight: 700,
        color: '#64748b',
        marginBottom: '2px',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </p>
    {isEditing ? (
      <input
        type={type}
        value={value || ''}
        placeholder={placeholder}
        className="w-full text-sm p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        style={{ fontWeight: 600, color: '#1f2937', backgroundColor: '#fff' }}
        onChange={(e) => onChange(name, e.target.value)}
      />
    ) : (
      <p style={{ fontWeight: 600, color: '#1f2937', fontSize: '14px' }}>{value || t('common.na')}</p>
    )}
  </div>
);

export function PendingApprovals() {
  const { t } = useTranslation();
  const [pendingForms, setPendingForms] = useState<PendingForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<PendingForm | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<PendingForm>>({});
  const [newFiles, setNewFiles] = useState<Record<string, File>>({});

  const handleFileChange = (name: string, file: File | null) => {
    if (file) {
      setNewFiles((prev) => ({ ...prev, [name]: file }));
    }
  };

  const onFieldChange = (name: string, value: string | null) => {
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (nextStatus?: string) => {
    if (!selectedForm) return;
    try {
      const formData = new FormData();

      // Mapping of frontend field names to backend field names
      const fieldMapping: Record<string, string> = {
        rollNo: 'roll_number',
        fatherName: 'father_name',
        motherName: 'mother_name',
        sign: 'student_signature',
      };

      const excludedFields = ['id', 'studentName', 'submittedOn', 'daysWaiting', 'class', 'division'];

      // Append all text data
      Object.entries(editData).forEach(([key, value]) => {
        // Skip status if overriding with nextStatus
        if (key === 'status' && nextStatus) return;

        // Skip excluded fields
        if (excludedFields.includes(key)) return;

        if (value !== null && value !== undefined) {
          const backendKey = fieldMapping[key] || key;
          formData.append(backendKey, String(value));
        }
      });

      // If we are also updating status
      if (nextStatus) {
        formData.append('status', nextStatus.toLowerCase());
      }

      // Append all new files
      Object.entries(newFiles).forEach(([name, file]) => {
        const backendKey = fieldMapping[name] || name;
        formData.append(backendKey, file as Blob);
      });

      const resp = await axiosInstance.patch(
        `/api/teacher/student-forms/${selectedForm.id}/update`,
        formData
      );

      if (resp.data.success) {
        toast.success(
          nextStatus
            ? t('pendingApprovals.updateAndStatusSuccess', { status: t(`studentForms.${nextStatus.toLowerCase() === 'rejected' ? 'rejected' : 'approved'}`) })
            : t('pendingApprovals.updateSuccess')
        );

        if (nextStatus) {
          setIsDetailDialogOpen(false);
          // Special case: if it's approved or rejected, remove from pending list
          setPendingForms((prev) => prev.filter((f) => f.id !== selectedForm.id));
          return;
        }

        // Map backend response for immediate update
        const updatedForm = mapPendingForm(resp.data.data);

        // Update selection and list immediately
        setPendingForms((prev) => prev.map((f) => (f.id === selectedForm.id ? updatedForm : f)));
        setSelectedForm(updatedForm);

        setIsEditing(false);
        setNewFiles({});

        // fetchPendingForms() call is now optional but kept for safety
        fetchPendingForms();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || t('pendingApprovals.failedUpdate'));
    }
  };

  useEffect(() => {
    fetchPendingForms();
  }, []);

  const mapPendingForm = (form: any): PendingForm => {
    const submittedDate = new Date(form.created_at);
    const today = new Date();
    const daysWaiting = Math.floor(
      (today.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: form.id,
      rollNo: form.roll_number,
      id_number: form.id_number,
      gr_number: form.gr_number,
      sr_number: form.sr_number,
      admission_number: form.admission_number,
      registration_number: form.registration_number,
      bus_number: form.bus_number,
      first_name: form.first_name,
      middle_name: form.middle_name,
      last_name: form.last_name,
      studentName: `${form.first_name} ${form.middle_name ? form.middle_name + ' ' : ''}${form.last_name
        }`,
      class: form.class_name || t('common.na'),
      division: form.division_name || t('common.na'),
      fatherName: form.father_name || t('common.na'),
      father_phone: form.father_phone,
      father_email: form.father_email,
      father_occupation: form.father_occupation,
      father_office_address: form.father_office_address,
      father_photo: form.father_photo,
      motherName: form.mother_name || t('common.na'),
      mother_phone: form.mother_phone,
      mother_email: form.mother_email,
      mother_occupation: form.mother_occupation,
      mother_office_address: form.mother_office_address,
      mother_photo: form.mother_photo,
      guardian_name: form.guardian_name,
      guardian_contact: form.guardian_contact,
      guardian_email: form.guardian_email,
      guardian_occupation: form.guardian_occupation,
      guardian_office_address: form.guardian_office_address,
      guardian_photo: form.guardian_photo,
      guardian_relation: form.guardian_relation,
      submittedOn: new Date(form.created_at).toLocaleString(),
      daysWaiting,
      photo: form.photo,
      dob: form.dob,
      gender: form.gender,
      blood_group: form.blood_group,
      address: form.address,
      street_address: form.street_address,
      city: form.city,
      state: form.state,
      pin_code: form.pin_code,
      emergency_contact: form.emergency_contact,
      parent_name: form.parent_name,
      parent_phone: form.parent_phone,
      parent_email: form.parent_email,
      status: form.status,
      sign: form.sign || form.signature || form.signature_url || form.student_signature,
    };
  };

  const fetchPendingForms = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/teacher/student-forms');

      if (response.data.success) {
        // Filter only pending/submitted forms and format them
        const pending = response.data.data
          .filter((form: any) => form.status === 'submitted' || form.status === 'pending')
          .map((form: any) => mapPendingForm(form));

        setPendingForms(pending);
      }
    } catch (error: any) {
      console.error('Error fetching pending forms:', error);
      toast.error(error.response?.data?.message || t('pendingApprovals.failedFetch'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (formId: number) => {
    try {
      const response = await axiosInstance.patch(`/api/teacher/student-forms/${formId}`, {
        status: 'approved',
      });

      if (response.data.success) {
        toast.success(t('pendingApprovals.approveSuccess'));
        setPendingForms(pendingForms.filter((f) => f.id !== formId));
        setIsDetailDialogOpen(false);
      }
    } catch (error: any) {
      console.error('Error approving form:', error);
      toast.error(error.response?.data?.message || t('pendingApprovals.failedApprove'));
    }
  };

  const handleReject = async (formId: number) => {
    try {
      const response = await axiosInstance.patch(`/api/teacher/student-forms/${formId}`, {
        status: 'rejected',
      });

      if (response.data.success) {
        toast.success(t('pendingApprovals.rejectSuccess'));
        setPendingForms(pendingForms.filter((f) => f.id !== formId));
        setIsDetailDialogOpen(false);
      }
    } catch (error: any) {
      console.error('Error rejecting form:', error);
      toast.error(error.response?.data?.message || t('pendingApprovals.failedReject'));
    }
  };

  const handleViewDetails = (form: PendingForm) => {
    setSelectedForm(form);
    setIsDetailDialogOpen(true);
  };

  const handleBulkApprove = async () => {
    if (!confirm(t('pendingApprovals.bulkApproveConfirm', { count: pendingForms.length }))) {
      return;
    }

    try {
      const ids = pendingForms.map((form) => form.id);
      const response = await axiosInstance.patch('/api/teacher/student-forms/bulk-status', {
        ids,
        status: 'approved',
      });

      if (response.data.success) {
        toast.success(t('pendingApprovals.bulkApproveSuccess', { count: ids.length }));
        setPendingForms([]);
      }
    } catch (error: any) {
      console.error('Error bulk approving:', error);
      toast.error(error.response?.data?.message || t('pendingApprovals.bulkApproveError'));
    }
  };

  const urgentCount = pendingForms.filter((f) => f.daysWaiting >= 5).length;

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">{t('pendingApprovals.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-dvh mx-auto bg-white">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{t('pendingApprovals.title')}</h1>

        <p className="text-base md:text-lg text-gray-600 font-medium">
          {t('pendingApprovals.subtitle')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border rounded-2xl shadow-md bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg text-gray-600">{t('pendingApprovals.totalPending')}</p>
                <p className="text-2xl font-bold"> {pendingForms.length}</p>
              </div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #f1f5f9',
                }}
              >
                <Clock className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border rounded-2xl shadow-md bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg text-gray-600">{t('pendingApprovals.urgentForms')}</p>
                <p className="text-2xl font-bold">{urgentCount}</p>
              </div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #fee2e2',
                }}
              >
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border rounded-2xl shadow-md bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg text-gray-600">{t('pendingApprovals.recentForms')}</p>
                <p className="text-2xl font-bold">
                  {' '}
                  {pendingForms.filter((f) => f.daysWaiting <= 2).length}
                </p>
              </div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #f1f5f9',
                }}
              >
                <CheckCircle className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for Urgent Forms */}
      {urgentCount > 0 && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm">
                  <strong>{t('pendingApprovals.urgentActionTitle')}</strong>{' '}
                  {t('pendingApprovals.urgentActionMessage', { count: urgentCount })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {pendingForms.length > 0 && (
        <div className="flex justify-end mb-4">
          <Button
            style={{ backgroundColor: '#0f172a', fontWeight: 800, borderRadius: '8px' }}
            className="gap-2 text-white hover:bg-gray-800"
            onClick={handleBulkApprove}
          >
            <CheckCircle className="w-4 h-4" />
            {t('pendingApprovals.bulkApprove', { count: pendingForms.length })}
          </Button>
        </div>
      )}

      {/* Pending Forms Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-800 text-xl">
            {t('pendingApprovals.formsAwaitingApproval', { count: pendingForms.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingForms.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('pendingApprovals.priority')}</TableHead>
                      <TableHead>{t('pendingApprovals.rollNo')}</TableHead>
                      <TableHead className="w-[160px]">{t('pendingApprovals.studentName')}</TableHead>
                      <TableHead>{t('pendingApprovals.class')}</TableHead>
                      <TableHead>{t('pendingApprovals.division')}</TableHead>
                      <TableHead className="w-[160px]">{t('pendingApprovals.fatherName')}</TableHead>
                      <TableHead className="w-[140px]">{t('pendingApprovals.submittedOn')}</TableHead>
                      <TableHead>{t('pendingApprovals.waiting')}</TableHead>
                      <TableHead>{t('pendingApprovals.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingForms.map((form) => (
                      <TableRow key={form.id}>
                        <TableCell>
                          {form.daysWaiting >= 5 ? (
                            <Badge
                              style={{
                                backgroundColor: '#fff',
                                color: '#ef4444',
                                border: '1px solid #fee2e2',
                                fontSize: '10px',
                                fontWeight: 700,
                              }}
                            >
                              {t('pendingApprovals.urgentStatus')}
                            </Badge>
                          ) : form.daysWaiting >= 3 ? (
                            <Badge
                              style={{
                                backgroundColor: '#f8fafc',
                                color: '#64748b',
                                border: '1px solid #e2e8f0',
                                fontSize: '10px',
                                fontWeight: 700,
                              }}
                            >
                              {t('pendingApprovals.mediumStatus')}
                            </Badge>
                          ) : (
                            <Badge
                              style={{
                                backgroundColor: '#f1f5f9',
                                color: '#0f172a',
                                border: '1px solid #e2e8f0',
                                fontSize: '10px',
                                fontWeight: 700,
                              }}
                            >
                              {t('pendingApprovals.newStatus')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{form.rollNo || t('common.na')}</TableCell>
                        <TableCell className="w-[160px]">
                          <span className="block truncate" title={form.studentName}>
                            {form.studentName}
                          </span>
                        </TableCell>
                        <TableCell>{form.class}</TableCell>
                        <TableCell>{form.division}</TableCell>
                        <TableCell className="w-[160px]">
                          <span className="block truncate text-sm" title={form.fatherName}>
                            {form.fatherName}
                          </span>
                        </TableCell>
                        <TableCell className="w-[140px]">
                          <span className="block truncate text-sm" title={form.submittedOn}>
                            {form.submittedOn}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={form.daysWaiting >= 5 ? 'text-red-600' : ''}>
                            {t('pendingApprovals.days', { count: form.daysWaiting })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              title={t('studentForms.viewDetails')}
                              onClick={() => {
                                handleViewDetails(form);
                                setIsEditing(false);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600"
                              title={t('studentForms.editDetails')}
                              onClick={() => {
                                handleViewDetails(form);
                                setEditData(form);
                                setIsEditing(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600"
                              onClick={() => handleApprove(form.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleReject(form.id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="mb-1">{t('pendingApprovals.allCaughtUp')}</h3>
              <p className="text-sm text-gray-600">{t('pendingApprovals.noPendingForms')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Detail Dialog */}
      <CustomDialog isOpen={isDetailDialogOpen} onClose={() => setIsDetailDialogOpen(false)}>
        {selectedForm && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Header Banner */}
            <div
              style={{
                background: 'linear-gradient(to right, #1f2937, #374151, #4b5563)',
                padding: '24px',
              }}
              className="text-white relative overflow-hidden"
            >
              {/* Background Decor */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-24 -mb-24 blur-2xl"></div>

              <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="relative group">
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '16px',
                      backgroundColor: '#ffffff',
                      overflow: 'hidden',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      border: '4px solid rgba(255, 255, 255, 0.3)',
                      transition: 'transform 0.2s ease-in-out',
                      position: 'relative',
                    }}
                  >
                    {newFiles.photo ? (
                      <img
                        src={URL.createObjectURL(newFiles.photo)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : selectedForm.photo ? (
                      <img
                        src={selectedForm.photo}
                        alt={selectedForm.studentName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-student.png';
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f9fafb',
                        }}
                      >
                        <Users style={{ width: '48px', height: '48px', color: '#d1d5db' }} />
                      </div>
                    )}

                    {isEditing && (
                      <label
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        className="hover:bg-black/60"
                      >
                        <input
                          type="file"
                          style={{ display: 'none' }}
                          accept="image/*"
                          onChange={(e) => handleFileChange('photo', e.target.files?.[0] || null)}
                        />
                        <Pencil
                          style={{
                            width: '24px',
                            height: '24px',
                            color: '#fff',
                            marginBottom: '4px',
                          }}
                        />
                        <p style={{ color: '#fff', fontSize: '9px', fontWeight: 800 }}>
                          {t('studentForms.changePhoto')}
                        </p>
                      </label>
                    )}
                  </div>
                </div>

                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div
                    style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}
                  >
                    <h2
                      style={{
                        fontSize: '24px',
                        fontWeight: 900,
                        letterSpacing: '-0.025em',
                        color: '#ffffff',
                        margin: 0,
                      }}
                    >
                      {selectedForm.studentName}
                    </h2>
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(12px)',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Clock style={{ width: '12px', height: '12px' }} /> {t('studentForms.pendingReview').toUpperCase()}
                    </div>
                    <div
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {t('pendingApprovals.waitingDays', { count: selectedForm.daysWaiting }).toUpperCase()}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: 500,
                      fontSize: '14px',
                    }}
                  >
                    {/* Top Row: Class, Roll and Blood Group */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                          padding: '4px 12px',
                          borderRadius: '6px',
                        }}
                      >
                        <span style={{ opacity: 0.7, fontSize: '10px', fontWeight: 700 }}>
                          {t('studentForms.class').toUpperCase()}:
                        </span>
                        <span style={{ fontWeight: 700 }}>
                          {selectedForm.class} - {selectedForm.division}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                          padding: '4px 12px',
                          borderRadius: '6px',
                        }}
                      >
                        <span style={{ opacity: 0.7, fontSize: '10px', fontWeight: 700 }}>
                          {t('studentForms.rollNo').toUpperCase()}:
                        </span>
                        <span style={{ fontWeight: 700 }}>{selectedForm.rollNo || t('common.na')}</span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                          padding: '4px 12px',
                          borderRadius: '6px',
                        }}
                      >
                        <span style={{ opacity: 0.7, fontSize: '10px', fontWeight: 700 }}>
                          {t('studentForms.bloodGroup').toUpperCase()}:
                        </span>
                        <span style={{ fontWeight: 700 }}>{selectedForm.blood_group || t('common.na')}</span>
                      </div>
                    </div>

                    {/* Bottom Row: Signature */}
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        backdropFilter: 'blur(4px)',
                        height: '50px',
                        width: '150px',
                      }}
                    >
                      {newFiles.sign ? (
                        <img
                          src={URL.createObjectURL(newFiles.sign)}
                          alt="New Signature"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : selectedForm.sign ? (
                        <img
                          src={selectedForm.sign}
                          alt="Signature"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-sign.png';
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            fontSize: '8px',
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontWeight: 800,
                          }}
                        >
                          {t('studentForms.noSignature')}
                        </div>
                      )}

                      {isEditing && (
                        <label
                          style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            borderRadius: '8px',
                          }}
                        >
                          <input
                            type="file"
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={(e) => handleFileChange('sign', e.target.files?.[0] || null)}
                          />
                          <Pencil style={{ width: '16px', height: '16px', color: '#fff' }} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px 32px' }} className="space-y-8">
              {/* Urgent Alert if needed */}
              {selectedForm.daysWaiting >= 5 && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    borderLeft: '4px solid #ef4444',
                    padding: '12px',
                  }}
                  className="rounded-lg flex items-center gap-3 shadow-sm"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <p className="text-red-800 font-bold text-xs uppercase tracking-wider leading-none mb-1">
                      {t('pendingApprovals.urgentStatus')}
                    </p>
                    <p className="text-red-600 text-[10px]">
                      {t('pendingApprovals.urgentActionMessage', { count: 5 })}
                    </p>
                  </div>
                </div>
              )}

              {/* Secondary Info Grid */}
              <div>
                <h3
                  style={{
                    fontSize: '11px',
                    fontWeight: 900,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      height: '12px',
                      width: '4px',
                      backgroundColor: '#4b5563',
                      borderRadius: '9999px',
                    }}
                  ></div>
                  {t('studentForms.registryDetails')}
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {[
                    { label: t('studentForms.rollNo').toUpperCase(), value: selectedForm.rollNo, name: 'rollNo' },
                    { label: t('studentForms.idNumber').toUpperCase(), value: selectedForm.id_number, name: 'id_number' },
                    { label: t('studentForms.grNumber').toUpperCase(), value: selectedForm.gr_number, name: 'gr_number' },
                    { label: t('studentForms.srNumber').toUpperCase(), value: selectedForm.sr_number, name: 'sr_number' },
                    {
                      label: t('studentForms.admission_number').toUpperCase(),
                      value: selectedForm.admission_number,
                      name: 'admission_number',
                    },
                    {
                      label: t('studentForms.registration_number').toUpperCase(),
                      value: selectedForm.registration_number,
                      name: 'registration_number',
                    },
                    { label: t('studentForms.bus_number').toUpperCase(), value: selectedForm.bus_number, name: 'bus_number' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: 'rgba(249, 250, 251, 0.5)',
                        border: '1px solid #f3f4f6',
                        padding: '12px',
                        borderRadius: '12px',
                        textAlign: 'left',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: '#9ca3af',
                          marginBottom: '2px',
                        }}
                      >
                        {item.label}
                      </p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={(editData as any)[item.name] || ''}
                          className="w-full text-xs p-1 border rounded bg-white"
                          onChange={(e) => onFieldChange(item.name, e.target.value)}
                        />
                      ) : (
                        <p style={{ fontWeight: 700, color: '#374151', fontSize: '14px' }}>
                          {item.value || '—'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '32px',
                }}
              >
                {/* Personal Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3
                    style={{
                      fontSize: '11px',
                      fontWeight: 900,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.2em',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        height: '12px',
                        width: '4px',
                        backgroundColor: '#64748b',
                        borderRadius: '9999px',
                      }}
                    ></div>
                    {t('studentForms.studentProfile')}
                  </h3>
                  <div
                    style={{
                      backgroundColor: 'rgba(249, 250, 251, 0.5)',
                      border: '1px solid rgba(229, 231, 235, 0.5)',
                      padding: '20px',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '16px',
                      }}
                    >
                      <EditableField
                        label={t('studentForms.first_name')}
                        value={isEditing ? editData.first_name : selectedForm.first_name}
                        name="first_name"
                        isEditing={isEditing}
                        onChange={onFieldChange}
                      />
                      <EditableField
                        label={t('studentForms.middle_name')}
                        value={isEditing ? editData.middle_name : selectedForm.middle_name}
                        name="middle_name"
                        isEditing={isEditing}
                        onChange={onFieldChange}
                      />
                      <EditableField
                        label={t('studentForms.last_name')}
                        value={isEditing ? editData.last_name : selectedForm.last_name}
                        name="last_name"
                        isEditing={isEditing}
                        onChange={onFieldChange}
                      />
                      <EditableField
                        label={t('studentForms.birthDate')}
                        value={isEditing ? editData.dob : selectedForm.dob}
                        name="dob"
                        isEditing={isEditing}
                        onChange={onFieldChange}
                        type="date"
                      />
                      <EditableField
                        label={t('studentForms.gender')}
                        value={isEditing ? editData.gender : selectedForm.gender}
                        name="gender"
                        isEditing={isEditing}
                        onChange={onFieldChange}
                      />
                      <EditableField
                        label={t('studentForms.bloodGroup')}
                        value={isEditing ? editData.blood_group : selectedForm.blood_group}
                        name="blood_group"
                        isEditing={isEditing}
                        onChange={onFieldChange}
                      />
                      <EditableField
                        label={t('studentForms.emergency')}
                        value={
                          isEditing ? editData.emergency_contact : selectedForm.emergency_contact
                        }
                        name="emergency_contact"
                        isEditing={isEditing}
                        onChange={onFieldChange}
                      />
                      <EditableField
                        label={t('studentForms.state')}
                        value={isEditing ? editData.state : selectedForm.state}
                        name="state"
                        isEditing={isEditing}
                        onChange={onFieldChange}
                      />
                    </div>

                    <div
                      style={{
                        paddingTop: '12px',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {t('studentForms.address')}
                      </p>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '12px',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ gridColumn: 'span 2' }}>
                          <EditableField
                            label={t('studentForms.streetAddress')}
                            value={
                              isEditing ? editData.street_address : selectedForm.street_address
                            }
                            name="street_address"
                            isEditing={isEditing}
                            onChange={onFieldChange}
                          />
                        </div>
                        <EditableField
                          label={t('studentForms.city')}
                          value={isEditing ? editData.city : selectedForm.city}
                          name="city"
                          isEditing={isEditing}
                          onChange={onFieldChange}
                        />
                        <EditableField
                          label={t('studentForms.pinCode')}
                          value={isEditing ? editData.pin_code : selectedForm.pin_code}
                          name="pin_code"
                          isEditing={isEditing}
                          onChange={onFieldChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parents Overview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3
                    style={{
                      fontSize: '11px',
                      fontWeight: 900,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.2em',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        height: '12px',
                        width: '4px',
                        backgroundColor: '#1f2937',
                        borderRadius: '9999px',
                      }}
                    ></div>
                    {t('pendingApprovals.familyInformation')}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                    {/* Father Card */}
                    <div
                      style={{
                        backgroundColor: '#fff',
                        border: '2px solid #f1f5f9',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '1px solid #f3f4f6',
                          position: 'relative',
                        }}
                      >
                        {newFiles.father_photo ? (
                          <img
                            src={URL.createObjectURL(newFiles.father_photo)}
                            alt="New Father"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : selectedForm.father_photo ? (
                          <img
                            src={selectedForm.father_photo}
                            alt="Father"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              color: '#d1d5db',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                            }}
                          >
                            {t('studentForms.photo')}
                          </div>
                        )}

                        {isEditing && (
                          <label
                            style={{
                              position: 'absolute',
                              inset: 0,
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                              borderRadius: '8px',
                            }}
                            className="hover:bg-black/80"
                          >
                            <input
                              type="file"
                              style={{ display: 'none' }}
                              accept="image/*"
                              onChange={(e) =>
                                handleFileChange('father_photo', e.target.files?.[0] || null)
                              }
                            />
                            <div
                              style={{
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                padding: '6px',
                                borderRadius: '50%',
                                border: '1px solid rgba(255,255,255,0.4)',
                              }}
                            >
                              <Pencil style={{ width: '16px', height: '16px', color: '#fff' }} />
                            </div>
                          </label>
                        )}
                      </div>
                      <div style={{ flexGrow: 1 }}>
                        <p
                          style={{
                            fontSize: '9px',
                            fontWeight: 900,
                            color: '#4b5563',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {t('studentForms.fatherDetails')}
                        </p>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '12px',
                          }}
                        >
                          <EditableField
                            label={t('studentForms.name')}
                            value={isEditing ? editData.fatherName : selectedForm.fatherName}
                            name="fatherName"
                            isEditing={isEditing}
                            onChange={onFieldChange}
                          />
                          <EditableField
                            label={t('studentForms.emergency')}
                            value={isEditing ? editData.father_phone : selectedForm.father_phone}
                            name="father_phone"
                            isEditing={isEditing}
                            onChange={onFieldChange}
                          />
                          <EditableField
                            label={t('studentForms.email')}
                            value={isEditing ? editData.father_email : selectedForm.father_email}
                            name="father_email"
                            isEditing={isEditing}
                            onChange={onFieldChange}
                          />
                          <EditableField
                            label={t('studentForms.occupation')}
                            value={
                              isEditing
                                ? editData.father_occupation
                                : selectedForm.father_occupation
                            }
                            name="father_occupation"
                            isEditing={isEditing}
                            onChange={onFieldChange}
                          />
                          <div style={{ gridColumn: '1 / -1' }}>
                            <EditableField
                              label={t('studentForms.officeAddress')}
                              value={
                                isEditing
                                  ? editData.father_office_address
                                  : selectedForm.father_office_address
                              }
                              name="father_office_address"
                              isEditing={isEditing}
                              onChange={onFieldChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mother Card */}
                    <div
                      style={{
                        backgroundColor: '#fff',
                        border: '2px solid #f1f5f9',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '1px solid #f3f4f6',
                          position: 'relative',
                        }}
                      >
                        {newFiles.mother_photo ? (
                          <img
                            src={URL.createObjectURL(newFiles.mother_photo)}
                            alt="New Mother"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : selectedForm.mother_photo ? (
                          <img
                            src={selectedForm.mother_photo}
                            alt="Mother"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              color: '#d1d5db',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                            }}
                          >
                            {t('studentForms.photo')}
                          </div>
                        )}

                        {isEditing && (
                          <label
                            style={{
                              position: 'absolute',
                              inset: 0,
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                              borderRadius: '8px',
                            }}
                            className="hover:bg-black/80"
                          >
                            <input
                              type="file"
                              style={{ display: 'none' }}
                              accept="image/*"
                              onChange={(e) =>
                                handleFileChange('mother_photo', e.target.files?.[0] || null)
                              }
                            />
                            <div
                              style={{
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                padding: '6px',
                                borderRadius: '50%',
                                border: '1px solid rgba(255,255,255,0.4)',
                              }}
                            >
                              <Pencil style={{ width: '16px', height: '16px', color: '#fff' }} />
                            </div>
                          </label>
                        )}
                      </div>
                      <div style={{ flexGrow: 1 }}>
                        <p
                          style={{
                            fontSize: '9px',
                            fontWeight: 900,
                            color: '#64748b',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {t('studentForms.motherDetails')}
                        </p>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '12px',
                          }}
                        >
                          <EditableField
                            label={t('studentForms.name')}
                            value={isEditing ? editData.motherName : selectedForm.motherName}
                            name="motherName"
                            isEditing={isEditing}
                            onChange={onFieldChange}
                          />
                          <EditableField
                            label={t('studentForms.emergency')}
                            value={isEditing ? editData.mother_phone : selectedForm.mother_phone}
                            name="mother_phone"
                            isEditing={isEditing}
                            onChange={onFieldChange}
                          />
                          <EditableField
                            label={t('studentForms.email')}
                            value={isEditing ? editData.mother_email : selectedForm.mother_email}
                            name="mother_email"
                            isEditing={isEditing}
                            onChange={onFieldChange}
                          />
                          <EditableField
                            label={t('studentForms.occupation')}
                            value={
                              isEditing
                                ? editData.mother_occupation
                                : selectedForm.mother_occupation
                            }
                            name="mother_occupation"
                            isEditing={isEditing}
                            onChange={onFieldChange}
                          />
                          <div style={{ gridColumn: '1 / -1' }}>
                            <EditableField
                              label={t('studentForms.officeAddress')}
                              value={
                                isEditing
                                  ? editData.mother_office_address
                                  : selectedForm.mother_office_address
                              }
                              name="mother_office_address"
                              isEditing={isEditing}
                              onChange={onFieldChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Guardian if exists */}
                    {selectedForm.guardian_name && (
                      <div
                        style={{
                          backgroundColor: '#fff',
                          border: '2px solid #f1f5f9',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                          borderRadius: '12px',
                          padding: '12px',
                          display: 'flex',
                          gap: '12px',
                        }}
                      >
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: '1px solid #f3f4f6',
                            position: 'relative',
                          }}
                        >
                          {newFiles.guardian_photo ? (
                            <img
                              src={URL.createObjectURL(newFiles.guardian_photo)}
                              alt="New Guardian"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : selectedForm.guardian_photo ? (
                            <img
                              src={selectedForm.guardian_photo}
                              alt="Guardian"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                color: '#d1d5db',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                              }}
                            >
                              {t('studentForms.photo')}
                            </div>
                          )}

                          {isEditing && (
                            <label
                              style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                borderRadius: '8px',
                              }}
                              className="hover:bg-black/80"
                            >
                              <input
                                type="file"
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={(e) =>
                                  handleFileChange('guardian_photo', e.target.files?.[0] || null)
                                }
                              />
                              <div
                                style={{
                                  backgroundColor: 'rgba(255,255,255,0.2)',
                                  padding: '6px',
                                  borderRadius: '50%',
                                  border: '1px solid rgba(255,255,255,0.4)',
                                }}
                              >
                                <Pencil style={{ width: '16px', height: '16px', color: '#fff' }} />
                              </div>
                            </label>
                          )}
                        </div>
                        <div style={{ flexGrow: 1 }}>
                          <p
                            style={{
                              fontSize: '9px',
                              fontWeight: 900,
                              color: '#9ca3af',
                              marginBottom: '8px',
                              textTransform: 'uppercase',
                            }}
                          >
                            {t('studentForms.guardianDetails')} ({selectedForm.guardian_relation})
                          </p>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                              gap: '12px',
                            }}
                          >
                            <EditableField
                              label={t('studentForms.name')}
                              value={
                                isEditing ? editData.guardian_name : selectedForm.guardian_name
                              }
                              name="guardian_name"
                              isEditing={isEditing}
                              onChange={onFieldChange}
                            />
                            <EditableField
                              label={t('studentForms.relation')}
                              value={
                                isEditing
                                  ? editData.guardian_relation
                                  : selectedForm.guardian_relation
                              }
                              name="guardian_relation"
                              isEditing={isEditing}
                              onChange={onFieldChange}
                            />
                            <EditableField
                              label={t('studentForms.emergency')}
                              value={
                                isEditing
                                  ? editData.guardian_contact
                                  : selectedForm.guardian_contact
                              }
                              name="guardian_contact"
                              isEditing={isEditing}
                              onChange={onFieldChange}
                            />
                            <EditableField
                              label={t('studentForms.email')}
                              value={
                                isEditing ? editData.guardian_email : selectedForm.guardian_email
                              }
                              name="guardian_email"
                              isEditing={isEditing}
                              onChange={onFieldChange}
                            />
                            <EditableField
                              label={t('studentForms.occupation')}
                              value={
                                isEditing
                                  ? editData.guardian_occupation
                                  : selectedForm.guardian_occupation
                              }
                              name="guardian_occupation"
                              isEditing={isEditing}
                              onChange={onFieldChange}
                            />
                            <div style={{ gridColumn: '1 / -1' }}>
                              <EditableField
                                label={t('studentForms.officeAddress')}
                                value={
                                  isEditing
                                    ? editData.guardian_office_address
                                    : selectedForm.guardian_office_address
                                }
                                name="guardian_office_address"
                                isEditing={isEditing}
                                onChange={onFieldChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '24px',
                  paddingBottom: '24px',
                }}
              >
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      style={{
                        fontSize: '11px',
                        height: '36px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        color: '#64748b',
                        borderColor: '#e2e8f0',
                      }}
                      className="px-6 hover:bg-gray-50 uppercase tracking-wider"
                      onClick={() => {
                        setIsEditing(false);
                        setEditData({});
                      }}
                    >
                      {t('studentForms.cancelEdit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      style={{
                        fontSize: '11px',
                        height: '36px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        color: '#ef4444',
                        borderColor: '#fee2e2',
                        backgroundColor: '#fff',
                      }}
                      className="px-6 hover:bg-red-50 hover:border-red-200 uppercase tracking-wider"
                      onClick={() => handleUpdate('rejected')}
                    >
                      {t('studentForms.reject')}
                    </Button>
                    <Button
                      size="sm"
                      style={{
                        fontSize: '11px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#0f172a',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        boxShadow:
                          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      }}
                      className="px-8 hover:bg-gray-800 text-white gap-2 uppercase tracking-wider"
                      onClick={() => handleUpdate('approved')}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-2" />
                      {t('studentForms.approve')}
                    </Button>
                    <Button
                      size="sm"
                      style={{
                        fontSize: '11px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#2563eb',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        boxShadow:
                          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      }}
                      className="px-8 hover:bg-blue-700 text-white gap-2 uppercase tracking-wider"
                      onClick={() => handleUpdate()}
                    >
                      <Save className="w-3.5 h-3.5 mr-2" />
                      {t('studentForms.save')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      style={{
                        fontSize: '11px',
                        height: '36px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        color: '#64748b',
                        borderColor: '#e2e8f0',
                      }}
                      className="px-6 hover:bg-gray-50 uppercase tracking-wider"
                      onClick={() => setIsDetailDialogOpen(false)}
                    >
                      {t('studentForms.close')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      style={{
                        fontSize: '11px',
                        height: '36px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        color: '#3b82f6',
                        borderColor: '#dbeafe',
                      }}
                      className="px-6 hover:bg-blue-50 hover:border-blue-200 uppercase tracking-wider"
                      onClick={() => {
                        setIsEditing(true);
                        setEditData(selectedForm!);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-2" />
                      {t('studentForms.editDetails')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      style={{
                        fontSize: '11px',
                        height: '36px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        color: '#ef4444',
                        borderColor: '#fee2e2',
                        backgroundColor: '#fff',
                      }}
                      className="px-6 hover:bg-red-50 hover:border-red-200 uppercase tracking-wider"
                      onClick={() => handleReject(selectedForm!.id)}
                    >
                      {t('studentForms.reject')}
                    </Button>
                    <Button
                      size="sm"
                      style={{
                        fontSize: '11px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#0f172a',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        boxShadow:
                          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      }}
                      className="px-8 hover:bg-gray-800 text-white gap-2 uppercase tracking-wider"
                      onClick={() => handleApprove(selectedForm!.id)}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-2" />
                      {t('studentForms.approve')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </CustomDialog>
    </div>
  );
}
