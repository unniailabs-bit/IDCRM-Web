import React, { useEffect, useRef, useState } from 'react';
import { Ruler, ChevronDown } from 'lucide-react';
import {
  CARD_WIDTH_MM,
  CARD_HEIGHT_MM,
  CARD_SIZE_PRESETS,
  DEFAULT_CARD_GAP_MM,
  getPageLayout,
} from '../utils';

const parseNum = (raw, min, integer = false) => {
  const n = integer ? parseInt(raw, 10) : parseFloat(raw);
  if (!Number.isFinite(n) || n < min) return null;
  return integer ? n : Number(n.toFixed(2));
};

// Card size + cards-per-page settings, stored on the template so the
// print preview (editor and student data sheet) uses the same values.
// Width/height fields show the card as currently oriented (they swap in
// portrait). Typed values apply automatically when the popover closes.
export const CardLayoutSettings = ({ template, onUpdateTemplate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  const isPortrait = template?.orientation === 'vertical';
  // Stored values are landscape-basis; orient them for display
  const storedW = Number(template?.cardWidthMm) || CARD_WIDTH_MM;
  const storedH = Number(template?.cardHeightMm) || CARD_HEIGHT_MM;
  const layout = getPageLayout(template);
  const gapMm = template?.cardGapMm ?? DEFAULT_CARD_GAP_MM;

  // Convert displayed (oriented) width/height back to stored fields
  const toStored = (w, h) =>
    isPortrait ? { cardWidthMm: h, cardHeightMm: w } : { cardWidthMm: w, cardHeightMm: h };

  const valuesFromTemplate = () => ({
    width: String(layout.widthMm),
    height: String(layout.heightMm),
    perPage: String(layout.cardsPerPage),
    gap: String(gapMm),
  });

  // Drafts let the user clear/retype a field without the value snapping back
  const [drafts, setDrafts] = useState(valuesFromTemplate);
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;

  useEffect(() => {
    setDrafts(valuesFromTemplate());
  }, [layout.widthMm, layout.heightMm, layout.cardsPerPage, gapMm]);

  // Layout implied by the current drafts (falls back to saved values for invalid fields)
  const layoutFromDrafts = (d) => {
    const w = parseNum(d.width, 10) ?? layout.widthMm;
    const h = parseNum(d.height, 10) ?? layout.heightMm;
    const gap = parseNum(d.gap, 0) ?? gapMm;
    const sized = getPageLayout({ ...template, ...toStored(w, h), cardGapMm: gap, cardsPerPage: 0 });
    const requested = parseNum(d.perPage, 1, true);
    const perPage = Math.min(requested ?? layout.cardsPerPage, sized.maxCardsPerPage);
    return { w, h, gap, perPage, preview: getPageLayout({ ...template, ...toStored(w, h), cardGapMm: gap, cardsPerPage: perPage }) };
  };

  // Commit all drafts in a single template update (one undo step)
  const applyDrafts = () => {
    const { w, h, gap, perPage } = layoutFromDrafts(draftsRef.current);
    const stored = toStored(w, h);
    const changed =
      stored.cardWidthMm !== storedW ||
      stored.cardHeightMm !== storedH ||
      gap !== gapMm ||
      perPage !== layout.cardsPerPage;

    if (changed) {
      onUpdateTemplate((prev) => ({ ...prev, ...stored, cardGapMm: gap, cardsPerPage: perPage }));
    } else {
      setDrafts(valuesFromTemplate()); // nothing to save; discard invalid input
    }
  };

  const close = () => {
    applyDrafts();
    setIsOpen(false);
  };
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) closeRef.current();
    };
    const handleEsc = (e) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const draft = layoutFromDrafts(drafts);
  const maxPerPage = draft.preview.maxCardsPerPage;

  const inputProps = (key) => ({
    type: 'number',
    value: drafts[key] ?? '',
    onChange: (e) => {
      let value = e.target.value;
      // Never allow more cards than fit on the page
      if (key === 'perPage' && parseInt(value, 10) > maxPerPage) value = String(maxPerPage);
      setDrafts((d) => ({ ...d, [key]: value }));
    },
    onKeyDown: (e) => e.key === 'Enter' && applyDrafts(),
    className:
      'w-full h-8 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500',
  });

  const activePreset = CARD_SIZE_PRESETS.findIndex(
    (p) => p.width === storedW && p.height === storedH
  );
  const orientedLabel = (p) =>
    isPortrait ? `${p.name} (${p.height} × ${p.width})` : `${p.name} (${p.width} × ${p.height})`;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        title="Card size & cards per page"
        className={`flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-md transition-colors ${
          isOpen ? 'bg-blue-50 text-blue-700' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
        }`}
      >
        <Ruler size={14} />
        <span>
          {layout.widthMm} × {layout.heightMm} mm
        </span>
        <span className="text-gray-400">·</span>
        <span>{layout.cardsPerPage}/page</span>
        <ChevronDown size={12} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 space-y-3 whitespace-normal">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">Card size</label>
            <select
              value={activePreset}
              onChange={(e) => {
                const preset = CARD_SIZE_PRESETS[Number(e.target.value)];
                if (!preset) return;
                const sized = getPageLayout({
                  ...template,
                  cardWidthMm: preset.width,
                  cardHeightMm: preset.height,
                  cardsPerPage: 0,
                });
                onUpdateTemplate((prev) => ({
                  ...prev,
                  cardWidthMm: preset.width,
                  cardHeightMm: preset.height,
                  cardsPerPage: Math.min(layout.cardsPerPage, sized.maxCardsPerPage),
                }));
              }}
              className="w-full h-8 px-2 text-sm border border-gray-300 rounded-md bg-white"
            >
              {activePreset === -1 && <option value={-1}>Custom</option>}
              {CARD_SIZE_PRESETS.map((p, i) => (
                <option key={p.name} value={i}>
                  {orientedLabel(p)}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input step="0.1" min="10" title="Width (mm)" {...inputProps('width')} />
              <span className="text-gray-400 text-sm">×</span>
              <input step="0.1" min="10" title="Height (mm)" {...inputProps('height')} />
              <span className="text-xs text-gray-500">mm</span>
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 pr-8">
              <span>Width</span>
              <span>Height</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Cards / page</label>
              <input step="1" min="1" max={maxPerPage} {...inputProps('perPage')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Gap (mm)</label>
              <input step="0.5" min="0" {...inputProps('gap')} />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            {draft.preview.columns} × {draft.preview.rows} on A4 · max {maxPerPage} per page
          </p>
        </div>
      )}
    </div>
  );
};
