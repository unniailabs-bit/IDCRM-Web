import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Switch } from '../../ui/switch';
import { DollarSign, FileText, CreditCard, Shield } from 'lucide-react';

export function PlatformSettings() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-gray-900">Platform Settings</h1>
        <p className="text-gray-600 mt-1">Configure operational and billing settings</p>
      </div>

      <Tabs defaultValue="billing" className="space-y-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
          <TabsTrigger value="billing" className="text-xs sm:text-sm">
            Billing
          </TabsTrigger>
          <TabsTrigger value="costing" className="text-xs sm:text-sm">
            Costing
          </TabsTrigger>
          <TabsTrigger value="credits" className="text-xs sm:text-sm">
            Credits
          </TabsTrigger>
          <TabsTrigger value="access" className="text-xs sm:text-sm">
            Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Invoice Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-prefix">Invoice Number Prefix</Label>
                  <Input id="invoice-prefix" defaultValue="INV-2024-" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next-number">Next Invoice Number</Label>
                  <Input id="next-number" type="number" defaultValue="005" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input id="company-name" defaultValue="CRM Admin ID Card Platform" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-address">Company Address</Label>
                <Input id="company-address" defaultValue="123 Education Street, London, UK" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vat">VAT/Tax Rate (%)</Label>
                  <Input id="vat" type="number" defaultValue="20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-terms">Payment Terms (Days)</Label>
                  <Input id="payment-terms" type="number" defaultValue="30" />
                </div>
              </div>
              <div className="pt-4">
                <Button>Save Invoice Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Print Costing Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cost-model">Costing Model</Label>
                <Select defaultValue="per-id">
                  <SelectTrigger id="cost-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per-id">Per ID Card</SelectItem>
                    <SelectItem value="per-batch">Per Batch</SelectItem>
                    <SelectItem value="tiered">Tiered Pricing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost-per-id">Cost per ID Card (£)</Label>
                <Input id="cost-per-id" type="number" step="0.01" defaultValue="0.85" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-batch">Minimum Batch Size</Label>
                <Input id="min-batch" type="number" defaultValue="50" />
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label>Charge for Duplicate Prints</Label>
                  <p className="text-sm text-gray-500">
                    Enable billing for re-printing of ID cards
                  </p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label>Bulk Discount</Label>
                  <p className="text-sm text-gray-500">Apply discounts for large batch orders</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <div className="pt-4">
                <Button>Save Costing Rules</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Credit Allocation Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-credits">Default Credits for New Schools</Label>
                <Input id="default-credits" type="number" defaultValue="500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warning-threshold">Low Credit Warning Threshold</Label>
                <Input id="warning-threshold" type="number" defaultValue="200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="critical-threshold">Critical Credit Threshold</Label>
                <Input id="critical-threshold" type="number" defaultValue="50" />
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label>Auto-notify on Low Credits</Label>
                  <p className="text-sm text-gray-500">
                    Send automatic emails when credits reach warning level
                  </p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label>Allow Negative Balance</Label>
                  <p className="text-sm text-gray-500">
                    Permit schools to continue printing with negative credit balance
                  </p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              <div className="pt-4">
                <Button>Save Credit Policy</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Access Control & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p>Platform Admin - Full Access</p>
                    <p className="text-sm text-gray-500">Manage all trusts, schools, billing</p>
                  </div>
                  <Switch defaultChecked={true} disabled />
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p>Super Admin - Trust Level Access</p>
                    <p className="text-sm text-gray-500">Manage schools within assigned trust</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p>School Admin - School Level Access</p>
                    <p className="text-sm text-gray-500">Generate IDs and manage students</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p>Mobile App Access</p>
                    <p className="text-sm text-gray-500">Enable mobile app for school admins</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p>Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Require 2FA for all admin accounts</p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
              </div>
              <div className="pt-4">
                <Button>Save Access Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
