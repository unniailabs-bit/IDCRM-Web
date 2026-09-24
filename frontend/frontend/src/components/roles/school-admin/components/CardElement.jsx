import React from "react";

export const CardElement = ({ element, scale = 1, isPreview = false }) => {
  if (!element) return null;
  const { type, subType, content, style, data } = element;

  // Extract numeric border width to handle scale and prevent double 'px' units
  const rawBorderWidth = style?.borderWidth ? parseFloat(style.borderWidth) : 1;
  const scaledBorderWidth = rawBorderWidth * scale;

  const commonStyle = {
    ...style,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    display: "flex",
    fontSize: style?.fontSize ? `${style.fontSize * scale}px` : undefined, // Apply scale to font size
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
    lineHeight: "1.2", // Enforce consistent line height
    margin: 0,
    padding: 0,
    transform: style?.rotation ? `rotate(${style.rotation}deg)` : "none", // Apply rotation
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

    commonStyle.overflow = "visible";
  }

  if (type === "shape" && subType === "line") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            height: `${scaledBorderWidth}px`, // Line thickness
            backgroundColor: style?.borderColor || "black",
          }}
        />
      </div>
    );
  }

  if (type === "image") {
    const isSignature = element.field === "school.principal_sign";
    // User-set style takes priority; otherwise use smart defaults
    const objectFit = style?.objectFit || (isSignature ? "fill" : "contain");
    const objectPosition = style?.objectPosition || "center";
    return (
      <img
        src={data?.src || "https://placehold.co/100x100?text=U"}
        alt="Element"
        style={{
          ...commonStyle,
          objectFit,
          objectPosition,
        }}
        draggable={false}
      />
    );
  }

  if (type === "shape" && subType === "rectangle") {
    return (
      <div
        style={{
          ...commonStyle,
          backgroundColor: style?.backgroundColor || "transparent",
          border: `${scaledBorderWidth}px solid ${style?.borderColor || "black"}`,
        }}
      />
    );
  }

  // Default Text / Field
  return <div style={commonStyle}>{content || "Text"}</div>;
};
