import React, { useId } from "react";
import { MM_TO_PX } from "../utils";

// Polygon shapes drawn in a 0-100 viewBox, stretched to the element box
export const POLYGON_SHAPES = {
  triangle: "50,0 100,100 0,100",
  rightTriangle: "0,0 100,100 0,100",
  diamond: "50,0 100,50 50,100 0,50",
  pentagon: "50,0 100,38 81,100 19,100 0,38",
  hexagon: "25,0 75,0 100,50 75,100 25,100 0,50",
  star: "50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35",
  arrow: "0,30 60,30 60,0 100,50 60,100 60,70 0,70",
  chevron: "0,0 75,0 100,50 75,100 0,100 25,50",
  banner: "0,0 100,0 85,50 100,100 0,100",
  parallelogram: "25,0 100,0 75,100 0,100",
};

const dashArray = (borderStyle, w) => {
  if (borderStyle === "dashed") return `${w * 3} ${w * 2}`;
  if (borderStyle === "dotted") return `${w} ${w * 1.5}`;
  return undefined;
};

// CSS background for solid / gradient / no fill
const fillBackground = (style) => {
  if (style?.fillType === "none") return "transparent";
  if (style?.fillType === "gradient") {
    return `linear-gradient(${style.gradientAngle ?? 90}deg, ${style.gradientFrom || "#3b82f6"}, ${style.gradientTo || "#1e3a8a"})`;
  }
  return style?.backgroundColor || "transparent";
};

