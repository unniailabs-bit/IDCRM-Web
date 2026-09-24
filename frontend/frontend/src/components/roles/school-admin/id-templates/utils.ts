export function mapStudentToCard(
  student: any,
  classDiv: { class: string; division: string },
  schoolName: string
) {
  if (!student) return {};

  // Construct student name correctly including middle name with father fallback
  const studentMiddle =
    student.middle_name ||
    student.father_first_name ||
    (student.father_name ? student.father_name.split(' ')[0] : '');
  const studentFullName =
    student.first_name || student.last_name
      ? `${student.first_name || ''} ${studentMiddle} ${student.last_name || ''}`
        .replace(/\s+/g, ' ')
        .trim()
      : student.student_name || student.name || student.fullName || '';

  // Construct father name correctly
  const fatherFullName =
    student.father_first_name || student.father_last_name
      ? `${student.father_first_name || ''} ${student.father_middle_name || ''} ${student.father_last_name || ''
        }`
        .replace(/\s+/g, ' ')
        .trim()
      : student.father_name || student.fatherName || student.parent_name || '';

  // Construct mother name correctly
  const motherFullName =
    student.mother_first_name || student.mother_last_name
      ? `${student.mother_first_name || ''} ${student.mother_middle_name || ''} ${student.mother_last_name || ''
        }`
        .replace(/\s+/g, ' ')
        .trim()
      : student.mother_name || student.motherName || '';

  // Construct the class/roll string expected by the component
  // Expected format: "Class <className> <division> | Roll <rollNumber>"
  const className = classDiv?.class || '';
  const division = classDiv?.division || '';
  const rollNumber = student.roll_number || student.rollNumber || '';

  const classRoll = `Class ${className} ${division} | Roll ${rollNumber}`;

  return {
    photoUrl: student.image || student.photo_url || student.photo || '',
    studentName: studentFullName,
    father: fatherFullName,
    mother: motherFullName,
    classRoll: classRoll,
    dob: student.dob || student.date_of_birth || student.dateOfBirth || '',
    address: student.address || student.current_address || '',
    emergency: student.emergency_contact || student.mobile || student.phone || '',
  };
}
