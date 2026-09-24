import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Checkbox } from '../../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { toast } from 'sonner';
import axiosInstance from '@/api/axiosInstance';
import { AlertCircle, Send, Copy } from 'lucide-react';

interface StudentForm {
  id: number;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  blood_group: string;
  father_name: string;
  father_phone: string;
  mother_name: string;
  mother_phone: string;
  street_address: string;
  city: string;
  state: string;
  pin_code: string;
  emergency_contact: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  fields_requiring_correction?: { [key: string]: boolean };
  correction_field_notes?: { [key: string]: string };
  correction_notes?: string;
  roll_number?: string;
  class_name?: string;
  division_name?: string;
}

interface FieldLevelCorrectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formId: number;
  formData: StudentForm | null;
  onSuccess: () => void;
}

const FORM_FIELDS = [
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'dob', label: 'Date of Birth' },
  { key: 'gender', label: 'Gender' },
  { key: 'blood_group', label: 'Blood Group' },
  { key: 'father_name', label: "Father's Name" },
  { key: 'father_phone', label: "Father's Phone" },
  { key: 'mother_name', label: "Mother's Name" },
  { key: 'mother_phone', label: "Mother's Phone" },
  { key: 'street_address', label: 'Street Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'pin_code', label: 'PIN Code' },
  { key: 'emergency_contact', label: 'Emergency Contact' },
  { key: 'parent_name', label: 'Parent/Guardian Name' },
  { key: 'parent_phone', label: 'Parent Phone' },
  { key: 'parent_email', label: 'Parent Email' },
];

export function FieldLevelCorrectionDialog({
  isOpen,
  onClose,
  formId,
  formData,
  onSuccess
}: FieldLevelCorrectionDialogProps) {
  const [fieldsRequiringCorrection, setFieldsRequiringCorrection] = useState<{ [key: string]: boolean }>({});
  const [correctionFieldNotes, setCorrectionFieldNotes] = useState<{ [key: string]: string }>({});
  const [generalNotes, setGeneralNotes] = useState('');
  const [sendVia, setSendVia] = useState<'email' | 'whatsapp' | 'sms' | 'link'>('link');
  const [correctionLink, setCorrectionLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && formData) {
      setFieldsRequiringCorrection(formData.fields_requiring_correction || {});
      setCorrectionFieldNotes(formData.correction_field_notes || {});
      setGeneralNotes(formData.correction_notes || '');
      setCorrectionLink(null);
    }
  }, [isOpen, formData]);

  const handleFieldToggle = (fieldKey: string, needsCorrection: boolean) => {
    setFieldsRequiringCorrection(prev => ({
      ...prev,
      [fieldKey]: needsCorrection
    }));
    
    // If marking as correct, remove correction note
    if (!needsCorrection) {
      setCorrectionFieldNotes(prev => {
        const updated = { ...prev };
        delete updated[fieldKey];
        return updated;
      });
    }
  };

  const handleMarkFieldsAndSend = async () => {
    // Filter only fields that need correction
    const fieldsToCorrect = Object.entries(fieldsRequiringCorrection)
      .filter(([_, needsCorrection]) => needsCorrection)
      .reduce((acc, [key]) => ({ ...acc, [key]: true }), {});

    if (Object.keys(fieldsToCorrect).length === 0) {
      toast.error('Please select at least one field that needs correction');
      return;
    }

    setIsLoading(true);
    try {
      // Mark fields for correction
      const markResponse = await axiosInstance.post(
        `/api/school/student-forms/${formId}/mark-fields-correction`,
        {
          fields_requiring_correction: fieldsToCorrect,
          correction_field_notes: correctionFieldNotes,
          general_notes: generalNotes
        }
      );

      if (markResponse.data.success) {
        setCorrectionLink(markResponse.data.data.correction_link);
        
        // Send link if method selected (for now, only link is supported)
        if (sendVia !== 'link') {
          const sendResponse = await axiosInstance.post(
            `/api/school/student-forms/${formId}/send-correction-link`,
            { send_via: sendVia }
          );
          if (sendResponse.data.success) {
            toast.success(`Correction link sent via ${sendVia}`);
          }
        } else {
          toast.success('Fields marked for correction. Link generated.');
        }
        
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to mark fields for correction');
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => {
    if (correctionLink) {
      navigator.clipboard.writeText(correctionLink);
      toast.success('Link copied to clipboard!');
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark Fields for Correction</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-gray-700">
              Student: {formData.first_name} {formData.last_name} (Roll: {formData.roll_number || 'N/A'})
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Class: {formData.class_name || 'N/A'} | Division: {formData.division_name || 'N/A'}
            </p>
          </div>

          {/* General Notes */}
          <div>
            <Label>General Correction Notes (Optional)</Label>
            <Textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Add any general notes about the corrections needed..."
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Field Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Select Fields Requiring Correction
            </Label>
            <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4">
              {FORM_FIELDS.map((field) => {
                const needsCorrection = fieldsRequiringCorrection[field.key] === true;
                const currentValue = formData[field.key as keyof StudentForm] || 'N/A';
                
                return (
                  <div key={field.key} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      checked={needsCorrection}
                      onCheckedChange={(checked) => handleFieldToggle(field.key, checked === true)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <Label className="font-medium">{field.label}</Label>
                        <span className="text-xs text-gray-500">Current: {String(currentValue).substring(0, 30)}{String(currentValue).length > 30 ? '...' : ''}</span>
                      </div>
                      {needsCorrection && (
                        <Textarea
                          value={correctionFieldNotes[field.key] || ''}
                          onChange={(e) => setCorrectionFieldNotes(prev => ({
                            ...prev,
                            [field.key]: e.target.value
                          }))}
                          placeholder={`What needs to be corrected for ${field.label}?`}
                          className="mt-2 text-sm"
                          rows={2}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Send Method */}
          <div>
            <Label>Send Correction Link Via</Label>
            <Select value={sendVia} onValueChange={(value: any) => setSendVia(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="link">Copy Link Only</SelectItem>
                <SelectItem value="email">Email (Coming Soon)</SelectItem>
                <SelectItem value="whatsapp">WhatsApp (Coming Soon)</SelectItem>
                <SelectItem value="sms">SMS (Coming Soon)</SelectItem>
              </SelectContent>
            </Select>
            {sendVia !== 'link' && (
              <p className="text-xs text-gray-500 mt-1">
                {sendVia} integration will be available soon. For now, please use "Copy Link Only".
              </p>
            )}
          </div>

          {/* Correction Link Display */}
          {correctionLink && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-blue-900">Correction Link Generated</Label>
                  <p className="text-xs text-blue-700 mt-1 break-all">{correctionLink}</p>
                </div>
                <Button variant="outline" size="sm" onClick={copyLink} className="ml-2">
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleMarkFieldsAndSend} disabled={isLoading} className="gap-2">
              <Send className="w-4 h-4" />
              {isLoading ? 'Processing...' : `Mark Fields & ${sendVia === 'link' ? 'Generate Link' : 'Send Link'}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

