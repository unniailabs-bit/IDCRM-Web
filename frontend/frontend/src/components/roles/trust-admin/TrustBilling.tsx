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
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { CreditCard, Download, Eye, Clock, AlertCircle, CheckCircle, Upload } from 'lucide-react';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface Invoice {
  id: string;
  number: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  paid: number;
  balance: number;
  status: 'SENT' | 'OVERDUE' | 'PAID' | 'CLOSED';
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    number: 'INV-2024-001',
    issueDate: '2024-11-01',
    dueDate: '2024-11-30',
    amount: 8500,
    paid: 0,
    balance: 8500,
    status: 'SENT',
  },
  {
    id: '2',
    number: 'INV-2024-003',
    issueDate: '2024-10-28',
    dueDate: '2024-11-27',
    amount: 11694.91,
    paid: 11694.91,
    balance: 0,
    status: 'PAID',
  },
];

export function TrustBilling() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'offline'>('online');
  const [isBuyCreditsDialogOpen, setIsBuyCreditsDialogOpen] = useState(false);
  const [creditQuantity, setCreditQuantity] = useState(100);
  const [buyPaymentMethod, setBuyPaymentMethod] = useState<'online' | 'offline'>('online');

  const handlePayNow = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentDialogOpen(true);
  };

  const initiateRazorpayPayment = () => {
    // This would integrate with Razorpay
    alert('Redirecting to Razorpay payment gateway...');
  };

  const creditPrice = {
    subtotal: creditQuantity * 15,
    tax: (creditQuantity * 15 * 0.18).toFixed(2),
    total: (creditQuantity * 15 * 1.18).toFixed(2),
  };

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-dvh mx-auto bg-white">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Billing & Invoices</h1>
        <p className="text-base md:text-lg text-gray-600 font-medium">Cambridge Academy Trust</p>
      </div>

      {/* Buy Credits CTA */}
      <Card className="mb-6 bg-green-100 border border-green-300 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="mb-2 font-semibold text-lg">Purchase Print Credits</h3>
              <p className="text-sm text-gray-600">
                Buy credits to print ID cards for your schools. ₹15 per ID card (including 18% GST)
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2 w-full md:w-auto bg-green-500 hover:bg-green-600"
              onClick={() => setIsBuyCreditsDialogOpen(true)}
            >
              <CreditCard className="w-5 h-5" />
              Buy Credits
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gray-100 border border-gray-300 rounded-2xl">
          <CardContent className="p-6">
            <p className="text-lg text-gray-900 font-semibold">Total Outstanding</p>
            <p className="mt-2">₹8,500</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-100 border border-gray-300 rounded-2xl">
          <CardContent className="p-6">
            <p className="text-lg text-gray-900 font-semibold">Overdue Amount</p>
            <p className="mt-2 text-red-600">₹0</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-100 border border-gray-300 rounded-2xl">
          <CardContent className="p-6">
            <p className="text-lg text-gray-900 font-semibold">Paid This Month</p>
            <p className="mt-2 text-green-600">₹11,694.91</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-100 border border-gray-300 rounded-2xl">
          <CardContent className="p-6">
            <p className="text-lg text-gray-900 font-semibold">Credit Balance</p>
            <p className="mt-2">4,550 IDs</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Invoices</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.number}</TableCell>
                          <TableCell className="text-sm">{invoice.issueDate}</TableCell>
                          <TableCell className="text-sm">{invoice.dueDate}</TableCell>
                          <TableCell>₹{invoice.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-green-600">
                            ₹{invoice.paid.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-orange-600">
                            ₹{invoice.balance.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                invoice.status === 'PAID' || invoice.status === 'CLOSED'
                                  ? 'bg-green-100 text-green-800'
                                  : invoice.status === 'OVERDUE'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }
                            >
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                              {invoice.balance > 0 && (
                                <Button size="sm" onClick={() => handlePayNow(invoice)}>
                                  Pay Now
                                </Button>
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
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm">
                        Invoice: <strong>INV-2024-003</strong>
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Razorpay Payment</p>
                    </div>
                    <div className="text-right">
                      <p>₹11,694.91</p>
                      <Badge className="mt-1 bg-green-100 text-green-800">Success</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">Transaction ID: pay_MxJ8K9YzLpQ2eR</p>
                  <p className="text-xs text-gray-600">Date: 2024-11-05 10:30 AM</p>
                </div>

                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No more payment history</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pay Invoice {selectedInvoice?.number}</DialogTitle>
            <DialogDescription>
              Choose a payment method to complete your invoice payment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Invoice Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span>₹{selectedInvoice?.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Already Paid:</span>
                <span className="text-green-600">-₹{selectedInvoice?.paid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Balance Due:</span>
                <span>₹{selectedInvoice?.balance.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-4">
              <Label>Choose Payment Method</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('online')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    paymentMethod === 'online'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="w-6 h-6 mb-2 text-blue-600" />
                  <p className="text-sm">Pay Online</p>
                  <p className="text-xs text-gray-600 mt-1">Card, UPI, Net Banking</p>
                </button>
                <button
                  onClick={() => setPaymentMethod('offline')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    paymentMethod === 'offline'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Upload className="w-6 h-6 mb-2 text-green-600" />
                  <p className="text-sm">Offline Payment</p>
                  <p className="text-xs text-gray-600 mt-1">Cash, Bank Transfer, Cheque</p>
                </button>
              </div>
            </div>

            {/* Online Payment */}
            {paymentMethod === 'online' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    You will be redirected to Razorpay secure payment gateway. You can pay using
                    credit/debit cards, UPI, net banking, or wallets.
                  </p>
                </div>
                <Button className="w-full" onClick={initiateRazorpayPayment}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceed to Payment Gateway
                </Button>
              </div>
            )}

            {/* Offline Payment */}
            {paymentMethod === 'offline' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <select className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm">
                    <option>Bank Transfer</option>
                    <option>Cash</option>
                    <option>Cheque</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Transaction Reference / Cheque No.</Label>
                  <Input placeholder="e.g., UTR123456 or CHQ789" />
                </div>
                <div className="space-y-2">
                  <Label>Upload Proof (Optional)</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Upload receipt or payment proof</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Choose File
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <textarea
                    className="w-full h-20 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Additional payment details..."
                  />
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Your payment will be verified by the admin. Credits will
                    be allocated once the payment is approved.
                  </p>
                </div>
                <Button className="w-full">Submit Payment Details</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Buy Credits Dialog */}
      <Dialog open={isBuyCreditsDialogOpen} onOpenChange={setIsBuyCreditsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Print Credits</DialogTitle>
            <DialogDescription>Select the number of credits and payment method</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Credit Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="credit-quantity">Number of Credits (ID Cards)</Label>
                <Input
                  id="credit-quantity"
                  type="number"
                  min="100"
                  step="100"
                  value={creditQuantity}
                  onChange={(e) => setCreditQuantity(parseInt(e.target.value) || 0)}
                  placeholder="Enter quantity"
                />
                <p className="text-sm text-gray-600">Minimum: 100 credits</p>
              </div>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCreditQuantity(1000)}
                  className={creditQuantity === 1000 ? 'border-blue-600 bg-blue-50' : ''}
                >
                  1,000 Credits
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCreditQuantity(5000)}
                  className={creditQuantity === 5000 ? 'border-blue-600 bg-blue-50' : ''}
                >
                  5,000 Credits
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCreditQuantity(10000)}
                  className={creditQuantity === 10000 ? 'border-blue-600 bg-blue-50' : ''}
                >
                  10,000 Credits
                </Button>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Credits Selected:</span>
                <span>{creditQuantity.toLocaleString()} IDs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Unit Price:</span>
                <span>₹15 per ID</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span>₹{creditPrice.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">GST (18%):</span>
                <span>₹{creditPrice.tax}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Total Amount:</span>
                <span className="text-lg">₹{creditPrice.total}</span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-4">
              <Label>Choose Payment Method</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setBuyPaymentMethod('online')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    buyPaymentMethod === 'online'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="w-6 h-6 mb-2 text-blue-600" />
                  <p className="text-sm">Pay Online</p>
                  <p className="text-xs text-gray-600 mt-1">Card, UPI, Net Banking</p>
                  <p className="text-xs text-green-600 mt-1">Instant Credit Allocation</p>
                </button>
                <button
                  onClick={() => setBuyPaymentMethod('offline')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    buyPaymentMethod === 'offline'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Upload className="w-6 h-6 mb-2 text-green-600" />
                  <p className="text-sm">Offline Payment</p>
                  <p className="text-xs text-gray-600 mt-1">Cash, Bank Transfer, Cheque</p>
                  <p className="text-xs text-orange-600 mt-1">Credits after approval</p>
                </button>
              </div>
            </div>

            {/* Online Payment */}
            {buyPaymentMethod === 'online' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm mb-2">Online Payment Benefits</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✓ Instant credit allocation to your account</li>
                    <li>✓ Secure payment via Razorpay gateway</li>
                    <li>✓ Multiple payment options (Cards, UPI, Net Banking, Wallets)</li>
                    <li>✓ Automatic invoice generation and receipt</li>
                  </ul>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    alert('Redirecting to Razorpay payment gateway...');
                    // In production: Create Razorpay order and redirect
                  }}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay ₹{creditPrice.total} via Razorpay
                </Button>
              </div>
            )}

            {/* Offline Payment */}
            {buyPaymentMethod === 'offline' && (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="text-sm mb-2 text-yellow-900">Offline Payment Instructions</h4>
                  <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                    <li>Click "Submit Request" to create a purchase order</li>
                    <li>Admin will generate an invoice for ₹{creditPrice.total}</li>
                    <li>Make payment via your preferred offline method</li>
                    <li>Upload payment proof and transaction details</li>
                    <li>Credits will be allocated after admin approval</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Bank Transfer Details</Label>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                      <p>
                        <strong>Bank Name:</strong> HDFC Bank
                      </p>
                      <p>
                        <strong>Account Name:</strong> School CRM Platform
                      </p>
                      <p>
                        <strong>Account Number:</strong> 50200012345678
                      </p>
                      <p>
                        <strong>IFSC Code:</strong> HDFC0001234
                      </p>
                      <p>
                        <strong>Branch:</strong> Mumbai Main Branch
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="offline-method">Payment Method</Label>
                    <select
                      id="offline-method"
                      className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm"
                    >
                      <option>Bank Transfer / NEFT / RTGS</option>
                      <option>Cash</option>
                      <option>Cheque</option>
                      <option>Demand Draft</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txn-reference">Transaction Reference (Optional)</Label>
                    <Input id="txn-reference" placeholder="UTR number, Cheque number, etc." />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proof-upload">Upload Payment Proof (Optional)</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Upload receipt, screenshot, or payment confirmation
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Choose File
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <textarea
                      id="notes"
                      className="w-full h-20 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Payment date, branch name, or any other details..."
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    alert('Purchase request submitted! Admin will review and create an invoice.');
                    setIsBuyCreditsDialogOpen(false);
                  }}
                >
                  Submit Purchase Request
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
