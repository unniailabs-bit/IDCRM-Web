import React, { useState } from 'react';
import { Trash2, Lock, Unlock, Copy } from 'lucide-react';
import { ImageCropperModal } from './ImageCropperModal';
import { getCardSize } from '../utils';

const inputCls =
  'w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none';

const isHexColor = (v) => /^#[0-9a-f]{6}$/i.test(v || '');

// Color swatch + hex text, with optional "none" (transparent) toggle
const ColorField = ({ label, value, onChange, allowNone = false, fallback = '#000000' }) => {
  const isNone = !value || value === 'transparent';
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={isHexColor(value) ? value : fallback}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 rounded cursor-pointer border-0 p-0 shrink-0"
        />
        <input
          type="text"
          value={isNone && allowNone ? 'none' : value || fallback}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} min-w-0`}
        />
        {allowNone && (
          <button
            onClick={() => onChange('transparent')}
            title="No color"
            className={`h-8 px-2 text-xs rounded border shrink-0 ${isNone
              ? 'bg-blue-100 text-blue-700 border-blue-300'
              : 'border-gray-300 text-gray-500 hover:bg-gray-50'
              }`}
          >
            None
          </button>
        )}
      </div>
    </div>
  );
};

// Button group for picking one of a few options
const Segmented = ({ label, value, options, onChange }) => (
  <div>
    {label && <label className="block text-xs text-gray-500 mb-1">{label}</label>}
    <div className="flex border border-gray-300 rounded overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          title={opt.title}
          className={`flex-1 py-1.5 text-xs ${value === opt.value
            ? 'bg-blue-100 text-blue-700 font-medium'
            : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const NumberField = ({ label, value, onChange, step = 1, min, max }) => (
  <div>
    <label className="block text-xs text-gray-500 mb-1">{label}</label>
    <input
      type="number"
      step={step}
      min={min}
      max={max}
      value={value}
      onChange={(e) => {
        const n = parseFloat(e.target.value);
        onChange(Number.isFinite(n) ? n : 0);
      }}
      className={inputCls}
    />
  </div>
);

const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between text-xs text-gray-600 cursor-pointer">
    <span>{label}</span>
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 accent-blue-600 cursor-pointer"
    />
  </label>
);

const BORDER_STYLES = [
  { value: 'solid', label: '———', title: 'Solid' },
  { value: 'dashed', label: '- - -', title: 'Dashed' },
  { value: 'dotted', label: '· · ·', title: 'Dotted' },
];

