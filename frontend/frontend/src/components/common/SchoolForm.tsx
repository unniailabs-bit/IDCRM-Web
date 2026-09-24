import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useTranslation } from 'react-i18next';

interface SchoolFormProps {
  formData: any;
  errors: any;
  showPassword?: boolean;
  showConfirmPassword?: boolean;
  editingSchool: boolean;
  allTrusts?: any[];
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => void;
  setShowPassword?: (show: boolean) => void;
  setShowConfirmPassword?: (show: boolean) => void;
  handleSelectChange?: (value: string) => void;
}

export function SchoolForm({
  formData,
  errors,
  showPassword,
  showConfirmPassword,
  editingSchool,
  allTrusts,
  handleChange,
  handleSubmit,
  setShowPassword,
  setShowConfirmPassword,
  handleSelectChange,
}: SchoolFormProps) {
  const { t } = useTranslation();
  return (
    <>
      <h3 className="text-lg font-medium mb-4">{editingSchool ? t('schools.editSchool') : t('schools.addSchool')}</h3>
      <div className="mt-6 p-4 border rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">{t('schools.schoolName')}</Label>
            <Input
              type="text"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleChange}
              className={`w-full mt-1 p-2 border rounded bg-gray-50 ${errors.schoolName ? "border-red-500" : "border-gray-300"
                }`}
              placeholder={t('schools.enterSchoolName')}
            />
            {errors.schoolName && (
              <p className="text-xs text-red-500 mt-1">
                {errors.schoolName}
              </p>
            )}
          </div>

          {allTrusts && allTrusts.length > 0 && (
            <div>
              <div className="space-y-2">
                <Label htmlFor="trust_name">{t('schools.trust')}</Label>
                <Input
                  type="text"
                  value={formData.trust_name}
                  readOnly
                  // disabled
                  className="w-full mt-1 p-2 border rounded bg-gray-100 text-gray-900 cursor-not-allowed"
                />
                {/* {editingSchool ? (
                  <Input
                    type="text"
                    value={formData.trust_name}
                    readOnly
                    disabled
                    className="w-full mt-1 p-2 border rounded bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                ) : (
                  <Select value={formData.trust_name} onValueChange={handleSelectChange}>
                    <SelectTrigger id="trust_name" className="w-full mt-1 p-2 border rounded bg-gray-50">
                      <SelectValue placeholder="Select trust" />
                    </SelectTrigger>
                    <SelectContent>
                      {allTrusts.map((trust) => (
                        <SelectItem key={trust.id} value={trust.trust_name}>
                          {trust.trust_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} */}
              </div>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium">{t('schools.schoolAdminName')}</Label>
            <Input
              type="text"
              name="schoolAdminName"
              value={formData.schoolAdminName}
              onChange={handleChange}
              className={`w-full mt-1 p-2 border rounded bg-gray-50 ${errors.schoolAdminName ? "border-red-500" : "border-gray-300"
                }`}
              placeholder={t('schools.enterAdminName')}
            />
            {errors.schoolAdminName && (
              <p className="text-xs text-red-500 mt-1">
                {errors.schoolAdminName}
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium">{t('common.email')}</Label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full mt-1 p-2 border rounded bg-gray-50 ${errors.email ? "border-red-500" : "border-gray-300"
                }`}
              placeholder={t('schools.enterEmail')}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium">{t('common.phone')}</Label>
            <Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              maxLength={10}
              className={`w-full mt-1 p-2 border rounded bg-gray-50 ${errors.phone ? "border-red-500" : "border-gray-300"
                }`}
              placeholder={t('schools.enterPhone')}
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">
                {errors.phone}
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium">{t('schools.address')}</Label>
            <Input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`w-full mt-1 p-2 border rounded bg-gray-50 ${errors.address ? "border-red-500" : "border-gray-300"
                }`}
              placeholder={t('schools.address')}
            />
            {errors.address && (
              <p className="text-xs text-red-500 mt-1">
                {errors.address}
              </p>
            )}
          </div>

          {setShowPassword && (
            <div>
              <Label className="text-sm font-medium">{t('common.password')}</Label>
              <div className="relative flex items-center">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full mt-1 p-2 border rounded bg-gray-50 pr-10 ${errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                  placeholder={editingSchool ? t('schools.leaveEmptyPassword') : t('common.passwordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 px-3 flex items-center text-gray-500 h-full"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.password}
                </p>
              )}
            </div>
          )}

          {setShowPassword && (
            <div>
              <Label className="text-sm font-medium">{t('schools.confirmPassword')}</Label>
              <div className="relative flex items-center">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full mt-1 p-2 border rounded bg-gray-50 pr-10 ${errors.confirmPassword ? "border-red-500" : "border-gray-300"
                    }`}
                  placeholder={t('schools.confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 px-3 flex items-center text-gray-500 h-full"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-2">
          </div>
        </div>
      </div>
    </>
  );
}

