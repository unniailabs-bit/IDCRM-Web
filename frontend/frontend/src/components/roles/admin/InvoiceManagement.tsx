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
  DialogTrigger,
} from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import {
  Plus,
  Eye,
  Send,
  Download,
  Edit,
  XCircle,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'OVERDUE'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'CANCELLED'
  | 'VOID'
  | 'CLOSED';

interface InvoiceItem {
  id: string;
  type: 'CREDITS' | 'SUBSCRIPTION' | 'ADDON' | 'ADJUSTMENT';
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
}

interface Invoice {
  id: string;
  number: string;
  entityType: 'TRUST' | 'SCHOOL';
  entityName: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  items: InvoiceItem[];
  razorpayOrderId?: string;
  pdfUrl?: string;
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    number: 'INV-2024-001',
    entityType: 'TRUST',
    entityName: 'Cambridge Academy Trust',
    status: 'SENT',
    issueDate: '2024-11-01',
    dueDate: '2024-11-30',
    subtotal: 7083.33,
    taxAmount: 1416.67,
    totalAmount: 8500,
    amountPaid: 0,
    balanceDue: 8500,
    items: [
      {
        id: '1',
        type: 'CREDITS',
        description: 'Print Credits - 5000 IDs',
        quantity: 5000,
        unitPrice: 15,
        taxRate: 18,
        lineTotal: 75000,
      },
    ],
  },
  {
    id: '2',
    number: 'INV-2024-002',
    entityType: 'SCHOOL',
    entityName: "St. Mary's Primary School",
    status: 'PAID',
    issueDate: '2024-10-28',
    dueDate: '2024-11-27',
    subtotal: 9745.76,
    taxAmount: 1949.15,
    totalAmount: 11694.91,
    amountPaid: 11694.91,
    balanceDue: 0,
    items: [
      {
        id: '1',
        type: 'CREDITS',
        description: 'Print Credits - 3000 IDs',
        quantity: 3000,
        unitPrice: 15,
        taxRate: 18,
        lineTotal: 45000,
      },
    ],
  },
  {
    id: '3',
    number: 'INV-2024-003',
    entityType: 'TRUST',
    entityName: 'Oxford Schools Trust',
    status: 'OVERDUE',
    issueDate: '2024-10-15',
    dueDate: '2024-11-14',
    subtotal: 4067.8,
    taxAmount: 813.56,
    totalAmount: 4881.36,
    amountPaid: 0,
    balanceDue: 4881.36,
    items: [
      {
        id: '1',
        type: 'CREDITS',
        description: 'Print Credits - 2000 IDs',
        quantity: 2000,
        unitPrice: 15,
        taxRate: 18,
        lineTotal: 30000,
      },
    ],
  },
];

