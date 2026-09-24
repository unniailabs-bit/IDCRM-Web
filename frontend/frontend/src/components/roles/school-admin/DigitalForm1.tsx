import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Eye, CreditCard, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { summaryService } from '@/api/summaryService';
import { useNavigate } from "react-router-dom";


function CircularProgress({ value, size = 60, stroke = 6, color = '#000' }: { value: string | number, size?: number, stroke?: number, color?: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Number(value) / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        stroke="#E5E7EB"
        fill="transparent"
        strokeWidth={stroke}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        r={radius}
        cx={size / 2}
        cy={size / 2}
        className="transition-all duration-700"
      />
      <text
        x="50%"
        y="50%"
        dy="8"
        textAnchor="middle"
        className="text-xs font-semibold rotate-90"
      >
        {value}%
      </text>
    </svg>
  );
}

interface StudentData {
  id?: string | number;
  "Form ID"?: string | number;
  "Roll No": string;
  "Student Name": string;
  "DOB": string;
  "Blood": string;
  "Address": string;
  "Father Name": string;
  "Father Phone": string;
  "Mother Name": string;
  "Mother Phone": string;
  "Emergency": string;
  "Status": string;
}

interface ClassDivision {
  id: string;
  class: string;
  division: string;
  class_teacher?: string;
  totalStudents: number;
  submittedForms: number;
  teacherApproved: number;
  adminApproved: number;
  students: StudentData[];
}

interface SummaryStats {
  submittedForms: number;
  adminApproved: number;
  readyForIds: number;
}

