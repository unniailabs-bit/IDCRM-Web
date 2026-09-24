import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Users, GraduationCap, FileText } from 'lucide-react';

interface ClassInfo {
  id: string;
  class: string;
  division: string;
  subject: string;
  totalStudents: number;
  formsSubmitted: number;
  formsPending: number;
}

const mockClasses: ClassInfo[] = [
  {
    id: '1',
    class: 'Class 3',
    division: 'B',
    subject: 'All Subjects',
    totalStudents: 42,
    formsSubmitted: 42,
    formsPending: 0,
  },
  {
    id: '2',
    class: 'Class 4',
    division: 'A',
    subject: 'Mathematics',
    totalStudents: 38,
    formsSubmitted: 35,
    formsPending: 3,
  },
];

export function MyClasses() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-gray-900">My Classes</h1>
        <p className="text-gray-600 mt-1">Classes assigned to you - Mrs. Priya Sharma</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Classes</p>
                <p className="text-gray-900">{mockClasses.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-gray-900">
                  {mockClasses.reduce((sum, cls) => sum + cls.totalStudents, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Forms</p>
                <p className="text-gray-900">
                  {mockClasses.reduce((sum, cls) => sum + cls.formsPending, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockClasses.map((classInfo) => (
          <Card key={classInfo.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {classInfo.class} - Division {classInfo.division}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{classInfo.subject}</p>
                </div>
                {classInfo.formsPending > 0 && (
                  <Badge className="bg-orange-100 text-orange-800">
                    {classInfo.formsPending} Pending
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Students:</span>
                  <span>{classInfo.totalStudents}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Forms Submitted:</span>
                  <span className="text-green-600">{classInfo.formsSubmitted}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Pending Review:</span>
                  <span className="text-orange-600">{classInfo.formsPending}</span>
                </div>

                {/* Progress Bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Submission Progress</span>
                    <span>
                      {((classInfo.formsSubmitted / classInfo.totalStudents) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 transition-all"
                      style={{
                        width: `${(classInfo.formsSubmitted / classInfo.totalStudents) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
