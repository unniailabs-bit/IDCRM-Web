import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SchoolForm } from '../../common/SchoolForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function CreateSchoolTrustAdmin() {
  const navigate = useNavigate();
  const { userData: user } = useAuth();
  const [newSchool, setNewSchool] = useState({
    schoolName: '',
    trustId: 0,
    trust_name: '',
    schoolAdminName: '',
    email: '',
    phone: '',
    address: '',
    totalStudents: 0,
    password: '',
    confirmPassword: '',
    classesSelected: [],
    divisions: {},
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [selectedTab, setSelectedTab] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [divisionName, setDivisionName] = useState("");
  const [customClassName, setCustomClassName] = useState("");

  const initialClassMap = {
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

  const [classMap, setClassMap] = useState(initialClassMap);

  useEffect(() => {
    if (user) {
      setNewSchool((prev) => ({
        ...prev,
        trustId: user.trust_id,
        trust_name: user.trust_name,
      }));
    }
  }, [user]);

  const handleSaveSchool = async () => {
    let tempErrors: any = {};
    if (!newSchool.schoolName) tempErrors.schoolName = "School Name is required";
    if (!newSchool.schoolAdminName) tempErrors.schoolAdminName = "School Admin Name is required";
    if (!newSchool.email) tempErrors.email = "Email is required";
    if (!newSchool.phone) {
      tempErrors.phone = "Phone Number is required";
    } else if (!/^\d{10}$/.test(newSchool.phone)) {
      tempErrors.phone = "Please enter a valid 10-digit phone number";
    }
    if (!newSchool.address) tempErrors.address = "Address is required";
    if (!newSchool.password) tempErrors.password = "Password is required";
    if (newSchool.password !== newSchool.confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    // console.log("Saving school data:", newSchool);
    navigate('/dashboard/schools');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const val = value.replace(/\D/g, '');
      if (val.length > 10) return;
      setNewSchool((prev) => ({ ...prev, [name]: val }));
    } else {
      setNewSchool((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev: any) => ({ ...prev, [name]: '' }));
  };

  const handleClassSelect = (cls) => {
    setNewSchool(currentSchool => {
      const isSelected = currentSchool.classesSelected.includes(cls);
      const newClassesSelected = isSelected
        ? currentSchool.classesSelected.filter(c => c !== cls)
        : [...currentSchool.classesSelected, cls];

      const newDivisions = { ...currentSchool.divisions };
      if (isSelected) {
        delete newDivisions[cls];
      }

      return {
        ...currentSchool,
        classesSelected: newClassesSelected,
        divisions: newDivisions,
      };
    });

    if (newSchool.classesSelected.includes(cls) && selectedClass === cls) {
      setSelectedClass(null);
    } else {
      setSelectedClass(cls);
    }
  };

  const handleAddCustomClass = () => {
    if (!customClassName.trim()) return;

    setClassMap((prevClassMap) => {
      const newClassMap = { ...prevClassMap };
      if (!newClassMap.Custom.includes(customClassName)) {
        newClassMap.Custom = [...newClassMap.Custom, customClassName];
      }
      return newClassMap;
    });

    setCustomClassName('');
  };

  const handleAddDivision = () => {
    if (!selectedClass || !divisionName.trim()) return;

    const nameToAdd = divisionName.trim();
    const currentDivisions = newSchool.divisions[selectedClass] || [];

    if (currentDivisions.includes(nameToAdd)) {
      alert(`Division "${nameToAdd}" already exists in ${selectedClass}`);
      return;
    }

    const updatedDivisions = {
      ...newSchool.divisions,
      [selectedClass]: [
        ...currentDivisions,
        nameToAdd,
      ],
    };

    setNewSchool(prev => ({ ...prev, divisions: updatedDivisions }));
    setDivisionName("");
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col gap-6">
        <Card className="bg-white shadow-sm border rounded-xl w-full">
          <CardContent className="p-6">
            <SchoolForm
              formData={newSchool}
              errors={errors}
              showPassword={showPassword}
              editingSchool={false}
              allTrusts={[]}
              handleChange={handleInputChange}
              handleSubmit={handleSaveSchool}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              handleSelectChange={() => { }}
            />
          </CardContent>
        </Card>
        <div className="mt-0">
          <Card className="bg-white shadow-sm border rounded-xl min-h-[450px] w-full">
            <CardContent className="p-6">
              <h2 className="text-lg font-medium">
                Configure
              </h2>

              <p className="text-sm text-gray-600 mt-1">
                Select classes and add divisions for each educational section
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                {Object.keys(classMap).map((item) => (
                  <button
                    key={item}
                    className={`px-4 py-1 text-sm rounded-full border ${selectedTab === item
                      ? "bg-green-200 border-green-400"
                      : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    onClick={() => setSelectedTab(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                {selectedTab ? (
                  <div>
                    {classMap[selectedTab].length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {classMap[selectedTab].map((cls) => (
                          <span
                            key={cls}
                            className={`px-3 py-1 rounded-full text-sm cursor-pointer font-medium border ${newSchool.classesSelected.includes(cls)
                              ? 'bg-green-500 text-white border-green-600'
                              : 'bg-white text-gray-700 border-gray-300'
                              }`}
                            onClick={() => handleClassSelect(cls)}
                          >
                            {cls}
                          </span>
                        ))}
                      </div>
                    )}
                    {selectedTab === 'Custom' && (
                      <div className="flex gap-2 mt-4">
                        <input
                          type="text"
                          value={customClassName}
                          onChange={(e) => setCustomClassName(e.target.value)}
                          placeholder="Enter custom class name"
                          className="border p-2 rounded w-full"
                        />
                        <Button
                          className="bg-blue-600 text-white"
                          onClick={handleAddCustomClass}
                        >
                          Add Class
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 mt-3">
                    Select an educational section to see classes
                  </p>
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
                      placeholder="Enter division name (e.g., 'A', 'Red')"
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
                    {newSchool.divisions[selectedClass]?.map((div, idx) => (
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
      </div>
      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline" onClick={() => navigate('/dashboard/schools')}>
          Cancel
        </Button>
        <Button onClick={handleSaveSchool}>Create School</Button>
      </div>
    </div>
  );
}