export function DigitalForms() {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const [classData, setClassData] = useState<ClassDivision[]>([]);
  const [allStudents, setAllStudents] = useState<StudentData[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    submittedForms: 0,
    adminApproved: 0,
    readyForIds: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.id) return;

      try {
        const summaryResponse = await summaryService.getSchoolSummary();
        const csvData = await summaryService.getSchoolSummaryCsv();

        let students: StudentData[] = [];

        if (csvData && typeof csvData === "string") {
          const workbook = XLSX.read(csvData, { type: "string" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          students = XLSX.utils.sheet_to_json<StudentData>(worksheet, { raw: false });
        }

        setAllStudents(students);

        if (summaryResponse.success && Array.isArray(summaryResponse.data)) {
          const formattedClassData = summaryResponse.data.map((item: any) => ({
            id: `${item.class_name}-${item.division}-${item.class_teacher}`,
            class: item.class_name,
            division: item.division,
            class_teacher: item.class_teacher,
            totalStudents: item.total_forms,
            submittedForms: item.total_forms,
            teacherApproved: item.approved,
            adminApproved: item.approved,
            students
          }));

          setClassData(formattedClassData);

          const aggregates = formattedClassData.reduce(
            (acc, curr) => {
              acc.submittedForms += curr.submittedForms || 0;
              acc.adminApproved += curr.adminApproved || 0;
              acc.readyForIds += curr.adminApproved || 0;
              return acc;
            },
            { submittedForms: 0, adminApproved: 0, readyForIds: 0 }
          );

          setSummaryStats(aggregates);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData();
  }, [userData]);

  const calculateProgress = (classDiv: ClassDivision) => {
    const submissionRate = (classDiv.submittedForms / classDiv.totalStudents) * 100;
    const teacherApprovalRate = (classDiv.teacherApproved / classDiv.submittedForms) * 100;
    const adminApprovalRate = (classDiv.adminApproved / classDiv.submittedForms) * 100;

    return {
      submission: submissionRate?.toFixed(0) || 0,
      teacherApproval: teacherApprovalRate?.toFixed(0) || 0,
      adminApproval: adminApprovalRate?.toFixed(0) || 0,
    };
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(allStudents);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "all_students.xlsx");
  };

  // ⭐ NAVIGATION FIXED
  const handleViewSheet = (classDiv: ClassDivision) => {
    navigate("/school-dashboard/student-data-sheet", {
      state: {
        selectedClass: classDiv,
        allStudents: allStudents
      }
    });
  };

  const handleGenerateIDs = (classDiv: ClassDivision) => {
    navigate("/school-dashboard/id-template", {
      state: { classDiv }
    });
  };

  return (
    <div className="p-6 md:p-10">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Digital Form Collection</h1>
          <p className="text-gray-600 mt-1">Manage submitted forms and student data</p>
        </div>
        <Button
          onClick={exportToExcel}
          className="gap-2 text-white !bg-blue-500 !hover:bg-blue-600"
        >
          <Download className="w-4 h-4" />
          Export All Data
        </Button>

      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 mb-10">
        <Card className="border shadow-sm">
          <CardContent className="p-6 flex flex-col">
            <img src="/assets/Total Students icon.png" alt="Total Students" className="w-10 h-10" />
            <p className="text-sm text-gray-600">Total Students</p>
            <h2 className="text-4xl font-semibold">{allStudents.length}</h2>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-6 flex flex-col">
            <img src="/assets/Forms Submitted.png" alt="Total Students" className="w-10 h-10" />

            <p className="text-sm text-gray-600">Forms Submitted</p>
            <h2 className="text-4xl font-semibold">{summaryStats.submittedForms}</h2>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <img src="/assets/Admin Approved.png" alt="Total Students" className="w-10 h-10" />

            <p className="text-sm text-gray-600">Admin Approved</p>
            <h2 className="text-4xl font-semibold">{summaryStats.adminApproved}</h2>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <img src="/assets/ID Card.png" alt="Total Students" className="w-10 h-10" />

            <p className="text-sm text-gray-600">Ready for IDs</p>
            <h2 className="text-4xl font-semibold">{summaryStats.readyForIds}</h2>
          </CardContent>
        </Card>
      </div><br></br>

      {/* CLASS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classData.map((classDiv) => {
          const progress = calculateProgress(classDiv);

          return (
            <Card key={classDiv.id} className="shadow-sm border">
              <CardContent className="p-6">

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Class {classDiv.class} – Division {classDiv.division}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Teacher: <span className="font-medium text-gray-700">{classDiv.class_teacher || 'N/A'}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <h2 className="text-xl font-semibold">{classDiv.totalStudents}</h2>
                    <p className="text-xs text-gray-500">Students</p>
                  </div>
                </div>

                {/* PROGRESS */}
                <div className="grid grid-cols-3 gap-4 text-center mt-6">
                  <div className="flex flex-col items-center p-4 border rounded-lg shadow-sm">
                    <CircularProgress value={progress.submission} size={70} color="#2B7FFF" />
                    <p className="text-sm mt-2 text-gray-700">Submitted</p>
                    <p className="text-xs text-gray-500">
                      {classDiv.submittedForms}/{classDiv.totalStudents}
                    </p>
                  </div>

                  <div className="flex flex-col items-center p-4 border rounded-lg shadow-sm">
                    <CircularProgress value={progress.teacherApproval} size={70} color="#AD46FF" />
                    <p className="text-sm mt-2 text-gray-700">Teacher Approved</p>
                    <p className="text-xs text-gray-500">
                      {classDiv.teacherApproved}/{classDiv.submittedForms}
                    </p>
                  </div>

                  <div className="flex flex-col items-center p-4 border rounded-lg shadow-sm">
                    <CircularProgress value={progress.adminApproval} size={70} color="#008236" />
                    <p className="text-sm mt-2 text-gray-700">Admin Approved</p>
                    <p className="text-xs text-gray-500">
                      {classDiv.adminApproved}/{classDiv.submittedForms}
                    </p>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => handleViewSheet(classDiv)}
                  >
                    <Eye className="w-4 h-4" /> View Sheet
                  </Button>

                  <Button
                    onClick={() => handleGenerateIDs(classDiv)}
                    className="flex-1 gap-2 text-white !bg-blue-500 !hover:bg-blue-600"
                  >
                    Generate IDs
                  </Button>

                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}