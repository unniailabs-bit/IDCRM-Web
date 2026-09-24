import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {useAuth} from '@/hooks/useAuth';

const BACKEND_BASE_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

// ----------------------- Placeholder Image Data (Local/Inlined) -----------------------
const NO_PHOTO_DATA_URL =
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22150%22%20height%3D%22150%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20150%20150%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22150%22%20height%3D%22150%22%20fill%3D%22%23cccccc%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%2C%20Helvetica%2C%20sans-serif%22%20font-size%3D%2212%22%20fill%3D%22%23333333%22%3ENo%20Photo%3C%2Ftext%3E%3C%2Fsvg%3E";

const resolvePhotoUrl = (photo?: string | null) => {
  if (!photo || photo === "https://via.placeholder.com/150?text=No+Photo") {
    return NO_PHOTO_DATA_URL;
  }
  if (/^https?:\/\//i.test(photo) || photo.startsWith("data:")) {
    return photo;
  }
  if (!BACKEND_BASE_URL) return NO_PHOTO_DATA_URL;
  return `${BACKEND_BASE_URL}${photo.startsWith("/") ? "" : "/"}${photo}`;
};

// ----------------------- COLOR SANITIZER HELPER (FIX FOR OKLCH ERROR) -----------------------
let _canvasCtx;

/**
 * Converts modern CSS colors (like oklch) to RGBA using a temporary canvas.
 * html2canvas fails on oklch, but canvas context handles it gracefully by converting to rgba data.
 */
const getSafeColor = (color) => {
  if (!color || color === "none" || color === "transparent") return color;

  // Only intervene if we detect unsupported formats
  if (color.includes("oklch") || color.includes("lab") || color.includes("lch")) {
    try {
      if (!_canvasCtx) {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        _canvasCtx = canvas.getContext("2d", { willReadFrequently: true });
      }

      _canvasCtx.clearRect(0, 0, 1, 1);
      _canvasCtx.fillStyle = color;
      _canvasCtx.fillRect(0, 0, 1, 1);

      const [r, g, b, a] = _canvasCtx.getImageData(0, 0, 1, 1).data;
      return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    } catch (e) {
      console.warn("Color conversion failed", e);
      return color; // Fallback to original if canvas fails
    }
  }
  return color;
};

// ----------------------- VERTICAL CARD -----------------------
function VerticalCard({ card }) {
  return (
    <div className="border rounded-xl shadow-md bg-white flex flex-col overflow-hidden hover:shadow-lg transition-shadow max-w-xs w-full">
      <div className={`p-4 text-white font-semibold text-center text-lg ${card.headerBg}`}>
        {card.schoolName}
      </div>
      <br />
      <div className="flex justify-center mt-6">
        <img
          src={card.photoUrl}
          className="w-24 h-24 rounded-lg object-cover border"
          alt="Student Photo"
          crossOrigin="anonymous"
        />
      </div>

      <div className="px-6 py-5 text-center">
        <h3 className="font-semibold text-lg">{card.studentName}</h3>

        {/* Class/Roll badge - match styles from IdCardTemplate vertical card */}
        <div
          className="text-xs bg-green-600 text-white  px-3 py-3 rounded-md mt-2"
          data-role="class-roll-badge"
        >
          {card.classRoll}
        </div>

        <div className="text-left mt-4 text-sm space-y-2">
          <p>
            <strong>Father:</strong> {card.father}
          </p>
          <p>
            <strong>Mother:</strong> {card.mother}
          </p>
          <p>
            <strong>Gender:</strong> {card.gender}
          </p>
          <p>
            <strong>Address:</strong> {card.address}
          </p>
          <p>
            <strong>Emergency:</strong> {card.emergency}
          </p>
        </div>

        <div className="flex justify-center mt-3">
          <img src={card.qrCodeUrl} className="w-20 h-20" alt="QR Code" crossOrigin="anonymous" />
        </div>
        <br />
      </div>
    </div>
  );
}

