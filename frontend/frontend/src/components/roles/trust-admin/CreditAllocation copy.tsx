import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { ArrowRight, Plus, History, AlertCircle } from 'lucide-react';

interface School {
  id: string;
  name: string;
  location: string;
  totalStudents: number;
  creditsAllocated: number;
  creditsUsed: number;
  creditsRemaining: number;
  lastAllocated: string;
}

interface AllocationHistory {
  id: string;
  schoolName: string;
  credits: number;
  allocatedBy: string;
  date: string;
  notes?: string;
}

const mockSchools: School[] = [
  {
    id: '1',
    name: 'Cambridge Primary School',
    location: 'Mumbai',
    totalStudents: 450,
    creditsAllocated: 2000,
    creditsUsed: 420,
    creditsRemaining: 1580,
    lastAllocated: '2024-10-15',
  },
  {
    id: '2',
    name: 'Cambridge High School',
    location: 'Mumbai',
    totalStudents: 650,
    creditsAllocated: 2500,
    creditsUsed: 580,
    creditsRemaining: 1920,
    lastAllocated: '2024-10-15',
  },
  {
    id: '3',
    name: 'Cambridge International',
    location: 'Pune',
    totalStudents: 380,
    creditsAllocated: 1500,
    creditsUsed: 350,
    creditsRemaining: 1150,
    lastAllocated: '2024-10-20',
  },
];

const mockHistory: AllocationHistory[] = [
  {
    id: '1',
    schoolName: 'Cambridge High School',
    credits: 2500,
    allocatedBy: 'Trust Admin',
    date: '2024-10-15',
    notes: 'Initial allocation for academic year 2024-25',
  },
  {
    id: '2',
    schoolName: 'Cambridge Primary School',
    credits: 2000,
    allocatedBy: 'Trust Admin',
    date: '2024-10-15',
    notes: 'Initial allocation for academic year 2024-25',
  },
  {
    id: '3',
    schoolName: 'Cambridge International',
    credits: 1500,
    allocatedBy: 'Trust Admin',
    date: '2024-10-20',
    notes: 'Top-up allocation',
  },
];

