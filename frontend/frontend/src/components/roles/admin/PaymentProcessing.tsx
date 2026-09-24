import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { CreditCard, Upload, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Payment {
  id: string;
  invoiceNumber: string;
  method: 'RAZORPAY' | 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';
  amount: number;
  txnRef?: string;
  status: 'PENDING' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
  paidAt?: string;
  proofUrl?: string;
  notes?: string;
}

const mockPendingPayments: Payment[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-004',
    method: 'BANK_TRANSFER',
    amount: 5250,
    txnRef: 'UTR12345678901',
    status: 'PENDING',
    proofUrl: '/receipts/bank-transfer-001.pdf',
    notes: 'Transferred via NEFT on 05-Nov-2024',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-005',
    method: 'CHEQUE',
    amount: 8500,
    txnRef: 'CHQ789456',
    status: 'PENDING',
    notes: 'Cheque deposit pending clearance',
  },
];

export function PaymentProcessing() {
  const [pendingPayments, setPendingPayments] = useState<Payment[]>(mockPendingPayments);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isRequestCreditDialogOpen, setIsRequestCreditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [creditMessage, setCreditMessage] = useState('');
  const [isRequestSent, setIsRequestSent] = useState(false);

  const approvePayment = (paymentId: string) => {
    setPendingPayments((payments) =>
      payments.map((p) =>
        p.id === paymentId
          ? { ...p, status: 'CAPTURED' as const, paidAt: new Date().toISOString() }
          : p
      )
    );
  };

  const rejectPayment = (paymentId: string) => {
    setPendingPayments((payments) => payments.filter((p) => p.id !== paymentId));
  };

  const handleSendCreditRequest = () => {
    if (creditAmount <= 0) {
      toast.error('Please enter a valid credit amount.');
      return;
    }
    
    // TODO: API call to send credit request
    // console.log('Credit Request Sent:', { creditAmount, message: creditMessage });
    toast.success('Credit request sent successfully!');
    setIsRequestSent(true);
    
    // Reset form after a delay
    setTimeout(() => {
      setIsRequestSent(false);
      setCreditAmount(0);
      setCreditMessage('');
      setIsRequestCreditDialogOpen(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pending Offline Payments</span>
            <Badge className="bg-orange-100 text-orange-800">
              {pendingPayments.filter((p) => p.status === 'PENDING').length} Pending
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingPayments
              .filter((p) => p.status === 'PENDING')
              .map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm">
                        Invoice: <strong>{payment.invoiceNumber}</strong>
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Method: <Badge variant="outline">{payment.method}</Badge>
                      </p>
                    </div>
                    <div className="text-right">
                      <p>₹{payment.amount.toLocaleString()}</p>
                      <Badge className="mt-1 bg-yellow-100 text-yellow-800">{payment.status}</Badge>
                    </div>
                  </div>

                  {payment.txnRef && (
                    <p className="text-sm text-gray-600">
                      Reference:{' '}
                      <code className="bg-gray-100 px-2 py-1 rounded">{payment.txnRef}</code>
                    </p>
                  )}

                  {payment.notes && (
                    <p className="text-sm text-gray-600 mt-2">Notes: {payment.notes}</p>
                  )}

                  {payment.proofUrl && (
                    <div className="mt-3">
                      <Button variant="outline" size="sm">
                        View Proof Document
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button size="sm" className="flex-1" onClick={() => approvePayment(payment.id)}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve & Apply Credits
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-600"
                      onClick={() => rejectPayment(payment.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}

            {pendingPayments.filter((p) => p.status === 'PENDING').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No pending payments to review</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2">Record Offline Payment</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Manually record cash, bank transfer, or cheque payments
                </p>
                <Button onClick={() => setIsRecordDialogOpen(true)}>Record Payment</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2">Request Credits</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Request additional credits from platform admin
                </p>
                <Button onClick={() => setIsRequestCreditDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Request Credits
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Record Offline Payment Dialog */}
      <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Offline Payment</DialogTitle>
            <DialogDescription>
              Record payments received via cash, bank transfer, or cheque
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-select">Select Invoice</Label>
              <select
                id="invoice-select"
                className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm"
                value={selectedInvoice}
                onChange={(e) => setSelectedInvoice(e.target.value)}
              >
                <option value="">Choose invoice...</option>
                <option value="INV-2024-001">INV-2024-001 - Cambridge Trust (₹8,500)</option>
                <option value="INV-2024-003">INV-2024-003 - Oxford Trust (₹4,881)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <select
                  id="payment-method"
                  className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="DD">Demand Draft</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input id="amount" type="number" placeholder="8500" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="txn-ref">Transaction Reference / Cheque No.</Label>
              <Input id="txn-ref" placeholder="e.g., UTR123456 or CHQ789456" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-date">Payment Date</Label>
              <Input
                id="payment-date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof-upload">Upload Proof (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Click to upload receipt or proof of payment</p>
                <input type="file" className="hidden" id="proof-upload" />
                <Button variant="outline" size="sm" className="mt-2">
                  Choose File
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                className="w-full h-20 rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Additional payment details..."
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This payment will be marked as PENDING until you approve it.
                Credits will be allocated automatically upon approval.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsRecordDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsRecordDialogOpen(false)}>Submit for Review</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Credits Dialog */}
      <Dialog open={isRequestCreditDialogOpen} onOpenChange={setIsRequestCreditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Credits</DialogTitle>
            <DialogDescription>
              Submit a request to add credits to your account
            </DialogDescription>
          </DialogHeader>
          {isRequestSent ? (
            <div className="flex flex-col items-center justify-center py-8 bg-green-50 rounded-lg">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800">Request Sent Successfully!</h3>
              <p className="text-gray-600 mt-2">The platform admin has been notified.</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="credit-amount">Credit Amount *</Label>
                <Input
                  id="credit-amount"
                  type="number"
                  min="1"
                  value={creditAmount || ''}
                  onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 5000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credit-message">Message (Optional)</Label>
                <Textarea
                  id="credit-message"
                  value={creditMessage}
                  onChange={(e) => setCreditMessage(e.target.value)}
                  placeholder="Include any relevant details for your request..."
                  rows={4}
                />
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your request will be sent to the platform administrator for approval.
                  You will be notified once the credits have been added to your account.
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            {!isRequestSent && (
              <>
                <Button variant="outline" onClick={() => setIsRequestCreditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendCreditRequest}
                  disabled={creditAmount <= 0}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Submit Request
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