// ----------------------- HORIZONTAL CARD (kept for completeness) -----------------------
function HorizontalCard({ card }) {
  return (
    <div className="border rounded-xl shadow-md bg-white overflow-hidden hover:shadow-lg transition-shadow w-full max-w-xs">
      <div className={`p-3 text-white font-semibold text-center text-base ${card.headerBg}`}>
        {card.schoolName}
      </div>

      <div className="flex gap-3 p-3">
        <div className="flex flex-col items-center gap-2">
          <img
            src={card.photoUrl}
            className="w-20 h-20 rounded-lg object-cover border"
            alt="Student Photo"
            crossOrigin="anonymous"
          />
          <img src={card.qrCodeUrl} className="w-12 h-12" alt="QR Code" crossOrigin="anonymous" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-base">{card.studentName}</h3>

          {/* Class/Roll badge - match styles from IdCardTemplate horizontal card */}
          <div
            className="text-xs bg-green-600 text-white inline-block px-2 py-3 rounded-md mt-1"
            data-role="class-roll-badge"
          >
            {card.classRoll}
          </div>

          <div className="text-xs mt-2 space-y-1">
            <p>
              <strong>Father:</strong> {card.father}
            </p>
            <p>
              <strong>Mother:</strong> {card.mother}
            </p>
            <p>
              <strong>Gender:</strong> {card.gender}
            </p>
            <p>
              <strong>Address:</strong> {card.address}
            </p>
            <p>
              <strong>Emergency:</strong> {card.emergency}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------- FINAL GALLERY -----------------------
export function IDCardPreview() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    classDiv = { class: "N/A", division: "N/A" },
    students = [],
    meta = { approved: 0 },
    selectedTemplate,
  } = location.state || {};
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!classDiv.class || !students.length) {
      toast.error("No student data available");
      setTimeout(() => navigate("/school-dashboard/digital-forms"), 100);
    }
  }, [classDiv.class, students.length, navigate]);

  // Convert real students to card format
  const { userData } = useAuth();
  const headerBg = selectedTemplate?.headerBg || "bg-green-600";
  const orientation = selectedTemplate?.orientation || "Vertical";
  const realStudentCards = students.map((student) => ({
    id: student.id,
    schoolName: userData.name || "SCHOOL NAME",
    headerBg,
    studentName:
      student.student_name ||
      `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
      "N/A",
    classRoll: `Class ${classDiv.class} - ${classDiv.division} | Roll: ${student.roll_number || "N/A"}`,
    father: student.father_name || "N/A",
    mother: student.mother_name || "N/A",
    gender: student.gender || "N/A",
    address:
      student.address ||
      `${student.street_address || ""}, ${student.city || ""}`.trim().replace(/^, |^,$/g, "") ||
      "N/A",
    emergency: student.emergency_contact || "N/A",
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
      student.student_name || student.id
    )}`,
    photoUrl: resolvePhotoUrl(student.photo),
    orientation,
  }));

  const totalStudents = students.length;
  const cardsPerPage = orientation === "Vertical" ? 10 : 4;
  const totalPages = Math.ceil(totalStudents / cardsPerPage);

  // Preload images to reduce issues with html2canvas
  const preloadImages = (cards) => {
    return Promise.all(
      cards.flatMap((card) => [
        new Promise((resolve) => {
          const img = new Image();
          img.onload = img.onerror = resolve;
          img.crossOrigin = "anonymous";
          img.src = card.photoUrl;
        }),
        new Promise((resolve) => {
          const img = new Image();
          img.onload = img.onerror = resolve;
          img.crossOrigin = "anonymous";
          img.src = card.qrCodeUrl;
        }),
      ])
    );
  };

  // Assign data-clone-id to elements so we can map original -> cloned nodes inside onclone
  const assignDataCloneIds = (root) => {
    let counter = 1;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
    while (walker.nextNode()) {
      const el = walker.currentNode;
      // Only assign if not already present
      if (!el.getAttribute("data-clone-id")) {
        el.setAttribute("data-clone-id", `clone-${counter++}`);
      }
    }
  };

  // Remove data-clone-id attributes after work
  const removeDataCloneIds = (root) => {
    const nodes = root.querySelectorAll("[data-clone-id]");
    nodes.forEach((n) => n.removeAttribute("data-clone-id"));
  };

  // Copy computed colors from original node to cloned node (safely)
  const copySafeComputedStyles = (originalEl, clonedEl) => {
    try {
      const cs = window.getComputedStyle(originalEl);
      // Colors that commonly cause parsing troubles if left as CSS functions.
      // FIX: Wrap these color assignments with getSafeColor()
      if (cs.color) clonedEl.style.color = getSafeColor(cs.color);
      if (cs.backgroundColor) clonedEl.style.backgroundColor = getSafeColor(cs.backgroundColor);
      if (cs.borderColor) clonedEl.style.borderColor = getSafeColor(cs.borderColor);
      if (cs.outlineColor) clonedEl.style.outlineColor = getSafeColor(cs.outlineColor);
      if (cs.fill) clonedEl.style.fill = getSafeColor(cs.fill);
      if (cs.stroke) clonedEl.style.stroke = getSafeColor(cs.stroke);
      
      // boxShadow sometimes contains color functions; set to the computed value or none if empty
      const boxShadow = cs.boxShadow;
      if (boxShadow && boxShadow !== "none") {
        // Technically boxShadow can contain oklch too, but parsing it is harder. 
        // Often simple reassignment works if the browser computes it to rgba, 
        // but if it stays oklch, it might still crash. 
        // For now, we leave it as is, or you could disable box-shadow if it crashes.
        clonedEl.style.boxShadow = boxShadow; 
      } else {
        clonedEl.style.boxShadow = "none";
      }
      
      // Ensure fonts/sizing are retained (so layout stays same)
      clonedEl.style.fontSize = cs.fontSize;
      clonedEl.style.fontFamily = cs.fontFamily;
      clonedEl.style.fontWeight = cs.fontWeight;
      clonedEl.style.lineHeight = cs.lineHeight;
      clonedEl.style.letterSpacing = cs.letterSpacing;
    } catch (err) {
      // If anything breaks, don't block PDF generation — fallback to nothing.
      // console.warn('copySafeComputedStyles failed for', originalEl, err);
    }
  };

  const handleGeneratePDF = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    toast.info("Generating high-quality PDF (300 DPI), please wait...", { duration: 5000 });

    const printArea = document.getElementById("student-cards-print-area");

    if (!printArea) {
      toast.error("Print area not found.");
      setIsGenerating(false);
      return;
    }

    // Keep original styles for restore
    const originalWidth = printArea.style.width;
    const originalClassName = printArea.className;

    // Set print-specific layout
    if (orientation === "Vertical") {
      printArea.className = "grid grid-cols-5 gap-1 p-1";
    } else {
      printArea.className = "grid grid-cols-2 gap-0 p-1";
    }

    try {
      // 1. Preload images
      await preloadImages(realStudentCards);

      // 2. Mark nodes with clone ids so onclone can map original -> cloned
      assignDataCloneIds(printArea);

      // Temporarily increase width to capture layout without wrapping
      if (orientation === 'Vertical') {
        printArea.style.width = "1600px"; // Wider for 5 cards
      } else {
        printArea.style.width = "660px"; // 2 cards (320px each) + gap + padding
      }

      // 3. Calculate scale for 300 DPI
      const targetDPI = 300;
      const browserDPI = 96;
      const scale = targetDPI / browserDPI;

      // 4. Use html2canvas with 300 DPI scale
      const canvas = await html2canvas(printArea, {
        scale: scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          try {
            const clonedRoot = clonedDoc.getElementById("student-cards-print-area");
            if (!clonedRoot) return;

            const walker = clonedDoc.createTreeWalker(clonedRoot, NodeFilter.SHOW_ELEMENT, null, false);
            while (walker.nextNode()) {
              const clonedNode = walker.currentNode as HTMLElement;
              const id = clonedNode.getAttribute("data-clone-id");
              if (!id) continue;
              const originalNode = document.querySelector(
                `[data-clone-id="${id}"]`
              ) as HTMLElement | null;
              if (!originalNode) continue;
              copySafeComputedStyles(originalNode, clonedNode);

              if (
                clonedNode instanceof HTMLImageElement &&
                originalNode instanceof HTMLImageElement &&
                originalNode.src
              ) {
                try {
                  clonedNode.setAttribute("crossorigin", "anonymous");
                } catch (e) {}
              }

              const role = originalNode.getAttribute("data-role");
              if (role === "class-roll-badge") {
                clonedNode.style.display = "flex";
                clonedNode.style.alignItems = "center";
                clonedNode.style.justifyContent = "center";
                clonedNode.style.whiteSpace = "nowrap";
              }
            }
          } catch (err) {
            console.error("onclone error:", err);
          }
        },
      });

      // 5. Use PNG for best quality
      const imgData = canvas.toDataURL("image/png", 1.0);

      // 6. Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > -0.1) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      // 9. Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `ID_Cards_${classDiv.class}-${classDiv.division}_${timestamp}.pdf`;
      
      pdf.save(filename);
      toast.success(`High-quality PDF (300 DPI) generated successfully! ${totalStudents} ID cards included.`, { duration: 4000 });
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error(
        "Failed to generate PDF. Please ensure all images are loaded and try again."
      );
    } finally {
      // Restore original styles and cleanup
      try {
        printArea.style.width = originalWidth;
        printArea.className = originalClassName;
        removeDataCloneIds(printArea);
      } catch (e) {}
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button
        className="px-4 py-2 text-black-700 rounded hover:bg-gray-300 transition"
        onClick={() => window.history.back()}
      >
        ← Back To Template
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-1">ID Card Preview</h2>

      <p className="text-gray-600 text-sm mb-6">
        Review And Generate Id Card for Class {classDiv.class} - Division {classDiv.division}
      </p>

      <div className="mb-16 rounded-xl bg-blue-50 p-6 text-blue-800 shadow-sm border flex flex-wrap items-center justify-between gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">Students:</span>
          <span className="font-semibold text-blue-900">{totalStudents}</span>
        </div>

        <div className="flex items-center gap-2">
          <span>Approved:</span>
          <span className="font-semibold text-green-900">{meta.approved}</span>
        </div>

        <div className="flex items-center gap-2">
          <span>Cards Per Page:</span>
          <span className="font-semibold text-blue-900">{cardsPerPage}</span>
        </div>

        <div className="flex items-center gap-2">
          <span>Total Pages:</span>
          <span className="font-semibold text-blue-900">{totalPages}</span>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-4">Student ID Cards</h3>

      {realStudentCards.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No students found for this class/division</p>
          </div>
      ) : (
        <div
          id="student-cards-print-area"
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 pt-4 mb-16 ${
            orientation === "Vertical"
              ? "print:grid-cols-5 print:gap-1"
              : "print:grid-cols-2 print:gap-1 print:w-fit print:mx-auto"
          }`}
        >
          {realStudentCards.map((card) => (
            <div key={card.id} className="flex flex-col items-center">
              {orientation === "Horizontal" ? (
                <HorizontalCard card={card} />
              ) : (
                <VerticalCard card={card} />
              )}

              <div className="mt-4 px-6 space-y-3 max-w-xs w-full">
                <div className="text-sm font-semibold">{card.type}</div>

                {/* <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                  {card.tags.map((tag, i) => (
                    <span key={i} className="border border-gray-300 rounded px-2 py-1">
                      {tag}
                    </span>
                  ))}
                </div> */}

                {/* <div className="text-sm font-semibold mt-2">Features:</div> */}
                {/* <div className="flex flex-wrap gap-2">
                  {card.features.map((f, i) => (
                    <span key={i} className="bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-xs">
                      {f}
                    </span>
                  ))}
                </div> */}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="w-full flex justify-end gap-6 mt-10">
        <button
          className="w-64 py-1 bg-gray-200 text-gray-700 text-center text-lg font-medium rounded-lg shadow hover:bg-gray-300 transition"
          onClick={() => window.print()}
        >
          Print Preview
        </button>

        <button
          className={`w-64 py-1 text-center text-lg font-medium rounded-lg shadow transition ${
            isGenerating
              ? "bg-orange-400 text-gray-100 cursor-not-allowed"
              : "bg-orange-600 text-white hover:bg-orange-700"
          }`}
          onClick={handleGeneratePDF}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate PDF"}
        </button>
      </div>
    </div>
  );
}

