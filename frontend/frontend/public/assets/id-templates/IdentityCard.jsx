import React from 'react';
import './IdentityCard.css';

const IdentityCard = ({
  // School Information
  schoolLogo = './logo.png',
  schoolName = 'Text for your School Name',
  registrationNumber = 'Reg. No. 1234567890',
  
  // Card Title Image
  cardTitleImage = './identity-card.png',
  
  // Student Photo
  studentPhoto = './pic.jpeg',
  
  // Student Details
  studentName = 'Sourabh Pal',
  fatherName = 'Shubham Singh Pal',
  motherName = 'Kanchan',
  studentClass = 'VI',
  dateOfBirth = '30/06/2014',
  address = 'Seoni. MP.',
  phoneNumber = '9123456789',
  
  // Background Image
  backgroundImage = './bg-front.png',
}) => {
  return (
    <div className="id-card-wrapper">
      <div 
        className="id-card"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        }}
      >
        {/* Header Section */}
        <div className="header">
          {/* Logo */}
          <div className="logo">
            <img src={schoolLogo} alt="School Logo" />
          </div>
          
          {/* School Name & Registration Number */}
          <div className="school-name">
            <h2>{schoolName}</h2>
            <h5>{registrationNumber}</h5>
          </div>
        </div>

        {/* Card Title Image */}
        <div className="card-title">
          <img src={cardTitleImage} alt="Card Title" />
        </div>

        {/* Student Photo */}
        <div className="photo">
          <img 
            src={studentPhoto} 
            alt="Student Photo" 
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Student Details */}
        <div className="student-info">
          <div className="field name">
            <label htmlFor="student-name">Name -</label>
            <span id="student-name">{studentName}</span>
          </div>
          
          <div className="field father">
            <label htmlFor="father-name">S/D of Mr. -</label>
            <span id="father-name">{fatherName}</span>
          </div>
          
          <div className="field mother">
            <label htmlFor="mother-name">S/D of Mrs. -</label>
            <span id="mother-name">{motherName}</span>
          </div>
          
          <div className="field class">
            <label htmlFor="student-class">Class -</label>
            <span id="student-class">{studentClass}</span>
          </div>
          
          <div className="field dob">
            <label htmlFor="date-of-birth">Date of Birth -</label>
            <span id="date-of-birth">{dateOfBirth}</span>
          </div>
          
          <div className="field address">
            <label htmlFor="student-address">Address -</label>
            <span id="student-address">{address}</span>
          </div>
          
          <div className="field phone">
            <label htmlFor="phone-number">Phone No. -</label>
            <span id="phone-number">{phoneNumber}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityCard;

