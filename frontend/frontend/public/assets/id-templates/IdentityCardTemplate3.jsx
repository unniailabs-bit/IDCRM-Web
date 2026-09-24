import React from 'react';
import './IdentityCardTemplate3.css';

const IdentityCardTemplate3 = ({
  // Header Information
  headerSmall = 'Shree Shyam Education Trust',
  headerMain = 'SHIVAJI VIDYA MANDIR HIGH SCHOOL',
  headerAddress = 'Appa Pada, Malad (East), Mumbai - 97',
  medium = 'MEDIUM - SEMI ENGLISH',
  
  // School Information
  schoolLogo = './logo.png',
  academicYear = '2024 - 25',
  
  // Student Information
  studentPhoto = './pic.jpeg',
  rollNumber = '123303',
  studentName = 'SINGH UTKARSH DEVIPRASAD',
  standard = "10th - A",
  dateOfBirth = '18.1.2009',
  address = 'Navjeevan Chawl, Appapada, Malad (E), Mum - 97',
  mobileNumber = '9920767317',
  
  // Signature
  signatureImage = './sign.png',
  designation = 'Head Master',
}) => {
  return (
    <div className="id-card-wrapper-template3">
      <div className="id-card-template3">
        {/* Header Section with Red Background */}
        <div className="header-template3">
          <div className="header-small-template3">{headerSmall}</div>
          <div className="header-main-template3">{headerMain}</div>
          <div className="header-address-template3">
            {headerAddress}<br />
            <span>{medium}</span>
          </div>
        </div>

        {/* Logo */}
        <img src={schoolLogo} className="logo-template3" alt="School Logo" />

        {/* Academic Year */}
        <div className="year-template3">{academicYear}</div>

        {/* Photo */}
        <div className="photo-template3">
          <img 
            src={studentPhoto} 
            alt="Student Photo"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Roll / ID */}
        <div className="roll-template3">{rollNumber}</div>

        {/* Name */}
        <div className="name-template3">{studentName}</div>

        {/* Details */}
        <div className="details-template3">
          <div>
            <span>Std.</span> : {standard}
          </div>
          <div>
            <span>D.O.B.</span> : {dateOfBirth}
          </div>
          <div>
            <span>Add.</span> : {address.split(',').length > 1 ? (
              <>
                {address.split(',').map((part, index) => (
                  <React.Fragment key={index}>
                    {index === 0 ? part.trim() : <><br />{part.trim()}</>}
                  </React.Fragment>
                ))}
              </>
            ) : (
              address
            )}
          </div>
          <div>
            <span>Mob.No.</span> : {mobileNumber}
          </div>
        </div>

        {/* Signature */}
        <img 
          src={signatureImage} 
          className="sign-template3" 
          alt="Signature"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="designation-template3">{designation}</div>
      </div>
    </div>
  );
};

export default IdentityCardTemplate3;

