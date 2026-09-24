import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Checkbox } from '../../ui/checkbox';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { Eye, CheckCircle, XCircle, Send, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';

interface StudentForm {
  id: number;
  roll_number: string;
  id_number?: string;
  gr_number?: string;
  sr_number?: string;
  admission_number?: string;
  registration_number?: string;
  bus_number?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  dob: string;
  gender: string;
  blood_group?: string;
  photo?: string;
  father_name: string;
  father_phone?: string;
  father_email?: string;
  father_occupation?: string;
  father_office_address?: string;
  father_photo?: string;
  mother_name: string;
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
  street_address: string;
  city: string;
  state: string;
  pin_code: string;
  emergency_contact: string;
  status: string;
  class_name: string;
  division_name: string;
  created_at: string;
}

interface FieldCorrection {
  [key: string]: boolean; // true = needs correction
}

interface FieldNotes {
  [key: string]: string; // field name -> note
}

export function TeacherFormReviewTable() {
  const { t } = useTranslation();
  const [forms, setForms] = useState<StudentForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<StudentForm | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCorrectionDialogOpen, setIsCorrectionDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Field correction state
  const [fieldCorrections, setFieldCorrections] = useState<FieldCorrection>({});
  const [fieldNotes, setFieldNotes] = useState<FieldNotes>({});
  const [generalNotes, setGeneralNotes] = useState('');

  // Field labels mapping
  const fieldLabels: { [key: string]: string } = {
    first_name: t('studentForms.first_name'),
    middle_name: t('studentForms.middle_name'),
    last_name: t('studentForms.last_name'),
    dob: t('studentForms.birthDate'),
    gender: t('studentForms.gender'),
    blood_group: t('studentForms.bloodGroup'),
    photo: t('studentForms.photo'),
    id_number: t('studentForms.idNumber'),
    gr_number: t('studentForms.grNumber'),
    admission_number: t('studentForms.admission_number'),
    sr_number: t('studentForms.srNumber'),
    registration_number: t('studentForms.registration_number'),
    bus_number: t('studentForms.bus_number'),
    father_name: t('studentForms.fatherDetails'),
    father_phone: t('pendingApprovals.fatherPhone') || 'Father\'s Phone',
    father_email: t('pendingApprovals.fatherEmail') || 'Father\'s Email',
    father_occupation: t('studentForms.occupation'),
    father_office_address: t('studentForms.officeAddress'),
    mother_name: t('studentForms.motherDetails'),
    mother_phone: t('pendingApprovals.motherPhone') || 'Mother\'s Phone',
    mother_email: t('pendingApprovals.motherEmail') || 'Mother\'s Email',
    mother_occupation: t('studentForms.occupation'),
    mother_office_address: t('studentForms.officeAddress'),
    guardian_name: t('studentForms.guardianDetails'),
    guardian_contact: t('pendingApprovals.guardianPhone') || 'Guardian\'s Phone',
    guardian_email: t('pendingApprovals.guardianEmail') || 'Guardian\'s Email',
    guardian_occupation: t('studentForms.occupation'),
    guardian_office_address: t('studentForms.officeAddress'),
    guardian_relation: t('studentForms.relation'),
    street_address: t('studentForms.streetAddress'),
    city: t('studentForms.city'),
    state: t('studentForms.state'),
    pin_code: t('studentForms.pinCode'),
    emergency_contact: t('studentForms.emergency'),
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/teacher/student-forms');
      if (response.data.success) {
        setForms(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching forms:', error);
      toast.error(t('studentForms.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (form: StudentForm) => {
    setSelectedForm(form);
    setIsDetailDialogOpen(true);
  };

  const handleRequestCorrection = (form: StudentForm) => {
    setSelectedForm(form);
    setFieldCorrections({});
    setFieldNotes({});
    setGeneralNotes('');
    setIsCorrectionDialogOpen(true);
  };

  const toggleFieldCorrection = (fieldName: string) => {
    setFieldCorrections(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));

    // Clear note if unchecking
    if (fieldCorrections[fieldName]) {
      setFieldNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[fieldName];
        return newNotes;
      });
    }
  };

  const handleSubmitCorrection = async () => {
    if (!selectedForm) return;

    const fieldsNeedingCorrection = Object.keys(fieldCorrections).filter(
      key => fieldCorrections[key]
    );

    if (fieldsNeedingCorrection.length === 0 && !generalNotes.trim()) {
      toast.error(t('teacherFormReview.errorSelectField') || 'Please select at least one field for correction or add general notes');
      return;
    }

    setSubmitting(true);
    try {
      const correctionData: any = {
        fields_requiring_correction: {},
        correction_field_notes: {},
        correction_notes: generalNotes || null,
      };

      // Build correction objects
      fieldsNeedingCorrection.forEach(field => {
        correctionData.fields_requiring_correction[field] = true;
        if (fieldNotes[field]) {
          correctionData.correction_field_notes[field] = fieldNotes[field];
        }
      });

      const response = await axiosInstance.patch(
        `/api/teacher/student-forms/${selectedForm.id}/request-correction`,
        correctionData
      );

      if (response.data.success) {
        toast.success(t('teacherFormReview.correctionSuccess'));
        setIsCorrectionDialogOpen(false);
        fetchForms();
      }
    } catch (error: any) {
      console.error('Error requesting correction:', error);
      toast.error(error.response?.data?.message || t('teacherFormReview.correctionError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (formId: number) => {
    try {
      const response = await axiosInstance.patch(`/api/teacher/student-forms/${formId}`, {
        status: 'approved'
      });

      if (response.data.success) {
        toast.success(t('studentForms.approveSuccess'));
        fetchForms();
      }
    } catch (error: any) {
      console.error('Error approving form:', error);
      toast.error(error.response?.data?.message || t('studentForms.failedApprove'));
    }
  };

  const pendingForms = forms.filter(f => f.status === 'submitted' || f.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('teacherFormReview.title')}</h1>
        <p className="text-gray-600 mt-1">{t('teacherFormReview.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('teacherFormReview.submittedForms', { count: pendingForms.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('studentForms.rollNo')}</TableHead>
                  <TableHead className="w-[160px]">{t('studentForms.name')}</TableHead>
                  <TableHead>{t('studentForms.class')}</TableHead>
                  <TableHead className="w-[160px]">{t('studentForms.father')}</TableHead>
                  <TableHead className="w-[140px]">{t('studentForms.submittedOn')}</TableHead>
                  <TableHead>{t('studentForms.status')}</TableHead>
                  <TableHead>{t('studentForms.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingForms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {t('teacherFormReview.noPendingForms')}
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingForms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell>{form.roll_number || t('common.na')}</TableCell>
                      <TableCell className="w-[160px]">
                        <span
                          className="block truncate"
                          title={`${form.first_name} ${form.middle_name ? form.middle_name + ' ' : ''}${form.last_name}`.trim()}
                        >
                          {form.first_name} {form.middle_name ? form.middle_name + ' ' : ''}{form.last_name}
                        </span>
                      </TableCell>
                      <TableCell>{form.class_name}-{form.division_name}</TableCell>
                      <TableCell className="w-[160px]">
                        <span className="block truncate text-sm" title={form.father_name}>
                          {form.father_name}
                        </span>
                      </TableCell>
                      <TableCell className="w-[140px]">
                        <span
                          className="block truncate text-sm"
                          title={new Date(form.created_at).toLocaleString()}
                        >
                          {new Date(form.created_at).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {t('teacherFormReview.pendingReview')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(form)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600"
                            onClick={() => handleApprove(form.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail View Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('teacherFormReview.formDetails')}</DialogTitle>
            <DialogDescription>{t('teacherFormReview.reviewInfo')}</DialogDescription>
          </DialogHeader>
          {selectedForm && (
            <div className="space-y-6 py-4">
              {/* Student Photo */}
              {selectedForm.photo && (
                <div className="flex justify-center">
                  <img
                    src={selectedForm.photo}
                    alt={t('studentForms.photo')}
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                  />
                </div>
              )}

              {/* Student Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b">{t('teacherFormReview.studentInfo')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">{t('studentForms.rollNo')}</Label>
                    <p className="font-medium">{selectedForm.roll_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">{t('studentForms.first_name')}</Label>
                    <p className="font-medium">{selectedForm.first_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">{t('studentForms.middle_name')}</Label>
                    <p className="font-medium">{selectedForm.middle_name || t('common.na')}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">{t('studentForms.last_name')}</Label>
                    <p className="font-medium">{selectedForm.last_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">{t('studentForms.birthDate')}</Label>
                    <p className="font-medium">{selectedForm.dob || t('common.na')}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">{t('studentForms.gender')}</Label>
                    <p className="font-medium">{selectedForm.gender || t('common.na')}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">{t('studentForms.bloodGroup')}</Label>
                    <p className="font-medium">{selectedForm.blood_group || t('common.na')}</p>
                  </div>
                </div>
              </div>

              {/* Identification Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b text-orange-600">{t('teacherFormReview.idNumbers')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-xs text-gray-500 uppercase">{t('studentForms.rollNo')}</Label>
                    <p className="font-medium text-lg">{selectedForm.roll_number || t('common.na')}</p>
                  </div>
                  {selectedForm.id_number && (
                    <div>
                      <Label className="text-xs text-gray-500 uppercase">{t('studentForms.idNumber')}</Label>
                      <p className="font-medium text-lg">{selectedForm.id_number}</p>
                    </div>
                  )}
                  {selectedForm.gr_number && (
                    <div>
                      <Label className="text-xs text-gray-500 uppercase">{t('studentForms.grNumber')}</Label>
                      <p className="font-medium text-lg">{selectedForm.gr_number}</p>
                    </div>
                  )}
                  {selectedForm.admission_number && (
                    <div>
                      <Label className="text-xs text-gray-500 uppercase">{t('studentForms.admission_number')}</Label>
                      <p className="font-medium text-lg">{selectedForm.admission_number}</p>
                    </div>
                  )}
                  {selectedForm.sr_number && (
                    <div>
                      <Label className="text-xs text-gray-500 uppercase">{t('studentForms.srNumber')}</Label>
                      <p className="font-medium text-lg">{selectedForm.sr_number}</p>
                    </div>
                  )}
                  {selectedForm.registration_number && (
                    <div>
                      <Label className="text-xs text-gray-500 uppercase">{t('studentForms.registration_number')}</Label>
                      <p className="font-medium text-lg">{selectedForm.registration_number}</p>
                    </div>
                  )}
                  {selectedForm.bus_number && (
                    <div>
                      <Label className="text-xs text-gray-500 uppercase">{t('studentForms.bus_number')}</Label>
                      <p className="font-medium text-lg">{selectedForm.bus_number}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Father's Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b text-blue-600">{t('teacherFormReview.fatherDetails')}</h3>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-24 h-24 flex-shrink-0">
                    <div className="w-full h-full bg-gray-50 border rounded-lg overflow-hidden flex items-center justify-center">
                      {selectedForm.father_photo ? (
                        <img src={selectedForm.father_photo} alt={t('studentForms.father')} className="w-full h-full object-cover" />
                      ) : (
                        <Eye className="w-8 h-8 text-gray-200" />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-grow">
                    <div><Label className="text-xs text-gray-500">{t('studentForms.name')}</Label><p className="font-medium">{selectedForm.father_name}</p></div>
                    <div><Label className="text-xs text-gray-500">{t('common.phone')}</Label><p className="font-medium">{selectedForm.father_phone || t('common.na')}</p></div>
                    <div><Label className="text-xs text-gray-500">{t('studentForms.email')}</Label><p className="font-medium">{selectedForm.father_email || t('common.na')}</p></div>
                    <div className="col-span-1 lg:col-span-2"><Label className="text-xs text-gray-500">{t('studentForms.occupation')}</Label><p className="font-medium">{selectedForm.father_occupation || t('common.na')}</p></div>
                    <div className="col-span-full"><Label className="text-xs text-gray-500">{t('studentForms.officeAddress')}</Label><p className="font-medium text-sm">{selectedForm.father_office_address || t('common.na')}</p></div>
                  </div>
                </div>
              </div>

              {/* Mother's Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b text-pink-600">{t('teacherFormReview.motherDetails')}</h3>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-24 h-24 flex-shrink-0">
                    <div className="w-full h-full bg-gray-50 border rounded-lg overflow-hidden flex items-center justify-center">
                      {selectedForm.mother_photo ? (
                        <img src={selectedForm.mother_photo} alt={t('studentForms.motherDetails')} className="w-full h-full object-cover" />
                      ) : (
                        <Eye className="w-8 h-8 text-gray-200" />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-grow">
                    <div><Label className="text-xs text-gray-500">{t('studentForms.name')}</Label><p className="font-medium">{selectedForm.mother_name}</p></div>
                    <div><Label className="text-xs text-gray-500">{t('common.phone')}</Label><p className="font-medium">{selectedForm.mother_phone || t('common.na')}</p></div>
                    <div><Label className="text-xs text-gray-500">{t('studentForms.email')}</Label><p className="font-medium">{selectedForm.mother_email || t('common.na')}</p></div>
                    <div className="col-span-1 lg:col-span-2"><Label className="text-xs text-gray-500">{t('studentForms.occupation')}</Label><p className="font-medium">{selectedForm.mother_occupation || t('common.na')}</p></div>
                    <div className="col-span-full"><Label className="text-xs text-gray-500">{t('studentForms.officeAddress')}</Label><p className="font-medium text-sm">{selectedForm.mother_office_address || t('common.na')}</p></div>
                  </div>
                </div>
              </div>

              {/* Guardian's Information */}
              {selectedForm.guardian_name && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 pb-2 border-b text-purple-600">{t('teacherFormReview.guardianDetails')}</h3>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="w-24 h-24 flex-shrink-0">
                      <div className="w-full h-full bg-gray-50 border rounded-lg overflow-hidden flex items-center justify-center">
                        {selectedForm.guardian_photo ? (
                          <img src={selectedForm.guardian_photo} alt={t('studentForms.guardianDetails')} className="w-full h-full object-cover" />
                        ) : (
                          <Eye className="w-8 h-8 text-gray-200" />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-grow">
                      <div><Label className="text-xs text-gray-500">{t('studentForms.name')}</Label><p className="font-medium">{selectedForm.guardian_name}</p></div>
                      <div><Label className="text-xs text-gray-500">{t('common.phone')}</Label><p className="font-medium">{selectedForm.guardian_contact || t('common.na')}</p></div>
                      <div><Label className="text-xs text-gray-500">{t('studentForms.email')}</Label><p className="font-medium">{selectedForm.guardian_email || t('common.na')}</p></div>
                      <div><Label className="text-xs text-gray-500">{t('studentForms.relation')}</Label><p className="font-medium">{selectedForm.guardian_relation || t('common.na')}</p></div>
                      <div className="col-span-full"><Label className="text-xs text-gray-500">{t('studentForms.occupation')}</Label><p className="font-medium">{selectedForm.guardian_occupation || t('common.na')}</p></div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b">{t('studentForms.addressInformation')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-gray-500 uppercase">{t('studentForms.streetAddress')}</Label>
                    <p className="font-medium">{selectedForm.street_address || t('common.na')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase">{t('studentForms.city')}</Label>
                    <p className="font-medium">{selectedForm.city || t('common.na')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase">{t('studentForms.state')}</Label>
                    <p className="font-medium">{selectedForm.state || t('common.na')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase">{t('studentForms.pinCode')}</Label>
                    <p className="font-medium">{selectedForm.pin_code || t('common.na')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase">{t('studentForms.emergency')}</Label>
                    <p className="font-medium text-orange-600 font-bold">{selectedForm.emergency_contact || t('common.na')}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  {t('studentForms.cancel')}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2 text-orange-600 border-orange-300"
                  onClick={() => {
                    setIsDetailDialogOpen(false);
                    handleRequestCorrection(selectedForm);
                  }}
                >
                  <XCircle className="w-4 h-4" />
                  {t('teacherFormReview.requestCorrection')}
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={() => {
                    handleApprove(selectedForm.id);
                    setIsDetailDialogOpen(false);
                  }}
                >
                  <CheckCircle className="w-4 h-4" />
                  {t('studentForms.approve')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Correction Request Dialog */}
      <Dialog open={isCorrectionDialogOpen} onOpenChange={setIsCorrectionDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('teacherFormReview.requestCorrection')}</DialogTitle>
            <DialogDescription>
              {t('teacherFormReview.markFields')}
            </DialogDescription>
          </DialogHeader>
          {selectedForm && (
            <div className="space-y-6 py-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{t('studentForms.name')}:</strong> {selectedForm.first_name} {selectedForm.last_name}
                  ({t('studentForms.rollNo')}: {selectedForm.roll_number})
                </p>
              </div>

              {/* Field Checkboxes */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('teacherFormReview.markFields')}</h3>
                <div className="space-y-3">
                  {Object.keys(fieldLabels).map((fieldKey) => {
                    const fieldValue = (selectedForm as any)[fieldKey];
                    return (
                      <div key={fieldKey} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                        <Checkbox
                          checked={fieldCorrections[fieldKey] || false}
                          onCheckedChange={() => toggleFieldCorrection(fieldKey)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label className="font-medium">{fieldLabels[fieldKey]}</Label>
                          <p className="text-sm text-gray-600 mt-1">
                            {t('teacherFormReview.currentValue')} <span className="font-medium">{fieldValue || t('common.na')}</span>
                          </p>
                          {fieldCorrections[fieldKey] && (
                            <Input
                              placeholder={t('teacherFormReview.addNote', { field: fieldLabels[fieldKey] })}
                              value={fieldNotes[fieldKey] || ''}
                              onChange={(e) => setFieldNotes(prev => ({
                                ...prev,
                                [fieldKey]: e.target.value
                              }))}
                              className="mt-2"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* General Notes */}
              <div>
                <Label className="text-sm font-semibold">{t('teacherFormReview.generalNotes')}</Label>
                <textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder={t('teacherFormReview.generalNotesPlaceholder')}
                  className="w-full mt-2 p-3 border rounded-lg h-24"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsCorrectionDialogOpen(false)}
                  disabled={submitting}
                >
                  {t('studentForms.cancel')}
                </Button>
                <Button
                  className="flex-1 gap-2 bg-orange-600 hover:bg-orange-700"
                  onClick={handleSubmitCorrection}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('teacherFormReview.sending')}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {t('teacherFormReview.sendCorrectionRequest')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

