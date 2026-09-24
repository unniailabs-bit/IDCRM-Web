import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Download, DollarSign, TrendingUp, FileText, Clock } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { InvoiceManagement } from './InvoiceManagement';
import { PaymentProcessing } from './PaymentProcessing';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';

const revenueData = [
  { month: 'Jun', revenue: 75000, credits: 5000 },
  { month: 'Jul', revenue: 90000, credits: 6000 },
  { month: 'Aug', revenue: 112500, credits: 7500 },
  { month: 'Sep', revenue: 97500, credits: 6500 },
  { month: 'Oct', revenue: 127500, credits: 8500 },
  { month: 'Nov', revenue: 120000, credits: 8000 },
];

const trustRevenueData = [
  { name: 'Cambridge Academy Trust', value: 210000, color: '#3b82f6' },
  { name: 'Oxford Schools Trust', value: 168000, color: '#10b981' },
  { name: 'London Education Trust', value: 244500, color: '#f59e0b' },
];

const arAgingData = [
  { range: '0-30 days', amount: 85000, count: 5 },
  { range: '31-60 days', amount: 42000, count: 3 },
  { range: '61-90 days', amount: 15000, count: 2 },
  { range: '90+ days', amount: 8000, count: 1 },
];

const paymentHistoryData = [
  {
    id: '1',
    date: '2024-11-06',
    invoice: 'INV-2024-002',
    entity: "St. Mary's School",
    method: 'Razorpay',
    amount: 11694.91,
    status: 'Success',
    txnId: 'pay_MxJ8K9YzLpQ2eR',
  },
  {
    id: '2',
    date: '2024-11-05',
    invoice: 'INV-2024-001',
    entity: 'Cambridge Trust',
    method: 'Bank Transfer',
    amount: 8500,
    status: 'Pending',
    txnId: 'UTR12345678901',
  },
  {
    id: '3',
    date: '2024-11-04',
    invoice: 'INV-2023-098',
    entity: 'Oxford Trust',
    method: 'Razorpay',
    amount: 4881.36,
    status: 'Success',
    txnId: 'pay_NyK9L0ZaQpR3fS',
  },
];

export function BillingReports() {
  const [reportPeriod, setReportPeriod] = useState('month');

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-gray-900">Billing & Reports</h1>
          <p className="text-gray-600 mt-1">
            Financial overview, invoicing, and payment management
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="mt-2">₹6,22,500</p>
                <p className="text-xs text-green-600 mt-1">+8.5% vs last month</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Credits Sold</p>
                <p className="mt-2">41,500</p>
                <p className="text-xs text-blue-600 mt-1">IDs this month</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="mt-2">₹1,50,000</p>
                <p className="text-xs text-orange-600 mt-1">11 invoices</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="mt-2">₹23,000</p>
                <p className="text-xs text-red-600 mt-1">3 invoices</p>
              </div>
              <FileText className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Revenue (₹)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Trust</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={trustRevenueData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `₹${(entry.value / 1000).toFixed(0)}K`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {trustRevenueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {trustRevenueData.map((trust) => (
                    <div key={trust.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: trust.color }}
                        />
                        <span>{trust.name}</span>
                      </div>
                      <span>₹{trust.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* A/R Aging */}
          <Card>
            <CardHeader>
              <CardTitle>Accounts Receivable Aging</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={arAgingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#f59e0b" name="Amount (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <InvoiceManagement />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentProcessing />

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistoryData.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="text-sm">{payment.date}</TableCell>
                          <TableCell>{payment.invoice}</TableCell>
                          <TableCell>{payment.entity}</TableCell>
                          <TableCell>{payment.method}</TableCell>
                          <TableCell className="text-xs text-gray-600">{payment.txnId}</TableCell>
                          <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                                payment.status === 'Success'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {payment.status}
                            </span>
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

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <h3 className="mb-2">Revenue Report</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Detailed breakdown of revenue by trust, school, and time period
                </p>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <h3 className="mb-2">Credits Report</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Credits purchased vs used with utilization analytics
                </p>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <h3 className="mb-2">Outstanding Invoices</h3>
                <p className="text-sm text-gray-600 mb-4">
                  All unpaid and overdue invoices with aging analysis
                </p>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <h3 className="mb-2">Payment Method Analysis</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Breakdown of online vs offline payment methods
                </p>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <h3 className="mb-2">Tax Report</h3>
                <p className="text-sm text-gray-600 mb-4">
                  GST summary and tax collected for compliance
                </p>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <h3 className="mb-2">Audit Trail</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Complete transaction history with user actions
                </p>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
