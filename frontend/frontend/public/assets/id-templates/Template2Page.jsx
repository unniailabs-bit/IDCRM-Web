import React from 'react';
import IdentityCardTemplate2 from './IdentityCardTemplate2';

function Template2Page() {
  // Template 2 - Example data
  const studentTemplate2 = {
    studentPhoto: './photo.png',
    studentId: '123456',
    studentName: 'Alveena S. Kudhus',
    fatherGuardian: 'Salam Kudhus',
    studentClass: "1st 'A'",
    emergencyCall: '97905 47171',
  };

  const schoolInfoTemplate2 = {
    schoolLogo: './logo.png',
    schoolName: 'WEBBIENCE NATIONAL PUBLIC SCHOOL',
    schoolAddress: 'Your School address, Street Name, City',
    schoolAddressLine2: 'School District, State, Pincode - 600006',
    affiliation: 'Affiliated to CBSE, New Delhi',
    schoolCode: '654321',
    backgroundImage: './template2-bg.jpeg',
  };

  return (
    <div>
      <IdentityCardTemplate2
        {...schoolInfoTemplate2}
        {...studentTemplate2}
      />
    </div>
  );
}

export default Template2Page;

