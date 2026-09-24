
import React from 'react';
import './IdentityCardTemplate1.css';

const IdentityCardTemplate1 = ({
    // School Information
    schoolLogo = '/assets/id-templates/logo.png',
    schoolName = 'Text for your School Name',
    registrationNumber = 'Reg. No. 1234567890',
    schoolAddress = '',
    schoolState = '',

    // Card Title Image
    cardTitleImage = '/assets/id-templates/identity-card.png',

    // Student Photo
    studentPhoto = '/assets/id-templates/pic.jpeg',

    // Student Details
    studentName = 'Sourabh Pal',
    fatherName = 'Shubham Singh Pal',
    motherName = 'Kanchan',
    studentClass = 'VI',
    dateOfBirth = '30/06/2014',
    address = 'Seoni. MP.',
    phoneNumber = '9123456789',

    // Background Image
    backgroundImage = '/assets/id-templates/bg-front.png',
}: any) => {
    return (
        <div className="id-card-wrapper-template1">
            <div
                className="id-card-template1"
                style={{
                    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                }}
            >
                {/* Header Section */}
                <div className="header-template1">
                    {/* Logo */}
                    <div className="logo-template1">
                        <img src={schoolLogo} alt="Logo" onError={(e: any) => e.target.style.display = 'none'} />
                    </div>
                    {/* School Name & Reg. No. */}
                    <div className="school-name">
                        <h2>{schoolName}</h2>
                        {/* <h5>{registrationNumber}</h5> */}
                        {(schoolAddress || schoolState) && (
                            <h6 style={{ fontSize: '8px', color: '#1e3a8a', marginTop: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                {schoolAddress}{schoolState ? `, ${schoolState}` : ''}
                            </h6>
                        )}
                    </div>
                </div>

                {/* Photo */}
                <div className="photo-template1">
                    <img src={studentPhoto} alt="Student Photo" onError={(e: any) => e.target.style.display = 'none'} />
                </div>

                <div className="card-title-template1">
                    <img src={cardTitleImage} alt="Card Title" />
                </div>

                {/* Student Details */}
                <div className="student-info-template1">

                    <div className="field-template1 name-template1">
                        <label>Name -</label> <span>{studentName}</span>
                    </div>

                    <div className="field-template1 father-template1">
                        <label>S/D of Mr. -</label>
                        <span>{fatherName}</span>
                    </div>

                    <div className="field-template1 mother-template1">
                        <label>S/D of Mrs. -</label>
                        <span>{motherName}</span>
                    </div>

                    <div className="field-template1 class-template1">
                        <label>Class -</label>
                        <span>{studentClass}</span>
                    </div>

                    <div className="field-template1 dob-template1">
                        <label>Date of Birth -</label>
                        <span>{dateOfBirth}</span>
                    </div>

                    <div className="field-template1 address-template1">
                        <label>Address -</label>
                        <span>{address && address.length > 25 ? address.substring(0, 25) + '...' : address}</span>
                    </div>

                    <div className="field-template1 phone-template1">
                        <label>Phone No. -</label>
                        <span>{phoneNumber}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IdentityCardTemplate1;
