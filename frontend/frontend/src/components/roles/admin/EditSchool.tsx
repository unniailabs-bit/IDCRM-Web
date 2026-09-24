import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SchoolForm } from '../../common/SchoolForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { schoolService } from '@/api/schoolService';
import { trustService } from '@/api/trustService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function EditSchool() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [allTrusts, setAllTrusts] = useState<any[]>([]);
  const [schoolData, setSchoolData] = useState({
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
    classesSelected: [] as string[],
    divisions: {} as Record<string, string[]>,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [divisionName, setDivisionName] = useState('');
  const [customClassName, setCustomClassName] = useState('');

  const initialClassMap = {
    'Pre-Primary': ['Playschool', 'Nursery', 'LKG', 'UKG'],
    Primary: ['Class 1', 'Class 2', 'Class 3', 'Class 4'],
    Secondary: ['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
    'Higher Sec': ['Class 11', 'Class 12'],
    Graduate: ['Class 13', 'Class 14', 'Class 15'],
    'PG/Master': ['Semester 1', 'Semester 2'],
    Custom: [],
  };

  const [classMap, setClassMap] = useState(initialClassMap);

  const fetchTrusts = async () => {
    try {
      const response = await trustService.getAllTrusts();
      if (response && response.data) {
        setAllTrusts(response.data);
      }
    } catch (error) {
      console.error('Error fetching trusts:', error);
    }
  };

  const fetchSchoolData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await schoolService.getSchoolById(parseInt(id));

      if (response.success && response.data) {
        const school = response.data;

        // Extract classes and divisions
        const classesSelected: string[] = [];
        const divisions: Record<string, string[]> = {};

        if (school.classes && Array.isArray(school.classes)) {
          school.classes.forEach((cls: any) => {
            if (cls.class_name) {
              classesSelected.push(cls.class_name);
              if (cls.divisions && cls.divisions.length > 0) {
                divisions[cls.class_name] = cls.divisions.map((div: any) => div.division_name);
              }
            }
          });
        }

        setSchoolData({
          schoolName: school.school_name || '',
          trustId: school.trust_id || 0,
          trust_name: school.trust_name || '',
          schoolAdminName: school.school_admin_name || '',
          email: school.email || '',
          phone: school.phone || '',
          address: school.address || '',
          totalStudents: school.total_students || 0,
          password: '',
          confirmPassword: '',
          classesSelected,
          divisions,
        });
      }
    } catch (error: any) {
      console.error('Error fetching school data:', error);
      toast.error(error.response?.data?.message || t('schools.loadError'));
      navigate('/dashboard/schools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrusts();
  }, []);

  useEffect(() => {
    if (id) {
      fetchSchoolData();
    }
  }, [id]);

  const handleUpdateSchool = async () => {
    let tempErrors: any = {};
    if (!schoolData.schoolName) tempErrors.schoolName = t('schools.nameRequired');
    if (!schoolData.schoolAdminName) tempErrors.schoolAdminName = t('schools.adminNameRequired');
    if (!schoolData.email) tempErrors.email = t('schools.emailRequired');
    if (!schoolData.phone) {
      tempErrors.phone = t('schools.phoneRequired');
    } else if (!/^\d{10}$/.test(schoolData.phone)) {
      tempErrors.phone = t('schools.invalidPhone');
    }
    if (!schoolData.address) tempErrors.address = t('schools.addressRequired');

    // Password is optional for updates, but if provided, must match
    if (schoolData.password && schoolData.password !== schoolData.confirmPassword) {
      tempErrors.confirmPassword = t('schools.passwordMismatch');
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    const getSectionForClass = (className: string) => {
      for (const section in classMap) {
        if (classMap[section as keyof typeof classMap].includes(className)) {
          if (section === 'Higher Sec') {
            return 'Higher Secondary';
          }
          return section;
        }
      }
      return 'Custom';
    };

    const apiClasses = [];
    for (const className of schoolData.classesSelected) {
      const section = getSectionForClass(className);
      const divisionsForClass = schoolData.divisions[className] || [];
      for (const division of divisionsForClass) {
        apiClasses.push({
          class_name: className,
          section: section,
          division: division,
        });
      }
    }

    try {
      const { trust_name, confirmPassword, classesSelected, divisions, ...updateData } = schoolData;

      const payload: any = {
        ...updateData,
        classes: apiClasses,
      };

      // Only include password if it was provided
      if (!schoolData.password) {
        delete payload.password;
      }

      await schoolService.updateSchool(parseInt(id!), payload);
      toast.success(t('schools.updateSuccess'));
      navigate('/dashboard/schools');
    } catch (error: any) {
      console.error('Error updating school:', error);
      toast.error(error.response?.data?.message || t('schools.updateError'));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length > 10) return;
      setSchoolData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setSchoolData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev: any) => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (value: string) => {
    const selectedTrust = allTrusts.find((trust) => trust.trust_name === value);
    if (selectedTrust) {
      setSchoolData((prev) => ({ ...prev, trust_name: value, trustId: selectedTrust.id }));
    }
  };

  const handleClassSelect = (cls: string) => {
    setSchoolData((currentSchool) => {
      const isSelected = currentSchool.classesSelected.includes(cls);
      const newClassesSelected = isSelected
        ? currentSchool.classesSelected.filter((c) => c !== cls)
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

    if (schoolData.classesSelected.includes(cls) && selectedClass === cls) {
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
    const currentDivisions = schoolData.divisions[selectedClass] || [];

    if (currentDivisions.includes(nameToAdd)) {
      toast.error(t('classManagement.divisionExists', { className: selectedClass }));
      return;
    }

    const updatedDivisions = {
      ...schoolData.divisions,
      [selectedClass]: [...currentDivisions, nameToAdd],
    };

    setSchoolData((prev) => ({ ...prev, divisions: updatedDivisions }));
    setDivisionName('');
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-dvh">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('schools.editSchool')}</h1>
        <p className="text-gray-600 mt-1">{t('schools.editSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full">
        <Card className="lg:col-span-5 rounded-2xl border border-gray-300 shadow-lg h-fit">
          <CardContent className="p-6">
            <SchoolForm
              formData={schoolData}
              errors={errors}
              showPassword={showPassword}
              editingSchool={true}
              allTrusts={allTrusts}
              handleChange={handleInputChange}
              handleSubmit={handleUpdateSchool}
              // setShowPassword={setShowPassword}
              // showConfirmPassword={showConfirmPassword}
              // setShowConfirmPassword={setShowConfirmPassword}
              handleSelectChange={handleSelectChange}
            />
          </CardContent>
        </Card>

        {/* <Card className="lg:col-span-2 rounded-2xl border border-gray-300 shadow-lg h-fit w-full">
          <CardContent className="p-6">
            <h2 className="text-lg font-medium">Configure Classes & Divisions</h2>

            <p className="text-sm text-gray-600 mt-1">
              Select classes and add divisions for each educational section
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              {Object.keys(classMap).map((item) => (
                <button
                  key={item}
                  className={`px-4 py-1 text-sm rounded-full border ${
                    selectedTab === item
                      ? 'bg-green-200 border-green-400'
                      : 'bg-gray-100 hover:bg-gray-200'
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
                  {classMap[selectedTab as keyof typeof classMap].length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {classMap[selectedTab as keyof typeof classMap].map((cls) => (
                        <span
                          key={cls}
                          className={`px-3 py-1 rounded-full text-sm cursor-pointer font-medium border ${
                            schoolData.classesSelected.includes(cls)
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
                      <Button className="bg-blue-600 text-white" onClick={handleAddCustomClass}>
                        Add Class
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 mt-3">Select an educational section to see classes</p>
              )}
            </div>

            {selectedClass && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Divisions for {selectedClass}</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={divisionName}
                    onChange={(e) => setDivisionName(e.target.value)}
                    placeholder="Enter division name (e.g., 'A', 'Red')"
                    className="border p-2 rounded w-full"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddDivision();
                      }
                    }}
                  />
                  <Button className="bg-green-600 text-white" onClick={handleAddDivision}>
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {schoolData.divisions[selectedClass]?.map((div, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 rounded-full text-sm">
                      {div}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card> */}
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline" onClick={() => navigate('/dashboard/schools')}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleUpdateSchool}
          className="bg-orange-500 hover:bg-orange-700 text-white"
        >
          {t('schools.updateSchool')}
        </Button>
      </div>
    </div>
  );
}
