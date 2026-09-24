import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ArrowLeft, 
  Phone, 
  MapPin, 
  User, 
  Calendar, 
  Activity, 
  Building, 
  Bookmark, 
  CheckCircle,
  Building2,
  Lock
} from 'lucide-react';

interface StudentData {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  photo: string | null;
  blood_group?: string;
  address?: string;
  school_id: number;
  class_name: string;
  division_name: string;
  roll_number?: number;
  id_number?: string;
  gr_number?: string;
  father_name?: string;
  mother_name?: string;
  father_phone?: string;
  mother_phone?: string;
  status: string;
  form_token: string;
  school_name: string;
  school_logo: string | null;
  school_address?: string;
  school_state?: string;
}

export function VerifyStudent() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentData | null>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const verifyId = async () => {
      if (!token) {
        setError('Verification token is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Hitting the public student QR verify endpoint
        const response = await axios.get(`${BACKEND_URL}/api/student/${token}`);
        
        if (response.data && response.data.success) {
          setStudent(response.data.data);
        } else {
          setError(response.data?.message || 'Verification failed. Digital ID not found.');
        }
      } catch (err: any) {
        console.error('ID verification fetch error:', err);
        setError(err.response?.data?.message || 'Invalid or expired student verification link');
      } finally {
        setLoading(false);
      }
    };

    verifyId();
  }, [token, BACKEND_URL]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800 overflow-hidden relative">
        {/* Animated Scanner Grid Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70"></div>
        
        <div className="relative flex flex-col items-center max-w-md w-full text-center z-10">
          <div className="relative w-24 h-24 mb-8">
            {/* Pulsing rings */}
            <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 animate-ping"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full bg-white shadow-md flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-orange-500 animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-wide mb-2 text-orange-600">SECURE ID VERIFICATION</h2>
          <p className="text-slate-500 font-medium animate-pulse">Decrypting student digital signature...</p>
          
          {/* Laser scanning line effect */}
          <div className="w-64 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent mt-8 rounded-full animate-bounce shadow-[0_0_12px_rgba(234,88,12,0.4)]"></div>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70"></div>
        
        <div className="relative max-w-md w-full bg-white border border-red-200 rounded-2xl p-8 shadow-xl text-center z-10">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-3">Verification Failed</h2>
          <p className="text-slate-500 mb-6 text-sm leading-relaxed">
            {error || 'This digital identity is not recognized, currently suspended, or holds an invalid authorization token.'}
          </p>
          
          <div className="p-4 bg-slate-50 rounded-xl text-left border border-slate-200 mb-6 text-xs text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700">Possible reasons:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Student profile has not been approved by school admin.</li>
              <li>QR code has expired or the token format is corrupted.</li>
              <li>This digital record is not registered under our school networks.</li>
            </ul>
          </div>

          <button 
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all font-semibold rounded-xl text-white shadow-lg shadow-red-900/10 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${student.first_name} ${student.middle_name || ''} ${student.last_name}`.replace(/\s+/g, ' ').trim();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center py-10 px-4 sm:px-6 relative overflow-x-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50"></div>
      
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-2/3 left-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl w-full z-10 space-y-8">
        
        {/* Verification Status Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold tracking-wider uppercase shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Verified Secure Record
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Digital Identity Verified
          </h1>
          <p className="text-slate-500 max-w-md mx-auto text-sm sm:text-base font-medium">
            This student's identity and registration status are verified and active on the educational network.
          </p>
        </div>

        {/* Dynamic Grid: Left (Physical ID Card Layout), Right (Verification Details) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Physical ID Card Mock */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 self-start lg:pl-2">
              Physical Card Preview
            </h2>
            
            {/* The ID Card Container */}
            <div className="w-[335px] sm:w-[360px] h-[520px] bg-white rounded-3xl overflow-hidden shadow-[0_20px_45px_-15px_rgba(0,0,0,0.15)] border border-slate-200/80 flex flex-col justify-between relative group hover:border-emerald-500/40 transition-all duration-300">
              
              {/* Premium Top Bar */}
              <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 w-full"></div>
              
              {/* Card Header Section */}
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl p-1.5 flex items-center justify-center shrink-0 border border-slate-200/80 shadow-sm">
                  {student.school_logo ? (
                    <img 
                      src={student.school_logo} 
                      alt="Logo" 
                      className="max-w-full max-h-full object-contain" 
                      onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide truncate">
                    {student.school_name}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium truncate">
                    {student.school_address ? `${student.school_address}, ` : ''}{student.school_state || ''}
                  </p>
                </div>
              </div>

              {/* Card Content Body */}
              <div className="flex-1 p-5 flex flex-col items-center justify-between">
                
                {/* Photo frame */}
                <div className="relative">
                  <div className="w-32 h-32 bg-slate-50 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm">
                    {student.photo ? (
                      <img 
                        src={student.photo} 
                        alt={fullName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                        <User className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  {/* Verified Badge Icon on Card */}
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-4 border-white shadow-lg">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>

                {/* Names */}
                <div className="text-center w-full mt-3">
                  <h4 className="text-lg font-bold text-slate-800 tracking-wide truncate max-w-full uppercase">
                    {fullName}
                  </h4>
                  <span className="inline-block mt-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                    Student
                  </span>
                </div>

                {/* Details Table */}
                <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 mt-3 space-y-1.5 text-xs text-left">
                  <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                    <span className="text-slate-500">Class & Section:</span>
                    <span className="font-semibold text-slate-800 uppercase">{student.class_name} - {student.division_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                    <span className="text-slate-500">Roll Number:</span>
                    <span className="font-semibold text-slate-800">{student.roll_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                    <span className="text-slate-500">GR Number:</span>
                    <span className="font-semibold text-slate-800">{student.gr_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Blood Group:</span>
                    <span className="font-bold text-red-600 uppercase">{student.blood_group || 'N/A'}</span>
                  </div>
                </div>

              </div>

              {/* Card Footer Bar */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secure Cryptographic ID</span>
                </div>
                <div className="font-mono text-slate-500">
                  #{student.form_token?.substring(0, 8).toUpperCase()}
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT: Detailed Verification Report */}
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 pl-2">
              Official Verification Audit Record
            </h2>

            {/* School details block */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 text-left">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Building className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-base">Educational Institution</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400 block text-xs mb-0.5">School Name</span>
                  <span className="font-semibold text-slate-800 block">{student.school_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs mb-0.5">State</span>
                  <span className="font-semibold text-slate-800 block">{student.school_state || 'N/A'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-xs mb-0.5">Address</span>
                  <span className="font-semibold text-slate-800 block leading-relaxed">
                    {student.school_address || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Student bio info block */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 text-left">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <User className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-base">Student Profile Details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400 block text-xs mb-0.5">First Name</span>
                  <span className="font-semibold text-slate-800 block uppercase">{student.first_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs mb-0.5">Middle Name</span>
                  <span className="font-semibold text-slate-800 block uppercase">{student.middle_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs mb-0.5">Last Name</span>
                  <span className="font-semibold text-slate-800 block uppercase">{student.last_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs mb-0.5">Blood Group</span>
                  <span className="font-bold text-red-600 block uppercase">{student.blood_group || 'N/A'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-xs mb-0.5">Resident Address</span>
                  <span className="font-medium text-slate-700 block leading-relaxed">
                    {student.address || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Family & Emergency Info block */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 text-left">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Phone className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-base">Parents & Emergency Contact</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400 block text-xs mb-0.5">Father's Name</span>
                  <span className="font-semibold text-slate-800 block uppercase">{student.father_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs mb-0.5">Father's Phone</span>
                  <span className="font-semibold text-slate-800 block">
                    {student.father_phone ? (
                      <a href={`tel:${student.father_phone}`} className="hover:underline text-emerald-600 flex items-center gap-1 font-semibold">
                        {student.father_phone}
                      </a>
                    ) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs mb-0.5">Mother's Name</span>
                  <span className="font-semibold text-slate-800 block uppercase">{student.mother_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs mb-0.5">Mother's Phone</span>
                  <span className="font-semibold text-slate-800 block">
                    {student.mother_phone ? (
                      <a href={`tel:${student.mother_phone}`} className="hover:underline text-emerald-600 flex items-center gap-1 font-semibold">
                        {student.mother_phone}
                      </a>
                    ) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