export const CardElement = ({ element, scale = 1, isPreview = false }) => {
  const gradientId = `grad-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (!element) return null;
  const { type, subType, content, style, data } = element;

  // Extract numeric border width to handle scale and prevent double 'px' units
  const rawBorderWidth = style?.borderWidth !== undefined && style?.borderWidth !== ""
    ? parseFloat(style.borderWidth) || 0
    : 1;
  const scaledBorderWidth = rawBorderWidth * scale;
  const borderStyle = style?.borderStyle || "solid";
  const borderColor = style?.borderColor || "black";
  const cornerRadiusPx = (Number(style?.cornerRadius) || 0) * MM_TO_PX * scale;
  const rotation = style?.rotation ? `rotate(${style.rotation}deg)` : "none";
  const shadow = style?.shadow ? `0 ${1.5 * scale}px ${4 * scale}px rgba(0,0,0,0.35)` : undefined;

  const commonStyle = {
    ...style,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    display: "flex",
    fontSize: style?.fontSize ? `${style.fontSize * scale}px` : undefined, // Apply scale to font size
    letterSpacing: style?.letterSpacing ? `${style.letterSpacing * scale}px` : undefined,
    textTransform: style?.textTransform || "none", // Apply text transformation
    alignItems:
      style?.textAlign === "center"
        ? "center"
        : style?.textAlign === "right"
          ? "flex-end"
          : "flex-start",
    justifyContent:
      style?.textAlign === "center"
        ? "center"
        : style?.textAlign === "right"
          ? "flex-end"
          : "flex-start",
    lineHeight: style?.lineHeight || "1.2", // Consistent default line height
    margin: 0,
    padding: 0,
    transform: rotation, // Apply rotation
  };

  // Refine styles for text
  if (type === "text" || type === "field") {
    commonStyle.textAlign = style?.textAlign || "left";
    commonStyle.whiteSpace = "pre-wrap"; // Allow wrapping
    commonStyle.wordBreak = "break-word"; // Break long words if needed

    // Vertical Center
    const vAlign = style?.verticalAlign || "top"; // Defaulting to top as it's more standard for text blocks usually
    commonStyle.alignItems =
      vAlign === "top"
        ? "flex-start"
        : vAlign === "bottom"
          ? "flex-end"
          : "center";
    commonStyle.display = "flex";

    // Horizontal Align
    const align = style?.textAlign || "left";
    commonStyle.justifyContent =
      align === "center"
        ? "center"
        : align === "right"
          ? "flex-end"
          : "flex-start";

    // Ensure text-align matches for multiline text
    commonStyle.textAlign = align;
    commonStyle.borderRadius = cornerRadiusPx ? `${cornerRadiusPx}px` : undefined;
    commonStyle.textShadow = style?.shadow ? `0 ${scale}px ${2 * scale}px rgba(0,0,0,0.4)` : undefined;

    commonStyle.overflow = "visible";
  }

  // Horizontal / vertical lines
  if (type === "shape" && (subType === "line" || subType === "vline")) {
    const isVertical = subType === "vline";
    const lineStyle = borderStyle === "double" && scaledBorderWidth < 3 ? "solid" : borderStyle;
    const stroke = `${scaledBorderWidth}px ${lineStyle} ${borderColor}`;
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: style?.opacity ?? 1,
          transform: rotation,
        }}
      >
        <div
          style={
            isVertical
              ? { height: "100%", width: 0, borderLeft: stroke }
              : { width: "100%", height: 0, borderTop: stroke }
          }
        />
      </div>
    );
  }

  if (type === "image") {
    const isSignature = element.field === "school.principal_sign";
    // User-set style takes priority; otherwise use smart defaults
    const objectFit = style?.objectFit || (isSignature ? "fill" : "contain");
    const objectPosition = style?.objectPosition || "center";
    const imgBorder = parseFloat(style?.borderWidth) > 0;
    return (
      <img
        src={data?.src || "https://placehold.co/100x100?text=U"}
        alt="Element"
        style={{
          ...commonStyle,
          objectFit,
          objectPosition,
          boxSizing: "border-box",
          borderRadius: style?.circle ? "50%" : cornerRadiusPx ? `${cornerRadiusPx}px` : undefined,
          border: imgBorder ? `${scaledBorderWidth}px ${borderStyle} ${borderColor}` : "none",
          boxShadow: shadow,
          filter: style?.grayscale ? "grayscale(1)" : undefined,
        }}
        draggable={false}
      />
    );
  }

  // Box-like shapes rendered with CSS (rectangle, rounded rectangle, ellipse/circle)
  if (type === "shape" && ["rectangle", "roundedRect", "ellipse"].includes(subType)) {
    return (
      <div
        style={{
          ...commonStyle,
          boxSizing: "border-box",
          background: fillBackground(style),
          border: scaledBorderWidth > 0 ? `${scaledBorderWidth}px ${borderStyle} ${borderColor}` : "none",
          borderRadius: subType === "ellipse" ? "50%" : `${cornerRadiusPx}px`,
          boxShadow: shadow,
        }}
      />
    );
  }

  // Polygon shapes rendered with SVG so fill & stroke follow the outline
  if (type === "shape" && POLYGON_SHAPES[subType]) {
    const fillType = style?.fillType || "solid";
    const angle = style?.gradientAngle ?? 90;
    const fill =
      fillType === "none"
        ? "none"
        : fillType === "gradient"
          ? `url(#${gradientId})`
          : style?.backgroundColor || "transparent";
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          opacity: style?.opacity ?? 1,
          transform: rotation,
          filter: style?.shadow ? `drop-shadow(0 ${1.5 * scale}px ${2 * scale}px rgba(0,0,0,0.35))` : undefined,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ display: "block", overflow: "visible" }}
        >
          {fillType === "gradient" && (
            <defs>
              <linearGradient id={gradientId} gradientTransform={`rotate(${angle - 90} 0.5 0.5)`}>
                <stop offset="0%" stopColor={style?.gradientFrom || "#3b82f6"} />
                <stop offset="100%" stopColor={style?.gradientTo || "#1e3a8a"} />
              </linearGradient>
            </defs>
          )}
          <polygon
            points={POLYGON_SHAPES[subType]}
            fill={fill}
            stroke={scaledBorderWidth > 0 ? borderColor : "none"}
            strokeWidth={scaledBorderWidth}
            strokeDasharray={dashArray(borderStyle, scaledBorderWidth)}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    );
  }

  // Default Text / Field
  return <div style={commonStyle}>{content || "Text"}</div>;
};
