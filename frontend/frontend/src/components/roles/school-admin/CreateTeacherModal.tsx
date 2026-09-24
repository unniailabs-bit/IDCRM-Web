import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { teachersApi } from '@/api/teachers';
import { subjectsApi, Subject } from '@/api/subjects';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Save, XCircle } from 'lucide-react'; // Import Eye and EyeOff icons

interface CreateTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeacherCreated: () => void;
}

export function CreateTeacherModal({
  isOpen,
  onClose,
  onTeacherCreated,
}: CreateTeacherModalProps) {
  const { userData } = useAuth();
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    status: 'Active' as 'Active' | 'Inactive',
    password: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  // Subjects
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showCustomSubjectInput, setShowCustomSubjectInput] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');

  const schoolId = userData?.id;

  // Load subjects
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const response = await subjectsApi.getAllSubjects();
        if (response.success && response.data) {
          setSubjects(response.data);
        }
      } catch (error) {
        console.error('Error loading subjects:', error);
      }
    };
    loadSubjects();
  }, []);

  // Handle subject selection
  const handleSubjectChange = (value: string) => {
    if (value === '__add_new__') {
      setShowCustomSubjectInput(true);
      setNewTeacher({ ...newTeacher, subject: '' });
    } else {
      setNewTeacher({ ...newTeacher, subject: value });
      setShowCustomSubjectInput(false);
      setCustomSubjectName('');
    }
  };

  const handleCustomSubjectSubmit = async () => {
    if (!customSubjectName.trim()) {
      alert('Please enter a subject name');
      return;
    }

    // Check if subject already exists in local list
    if (subjects.find(s => s.name.toLowerCase() === customSubjectName.trim().toLowerCase())) {
      setNewTeacher({ ...newTeacher, subject: customSubjectName.trim() });
      setShowCustomSubjectInput(false);
      setCustomSubjectName('');
      return;
    }

    try {
      const response = await subjectsApi.createSubject({ name: customSubjectName.trim() });
      if (response.success && response.data) {
        setSubjects([...subjects, response.data]);
        setNewTeacher({ ...newTeacher, subject: response.data.name });
        setShowCustomSubjectInput(false);
        setCustomSubjectName('');
        alert('Subject added successfully');
      }
    } catch (error: any) {
      console.error('Error creating subject:', error);
      alert(error.response?.data?.message || 'Failed to create subject');
    }
  };

  const handleAddTeacher = async () => {
    setIsSaving(true);
    try {
      if (!schoolId) {
        alert('School ID not available.');
        setIsSaving(false);
        return;
      }
      const response = await teachersApi.create(schoolId, newTeacher);
      if (response.success) {
        setNewTeacher({
          name: '',
          email: '',
          phone: '',
          subject: '',
          status: 'Active',
          password: '',
        });
        setShowCustomSubjectInput(false);
        setCustomSubjectName('');
        alert('Teacher added successfully!');
        onTeacherCreated();
        onClose();
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
      alert('Failed to add teacher. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Teacher</DialogTitle>
          <DialogDescription>
            Enter the details of the new teacher to add them to the system.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="teacherName" className="text-right">
              Name
            </Label>
            <Input
              id="teacherName"
              value={newTeacher.name}
              onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
              className="col-span-3"
              placeholder="Full Name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="teacherEmail" className="text-right">
              Email
            </Label>
            <Input
              id="teacherEmail"
              type="email"
              value={newTeacher.email}
              onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
              className="col-span-3"
              placeholder="email@school.edu"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="teacherPhone" className="text-right">
              Phone
            </Label>
            <Input
              id="teacherPhone"
              value={newTeacher.phone}
              onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
              className="col-span-3"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="teacherSubject" className="text-right">
              Subject
            </Label>
            {!showCustomSubjectInput ? (
              <Select
                value={newTeacher.subject}
                onValueChange={handleSubjectChange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select subject or add new" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.name}>
                      {subject.name}
                    </SelectItem>
                  ))}
                  <SelectItem
                    value="__add_new__"
                    className="font-semibold text-blue-600"
                  >
                    + Add New Subject
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="col-span-3 flex gap-2">
                <Input
                  placeholder="Enter new subject name"
                  value={customSubjectName}
                  onChange={(e) => setCustomSubjectName(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomSubjectSubmit()}
                  autoFocus
                />
                <Button onClick={handleCustomSubjectSubmit} size="sm">
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCustomSubjectInput(false);
                    setCustomSubjectName('');
                  }}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="teacherStatus" className="text-right">
              Status
            </Label>
            <Select
              value={newTeacher.status}
              onValueChange={(value) =>
                setNewTeacher({ ...newTeacher, status: value as 'Active' | 'Inactive' })
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue>{newTeacher.status}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="teacherPassword" className="text-right">
              Password
            </Label>
            <div className="relative col-span-3">
              <Input
                id="teacherPassword"
                type={showPassword ? 'text' : 'password'}
                value={newTeacher.password}
                onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                className="w-full pr-10"
                placeholder="Enter password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
              </Button>
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAddTeacher} disabled={isSaving}>
            {isSaving ? 'Adding...' : 'Add Teacher'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
