import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";

interface Student {
  name: string;
  roll: number;
  status: "Printed" | "Not Printed";
  student_form_id?: number;
}

interface ClassDivision {
  class: string;
  division: string;
}

export default function IDCardManagement() {
  const location = useLocation();
  const navigate = useNavigate();
  const { classDiv }: { classDiv?: ClassDivision } = location.state || {};

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);


  // State to track selected student roll numbers
  const [selectedRolls, setSelectedRolls] = useState<Set<number>>(new Set());

  // Fetch students and their ID generation status
  useEffect(() => {
    const fetchStudents = async () => {
      if (!classDiv?.class || !classDiv?.division) {
        toast.error("Class/Division information missing. Redirecting to template gallery...");
        setTimeout(() => {
          navigate("/school-dashboard/id-template", { state: { classDiv } });
        }, 2000);
        return;
      }

      try {
        setLoading(true);
        // Fetch students for the class/division
        const response = await axiosInstance.get("/api/school/class-students", {
          params: {
            className: classDiv.class,
            division: classDiv.division,
          },
        });

        if (response.data.success && response.data.data) {
          // Fetch ID generation status
          const idStatusResponse = await axiosInstance.get("/api/school/student-id/pending-ids");
          const generatedIds = idStatusResponse.data.success
            ? new Set(idStatusResponse.data.data.map((s: any) => s.student_form_id))
            : new Set();

          const studentList = response.data.data.map((student: any) => ({
            name: (student.first_name || student.last_name)
              ? `${student.first_name || ""} ${student.middle_name || student.father_first_name || (student.father_name ? student.father_name.split(' ')[0] : '')} ${student.last_name || ""}`.replace(/\s+/g, ' ').trim()
              : student.student_name || student.name || "",
            roll: student.roll_number || 0,
            status: generatedIds.has(student.id) ? "Printed" as const : "Not Printed" as const,
            student_form_id: student.id,
          }));

          setStudents(studentList);
        } else {
          toast.error("Failed to fetch students");
        }
      } catch (error: any) {
        console.error("Error fetching students:", error);
        toast.error("Failed to load student data");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [classDiv, navigate]);

  const handleSelect = (roll: number) => {
    setSelectedRolls((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(roll)) {
        newSelected.delete(roll);
      } else {
        newSelected.add(roll);
      }
      return newSelected;
    });
  };

  const handleGenerateIDs = async () => {
    if (selectedRolls.size === 0) {
      toast.error("Please select at least one student");
      return;
    }

    const firstTimePrint = students.filter(
      (s) => selectedRolls.has(s.roll) && s.status === "Not Printed"
    ).length;

    if (firstTimePrint === 0) {
      toast.info("All selected students already have generated IDs. Proceeding to template selection...");
      navigate("/school-dashboard/id-template", { state: { classDiv } });
      return;
    }

    try {
      setGenerating(true);
      // Pass className and division to filter ID generation to this class only
      const response = await axiosInstance.post("/api/school/student-id/generate-ids", {
        className: classDiv?.class,
        division: classDiv?.division
      });

      if (response.data.success) {
        toast.success(
          `${response.data.summary.total_generated} IDs generated successfully. ${response.data.summary.credits_deducted} credits deducted.`
        );
        // Refresh the student list
        window.location.reload();
      } else {
        toast.error(response.data.message || "Failed to generate IDs");
      }
    } catch (error: any) {
      console.error("Error generating IDs:", error);
      toast.error(
        error.response?.data?.message || "Failed to generate IDs. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectTemplate = () => {
    navigate("/school-dashboard/id-template", { state: { classDiv } });
  };

  const selectedStudents = students.filter((s: Student) => selectedRolls.has(s.roll));
  const alreadyPrinted = selectedStudents.filter((s: Student) => s.status === "Printed").length;
  const firstTimePrint = selectedStudents.filter((s: Student) => s.status === "Not Printed").length;

  const selectedCount = selectedStudents.length;
  const costPerCard = 15;
  const totalCost = firstTimePrint * costPerCard;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!classDiv) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">No class/division information available.</p>
            <Button onClick={() => navigate("/school-dashboard/digital-forms")}>
              Go to Digital Forms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex gap-6 p-6">

      {/* LEFT STUDENT TABLE */}
      <Card className="flex-1 border shadow-sm">
        <CardContent className="p-6">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">
                Students - Class {classDiv.class} Division {classDiv.division}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Select students to generate IDs or proceed to template selection
              </p>
            </div>

            <span className="text-sm bg-blue-100 px-3 py-1 rounded-md">
              {students.length} Students
            </span>
          </div>

          {/* TABLE */}
          <table className="w-full mt-5 border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Select</th>
                <th className="p-2">Student Name</th>
                <th className="p-2">Roll No.</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>

            <tbody>
              {students.map((s) => (
                <tr key={s.roll} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedRolls.has(s.roll)}
                      onChange={() => handleSelect(s.roll)}
                    />
                  </td>

                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.roll}</td>

                  <td className="p-2">
                    <Badge
                      className={
                        s.status === "Printed"
                          ? "!bg-green-100 text-green-700"
                          : "!bg-orange-100 text-orange-700"
                      }
                    >
                      {s.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 mt-6">
            {firstTimePrint > 0 && (
              <Button
                onClick={handleGenerateIDs}
                disabled={generating || selectedCount === 0}
                className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-600 disabled:opacity-50"
              >
                {generating ? "Generating..." : `Generate IDs (${firstTimePrint} new)`}
              </Button>
            )}

            <Button
              onClick={handleSelectTemplate}
              className="bg-orange-500 text-white px-4 py-2 hover:bg-orange-600"
            >
              Select Template & Preview
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* RIGHT SIDEBAR SUMMARY */}
      <Card className="w-80 border shadow-sm">
        <CardContent className="p-6">

          <h3 className="text-lg font-semibold mb-4">Print Summary</h3>

          <div className="flex justify-between py-2 text-sm text-gray-700">
            <span>Total Students Selected</span>
            <span>{selectedCount}</span>
          </div>

          <div className="flex justify-between py-2 text-sm text-gray-700">
            <span>Already Printed</span>
            <span className="text-green-600">{alreadyPrinted}</span>
          </div>

          <div className="flex justify-between py-2 text-sm text-gray-700">
            <span>First-time Print</span>
            <span className="text-orange-600">{firstTimePrint}</span>
          </div>

          <div className="flex justify-between py-2 text-sm text-gray-700">
            <span>Cost per Card</span>
            <span>₹{costPerCard}</span>
          </div>

          <div className="mt-4 p-3 bg-blue-100 rounded-md text-center font-semibold text-lg">
            Total Cost: ₹{totalCost}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            * Reprints are free. No credit will be deducted for already printed cards.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}