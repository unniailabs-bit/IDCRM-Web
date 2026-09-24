import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { useTranslation } from 'react-i18next';

export default function StudentDataView() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { student } = (location.state || {}) as any;

  if (!student) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{t('studentDataView.noData')}</p>
        <div className="mt-4">
          <Button onClick={() => navigate('/school-dashboard/student-data-sheet')}>{t('studentDataView.back')}</Button>
        </div>
      </div>
    );
  }

  // Replace all old key accesses with new snake_case ones
  const isApproved = student.Status === 'approved';
  const resolveImageSrc = (val: any) => {
    if (!val) return null;
    const str = String(val);
    if (str.startsWith('http') || str.startsWith('/')) return str;
    return `/uploads/${str}`;
  };

  const formatDateForDisplay = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string' && val.includes('-')) {
      const parts = val.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        if (y.length === 4) return `${d}/${m}/${y}`;
      }
    }
    return String(val);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('studentDataView.back')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{student.student_name}</h1>
              <p className="text-gray-600 mt-1">{t('studentDataView.title')}</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('studentDataView.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm text-gray-500">{t('studentDataView.rollNo')}</Label>
                <p className="font-medium mt-1">{student.roll_number}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">{t('studentDataView.dob')}</Label>
                <p className="font-medium mt-1">{formatDateForDisplay(student.dob || student.DOB)}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">{t('studentDataView.gender')}</Label>
                <p className="font-medium mt-1">{student.gender}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">{t('studentDataView.bloodGroup')}</Label>
                <p className="font-medium mt-1">{student.blood_group}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">{t('studentDataView.aadharNo')}</Label>
                <p className="font-medium mt-1">{student.aadhar_no || '-'}</p>
              </div>

              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h3 className="font-semibold text-gray-700 mb-2">{t('studentDataView.familyInfo')}</h3>
              </div>

              <div>
                <Label className="text-sm text-gray-500">{t('studentDataView.fatherName')}</Label>
                <p className="font-medium mt-1">{student.father_name}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">{t('studentDataView.fatherPhone')}</Label>
                <p className="font-medium mt-1">{student.father_phone}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">{t('studentDataView.motherName')}</Label>
                <p className="font-medium mt-1">{student.mother_name}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">{t('studentDataView.motherPhone')}</Label>
                <p className="font-medium mt-1">{student.mother_phone}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">{t('studentDataView.emergencyContact')}</Label>
                <p className="font-medium mt-1">{student.emergency_contact}</p>
              </div>

              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h3 className="font-semibold text-gray-700 mb-2">{t('studentDataView.addressInfo')}</h3>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm text-gray-500">{t('studentDataView.address')}</Label>
                <p className="font-medium mt-1">{student.address}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">{t('studentDataView.city')}</Label>
                <p className="font-medium mt-1">{student.city || '-'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">{t('studentDataView.state')}</Label>
                <p className="font-medium mt-1">{student.state || '-'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">{t('studentDataView.pincode')}</Label>
                <p className="font-medium mt-1">{student.pin_code || '-'}</p>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm text-gray-500">{t('studentDataView.status')}</Label>
                <p className="font-medium mt-1">{isApproved ? t('studentDataView.approved') : t('studentDataView.missingInfo')}</p>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm text-gray-500">{t('studentDataView.photo')}</Label>
                <div className="mt-2">
                  {resolveImageSrc(student.photo || student.Photo) ? (
                    <img
                      src={resolveImageSrc(student.photo || student.Photo)}
                      alt={student.student_name}
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-md flex items-center justify-center border">
                      <span className="text-gray-400">{t('studentDataView.noPhoto')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm text-gray-500">{t('studentDataView.signature')}</Label>
                <div className="mt-2">
                  {resolveImageSrc(student.student_signature || student.sign || student.Sign) ? (
                    <img
                      src={resolveImageSrc(
                        student.student_signature || student.sign || student.Sign
                      )}
                      alt={t('studentDataView.signature')}
                      className="h-20 w-48 object-contain rounded-lg border bg-white"
                    />
                  ) : (
                    <div className="h-20 w-48 bg-gray-100 rounded-md flex items-center justify-center border">
                      <span className="text-gray-400">{t('studentDataView.noSignature')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm text-gray-500">{t('studentDataView.notes')}</Label>
                <p className="font-medium mt-1">{student.Notes || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
