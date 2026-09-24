import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axiosInstance from '@/api/axiosInstance';
import { useAuth } from '@/hooks/useAuth';
// Import New Templates
import IdentityCardTemplate1 from './id-templates/IdentityCardTemplate1';
import IdentityCardTemplate3 from './id-templates/IdentityCardTemplate3';
import IdentityCardTemplate4 from './id-templates/IdentityCardTemplate4';
import { mapStudentToCard } from './id-templates/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import { Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ----------------------- COLOR SANITIZER HELPER (FIX FOR OKLCH ERROR) -----------------------
let _canvasCtx: CanvasRenderingContext2D | null = null;

/**
 * Converts modern CSS colors (like oklch) to RGBA using a temporary canvas.
 * html2canvas fails on oklch, but canvas context handles it gracefully by converting to rgba data.
 */
const getSafeColor = (color: string) => {
  if (!color || color === 'none' || color === 'transparent') return color;

  // Only intervene if we detect unsupported formats
  if (color.includes('oklch') || color.includes('lab') || color.includes('lch')) {
    try {
      if (!_canvasCtx) {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        _canvasCtx = canvas.getContext('2d', { willReadFrequently: true });
      }

      if (!_canvasCtx) return color;

      _canvasCtx.clearRect(0, 0, 1, 1);
      _canvasCtx.fillStyle = color;
      _canvasCtx.fillRect(0, 0, 1, 1);

      const [r, g, b, a] = _canvasCtx.getImageData(0, 0, 1, 1).data;
      return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    } catch (err) {
      console.warn('Failed to convert color:', color, err);
      return color;
    }
  }
  return color;
};

/**
 * Copy computed styles from original to cloned node, sanitizing colors.
 */
const copySafeComputedStyles = (original: HTMLElement, cloned: HTMLElement) => {
  const computed = window.getComputedStyle(original);
  const propsToClone = [
    'color',
    'backgroundColor',
    'borderColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'outlineColor',
    'fill',
    'stroke',
  ];

  propsToClone.forEach((prop) => {
    const val = computed.getPropertyValue(prop);
    if (val) {
      const safe = getSafeColor(val);
      cloned.style.setProperty(prop, safe);
    }
  });
};

/**
 * Assign unique data-clone-id to each element in the tree.
 */
let cloneIdCounter = 0;
const assignDataCloneIds = (root: HTMLElement) => {
  cloneIdCounter = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);
  while (walker.nextNode()) {
    const el = walker.currentNode as HTMLElement;
    el.setAttribute('data-clone-id', String(cloneIdCounter++));
  }
};

/**
 * Remove data-clone-id attributes after PDF generation.
 */
const removeDataCloneIds = (root: HTMLElement) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);
  while (walker.nextNode()) {
    const el = walker.currentNode as HTMLElement;
    el.removeAttribute('data-clone-id');
  }
};

