import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import axiosInstance from "@/api/axiosInstance";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";

// Template data matching the school admin templates
const templateData = [
  {
    id: 1,
    name: "Classic Vertical (Green)",
    headerBg: "bg-green-600",
    orientation: "Vertical",
  },
  {
    id: 2,
    name: "Classic Vertical (Blue)",
    headerBg: "bg-blue-600",
    orientation: "Vertical",
  },
  {
    id: 3,
    name: "Modern Horizontal (Yellow)",
    headerBg: "bg-yellow-600",
    orientation: "Horizontal",
  },
];

interface Student {
  id: number;
  name: string;
  roll_number: string;
  gender?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  address?: string;
  photo?: string;
  photoFile?: File;
  photoPreview?: string;
}

// Vertical Card Component
function VerticalCard({ student, template, onImageUpload, uploading }: any) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerBg = template.headerBg || "bg-green-600";

  const handleImageClick = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      onImageUpload(student.id, file);
    }
  };

  const photoUrl = student.photoPreview || student.photo || "/placeholder-student.png";

  return (
    <div className="border rounded-xl shadow-md bg-white overflow-hidden hover:shadow-lg transition-shadow w-full max-w-sm">
      {/* Header */}
      <div className={`p-3 text-white font-semibold text-center text-base ${headerBg}`}>
        {t('imageUploadGrid.studentIdCard')}
      </div>

      <div className="p-4">
        {/* Photo Section */}
        <div className="flex flex-col items-center mb-4">
          <div
            className="relative w-24 h-24 border-2 border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-blue-500 transition-colors"
            onClick={handleImageClick}
          >
            {uploading ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <img
                  src={photoUrl}
                  alt={t('imageUploadGrid.studentPhoto')}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-student.png";
                  }}
                />
                {!student.photo && !student.photoPreview && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <p className="text-xs text-gray-500 mt-2 text-center">
            {student.photo || student.photoPreview ? (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {t('imageUploadGrid.photoUploadedBadge')}
              </span>
            ) : (
              t('imageUploadGrid.clickToUpload')
            )}
          </p>
        </div>

        {/* Student Details */}
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-semibold">{t('common.name')}:</span> {student.name || t('common.na')}
          </div>
          <div>
            <span className="font-semibold">{t('studentForms.rollNo')}:</span> {student.roll_number || t('common.na')}
          </div>
          {student.gender && (
            <div>
              <span className="font-semibold">{t('studentForms.gender')}:</span> {student.gender}
            </div>
          )}
          {student.parent_name && (
            <div>
              <span className="font-semibold">{t('studentForms.father')}:</span> {student.parent_name}
            </div>
          )}
          {student.parent_phone && (
            <div>
              <span className="font-semibold">{t('common.phone')}:</span> {student.parent_phone}
            </div>
          )}
          {student.address && (
            <div>
              <span className="font-semibold">{t('studentForms.streetAddress')}:</span> {student.address}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Horizontal Card Component
function HorizontalCard({ student, template, onImageUpload, uploading }: any) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerBg = template.headerBg || "bg-yellow-600";

  const handleImageClick = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('imageUploadGrid.imageSizeError'));
        return;
      }
      onImageUpload(student.id, file);
    }
  };

  const photoUrl = student.photoPreview || student.photo || "/placeholder-student.png";

  return (
    <div className="border rounded-xl shadow-md bg-white overflow-hidden hover:shadow-lg transition-shadow w-full max-w-md">
      {/* Header */}
      <div className={`p-3 text-white font-semibold text-center text-base ${headerBg}`}>
        {t('imageUploadGrid.studentIdCard')}
      </div>

      <div className="flex gap-3 p-4">
        {/* Photo Section */}
        <div className="flex flex-col items-center">
          <div
            className="relative w-20 h-20 border-2 border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-blue-500 transition-colors"
            onClick={handleImageClick}
          >
            {uploading ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <img
                  src={photoUrl}
                  alt={t('imageUploadGrid.studentPhoto')}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-student.png";
                  }}
                />
                {!student.photo && !student.photoPreview && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80">
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          {student.photo || student.photoPreview ? (
            <span className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {t('imageUploadGrid.photoUploadedBadge')}
            </span>
          ) : (
            <span className="text-xs text-gray-500 mt-1">{t('imageUploadGrid.clickToUpload')}</span>
          )}
        </div>

        {/* Details Section */}
        <div className="flex-1 min-w-0 space-y-1 text-sm">
          <div>
            <span className="font-semibold">{t('common.name')}:</span> {student.name || t('common.na')}
          </div>
          <div>
            <span className="font-semibold">{t('studentForms.rollNo')}:</span> {student.roll_number || t('common.na')}
          </div>
          {student.gender && (
            <div>
              <span className="font-semibold">{t('studentForms.gender')}:</span> {student.gender}
            </div>
          )}
          {student.parent_name && (
            <div>
              <span className="font-semibold">{t('studentForms.father')}:</span> {student.parent_name}
            </div>
          )}
          {student.parent_phone && (
            <div>
              <span className="font-semibold">{t('common.phone')}:</span> {student.parent_phone}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TeacherImageUploadGrid() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth(); // Changed from user to userData to match original code
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState(templateData[0]);
  const [uploadingStudentId, setUploadingStudentId] = useState<number | null>(null); // Renamed from uploadingIds to match original code
  const [isSubmitting, setIsSubmitting] = useState(false); // Renamed from submitting to match original code
  const [loading, setLoading] = useState(true); // Added loading state

  const divisionId = location.state?.divisionId; // Added divisionId from instruction
  const divisionName = location.state?.divisionName; // Added divisionName from instruction

  useEffect(() => {
    if (!divisionId) { // Changed condition to use divisionId
      toast.error(t('imageUploadGrid.noStudents'));
      navigate("/teacher-dashboard/importstudents"); // Changed path to match original code
      return;
    }
    fetchStudents(); // Call fetchStudents
  }, [divisionId, navigate, t]); // Added t to dependency array

  const fetchStudents = async () => { // Added fetchStudents function
    try {
      const response = await axiosInstance.get(`/api/teacher/division-students/${divisionId}`); // Adjusted API path
      if (response.data.success) {
        setStudents(response.data.students);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error(t('studentForms.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (studentId: number, file: File) => {
    setUploadingStudentId(studentId); // Use single uploadingStudentId

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      // Update student with preview
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? { ...s, photoPreview: previewUrl, photoFile: file }
            : s
        )
      );

      toast.success(t('imageUploadGrid.uploaded', { name: students.find((s) => s.id === studentId)?.name }));
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(t('imageUploadGrid.submissionError')); // Reused translation key
    } finally {
      setUploadingStudentId(null);
    }
  };

  const handleSubmitForIDGeneration = async () => { // Renamed from handleSubmitAll
    // Check if all students have photos
    const studentsWithoutPhotos = students.filter(
      (s) => !s.photo && !s.photoPreview
    );

    if (studentsWithoutPhotos.length > 0) {
      toast.error(
        t('imageUploadGrid.missingPhotos', { count: studentsWithoutPhotos.length })
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload all photos first
      const uploadPromises = students.map(async (student) => {
        if (student.photoFile) {
          const formData = new FormData();
          formData.append("photo", student.photoFile);
          formData.append("student_form_id", student.id.toString()); // Changed to student_form_id to match original API

          const response = await axiosInstance.post(
            "/api/teacher/upload-student-photo", // Adjusted API path
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          return {
            studentId: student.id,
            photoUrl: response.data.photo_url || response.data.photo,
          };
        }
        return { studentId: student.id, photoUrl: student.photo };
      });

      await Promise.all(uploadPromises); // Wait for all uploads to complete

      // Submit all students for ID card generation
      const submitData = {
        student_form_ids: students.map((student) => student.id), // Changed to student_form_ids
        template_id: selectedTemplate.id,
      };

      const response = await axiosInstance.post(
        "/api/teacher/submit-for-id-generation", // Adjusted API path
        submitData
      );

      if (response.data.success) {
        toast.success(t('imageUploadGrid.submissionSuccess'));
        navigate("/teacher-dashboard/my-classes"); // Changed path to match original code
      } else {
        toast.error(response.data.message || t('imageUploadGrid.submissionError'));
      }
    } catch (error: any) {
      console.error("Error submitting for ID generation:", error);
      toast.error(
        error.response?.data?.message ||
        t('imageUploadGrid.submissionError')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">{t('imageUploadGrid.noStudents')}</p>
            <Button onClick={() => navigate("/teacher-dashboard/importstudents")}>
              {t('imageUploadGrid.goToImport')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const studentsWithPhotos = students.filter((s) => s.photo || s.photoPreview).length;
  const totalStudents = students.length;

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('imageUploadGrid.title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('imageUploadGrid.subtitle')} {divisionName && `- ${divisionName}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-green-600">{studentsWithPhotos}</span> /{" "}
            <span className="font-semibold">{totalStudents}</span> {t('imageUploadGrid.photosUploaded', { count: studentsWithPhotos, total: totalStudents })}
          </div>
          <Button
            onClick={handleSubmitForIDGeneration}
            disabled={isSubmitting || studentsWithPhotos < totalStudents}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('imageUploadGrid.submitting')}
              </>
            ) : (
              t('imageUploadGrid.submitForID')
            )}
          </Button>
        </div>
      </div>

      {/* Template Selection */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-3">{t('imageUploadGrid.selectTemplate')}</h3>
          <div className="flex flex-wrap gap-3">
            {templateData.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`px-4 py-2 rounded-lg transition ${selectedTemplate.id === template.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                {template.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {students.map((student) => (
          <div key={student.id} className="flex flex-col">
            {selectedTemplate.orientation === "Horizontal" ? (
              <HorizontalCard
                student={student}
                template={selectedTemplate}
                onImageUpload={handleImageUpload}
                uploading={uploadingStudentId === student.id}
              />
            ) : (
              <VerticalCard
                student={student}
                template={selectedTemplate}
                onImageUpload={handleImageUpload}
                uploading={uploadingStudentId === student.id}
              />
            )}
          </div>
        ))}
      </div>

      {/* Progress Indicator */}
      {studentsWithPhotos < totalStudents && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>{t('imageUploadGrid.note')}:</strong> {t('imageUploadGrid.noteText', { count: totalStudents, remaining: totalStudents - studentsWithPhotos })}
          </p>
        </div>
      )}
    </div>
  );
}