export function CreditAllocation() {
  const [schools, setSchools] = useState<School[]>(mockSchools);
  const [allocationHistory, setAllocationHistory] = useState<AllocationHistory[]>(mockHistory);
  const [isAllocateDialogOpen, setIsAllocateDialogOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [allocateAmount, setAllocateAmount] = useState<number>(0);
  const [allocationNotes, setAllocationNotes] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const trustCreditBalance = 4550; // Available credits at trust level
  const totalAllocated = schools.reduce((sum, school) => sum + school.creditsAllocated, 0);
  const totalUsed = schools.reduce((sum, school) => sum + school.creditsUsed, 0);
  const totalRemaining = schools.reduce((sum, school) => sum + school.creditsRemaining, 0);

  const handleAllocate = (school: School) => {
    setSelectedSchool(school);
    setAllocateAmount(0);
    setAllocationNotes('');
    setIsAllocateDialogOpen(true);
  };

  const confirmAllocation = () => {
    if (!selectedSchool || allocateAmount <= 0) return;

    if (allocateAmount > trustCreditBalance) {
      alert('Insufficient credits in trust wallet!');
      return;
    }

    // Update school credits
    setSchools(
      schools.map((school) =>
        school.id === selectedSchool.id
          ? {
              ...school,
              creditsAllocated: school.creditsAllocated + allocateAmount,
              creditsRemaining: school.creditsRemaining + allocateAmount,
              lastAllocated: new Date().toISOString().split('T')[0],
            }
          : school
      )
    );

    // Add to history
    const newHistory: AllocationHistory = {
      id: Date.now().toString(),
      schoolName: selectedSchool.name,
      credits: allocateAmount,
      allocatedBy: 'Trust Admin',
      date: new Date().toISOString().split('T')[0],
      notes: allocationNotes,
    };
    setAllocationHistory([newHistory, ...allocationHistory]);

    setIsAllocateDialogOpen(false);
    alert(`Successfully allocated ${allocateAmount} credits to ${selectedSchool.name}`);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-gray-900">Credit Allocation</h1>
        <p className="text-gray-600 mt-1">
          Distribute credits to schools under Cambridge Academy Trust
        </p>
      </div>

      {/* Trust Credit Overview */}
      <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Trust Credit Balance</p>
              <p className="text-green-600">{trustCreditBalance.toLocaleString()} Credits</p>
              <p className="text-xs text-gray-500 mt-1">Available to allocate</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Allocated</p>
              <p>{totalAllocated.toLocaleString()} Credits</p>
              <p className="text-xs text-gray-500 mt-1">To all schools</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Used</p>
              <p className="text-orange-600">{totalUsed.toLocaleString()} Credits</p>
              <p className="text-xs text-gray-500 mt-1">IDs printed</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Schools' Remaining</p>
              <p className="text-blue-600">{totalRemaining.toLocaleString()} Credits</p>
              <p className="text-xs text-gray-500 mt-1">Across all schools</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning if low balance */}
      {trustCreditBalance < 500 && (
        <Card className="mb-6 bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm">
                  <strong>Low Credit Balance:</strong> You have only {trustCreditBalance} credits
                  remaining. Consider purchasing more credits to ensure uninterrupted service.
                </p>
                <Button size="sm" className="mt-2" variant="outline">
                  Buy More Credits
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <Button variant="outline" className="gap-2" onClick={() => setShowHistory(!showHistory)}>
          <History className="w-4 h-4" />
          {showHistory ? 'View Schools' : 'View History'}
        </Button>
      </div>

      {!showHistory ? (
        /* Schools Table */
        <Card>
          <CardHeader>
            <CardTitle>Schools Under Trust</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Allocated</TableHead>
                      <TableHead>Used</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead>Last Allocated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map((school) => {
                      const utilization =
                        school.creditsAllocated > 0
                          ? ((school.creditsUsed / school.creditsAllocated) * 100).toFixed(1)
                          : '0.0';

                      return (
                        <TableRow key={school.id}>
                          <TableCell>
                            <div>
                              <p>{school.name}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{school.location}</TableCell>
                          <TableCell>{school.totalStudents}</TableCell>
                          <TableCell>{school.creditsAllocated.toLocaleString()}</TableCell>
                          <TableCell className="text-orange-600">
                            {school.creditsUsed.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-green-600">
                            {school.creditsRemaining.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    parseFloat(utilization) > 80
                                      ? 'bg-red-500'
                                      : parseFloat(utilization) > 50
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(parseFloat(utilization), 100)}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600">{utilization}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{school.lastAllocated}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              className="gap-2"
                              onClick={() => handleAllocate(school)}
                            >
                              <Plus className="w-4 h-4" />
                              Allocate
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Allocation History */
        <Card>
          <CardHeader>
            <CardTitle>Allocation History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allocationHistory.map((record) => (
                <div key={record.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p>
                          <strong>{record.schoolName}</strong>
                        </p>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <Badge className="bg-green-100 text-green-800">
                          +{record.credits.toLocaleString()} Credits
                        </Badge>
                      </div>
                      {record.notes && <p className="text-sm text-gray-600 mt-1">{record.notes}</p>}
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-gray-600">{record.date}</p>
                      <p className="text-xs text-gray-500 mt-1">by {record.allocatedBy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allocate Credits Dialog */}
      <Dialog open={isAllocateDialogOpen} onOpenChange={setIsAllocateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Allocate Credits to {selectedSchool?.name}</DialogTitle>
            <DialogDescription>
              Transfer credits from trust wallet to school account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Current Status */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Trust Available Credits:</span>
                <span className="text-green-600">{trustCreditBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">School Current Balance:</span>
                <span>{selectedSchool?.creditsRemaining.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Students:</span>
                <span>{selectedSchool?.totalStudents}</span>
              </div>
            </div>

            {/* Allocation Amount */}
            <div className="space-y-2">
              <Label htmlFor="allocate-amount">Credits to Allocate</Label>
              <Input
                id="allocate-amount"
                type="number"
                min="1"
                max={trustCreditBalance}
                value={allocateAmount || ''}
                onChange={(e) => setAllocateAmount(parseInt(e.target.value) || 0)}
                placeholder="Enter amount"
              />
              <p className="text-xs text-gray-600">
                Maximum: {trustCreditBalance.toLocaleString()} credits
              </p>
            </div>

            {/* Quick Select */}
            <div className="space-y-2">
              <Label>Quick Select</Label>
              <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" size="sm" onClick={() => setAllocateAmount(100)}>
                  100
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAllocateAmount(500)}>
                  500
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAllocateAmount(1000)}>
                  1,000
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAllocateAmount(selectedSchool?.totalStudents || 0)}
                >
                  {selectedSchool?.totalStudents}
                </Button>
              </div>
            </div>

            {/* Preview */}
            {allocateAmount > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <p className="text-sm">After allocation:</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Trust Balance:</span>
                  <span className="text-green-600">
                    {(trustCreditBalance - allocateAmount).toLocaleString()} credits
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">School Balance:</span>
                  <span className="text-blue-600">
                    {((selectedSchool?.creditsRemaining || 0) + allocateAmount).toLocaleString()}{' '}
                    credits
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="allocation-notes">Notes (Optional)</Label>
              <textarea
                id="allocation-notes"
                className="w-full h-20 rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Reason for allocation, academic year, etc."
                value={allocationNotes}
                onChange={(e) => setAllocationNotes(e.target.value)}
              />
            </div>

            {/* Warning */}
            {allocateAmount > trustCreditBalance && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">
                  Insufficient credits! You only have {trustCreditBalance} credits available.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsAllocateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={confirmAllocation}
                disabled={allocateAmount <= 0 || allocateAmount > trustCreditBalance}
              >
                Allocate {allocateAmount > 0 ? allocateAmount.toLocaleString() : ''} Credits
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
