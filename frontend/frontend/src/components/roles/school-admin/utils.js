export const MM_TO_PX = 3.7795275591; // 1mm = 3.78px at 96 DPI

export const mmToPx = (mm) => Math.round(mm * MM_TO_PX);
export const pxToMm = (px) => Number((px / MM_TO_PX).toFixed(2));

export const CARD_WIDTH_MM = 85.6;
export const CARD_HEIGHT_MM = 54;