const FONT_FAMILIES = [
  { value: '', label: 'Default' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
  { value: '"Trebuchet MS", sans-serif', label: 'Trebuchet MS' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
  { value: '"Courier New", Courier, monospace', label: 'Courier New' },
  { value: 'Impact, sans-serif', label: 'Impact' },
  { value: '"Noto Sans Devanagari", "Mangal", sans-serif', label: 'Devanagari (मराठी/हिंदी)' },
];

export const PropertiesPanel = ({
  selectedElement,
  onUpdate,
  onDelete,
  onDuplicate,
  template,
  onUpdateTemplate,
  ...props
}) => {
  const [croppingImageSrc, setCroppingImageSrc] = useState(null);

  if (!selectedElement) {
    const { widthMm, heightMm } = getCardSize(template);
    const aspectRatio = widthMm / heightMm;

    return (
      <div className="w-full h-full flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
            Template Properties
          </h2>
        </div>
        <div className="p-4 space-y-6">
          <section>
            <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase">Background Image</h3>
            <div className="space-y-3">
              <div className="flex flex-col space-y-2">
                {template?.backgroundImage ? (
                  <div className="relative group border rounded overflow-hidden">
                    <img
                      src={template.backgroundImage}
                      alt="Background"
                      className="w-full h-auto max-h-48 object-contain bg-gray-100"
                    />
                    <button
                      onClick={() =>
                        onUpdateTemplate((prev) => ({ ...prev, backgroundImage: null }))
                      }
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded shadow hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove Background"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic text-center py-4 border border-dashed rounded bg-gray-50">
                    No background image set
                  </div>
                )}

                <label className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 cursor-pointer">
                  <span>Upload Image</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setCroppingImageSrc(ev.target.result);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = null; // Reset
                      }
                    }}
                  />
                </label>
              </div>

              {template?.backgroundImage && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-gray-500">Opacity</label>
                    <span className="text-xs text-gray-400">
                      {Math.round((template.backgroundOpacity ?? 1) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={template.backgroundOpacity ?? 1}
                    onChange={(e) =>
                      onUpdateTemplate((prev) => ({
                        ...prev,
                        backgroundOpacity: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>
            {croppingImageSrc && (
              <ImageCropperModal
                isOpen={!!croppingImageSrc}
                onClose={() => setCroppingImageSrc(null)}
                imageSrc={croppingImageSrc}
                aspectRatio={aspectRatio}
                onCropComplete={(croppedImg) => {
                  onUpdateTemplate((prev) => ({
                    ...prev,
                    backgroundImage: croppedImg,
                  }));
                  setCroppingImageSrc(null);
                }}
              />
            )}
          </section>
        </div>
      </div>
    );
  }

  const handleChange = (key, value) => {
    onUpdate({ ...selectedElement, [key]: value });
  };

  const handleStyleChange = (key, value) => {
    onUpdate({
      ...selectedElement,
      style: { ...selectedElement.style, [key]: value },
    });
  };

  const isLine = ['line', 'vline'].includes(selectedElement.subType);
  const fillType = selectedElement.style?.fillType || 'solid';

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Properties</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleChange('locked', !selectedElement.locked)}
            className={`p-1.5 rounded transition-colors ${selectedElement.locked
                ? 'bg-orange-100 text-orange-600'
                : 'hover:bg-gray-200 text-gray-500'
              }`}
            title={selectedElement.locked ? 'Unlock' : 'Lock'}
          >
            {selectedElement.locked ? <Lock size={16} /> : <Unlock size={16} />}
          </button>
          <button
            onClick={onDuplicate}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
            title="Duplicate"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-100 rounded text-red-500"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Layout */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase">Layout (mm)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X Position</label>
              <input
                type="number"
                disabled={selectedElement.locked}
                value={selectedElement.x}
                onChange={(e) => handleChange('x', parseFloat(e.target.value))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y Position</label>
              <input
                type="number"
                disabled={selectedElement.locked}
                value={selectedElement.y}
                onChange={(e) => handleChange('y', parseFloat(e.target.value))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Width</label>
              <input
                type="number"
                disabled={selectedElement.locked}
                value={selectedElement.width}
                onChange={(e) => handleChange('width', parseFloat(e.target.value))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Height</label>
              <input
                type="number"
                disabled={selectedElement.locked}
                value={selectedElement.height}
                onChange={(e) => handleChange('height', parseFloat(e.target.value))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Rotation (deg)</label>
              <input
                type="number"
                disabled={selectedElement.locked}
                value={selectedElement.style?.rotation || 0}
                onChange={(e) => handleStyleChange('rotation', parseFloat(e.target.value))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400 text-right">
            Ratio:{' '}
            {selectedElement.height
              ? (selectedElement.width / selectedElement.height).toFixed(2)
              : '-'}{' '}
            : 1
          </div>
        </section>

        {/* Typography - only for text enabled elements */}
        {selectedElement.type !== 'image' && selectedElement.type !== 'shape' && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase">Typography</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Content</label>
                <input
                  type="text"
                  value={selectedElement.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Size (pt)</label>
                  <input
                    type="number"
                    value={selectedElement.style?.fontSize || 12}
                    onChange={(e) => handleStyleChange('fontSize', parseFloat(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Weight</label>
                  <select
                    value={selectedElement.style?.fontWeight || 'normal'}
                    onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="500">Medium</option>
                    <option value="600">Semi Bold</option>
                    <option value="300">Light</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={selectedElement.style?.color || '#000000'}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={selectedElement.style?.color || '#000000'}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Font</label>
                <select
                  value={selectedElement.style?.fontFamily || ''}
                  onChange={(e) => handleStyleChange('fontFamily', e.target.value || undefined)}
                  className={inputCls}
                  style={{ fontFamily: selectedElement.style?.fontFamily || undefined }}
                >
                  {FONT_FAMILIES.map((f) => (
                    <option key={f.label} value={f.value} style={{ fontFamily: f.value || undefined }}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Style</label>
                <div className="flex border border-gray-300 rounded overflow-hidden">
                  {[
                    { key: 'fontWeight', on: 'bold', off: 'normal', label: 'B', cls: 'font-bold', title: 'Bold' },
                    { key: 'fontStyle', on: 'italic', off: 'normal', label: 'I', cls: 'italic', title: 'Italic' },
                    { key: 'textDecoration', on: 'underline', off: 'none', label: 'U', cls: 'underline', title: 'Underline' },
                    { key: 'textDecoration', on: 'line-through', off: 'none', label: 'S', cls: 'line-through', title: 'Strikethrough' },
                  ].map((opt) => {
                    const active = selectedElement.style?.[opt.key] === opt.on;
                    return (
                      <button
                        key={opt.title}
                        title={opt.title}
                        onClick={() => handleStyleChange(opt.key, active ? opt.off : opt.on)}
                        className={`flex-1 py-1.5 text-sm ${opt.cls} ${active
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Letter Spacing (px)"
                  step={0.1}
                  value={selectedElement.style?.letterSpacing || 0}
                  onChange={(v) => handleStyleChange('letterSpacing', v)}
                />
                <NumberField
                  label="Line Height"
                  step={0.05}
                  min={0.5}
                  value={selectedElement.style?.lineHeight || 1.2}
                  onChange={(v) => handleStyleChange('lineHeight', v || 1.2)}
                />
              </div>

              <ColorField
                label="Highlight / Background"
                allowNone
                fallback="#ffff00"
                value={selectedElement.style?.backgroundColor}
                onChange={(v) => handleStyleChange('backgroundColor', v)}
              />

              <div className="grid grid-cols-2 gap-3 items-end">
                <NumberField
                  label="Corner Radius (mm)"
                  step={0.5}
                  min={0}
                  value={selectedElement.style?.cornerRadius || 0}
                  onChange={(v) => handleStyleChange('cornerRadius', Math.max(0, v))}
                />
                <div className="pb-2">
                  <Toggle
                    label="Text Shadow"
                    checked={selectedElement.style?.shadow}
                    onChange={(v) => handleStyleChange('shadow', v)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Text Transform</label>
                <div className="flex border border-gray-300 rounded overflow-hidden">
                  {[
                    { value: 'none', label: 'Regular' },
                    { value: 'uppercase', label: 'ABC' },
                    { value: 'lowercase', label: 'abc' },
                    { value: 'capitalize', label: 'Abc' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleStyleChange('textTransform', opt.value)}
                      className={`flex-1 py-1.5 text-xs ${selectedElement.style?.textTransform === opt.value
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Alignment</label>
                <div className="flex border border-gray-300 rounded overflow-hidden">
                  {['left', 'center', 'right'].map((align) => (
                    <button
                      key={align}
                      onClick={() => handleStyleChange('textAlign', align)}
                      className={`flex-1 py-1.5 text-xs capitalize ${selectedElement.style?.textAlign === align
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Vertical Alignment</label>
                <div className="flex border border-gray-300 rounded overflow-hidden">
                  {['top', 'center', 'bottom'].map((align) => (
                    <button
                      key={align}
                      onClick={() => handleStyleChange('verticalAlign', align)}
                      className={`flex-1 py-1.5 text-xs capitalize ${selectedElement.style?.verticalAlign === align
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Style/Appearance for shapes */}
        {selectedElement.type === 'shape' && isLine && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase">Line</h3>
            <div className="space-y-3">
              <NumberField
                label="Thickness (px)"
                step={0.5}
                min={0.5}
                value={parseFloat(selectedElement.style?.borderWidth ?? 1) || 0}
                onChange={(v) => handleStyleChange('borderWidth', String(Math.max(0.5, v)))}
              />
              <ColorField
                label="Color"
                value={selectedElement.style?.borderColor}
                onChange={(v) => handleStyleChange('borderColor', v)}
              />
              <Segmented
                label="Style"
                value={selectedElement.style?.borderStyle || 'solid'}
                options={[...BORDER_STYLES, { value: 'double', label: '═══', title: 'Double (needs 3px+)' }]}
                onChange={(v) => handleStyleChange('borderStyle', v)}
              />
            </div>
          </section>
        )}

        {selectedElement.type === 'shape' && !isLine && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase">Fill</h3>
            <div className="space-y-3">
              <Segmented
                value={fillType}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'solid', label: 'Solid' },
                  { value: 'gradient', label: 'Gradient' },
                ]}
                onChange={(v) => handleStyleChange('fillType', v)}
              />
              {fillType === 'solid' && (
                <ColorField
                  label="Color"
                  allowNone
                  fallback="#3b82f6"
                  value={selectedElement.style?.backgroundColor}
                  onChange={(v) => handleStyleChange('backgroundColor', v)}
                />
              )}
              {fillType === 'gradient' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <ColorField
                      label="From"
                      fallback="#3b82f6"
                      value={selectedElement.style?.gradientFrom || '#3b82f6'}
                      onChange={(v) => handleStyleChange('gradientFrom', v)}
                    />
                    <ColorField
                      label="To"
                      fallback="#1e3a8a"
                      value={selectedElement.style?.gradientTo || '#1e3a8a'}
                      onChange={(v) => handleStyleChange('gradientTo', v)}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-gray-500">Direction</label>
                      <span className="text-xs text-gray-400">
                        {selectedElement.style?.gradientAngle ?? 90}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="15"
                      value={selectedElement.style?.gradientAngle ?? 90}
                      onChange={(e) => handleStyleChange('gradientAngle', parseInt(e.target.value, 10))}
                      className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>

            <h3 className="text-xs font-semibold text-gray-500 mt-5 mb-3 uppercase">Border</h3>
            <div className="space-y-3">
              <NumberField
                label="Width (px)"
                step={0.5}
                min={0}
                value={parseFloat(selectedElement.style?.borderWidth ?? 1) || 0}
                onChange={(v) => handleStyleChange('borderWidth', String(Math.max(0, v)))}
              />
              <ColorField
                label="Color"
                value={selectedElement.style?.borderColor}
                onChange={(v) => handleStyleChange('borderColor', v)}
              />
              <Segmented
                label="Style"
                value={selectedElement.style?.borderStyle || 'solid'}
                options={BORDER_STYLES}
                onChange={(v) => handleStyleChange('borderStyle', v)}
              />
              {['rectangle', 'roundedRect'].includes(selectedElement.subType) && (
                <NumberField
                  label="Corner Radius (mm)"
                  step={0.5}
                  min={0}
                  value={selectedElement.style?.cornerRadius || 0}
                  onChange={(v) => handleStyleChange('cornerRadius', Math.max(0, v))}
                />
              )}
              <Toggle
                label="Drop Shadow"
                checked={selectedElement.style?.shadow}
                onChange={(v) => handleStyleChange('shadow', v)}
              />
            </div>
          </section>
        )}

        {/* Image Properties */}
        {selectedElement.type === 'image' && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase">Image Properties</h3>
            <div className="space-y-3">
              <div className="flex flex-col space-y-2">
                <div className="relative group border rounded overflow-hidden bg-gray-100">
                  <img
                    src={selectedElement.data?.src}
                    alt="Preview"
                    className="w-full h-32 object-contain"
                  />
                </div>
                <label className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 cursor-pointer">
                  <span>Change Image</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          onUpdate({
                            ...selectedElement,
                            data: { ...selectedElement.data, src: ev.target.result },
                          });
                        };
                        reader.readAsDataURL(file);
                        e.target.value = null;
                      }
                    }}
                  />
                </label>
              </div>

              {/* Image Fit */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Image Fit</label>
                <div className="flex border border-gray-300 rounded overflow-hidden">
                  {[
                    { value: 'cover', label: 'Cover' },
                    { value: 'contain', label: 'Contain' },
                    { value: 'fill', label: 'Fill' },
                    { value: 'none', label: 'None' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleStyleChange('objectFit', opt.value)}
                      className={`flex-1 py-1.5 text-xs ${(selectedElement.style?.objectFit || 'contain') === opt.value
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedElement.style?.objectFit === 'cover' && 'Fills box, crops overflow — best for photos.'}
                  {selectedElement.style?.objectFit === 'contain' && 'Fits inside box with padding — no cropping.'}
                  {selectedElement.style?.objectFit === 'fill' && 'Stretches to fill exactly — may distort.'}
                  {(!selectedElement.style?.objectFit || selectedElement.style?.objectFit === 'none') && 'Natural size, no scaling.'}
                </p>
              </div>

              {/* Image Position */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Image Position</label>
                <select
                  value={selectedElement.style?.objectPosition || 'center'}
                  onChange={(e) => handleStyleChange('objectPosition', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="center">Center</option>
                  <option value="center top">Center Top (Face)</option>
                  <option value="center bottom">Center Bottom</option>
                  <option value="left center">Left Center</option>
                  <option value="right center">Right Center</option>
                  <option value="top left">Top Left</option>
                  <option value="top right">Top Right</option>
                </select>
              </div>

            </div>

            <h3 className="text-xs font-semibold text-gray-500 mt-5 mb-3 uppercase">Frame</h3>
            <div className="space-y-3">
              <Toggle
                label="Circle Crop"
                checked={selectedElement.style?.circle}
                onChange={(v) => handleStyleChange('circle', v)}
              />
              {!selectedElement.style?.circle && (
                <NumberField
                  label="Corner Radius (mm)"
                  step={0.5}
                  min={0}
                  value={selectedElement.style?.cornerRadius || 0}
                  onChange={(v) => handleStyleChange('cornerRadius', Math.max(0, v))}
                />
              )}
              <NumberField
                label="Border Width (px)"
                step={0.5}
                min={0}
                value={parseFloat(selectedElement.style?.borderWidth) || 0}
                onChange={(v) => handleStyleChange('borderWidth', String(Math.max(0, v)))}
              />
              {parseFloat(selectedElement.style?.borderWidth) > 0 && (
                <>
                  <ColorField
                    label="Border Color"
                    value={selectedElement.style?.borderColor}
                    onChange={(v) => handleStyleChange('borderColor', v)}
                  />
                  <Segmented
                    label="Border Style"
                    value={selectedElement.style?.borderStyle || 'solid'}
                    options={BORDER_STYLES}
                    onChange={(v) => handleStyleChange('borderStyle', v)}
                  />
                </>
              )}
              <Toggle
                label="Drop Shadow"
                checked={selectedElement.style?.shadow}
                onChange={(v) => handleStyleChange('shadow', v)}
              />
              <Toggle
                label="Black & White"
                checked={selectedElement.style?.grayscale}
                onChange={(v) => handleStyleChange('grayscale', v)}
              />
            </div>
          </section>
        )}

        {/* Opacity - all element types */}
        <section>
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Opacity</h3>
            <span className="text-xs text-gray-400">
              {Math.round((selectedElement.style?.opacity ?? 1) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={selectedElement.style?.opacity ?? 1}
            onChange={(e) => handleStyleChange('opacity', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </section>

        {/* Z-Index / Layering */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase">Layering</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleStyleChange('zIndex', (selectedElement.style?.zIndex || 0) + 1)}
              className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
            >
              Bring Forward
            </button>
            <button
              onClick={() =>
                handleStyleChange('zIndex', Math.max(0, (selectedElement.style?.zIndex || 0) - 1))
              }
              className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
            >
              Send Backward
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
