import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { CardElement } from './CardElement';
import { mmToPx, pxToMm, MM_TO_PX, CARD_WIDTH_MM, CARD_HEIGHT_MM } from '../utils';

// Helper for local digits
const toLocalDigits = (str) => {
  if (!str) return str;
  const map = {
    0: '०',
    1: '१',
    2: '२',
    3: '३',
    4: '४',
    5: '५',
    6: '६',
    7: '७',
    8: '८',
    9: '९',
  };
  return String(str).replace(/[0-9]/g, (match) => map[match]);
};

export const Canvas = ({
  elements,
  selectedId,
  onSelect,
  onUpdate,
  scale = 1,
  orientation = 'horizontal',
  referenceImage,
  referenceOpacity = 0.5,
  translations = {},
  language = 'en',
  backgroundImage,
  backgroundOpacity,
}) => {
  const isPortrait = orientation === 'vertical';
  const widthMm = isPortrait ? CARD_HEIGHT_MM : CARD_WIDTH_MM;
  const heightMm = isPortrait ? CARD_WIDTH_MM : CARD_HEIGHT_MM;

  const cardWidthPx = mmToPx(widthMm);
  const cardHeightPx = mmToPx(heightMm);

  return (
    <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-auto p-10 select-none">
      <div
        className="bg-white shadow-xl relative"
        style={{
          width: cardWidthPx * scale,
          height: cardHeightPx * scale,
          transformOrigin: 'center center',
        }}
        onClick={() => onSelect(null)}
      >
        {/* Background Image Layer */}
        {backgroundImage && (
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src={backgroundImage}
              alt="Background"
              className="w-full h-full object-fill"
              style={{ opacity: backgroundOpacity ?? 1 }}
            />
          </div>
        )}

        {/* Grid Layer */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
            backgroundSize: `${MM_TO_PX * 10 * scale}px ${MM_TO_PX * 10 * scale}px`, // 10mm grid
            backgroundPosition: '-1px -1px',
          }}
        />

        {/* Reference Image Layer (Tracing) */}
        {referenceImage && (
          <div className="absolute inset-0 pointer-events-none z-0">
            <img
              src={referenceImage}
              alt="Reference"
              className="w-full h-full object-fill"
              style={{ opacity: referenceOpacity }}
            />
          </div>
        )}
        {elements.map((el) => {
          const isSelected = selectedId === el.id;

          let displayContent = el.content;

          // Apply Translation
          if (language !== 'en' && translations && el.content) {
            const key = String(el.content).trim();
            if (translations[key]) {
              displayContent = translations[key];
            }
          }

          // Apply Digit Localization (even if no translation found, digits might need localization)
          if (language === 'mr' || language === 'hi') {
            displayContent = toLocalDigits(displayContent);
          }

          // Create a display element with translated content
          const displayElement = {
            ...el,
            content: displayContent,
          };

          return (
            <Rnd
              key={el.id}
              size={{ width: mmToPx(el.width) * scale, height: mmToPx(el.height) * scale }}
              position={{ x: mmToPx(el.x) * scale, y: mmToPx(el.y) * scale }}
              onDragStop={(e, d) => {
                onUpdate({
                  ...el,
                  x: pxToMm(d.x / scale),
                  y: pxToMm(d.y / scale),
                });
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                onUpdate({
                  ...el,
                  width: pxToMm(ref.offsetWidth / scale),
                  height: pxToMm(ref.offsetHeight / scale),
                  x: pxToMm(position.x / scale),
                  y: pxToMm(position.y / scale),
                });
              }}
              bounds="parent"
              dragGrid={[MM_TO_PX * scale, MM_TO_PX * scale]} // Snap to 1mm
              resizeGrid={[MM_TO_PX * scale, MM_TO_PX * scale]}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(el.id);
              }}
              enableResizing={isSelected && !el.locked}
              disableDragging={!isSelected || el.locked}
              className={`absolute box-border ${
                isSelected ? 'ring-1 ring-blue-500 z-50' : 'hover:ring-1 hover:ring-blue-300 z-10'
              } ${el.locked ? 'cursor-not-allowed border-red-500' : ''}`}
              style={{
                zIndex: el.style?.zIndex || 1,
              }}
            >
              <CardElement element={displayElement} scale={scale} />
            </Rnd>
          );
        })}
      </div>

      <div className="absolute bottom-4 right-4 bg-white/80 p-2 rounded backdrop-blur-sm text-xs text-gray-500 shadow">
        {widthMm}mm x {heightMm}mm @ {Math.round(scale * 100)}%
      </div>
    </div>
  );
};
