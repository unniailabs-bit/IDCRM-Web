import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
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
import { Separator } from '../../ui/separator';
import { Plus, Pencil, Mail, Phone, Eye, EyeOff } from 'lucide-react';
import { trustService } from '@/api/trustService';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Trust {
  id: number;
  name: string;
  registrationNumber: string;
  schoolCount: number;
  superAdmin: string;
  email: string;
  phone: string;
  address: string;
  status: 'Active' | 'Inactive';
  allotNoOfId?: number;
  city?: string;
  state?: string;
  pincode?: string;
}

export function TrustManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [trusts, setTrusts] = useState<Trust[]>([]);

  const fetchTrusts = async () => {
    try {
      const response = await trustService.getAllTrusts();
      const data = response.data;
      const formattedTrusts = data.map((trust: any) => ({
        id: trust.id,
        name: trust.trust_name,
        registrationNumber: trust.custom_id,
        schoolCount: trust.school_count || 0,
        superAdmin: trust.super_admin_name || trust.full_name || 'N/A',
        email: trust.email,
        phone: trust.phone,
        address: trust.address,
        status: trust.registration_status === 'approved' ? 'Active' : 'Inactive',
        allotNoOfId: trust.allot_ids,
        city: trust.city,
        state: trust.state,
        pincode: trust.pincode,
      }));
      setTrusts(formattedTrusts);
    } catch (error) {
      console.error('Error fetching trusts:', error);
    }
  };

  useEffect(() => {
    fetchTrusts();
  }, []);

  const handleAddTrust = () => {
    navigate('/dashboard/trusts/create-trust');
  };

  const handleEditTrust = (trust: Trust) => {
    // Navigate to the create/edit page with the trust ID
    navigate(`/dashboard/trusts/create-trust/${trust.id}`);
  };

  return (
    <div className="px-8 py-5 bg-white">
      <div className="flex flex-row md:items-center justify-between mb-8 md:mb-10 gap-2">
        <div className="animate-slide-down">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{t('trusts.title')}</h1>
          <p className="text-base md:text-lg text-gray-600 font-medium">
            {t('trusts.subtitle')}
          </p>
        </div>
        {/* <button></button> */}
        <button
          onClick={handleAddTrust}
          className="w-fit self-end text-white hover:text-white bg-gradient-to-r from-green-400 via-green-600 to-green-600
          hover:from-orange-400 hover:via-orange-600 hover:to-orange-600 hover:scale-105 group
          flex flex-row justify-center items-center gap-2 py-2 px-3 rounded-lg text-lg font-semibold transition-all duration-200"
        >
          <Plus className="w-7 h-7" />
          {trusts.length > 0 ? t('trusts.createTrust') : t('trusts.addNewTrust')}
        </button>
      </div>

      <Card>
        {/* <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-500">All Trusts</CardTitle>
        </CardHeader> */}
        <CardContent>
          <div
            className="overflow-x-auto overflow-y-auto max-h-[60vh] sm:max-h-[65vh] md:max-h-[70vh] lg:max-h-[80vh]
            border border-gray-200 rounded-lg sm:rounded-xl lg:rounded-l-2xl"
          >
            <Table className="min-w-full">
              <TableHeader className="text-lg">
                <TableRow>
                  <TableHead className="text-center">{t('trusts.srNo')}</TableHead>
                  <TableHead>{t('trusts.trustName')}</TableHead>
                  <TableHead>{t('trusts.regNo')}</TableHead>
                  <TableHead>{t('trusts.schools')}</TableHead>
                  {/* <TableHead>Super Admin</TableHead> */}
                  <TableHead>{t('trusts.contact')}</TableHead>
                  {/* <TableHead>Status</TableHead> */}
                  <TableHead>{t('trusts.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y-2 divide-gray-300">
                {trusts.map((trust) => (
                  <TableRow
                    key={trust.id}
                    className={`cursor-default ${(trusts.indexOf(trust) + 1) % 2 === 0 ? 'bg-gray-200/60' : 'bg-white'
                      } hover:bg-green-100/50 transition-colors text-sm hover:text-black group `}
                  >
                    <TableCell className="font-medium text-center">
                      {trusts.indexOf(trust) + 1}.
                    </TableCell>
                    <TableCell
                      className="font-medium group-hover:underline cursor-pointer hover:text-indigo-700"
                      onClick={() => navigate(`/dashboard/trusts/${trust.id}`)}
                    >
                      {trust.name}
                    </TableCell>
                    <TableCell>{trust.registrationNumber}</TableCell>
                    <TableCell>{trust.schoolCount}</TableCell>
                    {/* <TableCell>{trust.superAdmin}</TableCell> */}
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-end gap-2 text-sm">
                          <Mail className="w-4 h-4 text-red-700" />
                          <span>{trust.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-green-700" />
                          <span>{trust.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    {/* <TableCell>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm group-hover:border ${
                          trust.status === 'Active'
                            ? 'bg-green-100 text-green-800 group-hover:border-green-300'
                            : 'bg-red-100 text-red-800 group-hover:border-red-300'
                        }`}
                      >
                        {trust.status}
                      </span>
                    </TableCell> */}
                    <TableCell className="text-left">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTrust(trust);
                        }}
                        className="cursor-pointer text-sm gap-2 flex items-center group-2 hover:text-white border border-gray-300 group-hover:border-gray-500 bg-gray-100 hover:bg-gradient-to-br hover:from-yellow-200 hover:via-orange-400 hover:to-orange-500 px-2 py-1 rounded-md"
                      >
                        <Pencil className="w-4 h-4 group-2-hover:text-white" />
                        {t('trusts.edit')}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
