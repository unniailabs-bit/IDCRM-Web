import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, School, Eye, EyeOff, Trash2, Pencil, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trustSchoolApi } from "@/api/trust/schools";

export function SchoolConfiguration() {
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [editingSchool, setEditingSchool] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [divisionName, setDivisionName] = useState("");
  const [submitMessage, setSubmitMessage] = useState({ text: "", type: "error" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    schoolName: "",
    schoolCode: "", // New field
    email: "",
    phone: "",
    address: "",
    password: "", // New field
  });

  const [errors, setErrors] = useState({});

  const educationTabs = [
    "Pre-Primary",
    "Primary",
    "Secondary",
    "Higher Sec",
    "Graduate",
    "PG/Master",
    "Custom",
  ];

  const classMap = {
    "Pre-Primary": ["Playschool", "Nursery", "LKG", "UKG"],
    "Primary": ["Class 1", "Class 2", "Class 3", "Class 4"],
    "Secondary": [
      "Class 5",
      "Class 6",
      "Class 7",
      "Class 8",
      "Class 9",
      "Class 10",
    ],
    "Higher Sec": ["Class 11", "Class 12"],
    Graduate: ["Class 13", "Class 14", "Class 15"],
    "PG/Master": ["Semester 1", "Semester 2"],
    Custom: [],
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleEditClick = (school) => {
    setEditingSchool(school);
    setFormData(school);
    setShowForm(true);
  };

  const handleSubmit = () => {
    let tempErrors = {};
    if (!formData.schoolName) tempErrors.schoolName = "School Name is required";
    if (!formData.schoolCode) tempErrors.schoolCode = "School Code is required";
    if (!formData.email) tempErrors.email = "Email is required";
    if (!formData.phone) tempErrors.phone = "Phone Number is required";
    if (!formData.address) tempErrors.address = "Address is required";
    // Password is not required when editing
    if (!editingSchool && !formData.password) tempErrors.password = "Password is required";

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }
    
    // if not editing, check for unique school code
    if (!editingSchool && schools.some(school => school.schoolCode === formData.schoolCode)) {
      setErrors({ ...errors, schoolCode: "School code must be unique." });
      return;
    }

    if (editingSchool) {
      // Update existing school
      setSchools(schools.map(school => 
        school.schoolCode === editingSchool.schoolCode ? { ...school, ...formData } : school
      ));
    } else {
      // Add new school
      const newSchool = { ...formData, classesSelected: [], divisions: {} };
      setSchools([...schools, newSchool]);
    }

    setShowForm(false);
    setEditingSchool(null);
    setFormData({ schoolName: "", schoolCode: "", email: "", phone: "", address: "", password: "" });
  };

  const handleClassSelect = (cls) => {
    if (!selectedSchool) return;

    const updatedClasses = selectedSchool.classesSelected.includes(cls)
      ? selectedSchool.classesSelected.filter((c) => c !== cls)
      : [...selectedSchool.classesSelected, cls];

    const updatedDivisions = { ...selectedSchool.divisions };
    if (!updatedDivisions[cls]) updatedDivisions[cls] = [];

    const updatedSchool = {
      ...selectedSchool,
      classesSelected: updatedClasses,
      divisions: updatedDivisions,
    };

    setSchools(schools.map((s) => (s === selectedSchool ? updatedSchool : s)));
    setSelectedSchool(updatedSchool);
    setSelectedClass(cls);
  };

  const handleAddDivision = () => {
    if (!selectedClass || !divisionName.trim()) return;

    const updatedDivisions = {
      ...selectedSchool.divisions,
      [selectedClass]: [
        ...selectedSchool.divisions[selectedClass],
        divisionName.trim(),
      ],
    };

    const updatedSchool = { ...selectedSchool, divisions: updatedDivisions };
    setSchools(schools.map((s) => (s === selectedSchool ? updatedSchool : s)));
    setSelectedSchool(updatedSchool);
    setDivisionName("");
  };

  const handleDeleteSchool = (schoolToDelete) => {
    setSchools(schools.filter(school => school.schoolCode !== schoolToDelete.schoolCode));
    if (selectedSchool?.schoolCode === schoolToDelete.schoolCode) {
      setSelectedSchool(null);
    }
  };

  const handleFinalSubmit = async () => {
    const hasConfig = schools.some(
      (school) =>
        school.classesSelected.length > 0 &&
        Object.values(school.divisions).some((divs) => divs.length > 0)
    );

    if (!hasConfig) {
      setSubmitMessage({
        text: "Please configure classes/divisions for at least one school",
        type: "error",
      });
      return;
    }

    setSubmitMessage({ text: "", type: "error" }); // Clear previous messages
    setIsSubmitting(true);

    try {
      const getSectionForClass = (className) => {
        for (const section in classMap) {
          if (classMap[section].includes(className)) {
            if (section === "Higher Sec") {
              return "Higher Secondary";
            }
            return section;
          }
        }
        return "Custom";
      };

      const schoolCreationPromises = schools.map((school) => {
        const apiClasses = [];
        for (const className of school.classesSelected) {
          const section = getSectionForClass(className);
          const divisionsForClass = school.divisions[className] || [];
          for (const division of divisionsForClass) {
            apiClasses.push({
              class_name: className,
              section: section,
              division: division,
            });
          }
        }

        const schoolData = {
          schoolName: school.schoolName,
          school_code: school.schoolCode,
          email: school.email,
          phone: school.phone,
          address: school.address,
          password: school.password,
          classes: apiClasses,
        };
        return trustSchoolApi.createSchool(schoolData);
      });

      const results = await Promise.allSettled(schoolCreationPromises);

      const successfulSchools = [];
      const failedSchools = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successfulSchools.push(schools[index].schoolName);
        } else {
          failedSchools.push({
            name: schools[index].schoolName,
            reason: result.reason.message || "An unknown error occurred.",
          });
        }
      });

      if (failedSchools.length > 0) {
        const errorReason = failedSchools.map(f => `${f.name}: ${f.reason}`).join('; ');
        if (successfulSchools.length === 0) {
          if (schools.length === 1) {
            setSubmitMessage({ text: `Error: ${failedSchools[0].name} failed to add. Reason: ${failedSchools[0].reason}`, type: 'error' });
          } else {
            setSubmitMessage({ text: `All schools failed to add. Reasons: ${errorReason}`, type: 'error' });
          }
        } else {
          setSubmitMessage({ text: `Some schools were added, but the following failed: ${errorReason}`, type: 'error' });
        }
        console.error("Failed schools:", failedSchools);
      } else {
        setSubmitMessage({ text: `${schools.length > 1 ? 'All schools' : 'School'} added successfully! Navigating...`, type: 'success' });
        setTimeout(() => navigate("/super-dashboard/trust-registration/review"), 4000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigate = useNavigate();

  const handleBoth = async () => {
    await handleFinalSubmit();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-orange-50 to-green-50 p-6">
      {/* HEADER */}
      <div className="text-center">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
            <School className="text-yellow-700" size={28} />
          </div>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          School Configuration
        </h1>
        <p className="text-gray-700 mt-2">
          Step 2 of 2: Add schools and configure class structure
        </p>
        <p className="text-sm text-gray-500 mt-1">
          <strong>Trust:</strong> abc
        </p>
      </div>
      <br />

      {/* GRID */}
      <div className="max-w-5xl mx-auto w-full mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT */}
        <Card className="bg-white shadow-sm border rounded-xl">
          <CardContent className="p-6">
            <h2 className="text-lg font-medium">Schools</h2>
            <p className="text-gray-600 text-sm mt-1">
              Add and manage schools under this trust
            </p>
            <br />

            {!showForm && (
              <div
                onClick={() => {
                  setEditingSchool(null);
                  setFormData({ schoolName: "", schoolCode: "", email: "", phone: "", address: "", password: "" });
                  setShowForm(true);
                }}
                className="mt-6 border-2 border-dashed rounded-xl py-4 flex items-center justify-center text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <Plus className="mr-2" size={16} />
                Add School
              </div>
            )}

            {!showForm && schools.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-8">
                No schools added yet
              </div>
            )}

            {showForm && (
              <div className="mt-6 p-4 border rounded-xl">
                <h3 className="text-lg font-medium mb-4">{editingSchool ? 'Edit School' : 'Add New School'}</h3>
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium">School Name</label>
                    <input
                      type="text"
                      name="schoolName"
                      value={formData.schoolName}
                      onChange={handleChange}
                      className={`w-full mt-1 p-2 border rounded bg-gray-50 ${
                        errors.schoolName
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter school name"
                    />
                    {errors.schoolName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.schoolName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">School Code</label>
                    <input
                      type="text"
                      name="schoolCode"
                      value={formData.schoolCode}
                      onChange={handleChange}
                      disabled={!!editingSchool}
                      className={`w-full mt-1 p-2 border rounded bg-gray-50 ${
                        errors.schoolCode
                          ? "border-red-500"
                          : "border-gray-300"
                      } ${!!editingSchool ? 'cursor-not-allowed bg-gray-200' : ''}`}
                      placeholder="Enter school code"
                    />
                    {errors.schoolCode && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.schoolCode}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full mt-1 p-2 border rounded bg-gray-50 ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter Email"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full mt-1 p-2 border rounded bg-gray-50 ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter Phone Number"
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`w-full mt-1 p-2 border rounded bg-gray-50 ${
                        errors.address ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter Address"
                    />
                    {errors.address && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.address}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full mt-1 p-2 border rounded bg-gray-50 pr-10 ${
                          errors.password ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder={editingSchool ? "Enter new password to update" : "Enter Password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 px-3 flex items-center text-gray-500 h-full"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 mt-2">
                    <Button className="bg-green-600 text-white" onClick={handleSubmit}>
                      {editingSchool ? 'Update' : 'Add'}
                    </Button>

                    <Button
                      variant="outline"
                      className="border-gray-400"
                      onClick={() => {
                        setShowForm(false);
                        setEditingSchool(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {schools.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Added Schools</h3>
                <div className="flex flex-col gap-2">
                  {schools.map((school) => (
                    <div
                      key={school.schoolCode}
                      className={`p-2 rounded border ${
                        selectedSchool?.schoolCode === school.schoolCode
                          ? "bg-green-100 border-green-400"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div
                          onClick={() => setSelectedSchool(school)}
                          className="flex-grow cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {school.schoolName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {school.email}
                            </span>

                            {school.classesSelected &&
                            school.classesSelected.length > 0 ? (
                              <div className="mt-1 text-xs text-gray-700 flex flex-wrap gap-1">
                                {school.classesSelected.map((cls, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 bg-yellow-100 rounded-full"
                                  >
                                    {cls}
                                    {school.divisions[cls]?.length > 0 && (
                                      <span className="ml-1 text-blue-600">
                                        ({school.divisions[cls].join(", ")})
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 mt-1">
                                No configuration added
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                           <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-500 hover:text-blue-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(school);
                            }}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSchool(school);
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RIGHT SIDE */}
        <Card className="bg-white shadow-sm border rounded-xl min-h-[450px]">
          <CardContent className="p-6">
            <h2 className="text-lg font-medium">
              Configure
              {selectedSchool ? `: ${selectedSchool.schoolName}` : ""}
            </h2>

            <p className="text-sm text-gray-600 mt-1">
              Select classes and add divisions for each educational section
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              {educationTabs.map((item) => (
                <button
                  key={item}
                  className={`px-4 py-1 text-sm rounded-full border ${
                    selectedTab === item
                      ? "bg-green-200 border-green-400"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedTab(item)}
                  disabled={!selectedSchool}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {selectedSchool ? (
                selectedTab ? (
                  classMap[selectedTab].length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {classMap[selectedTab].map((cls) => (
                        <span
                          key={cls}
                          className={`px-3 py-1 rounded-full text-sm cursor-pointer font-medium border ${
                            selectedSchool.classesSelected.includes(cls)
                              ? "bg-green-500 text-white border-green-600"
                              : "bg-white text-gray-700 border-gray-300"
                          }`}
                          onClick={() => handleClassSelect(cls)}
                        >
                          {cls}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 mt-3">
                      No classes added yet for {selectedTab}
                    </p>
                  )
                ) : (
                  <p className="text-gray-500 mt-3">
                    Select an educational section to see classes
                  </p>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
                  <School size={48} className="opacity-40" />
                  <p className="mt-3 text-center">
                    Select a school from the list to configure classes
                  </p>
                </div>
              )}
            </div>

            {selectedClass && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-sm font-medium mb-2">
                  Divisions for {selectedClass}
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={divisionName}
                    onChange={(e) => setDivisionName(e.target.value)}
                    placeholder="Enter division name"
                    className="border p-2 rounded w-full"
                  />
                  <Button
                    className="bg-green-600 text-white"
                    onClick={handleAddDivision}
                  >
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSchool.divisions[selectedClass]?.map((div, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 rounded-full text-sm"
                    >
                      {div}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FOOTER BUTTONS */}
      <div className="flex justify-between items-center mt-10 max-w-5xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => navigate("/trust/register")}
        >
          ← Back to Trust Details
        </Button>

        <Button
          className="bg-gradient-to-r from-yellow-400 to-green-400 text-black px-6"
          onClick={handleBoth}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit for Approval"
          )}
        </Button>
      </div>

      {/* SUBMIT MESSAGE */}
      {submitMessage.text && (
        <p className={`text-sm mt-2 text-center max-w-5xl mx-auto ${submitMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
          {submitMessage.text}
        </p>
      )}
    </div>
  );
}
