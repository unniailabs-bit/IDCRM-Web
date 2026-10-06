import React from 'react';
import { useTranslation } from "react-i18next";
import {
  Type,
  Image,
  Square,
  User,
  Building,
  MapPin,
  PenTool,
  Phone,
  Mail,
  CreditCard,
  Users,
  Droplet,
  LayoutTemplate,
  SquareRoundCorner,
  Circle,
  Minus,
  SeparatorVertical,
  Triangle,
  TriangleRight,
  Diamond,
  Pentagon,
  Hexagon,
  Star,
  MoveRight,
  ChevronRight,
  Bookmark,
  Slash,
} from 'lucide-react';

// Default look for filled shapes: solid blue, no border
const FILLED = {
  fillType: 'solid',
  backgroundColor: '#3b82f6',
  borderWidth: '0',
  borderColor: '#1e3a8a',
};

export const Toolbar = ({ onAddElement }) => {
  const { t } = useTranslation();

  const TOOLS_CATEGORIES = [
    {
      title: t("translation.shapesStatic"),
      items: [
        { type: 'text', label: t("translation.staticText"), icon: Type, defaultData: { text: 'Text' } },
        { type: 'shape', label: t("translation.rectangle"), icon: Square, subType: 'rectangle' },
        {
          type: 'shape',
          label: t("translation.roundedRectangle", "Rounded Rect"),
          icon: SquareRoundCorner,
          subType: 'roundedRect',
          defaultSize: { width: 30, height: 15 },
          defaultStyle: { ...FILLED, cornerRadius: 3 },
        },
        {
          type: 'shape',
          label: t("translation.circle", "Circle"),
          icon: Circle,
          subType: 'ellipse',
          defaultSize: { width: 20, height: 20 },
          defaultStyle: FILLED,
        },
        { type: 'shape', label: t("translation.line"), icon: Minus, subType: 'line' },
        {
          type: 'shape',
          label: t("translation.verticalLine", "Vertical Line"),
          icon: SeparatorVertical,
          subType: 'vline',
          defaultSize: { width: 2, height: 30 },
          defaultStyle: { borderWidth: '1', borderColor: '#000000' },
        },
        ...[
          { subType: 'triangle', icon: Triangle, key: 'triangle', label: 'Triangle' },
          { subType: 'rightTriangle', icon: TriangleRight, key: 'rightTriangle', label: 'Right Triangle' },
          { subType: 'diamond', icon: Diamond, key: 'diamond', label: 'Diamond' },
          { subType: 'pentagon', icon: Pentagon, key: 'pentagon', label: 'Pentagon' },
          { subType: 'hexagon', icon: Hexagon, key: 'hexagon', label: 'Hexagon' },
          { subType: 'star', icon: Star, key: 'star', label: 'Star' },
          { subType: 'arrow', icon: MoveRight, key: 'arrow', label: 'Arrow', size: { width: 25, height: 12 } },
          { subType: 'chevron', icon: ChevronRight, key: 'chevron', label: 'Chevron', size: { width: 25, height: 12 } },
          { subType: 'banner', icon: Bookmark, key: 'banner', label: 'Ribbon Banner', size: { width: 40, height: 10 } },
          { subType: 'parallelogram', icon: Slash, key: 'parallelogram', label: 'Slant Strip', size: { width: 40, height: 10 } },
        ].map((s) => ({
          type: 'shape',
          subType: s.subType,
          icon: s.icon,
          label: t(`translation.${s.key}`, s.label),
          defaultSize: s.size || { width: 20, height: 20 },
          defaultStyle: FILLED,
        })),
        {
          type: 'image',
          label: t("translation.staticImage"),
          icon: Image,
          subType: 'static',
          defaultData: { src: 'https://placehold.co/100x100?text=Image' },
        },
      ],
    },
    {
      title: t("translation.schoolDetails"),
      items: [
        {
          type: 'image',
          label: t("translation.schoolLogo"),
          icon: Building,
          field: 'school.logo',
          defaultData: { src: 'https://placehold.co/100x100' },
        },
        {
          type: 'field',
          label: t("translation.schoolName"),
          icon: Building,
          field: 'school.name',
          defaultData: { text: 'School Name' },
        },
        {
          type: 'field',
          label: t("translation.schoolAddress"),
          icon: MapPin,
          field: 'school.address',
        },
        {
          type: 'field',
          label: t("translation.trustName"),
          icon: Building,
          field: 'school.trust_name',
        },
        {
          type: 'image',
          label: t("translation.principalSign"),
          icon: PenTool,
          field: 'school.principal_sign',
        },
      ],
    },
    {
      title: t("translation.studentDetails"),
      items: [
        {
          type: 'image',
          label: t("translation.studentPhoto"),
          icon: User,
          field: 'student.photo',
        },
        {
          type: 'image',
          label: t("translation.studentSignature"),
          icon: PenTool,
          field: 'student.student_signature',
        },
        {
          type: 'field',
          label: t("translation.rollNumber"),
          icon: CreditCard,
          field: 'student.roll_number',
        },
        {
          type: 'field',
          label: t("translation.studentName"),
          icon: User,
          field: 'student.name',
        },
        {
          type: 'field',
          label: t("translation.classStandard"),
          icon: LayoutTemplate,
          field: 'student.standard',
        },
        {
          type: 'field',
          label: t("translation.dob"),
          icon: CreditCard,
          field: 'student.dob',
        },
        {
          type: 'field',
          label: t("translation.gender"),
          icon: User,
          field: 'student.gender',
        },
        {
          type: 'field',
          label: t("translation.bloodGroup"),
          icon: Droplet,
          field: 'student.blood_group',
        },
        {
          type: 'field',
          label: t("translation.address"),
          icon: MapPin,
          field: 'student.address',
        },
        {
          type: 'field',
          label: t("translation.fatherName"),
          icon: Users,
          field: 'student.father_name',
        },
        {
          type: 'field',
          label: t("translation.motherName"),
          icon: Users,
          field: 'student.mother_name',
        },
        {
          type: 'field',
          label: t("translation.fatherContact"),
          icon: Phone,
          field: 'student.father_phone',
        },
        {
          type: 'field',
          label: t("translation.motherContact"),
          icon: Phone,
          field: 'student.mother_phone',
        },
        {
          type: 'field',
          label: t("translation.parentEmail"),
          icon: Mail,
          field: 'student.parent_email',
        },
        {
          type: 'field',
          label: t("translation.emergencyContact"),
          icon: Phone,
          field: 'student.emergency_contact',
        },
      ],
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200 shrink-0">
        <h2 className="text-lg font-semibold text-gray-800">
          {t("translation.toolbox")}
        </h2>
        <p className="text-sm text-gray-500">
          {t("translation.clickToAdd")}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {TOOLS_CATEGORIES.map((category, catIndex) => (
          <div key={catIndex} className="mb-1">
            <div className="bg-gray-100 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-y border-gray-200 sticky top-0 z-10">
              {category.title}
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {category.items.map((tool, index) => (
                <button
                  key={index}
                  onClick={() => onAddElement(tool)}
                  className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group bg-white"
                >
                  <tool.icon className="w-6 h-6 text-gray-600 group-hover:text-blue-600 mb-2 transition-colors" />
                  <span className="text-xs text-center text-gray-700 font-medium group-hover:text-blue-700 leading-tight transition-colors">
                    {tool.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 border-t border-gray-200 bg-gray-50 text-center shrink-0">
        <p className="text-[10px] text-gray-400">
          {t("translation.version")}
        </p>
      </div>
    </div>
  );
};