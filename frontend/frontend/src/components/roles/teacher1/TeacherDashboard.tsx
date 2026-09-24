import { MetricCard } from '../../common/MetricCard';
import { Users, FormInput, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

const myClasses = [
  { id: '1', name: 'Class 3-B', students: 42, formsReceived: 38, approved: 35, pending: 3 },
  { id: '2', name: 'Class 4-A', students: 45, formsReceived: 40, approved: 38, pending: 2 },
];

const pendingApprovals = [
  {
    id: '1',
    studentName: 'Aarav Sharma',
    class: 'Class 3-B',
    submittedOn: '2024-11-06 10:30 AM',
    completionStatus: 'All sections filled',
  },
  {
    id: '2',
    studentName: 'Diya Patel',
    class: 'Class 3-B',
    submittedOn: '2024-11-06 11:45 AM',
    completionStatus: 'All sections filled',
  },
  {
    id: '3',
    studentName: 'Rohan Singh',
    class: 'Class 4-A',
    submittedOn: '2024-11-05 02:20 PM',
    completionStatus: 'Parent photo missing',
  },
];

export function TeacherDashboard() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome, Mrs. Sharma</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <MetricCard title="My Classes" value="2" icon={Users} trend="87 total students" />
        <MetricCard
          title="Forms Received"
          value="78"
          icon={FormInput}
          trend="Out of 87 sent"
          trendUp={true}
        />
        <MetricCard
          title="Approved Forms"
          value="73"
          icon={CheckCircle}
          trend="93.6% approval rate"
          trendUp={true}
        />
        <MetricCard title="Pending Approvals" value="5" icon={Clock} trend="Needs your review" />
      </div>

      {/* My Classes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>My Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myClasses.map((classItem) => (
              <div key={classItem.id} className="p-4 border rounded-lg">
                <h3 className="mb-3">{classItem.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Students:</span>
                    <span>{classItem.students}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Forms Received:</span>
                    <span className="text-green-600">{classItem.formsReceived}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approved:</span>
                    <span>{classItem.approved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending:</span>
                    <Badge className="bg-orange-100 text-orange-800">{classItem.pending}</Badge>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="w-[140px]">Submitted On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="w-[160px]">
                        <span className="block truncate" title={item.studentName}>
                          {item.studentName}
                        </span>
                      </TableCell>
                      <TableCell>{item.class}</TableCell>
                      <TableCell className="w-[140px]">
                        <span className="block truncate text-sm" title={item.submittedOn}>
                          {item.submittedOn}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.completionStatus === 'All sections filled'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {item.completionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Review
                          </Button>
                          <Button size="sm">Approve</Button>
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
    </div>
  );
}
