import React from 'react';
import IdentityCardTemplate3 from './IdentityCardTemplate3';

function Template3Page() {
  // Template 3 - Example data
  const studentData = {
    studentPhoto: './pic.jpeg',
    rollNumber: '123303',
    studentName: 'SINGH UTKARSH DEVIPRASAD',
    standard: "10th - A",
    dateOfBirth: '18.1.2009',
    address: 'Navjeevan Chawl, Appapada, Malad (E), Mum - 97',
    mobileNumber: '9920767317',
  };

  const schoolData = {
    headerSmall: 'Shree Shyam Education Trust',
    headerMain: 'SHIVAJI VIDYA MANDIR HIGH SCHOOL',
    headerAddress: 'Appa Pada, Malad (East), Mumbai - 97',
    medium: 'MEDIUM - SEMI ENGLISH',
    schoolLogo: './logo.png',
    academicYear: '2024 - 25',
    signatureImage: './sign.png',
    designation: 'Head Master',
  };

  return (
    <div>
      <IdentityCardTemplate3
        {...schoolData}
        {...studentData}
      />
    </div>
  );
}

export default Template3Page;

