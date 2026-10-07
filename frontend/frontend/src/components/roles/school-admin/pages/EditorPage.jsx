import { school } from '../consts/studentsConst';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Toolbar } from '../components/Toolbar';
import { Canvas } from '../components/Canvas';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { LayersPanel } from '../components/LayersPanel';
import { PrintPreview } from '../components/PrintPreview';
import { useTranslation } from 'react-i18next';
import {
  Printer,
  Save,
  Download,
  Upload,
  Layout,
  Image as ImageIcon,
  Undo,
  Redo,
  Minus,
  Plus,
  X,
  Languages,
  RectangleHorizontal,
  RectangleVertical,
} from 'lucide-react';
import { TemplateManager } from '../components/TemplateManager';
import { CardLayoutSettings } from '../components/CardLayoutSettings';
import {
  loadTemplates,
  saveTemplateRemote,
  normalizeTemplate,
  getActiveTemplateId,
  setActiveTemplateId,
} from '../templateStorage';
import { translateBatch } from '../../../../utils/translationService'; // Import translation service

import { defaultTemplate } from '../consts/defaultTemplate';
import { useAuth } from '@/hooks/useAuth';
import axiosInstance from '@/api/axiosInstance';

const generateMockStudents = (schoolData) => Array.from({ length: 25 }).map((_, i) => ({
  id: i + 1,
  roll_number: 100 + i,
  name: `Student Name ${i + 1}`,
  student_name: `Student Name ${i + 1}`,
  standard: school.class || `Class ${10 + (i % 3)} - A`,
  dob: `0${(i % 9) + 1}/01/200${i % 10}`,
  gender: i % 2 === 0 ? 'Male' : 'Female',
  blood_group: ['A+', 'B+', 'O+', 'AB+'][i % 4],
  address: `${i + 1} Main St, City, Country, 411001`,
  father_name: `Father Name ${i + 1}`,
  mother_name: `Mother Name ${i + 1}`,
  father_phone: `98123456${i % 10}${i % 10}`,
  mother_phone: `98123456${(i + 1) % 10}${(i + 1) % 10}`,
  parent_email: `parent${i + 1}@gmail.com`,
  emergency_contact: `98123456${(i + 2) % 10}${(i + 2) % 10}`,
  photo: 'https://placehold.co/150x150?text=Photo',
  school_name: schoolData.name || school.name,
  school_address: schoolData.address || school.address,
  trust_name: schoolData.trust_name || school.trust_name,
  school_logo: schoolData.school_logo || school.school_logo,
  principal_sign: schoolData.principal_sign || school.principal_sign,
}));

