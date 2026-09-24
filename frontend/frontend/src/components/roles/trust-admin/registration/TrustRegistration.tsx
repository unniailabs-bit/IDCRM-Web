import React, { FC, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { registerTrust } from "../../../../api/trust/registration";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";

export const TrustRegistration: FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alert, setAlert] = useState({ show: false, variant: "default", title: "", description: "" });
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    trustName: "",
    regNumber: "",
    trustEmail: "",
    trustPhone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
 const navigate = useNavigate();
  // HANDLE INPUT CHANGE
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  // VALIDATION
  const validateForm = () => {
    let newErrors = {};

    if (!formData.trustName) newErrors.trustName = "Trust name is required";
    if (!formData.regNumber) newErrors.regNumber = "Registration number required";
    if (!formData.trustEmail) newErrors.trustEmail = "Trust email required";
    if (!formData.trustPhone) newErrors.trustPhone = "Phone number required";
    if (!formData.address) newErrors.address = "Address is required";
    if (!formData.password) newErrors.password = "Password required";

    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      const registrationData = {
        trust_name: formData.trustName,
        registration_number: formData.regNumber,
        email: formData.trustEmail,
        phone: formData.trustPhone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        password: formData.password,
      };

      try {
        const response = await registerTrust(registrationData);
        if (response && response.success) {

          // console.log(response)
          const newUserData = {
            id: response.trust.id,
            trust_name: formData.trustName,
            email: formData.trustEmail,
            phone: formData.trustPhone,
            address: formData.address,
            registration_number: formData.regNumber,
          };
          login('trust', newUserData);
          

          setAlert({
            show: true,
            variant: "success",
            title: "Registration Successful!",
            description: "You will be redirected to the next step shortly.",
          });
          setTimeout(() => {
            navigate("/super-dashboard/trust-registration/step1");
          }, 2000);
        } else {
          setAlert({
            show: true,
            variant: "destructive",
            title: "Registration Failed",
            description: response.message || "An unexpected error occurred. Please try again.",
          });
        }
      } catch (error) {
        setAlert({
          show: true,
          variant: "destructive",
          title: "Registration Failed",
          description: error.response?.data?.message || "An unexpected error occurred. Please try again.",
        });
        console.error("Error registering trust:", error);
      }
    } else {
      // console.log("Errors found");
    }
  };

  
  return (
    <form onSubmit={handleSubmit}>
      <div className="min-h-screen bg-gradient-to-br from-[#FFEBD9] via-white to-[#E7F7E7] flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          {/* Page Title */}
          <div className="text-center">
            <h1 className="text-2xl tracking-tight">Trust Registration</h1>
            <p className="text-gray-700 text-base mt-3">
              Step 1 of 2: Register your Trust
            </p>
          </div>

          <div className="h-10"></div>

         <Card className="rounded-xl border bg-white shadow-[0_8px_30px_rgba(0,0,0,0.10)]">

            <CardContent className="p-6">
              <h2 className="text-sm font-semibold text-[#D47A00]">
                Trust Details
              </h2>
              <p className="text-gray-700 text-sm mt-2">
                Fill in the details below to register your Trust. You will use your trust email and password to login.
              </p>

              <Separator className="my-4" />

              {/* TRUST INFORMATION */}
              <h3 className="text-sm font-semibold text-[#D47A00] mb-3 mt-2">
                📄 Trust Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Trust Name */}
                <div>
                  <Label className="text-xs">Trust Name *</Label>
                  <Input
                    name="trustName"
                    value={formData.trustName}
                    onChange={handleChange}
                    className="h-10 text-sm px-4 py-3 mt-1"
                    placeholder="Enter trust name"
                  />
                  {errors.trustName && <p className="text-red-500 text-xs">{errors.trustName}</p>}
                </div>

                {/* Registration Number */}
                <div>
                  <Label className="text-xs">Registration Number *</Label>
                  <Input
                    name="regNumber"
                    value={formData.regNumber}
                    onChange={handleChange}
                    className="h-10 text-sm px-4 py-3 mt-1"
                    placeholder="Enter registration number"
                  />
                  {errors.regNumber && <p className="text-red-500 text-xs">{errors.regNumber}</p>}
                </div>

                {/* Trust Email */}
                <div>
                  <Label className="text-xs">Trust Email *</Label>
                  <Input
                    name="trustEmail"
                    value={formData.trustEmail}
                    onChange={handleChange}
                    type="email"
                    className="h-10 text-sm px-4 py-3 mt-1"
                    placeholder="trust@example.com"
                  />
                  {errors.trustEmail && <p className="text-red-500 text-xs">{errors.trustEmail}</p>}
                </div>

                {/* Trust Phone */}
                <div>
                  <Label className="text-xs">Trust Phone *</Label>
                  <Input
                    name="trustPhone"
                    value={formData.trustPhone}
                    onChange={handleChange}
                    type="tel"
                    className="h-10 text-sm px-4 py-3 mt-1"
                    placeholder="Enter phone number"
                  />
                  {errors.trustPhone && <p className="text-red-500 text-xs">{errors.trustPhone}</p>}
                </div>
              </div><br></br>

              {/* Address */}
              <div className="mt-5">
                <Label className="text-xs">Address *</Label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="h-10 text-sm px-4 py-3 mt-1"
                  placeholder="Enter address"
                />
                {errors.address && <p className="text-red-500 text-xs">{errors.address}</p>}
              </div><br></br>

              {/* City / State */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <Label className="text-xs">City</Label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="h-10 text-sm px-4 py-3 mt-1"
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <Label className="text-xs">State</Label>
                  <Input
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="h-10 text-sm px-4 py-3 mt-1"
                    placeholder="Enter state"
                  />
                </div>
              </div><br></br>

              {/* Pincode */}
              <div className="mt-5">
                <Label className="text-xs">Pincode</Label>
                <Input
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="h-10 text-sm px-4 py-3 mt-1"
                  placeholder="Enter pincode"
                />
              </div>

              <Separator className="my-6" />

              {/* PASSWORD SECTION */}
              <h3 className="text-sm font-semibold text-[#D47A00] mb-3 mt-2">
                🔐 Login Credentials
              </h3>
              <p className="text-gray-600 text-xs mb-4">
                Set a password for your trust account. You will use your trust email and this password to login.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Password */}
                <div>
                  <Label className="text-xs">Password *</Label>
                  <div className="relative">
                    <Input
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      type={showPassword ? "text" : "password"}
                      style={{ height: '40px', fontSize: '0.875rem', paddingLeft: '16px', paddingRight: '48px', paddingTop: '12px', paddingBottom: '12px', width: '100%', marginTop: '4px' }}
                      placeholder="Enter Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <Label className="text-xs">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      type={showConfirmPassword ? "text" : "password"}
                      style={{ height: '40px', fontSize: '0.875rem', paddingLeft: '16px', paddingRight: '48px', paddingTop: '12px', paddingBottom: '12px', width: '100%', marginTop: '4px' }}
                      placeholder="Re-Enter Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="my-6">
                {alert.show && (
                  <Alert variant={alert.variant} className="mt-4">
                    <AlertTitle>{alert.title}</AlertTitle>
                    <AlertDescription>{alert.description}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* FOOTER */}
              <div className="flex items-center justify-end mt-6">


         <Button 
  type="submit"
  className="px-6 py-2 text-sm rounded-lg mt-3"
>
  Continue to school →
</Button>

              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
};

export default TrustRegistration;
