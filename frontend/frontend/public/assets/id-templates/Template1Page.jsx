import React from 'react';
import IdentityCard from './IdentityCard';

function Template1Page() {
  // Template 1 - Example data
  const student1 = {
    studentName: 'Sourabh Pal',
    fatherName: 'Shubham Singh Pal',
    motherName: 'Kanchan',
    studentClass: 'VI',
    dateOfBirth: '30/06/2014',
    address: 'Seoni. MP.',
    phoneNumber: '9123456789',
    studentPhoto: './pic.jpeg',
  };

  const schoolInfo = {
    schoolLogo: './logo.png',
    schoolName: 'Text for your School Name',
    registrationNumber: 'Reg. No. 1234567890',
    cardTitleImage: './identity-card.png',
    backgroundImage: './bg-front.png',
  };

  return (
    <div>
      <IdentityCard
        {...schoolInfo}
        {...student1}
      />
    </div>
  );
}

export default Template1Page;