export const EditorPage = () => {
  const { t } = useTranslation();
  const [template, setTemplate] = useState({
    id: null,
    name: t('editor.untitledTemplate'),
    elements: [],
    orientation: 'horizontal',
  });

  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState('properties');
  const [scale, setScale] = useState(1);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [printLanguage, setPrintLanguage] = useState('en');
  const [isLangLoading, setIsLangLoading] = useState(false);
  const [canvasTranslations, setCanvasTranslations] = useState({}); // Store translations for canvas
  const [translationProgress, setTranslationProgress] = useState(0);

  const { userData } = useAuth();
  const [schoolDataState, setSchoolDataState] = useState(school);
  const [mockStudents, setMockStudents] = useState(generateMockStudents(school));

  useEffect(() => {
    const fetchSchoolAssets = async () => {
      if (!userData?.id) return;
      try {
        const profileRes = await axiosInstance.get('/api/school/settings/profile');
        if (profileRes.data.success) {
          const data = profileRes.data.data;
          const schoolId = data.id || userData.id;

          const [logoRes, signRes] = await Promise.allSettled([
            axiosInstance.get(`/api/school/${schoolId}/logo`),
            axiosInstance.get(`/api/school/${schoolId}/principal-sign`),
          ]);

          const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://idcrm-backend-909168107470.asia-south1.run.app';

          const newSchoolData = {
            ...school,
            name: data.school_name || userData?.name || school.name,
            address: data.address || userData?.address || school.address,
            trust_name: data.trust_name || userData?.trust_name || school.trust_name,
            school_logo: (logoRes.status === 'fulfilled' && logoRes.value.data.success && logoRes.value.data.logo)
              ? `${BASE_URL}${logoRes.value.data.logo}` : school.school_logo,
            principal_sign: (signRes.status === 'fulfilled' && signRes.value.data.success && signRes.value.data.principal_sign)
              ? `${BASE_URL}${signRes.value.data.principal_sign}` : school.principal_sign,
          };

          setSchoolDataState(newSchoolData);
          setMockStudents(generateMockStudents(newSchoolData));
        }
      } catch (error) {
        console.error('Error fetching school data for editor:', error);
      }
    };

    fetchSchoolAssets();
  }, [userData]);

  // Effect to translate canvas elements when language changes
  useEffect(() => {
    const translateCanvas = async () => {
      if (printLanguage === 'en') {
        setCanvasTranslations({});
        setTranslationProgress(0);
        return;
      }

      setIsLangLoading(true);
      setTranslationProgress(0.1); // Start at 10%
      const textsToTranslate = new Set();

      // Collect text from all elements
      template.elements.forEach((el) => {
        if ((el.type === 'text' || el.type === 'field') && el.content) {
          textsToTranslate.add(String(el.content).trim());
        }
        // Also translate internal field labels if they are statically displayed?
        // For fields, we usually show placeholders like "{Student Name}".
        // Translating placeholders might be confusing or useful.
        // Let's stick to user-defined static text for now as that's most layout-critical.
      });

      if (textsToTranslate.size > 0) {
        try {
          const result = await translateBatch(
            Array.from(textsToTranslate),
            printLanguage,
            (progress) => setTranslationProgress(progress)
          );
          setCanvasTranslations(result);
        } catch (e) {
          console.error('Canvas translation failed', e);
        }
      } else {
        setTranslationProgress(1);
      }
      setIsLangLoading(false);
    };

    translateCanvas();
  }, [printLanguage, template.elements]); // Re-run if elements change (e.g. text edit)

  // Resize Logic for Right Panel
  const [rightPanelWidth, setRightPanelWidth] = useState(288); // Default w-72 (18rem = 288px)
  const isResizingRight = useRef(false);

  const startResizingRight = useCallback(() => {
    isResizingRight.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizingRight = useCallback(() => {
    isResizingRight.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const handleResizeRight = useCallback((e) => {
    if (!isResizingRight.current) return;
    const newWidth = window.innerWidth - e.clientX;
    // Limits: min 200px (approx w-48), max 600px
    if (newWidth >= 200 && newWidth <= 600) {
      setRightPanelWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleResizeRight);
    window.addEventListener('mouseup', stopResizingRight);
    return () => {
      window.removeEventListener('mousemove', handleResizeRight);
      window.removeEventListener('mouseup', stopResizingRight);
    };
  }, [handleResizeRight, stopResizingRight]);

  // History State
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Use a ref to track if we should ignore the next template change (e.g. during undo/redo)
  const isUndoing = useRef(false);

  const pushToHistory = (newTemplate) => {
    if (isUndoing.current) return;

    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      // Limit history size if needed, e.g. 50?
      if (newHistory.length > 50) newHistory.shift();
      return [...newHistory, newTemplate];
    });
    setHistoryIndex((prev) => {
      const newLength = prev + 1 < 50 ? prev + 1 : 50; // approximate logic, simple increment is safer with slice
      return history.slice(0, historyIndex + 1).length;
    });
  };

  // Better history approach:
  // When making a change, call setTemplate AND addToHistory
  // But wait, setTemplate is async.

  // Let's create a centralized updater
  const updateTemplate = (newData, saveToHistory = true) => {
    setTemplate((prev) => {
      const next = typeof newData === 'function' ? newData(prev) : newData;
      if (saveToHistory) {
        setHistory((h) => {
          const current = h.slice(0, historyIndex + 1);
          return [...current, next];
        });
        setHistoryIndex((i) => i + 1);
      }
      return next;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setTemplate(history[prevIndex]);
      setHistoryIndex(prevIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setTemplate(history[nextIndex]);
      setHistoryIndex(nextIndex);
    }
  };

  // Reference Image State
  const [referenceImage, setReferenceImage] = useState(null);
  const [referenceOpacity, setReferenceOpacity] = useState(0.5);

  const referenceInputRef = useRef(null);
  const layoutSettingsRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load this school's templates from the server (older browser-only templates are
  // moved up automatically the first time).
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      let chosen = null;
      try {
        const templates = await loadTemplates();
        const activeId = getActiveTemplateId();
        chosen = templates.find((tpl) => tpl.id === activeId) || templates[0] || null;
      } catch (e) {
        console.error('Failed to load templates from server', e);
        alert(
          t(
            'editor.loadFailed',
            'Could not load your saved templates from the server. Showing a blank template.'
          )
        );
      }
      if (cancelled) return;

      const initial = normalizeTemplate(
        chosen || {
          ...defaultTemplate,
          id: crypto.randomUUID(),
          name: t('editor.defaultTemplate'),
          lastModified: Date.now(),
        }
      );
      setTemplate(initial);
      setHistory([initial]);
      setHistoryIndex(0);
      if (chosen) setActiveTemplateId(chosen.id);
    };

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Current template including any card size / layout edits still pending in the popup
  const getCurrentTemplate = () => {
    const pendingLayout = layoutSettingsRef.current?.flush();
    return normalizeTemplate({ ...template, ...pendingLayout });
  };

  const saveTemplate = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const current = getCurrentTemplate();
      const saved = await saveTemplateRemote({ ...current, id: current.id || crypto.randomUUID() });

      // Only take server-assigned fields so edits made while saving aren't overwritten
      setTemplate((prev) => ({ ...prev, id: saved.id, lastModified: saved.lastModified }));
      setActiveTemplateId(saved.id);

      alert(t('editor.saveSuccess'));
    } catch (e) {
      console.error(e);
      alert(t('editor.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const loadTemplate = (tpl) => {
    updateTemplate(normalizeTemplate(tpl), true);
    setActiveTemplateId(tpl.id); // the Student Data sheet opens this template next
  };

  const addElement = (tool) => {
    const newElement = {
      id: crypto.randomUUID(),
      type: tool.type,
      subType: tool.subType,
      x: 10,
      y: 10,
      width:
        tool.defaultSize?.width ??
        (tool.field === 'school.principal_sign'
          ? 35
          : tool.type === 'image'
            ? 20
            : tool.subType === 'line'
              ? 30
              : 40),
      height:
        tool.defaultSize?.height ??
        (tool.field === 'school.principal_sign' ? 10 : tool.subType === 'line' ? 2 : 10),
      content: tool.defaultData?.text || '',
      data: tool.defaultData || {},
      field: tool.field,
      style: {
        fontSize: 12,
        fontWeight: 'normal',
        color: '#000000',
        zIndex: template.elements.length + 1,
        ...(tool.subType === 'line' && { borderWidth: '1', borderColor: '#000000' }),
        ...(tool.subType === 'rectangle' && {
          borderWidth: '1',
          borderColor: '#000000',
          backgroundColor: 'transparent',
        }),
        ...tool.defaultStyle,
      },
    };

    updateTemplate((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
    setSelectedId(newElement.id);
  };

  const updateElement = (updatedElement) => {
    updateTemplate((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === updatedElement.id ? updatedElement : el)),
    }));
  };

  const toggleOrientation = () => {
    updateTemplate((prev) => ({
      ...prev,
      orientation: prev.orientation === 'horizontal' ? 'vertical' : 'horizontal',
    }));
  };

  const reorderElements = (newElements) => {
    updateTemplate((prev) => ({
      ...prev,
      elements: newElements,
    }));
  };

  const deleteElement = () => {
    if (!selectedId) return;
    updateTemplate((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== selectedId),
    }));
    setSelectedId(null);
  };

  const duplicateElement = () => {
    if (!selectedId) return;
    const el = template.elements.find((e) => e.id === selectedId);
    if (!el) return;

    const newEl = {
      ...el,
      id: crypto.randomUUID(),
      x: el.x + 2,
      y: el.y + 2,
      style: { ...el.style, zIndex: template.elements.length + 1 },
    };

    updateTemplate((prev) => ({
      ...prev,
      elements: [...prev.elements, newEl],
    }));
    setSelectedId(newEl.id);
  };

  const selectedElement = template.elements.find((el) => el.id === selectedId);

  const fileInputRef = useRef(null);

  const exportTemplate = () => {
    const current = getCurrentTemplate();
    const dataStr = JSON.stringify(current, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${template.name.replace(/\s/g, '_') || 'id_card_template'}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importTemplate = (event) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);

        // Validate basic structure
        if (json.elements && Array.isArray(json.elements)) {
          // Suggest a name based on file name or internal name
          const defaultName =
            json.name || fileObj.name.replace(/\.[^/.]+$/, '') || 'Imported Template';
          const newName = prompt(
            t('editor.importNamePrompt'),
            defaultName
          );
          if (newName === null) return; // User cancelled import

          // Ensure orientation exists, default to horizontal if missing
          // normalizeTemplate keeps the imported card size / layout (and fills in defaults
          // for files exported before those existed)
          const validTemplate = normalizeTemplate({
            ...json, // Keep other props if imported
            elements: json.elements,
            orientation: json.orientation || 'horizontal',
            name: newName || defaultName,
            id: crypto.randomUUID(), // Always new ID for import to simplify
            lastModified: Date.now(),
          });

          updateTemplate(validTemplate, true);

          // Prompt to save immediately?
          if (
            confirm(
              t('editor.importSuccessMessage', { name: validTemplate.name })
            )

          ) {
            const saved = await saveTemplateRemote(validTemplate);
            setTemplate((prev) => ({ ...prev, id: saved.id, lastModified: saved.lastModified }));
            setActiveTemplateId(saved.id);
          }
        } else {
          alert(t('editor.importInvalidFormat'));
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
        alert(t('editor.importParseError'));
      }
    };
    reader.readAsText(fileObj);
    // Reset input so same file can be selected again
    event.target.value = null;
  };

  const handleReferenceUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImage(event.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const clearReference = () => {
    setReferenceImage(null);
  };

  // Handle Keyboard Arrows for moving elements
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedId) return;
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
      if (!isArrow) return;

      e.preventDefault();

      // Calculate steps (in mm)
      let step = 1; // Default 1mm
      if (e.shiftKey) step = 10; // Shift: 10mm
      if (e.ctrlKey || e.metaKey) step = 0.1; // Ctrl: 0.1mm (fine)

      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowUp') dy = -step;
      if (e.key === 'ArrowDown') dy = step;
      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowRight') dx = step;

      updateTemplate((prev) => {
        const elIndex = prev.elements.findIndex((el) => el.id === selectedId);
        if (elIndex === -1) return prev;

        const el = prev.elements[elIndex];
        if (el.locked) return prev;

        const newEl = {
          ...el,
          x: Number((el.x + dx).toFixed(2)),
          y: Number((el.y + dy).toFixed(2)),
        };

        const newElements = [...prev.elements];
        newElements[elIndex] = newEl;

        return {
          ...prev,
          elements: newElements,
        };
      });
      // We can't easily use updateTemplate inside the arrow key effect because it depends on prev state inside the setter and we want to batch or debounce history?
      // For now, let's manually push to history after state update?
      // Or simpler: change the setTemplate in arrow-key to use updateTemplate.
      // But updateTemplate needs to work with callback. It does.

      /* 
        The previous logic used setTemplate(prev => ...).
        We will modify it to use updateTemplate.
       */
    };

    // Additional Global Keys (Undo/Redo/Delete)
    const handleGlobalKeys = (e) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Save: Ctrl+S
      if (isCtrl && key === 's') {
        e.preventDefault();
        saveTemplate();
        return;
      }

      // Undo: Ctrl+Z
      if (isCtrl && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      // Redo: Ctrl+Y
      if (isCtrl && key === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Avoid deleting if in input
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

        if (selectedId) {
          e.preventDefault(); // Prevent back navigation
          deleteElement();
        }
        return;
      }
    };

    // Attach listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleGlobalKeys);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleGlobalKeys);
    };
  }, [selectedId, history, historyIndex, saveTemplate]); // Added history deps

  const handlePrint = () => {
    window.print();
  };

  const iconBtn =
    'h-8 w-8 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed';

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-12 flex items-center justify-between gap-3 px-3 shrink-0 z-20 whitespace-nowrap">
        {/* Left: name + history */}
        <div className="flex items-center gap-1 min-w-0">
          <span
            className="text-sm font-medium text-gray-700 truncate max-w-[180px] mr-2"
            title={template.name || t('editor.untitled')}
          >
            {template.name || t('editor.untitled')}
          </span>
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title={t('editor.undoTooltip')}
            className={iconBtn}
          >
            <Undo size={16} />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title={t('editor.redoTooltip')}
            className={iconBtn}
          >
            <Redo size={16} />
          </button>
        </div>

        {/* Center: card setup */}
        <div className="flex items-center gap-2">
          {/* Orientation */}
          <div className="flex items-center h-8 bg-gray-100 rounded-md p-0.5">
            <button
              onClick={() => template.orientation === 'vertical' && toggleOrientation()}
              title={t('editor.landscape')}
              className={`h-7 w-8 flex items-center justify-center rounded ${template.orientation !== 'vertical'
                ? 'bg-white shadow-sm text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <RectangleHorizontal size={16} />
            </button>
            <button
              onClick={() => template.orientation !== 'vertical' && toggleOrientation()}
              title={t('editor.portrait')}
              className={`h-7 w-8 flex items-center justify-center rounded ${template.orientation === 'vertical'
                ? 'bg-white shadow-sm text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <RectangleVertical size={16} />
            </button>
          </div>

          {/* Card Size & Cards per Page */}
          <CardLayoutSettings ref={layoutSettingsRef} template={template} onUpdateTemplate={updateTemplate} />

          {/* Zoom */}
          <div className="flex items-center h-8 bg-gray-100 rounded-md p-0.5">
            <button
              onClick={() => setScale((s) => Math.max(0.1, s - 0.1))}
              title="Zoom out"
              className="h-7 w-7 flex items-center justify-center rounded text-gray-600 hover:bg-white"
            >
              <Minus size={14} />
            </button>
            <span className="text-xs font-medium text-gray-700 w-10 text-center select-none">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(5, s + 0.1))}
              title="Zoom in"
              className="h-7 w-7 flex items-center justify-center rounded text-gray-600 hover:bg-white"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Right: tools + primary actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsTemplateManagerOpen(true)}
            title={t('editor.templates')}
            className={iconBtn}
          >
            <Layout size={16} />
          </button>

          {/* Reference Image */}
          <button
            onClick={() => referenceInputRef.current.click()}
            title={t('editor.uploadRefTooltip')}
            className={`${iconBtn} ${referenceImage ? 'bg-blue-50 text-blue-600' : ''}`}
          >
            <ImageIcon size={16} />
          </button>
          {referenceImage && (
            <div className="flex items-center gap-2 h-8 px-2 bg-blue-50 rounded-md">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={referenceOpacity}
                onChange={(e) => setReferenceOpacity(parseFloat(e.target.value))}
                title={t('editor.refOpacity')}
                className="w-14 h-1 cursor-pointer accent-blue-600"
              />
              <button
                onClick={clearReference}
                title={t('editor.clear')}
                className="text-blue-600 hover:text-red-500"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <button
            onClick={() => fileInputRef.current.click()}
            title={t('editor.import')}
            className={iconBtn}
          >
            <Upload size={16} />
          </button>
          <button onClick={exportTemplate} title={t('editor.export')} className={iconBtn}>
            <Download size={16} />
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Language */}
          <div
            className="flex items-center gap-1 h-8 px-2 rounded-md text-gray-600 hover:bg-gray-100"
            title={t('editor.lang')}
          >
            <Languages size={16} />
            <select
              value={printLanguage}
              onChange={(e) => setPrintLanguage(e.target.value)}
              className="bg-transparent text-sm focus:outline-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="mr">मराठी</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>

          <button
            onClick={saveTemplate}
            disabled={isSaving}
            className="flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Save size={15} />
            <span>{t('editor.save')}</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={isLangLoading}
            className={`flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-white rounded-md ${isLangLoading
              ? 'bg-gray-400'
              : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            <Printer size={15} />
            <span>
              {isLangLoading
                ? t('editor.translating', {
                  progress: Math.round(translationProgress * 100),
                })
                : t('editor.printPreview')}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Toolbar */}
        <Toolbar onAddElement={addElement} />

        {/* Center: Canvas */}
        <Canvas
          elements={template.elements}
          orientation={template.orientation}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onUpdate={updateElement}
          scale={scale}
          referenceImage={referenceImage}
          referenceOpacity={referenceOpacity}
          translations={canvasTranslations}
          language={printLanguage}
          backgroundImage={template.backgroundImage}
          backgroundOpacity={template.backgroundOpacity}
          cardWidthMm={template.cardWidthMm}
          cardHeightMm={template.cardHeightMm}
        />

        {/* Right: Properties & Layers */}
        <div
          style={{ width: rightPanelWidth }}
          className="border-l border-gray-200 bg-white flex flex-col h-full relative shrink-0"
        >
          {/* Resize Handle */}
          <div
            className="absolute top-0 bottom-0 left-0 w-1.5 cursor-col-resize hover:bg-blue-400 transition-colors z-50 opacity-0 hover:opacity-100 active:opacity-100 active:bg-blue-600"
            style={{ transform: 'translateX(-50%)' }}
            onMouseDown={startResizingRight}
            title="Drag to resize"
          />

          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('properties')}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === 'properties'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Properties
            </button>
            <button
              onClick={() => setActiveTab('layers')}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === 'layers'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Layers
            </button>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'properties' ? (
              <PropertiesPanel
                selectedElement={selectedElement}
                onUpdate={updateElement}
                onDelete={deleteElement}
                onDuplicate={duplicateElement}
                template={template}
                onUpdateTemplate={updateTemplate}
              />
            ) : (
              <LayersPanel
                elements={template.elements}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onUpdate={updateElement}
                onReorder={reorderElements}
              />
            )}
          </div>
        </div>
      </div>

      {/* Hidden Print Preview */}
      {createPortal(
        <PrintPreview
          template={template}
          students={mockStudents}
          schoolData={schoolDataState}
          language={printLanguage}
          onTranslationStart={() => setIsLangLoading(true)}
          onTranslationEnd={() => setIsLangLoading(false)}
        />,
        document.getElementById('print-mount')
      )}

      {/* Template Manager Modal */}
      <TemplateManager
        isOpen={isTemplateManagerOpen}
        onClose={() => setIsTemplateManagerOpen(false)}
        onLoadTemplate={loadTemplate}
        currentTemplateId={template.id}
        onTemplateRenamed={(name) => setTemplate((prev) => ({ ...prev, name }))}
      />

      {/* Hidden Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={importTemplate}
        accept=".json"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={referenceInputRef}
        onChange={handleReferenceUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </div>
  );
};
