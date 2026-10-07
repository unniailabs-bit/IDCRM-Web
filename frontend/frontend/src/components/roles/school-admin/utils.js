export const MM_TO_PX = 3.7795275591; // 1mm = 3.78px at 96 DPI

export const mmToPx = (mm) => Math.round(mm * MM_TO_PX);
export const pxToMm = (px) => Number((px / MM_TO_PX).toFixed(2));

// Default CR80 ID card size (landscape basis: width is the long side)
export const CARD_WIDTH_MM = 85.6;
export const CARD_HEIGHT_MM = 54;

// A4 sheet and print layout defaults
export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;
export const PAGE_MARGIN_MM = 5;
export const DEFAULT_CARD_GAP_MM = 3;

export const CARD_SIZE_PRESETS = [
  { name: 'CR80 / Standard', width: 85.6, height: 54 },
  { name: 'CR79', width: 84, height: 52 },
  { name: 'CR100', width: 98.5, height: 67 },
  { name: 'Large', width: 100, height: 70 },
];

// Card size in mm as laid out on the card, taking orientation into account
export const getCardSize = (template) => {
  const w = Number(template?.cardWidthMm) || CARD_WIDTH_MM;
  const h = Number(template?.cardHeightMm) || CARD_HEIGHT_MM;
  const isPortrait = template?.orientation === 'vertical';
  return isPortrait ? { widthMm: h, heightMm: w } : { widthMm: w, heightMm: h };
};

// Computes how cards are arranged on an A4 sheet.
// Portrait cards print on a landscape sheet, landscape cards on a portrait sheet.
export const getPageLayout = (template) => {
  const { widthMm, heightMm } = getCardSize(template);
  const isPortrait = template?.orientation === 'vertical';
  const pageWidthMm = isPortrait ? PAGE_HEIGHT_MM : PAGE_WIDTH_MM;
  const pageHeightMm = isPortrait ? PAGE_WIDTH_MM : PAGE_HEIGHT_MM;
  const gapMm = Math.max(0, Number(template?.cardGapMm ?? DEFAULT_CARD_GAP_MM));

  const usableW = pageWidthMm - PAGE_MARGIN_MM * 2;
  const usableH = pageHeightMm - PAGE_MARGIN_MM * 2;
  const maxColumns = Math.max(1, Math.floor((usableW + gapMm) / (widthMm + gapMm)));
  const maxRows = Math.max(1, Math.floor((usableH + gapMm) / (heightMm + gapMm)));
  const maxCardsPerPage = maxColumns * maxRows;

  const requested = parseInt(template?.cardsPerPage, 10);
  const cardsPerPage =
    requested > 0 ? Math.min(requested, maxCardsPerPage) : maxCardsPerPage;
  const columns = Math.min(maxColumns, cardsPerPage);
  const rows = Math.ceil(cardsPerPage / columns);

  return {
    widthMm,
    heightMm,
    pageWidthMm,
    pageHeightMm,
    gapMm,
    columns,
    rows,
    cardsPerPage,
    maxCardsPerPage,
  };
};
