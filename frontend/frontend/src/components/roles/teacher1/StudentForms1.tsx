import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { Eye, CheckCircle, XCircle, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface StudentForm {
  id: string;
  rollNo: number;
  studentName: string;
  class: string;
  division: string;
  dateOfBirth: string;
  bloodGroup: string;
  fatherName: string;
  fatherPhone: string;
  motherName: string;
  motherPhone: string;
  address: string;
  emergencyContact: string;
  submittedOn: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

const mockForms: StudentForm[] = [
  {
    id: '1',
    rollNo: 15,
    studentName: 'Aarav Sharma',
    class: 'Class 3',
    division: 'B',
    dateOfBirth: '2014-05-15',
    bloodGroup: 'A+',
    fatherName: 'Mr. Rajesh Sharma',
    fatherPhone: '+91 98765 43210',
    motherName: 'Mrs. Priya Sharma',
    motherPhone: '+91 98765 43211',
    address: '123 Main Street, Andheri West, Mumbai - 400058',
    emergencyContact: '+91 98765 43212',
    submittedOn: '2024-11-05 10:30 AM',
    status: 'Pending',
  },
  {
    id: '2',
    rollNo: 8,
    studentName: 'Diya Patel',
    class: 'Class 3',
    division: 'B',
    dateOfBirth: '2014-06-20',
    bloodGroup: 'B+',
    fatherName: 'Mr. Amit Patel',
    fatherPhone: '+91 98765 43220',
    motherName: 'Mrs. Neha Patel',
    motherPhone: '+91 98765 43221',
    address: '456 Park Avenue, Bandra East, Mumbai - 400051',
    emergencyContact: '+91 98765 43222',
    submittedOn: '2024-11-05 11:45 AM',
    status: 'Approved',
  },
  {
    id: '3',
    rollNo: 22,
    studentName: 'Arjun Kumar',
    class: 'Class 3',
    division: 'B',
    dateOfBirth: '2014-03-10',
    bloodGroup: 'O+',
    fatherName: 'Mr. Vikram Kumar',
    fatherPhone: '+91 98765 43230',
    motherName: 'Mrs. Anjali Kumar',
    motherPhone: '+91 98765 43231',
    address: '789 Garden Road, Powai, Mumbai - 400076',
    emergencyContact: '+91 98765 43232',
    submittedOn: '2024-11-04 02:20 PM',
    status: 'Pending',
  },
];

export function StudentForms() {
  const [forms, setForms] = useState<StudentForm[]>(mockForms);
  const [selectedForm, setSelectedForm] = useState<StudentForm | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const handleViewDetails = (form: StudentForm) => {
    setSelectedForm(form);
    setIsDetailDialogOpen(true);
  };

  const handleApprove = (formId: string) => {
    setForms(forms.map((f) => (f.id === formId ? { ...f, status: 'Approved' as const } : f)));
    if (selectedForm?.id === formId) {
      setSelectedForm({ ...selectedForm, status: 'Approved' });
    }
  };

  const handleReject = (formId: string) => {
    setForms(forms.map((f) => (f.id === formId ? { ...f, status: 'Rejected' as const } : f)));
    if (selectedForm?.id === formId) {
      setSelectedForm({ ...selectedForm, status: 'Rejected' });
    }
  };

  const filteredForms = forms.filter((form) => {
    if (filterClass !== 'all' && form.division !== filterClass) return false;
    if (filterStatus !== 'all' && form.status !== filterStatus) return false;
    return true;
  });

  const pendingCount = forms.filter((f) => f.status === 'Pending').length;
  const approvedCount = forms.filter((f) => f.status === 'Approved').length;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-gray-900">Student Forms</h1>
        <p className="text-gray-600 mt-1">
          Review and approve student information submitted by parents
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Submissions</p>
                <p className="text-gray-900">{forms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Review</p>
                <p className="text-orange-600">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Approved</p>
                <p className="text-green-600">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm">Filters:</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  <SelectItem value="A">Division A</SelectItem>
                  <SelectItem value="B">Division B</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
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

      {/* Forms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Form Submissions ({filteredForms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
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
                        <span className="block truncate text-sm" title={form.fatherName}>
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
                            form.status === 'Approved'
                              ? 'bg-green-100 text-green-800'
                              : form.status === 'Rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {form.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(form)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {form.status === 'Pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600"
                                onClick={() => handleApprove(form.id)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={() => handleReject(form.id)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Form Details</DialogTitle>
            <DialogDescription>Complete information submitted by parent</DialogDescription>
          </DialogHeader>
          {selectedForm && (
            <div className="space-y-4 py-4">
              {/* Student Information */}
              <div>
                <h3 className="mb-3 pb-2 border-b">Student Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Roll Number:</span>
                    <p>{selectedForm.rollNo}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Student Name:</span>
                    <p>{selectedForm.studentName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date of Birth:</span>
                    <p>{selectedForm.dateOfBirth}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Blood Group:</span>
                    <p>{selectedForm.bloodGroup}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Address:</span>
                    <p>{selectedForm.address}</p>
                  </div>
                </div>
              </div>

              {/* Parent Information */}
              <div>
                <h3 className="mb-3 pb-2 border-b">Parent Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Father's Name:</span>
                    <p>{selectedForm.fatherName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Father's Phone:</span>
                    <p>{selectedForm.fatherPhone}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Mother's Name:</span>
                    <p>{selectedForm.motherName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Mother's Phone:</span>
                    <p>{selectedForm.motherPhone}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Emergency Contact:</span>
                    <p>{selectedForm.emergencyContact}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-600">Current Status:</span>
                    <Badge
                      className={`ml-2 ${
                        selectedForm.status === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : selectedForm.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {selectedForm.status}
                    </Badge>
                  </div>
                  {selectedForm.status === 'Pending' && (
                    <div className="flex gap-2">
                      <Button
                        className="gap-2"
                        onClick={() => {
                          handleApprove(selectedForm.id);
                          setIsDetailDialogOpen(false);
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 text-red-600"
                        onClick={() => {
                          handleReject(selectedForm.id);
                          setIsDetailDialogOpen(false);
                        }}
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
