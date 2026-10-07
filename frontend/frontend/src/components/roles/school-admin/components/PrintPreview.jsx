import React from 'react';
import { CardElement } from './CardElement';
import { getPageLayout, PAGE_MARGIN_MM } from '../utils';
import { translateBatch } from '../../../../utils/translationService';

// Helper to extract value regardless of translation
const extractValue = (element, student, schoolData) => {
  let resolvedContent = element.content;

  if (element.type === 'field') {
    if (element.field.startsWith('student.')) {
      const key = element.field.split('.')[1];
      const map = {
        name: ['name', 'student_name'],
        standard: ['standard', 'std', 'class'],
        dob: ['dob', 'date_of_birth'],
        address: ['address'],
        roll_number: ['roll_number', 'rollNo', 'id'],
        gender: ['gender'],
        blood_group: ['blood_group', 'bloodGroup'],
        father_name: ['father_name', 'fatherName'],
        mother_name: ['mother_name', 'motherName'],
        father_phone: ['father_phone', 'fatherPhone'],
        mother_phone: ['mother_phone', 'motherPhone'],
        parent_email: ['parent_email', 'parentEmail'],
        emergency_contact: ['emergency_contact', 'emergencyContact'],
      };

      const possibleKeys = map[key] || [key];
      const foundKey = possibleKeys.find((k) => student && student[k] !== undefined);

      let value = foundKey
        ? student[foundKey]
        : (student && student[key]) || element.defaultData?.text || key;

      // Special handling for DOB formatting to dd/mm/yyyy
      if ((key === 'dob' || key === 'date_of_birth') && value) {
        if (typeof value === 'string' && value.includes('-')) {
          const parts = value.split('-');
          if (parts.length === 3) {
            const [y, m, d] = parts;
            if (y.length === 4) {
              value = `${d}/${m}/${y}`;
            }
          }
        }
      }

      // Special handling for names to ensure middle name is included if parts exist
      if (key === 'name' || key === 'student_name') {
        if (student?.first_name || student?.last_name) {
          const middle = student.middle_name || student.father_first_name || (student.father_name ? student.father_name.split(' ')[0] : '');
          value = `${student.first_name || ''} ${middle} ${student.last_name || ''}`
            .replace(/\s+/g, ' ')
            .trim();
        }
      } else if (key === 'father_name') {
        if (student?.father_first_name || student?.father_last_name) {
          value = `${student.father_first_name || ''} ${student.father_middle_name || ''} ${student.father_last_name || ''}`
            .replace(/\s+/g, ' ')
            .trim();
        }
      } else if (key === 'mother_name') {
        if (student?.mother_first_name || student?.mother_last_name) {
          value = `${student.mother_first_name || ''} ${student.mother_middle_name || ''} ${student.mother_last_name || ''}`
            .replace(/\s+/g, ' ')
            .trim();
        }
      }

      resolvedContent = value;
    } else if (element.field.startsWith('school.')) {
      const key = element.field.split('.')[1];

      const possibleKeys = {
        name: ['school_name', 'schoolName', 'name'],
        address: ['school_address', 'address'],
        trust_name: ['trust_name', 'trustName'],
      }[key] || [key];

      const foundKey = possibleKeys.find((k) => student && student[k] !== undefined);

      let value = foundKey ? student[foundKey] : undefined;

      // Fallback to schoolData prop
      if (!value && schoolData) {
        if (schoolData[key]) value = schoolData[key];
      }

      resolvedContent = value || element.defaultData?.text || key;
    }
  }
  return resolvedContent;
};

// Helper to convert English digits to Local (Marathi/Hindi)
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

