import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/dialog";
import { Eye, CheckCircle, XCircle, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import DigitalFormPage from "./DigitalFormPage";
import { FormLinkManager } from "./FormLinkManager";

interface StudentForm {
  id: string;
  rollNo: number;
  studentName: string;
  class: string;
  division: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  bloodGroup: string;
  address: string;
  submittedOn: string;
  status: "Pending" | "Approved" | "Rejected";
}

const mockForms: StudentForm[] = [
  {
    id: "1",
    rollNo: 15,
    studentName: "Aarav Sharma",
    class: "Class 3",
    division: "B",
    fatherName: "Mr. Rajesh Sharma",
    motherName: "Mrs. Priya Sharma",
    dateOfBirth: "2014-05-15",
    bloodGroup: "A+",
    address: "123 Main Street, Mumbai",
    submittedOn: "2024-11-05 10:30 AM",
    status: "Pending",
  },
  {
    id: "2",
    rollNo: 8,
    studentName: "Diya Patel",
    class: "Class 3",
    division: "B",
    fatherName: "Mr. Amit Patel",
    motherName: "Mrs. Neha Patel",
    dateOfBirth: "2014-06-20",
    bloodGroup: "B+",
    address: "456 Park Avenue, Mumbai",
    submittedOn: "2024-11-05 11:45 AM",
    status: "Approved",
  },
];

export function StudentForms() {
  const [forms, setForms] = useState<StudentForm[]>(mockForms);
  const [filterClass, setFilterClass] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedForm, setSelectedForm] = useState<StudentForm | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 🔵 Keep this state, but the button to set it is removed
  const [showDigitalForm, setShowDigitalForm] = useState(false);

  const handleApprove = (formId: string) => {
    setForms(forms.map((f) =>
      f.id === formId ? { ...f, status: "Approved" } : f
    ));
  };

  const handleReject = (formId: string) => {
    setForms(forms.map((f) =>
      f.id === formId ? { ...f, status: "Rejected" } : f
    ));
  };

  const filteredForms = forms.filter((form) => {
    if (filterClass !== "all" && form.division !== filterClass) return false;
    if (filterStatus !== "all" && form.status !== filterStatus) return false;
    return true;
  });

  const pendingCount = forms.filter((f) => f.status === "Pending").length;
  const approvedCount = forms.filter((f) => f.status === "Approved").length;

  // 🔵 Load Digital Form Page
  if (showDigitalForm) {
    return <DigitalFormPage onBack={() => setShowDigitalForm(false)} />;
  }

  return (
    <div className="p-4 md:p-8">

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-gray-900 text-2xl font-semibold">Student Forms</h1>
          <p className="text-gray-600 mt-1">
            Review and approve student information submitted by parents
          </p>
        </div>

        {/* --- 🛑 The "Digital Form" button has been removed from here 🛑 --- */}
        {/* <Button onClick={() => setShowDigitalForm(true)} className="mt-4 md:mt-0 !bg-gradient-to-r !from-[#8E2DE2] !to-[#4A00E0] text-white font-semibold px-4 py-2 rounded-md shadow hover:opacity-90 transition-all duration-200"> Digital Form </Button> */}
      </div>

      {/* Form Link Manager */}
      <div className="mb-6">
        <FormLinkManager />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Submissions</p>
            <p className="text-xl font-medium">{forms.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Pending Review</p>
            <p className="text-xl font-medium text-orange-600">{pendingCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-xl font-medium text-green-600">{approvedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm">Filters:</span>
            </div>

            <div className="flex gap-3 flex-1">
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Divisions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  <SelectItem value="A">Division A</SelectItem>
                  <SelectItem value="B">Division B</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Form Submissions ({filteredForms.length})</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No</TableHead>
                  <TableHead className="w-[160px]">Student Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead className="w-[160px]">Father Name</TableHead>
                  <TableHead className="w-[140px]">Submitted On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredForms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>{form.rollNo}</TableCell>
                    <TableCell className="w-[160px]">
                      <span className="block truncate" title={form.studentName}>
                        {form.studentName}
                      </span>
                    </TableCell>
                    <TableCell>{form.class}</TableCell>
                    <TableCell>{form.division}</TableCell>
                    <TableCell className="w-[160px]">
                      <span className="block truncate" title={form.fatherName}>
                        {form.fatherName}
                      </span>
                    </TableCell>
                    <TableCell className="w-[140px]">
                      <span className="block truncate text-sm" title={form.submittedOn}>
                        {form.submittedOn}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          form.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : form.status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {form.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                        <Eye
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedForm(form);
                            setIsDialogOpen(true);
                          }}
                        />

                        {form.status === "Pending" && (
                          <>
                            <CheckCircle
                              className="text-green-600 cursor-pointer"
                              onClick={() => handleApprove(form.id)}
                            />
                            <XCircle
                              className="text-red-600 cursor-pointer"
                              onClick={() => handleReject(form.id)}
                            />
                          </>
                        )}
                      </div>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>

            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              Full information about the selected student
            </DialogDescription>
          </DialogHeader>

          {selectedForm && (
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {selectedForm.studentName}</p>
              <p><strong>Class:</strong> {selectedForm.class}</p>
              <p><strong>Division:</strong> {selectedForm.division}</p>
              <p><strong>Father:</strong> {selectedForm.fatherName}</p>
              <p><strong>Mother:</strong> {selectedForm.motherName}</p>
              <p><strong>DOB:</strong> {selectedForm.dateOfBirth}</p>
              <p><strong>Address:</strong> {selectedForm.address}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}