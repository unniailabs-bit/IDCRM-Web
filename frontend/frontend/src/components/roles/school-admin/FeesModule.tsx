import React, { useState } from 'react';
import { useFormik, FieldArray, FormikProvider, getIn } from 'formik';
import * as Yup from 'yup';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { Pencil, Trash2, Plus, Trash, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { classService } from '@/api/classService';
import { feesService, FeeStructureApi, FeeInstallment } from '@/api/feesService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { useTranslation } from 'react-i18next';

interface ClassItem {
  id: number;
  class_name: string;
}

interface Installment {
  name: string;
  amount: number | '';
  dueDate: string;
}

interface FeeFormValues {
  classId: string;
  annualFee: number | '';
  latePenalty: number | '';
  numberOfInstallments: number | '';
  installments: Installment[];
}

interface FeeStructure extends Omit<FeeFormValues, 'installments'> {
  id: string;
  className: string;
  installments: {
    name: string;
    amount: number;
    dueDate: string;
  }[];
}

export function FeesModule() {
  const { userData } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch Classes
  const { data: classes = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes', userData?.id],
    queryFn: async () => {
      if (!userData?.id) return [];
      const response = await classService.getClassesBySchool(userData.id);
      return response.success && Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!userData?.id,
  });

  // Fetch Fees
  const { data: feesList = [], isLoading: isLoadingFees } = useQuery({
    queryKey: ['fees', userData?.id],
    queryFn: async () => {
      if (!userData?.id) return [];
      const response = await feesService.getFeesBySchool(userData.id);

      // Transform API response to match component state structure
      const apiData = response.data || (Array.isArray(response) ? response : []);

      return apiData.map((fee: any) => {
        return {
          id: fee.id?.toString() || '',
          classId: fee.class_id?.toString() || '',
          className: fee.class_name
            ? `${fee.class_name} ${fee.section ? `(${fee.section})` : ''}`
            : '',
          annualFee: Number(fee.annual_fee),
          latePenalty: Number(fee.late_fee_penalty),
          numberOfInstallments: Number(fee.number_of_installments),
          installments:
            fee.installments?.map((inst: any) => ({
              name: inst.installment_name,
              amount: Number(inst.amount),
              dueDate: inst.due_date,
            })) || [],
        } as FeeStructure;
      });
    },
    enabled: !!userData?.id,
  });

  // Create Fee Mutation
  const createFeeMutation = useMutation({
    mutationFn: (data: FeeStructureApi) => feesService.createFee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', userData?.id] });
      toast.success(t('feesManagement.messages.successAdd'));
      setIsDialogOpen(false);
      setEditingId(null);
      formik.resetForm();
    },
    onError: (error) => {
      console.error('Create fee error:', error);
      toast.error(t('feesManagement.messages.errorAdd'));
    },
  });

  // Update Fee Mutation
  const updateFeeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FeeStructureApi> }) =>
      feesService.updateFee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', userData?.id] });
      toast.success(t('feesManagement.messages.successUpdate'));
      setIsDialogOpen(false);
      setEditingId(null);
      formik.resetForm();
    },
    onError: (error) => {
      console.error('Update fee error:', error);
      toast.error(t('feesManagement.messages.errorUpdate'));
    },
  });

  // Delete Fee Mutation
  const deleteFeeMutation = useMutation({
    mutationFn: (id: string) => feesService.deleteFee(id),
    onSuccess: (data) => {
      if (data.success === false) {
        toast.error(data.message || t('feesManagement.messages.errorDelete'));
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['fees', userData?.id] });
      toast.success(data.message || t('feesManagement.messages.successDelete'));
    },
    onError: (error) => {
      console.error('Delete fee error:', error);
      toast.error(t('feesManagement.messages.errorDelete'));
    },
  });

  const validationSchema = Yup.object().shape({
    classId: Yup.string().required(t('feesManagement.validation.classRequired')),
    annualFee: Yup.number()
      .required(t('feesManagement.validation.annualFeeRequired'))
      .positive(t('feesManagement.validation.positive'))
      .min(1, t('feesManagement.validation.minOne')),
    latePenalty: Yup.number().min(0, t('feesManagement.validation.nonNegative')).required(t('feesManagement.validation.penaltyRequired')),
    numberOfInstallments: Yup.number()
      .required(t('feesManagement.validation.numInstallmentsRequired'))
      .min(1, t('feesManagement.validation.minOne'))
      .integer(t('feesManagement.validation.wholeNumber')),
    installments: Yup.array()
      .of(
        Yup.object().shape({
          name: Yup.string().required(t('feesManagement.validation.nameRequired')),
          amount: Yup.number().required(t('feesManagement.validation.amountRequired')).positive(t('feesManagement.validation.positive')),
          dueDate: Yup.string().required(t('feesManagement.validation.dueDateRequired')),
        })
      )
      .min(1, t('feesManagement.form.atLeastOneInstallment')),
  });

  const formik = useFormik<FeeFormValues>({
    initialValues: {
      classId: '',
      annualFee: '',
      latePenalty: '',
      numberOfInstallments: 1,
      installments: [],
    },
    validationSchema,
    onSubmit: (values) => {
      // Validate installments sum
      const annualFee = Number(values.annualFee);
      const installmentsSum = values.installments.reduce(
        (sum, inst) => sum + Number(inst.amount),
        0
      );

      if (values.installments.length > 0 && Math.abs(installmentsSum - annualFee) > 1) {
        toast.error(t('feesManagement.form.totalMustMatch', { sum: installmentsSum, fee: annualFee }));
        return;
      }

      // Transform form values to API payload
      const commonPayload = {
        annual_fee: Number(values.annualFee),
        late_fee_penalty: Number(values.latePenalty),
        number_of_installments: values.installments.length,
        installments: values.installments.map((inst, index) => ({
          installment_no: index + 1,
          installment_name: inst.name,
          amount: Number(inst.amount),
          due_date: inst.dueDate,
        })),
      };

      if (editingId) {
        // Exclude class_id for update
        updateFeeMutation.mutate({ id: editingId, data: commonPayload });
      } else {
        // Include class_id for create
        createFeeMutation.mutate({ ...commonPayload, class_id: values.classId });
      }
    },
  });

  const handleEdit = (fee: FeeStructure) => {
    setEditingId(fee.classId);
    formik.setValues({
      classId: fee.classId,
      annualFee: fee.annualFee,
      latePenalty: fee.latePenalty,
      numberOfInstallments: fee.installments.length,
      installments: fee.installments.map((inst) => ({
        name: inst.name,
        amount: inst.amount,
        dueDate: inst.dueDate,
      })),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('feesManagement.messages.confirmDelete'))) {
      deleteFeeMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    formik.resetForm();
    formik.setFieldValue('numberOfInstallments', 1);
    setIsDialogOpen(true);
  };

  const handleInstallmentCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let count = parseInt(e.target.value);
    const annualFee = Number(formik.values.annualFee);

    // Enforce min 1
    if (isNaN(count) || count < 1) count = 1;

    formik.setFieldValue('numberOfInstallments', count);

    if (!annualFee) return;

    if (count > 0) {
      const amountPerInstallment = Math.floor(annualFee / count);
      const remainder = annualFee - amountPerInstallment * count;

      const newInstallments = Array.from({ length: count }).map((_, index) => ({
        name: `${t('feesManagement.form.installmentName')} ${index + 1}`,
        // Add remainder to the last installment
        amount: index === count - 1 ? amountPerInstallment + remainder : amountPerInstallment,
        dueDate: '',
      }));

      formik.setFieldValue('installments', newInstallments);
    } else {
      formik.setFieldValue('installments', []);
    }
  };

  const handleInstallmentAmountChange = (index: number, newAmount: number) => {
    let currentInstallments = [...formik.values.installments];
    const annualFee = Number(formik.values.annualFee);

    // 1. Basic Validation: Non-negative
    if (newAmount < 0) newAmount = 0;

    if (!annualFee || currentInstallments.length <= 1) {
      // Clamp to annual fee if it exists
      if (annualFee && newAmount > annualFee) newAmount = annualFee;
      formik.setFieldValue(`installments.${index}.amount`, newAmount);
      return;
    }

    if (index < currentInstallments.length - 1) {
      let previousSum = 0;
      for (let i = 0; i < index; i++) {
        previousSum += Number(currentInstallments[i].amount);
      }

      const availablePool = annualFee - previousSum;

      if (newAmount > availablePool) {
        newAmount = availablePool;
      }

      currentInstallments[index].amount = newAmount;

      const remainingTotal = availablePool - newAmount;
      const remainingCount = currentInstallments.length - (index + 1);

      if (remainingCount > 0) {
        const amountPerInstallment = Math.floor(remainingTotal / remainingCount);
        const remainder = remainingTotal - amountPerInstallment * remainingCount;

        for (let i = index + 1; i < currentInstallments.length; i++) {
          if (i === currentInstallments.length - 1) {
            currentInstallments[i].amount = amountPerInstallment + remainder;
          } else {
            currentInstallments[i].amount = amountPerInstallment;
          }
        }
      }
    } else {
      let prePreviousSum = 0;
      for (let i = 0; i < index - 1; i++) {
        prePreviousSum += Number(currentInstallments[i].amount);
      }

      const availablePool = annualFee - prePreviousSum;

      if (newAmount > availablePool) {
        newAmount = availablePool;
      }

      currentInstallments[index].amount = newAmount;

      currentInstallments[index - 1].amount = availablePool - newAmount;
    }

    formik.setFieldValue('installments', currentInstallments);
  };

  const handleRemoveInstallment = (index: number) => {
    const currentInstallments = [...formik.values.installments];

    if (currentInstallments.length <= 1) {
      toast.error(t('feesManagement.form.atLeastOneInstallment'));
      return;
    }

    const removedAmount = Number(currentInstallments[index].amount) || 0;
    const newInstallments = currentInstallments.filter((_, i) => i !== index);

    if (newInstallments.length > 0) {
      const lastIndex = newInstallments.length - 1;
      newInstallments[lastIndex].amount = Number(newInstallments[lastIndex].amount) + removedAmount;
    }

    formik.setFieldValue('installments', newInstallments);
    formik.setFieldValue('numberOfInstallments', newInstallments.length);
  };

  const getErrorMessage = (fieldName: string) => {
    const touched = getIn(formik.touched, fieldName);
    const error = getIn(formik.errors, fieldName);
    return touched && error ? error : undefined;
  };

  return (
    <div className="px-4 sm:px-8 py-5 bg-white min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t('feesManagement.title')}</h1>
          <p className="text-gray-600">{t('feesManagement.subtitle')}</p>
        </div>
        <Button
          onClick={handleAddNew}
          className="bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('feesManagement.addNewFee')}
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? t('feesManagement.editFeeTitle') : t('feesManagement.addFeeTitle')}</DialogTitle>
          </DialogHeader>

          <FormikProvider value={formik}>
            <form onSubmit={formik.handleSubmit} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="classId">{t('feesManagement.form.classLabel')}</Label>
                  <Select
                    value={formik.values.classId}
                    onValueChange={(value) => formik.setFieldValue('classId', value)}
                  >
                    <SelectTrigger className={getErrorMessage('classId') ? 'border-red-500' : ''}>
                      <SelectValue placeholder={t('feesManagement.form.selectClassPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls: ClassItem) => {
                        const isDisabled = feesList.some(
                          (fee: FeeStructure) =>
                            fee.classId === cls.id.toString() && fee.classId !== editingId
                        );
                        return (
                          <SelectItem
                            key={cls.id}
                            value={cls.id.toString()}
                            disabled={isDisabled}
                            className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            {cls.class_name} {isDisabled && `(${t('feesManagement.form.alreadyAdded')})`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {getErrorMessage('classId') && (
                    <p className="text-sm text-red-500">{getErrorMessage('classId')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annualFee">{t('feesManagement.form.annualFeeLabel')}</Label>
                  <Input
                    id="annualFee"
                    type="number"
                    placeholder={t('feesManagement.form.annualFeePlaceholder')}
                    {...formik.getFieldProps('annualFee')}
                    className={getErrorMessage('annualFee') ? 'border-red-500' : ''}
                    onChange={(e) => {
                      formik.handleChange(e);
                      if (formik.values.numberOfInstallments && Number(e.target.value) > 0) {
                        const annualFee = Number(e.target.value);
                        const count = Number(formik.values.numberOfInstallments);
                        if (count > 0) {
                          const amountPerInstallment = Math.floor(annualFee / count);
                          const remainder = annualFee - amountPerInstallment * count;
                          const newInstallments = Array.from({ length: count }).map((_, index) => ({
                            name: `${t('feesManagement.form.installmentName')} ${index + 1}`,
                            amount:
                              index === count - 1
                                ? amountPerInstallment + remainder
                                : amountPerInstallment,
                            dueDate: '',
                          }));
                          formik.setFieldValue('installments', newInstallments);
                        }
                      }
                    }}
                  />
                  {getErrorMessage('annualFee') && (
                    <p className="text-sm text-red-500">{getErrorMessage('annualFee')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="latePenalty">{t('feesManagement.form.latePenaltyLabel')}</Label>
                  <Input
                    id="latePenalty"
                    type="number"
                    placeholder={t('feesManagement.form.latePenaltyPlaceholder')}
                    {...formik.getFieldProps('latePenalty')}
                    className={getErrorMessage('latePenalty') ? 'border-red-500' : ''}
                  />
                  {getErrorMessage('latePenalty') && (
                    <p className="text-sm text-red-500">{getErrorMessage('latePenalty')}</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="numberOfInstallments">{t('feesManagement.form.numInstallmentsLabel')}</Label>
                    <Input
                      id="numberOfInstallments"
                      type="number"
                      min="1"
                      placeholder={t('feesManagement.form.numInstallmentsPlaceholder')}
                      value={formik.values.numberOfInstallments}
                      onChange={handleInstallmentCountChange}
                      disabled={!formik.values.annualFee}
                      className={getErrorMessage('numberOfInstallments') ? 'border-red-500' : ''}
                    />
                    {getErrorMessage('numberOfInstallments') && (
                      <p className="text-sm text-red-500">
                        {getErrorMessage('numberOfInstallments')}
                      </p>
                    )}
                    {!formik.values.annualFee && (
                      <p className="text-xs text-amber-600">{t('feesManagement.form.setAnnualFeeFirst')}</p>
                    )}
                  </div>
                  <div className="flex items-end justify-end pb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentInstallments = formik.values.installments;
                        formik.setFieldValue('installments', [
                          ...currentInstallments,
                          { name: '', amount: '', dueDate: '' },
                        ]);
                        formik.setFieldValue(
                          'numberOfInstallments',
                          currentInstallments.length + 1
                        );
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('feesManagement.form.addManually')}
                    </Button>
                  </div>
                </div>

                <FieldArray
                  name="installments"
                  render={(arrayHelpers) => (
                    <div className="space-y-3">
                      {formik.values.installments.map((installment, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border p-3 rounded-lg bg-gray-50"
                        >
                          <div className="md:col-span-4 space-y-1">
                            <Label className="text-xs">{t('feesManagement.form.installmentName')}</Label>
                            <Input
                              placeholder={t('feesManagement.form.installmentNamePlaceholder')}
                              {...formik.getFieldProps(`installments.${index}.name`)}
                              className={
                                getErrorMessage(`installments.${index}.name`)
                                  ? 'border-red-500'
                                  : ''
                              }
                            />
                          </div>
                          <div className="md:col-span-3 space-y-1">
                            <Label className="text-xs">{t('feesManagement.form.amount')}</Label>
                            <Input
                              type="number"
                              placeholder={t('feesManagement.form.amount')}
                              value={installment.amount}
                              onChange={(e) =>
                                handleInstallmentAmountChange(index, Number(e.target.value))
                              }
                              className={
                                getErrorMessage(`installments.${index}.amount`)
                                  ? 'border-red-500'
                                  : ''
                              }
                            />
                          </div>
                          <div className="md:col-span-4 space-y-1">
                            <Label className="text-xs">{t('feesManagement.form.dueDate')}</Label>
                            <Input
                              type="date"
                              {...formik.getFieldProps(`installments.${index}.dueDate`)}
                              className={
                                getErrorMessage(`installments.${index}.dueDate`)
                                  ? 'border-red-500'
                                  : ''
                              }
                            />
                            {getErrorMessage(`installments.${index}.dueDate`) && (
                              <p className="text-xs text-red-500">
                                {getErrorMessage(`installments.${index}.dueDate`)}
                              </p>
                            )}
                          </div>
                          <div className="md:col-span-1 flex justify-center pb-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveInstallment(index)}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {formik.values.installments.length === 0 && (
                        <p className="text-sm text-red-500 italic text-center py-2">
                          {t('feesManagement.form.atLeastOneInstallment')}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('feesManagement.buttons.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={createFeeMutation.isPending || updateFeeMutation.isPending}
                >
                  {createFeeMutation.isPending || updateFeeMutation.isPending
                    ? t('feesManagement.buttons.saving')
                    : t('feesManagement.buttons.saveChanges')}
                </Button>
              </DialogFooter>
            </form>
          </FormikProvider>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-6">
        {isLoadingFees || isLoadingClasses ? (
          <p className="text-center text-gray-500 py-10">{t('feesManagement.table.loading')}</p>
        ) : feesList.length === 0 ? (
          <Card className="border-dashed border-2 bg-gray-50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">{t('feesManagement.table.noDataTitle')}</p>
              <p className="text-sm">{t('feesManagement.table.noDataSubtitle')}</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-md rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>{t('feesManagement.table.class')}</TableHead>
                    <TableHead>{t('feesManagement.table.annualFee')}</TableHead>
                    <TableHead>{t('feesManagement.table.latePenalty')}</TableHead>
                    <TableHead>{t('feesManagement.table.installments')}</TableHead>
                    <TableHead className="text-right">{t('feesManagement.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feesList.map((fee: FeeStructure) => {
                    let displayName = fee.className;
                    if (!displayName || displayName.trim() === '') {
                      const classObj = classes.find(
                        (c: ClassItem) => c.id.toString() === fee.classId
                      );
                      displayName = classObj ? classObj.class_name : `Class ID: ${fee.classId}`;
                    }
                    return (
                      <TableRow key={fee.id}>
                        <TableCell className="font-medium">{displayName}</TableCell>
                        <TableCell>₹{fee.annualFee.toLocaleString()}</TableCell>
                        <TableCell className="text-red-600">
                          ₹{fee.latePenalty.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {fee.installments.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {fee.installments.map((inst, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                  <Badge variant="secondary" className="w-fit text-xs font-normal">
                                    {inst.name}: ₹{inst.amount}
                                  </Badge>
                                  <span className="text-gray-500 text-xs text-nowrap">
                                    {t('feesManagement.table.due')}:{' '}
                                    {inst.dueDate
                                      ? new Date(inst.dueDate).toLocaleDateString()
                                      : 'N/A'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">{t('feesManagement.table.none')}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleEdit(fee)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(fee.classId)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
