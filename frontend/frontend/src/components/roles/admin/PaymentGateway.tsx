import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { CreditCard, CheckCircle, XCircle, Clock, DollarSign, Eye, EyeOff } from 'lucide-react';

interface Payment {
  id: string;
  invoiceNo: string;
  trustName: string;
  amount: number;
  method: 'Razorpay' | 'Cash' | 'Bank Transfer' | 'Cheque';
  status: 'Success' | 'Pending' | 'Failed';
  date: string;
  transactionId?: string;
}

const mockPayments: Payment[] = [
  {
    id: '1',
    invoiceNo: 'INV-2024-001',
    trustName: 'Cambridge Academy Trust',
    amount: 8500,
    method: 'Razorpay',
    status: 'Success',
    date: '2024-11-06 10:30 AM',
    transactionId: 'pay_MxJ8K9YzLpQ2eR',
  },
  {
    id: '2',
    invoiceNo: 'INV-2024-002',
    trustName: 'Oxford Schools Trust',
    amount: 6200,
    method: 'Bank Transfer',
    status: 'Pending',
    date: '2024-11-05 02:15 PM',
  },
  {
    id: '3',
    invoiceNo: 'INV-2024-003',
    trustName: 'London Education Trust',
    amount: 11500,
    method: 'Razorpay',
    status: 'Success',
    date: '2024-11-04 11:45 AM',
    transactionId: 'pay_NyK9L0ZaQpR3fS',
  },
];

export function PaymentGateway() {
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [isSandboxMode, setIsSandboxMode] = useState(true);
  const [showKeySecret, setShowKeySecret] = useState(false);

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'Success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: Payment['status']) => {
    const variants = {
      Success: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Failed: 'bg-red-100 text-red-800',
    };
    return variants[status];
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-gray-900">Payment Gateway</h1>
        <p className="text-gray-600 mt-1">Manage online and offline payment processing</p>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Collected</p>
                <p className="mt-2">₹26,200</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Online Payments</p>
                <p className="mt-2">₹20,000</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="mt-2">₹6,200</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="mt-2">98.5%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="configuration" className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="configuration">Razorpay Config</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="offline">Offline Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Razorpay Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm">Environment Mode</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {isSandboxMode ? 'Sandbox (Test Mode)' : 'Production (Live)'}
                  </p>
                </div>
                <Switch checked={isSandboxMode} onCheckedChange={setIsSandboxMode} />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="key-id">Razorpay Key ID</Label>
                  <Input
                    id="key-id"
                    placeholder="rzp_test_xxxxxxxxxxxx"
                    defaultValue={isSandboxMode ? 'rzp_test_1A2B3C4D5E6F7G' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key-secret">Razorpay Key Secret</Label>
                  <div className="relative">
                    <Input
                      id="key-secret"
                      type={showKeySecret ? 'text' : 'password'}
                      placeholder="••••••••••••••••"
                      defaultValue={isSandboxMode ? '••••••••••••••••' : ''}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeySecret(!showKeySecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showKeySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook">Webhook URL</Label>
                  <Input
                    id="webhook"
                    placeholder="https://yourplatform.com/api/razorpay/webhook"
                    defaultValue="https://crm-admin.vercel.app/api/razorpay/webhook"
                  />
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Use sandbox credentials for testing. Switch to production
                  mode and add live credentials before going live.
                </p>
              </div>

              <div className="flex gap-3">
                <Button>Save Configuration</Button>
                <Button variant="outline">Test Connection</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice No.</TableHead>
                        <TableHead>Trust Name</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.invoiceNo}</TableCell>
                          <TableCell>{payment.trustName}</TableCell>
                          <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                          <TableCell>{payment.method}</TableCell>
                          <TableCell className="text-xs text-gray-600">
                            {payment.transactionId || '-'}
                          </TableCell>
                          <TableCell className="text-sm">{payment.date}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(payment.status)}
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${getStatusBadge(
                                  payment.status
                                )}`}
                              >
                                {payment.status}
                              </span>
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
        </TabsContent>

        <TabsContent value="offline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Record Offline Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="offline-invoice">Invoice Number</Label>
                  <Input id="offline-invoice" placeholder="INV-2024-XXX" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offline-amount">Amount (₹)</Label>
                  <Input id="offline-amount" type="number" placeholder="5000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <select
                  id="payment-method"
                  className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm"
                >
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                  <option>Demand Draft</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Receipt/Reference Number</Label>
                <Input id="reference" placeholder="e.g., CHQ123456 or UTR78901" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input id="notes" placeholder="Additional payment details" />
              </div>
              <Button>Record Payment</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
