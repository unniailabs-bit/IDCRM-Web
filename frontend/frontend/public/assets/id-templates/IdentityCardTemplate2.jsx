import React from 'react';
import './IdentityCardTemplate2.css';

const IdentityCardTemplate2 = ({
  // School Information
  schoolLogo = './logo.png',
  schoolName = 'WEBBIENCE NATIONAL PUBLIC SCHOOL',
  schoolAddress = 'Your School address, Street Name, City',
  schoolAddressLine2 = 'School District, State, Pincode - 600006',
  
  // Student Information
  studentPhoto = './photo.png',
  studentId = '123456',
  studentName = 'Alveena S. Kudhus',
  fatherGuardian = 'Salam Kudhus',
  studentClass = "1st 'A'",
  emergencyCall = '97905 47171',
  
  // Footer Information
  affiliation = 'Affiliated to CBSE, New Delhi',
  schoolCode = '654321',
  
  // Background Image
  backgroundImage = './template2-bg.jpeg',
  
  // Signature
  signature = 'Signature Here',
  principalLabel = 'PRINCIPAL',
}) => {
  return (
    <div className="id-card-wrapper-template2">
      <div 
        className="id-card-template2"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        }}
      >
        {/* School Logo */}
        <img src={schoolLogo} className="logo-template2" alt="School Logo" />

        {/* School Name */}
        <div className="school-name-template2">{schoolName}</div>

        {/* School Address */}
        <div className="school-address-template2">
          {schoolAddress}<br />
          {schoolAddressLine2}
        </div>

        {/* Student Photo */}
        <div className="photo-template2">
          <img 
            src={studentPhoto} 
            alt="Student Photo"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Student Details */}
        <div className="details-template2">
          <div>
            <span>Student ID</span> : {studentId}
          </div>
          <div>
            <span>Student Name</span> : {studentName}
          </div>
          <div>
            <span>Father/Guardian</span> : {fatherGuardian}
          </div>
          <div>
            <span>Class</span> : {studentClass}
          </div>
          <div>
            <span>Emergency Call</span> : {emergencyCall}
          </div>
        </div>

        {/* Signature */}
        <div className="signature-template2">{signature}</div>
        <div className="principal-template2">{principalLabel}</div>

        {/* Footer */}
        <div className="footer-template2">
          <div className="identity-card-template2">IDENTITY CARD</div>
          <div className="footer-text-template2">
            <small>
              ({affiliation} · School Code : {schoolCode})
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityCardTemplate2;

