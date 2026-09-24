import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  ArrowLeft,
  User,
  BookOpen,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Hash,
  Phone,
  Calendar,
  Droplets,
  MapPin,
} from 'lucide-react';
import { studentService } from '@/api/studentService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Label } from '../../ui/label';
import { useAuth } from '@/hooks/useAuth';

interface Student {
  id: number;
  school_id: number;
  class_id: number;
  division_id: number;
  name: string;
  roll_number: string;
  parent_phone?: string;
  formStatus?: 'Completed' | 'Pending' | 'Rejected';
  submittedOn?: string;
  class_name?: string;
  division_name?: string;
}

export function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (studentId && userData?.id) {
      fetchStudentDetail();
      fetchStudentForm();
    }
  }, [studentId, userData]);

  const fetchStudentDetail = async () => {
    try {
      setLoading(true);
      const response = await studentService.getStudentsBySchool(userData!.id);
      if (response.success && response.data) {
        const foundStudent = response.data.find((s: Student) => s.id === parseInt(studentId!));
        if (foundStudent) {
          setStudent(foundStudent);
        } else {
          toast.error('Student not found');
          navigate('/school-dashboard/students');
        }
      }
    } catch (error: any) {
      console.error('Error fetching student detail:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch student details');
      navigate('/school-dashboard/students');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentForm = async () => {
    try {
      // Try to fetch student form data if available
      const response = await fetch(`/api/school/student-form/${studentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFormData(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching student form:', error);
    }
  };

  const getFormStatusIcon = (status?: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'Rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getFormStatusBadge = (status?: string) => {
    const variants: { [key: string]: string } = {
      Completed: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Rejected: 'bg-red-100 text-red-800',
    };
    return variants[status || 'Pending'] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-4 md:p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Student not found</p>
            <Button onClick={() => navigate('/school-dashboard/students')} className="mt-4">
              Back to Students
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/school-dashboard/students')}
              className="border-orange-200 text-orange-600 hover:bg-orange-600 hover:text-white hover:border-orange-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
              <p className="text-gray-600 mt-1">Student Details</p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <Card className="mb-6 border-gray-500 rounded-xl shadow-xl max-w-4xl mx-auto">
          <CardHeader className="bg-gray-300 rounded-t-xl pb-2">
            <CardTitle className="text-xl font-semibold">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm text-black-500">Name</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-blue-500" />
                  <p className="font-medium text-gray-600">{student.name}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-black-500">Roll Number</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <p className="font-medium text-gray-600">{student.roll_number}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-black-500">Class</Label>
                <div className="flex items-center gap-2 mt-1">
                  <BookOpen className="w-4 h-4 text-orange-500" />
                  <p className="font-medium text-gray-600">{student.class_name || 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-black-500">Division</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="w-4 h-4 text-purple-500" />
                  <p className="font-medium text-gray-600">{student.division_name || 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-black-500">Parent Phone</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-green-700" />
                  <p className="font-medium text-gray-600">{student.parent_phone || 'N/A'}</p>
                </div>
              </div>
              {/* <div>
                <Label className="text-sm text-gray-500">Form Status</Label>
                <div className="flex items-center gap-2 mt-1">
                  {getFormStatusIcon(student.formStatus)}
                  <Badge className={getFormStatusBadge(student.formStatus)}>
                    {student.formStatus || 'Pending'}
                  </Badge>
                </div>
              </div> */}
              {student.submittedOn && (
                <div>
                  <Label className="text-sm text-gray-500">Submitted On</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <p className="font-medium">{student.submittedOn}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form Data */}
        {formData && (
          <Card className="border-gray-400 rounded-xl shadow-xl max-w-4xl mx-auto">
            <CardHeader className="bg-gray-300 rounded-t-xl pb-2">
              <CardTitle className="text-xl font-semibold">Form Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formData.first_name && (
                  <div>
                    <Label className="text-sm text-gray-500">First Name</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-blue-500" />
                      <p className="font-medium">{formData.first_name}</p>
                    </div>
                  </div>
                )}
                {formData.last_name && (
                  <div>
                    <Label className="text-sm text-gray-500">Last Name</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-blue-500" />
                      <p className="font-medium">{formData.last_name}</p>
                    </div>
                  </div>
                )}
                {formData.dob && (
                  <div>
                    <Label className="text-sm text-gray-500">Date of Birth</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <p className="font-medium">{formData.dob}</p>
                    </div>
                  </div>
                )}
                {formData.gender && (
                  <div>
                    <Label className="text-sm text-gray-500">Gender</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-indigo-500" />
                      <p className="font-medium capitalize">{formData.gender}</p>
                    </div>
                  </div>
                )}
                {formData.blood_group && (
                  <div>
                    <Label className="text-sm text-gray-500">Blood Group</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Droplets className="w-4 h-4 text-red-500" />
                      <p className="font-medium">{formData.blood_group}</p>
                    </div>
                  </div>
                )}
                {formData.father_name && (
                  <div>
                    <Label className="text-sm text-gray-500">Father's Name</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-cyan-600" />
                      <p className="font-medium">{formData.father_name}</p>
                    </div>
                  </div>
                )}
                {formData.mother_name && (
                  <div>
                    <Label className="text-sm text-gray-500">Mother's Name</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-pink-500" />
                      <p className="font-medium">{formData.mother_name}</p>
                    </div>
                  </div>
                )}
                {formData.address && (
                  <div className="md:col-span-2">
                    <Label className="text-sm text-gray-500">Address</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      <p className="font-medium">{formData.address}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col md:flex-row gap-8 mt-6">
                {formData.photo && (
                  <div>
                    <Label className="text-sm text-gray-500">Photo</Label>
                    <div className="mt-2">
                      <img
                        src={formData.photo}
                        alt={student.name}
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                    </div>
                  </div>
                )}
                {(formData.student_signature || formData.sign) && (
                  <div>
                    <Label className="text-sm text-gray-500">Signature</Label>
                    <div className="mt-2">
                      <img
                        src={formData.student_signature || formData.sign}
                        alt="Signature"
                        className="h-24 w-48 object-contain rounded-lg border bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
