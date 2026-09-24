import React, { useState, useEffect } from "react";
import { School, Mail, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom"; 
import { trustSchoolApi } from "@/api/trust/schools";
import { useAuth } from "@/hooks/useAuth";

export const ReviewConfirm = () => {
  const { userData, login, userRole } = useAuth();
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // console.log(userData);
    const fetchSchools = async () => {
      try {
        setLoading(true);
        if (!userData || !userData.id) {
          setError("Trust ID not available. Please log in as a trust admin.");
          setLoading(false);
          return;
        }
        const response = await trustSchoolApi.getAllSchools(userData.id); 
        if (response.success) {
          if (userData.total_schools !== response.data.length) {
            const newUserData = {
              ...userData,
              total_schools: response.data.length,
            };
            login(userRole, newUserData);
          }

          const transformedData = response.data.map(school => {
            const classesAdded = school.classes.reduce((acc, cls) => {
              acc[cls.class_name] = cls.divisions.map(div => div.division_name);
              return acc;
            }, {});

            const selectedSections = [...new Set(school.classes.map(cls => cls.section))];

            return {
              schoolName: school.school_name,
              email: school.email,
              trustName: userData.trust_name || "Unknown Trust", // Use actual trust name
              selectedSections,
              classesAdded,
            };
          });
          setSchools(transformedData);
          if (transformedData.length > 0) {
            setSelectedSchool(transformedData[0]);
          }
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError("Failed to fetch school data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, [userData, login, userRole]); // Add userData to dependency array to re-fetch if it changes

  const navigate = useNavigate();
  const handleContinue = () => {
    navigate("/super-dashboard/trust-registration/confirm");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 space-y-6">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="text-lg">Loading school data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 space-y-6 text-red-600">
        <p className="text-lg">Error: {error}</p>
      </div>
    );
  }
  
  if (!selectedSchool) {
      return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 space-y-6">
        <p className="text-lg">No schools found for this trust.</p>
      </div>
    );
  }

  const {
    schoolName,
    email,
    trustName,
    selectedSections,
    classesAdded,
  } = selectedSchool;

  const totalSections = selectedSections.length;
  const totalClasses = Object.keys(classesAdded).length;
  const totalDivisions = Object.values(classesAdded).reduce(
    (acc, divs) => acc + divs.length,
    0
  );

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center p-6 space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="bg-blue-600 w-10 h-10 mx-auto rounded-full flex items-center justify-center text-white text-xl">
          🎓
        </div>
        <h1 className="text-xl font-semibold">Review & Confirm Configuration</h1>
        <p className="text-sm text-gray-500">
          Step 4 of 5: Please review your school setup before proceeding
        </p>
        <p className="text-sm text-gray-400">Trust: {trustName}</p>
      </div>

      {/* School Selection */}
      <div className="w-full max-w-3xl">
        <h2 className="text-lg font-medium text-gray-700 mb-2">Select a School to Review</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {schools.map((school, index) => (
            <div
              key={index}
              onClick={() => setSelectedSchool(school)}
              className={`p-4 rounded-lg cursor-pointer border-2 ${
                selectedSchool.schoolName === school.schoolName
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <p className="font-semibold">{school.schoolName}</p>
              <p className="text-sm text-gray-500">{school.email}</p>
            </div>
          ))}
        </div>
      </div>

      {/* School Details Card */}
      <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-medium text-gray-700">School Details</h2>
          <button className="text-blue-600 text-sm">Edit</button>
        </div>
        <div className="text-gray-600 text-sm space-y-4">
          <p className="flex items-center gap-2">
            <School className="w-4 h-4 text-blue-600" />
            <span>
              <strong>School Name</strong><br />
              {schoolName}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-green-600" />
            <span>
              <strong>Email Address</strong><br />
              {email}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-600" />
            <span>
              <strong>Trust Name</strong><br />
              {trustName}
            </span>
          </p>
        </div>
      </div>

      {/* Selected Sections Card */}
      <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-medium text-gray-700">Selected Educational Sections</h2>
          <button className="text-blue-600 text-sm">Edit</button>
        </div>
        <div className="mt-2 flex gap-2 flex-wrap">
          {selectedSections.map((section) => (
            <span
              key={section}
              className="px-3 py-1 bg-gray-200 rounded-full text-sm"
            >
              {section}
            </span>
          ))}
        </div>
      </div>

      {/* Classes Added Card */}
      <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-medium text-gray-700">Classes Added</h2>
          <button className="text-blue-600 text-sm">Edit</button>
        </div><br></br>
        <div className="space-y-3">
          {Object.entries(classesAdded).map(([cls, divisions], index, arr) => (
            <div key={cls}>
              <p className="font-medium text-gray-600">{cls}</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                {divisions.map((div) => (
                  <span
                    key={div}
                    className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"
                  >
                    {div}
                  </span>
                ))}
              </div>
              {index < arr.length - 1 && <hr className="border-t border-gray-300 mt-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Boxes */}
      <div className="flex justify-around w-full max-w-3xl gap-4">
        <div className="bg-white rounded-xl shadow-md p-6 flex-1 text-center">
          <p className="text-2xl font-bold">{totalSections}</p>
          <p className="text-sm text-gray-500">Sections</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex-1 text-center">
          <p className="text-2xl font-bold">{totalClasses}</p>
          <p className="text-sm text-gray-500">Classes</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex-1 text-center">
          <p className="text-2xl font-bold">{totalDivisions}</p>
          <p className="text-sm text-gray-500">Divisions</p>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-between w-full max-w-3xl">
        <button
          className="px-6 py-2 border rounded-lg bg-white hover:bg-gray-100"
          onClick={() => navigate("/trust/register1")}
        >
          Back
        </button>
        <button
          className="px-6 py-2 bg-orange-600 text-white text-center text-lg font-medium rounded-lg shadow hover:bg-orange-700 transition"
          onClick={handleContinue}
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