// ----------------------- FINAL GALLERY -----------------------
export function IDCardPreview() {
  // Vite environment variable integration
  const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const { userData } = useAuth();

  const [masterSignature, setMasterSignature] = useState<string | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<{
    trustName: string;
    schoolName: string;
    address: string;
    state: string;
    logo: string | null;
  }>({
    trustName: '',
    schoolName: '',
    address: '',
    state: '',
    logo: null,
  });

  useEffect(() => {
    const fetchSchoolAssets = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Fetch Profile
        const profileRes = await axiosInstance.get('/api/school/settings/profile');
        if (profileRes.data.success) {
          const data = profileRes.data.data;
          const schoolId = data.id;

          // 2. Fetch Logo and Signature in parallel
          const [logoRes, signRes] = await Promise.allSettled([
            axiosInstance.get(`/api/school/${schoolId}/logo`),
            axiosInstance.get(`/api/school/${schoolId}/principal-sign`),
          ]);

          let logoUrl = null;
          if (
            logoRes.status === 'fulfilled' &&
            logoRes.value.data.success &&
            logoRes.value.data.logo
          ) {
            logoUrl = `${BASE_URL}${logoRes.value.data.logo}`;
          }

          if (
            signRes.status === 'fulfilled' &&
            signRes.value.data.success &&
            signRes.value.data.principal_sign
          ) {
            setMasterSignature(`${BASE_URL}${signRes.value.data.principal_sign}`);
          }

          setSchoolProfile({
            trustName: data.trust_name || userData?.trust_name || '',
            schoolName: data.school_name || userData?.name || 'School Name',
            address: data.address || userData?.address || '',
            state: data.state || userData?.state || '',
            logo: logoUrl,
          });
        }
      } catch (error) {
        console.error('Error fetching school data:', error);
      }
    };

    fetchSchoolAssets();
  }, [BASE_URL, userData]);

  const location = useLocation();
  const navigate = useNavigate();

  const {
    classDiv = { class: 'N/A', division: 'N/A' },
    students = [],
    meta = { approved: 0 },
    selectedTemplateName, // "template1" or "template3"
    schoolName: schoolNameProp,
  } = location.state || {};

  const [isGenerating, setIsGenerating] = useState(false);
  const schoolName = schoolNameProp || userData?.name || 'School Name';

  useEffect(() => {
    if (!classDiv.class || !students.length) {
      toast.error('No student data available');
      // setTimeout(() => navigate("/school-dashboard/digital-forms"), 100);
      // Better to go back to template selection or list
      setTimeout(() => window.history.back(), 100);
    }
  }, [classDiv.class, students.length, navigate]);

  const totalStudents = students.length;
  // Determine orientation based on template choice
  const isVertical = selectedTemplateName === 'template3'; // Template 2 is Horizontal/Landscape (720x420) based on css, Template 3 is Vertical (360x620)
  // Wait, let's double check CSS dimensions.
  // Template 2 CSS: width: 720px; height: 420px; -> Horizontal
  // Template 3 CSS: width: 360px; height: 620px; -> Vertical
  // Template 4 CSS: width: 360px; height: 620px; -> Vertical (Assuming same as T3 or similar)

  // Grid settings per page
  // A4 is 210mm x 297mm.
  // 720px is approx 190mm at 96dpi, 420px is approx 111mm.
  // So Template 2 (Horizontal) can probably fit 2 per page (one above another) or maybe scaled down?
  // Let's assume standard ID card size scaling for print.
  // Standard ID: 85.6mm x 54mm (Horizontal) or 54mm x 85.6mm (Vertical)

  // The CSS uses pixels which are large (720px). We might need to scale them down for the preview grid
  // OR rely on the component's internal sizing. The components use hardcoded pixel widths.
  // To fit on A4, we should scale them using CSS 'transform: scale()'.

  const cardsPerPage =
    selectedTemplateName === 'template1' ? 10 : selectedTemplateName === 'template4' ? 10 : 10;
  const totalPages = Math.ceil(totalStudents / cardsPerPage);

  // Group students into pages
  const paginatedCards = [];
  for (let i = 0; i < students.length; i += cardsPerPage) {
    paginatedCards.push(students.slice(i, i + cardsPerPage));
  }

  // Helper to map student to Template 1 props
  const getTemplate1Props = (student: any) => {
    const card: any = mapStudentToCard(student, classDiv, schoolProfile.schoolName || schoolName);
    return {
      schoolName: schoolProfile.schoolName || schoolName,
      registrationNumber: schoolProfile.trustName, // Using trust name as reg number or fallback
      studentPhoto: card.photoUrl,
      studentName: card.studentName,
      fatherName: card.father,
      motherName: card.mother,
      studentClass: classDiv.class,
      dateOfBirth: card.dob,
      address: card.address,
      phoneNumber: card.emergency,
      schoolLogo: schoolProfile.logo || '/assets/id-templates/logo.png',
      schoolAddress: schoolProfile.address,
      schoolState: schoolProfile.state,
    };
  };

  // Helper to map student to Template 3 props
  const getTemplate3Props = (student: any) => {
    const card: any = mapStudentToCard(student, classDiv, schoolProfile.schoolName || schoolName);
    return {
      headerSmall: schoolProfile.trustName,
      headerMain: schoolProfile.schoolName || schoolName,
      headerAddress: schoolProfile.address,
      schoolState: schoolProfile.state,
      schoolLogo: schoolProfile.logo || '/assets/id-templates/logo.png',
      studentPhoto: card.photoUrl,
      rollNumber: student.roll_number || '00',
      studentName: card.studentName,
      standard: classDiv.class,
      dateOfBirth: card.dob,
      address: card.address,
      mobileNumber: card.emergency,
    };
  };

  // Helper to map student to Template 4 props
  const getTemplate4Props = (student: any) => {
    const card: any = mapStudentToCard(student, classDiv, schoolProfile.schoolName || schoolName);
    return {
      trustName: schoolProfile.trustName,
      schoolName: schoolProfile.schoolName || schoolName,
      schoolAddress: schoolProfile.address,
      schoolState: schoolProfile.state,
      schoolLogo: schoolProfile.logo || '/assets/id-templates/logo.png',
      studentPhoto: card.photoUrl,
      studentName: card.studentName,
      rollNumber: student.roll_number || '00',
      standard: classDiv.class,
      division: classDiv.division,
      grNo: card.grNo,
      dob: card.dob,
      address: card.address,
      contactNumber: card.emergency,
      designation: 'Principal',
    };
  };

  // Simple wait for images to load in the DOM
  const waitForImagesToLoad = (element: HTMLElement): Promise<void> => {
    return new Promise((resolve) => {
      const images = element.querySelectorAll('img');
      const imageArray = Array.from(images);

      if (imageArray.length === 0) {
        resolve();
        return;
      }

      let loadedCount = 0;
      const totalImages = imageArray.length;

      const checkAllLoaded = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          console.log(`✅ All ${totalImages} images loaded or failed`);
          resolve();
        }
      };

      imageArray.forEach((img) => {
        if (img.complete) {
          checkAllLoaded();
        } else {
          img.addEventListener('load', checkAllLoaded);
          img.addEventListener('error', checkAllLoaded); // Count errors as "loaded" to not block
        }
      });
    });
  };

  const handleGeneratePDF = async () => {
    if (isGenerating) return;

    if (!students || students.length === 0) {
      toast.error('No students to process.');
      return;
    }

    setIsGenerating(true);
    console.log('🔍 Starting PDF generation for', students.length, 'students...');
    toast.info(`Generating high-quality PDF, please wait...`, { duration: 5000 });

    const printArea = document.getElementById('id-cards-print-area');
    // console.log('📋 Print area element:', printArea);

    if (!printArea) {
      console.error('❌ Print area not found!');
      toast.error('Print area not found. Please try again.');
      setIsGenerating(false);
      return;
    }

    try {

      const studentIds = students.map((s: any) => s.id).filter(Boolean);
      await axiosInstance.post('/api/school/generate-id', {
        student_form_ids: studentIds
      });

      // Wait for all images in the preview to load
      // console.log('📸 Waiting for images to load in preview...');
      await waitForImagesToLoad(printArea);
      // console.log('✅ Images ready');

      // Mark nodes with clone ids so onclone can map original -> cloned
      assignDataCloneIds(printArea);
      // console.log('✅ Data clone IDs assigned');

      // Calculate scale for better quality
      const scale = 2; // 2x scale for better quality
      // console.log('🎨 Starting html2canvas with scale:', scale);

      const canvas = await html2canvas(printArea, {
        scale: scale,
        useCORS: true,
        allowTaint: true, // Allow tainted canvas to capture all images
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          try {
            const clonedRoot = clonedDoc.getElementById('id-cards-print-area');
            if (!clonedRoot) return;

            const walker = clonedDoc.createTreeWalker(clonedRoot, NodeFilter.SHOW_ELEMENT, null);
            while (walker.nextNode()) {
              const clonedNode = walker.currentNode as HTMLElement;
              const id = clonedNode.getAttribute('data-clone-id');
              if (!id) continue;
              const originalNode = document.querySelector(
                `[data-clone-id="${id}"]`
              ) as HTMLElement | null;
              if (!originalNode) continue;
              copySafeComputedStyles(originalNode, clonedNode);
            }
          } catch (err) {
            console.error('onclone error:', err);
          }
        },
      });

      // console.log('✅ Canvas created, converting to image...');
      const imgData = canvas.toDataURL('image/png', 1.0);
      // console.log('✅ Image data created');

      // Create PDF
      // console.log('📄 Creating PDF document...');
      const pdf = new jsPDF({
        // orientation: 'potrait',
        orientation:
          selectedTemplateName === 'template1' || selectedTemplateName === 'template4'
            ? 'portrait'
            : 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: false,
      });

      // const imgWidth = 210; // A4 width in mm (potrait)
      // const pageHeight = 297; // A4 height in mm (potrait)
      const imgWidth =
        selectedTemplateName === 'template1' || selectedTemplateName === 'template4' ? 210 : 297; // A4 width in mm (portrait/landscape)
      const pageHeight =
        selectedTemplateName === 'template1' || selectedTemplateName === 'template4' ? 297 : 210; // A4 height in mm (portrait/landscape)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `ID_Cards_${classDiv.class}-${classDiv.division}_${timestamp}.pdf`;

      // console.log('💾 Saving PDF as:', filename);
      pdf.save(filename);
      // console.log('✅ PDF saved successfully!');
      toast.success(`PDF generated successfully! ${students.length} ID cards included.`, {
        duration: 4000,
      });
    } catch (error) {
      console.error('❌ PDF Generation Error:', error);
      toast.error('Failed to generate PDF. Please ensure all images are loaded and try again.');
    } finally {
      // Cleanup: Remove data-clone-ids
      try {
        removeDataCloneIds(printArea);
      } catch (e) {
        console.warn('Failed to remove data-clone-ids:', e);
      }
      setIsGenerating(false);
    }
  };

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-full">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          /* Ensure the print area and all its descendants are visible */
          #id-cards-print-area, #id-cards-print-area * {
            visibility: visible;
          }

          /* Position print area to cover the page */
          #id-cards-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background-color: white; 
            display: block !important; /* Override flex layout */
            z-index: 9999;
          }

          /* Force page breaks for each page wrapper */
          #id-cards-print-area > div {
             page-break-after: always;
             break-after: page;
             display: block !important;
             margin: 0 !important;
             padding: 0 !important;
          }

          /* Remove break from last page */
          #id-cards-print-area > div:last-child {
             page-break-after: avoid;
             break-after: avoid;
          }

          /* Clean up the A4 container styles for print */
          #id-cards-print-area > div > div {
             box-shadow: none !important;
             border: none !important;
             margin: 0 !important;
          }

          @page {
            size: auto;
            margin: 0mm;
          }
          
          /* Force color printing */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
      <div className="flex justify-between items-center mb-6">
        <Button
          className="flex items-center text-orange-500 border bg-white border-orange-600 hover:bg-orange-500 hover:text-white group"
          onClick={() => window.history.back()}
        >
          ← Back To Template
        </Button>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">ID Card Preview</h2>
          <p className="text-gray-600 mt-1">
            Class {classDiv.class} - Division {classDiv.division} | Total: {totalStudents} Students
          </p>
        </div>
        <div className="flex gap-4">
          {/* <button
            className="text-green-600 border border-green-700 hover:bg-green-600 hover:text-white px-3 rounded-lg text-lg font-semibold"
            onClick={() => window.print()}
          >
            Print List
          </button> */}
          <button
            className={`px-6 py-2 rounded-lg shadow-md transition font-medium text-white ${isGenerating
              ? 'bg-orange-400 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700'
              }`}
            onClick={handleGeneratePDF}
            disabled={isGenerating}
          >
            {isGenerating ? 'Processing...' : 'Generate ALL PDFs'}
          </button>
        </div>
      </div>

      <div id="id-cards-print-area" className="flex flex-wrap gap-4 w-fit h-fit">
        {paginatedCards.length === 0 ? (
          <div className="text-center py-12 rounded-lg shadow">
            <p className="text-gray-600">No students found for this class/division</p>
          </div>
        ) : (
          paginatedCards.map((pageCards, pageIdx) => (
            <div key={pageIdx} className="flex flex-col items-center">
              {/* <span className="text-xs text-gray-400 mb-2 font-mono uppercase tracking-wider">
                Page {pageIdx + 1}
              </span> */}

              {/* Page Container (A4 Style) */}
              <div
                className="bg-white shadow-lg mx-auto relative overflow-hidden"
                style={{
                  // width: '297mm', // A4 width in mm (potrait)
                  // minHeight: '210mm', // A4 height in mm (potrait)
                  width:
                    selectedTemplateName === 'template1' || selectedTemplateName === 'template4'
                      ? '210mm'
                      : '297mm', // A4 width in mm (landscape)
                  height:
                    selectedTemplateName === 'template1' || selectedTemplateName === 'template4'
                      ? '297mm'
                      : '210mm', // A4 height in mm (landscape)
                  // minHeight: selectedTemplateName === 'template1' ? '297mm' : '210mm', // A4 height in mm (landscape)
                  // padding: '10mm',
                  // padding:
                  //   selectedTemplateName === 'template1' || selectedTemplateName === 'template4'
                  //     ? '5mm'
                  //     : '10mm',
                  // marginBottom: '10mm',
                  border: '1px solid #e5e7eb',
                }}
              >
                {/* Print Header (Visible only in print?) - Optional */}
                {/* <div className="text-center mb-8 hidden print:block">
                  <h1 className="text-xl font-bold">{schoolName}</h1>
                  <p className="text-sm">Class: {classDiv.class} - {classDiv.division}</p>
                </div> */}

                <div
                  // className="grid justify-center gap-x-6"
                  className="grid justify-center"
                  style={{
                    gridTemplateColumns:
                      selectedTemplateName === 'template1' || selectedTemplateName === 'template4'
                        ? 'repeat(2, 1fr)'
                        : 'repeat(5, 1fr)', // Adjust columns
                    gap:
                      selectedTemplateName === 'template4'
                        ? '10px'
                        : selectedTemplateName === 'template1'
                          ? '0px'
                          : '',
                  }}
                >
                  {pageCards.map((student: any) => (
                    <div key={student.id} className="flex flex-col items-center">
                      {/* Wrapper for Scaling */}
                      <div
                        style={{
                          position: 'relative',
                          width:
                            selectedTemplateName === 'template1'
                              ? '340px'
                              : selectedTemplateName === 'template4'
                                ? '300px'
                                : '215px', // Adjusted for scale
                          height:
                            selectedTemplateName === 'template1'
                              ? '215px'
                              : selectedTemplateName === 'template4'
                                ? '186px'
                                : '340px', // Adjusted for scale
                        }}
                      >
                        <div
                          style={{
                            transform:
                              selectedTemplateName === 'template4'
                                ? 'scale(0.6)'
                                : selectedTemplateName === 'template1'
                                  ? 'scale(0.59)'
                                  : 'scale(0.6)',
                            transformOrigin: 'top left',
                            position: 'absolute',
                            top: 0,
                            left: selectedTemplateName === 'template1' ? -23 : 0,
                            width:
                              selectedTemplateName === 'template1'
                                ? '650px'
                                : selectedTemplateName === 'template4'
                                  ? '500px'
                                  : '360px',
                            height:
                              selectedTemplateName === 'template1'
                                ? '400px'
                                : selectedTemplateName === 'template4'
                                  ? '310px'
                                  : '620px',
                          }}
                        >
                          {selectedTemplateName === 'template1' && (
                            <IdentityCardTemplate1 {...getTemplate1Props(student)} />
                          )}
                          {selectedTemplateName === 'template3' && (
                            <IdentityCardTemplate3
                              {...getTemplate3Props(student)}
                              apiSignature={masterSignature}
                            />
                          )}
                          {selectedTemplateName === 'template4' && (
                            <IdentityCardTemplate4
                              {...getTemplate4Props(student)}
                              signatureImage={masterSignature || '/assets/id-templates/sign.png'}
                            />
                          )}
                        </div>
                      </div>

                      {/* Cut marks or Border for the physical card area */}
                      {selectedTemplateName !== 'template1' && (
                        <div
                          className={`${selectedTemplateName === 'template1' ? 'mt-0' : 'mt-2 mb-2'
                            } text-[10px] text-gray-400 font-mono`}
                        >
                          {student.student_name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
