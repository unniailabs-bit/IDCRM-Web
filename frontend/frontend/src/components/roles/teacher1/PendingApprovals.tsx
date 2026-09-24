import { useState, useEffect } from 'react';
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
import { CheckCircle, XCircle, Eye, Clock, AlertCircle } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';

interface PendingForm {
  id: number;
  rollNo: number;
  studentName: string;
  class: string;
  division: string;
  fatherName: string;
  motherName: string;
  submittedOn: string;
  daysWaiting: number;
  photo?: string;
  dob?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
  emergency_contact?: string;
  status?: string;
}

const mockPendingForms: PendingForm[] = [
  {
    id: '1',
    rollNo: 15,
    studentName: 'Aarav Sharma',
    class: 'Class 3',
    division: 'B',
    fatherName: 'Mr. Rajesh Sharma',
    motherName: 'Mrs. Priya Sharma',
    submittedOn: '2024-11-05 10:30 AM',
    daysWaiting: 3,
  },
  {
    id: '3',
    rollNo: 22,
    studentName: 'Arjun Kumar',
    class: 'Class 3',
    division: 'B',
    fatherName: 'Mr. Vikram Kumar',
    motherName: 'Mrs. Anjali Kumar',
    submittedOn: '2024-11-04 02:20 PM',
    daysWaiting: 4,
  },
  {
    id: '4',
    rollNo: 5,
    studentName: 'Ananya Singh',
    class: 'Class 4',
    division: 'A',
    fatherName: 'Mr. Rahul Singh',
    motherName: 'Mrs. Kavita Singh',
    submittedOn: '2024-11-06 09:15 AM',
    daysWaiting: 2,
  },
  {
    id: '5',
    rollNo: 18,
    studentName: 'Ishaan Mehta',
    class: 'Class 4',
    division: 'A',
    fatherName: 'Mr. Suresh Mehta',
    motherName: 'Mrs. Deepa Mehta',
    submittedOn: '2024-11-01 04:45 PM',
    daysWaiting: 7,
  },
];

