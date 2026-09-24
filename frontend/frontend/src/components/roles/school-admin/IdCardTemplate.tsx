import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import IdentityCardTemplate1 from './id-templates/IdentityCardTemplate1';
import IdentityCardTemplate3 from './id-templates/IdentityCardTemplate3';
import IdentityCardTemplate4 from './id-templates/IdentityCardTemplate4';
import { mapStudentToCard } from './id-templates/utils';
import axios from 'axios';
import { Button } from '@/components/ui/button';

// ----------------------- Main Component -----------------------
export function IDCardGallery() {
  const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  const location = useLocation();

  const { userData } = useAuth();
  // console.log('User Data :', userData);
  const schoolName = userData && userData.name ? userData.name : 'Webbience National Public School';

  // Default values if no state is passed (Fallback)
  // const { classDiv } = location.state || {
  //   classDiv: { class: '3', division: 'A' },
  // };
  const { classDiv, students: passedStudents = [] } = location.state || {
    classDiv: { class: '3', division: 'A' },
    students: [],
  };

  // const [students, setStudents] = useState([]);
  const [students, setStudents] = useState<any[]>(passedStudents);

  // console.log('Students Data :', students);
  const [masterSignature, setMasterSignature] = useState<string | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<{
    trustName: string;
    schoolName: string;
    address: string;
    logo: string | null;
  }>({
    trustName: '',
    schoolName: '',
    address: '',
    logo: null,
  });
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<'template1' | 'template3' | 'template4'>(
    'template1'
  );

  // --- API Call logic: Fetches student data dynamically ---
  useEffect(() => {
    const fetchStudents = async () => {
      // Check for required data
      if (!classDiv.class || !classDiv.division) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // API call to fetch students
        const response = await axiosInstance.get('/api/school/class-students', {
          params: {
            className: classDiv.class,
            division: classDiv.division,
          },
        });

        // if (response.data.success) {
        //   setStudents(response.data.data || []);
        //   console.log('Fetched Students :', response.data.data || []);
        //   console.log('Passed Students :', passedStudents);
        // }
        if (response.data.success) {
          const apiStudents = response.data.data || [];

          // If nothing passed, keep all
          if (!passedStudents.length) {
            setStudents(apiStudents);
            return;
          }

          const matchedStudents = apiStudents.filter((apiStudent: any) => {
            const apiFormID = JSON.stringify(apiStudent?.id);

            return passedStudents.some((passed: any) => {
              const passedFormID = passed['Form ID'];
              return apiFormID && apiFormID === passedFormID;
            });
          });

          setStudents(matchedStudents);
        } else {
          toast.error(response.data.message || 'Failed to fetch students list.');
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        // Fallback: If API fails, display placeholder cards without actual student data
        setStudents([]);
        toast.error('Failed to fetch students. Displaying template previews.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();

    const fetchSchoolAssets = async () => {
      try {
        const token = localStorage.getItem('token');

        // 1. Fetch Profile
        const profileRes = await axiosInstance.get('/api/school/settings/profile');
        if (profileRes.data.success) {
          const data = profileRes.data.data;
          const schoolId = data.id;

          // 2. Fetch Logo and Signature in parallel using axiosInstance
          const [logoRes, signRes] = await Promise.allSettled([
            axiosInstance.get(`/api/school/${schoolId}/logo`),
            axiosInstance.get(`/api/school/${schoolId}/principal-sign`),
          ]);

          let logoUrl = null;
          if (
            logoRes.status === 'fulfilled' &&
            logoRes.value.data.success &&
            logoRes.value.data.logo
          ) {
            logoUrl = `${BASE_URL}${logoRes.value.data.logo}`;
          }

          if (
            signRes.status === 'fulfilled' &&
            signRes.value.data.success &&
            signRes.value.data.principal_sign
          ) {
            setMasterSignature(`${BASE_URL}${signRes.value.data.principal_sign}`);
          }

          setSchoolProfile({
            trustName: data.trust_name || userData?.trust_name || '',
            schoolName: data.school_name || userData?.name || 'School Name',
            address: data.address || userData?.address || '',
            logo: logoUrl,
          });
        }
      } catch (error) {
        console.error('Error fetching school data:', error);
      }
    };

    fetchSchoolAssets();
  }, [classDiv.class, classDiv.division, BASE_URL]);

  // Map the FIRST student's data for preview (or use placeholder if empty)
  const student = students.length > 0 ? students[0] : null;

  // Helper to prepare props for Template 1
  const getTemplate1Props = () => {
    if (!student) return {};
    const card: any = mapStudentToCard(student, classDiv, schoolProfile.schoolName || schoolName);
    return {
      schoolName: schoolProfile.schoolName || schoolName,
      registrationNumber: schoolProfile.trustName,
      studentPhoto: card.photoUrl,
      studentName: card.studentName,
      fatherName: card.father,
      motherName: card.mother,
      studentClass: classDiv.class,
      dateOfBirth: card.dob,
      address: card.address,
      phoneNumber: card.emergency,
      schoolLogo: schoolProfile.logo || '/assets/id-templates/logo.png',
    };
  };

  // Helper to prepare props for Template 3
  const getTemplate3Props = () => {
    if (!student) return {};
    const card: any = mapStudentToCard(student, classDiv, schoolProfile.schoolName || schoolName);
    return {
      headerSmall: schoolProfile.trustName,
      headerMain: schoolProfile.schoolName || schoolName,
      headerAddress: schoolProfile.address,
      schoolLogo: schoolProfile.logo || '/assets/id-templates/logo.png',
      studentPhoto: card.photoUrl,
      rollNumber: student.roll_number || '00',
      studentName: card.studentName,
      standard: classDiv.class,
      dateOfBirth: card.dob,
      address: card.address,
      mobileNumber: card.emergency,
    };
  };

  // Helper to prepare props for Template 4
  const getTemplate4Props = () => {
    if (!student) return {};
    const card: any = mapStudentToCard(student, classDiv, schoolProfile.schoolName || schoolName);
    return {
      trustName: schoolProfile.trustName,
      schoolName: schoolProfile.schoolName || schoolName,
      schoolAddress: schoolProfile.address,
      schoolLogo: schoolProfile.logo || '/assets/id-templates/logo.png',
      studentPhoto: card.photoUrl,
      studentName: card.studentName,
      rollNumber: student.roll_number || '00',
      standard: classDiv.class,
      division: classDiv.division,
      grNo: card.grNo,
      dob: card.dob,
      address: card.address,
      contactNumber: card.emergency,
      designation: 'Principal',
    };
  };

  // --- Loading State ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // --- Render ---
  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-full">
      <div className="flex justify-between items-center mb-6">
        <Button
          className="flex items-center text-orange-500 border bg-white border-orange-600 hover:bg-orange-500 hover:text-white group"
          onClick={() => window.history.back()}
        >
          ← Back
        </Button>
        <h2 className="text-3xl font-bold text-gray-900">Select ID Card Template</h2>
        <div className="w-24"></div> {/* Spacer */}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Preview Area */}
          <div className="col-span-2 bg-gray-100 rounded-xl border h-fit mx-6">
            <div className="scale-80 origin-center transition-all duration-300">
              {selectedTemplate === 'template1' && (
                <IdentityCardTemplate1 {...getTemplate1Props()} />
              )}
              {selectedTemplate === 'template3' && (
                <IdentityCardTemplate3 {...getTemplate3Props()} apiSignature={masterSignature} />
              )}
              {selectedTemplate === 'template4' && (
                <IdentityCardTemplate4
                  {...getTemplate4Props()}
                  signatureImage={masterSignature || '/assets/id-templates/sign.png'}
                />
              )}
            </div>
          </div>

          <div className="col-span-1">
            <h3 className="text-xl font-semibold mb-2 text-center text-gray-900">
              Choose a Design
            </h3>
            <div className="flex flex-col justify-center gap-4 mb-8">
              <button
                onClick={() => setSelectedTemplate('template1')}
                className={`px-6 py-2 rounded-full font-medium transition ${
                  selectedTemplate === 'template1'
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Template 1 (Horizontal)
              </button>
              <button
                onClick={() => setSelectedTemplate('template3')}
                className={`px-6 py-2 rounded-full font-medium transition ${
                  selectedTemplate === 'template3'
                    ? 'bg-red-600 text-white shadow-lg scale-105'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Template 2 (Vertical)
              </button>
              <button
                onClick={() => setSelectedTemplate('template4')}
                className={`px-6 py-2 rounded-full font-medium transition ${
                  selectedTemplate === 'template4'
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Template 3 (Modern)
              </button>
            </div>
            <div className="flex justify-center mt-6 border-t pt-6">
              <button
                onClick={() => {
                  if (!students.length) {
                    toast.error('No students available to generate cards.');
                    return;
                  }
                  navigate('/school-dashboard/id-preview', {
                    state: {
                      classDiv,
                      students,
                      selectedTemplateName: selectedTemplate,
                      schoolName,
                    },
                  });
                }}
                className="px-10 py-3 bg-green-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-green-700 transition transform hover:scale-105 flex items-center gap-2"
              >
                Continue to Preview
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <p className="text-sm text-gray-500 mb-4">
            Previewing with data from first student:{' '}
            <strong>{student?.student_name || 'N/A'}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