export function InvoiceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Invoice creation state
  const [entityType, setEntityType] = useState<'TRUST' | 'SCHOOL'>('TRUST');
  const [entityName, setEntityName] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customerNotes, setCustomerNotes] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<
    Array<{
      type: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
    }>
  >([{ type: 'CREDITS', quantity: 0, unitPrice: 15, taxRate: 18 }]);

  const calculateLineTotal = (quantity: number, unitPrice: number, taxRate: number) => {
    const subtotal = quantity * unitPrice;
    const tax = subtotal * (taxRate / 100);
    return subtotal + tax;
  };

  const calculateInvoiceTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;

    invoiceItems.forEach((item) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const lineTax = lineSubtotal * (item.taxRate / 100);
      subtotal += lineSubtotal;
      taxTotal += lineTax;
    });

    return {
      subtotal: subtotal.toFixed(2),
      tax: taxTotal.toFixed(2),
      total: (subtotal + taxTotal).toFixed(2),
    };
  };

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    const newItems = [...invoiceItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvoiceItems(newItems);
  };

  const addInvoiceItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { type: 'CREDITS', quantity: 0, unitPrice: 15, taxRate: 18 },
    ]);
  };

  const removeInvoiceItem = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    }
  };

  const totals = calculateInvoiceTotals();

  const resetForm = () => {
    setEntityType('TRUST');
    setEntityName('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setCustomerNotes('');
    setInvoiceItems([{ type: 'CREDITS', quantity: 0, unitPrice: 15, taxRate: 18 }]);
  };

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const existingNumbers = invoices
      .filter((inv) => inv.number.startsWith(`INV-${year}-`))
      .map((inv) => {
        const parts = inv.number.split('-');
        return parseInt(parts[2] || '0');
      });
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    return `INV-${year}-${String(nextNumber).padStart(3, '0')}`;
  };

  const getEntityNameDisplay = (entityId: string) => {
    const entities: Record<string, string> = {
      trust1: 'Cambridge Academy Trust',
      trust2: 'Oxford Schools Trust',
      school1: "St. Mary's Primary School",
    };
    return entities[entityId] || entityId;
  };

  const getItemDescription = (type: string, quantity: number) => {
    const descriptions: Record<string, string> = {
      CREDITS: `Print Credits - ${quantity} IDs`,
      SUBSCRIPTION: 'Platform Subscription',
      ADDON: 'Add-on Service',
      ADJUSTMENT: 'Adjustment',
    };
    return descriptions[type] || type;
  };

  const createInvoice = (status: InvoiceStatus) => {
    if (!entityName) {
      alert('Please select an entity');
      return;
    }

    if (invoiceItems.some((item) => item.quantity === 0)) {
      alert('Please enter quantity for all items');
      return;
    }

    const subtotal = parseFloat(totals.subtotal);
    const tax = parseFloat(totals.tax);
    const total = parseFloat(totals.total);

    const newInvoice: Invoice = {
      id: Date.now().toString(),
      number: generateInvoiceNumber(),
      entityType,
      entityName: getEntityNameDisplay(entityName),
      status,
      issueDate,
      dueDate,
      subtotal,
      taxAmount: tax,
      totalAmount: total,
      amountPaid: 0,
      balanceDue: total,
      items: invoiceItems.map((item, index) => ({
        id: `${Date.now()}-${index}`,
        type: item.type as 'CREDITS' | 'SUBSCRIPTION' | 'ADDON' | 'ADJUSTMENT',
        description: getItemDescription(item.type, item.quantity),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        lineTotal: item.quantity * item.unitPrice,
      })),
    };

    setInvoices([newInvoice, ...invoices]);
    setIsCreateDialogOpen(false);
    resetForm();
    alert(
      `Invoice ${newInvoice.number} ${status === 'DRAFT' ? 'saved as draft' : 'created and sent'}!`
    );
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const variants = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      OVERDUE: 'bg-red-100 text-red-800',
      PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      VOID: 'bg-gray-100 text-gray-800',
      CLOSED: 'bg-purple-100 text-purple-800',
    };
    return variants[status];
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
      case 'CLOSED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'OVERDUE':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'SENT':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'CANCELLED':
      case 'VOID':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailDialogOpen(true);
  };

  const openInvoicePDF = (invoice: Invoice) => {
    const pdfWindow = window.open(`/invoice-pdf?id=${invoice.id}`, '_blank');
    if (pdfWindow) {
      // Write the invoice data to the new window
      pdfWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${invoice.number}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; padding: 40px; background: white; color: black; }
              .invoice-header { border-bottom: 2px solid black; padding-bottom: 20px; margin-bottom: 30px; }
              .invoice-title { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
              .invoice-number { font-size: 14px; color: #666; }
              .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .info-section { flex: 1; }
              .info-label { font-size: 12px; color: #666; margin-bottom: 5px; }
              .info-value { font-size: 14px; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin: 30px 0; }
              th { background: black; color: white; padding: 12px; text-align: left; font-size: 12px; }
              td { padding: 12px; border-bottom: 1px solid #ddd; font-size: 14px; }
              .text-right { text-align: right; }
              .totals { margin-top: 30px; margin-left: auto; width: 300px; }
              .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
              .totals-row.total { border-top: 2px solid black; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 16px; }
              .status-badge { display: inline-block; padding: 4px 12px; border: 2px solid black; font-size: 12px; font-weight: bold; margin-top: 20px; }
              @media print {
                body { padding: 20px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="invoice-header">
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-number">${invoice.number}</div>
            </div>

            <div class="invoice-info">
              <div class="info-section">
                <div class="info-label">BILL TO</div>
                <div class="info-value">${invoice.entityName}</div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">${
                  invoice.entityType
                }</div>
              </div>
              <div class="info-section" style="text-align: right;">
                <div class="info-label">INVOICE DATE</div>
                <div class="info-value">${invoice.issueDate}</div>
                <div class="info-label" style="margin-top: 10px;">DUE DATE</div>
                <div class="info-value">${invoice.dueDate}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>DESCRIPTION</th>
                  <th class="text-right">QTY</th>
                  <th class="text-right">RATE</th>
                  <th class="text-right">TAX %</th>
                  <th class="text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.description}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">₹${item.unitPrice.toFixed(2)}</td>
                    <td class="text-right">${item.taxRate}%</td>
                    <td class="text-right">₹${item.lineTotal.toLocaleString()}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>

            <div class="totals">
              <div class="totals-row">
                <span>Subtotal:</span>
                <span>₹${invoice.subtotal.toLocaleString()}</span>
              </div>
              <div class="totals-row">
                <span>Tax:</span>
                <span>₹${invoice.taxAmount.toLocaleString()}</span>
              </div>
              <div class="totals-row total">
                <span>TOTAL:</span>
                <span>₹${invoice.totalAmount.toLocaleString()}</span>
              </div>
              <div class="totals-row" style="color: #10b981;">
                <span>Amount Paid:</span>
                <span>-₹${invoice.amountPaid.toLocaleString()}</span>
              </div>
              <div class="totals-row" style="color: #f59e0b; font-weight: bold;">
                <span>Balance Due:</span>
                <span>₹${invoice.balanceDue.toLocaleString()}</span>
              </div>
            </div>

            <div style="margin-top: 40px;">
              <div class="status-badge">STATUS: ${invoice.status}</div>
            </div>

            <div class="no-print" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
              <button onclick="window.print()" style="padding: 12px 24px; background: black; color: white; border: none; cursor: pointer; font-size: 14px; margin-right: 10px;">
                Print Invoice
              </button>
              <button onclick="window.close()" style="padding: 12px 24px; background: white; color: black; border: 2px solid black; cursor: pointer; font-size: 14px;">
                Close
              </button>
            </div>
          </body>
        </html>
      `);
      pdfWindow.document.close();
    }
  };

  const filteredInvoices =
    statusFilter === 'all' ? invoices : invoices.filter((inv) => inv.status === statusFilter);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-gray-900">Invoice Management</h1>
          <p className="text-gray-600 mt-1">Create and manage invoices for trusts and schools</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Create and send invoices to trusts and schools for credit purchases
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entity-type">Bill To</Label>
                  <Select
                    value={entityType}
                    onValueChange={(value) => setEntityType(value as 'TRUST' | 'SCHOOL')}
                  >
                    <SelectTrigger id="entity-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRUST">Trust</SelectItem>
                      <SelectItem value="SCHOOL">School</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entity">Entity Name</Label>
                  <Select value={entityName} onValueChange={(value) => setEntityName(value)}>
                    <SelectTrigger id="entity">
                      <SelectValue placeholder="Select entity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trust1">Cambridge Academy Trust</SelectItem>
                      <SelectItem value="trust2">Oxford Schools Trust</SelectItem>
                      <SelectItem value="school1">St. Mary's Primary School</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issue-date">Issue Date</Label>
                  <Input
                    id="issue-date"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Invoice Items</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  {invoiceItems.map((item, index) => (
                    <div key={index} className="space-y-3 pb-3 border-b last:border-b-0 last:pb-0">
                      <div className="grid grid-cols-12 gap-2 text-sm">
                        <div className="col-span-4">
                          <Label>Item Type</Label>
                          <Select
                            value={item.type}
                            onValueChange={(value) => updateInvoiceItem(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CREDITS">Print Credits</SelectItem>
                              <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                              <SelectItem value="ADDON">Add-on</SelectItem>
                              <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label>Qty</Label>
                          <Input
                            type="number"
                            value={item.quantity || ''}
                            onChange={(e) =>
                              updateInvoiceItem(index, 'quantity', parseFloat(e.target.value) || 0)
                            }
                            placeholder="5000"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Unit Price</Label>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateInvoiceItem(index, 'unitPrice', parseFloat(e.target.value) || 0)
                            }
                            placeholder="15"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Tax %</Label>
                          <Input
                            type="number"
                            value={item.taxRate}
                            onChange={(e) =>
                              updateInvoiceItem(index, 'taxRate', parseFloat(e.target.value) || 0)
                            }
                            placeholder="18"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Total</Label>
                          <Input
                            readOnly
                            value={`₹${calculateLineTotal(
                              item.quantity,
                              item.unitPrice,
                              item.taxRate
                            ).toFixed(2)}`}
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                      {invoiceItems.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          onClick={() => removeInvoiceItem(index)}
                        >
                          Remove Item
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="gap-2" onClick={addInvoiceItem}>
                    <Plus className="w-4 h-4" />
                    Add Line Item
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>₹{totals.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span>₹{totals.tax}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Total Amount:</span>
                  <span>₹{totals.total}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Customer Notes (Optional)</Label>
                <textarea
                  id="notes"
                  className="w-full h-20 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Additional notes for the customer..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={() => createInvoice('DRAFT')}>
                  Save as Draft
                </Button>
                <Button onClick={() => createInvoice('SENT')}>Create & Send</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Outstanding</p>
            <p className="mt-1">₹13,381.36</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Overdue</p>
            <p className="mt-1 text-red-600">₹4,881.36</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Paid This Month</p>
            <p className="mt-1 text-green-600">₹11,694.91</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Draft Invoices</p>
            <p className="mt-1">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Invoices</p>
            <p className="mt-1">{invoices.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Invoices</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Type</TableHead>
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
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.number}</TableCell>
                      <TableCell>{invoice.entityName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{invoice.entityType}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{invoice.issueDate}</TableCell>
                      <TableCell className="text-sm">{invoice.dueDate}</TableCell>
                      <TableCell>₹{invoice.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-green-600">
                        ₹{invoice.amountPaid.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-orange-600">
                        ₹{invoice.balanceDue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(invoice.status)}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${getStatusBadge(
                              invoice.status
                            )}`}
                          >
                            {invoice.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {invoice.status === 'DRAFT' && (
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
                            <Button variant="ghost" size="sm">
                              <Send className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openInvoicePDF(invoice)}
                            title="Open PDF in new tab"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
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

      {/* Invoice Detail Dialog */}
      {selectedInvoice && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice {selectedInvoice.number}</DialogTitle>
              <DialogDescription>View invoice details and manage payments</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Invoice Header */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Bill To:</p>
                  <p>{selectedInvoice.entityName}</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedInvoice.entityType}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    {getStatusIcon(selectedInvoice.status)}
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getStatusBadge(
                        selectedInvoice.status
                      )}`}
                    >
                      {selectedInvoice.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Issue Date: {selectedInvoice.issueDate}
                  </p>
                  <p className="text-sm text-gray-600">Due Date: {selectedInvoice.dueDate}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">Description</th>
                      <th className="text-right p-3">Qty</th>
                      <th className="text-right p-3">Rate</th>
                      <th className="text-right p-3">Tax</th>
                      <th className="text-right p-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">{item.description}</td>
                        <td className="text-right p-3">{item.quantity}</td>
                        <td className="text-right p-3">₹{item.unitPrice}</td>
                        <td className="text-right p-3">{item.taxRate}%</td>
                        <td className="text-right p-3">₹{item.lineTotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2 max-w-xs ml-auto">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>₹{selectedInvoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span>₹{selectedInvoice.taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Total:</span>
                  <span>₹{selectedInvoice.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Paid:</span>
                  <span>-₹{selectedInvoice.amountPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Balance Due:</span>
                  <span className="text-orange-600">
                    ₹{selectedInvoice.balanceDue.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => selectedInvoice && openInvoicePDF(selectedInvoice)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Open PDF
                </Button>
                {selectedInvoice?.status === 'SENT' && (
                  <Button className="flex-1">
                    <Send className="w-4 h-4 mr-2" />
                    Send Reminder
                  </Button>
                )}
                {selectedInvoice && selectedInvoice.balanceDue > 0 && (
                  <Button className="flex-1">Record Payment</Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
