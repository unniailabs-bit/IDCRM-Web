import React from "react";
import { CheckCircle, Mail, Phone, Clock } from "lucide-react";
import { FileCheck, UserCheck, Bell, IdCard } from "lucide-react";
import { File } from "lucide-react";
import Icon from "@/layouts/assets/Icon (10) 1.png";
import { useAuth } from "@/hooks/useAuth";


export const TrustConfirmation = () => {
  const { userData } = useAuth();

  const applicationId = "TR-6419840";
  const trustName = userData?.trust_name || "N/A";
  const adminName = userData?.admin_name || "N/A";
  const registrationNumber = userData?.registration_number || "N/A";
  const schoolsAdded = `${userData?.total_schools || 0} Schools`;
  const supportEmail = "support@idcard.com";
  const supportPhone = "+91 123-456-7890";
  const workingHours = "Mon-Fri, 9 AM - 5 PM";
  

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">

        {/* Header Icon */}
   <div className="flex justify-center mb-4">
  <div className="bg-orange-600 w-20 h-20 rounded-lg flex items-center justify-center text-white text-2xl shadow-lg">
    <img src={Icon} alt="Trust" className="w-10 h-10" />
  </div>
</div>



        {/* Title & Step Info */}
      <h1
  className="text-center font-semibold mb-2"
  style={{ fontSize: "30px", lineHeight: "1.2" }}
>
  Trust Registration
</h1>


        <p className="text-center text-gray-500 text-sm mb-6">Step 4 of 4: Complete Super Admin details</p>

    <div className="flex justify-center items-center gap-4 mb-6">
  <div className="w-8 h-8 bg-orange-600 rounded-full text-white flex items-center justify-center text-sm">1</div>

  <div style={{ height: "3px", width: "120px", backgroundColor: "#f54a00" }}></div>

  <div className="w-8 h-8 bg-orange-600 rounded-full text-white flex items-center justify-center text-sm">2</div>

  <div style={{ height: "3px", width: "120px", backgroundColor: "#f54a00" }}></div>

  <div className="w-8 h-8 bg-orange-600 rounded-full text-white flex items-center justify-center text-sm">3</div>
</div>




        {/* Confirmation Card */}
        <div className="bg-white rounded-lg p-6 shadow mb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-green-500 w-20 h-20 rounded-full flex items-center justify-center">
              <CheckCircle className="text-white w-10 h-10" />
            </div>


          </div>

          <h1
  className="text-center font-semibold mb-2"
  style={{ fontSize: "28px" }}
>
  Registration Submitted Successfully!
</h1>

          <p className="text-center text-gray-500 text-sm mb-2">
            Your trust registration request has been received.
          </p>
          <p className="text-center text-orange-600 font-mono text-sm">
            Application ID: {applicationId}
          </p>
        </div>

        {/* Submitted Information */}
        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">Submitted Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
            <p><strong>Trust Name:</strong><br></br> {trustName}</p>
            <p><strong>Registration Number:</strong><br></br> {registrationNumber}</p>
            <p><strong>Admin Name:</strong><br></br> {adminName}</p>
            <p><strong>Schools Added:</strong><br></br> {schoolsAdded}</p>
          </div>
        </div>


        <h1 className="text-center font-semibold text-lg mb-2">
          What Happend Next?
        </h1><br></br>

        {/* Steps Details */}
   <div className="space-y-4 mb-6">

  <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
      <FileCheck className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="font-semibold">1. Document Verification</p>
      <p className="text-gray-500 text-sm">
        Our team will verify your trust registration documents and submitted details.<br />
        <span className="text-blue-600"> Estimated time: 1-2 business days</span>
      </p>
    </div>
  </div>

  <div className="bg-purple-50 p-4 rounded-lg flex gap-3">
    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
      <UserCheck className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="font-semibold">2. Platform Admin Review</p>
      <p className="text-gray-500 text-sm">
        Platform admin will review and approve your trust registration request.<br />
         <span className="text-purple-600">Estimated time: 2-3 business days</span>
      </p>
    </div>
  </div>

  <div className="bg-green-50 p-4 rounded-lg flex gap-3">
    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
      <Bell className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="font-semibold">3. Approval Notification</p>
      <p className="text-gray-500 text-sm">
        You'll receive an email and SMS notification once your account is approved and activated.<br />
         <span className="text-green-600">You can login and start using System</span>
      </p>
    </div>
  </div>

  <div className="bg-orange-50 p-4 rounded-lg flex gap-3">
    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center">
      <IdCard className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="font-semibold">4. Start Managing ID Cards</p>
      <p className="text-gray-500 text-sm">
        Once approved, you can add schools, manage credits, and start the ID card generation process.<br />
 <span className="text-orange-600">Access full dashboards and features</span>
      </p>
    </div>
  </div>

</div>


        {/* Important Note */}
       <div className="bg-yellow-50 p-4 rounded-lg text-sm text-gray-700 mb-6 border border-orange-300">
  <p style={{ color: "#8B4513" }}>
    <strong>Important Note</strong><br />
    Please check your email 
    <span className="font-mono text-orange-600"> example@gmail.com </span> 
    for further updates.
    Make sure to check your spam folder as well.
  </p>
</div><br></br>


        <hr className="border-t border-gray-300 mb-6" />
        {/* Contact Info */}

        <h1 className="text-center font-semibold text-lg mb-2">
          Need Help?
        </h1>
        <div className="flex justify-center gap-6 mb-6">
          <div className="flex flex-col items-center gap-1 bg-white rounded-lg shadow p-4 w-28">
            <Mail className="w-5 h-5 text-gray-600" />
            <span className="text-xs">Email</span>
            <span className="font-mono text-orange-600 text-sm">{supportEmail}</span>
          </div>

          <div className="flex flex-col items-center gap-1 bg-white rounded-lg shadow p-4 w-28">
            <Phone className="w-5 h-5 text-gray-600" />
            <span className="text-xs">Phone</span>
            <span className="font-mono text-orange-600 text-sm">{supportPhone}</span>
          </div>

          <div className="flex flex-col items-center gap-1 bg-white rounded-lg shadow p-4 w-28">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="text-xs">Working Hours</span>
            <span className="font-mono text-orange-600 text-sm">{workingHours}</span>
          </div>
        </div>


        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {/* <button className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition">
            Go to Login Page
          </button> */}
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">
            Download Confirmation
          </button>
        </div>

      </div>
    </div>
  );
};