export const PrintPreview = (props) => {
  const { template, students, schoolData, language = 'en', onProgress } = props;
  const dataToPrint = students.length > 0 ? students : [{}];
  const isPortrait = template?.orientation === 'vertical';

  const {
    widthMm,
    heightMm,
    pageWidthMm,
    pageHeightMm,
    gapMm,
    columns,
    rows,
    cardsPerPage,
  } = getPageLayout(template);

  const [translations, setTranslations] = React.useState({});

  React.useEffect(() => {
    const translateData = async () => {
      if (!template?.elements) return;

      // If language is English, clear translations and return
      if (language === 'en') {
        setTranslations({});
        return;
      }

      // Notify parent start
      if (props.onTranslationStart) props.onTranslationStart();

      const textsToTranslate = new Set();

      // Collect all dynamic texts from all students for all fields AND static text elements
      dataToPrint.forEach((student) => {
        template.elements.forEach((element) => {
          if (element.type === 'field') {
            const val = extractValue(element, student, schoolData);
            if (val !== undefined && val !== null) {
              const strVal = String(val).trim();
              if (strVal !== '') {
                textsToTranslate.add(strVal);
              }
            }
          }
          // Also translate static text labels
          if (element.type === 'text' && element.content) {
            const strVal = String(element.content).trim();
            if (strVal !== '') {
              textsToTranslate.add(strVal);
            }
          }
        });
      });

      if (textsToTranslate.size > 0) {
        try {
          const result = await translateBatch(Array.from(textsToTranslate), language, onProgress);
          setTranslations(result);
        } catch (e) {
          console.error('Translation error', e);
        }
      }

      // Notify parent end
      if (props.onTranslationEnd) props.onTranslationEnd();
    };

    translateData();
  }, [template, students, schoolData, language]);

  // Removed blocking loading state to allow printing structure even if updating,
  // though parent should block 'print' action until ready.
  /*
  if (isTranslating) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="text-lg">
          Translating data to {language === 'mr' ? 'Marathi' : 'Hindi'}...
        </div>
      </div>
    );
  }
  */

  return (
    <div id="print-container">
      {/* Inject Page Size Style dynamically */}
      <style>
        {`
          @media print {
            @page {
              /* Explicit A4 so the printer's default paper (e.g. Letter) doesn't trigger fit-to-page scaling */
              size: A4 ${isPortrait ? 'landscape' : 'portrait'};
              margin: 0mm; /* We handle margins in the container to control exact positioning */
            }
            body {
              margin: 0;
            }
          }
        `}
      </style>

      {dataToPrint.map((student, index) => {
        const isPageStart = index % cardsPerPage === 0;
        if (!isPageStart) return null;

        const chunk = dataToPrint.slice(index, index + cardsPerPage);

        return (
          <div
            key={index}
            className="page bg-white mx-auto grid relative"
            style={{
              width: `${pageWidthMm}mm`,
              height: `${pageHeightMm}mm`,
              padding: 0,
              boxSizing: 'border-box',
              placeContent: 'start center',
              paddingTop: `${PAGE_MARGIN_MM}mm`,
              gridTemplateColumns: `repeat(${columns}, ${widthMm}mm)`,
              gridTemplateRows: `repeat(${rows}, ${heightMm}mm)`,
              gap: `${gapMm}mm`,
              breakAfter: 'page',
              overflow: 'hidden',
            }}
          >
            {chunk.map((s, i) => (
              <div
                key={i}
                className="relative overflow-hidden"
                style={{
                  width: `${widthMm}mm`,
                  height: `${heightMm}mm`,
                  boxSizing: 'border-box',
                  backgroundColor: 'white',
                  pageBreakInside: 'avoid',
                  // Cut guide drawn OUTSIDE the card (outline takes no space), so cutting
                  // along the inner edge of the line yields the exact card size. A border
                  // here would eat ~0.3mm per side from the printed card.
                  outline: '0.2mm dashed #9ca3af',
                  outlineOffset: 0,
                }}
              >
                {/* Render Background Image Layer */}
                {template?.backgroundImage && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: 0,
                    }}
                  >
                    <img
                      src={template.backgroundImage}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'fill',
                        opacity: template.backgroundOpacity ?? 1,
                      }}
                    />
                  </div>
                )}
                {/* Render Template Elements */}
                {(template?.elements || []).map((element) => {
                  let resolvedContent = element.content;
                  let resolvedData = element.data;

                  if (element.type === 'field') {
                    // Reuse extraction logic
                    resolvedContent = extractValue(element, s, schoolData);

                    // Apply translation if available
                    let translated = resolvedContent;

                    if (
                      language !== 'en' &&
                      resolvedContent &&
                      translations[String(resolvedContent).trim()]
                    ) {
                      translated = translations[String(resolvedContent).trim()];
                    }

                    if (language === 'mr' || language === 'hi') {
                      resolvedContent = toLocalDigits(translated);
                    } else {
                      resolvedContent = translated;
                    }
                  }

                  // Handle Static Text Translation
                  if (element.type === 'text' && element.content) {
                    let translated = element.content;
                    const strVal = String(element.content).trim();

                    if (language !== 'en' && strVal && translations[strVal]) {
                      translated = translations[strVal];
                    }

                    if (language === 'mr' || language === 'hi') {
                      resolvedContent = toLocalDigits(translated);
                    } else {
                      resolvedContent = translated;
                    }
                  }

                  // Images logic
                  if (element.type === 'image' && element.field === 'student.photo') {
                    resolvedData = {
                      ...element.data,
                      src: s?.photo || element.data?.src,
                    };
                  }
                  if (element.type === 'image' && element.field === 'student.student_signature') {
                    resolvedData = {
                      ...element.data,
                      src: s?.student_signature || s?.sign || s?.Sign || element.data?.src,
                    };
                  }
                  if (element.type === 'image' && element.field === 'school.principal_sign') {
                    resolvedData = {
                      ...element.data,
                      src: s?.principal_sign || schoolData?.principal_sign || element.data?.src,
                    };
                  }
                  if (element.type === 'image' && element.field === 'school.logo') {
                    resolvedData = {
                      ...element.data,
                      src: s?.school_logo || schoolData?.school_logo || element.data?.src,
                    };
                  }

                  // Clone element with resolved content
                  const resolvedElement = {
                    ...element,
                    content: resolvedContent,
                    data: resolvedData,
                  };

                  return (
                    <div
                      key={element.id}
                      style={{
                        position: 'absolute',
                        left: `${element.x}mm`,
                        top: `${element.y}mm`,
                        width: `${element.width}mm`,
                        height: `${element.height}mm`,
                        zIndex: element.style?.zIndex || 1,
                        // Ensure text doesn't get clipped by the absolute wrapper
                        overflow:
                          element.type === 'text' ||
                          element.type === 'field' ||
                          element.type === 'shape' // strokes/shadows sit on the edge
                            ? 'visible'
                            : 'hidden',
                      }}
                    >
                      <CardElement element={resolvedElement} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};
