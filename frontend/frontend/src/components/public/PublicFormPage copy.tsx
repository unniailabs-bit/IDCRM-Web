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
import { Alert, AlertDescription } from "../ui/alert";
import axiosInstance from "@/api/axiosInstance";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

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
    mother_name: "",
    mother_phone: "",
    street_address: "",
    city: "",
    state: "",
    pin_code: "",
    emergency_contact: "",
    parent_name: "",
    parent_phone: "",
    parent_email: "",
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
            mother_name: existing.mother_name || "",
            mother_phone: existing.mother_phone || "",
            street_address: existing.street_address || "",
            city: existing.city || "",
            state: existing.state || "",
            pin_code: existing.pin_code || "",
            emergency_contact: existing.emergency_contact || "",
            parent_name: existing.parent_name || "",
            parent_phone: existing.parent_phone || "",
            parent_email: existing.parent_email || "",
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

  const goNext = () => setStep((s) => Math.min(4, s + 1));
  const goBack = () => setStep((s) => Math.max(0, s - 1));
  const goTo = (i: number) => setStep(i);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();

      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File) {
          submitData.append(key, value);
        } else if (value) {
          submitData.append(key, value.toString());
        }
      });

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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

              <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 mt-10">
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
                  onClick={() => setStep(2)}
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
              <h3 className="text-lg font-semibold text-orange-600 mb-3">Section 2: Parent Details</h3>
              <div className="border-t mt-1 mb-6" style={{ borderColor: '#FFA500' }}></div>

              <div className="grid grid-cols-1 gap-5">
                {renderFieldWithIndicator("father_name", "Father's Name", true, "text", "Enter father's name")}
                {renderFieldWithIndicator("father_phone", "Father's Phone", false, "tel", "Enter father's phone number")}
                {renderFieldWithIndicator("mother_name", "Mother's Name", true, "text", "Enter mother's name")}
                {renderFieldWithIndicator("mother_phone", "Mother's Phone", false, "tel", "Enter mother's phone number")}
                {renderFieldWithIndicator("parent_name", "Parent/Guardian Name", false, "text", "Enter parent/guardian name")}
                {renderFieldWithIndicator("parent_phone", "Parent Phone", true, "tel", "Enter phone number")}
                {renderFieldWithIndicator("parent_email", "Parent Email", true, "email", "Enter email address")}
              </div>

              <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 mt-10">
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
                  onClick={() => setStep(3)}
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
              <h3 className="text-lg font-semibold text-orange-600 mb-3">Preview Your Information</h3>
              <div className="border-t mt-1 mb-6" style={{ borderColor: '#FFA500' }}></div>

              <div className="space-y-6">
                {/* Class Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Class Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-600">Class:</span> <span className="font-medium">{formInfo?.class_name}</span></div>
                    <div><span className="text-gray-600">Division:</span> <span className="font-medium">{formInfo?.division}</span></div>
                    {formData.roll_number && <div><span className="text-gray-600">Roll Number:</span> <span className="font-medium">{formData.roll_number}</span></div>}
                    {formData.id_no && <div><span className="text-gray-600">ID No.:</span> <span className="font-medium">{formData.id_no}</span></div>}
                    {formData.gr_no && <div><span className="text-gray-600">GR NO.:</span> <span className="font-medium">{formData.gr_no}</span></div>}
                    {formData.sr_no && <div><span className="text-gray-600">SR. No.:</span> <span className="font-medium">{formData.sr_no}</span></div>}
                    {formData.admission_no && <div><span className="text-gray-600">Admission No.:</span> <span className="font-medium">{formData.admission_no}</span></div>}
                    {formData.register_no && <div><span className="text-gray-600">Register No.:</span> <span className="font-medium">{formData.register_no}</span></div>}
                    {formData.bus_no && <div><span className="text-gray-600">Bus No.:</span> <span className="font-medium">{formData.bus_no}</span></div>}
                  </div>
                </div>

                {/* Student Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Student Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
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

                {/* Parent Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Parent Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-600">Father's Name:</span> <span className="font-medium">{formData.father_name}</span></div>
                    <div><span className="text-gray-600">Mother's Name:</span> <span className="font-medium">{formData.mother_name}</span></div>
                    <div><span className="text-gray-600">Parent/Guardian:</span> <span className="font-medium">{formData.parent_name}</span></div>
                    <div><span className="text-gray-600">Parent Phone:</span> <span className="font-medium">{formData.parent_phone}</span></div>
                    <div><span className="text-gray-600">Parent Email:</span> <span className="font-medium">{formData.parent_email}</span></div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 mt-10">
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
    </div>
  );
}

