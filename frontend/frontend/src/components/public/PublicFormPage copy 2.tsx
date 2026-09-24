import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
} from "../ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Alert, AlertDescription } from "../ui/alert";
import axiosInstance from "@/api/axiosInstance";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle, XCircle, Maximize2 } from "lucide-react";

interface FormData {
  roll_number: string;
  id_no: string;
  gr_no: string;
  sr_no: string;
  admission_no: string;
  register_no: string;
  bus_no: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  blood_group: string;
  photo: string | File;
  father_name: string;
  father_phone: string;
  father_email: string;
  father_occupation: string;
  father_office_address: string;
  father_photo: string | File;
  mother_name: string;
  mother_phone: string;
  mother_email: string;
  mother_occupation: string;
  mother_office_address: string;
  mother_photo: string | File;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  guardian_occupation: string;
  guardian_office_address: string;
  guardian_photo: string | File;
  guardian_relation: string;
  street_address: string;
  city: string;
  state: string;
  pin_code: string;
  emergency_contact: string;
}

interface FieldCorrectionStatus {
  [key: string]: boolean; // true = needs correction, false = correct
}

interface FieldCorrectionNotes {
  [key: string]: string; // field name -> correction note
}

export function PublicFormPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const formId = searchParams.get('formId');
  const revision = searchParams.get('revision');
  const individualToken = searchParams.get('token');

  const [step, setStep] = useState<number>(0); // 0=Verify, 1=Student, 2=Parents, 3=Preview, 4=Submit
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [viewingPhoto, setViewingPhoto] = useState<{ src: string; title: string } | null>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formInfo, setFormInfo] = useState<{
    class_name: string;
    division: string;
    school_id: number;
    existing_form?: any;
    fields_requiring_correction?: FieldCorrectionStatus;
    correction_field_notes?: FieldCorrectionNotes;
    correction_notes?: string;
    requires_correction?: boolean;
  } | null>(null);
  const [formData, setFormData] = useState<FormData>({
    roll_number: "",
    id_no: "",
    gr_no: "",
    sr_no: "",
    admission_no: "",
    register_no: "",
    bus_no: "",
    first_name: "",
    last_name: "",
    dob: "",
    gender: "",
    blood_group: "",
    photo: "",
    father_name: "",
    father_phone: "",
    father_email: "",
    father_occupation: "",
    father_office_address: "",
    father_photo: "",
    mother_name: "",
    mother_phone: "",
    mother_email: "",
    mother_occupation: "",
    mother_office_address: "",
    mother_photo: "",
    guardian_name: "",
    guardian_phone: "",
    guardian_email: "",
    guardian_occupation: "",
    guardian_office_address: "",
    guardian_photo: "",
    guardian_relation: "",
    street_address: "",
    city: "",
    state: "",
    pin_code: "",
    emergency_contact: "",
  });

  useEffect(() => {
    fetchFormInfo();
  }, [token, formId, revision, individualToken]);

  const fetchFormInfo = async () => {
    try {
      const url = formId 
        ? `/api/form-links/public/${token}?formId=${formId}&revision=${revision || ''}&token=${individualToken || ''}`
        : `/api/form-links/public/${token}`;
      
      const response = await axiosInstance.get(url);
      if (response.data.success) {
        const data = response.data.data;
        setFormInfo(data);
        
        // Pre-fill form if existing data exists
        if (data.existing_form) {
          const existing = data.existing_form;
          setFormData({
            roll_number: existing.roll_number || "",
            id_no: existing.id_no || "",
            gr_no: existing.gr_no || "",
            sr_no: existing.sr_no || "",
            admission_no: existing.admission_no || "",
            register_no: existing.register_no || "",
            bus_no: existing.bus_no || "",
            first_name: existing.first_name || "",
            last_name: existing.last_name || "",
            dob: existing.dob || "",
            gender: existing.gender || "",
            blood_group: existing.blood_group || "",
            photo: existing.photo || "",
            father_name: existing.father_name || "",
            father_phone: existing.father_phone || "",
            father_email: existing.father_email || "",
            father_occupation: existing.father_occupation || "",
            father_office_address: existing.father_office_address || "",
            father_photo: existing.father_photo || "",
            mother_name: existing.mother_name || "",
            mother_phone: existing.mother_phone || "",
            mother_email: existing.mother_email || "",
            mother_occupation: existing.mother_occupation || "",
            mother_office_address: existing.mother_office_address || "",
            mother_photo: existing.mother_photo || "",
            guardian_name: existing.guardian_name || "",
            guardian_phone: existing.guardian_phone || "",
            guardian_email: existing.guardian_email || "",
            guardian_occupation: existing.guardian_occupation || "",
            guardian_office_address: existing.guardian_office_address || "",
            guardian_photo: existing.guardian_photo || "",
            guardian_relation: existing.guardian_relation || "",
            street_address: existing.street_address || "",
            city: existing.city || "",
            state: existing.state || "",
            pin_code: existing.pin_code || "",
            emergency_contact: existing.emergency_contact || "",
          });

          // Show correction notice if applicable
          if (data.requires_correction && data.correction_notes) {
            toast.warning('Please review the correction notes and update the form accordingly');
          }
        }
      }
    } catch (error: any) {
      console.error("Error fetching form info:", error);
      toast.error(error.response?.data?.message || "Invalid or expired form link");
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = (currentStep: number) => {
    const requiredFields: (keyof FormData)[] = [];
    
    if (currentStep === 1) {
      requiredFields.push(
        "first_name", "last_name", "dob", "gender", "blood_group", 
        "street_address", "city", "state", "pin_code", "emergency_contact", "photo"
      );
    } else if (currentStep === 2) {
      requiredFields.push(
        "father_name", "father_phone", "father_email", "father_photo",
        "mother_name", "mother_phone", "mother_email", "mother_photo"
      );
    }

    const missingFields = requiredFields.filter(field => {
      const value = formData[field];
      if (!value) return true;
      if (typeof value === 'string' && value.trim() === "") return true;
      return false;
    });
    
    if (missingFields.length > 0) {
      toast.error("Please fill in all mandatory fields marked with *");
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(4, s + 1));
    }
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));
  const goTo = (i: number) => {
    // Only allow going back or going to steps that pass validation
    if (i <= step) {
      setStep(i);
    } else {
      // If trying to go forward, validate all steps in between
      for (let s = step; s < i; s++) {
        if (!validateStep(s)) return;
      }
      setStep(i);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Create FormData
      const submitData = new FormData();

      // Helper to append field if it exists
      const appendIfDefined = (key: string, value: any) => {
        if (value !== undefined && value !== null && value !== "") {
          submitData.append(key, value.toString());
        }
      };

      // 1. Handle Main Photo (Student) - Send as File if it's a File
      if (formData.photo instanceof File) {
        submitData.append("photo", formData.photo);
      } else if (typeof formData.photo === 'string' && formData.photo) {
        submitData.append("photo", formData.photo);
      }

      // 2. Handle Secondary Photos - Convert to Base64 if File
      // This is necessary because the backend public endpoint only supports one file upload ('photo')
      if (formData.father_photo instanceof File) {
        const base64 = await fileToBase64(formData.father_photo);
        submitData.append("father_photo", base64);
      } else if (formData.father_photo) {
        submitData.append("father_photo", formData.father_photo as string);
      }

      if (formData.mother_photo instanceof File) {
        const base64 = await fileToBase64(formData.mother_photo);
        submitData.append("mother_photo", base64);
      } else if (formData.mother_photo) {
        submitData.append("mother_photo", formData.mother_photo as string);
      }

      if (formData.guardian_photo instanceof File) {
        const base64 = await fileToBase64(formData.guardian_photo);
        submitData.append("guardian_photo", base64);
      } else if (formData.guardian_photo) {
        submitData.append("guardian_photo", formData.guardian_photo as string);
      }

      // 3. Append Standard Fields
      appendIfDefined("roll_number", formData.roll_number);
      appendIfDefined("first_name", formData.first_name);
      appendIfDefined("last_name", formData.last_name);
      appendIfDefined("dob", formData.dob);
      appendIfDefined("gender", formData.gender);
      appendIfDefined("blood_group", formData.blood_group);
      
      appendIfDefined("father_name", formData.father_name);
      appendIfDefined("father_phone", formData.father_phone);
      appendIfDefined("father_email", formData.father_email);
      appendIfDefined("father_occupation", formData.father_occupation);
      appendIfDefined("father_office_address", formData.father_office_address);

      appendIfDefined("mother_name", formData.mother_name);
      appendIfDefined("mother_phone", formData.mother_phone);
      appendIfDefined("mother_email", formData.mother_email);
      appendIfDefined("mother_occupation", formData.mother_occupation);
      appendIfDefined("mother_office_address", formData.mother_office_address);

      appendIfDefined("guardian_name", formData.guardian_name);
      appendIfDefined("guardian_phone", formData.guardian_phone);
      appendIfDefined("guardian_email", formData.guardian_email);
      appendIfDefined("guardian_occupation", formData.guardian_occupation);
      appendIfDefined("guardian_office_address", formData.guardian_office_address);
      appendIfDefined("guardian_relation", formData.guardian_relation);

      appendIfDefined("street_address", formData.street_address);
      appendIfDefined("city", formData.city);
      appendIfDefined("state", formData.state);
      appendIfDefined("pin_code", formData.pin_code);
      appendIfDefined("emergency_contact", formData.emergency_contact);

      // Extra fields from work.txt / requirements
      appendIfDefined("id_no", formData.id_no); // Mapped to id_number in some backends, but formLinkController might not use it
      appendIfDefined("id_number", formData.id_no); // Send both keys just in case
      appendIfDefined("gr_no", formData.gr_no);
      appendIfDefined("gr_number", formData.gr_no);
      appendIfDefined("sr_no", formData.sr_no);
      appendIfDefined("sr_number", formData.sr_no);
      appendIfDefined("admission_no", formData.admission_no);
      appendIfDefined("admission_number", formData.admission_no);
      appendIfDefined("register_no", formData.register_no);
      appendIfDefined("registration_number", formData.register_no);
      appendIfDefined("bus_no", formData.bus_no);
      appendIfDefined("bus_number", formData.bus_no);

      // 4. Map Parent Details (Required by backend)
      // Default to Father, then Mother, then Guardian
      const parentName = formData.father_name || formData.mother_name || formData.guardian_name || "";
      const parentPhone = formData.father_phone || formData.mother_phone || formData.guardian_phone || "";
      const parentEmail = formData.father_email || formData.mother_email || formData.guardian_email || "";

      appendIfDefined("parent_name", parentName);
      appendIfDefined("parent_phone", parentPhone);
      appendIfDefined("parent_email", parentEmail);

      const url = formId
        ? `/api/form-links/public/${token}/submit?formId=${formId}&revision=${revision || ''}&token=${individualToken || ''}`
        : `/api/form-links/public/${token}/submit`;

      const response = await axiosInstance.post(url, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success(formId 
          ? "Your corrections have been submitted successfully!" 
          : "Your form has been submitted successfully!");
        setStep(4); // Go to success step
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error(error.response?.data?.message || "Failed to submit form");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string | File) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Helper function to render image preview
  const renderImagePreview = (file: string | File, title: string = "Photo Preview") => {
    if (!file) return <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs text-center p-2">No Photo Uploaded</div>;
    
    const src = file instanceof File ? URL.createObjectURL(file) : file;
    
    return (
      <div 
        className="relative group w-24 h-24 border-2 border-orange-100 rounded-lg overflow-hidden bg-gray-50 shadow-sm cursor-zoom-in transition-transform hover:scale-105"
        onClick={() => setViewingPhoto({ src, title })}
      >
        <img 
          src={src} 
          alt={title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Maximize2 className="w-6 h-6 text-white" />
        </div>
      </div>
    );
  };

  // Helper function to get field correction status
  const getFieldStatus = (fieldName: string): 'correct' | 'needs-correction' | 'neutral' => {
    if (!formInfo?.fields_requiring_correction) return 'neutral';
    const status = formInfo.fields_requiring_correction[fieldName];
    if (status === true) return 'needs-correction';
    if (status === false) return 'correct';
    return 'neutral';
  };

  // Helper function to get correction note for field
  const getFieldCorrectionNote = (fieldName: string): string | null => {
    return formInfo?.correction_field_notes?.[fieldName] || null;
  };

  // Render input with visual indicators
  const renderFieldWithIndicator = (
    fieldName: keyof FormData,
    label: string,
    required: boolean = false,
    type: string = "text",
    placeholder?: string,
    options?: { value: string; label: string }[]
  ) => {
    const fieldStatus = getFieldStatus(fieldName);
    const correctionNote = getFieldCorrectionNote(fieldName);
    const isNeedsCorrection = fieldStatus === 'needs-correction';
    const isCorrect = fieldStatus === 'correct';

    return (
      <div>
        <div className="flex items-center gap-2 mb-1">
          <label className={`text-sm font-medium ${
            isNeedsCorrection ? 'text-red-700' : isCorrect ? 'text-green-700' : 'text-gray-700'
          }`}>
            {label} {required && <span className="text-orange-600">*</span>}
          </label>
          {isNeedsCorrection && (
            <XCircle className="w-4 h-4 text-red-600" />
          )}
          {isCorrect && (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          )}
        </div>

        {type === "select" && options ? (
          <Select
            value={formData[fieldName] as string}
            onValueChange={(value) => handleChange(fieldName, value)}
          >
            <SelectTrigger 
              className={`h-12 ${
                isNeedsCorrection 
                  ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                  : isCorrect 
                  ? 'border-green-500 bg-green-50 focus:ring-green-500'
                  : ''
              }`}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <textarea
            value={formData[fieldName] as string}
            onChange={(e) => handleChange(fieldName, e.target.value)}
            className={`w-full border rounded-md p-3 h-24 ${
              isNeedsCorrection 
                ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                : isCorrect 
                ? 'border-green-500 bg-green-50 focus:ring-green-500 focus:border-green-500'
                : ''
            }`}
            placeholder={placeholder}
          />
        ) : type === "file" ? (
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleChange(fieldName, file);
              }
            }}
            className={`h-12 ${
              isNeedsCorrection 
                ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                : isCorrect 
                ? 'border-green-500 bg-green-50 focus:ring-green-500 focus:border-green-500'
                : ''
            }`}
          />
        ) : (
          <Input
            type={type}
            value={formData[fieldName] as string}
            onChange={(e) => handleChange(fieldName, type === "file" ? e.target.files?.[0] || "" : e.target.value)}
            placeholder={placeholder}
            className={`h-12 ${
              isNeedsCorrection 
                ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                : isCorrect 
                ? 'border-green-500 bg-green-50 focus:ring-green-500 focus:border-green-500'
                : ''
            }`}
          />
        )}

        {/* Correction note hint */}
        {isNeedsCorrection && correctionNote && (
          <div className="mt-1 flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{correctionNote}</p>
          </div>
        )}

        {/* Correct field indicator */}
        {isCorrect && (
          <div className="mt-1 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-xs text-green-700">This field is correct</p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!formInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb]">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h2>
          <p className="text-gray-600">This form link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-4 md:p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-4 md:p-10">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold" style={{ color: "#FF6A00" }}>
            {formInfo.requires_correction ? "Form Correction Required" : "Student Registration Form"}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Class: <span className="font-semibold">{formInfo.class_name}</span> | Division: <span className="font-semibold">{formInfo.division}</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Fields marked with <span className="text-orange-600">*</span> are mandatory
          </p>
        </div>

        {/* Correction Notice Banner */}
        {formInfo.requires_correction && formInfo.fields_requiring_correction && (
          <Alert className="mb-6 border-2 border-red-300 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-2">
                <p className="font-semibold text-base">
                  ⚠️ Please review and correct the highlighted fields below
                </p>
                {formInfo.correction_notes && (
                  <p className="text-sm mt-2 bg-white p-3 rounded border border-red-200">
                    <strong>General Notes:</strong> {formInfo.correction_notes}
                  </p>
                )}
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-700">Fields marked in red need correction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-green-700">Fields marked in green are correct</span>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stepper */}
        {step !== 4 && (
          <div style={{ width: '100%', marginTop: '2.5rem', marginBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Connecting Line Background */}
              <div 
                className="bg-orange-100" 
                style={{ 
                  position: 'absolute', 
                  left: 0, 
                  right: 0, 
                  top: window.innerWidth < 768 ? '20px' : '35px', // Center of 40px or 70px circle
                  height: '4px', 
                  zIndex: 0 
                }} 
              />
              
              {/* Active Connecting Line */}
              <div 
                className="bg-orange-600 transition-all duration-300"
                style={{ 
                  position: 'absolute', 
                  left: 0, 
                  top: window.innerWidth < 768 ? '20px' : '35px', // Center of 40px or 70px circle
                  height: '4px', 
                  zIndex: 0,
                  width: `${(step / 4) * 100}%` 
                }}
              />

              {/* Steps */}
              {[0, 1, 2, 3, 4].map((s) => (
                <div 
                  key={s} 
                  onClick={() => goTo(s)}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    cursor: 'pointer', 
                    zIndex: 10,
                    position: 'relative'
                  }}
                >
                  <div
                    className={`flex items-center justify-center rounded-full font-bold transition-all duration-300 border-2 ${
                      step === s
                        ? "border-orange-600 bg-orange-600 text-white shadow-[0_10px_25px_rgba(37,99,235,0.35)] scale-110"
                        : step > s
                        ? "border-orange-600 bg-orange-600 text-white"
                        : "border-orange-100 bg-white text-gray-500"
                    }`}
                    style={{
                      width: window.innerWidth < 768 ? '40px' : '70px',
                      height: window.innerWidth < 768 ? '40px' : '70px',
                      fontSize: window.innerWidth < 768 ? '1.25rem' : '1.875rem',
                    }}
                  >
                    {s + 1}
                  </div>
                  <p 
                    className={`font-semibold ${step >= s ? "text-black" : "text-gray-400"}`}
                    style={{
                      marginTop: window.innerWidth < 768 ? '0.5rem' : '0.75rem',
                      fontSize: window.innerWidth < 768 ? '0.75rem' : '1.125rem'
                    }}
                  >
                    {['Verify', 'Student', 'Parents', 'Preview', 'Submit'][s]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="mt-2 mb-6">
          {/* STEP 0 - VERIFY */}
          {step === 0 && (
            <div className="mb-10">
              <div className="bg-orange-50 border border-orange-300 p-2 rounded-lg mb-6">
                <div className="flex gap-4">
                  <div className="text-orange-600 text-xl">⚠️</div>
                  <div>
                    <h3 className="font-semibold" style={{ color: '#8B4513' }}>
                      Verify Class Details
                    </h3>
                    <p className="text-sm text-orange-600 mt-1">
                      Please verify the class and division details. If everything is correct, click <b>"Accept & Continue"</b>.
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg text-orange-600 mb-3">Class Details</h3>
              <div className="border-t mb-6" style={{ borderColor: '#FFA500' }}></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Class <span className="text-orange-600">*</span>
                  </label>
                  <Input
                    value={formInfo?.class_name || ""}
                    disabled
                    className="border border-gray-300 bg-orange-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Division <span className="text-orange-600">*</span>
                  </label>
                  <Input
                    value={formInfo?.division || ""}
                    disabled
                    className="border border-gray-300 bg-orange-50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">
                    Roll Number
                  </label>
                  <Input
                    value={formData.roll_number}
                    onChange={(e) => handleChange("roll_number", e.target.value)}
                    placeholder="Enter roll number"
                    className="border border-gray-300 bg-orange-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">ID No.</label>
                  <Input
                    value={formData.id_no}
                    onChange={(e) => handleChange("id_no", e.target.value)}
                    placeholder="Enter ID No."
                    className="border border-gray-300 bg-orange-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">GR NO.</label>
                  <Input
                    value={formData.gr_no}
                    onChange={(e) => handleChange("gr_no", e.target.value)}
                    placeholder="Enter GR NO."
                    className="border border-gray-300 bg-orange-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">SR. No.</label>
                  <Input
                    value={formData.sr_no}
                    onChange={(e) => handleChange("sr_no", e.target.value)}
                    placeholder="Enter SR. No."
                    className="border border-gray-300 bg-orange-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Admission No.</label>
                  <Input
                    value={formData.admission_no}
                    onChange={(e) => handleChange("admission_no", e.target.value)}
                    placeholder="Enter Admission No."
                    className="border border-gray-300 bg-orange-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Register No.</label>
                  <Input
                    value={formData.register_no}
                    onChange={(e) => handleChange("register_no", e.target.value)}
                    placeholder="Enter Register No."
                    className="border border-gray-300 bg-orange-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Bus No.</label>
                  <Input
                    value={formData.bus_no}
                    onChange={(e) => handleChange("bus_no", e.target.value)}
                    placeholder="Enter Bus No. (if applicable)"
                    className="border border-gray-300 bg-orange-50"
                  />
                </div>
              </div>

              <div className="flex justify-center mt-10 md:mt-16 pt-4">
                <Button
                  className="bg-green-600 text-white w-full md:max-w-md py-4 text-lg md:text-xl font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200 h-auto"
                  onClick={() => setStep(1)}
                >
                  ✔ Accept & Continue
                </Button>
              </div>
            </div>
          )}

          {/* STEP 1 - STUDENT DETAILS */}
          {step === 1 && (
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-orange-600">Section 1: Student Details</h3>
              <div className="border-t mt-1 mb-6" style={{ borderColor: '#FFA500' }}></div>

              <div className="grid grid-cols-1 gap-5">
                {renderFieldWithIndicator("first_name", "First Name", true, "text", "Enter first name")}
                {renderFieldWithIndicator("last_name", "Last Name", true, "text", "Enter last name")}
                {renderFieldWithIndicator("dob", "Date of Birth", true, "date")}
                {renderFieldWithIndicator(
                  "gender", 
                  "Gender", 
                  true, 
                  "select",
                  "Select gender",
                  [
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                    { value: "Other", label: "Other" }
                  ]
                )}
                {renderFieldWithIndicator(
                  "blood_group",
                  "Blood Group",
                  true,
                  "select",
                  "Select blood group",
                  [
                    { value: "A+", label: "A+" },
                    { value: "A-", label: "A-" },
                    { value: "B+", label: "B+" },
                    { value: "B-", label: "B-" },
                    { value: "AB+", label: "AB+" },
                    { value: "AB-", label: "AB-" },
                    { value: "O+", label: "O+" },
                    { value: "O-", label: "O-" }
                  ]
                )}
                {renderFieldWithIndicator("street_address", "Address", true, "textarea", "Enter full address")}
                
                {/* City, State, PIN */}
                <div 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: windowWidth < 768 ? 'repeat(1, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
                    gap: '1.25rem'
                  }}
                >
                  {renderFieldWithIndicator("city", "City", true, "text", "Enter city")}
                  {renderFieldWithIndicator("state", "State", true, "text", "Enter state")}
                  {renderFieldWithIndicator("pin_code", "PIN Code", true, "text", "Enter PIN code")}
                </div>

                {renderFieldWithIndicator("emergency_contact", "Emergency Contact", true, "tel", "Enter emergency contact number")}
                <div>
                  {renderFieldWithIndicator("photo", "Upload Student Photograph", true, "file")}
                  <p className="text-xs text-gray-500 mt-1">
                    Accepted formats: JPG, PNG. Max size: 2MB
                  </p>
                </div>
              </div>

              <div 
                style={{
                  display: 'flex',
                  flexDirection: windowWidth < 768 ? 'column-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  marginTop: '2.5rem',
                  marginBottom: '1.5rem',
                  width: '100%'
                }}
              >
                <Button
                  variant="outline"
                  onClick={goBack}
                  className="bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-lg md:text-xl font-semibold"
                  style={{
                    width: windowWidth < 768 ? '100%' : 'auto',
                    minWidth: windowWidth >= 768 ? '200px' : 'unset',
                    height: 'auto',
                    minHeight: windowWidth < 768 ? '50px' : '55px',
                  }}
                >
                  Back
                </Button>
                <Button
                  onClick={goNext}
                  className="bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-lg md:text-xl font-semibold"
                  style={{
                    width: windowWidth < 768 ? '100%' : 'auto',
                    minWidth: windowWidth >= 768 ? '200px' : 'unset',
                    height: 'auto',
                    minHeight: windowWidth < 768 ? '50px' : '55px',
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2 - PARENT DETAILS */}
          {step === 2 && (
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-orange-600">Section 2: Parent Details</h3>
              <div className="border-t mt-1 mb-6" style={{ borderColor: '#FFA500' }}></div>

              <div className="space-y-10">
                {/* Father's Details */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-orange-600 rounded-full"></div>
                      Father's Details
                    </h4>
                  </div>
                  <div className="p-6 bg-white grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderFieldWithIndicator("father_name", "Father's Name", true, "text", "Enter father's name")}
                    {renderFieldWithIndicator("father_phone", "Father's Contact", true, "tel", "Enter father's contact number")}
                    {renderFieldWithIndicator("father_email", "Father's Email", true, "email", "Enter father's email")}
                    {renderFieldWithIndicator("father_occupation", "Father's Occupation", false, "text", "Enter father's occupation")}
                    <div className="md:col-span-2">
                      {renderFieldWithIndicator("father_office_address", "Father's Office Address", false, "textarea", "Enter father's office address")}
                    </div>
                    <div className="md:col-span-2">
                      <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                        {renderFieldWithIndicator("father_photo", "Father's Photo", true, "file")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mother's Details */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-orange-600 rounded-full"></div>
                      Mother's Details
                    </h4>
                  </div>
                  <div className="p-6 bg-white grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderFieldWithIndicator("mother_name", "Mother's Name", true, "text", "Enter mother's name")}
                    {renderFieldWithIndicator("mother_phone", "Mother's Contact", true, "tel", "Enter mother's contact number")}
                    {renderFieldWithIndicator("mother_email", "Mother's Email", true, "email", "Enter mother's email")}
                    {renderFieldWithIndicator("mother_occupation", "Mother's Occupation", false, "text", "Enter mother's occupation")}
                    <div className="md:col-span-2">
                      {renderFieldWithIndicator("mother_office_address", "Mother's Office Address", false, "textarea", "Enter mother's office address")}
                    </div>
                    <div className="md:col-span-2">
                      <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                        {renderFieldWithIndicator("mother_photo", "Mother's Photo", true, "file")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guardian's Details (Optional) */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-gray-400 rounded-full"></div>
                      Guardian's Details <span className="text-gray-500 font-normal text-sm ml-2">(Optional)</span>
                    </h4>
                  </div>
                  <div className="p-6 bg-white grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderFieldWithIndicator("guardian_name", "Guardian's Name", false, "text", "Enter guardian's name")}
                    {renderFieldWithIndicator("guardian_phone", "Guardian's Contact", false, "tel", "Enter guardian's contact number")}
                    {renderFieldWithIndicator("guardian_email", "Guardian's Email", false, "email", "Enter guardian's email")}
                    {renderFieldWithIndicator("guardian_relation", "Guardian's Relation", false, "text", "Enter guardian's relation to student")}
                    {renderFieldWithIndicator("guardian_occupation", "Guardian's Occupation", false, "text", "Enter guardian's occupation")}
                    <div className="md:col-span-2">
                      {renderFieldWithIndicator("guardian_office_address", "Guardian's Office Address", false, "textarea", "Enter guardian's office address")}
                    </div>
                    <div className="md:col-span-2">
                      <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                        {renderFieldWithIndicator("guardian_photo", "Guardian's Photo", false, "file")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div 
                style={{
                  display: 'flex',
                  flexDirection: windowWidth < 768 ? 'column-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  marginTop: '2.5rem',
                  marginBottom: '1.5rem',
                  width: '100%'
                }}
              >
                <Button
                  variant="outline"
                  onClick={goBack}
                  className="bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-lg md:text-xl font-semibold"
                  style={{
                    width: windowWidth < 768 ? '100%' : 'auto',
                    minWidth: windowWidth >= 768 ? '200px' : 'unset',
                    height: 'auto',
                    minHeight: windowWidth < 768 ? '50px' : '55px',
                  }}
                >
                  Back
                </Button>
                <Button
                  onClick={goNext}
                  className="bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-lg md:text-xl font-semibold"
                  style={{
                    width: windowWidth < 768 ? '100%' : 'auto',
                    minWidth: windowWidth >= 768 ? '200px' : 'unset',
                    height: 'auto',
                    minHeight: windowWidth < 768 ? '50px' : '55px',
                  }}
                >
                  Preview
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3 - PREVIEW */}
          {step === 3 && (
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-orange-600">Section 3: Preview Your Information</h3>
              <div className="border-t mt-1 mb-6" style={{ borderColor: '#FFA500' }}></div>

              <div className="space-y-8">
                {/* Class Details */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-orange-600 rounded-full"></div>
                      Class Details
                    </h4>
                  </div>
                  <div className="p-6 bg-white grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-600">Class:</span> <span className="font-medium">{formInfo?.class_name || ""}</span></div>
                    <div><span className="text-gray-600">Division:</span> <span className="font-medium">{formInfo?.division || ""}</span></div>
                    <div><span className="text-gray-600">Roll Number:</span> <span className="font-medium">{formData.roll_number || ""}</span></div>
                    <div><span className="text-gray-600">ID No.:</span> <span className="font-medium">{formData.id_no || ""}</span></div>
                    <div><span className="text-gray-600">GR NO.:</span> <span className="font-medium">{formData.gr_no || ""}</span></div>
                    <div><span className="text-gray-600">SR. No.:</span> <span className="font-medium">{formData.sr_no || ""}</span></div>
                    <div><span className="text-gray-600">Admission No.:</span> <span className="font-medium">{formData.admission_no || ""}</span></div>
                    <div><span className="text-gray-600">Register No.:</span> <span className="font-medium">{formData.register_no || ""}</span></div>
                    <div><span className="text-gray-600">Bus No.:</span> <span className="font-medium">{formData.bus_no || ""}</span></div>
                  </div>
                </div>

                {/* Student Details */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-orange-600 rounded-full"></div>
                      Student Details
                    </h4>
                  </div>
                  <div className="p-6 bg-white flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                      <p className="text-xs font-bold text-gray-500 uppercase">Photograph</p>
                      {renderImagePreview(formData.photo, "Student Photograph")}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm flex-grow">
                      <div><span className="text-gray-600">First Name:</span> <span className="font-medium">{formData.first_name}</span></div>
                      <div><span className="text-gray-600">Last Name:</span> <span className="font-medium">{formData.last_name}</span></div>
                      <div><span className="text-gray-600">Date of Birth:</span> <span className="font-medium">{formData.dob}</span></div>
                      <div><span className="text-gray-600">Gender:</span> <span className="font-medium">{formData.gender}</span></div>
                      <div><span className="text-gray-600">Blood Group:</span> <span className="font-medium">{formData.blood_group}</span></div>
                      <div><span className="text-gray-600">City:</span> <span className="font-medium">{formData.city}</span></div>
                      <div><span className="text-gray-600">State:</span> <span className="font-medium">{formData.state}</span></div>
                      <div><span className="text-gray-600">PIN Code:</span> <span className="font-medium">{formData.pin_code}</span></div>
                      <div className="md:col-span-2"><span className="text-gray-600">Address:</span> <span className="font-medium">{formData.street_address}</span></div>
                      <div><span className="text-gray-600">Emergency Contact:</span> <span className="font-medium">{formData.emergency_contact}</span></div>
                    </div>
                  </div>
                </div>

                {/* Parent Details */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-orange-600 rounded-full"></div>
                      Parent Details
                    </h4>
                  </div>
                  <div className="p-6 bg-white space-y-8">
                    {/* Father's Preview */}
                    <div className="border-l-4 border-orange-100 pl-4 flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0 flex flex-col items-center gap-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Photo</p>
                        {renderImagePreview(formData.father_photo, "Father's Photo")}
                      </div>
                      <div className="flex-grow">
                        <p className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-2">Father's Information</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div><span className="text-gray-600">Name:</span> <span className="font-medium">{formData.father_name || ""}</span></div>
                          <div><span className="text-gray-600">Contact:</span> <span className="font-medium">{formData.father_phone || ""}</span></div>
                          <div><span className="text-gray-600">Email:</span> <span className="font-medium">{formData.father_email || ""}</span></div>
                          <div><span className="text-gray-600">Occupation:</span> <span className="font-medium">{formData.father_occupation || ""}</span></div>
                          <div className="md:col-span-2"><span className="text-gray-600">Office Address:</span> <span className="font-medium">{formData.father_office_address || ""}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Mother's Preview */}
                    <div className="border-l-4 border-orange-100 pl-4 flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0 flex flex-col items-center gap-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Photo</p>
                        {renderImagePreview(formData.mother_photo, "Mother's Photo")}
                      </div>
                      <div className="flex-grow">
                        <p className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-2">Mother's Information</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div><span className="text-gray-600">Name:</span> <span className="font-medium">{formData.mother_name || ""}</span></div>
                          <div><span className="text-gray-600">Contact:</span> <span className="font-medium">{formData.mother_phone || ""}</span></div>
                          <div><span className="text-gray-600">Email:</span> <span className="font-medium">{formData.mother_email || ""}</span></div>
                          <div><span className="text-gray-600">Occupation:</span> <span className="font-medium">{formData.mother_occupation || ""}</span></div>
                          <div className="md:col-span-2"><span className="text-gray-600">Office Address:</span> <span className="font-medium">{formData.mother_office_address || ""}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Guardian's Preview */}
                    <div className="border-l-4 border-gray-100 pl-4 flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0 flex flex-col items-center gap-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Photo</p>
                        {renderImagePreview(formData.guardian_photo, "Guardian's Photo")}
                      </div>
                      <div className="flex-grow">
                        <p className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-2">Guardian's Information</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div><span className="text-gray-600">Name:</span> <span className="font-medium">{formData.guardian_name || ""}</span></div>
                          <div><span className="text-gray-600">Contact:</span> <span className="font-medium">{formData.guardian_phone || ""}</span></div>
                          <div><span className="text-gray-600">Email:</span> <span className="font-medium">{formData.guardian_email || ""}</span></div>
                          <div><span className="text-gray-600">Relation:</span> <span className="font-medium">{formData.guardian_relation || ""}</span></div>
                          <div><span className="text-gray-600">Occupation:</span> <span className="font-medium">{formData.guardian_occupation || ""}</span></div>
                          <div className="md:col-span-2"><span className="text-gray-600">Office Address:</span> <span className="font-medium">{formData.guardian_office_address || ""}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div 
                style={{
                  display: 'flex',
                  flexDirection: windowWidth < 768 ? 'column-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  marginTop: '2.5rem',
                  marginBottom: '1.5rem',
                  width: '100%'
                }}
              >
                <Button
                  variant="outline"
                  onClick={goBack}
                  className="bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-lg md:text-xl font-semibold"
                  style={{
                    width: windowWidth < 768 ? '100%' : 'auto',
                    minWidth: windowWidth >= 768 ? '200px' : 'unset',
                    height: 'auto',
                    minHeight: windowWidth < 768 ? '50px' : '55px',
                  }}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-lg md:text-xl font-semibold"
                  style={{
                    width: windowWidth < 768 ? '100%' : 'auto',
                    minWidth: windowWidth >= 768 ? '200px' : 'unset',
                    height: 'auto',
                    minHeight: windowWidth < 768 ? '50px' : '55px',
                  }}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4 - SUCCESS */}
          {step === 4 && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-24 h-24 mx-auto mb-6 text-green-600" />
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Form Submitted Successfully!
              </h2>
              <p className="text-gray-600 mb-8">
                Thank you for submitting your registration form. Your information has been received.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-sm text-gray-700">
                  <strong>Class:</strong> {formInfo?.class_name} | <strong>Division:</strong> {formInfo?.division}
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  <strong>Student:</strong> {formData.first_name} {formData.last_name}
                </p>
                {formData.roll_number && (
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Roll Number:</strong> {formData.roll_number}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Viewer Dialog */}
      <Dialog open={!!viewingPhoto} onOpenChange={() => setViewingPhoto(null)}>
        <DialogPortal>
          <DialogOverlay style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)', zIndex: 50 }} />
          <DialogPrimitive.Content 
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 51,
              maxWidth: '56rem',
              width: '100%',
              height: '90vh',
              backgroundColor: 'transparent',
              border: 'none',
              boxShadow: 'none',
              padding: '0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
            }}
          >
            <div 
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem',
              }}
            >
              <DialogTitle style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: '0' }}>
                Photo Viewer
              </DialogTitle>
              
              {/* Image Container */}
              <div 
                style={{
                  position: 'relative',
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                  backgroundColor: '#000',
                  border: '4px solid #fff',
                }}
              >
                <img 
                  src={viewingPhoto?.src} 
                  alt="Preview" 
                  style={{
                    maxHeight: '75vh',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </div>

              {/* Bottom Close Button */}
              <Button 
                onClick={() => setViewingPhoto(null)}
                style={{
                  backgroundColor: '#ea8600', // Using the orange color from your theme
                  color: '#ffffff',
                  paddingLeft: '3rem',
                  paddingRight: '3rem',
                  paddingTop: '1.5rem',
                  paddingBottom: '1.5rem',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  borderRadius: '9999px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  transition: 'all 0.2s ease-in-out',
                  transform: 'scale(1)',
                  cursor: 'pointer',
                  border: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#c27000'; // Darker orange on hover
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ea8600';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
              >
                Close
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </div>
  );
}

