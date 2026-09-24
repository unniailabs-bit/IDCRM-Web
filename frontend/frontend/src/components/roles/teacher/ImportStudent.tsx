import React, { useRef, useState, DragEvent, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Image as ImageIcon,
  PenTool,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Plus,
  File,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const ImportStudents: React.FC = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const signInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('');

  // Local states for photo and sign import (Design/Placeholder logic)
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [signFile, setSignFile] = useState<File | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [signLoading, setSignLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string>('');
  const [photoSuccess, setPhotoSuccess] = useState<string>('');
  const [signError, setSignError] = useState<string>('');
  const [signSuccess, setSignSuccess] = useState<string>('');

  // Progress states
  const [excelProgress, setExcelProgress] = useState(0);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [signProgress, setSignProgress] = useState(0);

  // Validation error states
  const [excelValidationErrors, setExcelValidationErrors] = useState<any[]>([]);
  const [photoValidationErrors, setPhotoValidationErrors] = useState<any[]>([]);
  const [signValidationErrors, setSignValidationErrors] = useState<any[]>([]);

  const downloadErrorReport = (errors: any[], type: 'excel' | 'photo' | 'signature') => {
    let content = '';
    const dateStr = new Date().toLocaleString();

    if (type === 'excel') {
      content += `==================================================\n`;
      content += `IMPORT ERROR REPORT - EXCEL DATA\n`;
      content += `==================================================\n`;
      content += `Generated on: ${dateStr}\n\n`;
      content += `Rows with validation issues:\n`;
      content += `--------------------------------------------------\n`;

      errors.forEach((errObj: any) => {
        content += `Row ${errObj.row}:\n`;
        errObj.errors.forEach((msg: string) => {
          content += `  - ${msg}\n`;
        });
        content += `--------------------------------------------------\n`;
      });
    } else {
      content += `==================================================\n`;
      content += `ZIP UPLOAD ERROR REPORT - ${type.toUpperCase()}S\n`;
      content += `==================================================\n`;
      content += `Generated on: ${dateStr}\n\n`;
      content += `Failed ${type}s details:\n`;
      content += `--------------------------------------------------\n`;

      errors.forEach((f: any) => {
        content += `File: ${f.file || 'Unknown'}\n`;
        if (f.gr_number) {
          content += `GR Number: ${f.gr_number}\n`;
        }
        content += `Reason: ${f.reason || 'Unknown error'}\n`;
        content += `--------------------------------------------------\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${type}_import_errors_${Date.now()}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch teacher's classes
  useEffect(() => {
    const fetchClasses = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/teacher/myclass/dashboard`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.data && res.data.data.divisions) {
          setDivisions(res.data.data.divisions);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
    fetchClasses();
  }, []);

  const REQUIRED_COLUMNS = [
    'GR Number',
    'Roll Number',
    'First Name',
    'Middle Name',
    'Last Name',
    'Date of Birth',
    'Gender',
    'Blood Group',
    'Father Name',
    'Father Email',
    'Mother Name',
    'Street Address',
    'City',
    'State',
    'PIN Code',
    'Emergency Contact',
    'Guardian Name',
    'Guardian Phone',
    'Guardian Email',
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setExcelValidationErrors([]);
    if (!file) {
      setError(t('importStudents.noFileSelected'));
      setSuccess('');
      return;
    }
    await validateFile(file);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setPhotoValidationErrors([]);
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setPhotoFiles((prev) => [...prev, ...newFiles]);
      setPhotoError('');
      setPhotoSuccess('');
    }
    if (e.target) e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSignChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSignValidationErrors([]);
    if (file) setSignFile(file);
  };

  const handlePhotoUpload = async () => {
    if (photoFiles.length === 0) {
      setPhotoError(t('importStudents.noPhotoSelected'));
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setPhotoError(t('importStudents.notLoggedIn'));
      return;
    }

    const selectedClassData = divisions.find((d) => d.division_id.toString() === selectedDivision);
    if (!selectedClassData) {
      setPhotoError(t('importStudents.pleaseSelectClass'));
      return;
    }

    const formData = new FormData();
    photoFiles.forEach((file) => {
      if (file.name.toLowerCase().endsWith('.zip')) {
        formData.append('zipFile', file);
      } else {
        formData.append('photos', file);
      }
    });
    formData.append('class_id', selectedClassData.class_id.toString());
    formData.append('division_id', selectedClassData.division_id.toString());

    try {
      setPhotoLoading(true);
      setPhotoError('');
      setPhotoSuccess('');
      setPhotoValidationErrors([]);

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/teacher/student-forms/bulk-photo-upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setPhotoProgress(percentCompleted);
            }
          },
        }
      );

      const { success, message, summary, details } = res.data;

      const successCount = summary?.success_count || res.data.success_count || 0;
      const failedCount = summary?.failed_count || res.data.failed_count || 0;

      if (failedCount > 0) {
        setPhotoValidationErrors(details?.failed || []);
        setPhotoError(
          t('importStudents.photosFailed', {
            count: failedCount,
            details: t('importStudents.matchingFailed')
          })
        );
        setPhotoSuccess(t('importStudents.photosUploaded', { count: successCount }));
        toast.warning(t('importStudents.importSummary', { successCount, failedCount }));
      } else {
        setPhotoSuccess(t('importStudents.photoUploadSuccess', { count: successCount }));
        toast.success(message || res.data.message || 'Photos uploaded successfully');
      }

      setPhotoFiles([]);
    } catch (err: any) {
      console.error(err);
      const responseData = err.response?.data;
      if (responseData?.details?.failed && Array.isArray(responseData.details.failed)) {
        setPhotoValidationErrors(responseData.details.failed);
      }
      const errorMessage =
        responseData?.message || responseData?.error || t('importStudents.photoUploadFailed');
      setPhotoError(errorMessage);
      toast.error(t('importStudents.photoUploadFailed'));
    } finally {
      setPhotoLoading(false);
      setPhotoProgress(0);
    }
  };

  const handleSignUpload = async () => {
    if (!signFile) {
      setSignError(t('importStudents.noSignSelected'));
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setSignError(t('importStudents.notLoggedIn'));
      return;
    }

    const selectedClassData = divisions.find((d) => d.division_id.toString() === selectedDivision);
    if (!selectedClassData) {
      setSignError(t('importStudents.pleaseSelectClass'));
      return;
    }

    const formData = new FormData();
    formData.append('zipFile', signFile);
    formData.append('class_id', selectedClassData.class_id.toString());
    formData.append('division_id', selectedClassData.division_id.toString());

    try {
      setSignLoading(true);
      setSignError('');
      setSignSuccess('');
      setSignValidationErrors([]);

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/teacher/student-forms/bulk-signature-upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setSignProgress(percentCompleted);
            }
          },
        }
      );

      const { summary, details, message } = res.data;
      const successCount = summary?.success_count || res.data.success_count || 0;
      const failedCount = summary?.failed_count || res.data.failed_count || 0;

      if (failedCount > 0) {
        setSignValidationErrors(details?.failed || []);
        setSignError(
          t('importStudents.signaturesFailed', {
            count: failedCount,
            details: t('importStudents.matchingFailed')
          })
        );
        setSignSuccess(t('importStudents.signaturesUploaded', { count: successCount }));
        toast.warning(t('importStudents.importSummary', { successCount, failedCount }));
      } else {
        setSignSuccess(t('importStudents.signUploadSuccess', { count: successCount }));
        toast.success(message || res.data.message || 'Signatures uploaded successfully');
      }

      setSignFile(null);
    } catch (err: any) {
      console.error(err);
      const responseData = err.response?.data;
      if (responseData?.details?.failed && Array.isArray(responseData.details.failed)) {
        setSignValidationErrors(responseData.details.failed);
      }
      const errorMessage =
        responseData?.message || responseData?.error || t('importStudents.signUploadFailed');
      setSignError(errorMessage);
      toast.error(t('importStudents.signUploadFailed'));
    } finally {
      setSignLoading(false);
      setSignProgress(0);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'GR Number',
      'Roll Number',
      'First Name',
      'Middle Name',
      'Last Name',
      'Date of Birth',
      'Gender',
      'Blood Group',
      'Father Name',
      'Father Email',
      'Father Phone',
      'Mother Name',
      'Mother Phone',
      'Street Address',
      'City',
      'State',
      'PIN Code',
      'Emergency Contact',
      'Guardian Name',
      'Guardian Phone',
      'Guardian Email',
    ];

    const sampleRow = [
      'GR2024001',
      '1',
      'John',
      'Bob',
      'Doe',
      '15-05-2010',
      'Male',
      'O+',
      'Bob Doe Sr',
      'father@example.com',
      '9876543210',
      'Jane Doe',
      '9876543211',
      '123 Main Street',
      'Mumbai',
      'Maharashtra',
      '400001',
      '9876543212',
      'John Doe Sr',
      '9876543210',
      'parent@example.com',
    ];

    const csvContent = [headers, sampleRow]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'student_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validateFile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[];

      if (jsonData.length < 2) {
        setError(t('importStudents.headerRequired'));
        setSuccess('');
        setUploadedFile(null);
        return;
      }

      const headers = (jsonData[0] as string[]).map((h) => (h ? h.toString().trim() : ''));
      const normalizedHeaders = headers.map((h) => h.toLowerCase().replace(/\s+/g, ' ').trim());
      const normalizedRequired = REQUIRED_COLUMNS.map((col) =>
        col.toLowerCase().replace(/\s+/g, ' ').trim()
      );

      const missing: string[] = [];
      normalizedRequired.forEach((reqCol) => {
        const found = normalizedHeaders.some(
          (h) =>
            h === reqCol ||
            h.includes(reqCol) ||
            reqCol.includes(h) ||
            (reqCol.includes('gr number') && h.includes('gr')) ||
            (reqCol.includes('roll') && h.includes('roll')) ||
            (reqCol.includes('first name') && (h.includes('first') || h.includes('name'))) ||
            (reqCol.includes('middle name') && h.includes('middle')) ||
            (reqCol.includes('last name') && (h.includes('last') || h.includes('surname'))) ||
            (reqCol.includes('date of birth') && (h.includes('dob') || h.includes('birth'))) ||
            (reqCol.includes('blood group') && h.includes('blood')) ||
            (reqCol.includes('father name') && h.includes('father')) ||
            (reqCol.includes('father email') && h.includes('email')) ||
            (reqCol.includes('mother name') && h.includes('mother')) ||
            (reqCol.includes('street address') &&
              (h.includes('address') || h.includes('street'))) ||
            (reqCol.includes('pin code') && (h.includes('pin') || h.includes('pincode'))) ||
            (reqCol.includes('emergency contact') && h.includes('emergency')) ||
            (reqCol.includes('Guardian phone') && (h.includes('phone') || h.includes('mobile'))) ||
            (reqCol.includes('Guardian email') && (h.includes('email') || h.includes('mail')))
        );
        if (!found) missing.push(reqCol);
      });

      if (missing.length > 0) {
        setError(t('importStudents.missingColumns', { columns: missing.join(', ') }));
        setSuccess('');
        setUploadedFile(null);
      } else {
        setError('');
        setSuccess(t('importStudents.readyToUpload', { name: file.name, count: jsonData.length - 1 }));
        setUploadedFile(file);
      }
    } catch (err) {
      setError(t('importStudents.invalidFormat'));
      setUploadedFile(null);
    }
  };

  const [importData, setImportData] = useState<{ students: any[]; importedCount: number } | null>(
    null
  );

  const handleUpload = async () => {
    if (!uploadedFile) {
      setError(t('importStudents.noFileSelected'));
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError(t('importStudents.notLoggedIn'));
      return;
    }

    let school_id, class_id, division_id;
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      school_id = decoded.school_id;
      class_id = decoded.class_id;
      division_id = decoded.division_id;
    } catch {
      setError(t('importStudents.invalidToken'));
      return;
    }
    // ── Sanitize: trim values and force Date of Birth format ──────────
    const arrayBuffer = await uploadedFile.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws);

    const sanitizedRows = rawRows.map((row) => {
      const clean: Record<string, any> = {};
      Object.keys(row).forEach((key) => {
        let v = row[key];
        const cleanKey = key.trim();

        // Force standard date format for DOB columns
        const isDateColumn = cleanKey.toLowerCase().includes('date') || cleanKey.toLowerCase() === 'dob';
        if (isDateColumn && v) {
          try {
            const dateObj = v instanceof Date ? v : new Date(v);
            if (!isNaN(dateObj.getTime())) {
              const day = dateObj.getDate().toString().padStart(2, '0');
              const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
              const year = dateObj.getFullYear();
              v = `${day}-${month}-${year}`;
            }
          } catch (e) {
            // Keep original value if conversion fails
          }
        }

        clean[cleanKey] = typeof v === 'string' ? v.trim() : v;
      });
      return clean;
    });

    const newWs = XLSX.utils.json_to_sheet(sanitizedRows);
    const newWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWb, newWs, 'Sheet1');
    const sanitizedBuffer = XLSX.write(newWb, { bookType: 'xlsx', type: 'array' });
    const sanitizedFile = new window.File([sanitizedBuffer], uploadedFile.name, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    // ────────────────────────────────────────────────────────────────────

    const formData = new FormData();
    formData.append('file', sanitizedFile);
    formData.append('school_id', school_id);

    if (selectedDivision) {
      const selectedClassData = divisions.find(
        (d) => d.division_id.toString() === selectedDivision
      );
      if (selectedClassData) {
        formData.append('class_id', selectedClassData.class_id);
        formData.append('division_id', selectedClassData.division_id);
      }
    } else {
      if (!class_id || !division_id) {
        setError(t('importStudents.pleaseSelectClass'));
        return;
      }
      formData.append('class_id', class_id);
      formData.append('division_id', division_id);
    }

    try {
      setLoading(true);
      setExcelValidationErrors([]);
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/teacher/import-excels`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setExcelProgress(percentCompleted);
            }
          },
        }
      );

      const importedStudents = res.data.students || [];
      const errorsList = res.data.errors || [];
      if (res.data.duplicateRolls && res.data.duplicateRolls.length > 0) {
        errorsList.push({
          row: 'Existing Rolls',
          errors: res.data.duplicateRolls.map((r: any) => `Roll number ${r} already exists in this school`)
        });
      }
      if (res.data.duplicateGRs && res.data.duplicateGRs.length > 0) {
        errorsList.push({
          row: 'Existing GRs',
          errors: res.data.duplicateGRs.map((g: any) => `GR Number ${g} already exists`)
        });
      }

      if (errorsList.length > 0) {
        setExcelValidationErrors(errorsList);
        setSuccess(t('importStudents.importSuccess', { count: res.data.count }) + ' (with some errors)');
      } else {
        setSuccess(t('importStudents.importSuccess', { count: res.data.count }));
      }
      setError('');
      setUploadedFile(null);

      const transformedStudents = importedStudents.map((s: any) => ({
        id: s.id,
        name: `${s.first_name || ''} ${s.middle_name || ''} ${s.last_name || ''}`.trim() || 'N/A',
        roll_number: s.roll_number,
        gr_number: s.gr_number,
      }));

      setImportData({ students: transformedStudents, importedCount: res.data.count });
    } catch (err: any) {
      const responseData = err.response?.data;
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        setExcelValidationErrors(responseData.errors);
      }
      setError(responseData?.message || t('importStudents.uploadFailed'));
    } finally {
      setLoading(false);
      setExcelProgress(0);
    }
  };

  const goToNextStep = () => {
    if (importData) {
      navigate('/teacher-dashboard/upload-images', {
        state: { students: importData.students, importedCount: importData.importedCount },
      });
    } else {
      navigate('/teacher-dashboard/student-list');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 md:px-8">
      <div className="w-full max-w-7xl bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold">{t('importStudents.title')}</h1>
            <p className="text-blue-100 mt-2 opacity-90">
              {t('importStudents.subtitle')}
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-6 py-3 bg-white text-blue-900 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-md active:scale-95"
          >
            <Download className="w-5 h-5" />
            {t('importStudents.downloadTemplate')}
          </button>
        </div>

        <div className="p-8">
          {/* Class Selection & Controls */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                {t('importStudents.selectClass')} <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all cursor-pointer font-medium"
              >
                <option value="">{t('importStudents.chooseClass')}</option>
                {divisions.map((div: any) => (
                  <option key={div.division_id} value={div.division_id}>
                    {div.class_name} - {div.division_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Section 1: Student List */}
            <div className="flex flex-col h-full">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                {t('importStudents.studentRecords')}
              </h3>
              <ImportCard
                id="student-list"
                title={t('importStudents.studentList')}
                description={t('importStudents.uploadExcelDesc')}
                icon={<FileSpreadsheet className="w-10 h-10 text-green-600" />}
                file={uploadedFile}
                loading={loading}
                error={error}
                success={success}
                onBrowse={() => fileInputRef.current?.click()}
                onUpload={handleUpload}
                progress={excelProgress}
                disabled={!selectedDivision}
                accept=".xlsx,.xls,.csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                onRemove={() => setUploadedFile(null)}
                onFilesAdded={(files) => {
                  if (files.length > 0) {
                    validateFile(files[0]);
                  }
                }}
                clickToSelectText={t('importStudents.clickToSelect')}
                orDropFilesText={t('importStudents.orDropFiles')}
                clearAllText={t('importStudents.clearAll')}
                selectedFilesText={(count: number) => t('importStudents.selectedFiles', { count })}
                startImportText={t('importStudents.startImport')}
                processingText={t('importStudents.processing')}
                uploadingText={t('importStudents.uploading')}
                processingDataText={t('importStudents.processingData')}
                connectingText={t('importStudents.connecting')}
                validationErrors={excelValidationErrors}
                onDownloadErrors={() => downloadErrorReport(excelValidationErrors, 'excel')}
              />
            </div>

            {/* Section 2: Photos */}
            <div className="flex flex-col h-full">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                {t('importStudents.profilePhotos')}
              </h3>
              <ImportCard
                id="photo-import"
                title={t('importStudents.photoImport')}
                description={t('importStudents.uploadPhotoDesc')}
                icon={<ImageIcon className="w-10 h-10 text-blue-600" />}
                files={photoFiles}
                loading={photoLoading}
                error={photoError}
                success={photoSuccess}
                onBrowse={() => photoInputRef.current?.click()}
                onUpload={handlePhotoUpload}
                progress={photoProgress}
                disabled={!selectedDivision}
                accept=".zip,image/*"
                multiple
                ref={photoInputRef}
                onChange={handlePhotoChange}
                onRemove={() => setPhotoFiles([])}
                onRemoveFile={handleRemovePhoto}
                onFilesAdded={(files) => {
                  const newFiles = Array.from(files);
                  setPhotoFiles((prev) => [...prev, ...newFiles]);
                  setPhotoError('');
                  setPhotoSuccess('');
                }}
                clickToSelectText={t('importStudents.clickToSelect')}
                orDropFilesText={t('importStudents.orDropFiles')}
                clearAllText={t('importStudents.clearAll')}
                selectedFilesText={(count: number) => t('importStudents.selectedFiles', { count })}
                startImportText={t('importStudents.startImport')}
                processingText={t('importStudents.processing')}
                uploadingText={t('importStudents.uploading')}
                processingDataText={t('importStudents.processingData')}
                connectingText={t('importStudents.connecting')}
                validationErrors={photoValidationErrors}
                onDownloadErrors={() => downloadErrorReport(photoValidationErrors, 'photo')}
              />
            </div>

            {/* Section 3: Signatures */}
            <div className="flex flex-col h-full">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                {t('importStudents.signaturesTitle')}
              </h3>
              <ImportCard
                id="sign-import"
                title={t('importStudents.signImport')}
                description={t('importStudents.uploadSignDesc')}
                icon={<PenTool className="w-10 h-10 text-purple-600" />}
                file={signFile}
                loading={signLoading}
                error={signError}
                success={signSuccess}
                onBrowse={() => signInputRef.current?.click()}
                onUpload={handleSignUpload}
                progress={signProgress}
                disabled={!selectedDivision}
                accept=".zip"
                ref={signInputRef}
                onChange={handleSignChange}
                onRemove={() => setSignFile(null)}
                onFilesAdded={(files) => {
                  if (files.length > 0) {
                    setSignFile(files[0]);
                  }
                }}
                clickToSelectText={t('importStudents.clickToSelect')}
                orDropFilesText={t('importStudents.orDropFiles')}
                clearAllText={t('importStudents.clearAll')}
                selectedFilesText={(count: number) => t('importStudents.selectedFiles', { count })}
                startImportText={t('importStudents.startImport')}
                processingText={t('importStudents.processing')}
                uploadingText={t('importStudents.uploading')}
                processingDataText={t('importStudents.processingData')}
                connectingText={t('importStudents.connecting')}
                validationErrors={signValidationErrors}
                onDownloadErrors={() => downloadErrorReport(signValidationErrors, 'signature')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ImportCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  file?: File | null;
  files?: File[];
  loading: boolean;
  error?: string;
  success?: string;
  onBrowse: () => void;
  onUpload: () => void;
  progress?: number;
  disabled: boolean;
  accept: string;
  multiple?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onRemoveFile?: (index: number) => void;
  onFilesAdded?: (files: FileList) => void;
  // i18n text props
  clickToSelectText: string;
  orDropFilesText: string;
  clearAllText: string;
  selectedFilesText: (count: number) => string;
  startImportText: string;
  processingText: string;
  uploadingText: string;
  processingDataText: string;
  connectingText: string;
  // New download error report props
  validationErrors?: any[];
  onDownloadErrors?: () => void;
}

const ImportCard = React.forwardRef<HTMLInputElement, ImportCardProps>(
  (
    {
      id,
      title,
      description,
      icon,
      file,
      files,
      loading,
      progress,
      error,
      success,
      onBrowse,
      onUpload,
      disabled,
      accept,
      multiple,
      onChange,
      onRemove,
      onRemoveFile,
      onFilesAdded,
      clickToSelectText,
      orDropFilesText,
      clearAllText,
      selectedFilesText,
      startImportText,
      processingText,
      uploadingText,
      processingDataText,
      connectingText,
      validationErrors,
      onDownloadErrors,
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = useState(false);
    const hasFiles = multiple ? files && files.length > 0 : !!file;
    const filesCount = files?.length || 0;

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles && droppedFiles.length > 0) {
        if (multiple && onFilesAdded) {
          onFilesAdded(droppedFiles);
        } else if (!multiple) {
          // For single file cards, we use the input's onChange behavior
          // But we need a way to pass it. For now, multiple is focus.
          if (onFilesAdded) onFilesAdded(droppedFiles);
        }
      }
    };

    return (
      <div
        className={`flex-1 border-2 border-gray-100 rounded-2xl bg-white p-6 flex flex-col shadow-sm transition-all ${disabled ? 'opacity-50 pointer-events-none' : 'hover:shadow-md hover:border-blue-100'
          }`}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gray-50 rounded-xl">{icon}</div>
          <div>
            <h4 className="font-bold text-gray-900 text-lg">{title}</h4>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>

        <div
          className={`flex-1 min-h-[160px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-4 transition-all cursor-pointer ${isDragging
            ? 'border-indigo-500 bg-indigo-50/50'
            : hasFiles
              ? 'border-blue-300 bg-blue-50/20'
              : 'border-gray-200 bg-gray-50/50'
            } hover:bg-blue-50/30 hover:border-blue-300`}
          onClick={onBrowse}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!hasFiles ? (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-3" />
              <p className="text-sm font-semibold text-gray-600">
                {clickToSelectText}
                <br />
                <span className="text-xs font-normal text-gray-400">{orDropFilesText}</span>
              </p>
            </>
          ) : (
            <div className="w-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {selectedFilesText(multiple ? filesCount : 1)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="text-[10px] font-bold text-red-500 hover:text-red-700 underline"
                >
                  {clearAllText}
                </button>
              </div>

              <div className="max-h-[120px] overflow-y-auto space-y-1 mb-2 pr-1 custom-scrollbar">
                {multiple && files ? (
                  files.map((f, idx) => (
                    <div
                      key={`${f.name}-${idx}`}
                      className="flex items-center justify-between bg-white/80 p-2 rounded-lg border border-blue-100/50 group"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <ImageIcon className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        <span className="text-[11px] font-medium text-gray-700 truncate">
                          {f.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFile?.(idx);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-between bg-white/80 p-2 rounded-lg border border-blue-100/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <File className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-[11px] font-medium text-gray-700 truncate">
                        {file?.name}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-400">
                      {file && (file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          <input
            type="file"
            ref={ref}
            className="hidden"
            accept={accept}
            multiple={multiple}
            onChange={onChange}
          />
        </div>

        {/* Upload button inside card for clarity */}
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpload();
            }}
            disabled={!hasFiles || loading}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {processingText}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {startImportText}
              </>
            )}
          </button>

          {loading && progress !== undefined && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                <span>
                  {progress === 0
                    ? connectingText
                    : progress === 100
                      ? processingDataText
                      : uploadingText}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(59,130,246,0.5)] ${progress === 100
                    ? 'bg-green-500'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                    }`}
                  style={{ width: `${Math.max(progress, 2)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="mt-4 min-h-[20px] flex flex-col gap-2">
          {error && (
            <div className="flex flex-col gap-2 bg-red-50 p-2.5 rounded-lg border border-red-100">
              <div className="flex items-center gap-2 text-red-600 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
              {validationErrors && validationErrors.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadErrors?.();
                  }}
                  className="mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg transition-all active:scale-95 text-[11px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Error Report ({validationErrors.length})
                </button>
              )}
            </div>
          )}
          {success && (
            <div className="flex flex-col gap-2 bg-green-50 p-2.5 rounded-lg border border-green-100">
              <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{success}</span>
              </div>
              {validationErrors && validationErrors.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadErrors?.();
                  }}
                  className="mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-lg transition-all active:scale-95 text-[11px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Error Report ({validationErrors.length})
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

ImportCard.displayName = 'ImportCard';
