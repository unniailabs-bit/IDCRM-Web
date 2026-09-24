import React, { useRef, useState, DragEvent } from 'react';
import * as XLSX from 'xlsx';
import { Download, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { teachersApi } from '@/api/teachers';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

interface ImportTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingEmails: string[];
}

export const ImportTeacherModal: React.FC<ImportTeacherModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingEmails,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { userData } = useAuth();
  const { t } = useTranslation();
  const schoolId = userData?.id;

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  // Required columns for Teacher
  const REQUIRED_COLUMNS = ['Name', 'Email', 'Phone', 'Subject', 'Status', 'Password'];

  // Open file selector
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setValidationErrors([]);
    if (!file) {
      setError(t('teacherManagement.noFileSelected'));
      setSuccess('');
      return;
    }
    await validateFile(file);
  };

  const downloadTemplate = () => {
    const headers = ['Name', 'Email', 'Phone', 'Subject', 'Status', 'Password'];

    const sampleRow = [
      'John Doe',
      'john.doe@school.edu',
      '9876543210',
      'Mathematics',
      'Active',
      'password@123',
    ];

    const csvContent = [headers, sampleRow]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'teacher_import_template.csv');
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
        setError(t('teacherManagement.fileMinRows'));
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
        const found = normalizedHeaders.some((h) => h === reqCol || h.includes(reqCol));
        if (!found) {
          missing.push(REQUIRED_COLUMNS[normalizedRequired.indexOf(reqCol)]);
        }
      });

      if (missing.length > 0) {
        setError(
          t('teacherManagement.missingColumns', { missing: missing.join(', ') })
        );
        setSuccess('');
        setUploadedFile(null);
      } else {
        setError('');
        setSuccess(t('teacherManagement.fileReady', { name: file.name, count: jsonData.length - 1 }));
        setUploadedFile(file);
      }
    } catch (err) {
      console.error(err);
      setError(t('teacherManagement.invalidFile'));
      setSuccess('');
      setUploadedFile(null);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setValidationErrors([]);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await validateFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const downloadErrorReport = (errorsList: any[]) => {
    let content = `==================================================\n`;
    content += `TEACHER IMPORT ERROR REPORT\n`;
    content += `==================================================\n`;
    content += `Generated on: ${new Date().toLocaleString()}\n\n`;
    content += `Rows with validation issues:\n`;
    content += `--------------------------------------------------\n`;

    errorsList.forEach((errObj: any) => {
      content += `Row ${errObj.row}:\n`;
      errObj.errors.forEach((msg: string) => {
        content += `  - ${msg}\n`;
      });
      content += `--------------------------------------------------\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `teacher_import_errors_${Date.now()}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (!uploadedFile) {
      setError(t('teacherManagement.noFileSelected'));
      return;
    }

    if (!schoolId) {
      setError(t('teacherManagement.schoolIdMissingImport'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setValidationErrors([]);

      const formData = new FormData();
      formData.append('file', uploadedFile);

      const res = await teachersApi.importTeachers(schoolId, formData);

      if (res.success) {
        const count = res.count || 0;
        const backendErrors = res.errors || [];
        
        if (backendErrors.length > 0) {
          setValidationErrors(backendErrors);
          setSuccess(
            t('teacherManagement.importSuccess', { successCount: count, errorCount: backendErrors.length }) + ' (with some errors)'
          );
          setError(`Validation errors found in ${backendErrors.length} rows.`);
        } else {
          setSuccess(
            t('teacherManagement.importSuccess', { successCount: count, errorCount: 0 })
          );
          setError('');
        }
        
        setUploadedFile(null);
        onSuccess(); // Refresh list to show successfully imported teachers

        if (backendErrors.length === 0) {
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } else {
        setError(res.message || t('teacherManagement.importFailed'));
        setSuccess('');
      }
    } catch (err: any) {
      console.error(err);
      const responseData = err.response?.data;
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        setValidationErrors(responseData.errors);
      }
      const errorMessage = responseData?.message || err.message || t('teacherManagement.uploadFailed');
      setError(errorMessage);
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('teacherManagement.importTitle')}</DialogTitle>
          <DialogDescription>{t('teacherManagement.importDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex gap-2 items-center bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
            >
              <Download className="w-4 h-4" />
              {t('teacherManagement.downloadTemplate')}
            </Button>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <strong>{t('teacherManagement.importNote')}</strong> {t('teacherManagement.importNoteDetail')}
          </div>

          <div
            className="border-2 border-dashed border-gray-300 rounded-xl h-64 flex flex-col justify-center items-center text-center p-4 cursor-pointer hover:border-blue-400 transition-colors bg-gray-50"
            onClick={openFileDialog}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {!uploadedFile ? (
              <>
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-600 font-medium">{t('teacherManagement.dragDropFile')}</p>
                <p className="text-xs text-gray-400 my-1">{t('teacherManagement.or')}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFileDialog();
                  }}
                >
                  {t('teacherManagement.browseFiles')}
                </Button>
                <p className="text-xs text-gray-400 mt-3">
                  {t('teacherManagement.supportFiles')}
                </p>
              </>
            ) : (
              <div className="flex items-center justify-between border rounded-lg p-4 bg-green-100 w-full max-w-sm">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-green-700" />
                  <div className="text-left">
                    <p className="font-medium text-green-700 truncate max-w-[150px]">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-green-600">
                      {(uploadedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-700 hover:text-green-800 hover:bg-green-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFile(null);
                    setValidationErrors([]);
                  }}
                >
                  {t('teacherManagement.change')}
                </Button>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />
          </div>

          {error && (
            <div className="flex flex-col gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2 text-red-600 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="whitespace-pre-wrap max-h-40 overflow-y-auto">{error}</span>
              </div>
              {validationErrors && validationErrors.length > 0 && (
                <button
                  type="button"
                  onClick={() => downloadErrorReport(validationErrors)}
                  className="mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg transition-all active:scale-95 text-xs w-full sm:w-auto"
                >
                  <Download className="w-4 h-4" />
                  Download Error Report ({validationErrors.length})
                </button>
              )}
            </div>
          )}
          {success && (
            <div className="flex flex-col gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>{success}</span>
              </div>
              {validationErrors && validationErrors.length > 0 && (
                <button
                  type="button"
                  onClick={() => downloadErrorReport(validationErrors)}
                  className="mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-lg transition-all active:scale-95 text-xs w-full sm:w-auto"
                >
                  <Download className="w-4 h-4" />
                  Download Error Report ({validationErrors.length})
                </button>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={onClose}>
              {t('teacherManagement.cancel')}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={loading || !uploadedFile}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? t('teacherManagement.adding') : t('teacherManagement.uploadImport')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
