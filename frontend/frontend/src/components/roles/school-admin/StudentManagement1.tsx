import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Search, Eye, CheckCircle, XCircle, Clock, Plus, Loader2 } from 'lucide-react';
import { studentService } from '@/api/studentService';
import { classService } from '@/api/classService';
import { useAuth } from '@/hooks/useAuth';

interface Student {
  id: number;
  school_id: number;
  class_id: number;
  division_id: number;
  name: string;
  roll_number: string;
  formStatus?: 'Completed' | 'Pending' | 'Rejected';
  submittedOn?: string;
  class_name?: string;
  division_name?: string;
}

interface ClassItem {
  id: number;
  class_name: string;
}

interface DivisionItem {
  id: number;
  division_name: string;
}

export function StudentManagement() {
  const { userData } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [divisions, setDivisions] = useState<DivisionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    class: '',
    division: '',
    rollNo: '',
    parentPhone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch students & classes from API
 useEffect(() => {
  const fetchStudents = async () => {
    if (!userData?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      const studentRes = await studentService.getStudentsBySchool(userData.id);
      // console.log("Students:", studentRes);

      if (studentRes.success && Array.isArray(studentRes.data)) {
        setStudents(studentRes.data);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Error fetching students.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    if (!userData?.id) return;
    try {
      const classRes = await classService.getClassesBySchool(userData.id);
      // console.log("Classes:", classRes);

      if (classRes.success && Array.isArray(classRes.data)) {
        setClasses(classRes.data);
      } else {
        setClasses([]);
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
      setError("Error fetching classes.");
    }
  };

  fetchStudents();
  fetchClasses();
}, [userData]);


  // ✅ Fetch divisions based on selected class
  useEffect(() => {
    const fetchDivisions = async () => {
      if (!newStudent.class) return;
      try {
        const selectedClass = classes.find(c => c.id === Number(newStudent.class));
        if (selectedClass) {
          const res = await studentService.getDivisionsByClass(selectedClass.class_name);
          if (res.success && Array.isArray(res.data)) {
            const uniqueDivisions = Array.from(new Map(res.data.map((div: DivisionItem) => [div.division_name, div])).values());
            setDivisions(uniqueDivisions);
          } else {
            setDivisions([]);
          }
        }
      } catch (err) {
        console.error('Error fetching divisions:', err);
        setDivisions([]);
      }
    };
    fetchDivisions();
  }, [newStudent.class, classes]);

  // ✅ Add student handler (real API)
  const handleAddStudent = async () => {
    if (!userData?.id) {
      alert('User not authenticated.');
      return;
    }

    if (!newStudent.name || !newStudent.rollNo || !newStudent.class || !newStudent.division) {
      alert('Please fill all fields.');
      return;
    }

    setIsLoading(true);
    try {
      const selectedClass = classes.find(c => c.id === Number(newStudent.class));
      const selectedDivision = divisions.find(d => d.id === Number(newStudent.division));

      if (selectedClass && selectedDivision) {
        const payload = {
          name: newStudent.name,
          roll_number: newStudent.rollNo,
          parent_phone: newStudent.parentPhone,
          class_name: selectedClass.class_name,
          division_name: selectedDivision.division_name,
        };

        console.log('Student Payload:', payload);
        const response = await studentService.addStudent(payload);
        console.log('Add Student Response:', response);

        if (response.success) {
          alert(response.message || 'Student added successfully!');
          setStudents((prev) => [...prev, response.data]);
          setIsAddDialogOpen(false);
          setNewStudent({ name: '', class: '', division: '', rollNo: '', parentPhone: '' });
        } else {
          alert('Failed to add student.');
        }
      }
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Error adding student. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFormStatusIcon = (status: Student['formStatus']) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getFormStatusBadge = (status: Student['formStatus']) => {
    const variants = {
      Completed: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Rejected: 'bg-red-100 text-red-800',
    };
    return variants[status || 'Pending'];
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-gray-900">Student Management</h1>
        <p className="text-gray-600 mt-1">View and manage all students</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Search Student</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Name or Roll No."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Class</label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.class_name}>
                      {cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Form Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-600 opacity-0">Action</label>
              <Button className="w-full">Apply Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Student Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Enter the details of the new student to add them to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Student Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className="col-span-3"
              />
            </div>

            {/* Class Dropdown */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label>Class</Label>
              <Select
                value={newStudent.class}
                onValueChange={(value) => setNewStudent({ ...newStudent, class: value, division: '' })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={String(cls.id)}>
                      {cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Division Dropdown */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label>Division</Label>
              <Select
                value={newStudent.division}
                onValueChange={(value) => setNewStudent({ ...newStudent, division: value })}
                disabled={!newStudent.class}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((div) => (
                    <SelectItem key={div.id} value={String(div.id)}>
                      {div.division_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Roll Number */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rollNo">Roll No.</Label>
              <Input
                id="rollNo"
                value={newStudent.rollNo}
                onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value })}
                className="col-span-3"
              />
            </div>

            {/* Parent Phone */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="parentPhone">Parent Phone</Label>
              <Input
                id="parentPhone"
                value={newStudent.parentPhone}
                onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>

          <DialogHeader>
            <Button type="submit" onClick={handleAddStudent} className="w-full">
              Add Student
            </Button>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>All Students</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead>Form Status</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">
                        No students found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.roll_number}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.class_name || '-'}</TableCell>
                        <TableCell>{student.division_name || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getFormStatusIcon(student.formStatus || 'Pending')}
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${getFormStatusBadge(
                                student.formStatus || 'Pending'
                              )}`}
                            >
                              {student.formStatus || 'Pending'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{student.submittedOn || '-'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