export function PendingApprovals() {
  const [pendingForms, setPendingForms] = useState<PendingForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<PendingForm | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingForms();
  }, []);

  const fetchPendingForms = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/teacher/student-forms');

      if (response.data.success) {
        // Filter only pending/submitted forms and format them
        const pending = response.data.data
          .filter((form: any) => form.status === 'submitted' || form.status === 'pending')
          .map((form: any) => {
            const submittedDate = new Date(form.created_at);
            const today = new Date();
            const daysWaiting = Math.floor((today.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));

            return {
              id: form.id,
              rollNo: form.roll_number,
              studentName: `${form.first_name} ${form.last_name}`,
              class: form.class_name || 'N/A',
              division: form.division_name || 'N/A',
              fatherName: form.father_name || 'N/A',
              motherName: form.mother_name || 'N/A',
              submittedOn: new Date(form.created_at).toLocaleString(),
              daysWaiting,
              photo: form.photo,
              dob: form.dob,
              gender: form.gender,
              blood_group: form.blood_group,
              address: form.address,
              emergency_contact: form.emergency_contact,
              status: form.status
            };
          });

        setPendingForms(pending);
      }
    } catch (error: any) {
      console.error('Error fetching pending forms:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch pending forms');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (formId: number) => {
    try {
      const response = await axiosInstance.patch(`/api/teacher/student-forms/${formId}`, {
        status: 'approved'
      });

      if (response.data.success) {
        toast.success('Form approved successfully!');
        setPendingForms(pendingForms.filter((f) => f.id !== formId));
        setIsDetailDialogOpen(false);
      }
    } catch (error: any) {
      console.error('Error approving form:', error);
      toast.error(error.response?.data?.message || 'Failed to approve form');
    }
  };

  const handleReject = async (formId: number) => {
    try {
      const response = await axiosInstance.patch(`/api/teacher/student-forms/${formId}`, {
        status: 'rejected'
      });

      if (response.data.success) {
        toast.success('Form rejected. Parent will be notified.');
        setPendingForms(pendingForms.filter((f) => f.id !== formId));
        setIsDetailDialogOpen(false);
      }
    } catch (error: any) {
      console.error('Error rejecting form:', error);
      toast.error(error.response?.data?.message || 'Failed to reject form');
    }
  };

  const handleViewDetails = (form: PendingForm) => {
    setSelectedForm(form);
    setIsDetailDialogOpen(true);
  };

  const handleBulkApprove = async () => {
    if (!confirm(`Approve all ${pendingForms.length} pending forms?`)) {
      return;
    }

    try {
      const promises = pendingForms.map(form =>
        axiosInstance.patch(`/api/teacher/student-forms/${form.id}`, {
          status: 'approved'
        })
      );

      await Promise.all(promises);
      toast.success(`${pendingForms.length} forms approved successfully!`);
      setPendingForms([]);
    } catch (error: any) {
      console.error('Error bulk approving:', error);
      toast.error('Failed to approve all forms');
    }
  };

  const urgentCount = pendingForms.filter((f) => f.daysWaiting >= 5).length;

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading pending forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-gray-900">Pending Approvals</h1>
        <p className="text-gray-600 mt-1">Forms awaiting your review and approval</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Pending</p>
                <p className="text-orange-600">{pendingForms.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Urgent (5+ days)</p>
                <p className="text-red-600">{urgentCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Recent (0-2 days)</p>
                <p className="text-green-600">
                  {pendingForms.filter((f) => f.daysWaiting <= 2).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for Urgent Forms */}
      {urgentCount > 0 && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm">
                  <strong>Urgent Action Required:</strong> You have {urgentCount} form(s) waiting
                  for more than 5 days. Please review and approve/reject them to avoid delays in ID
                  card generation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {pendingForms.length > 0 && (
        <div className="flex justify-end mb-4">
          <Button className="gap-2" onClick={handleBulkApprove}>
            <CheckCircle className="w-4 h-4" />
            Approve All ({pendingForms.length})
          </Button>
        </div>
      )}

      {/* Pending Forms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Forms Awaiting Approval ({pendingForms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingForms.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Priority</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead className="w-[160px]">Student Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Division</TableHead>
                      <TableHead className="w-[160px]">Father Name</TableHead>
                      <TableHead className="w-[140px]">Submitted On</TableHead>
                      <TableHead>Waiting</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingForms.map((form) => (
                      <TableRow key={form.id}>
                        <TableCell>
                          {form.daysWaiting >= 5 ? (
                            <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                          ) : form.daysWaiting >= 3 ? (
                            <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">New</Badge>
                          )}
                        </TableCell>
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
                          <span className={form.daysWaiting >= 5 ? 'text-red-600' : ''}>
                            {form.daysWaiting} days
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(form)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="mb-1">All Caught Up!</h3>
              <p className="text-sm text-gray-600">No pending forms to review. Great job!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Student Form</DialogTitle>
            <DialogDescription>Carefully verify all information before approving</DialogDescription>
          </DialogHeader>
          {selectedForm && (
            <div className="space-y-4 py-4">
              {/* Waiting Alert */}
              {selectedForm.daysWaiting >= 5 && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-800">
                    ⚠️ This form has been waiting for {selectedForm.daysWaiting} days. Please take
                    action promptly.
                  </p>
                </div>
              )}

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
                    <span className="text-gray-600">Class:</span>
                    <p>{selectedForm.class}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Division:</span>
                    <p>{selectedForm.division}</p>
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
                    <span className="text-gray-600">Mother's Name:</span>
                    <p>{selectedForm.motherName}</p>
                  </div>
                </div>
              </div>

              {/* Submission Info */}
              <div>
                <h3 className="mb-3 pb-2 border-b">Submission Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Submitted On:</span>
                    <p>{selectedForm.submittedOn}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Waiting Time:</span>
                    <p className={selectedForm.daysWaiting >= 5 ? 'text-red-600' : ''}>
                      {selectedForm.daysWaiting} days
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2 text-red-600 border-red-300"
                  onClick={() => handleReject(selectedForm.id)}
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
                <Button className="flex-1 gap-2" onClick={() => handleApprove(selectedForm.id)}>
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
