import React from 'react';
import './IdentityCardTemplate4.css';

const IdentityCardTemplate4 = ({
    // School Info
    trustName = '',
    schoolName = '',
    schoolAddress = '',
    schoolState = '',
    schoolLogo = '',

    // Student Info
    studentPhoto = '/assets/id-templates/pic.jpeg',
    studentName = 'Sourabh Pal',
    rollNumber = '01',
    standard = 'P-I',
    division = 'B',
    grNo = '1234',
    dob = '30/06/2014',
    address = 'Malad West, Mumbai',
    contactNumber = '9819352691',

    // Signature
    signatureImage,
    designation = 'Principal',
}: any) => {
    // console.log('Template 4 Props:', { trustName, schoolName, schoolAddress, signatureImage });
    return (
        <div className="id-card-wrapper-template4">
            <div className="id-card-template4">
                {/* Header */}
                <div className="header-template4">
                    <div className="logo-section-template4">
                        <img
                            src={schoolLogo || '/assets/id-templates/logo.png'}
                            alt="Logo"
                            className="logo-template4"
                            onError={(e: any) => {
                                console.warn("Logo failed to load:", schoolLogo);
                                if (schoolLogo) e.target.src = '/assets/id-templates/logo.png';
                                else e.target.style.display = 'none';
                            }}
                        />
                    </div>
                    <div className="header-text-template4">
                        <div className="trust-name-template4">{trustName}</div>
                        <div className="school-name-template4">{schoolName}</div>
                        <div className="school-address-template4">
                            {schoolAddress}{schoolState ? `, ${schoolState}` : ''}
                        </div>
                    </div>
                </div>

                {/* Photo & Signature Column */}
                <div className="left-column-template4">
                    <div className="photo-section-template4">
                        <img src={studentPhoto} alt="Student" className="photo-template4" onError={(e: any) => e.target.style.display = 'none'} />
                    </div>

                    <div className="signature-section-template4">
                        {signatureImage && (
                            <img
                                src={signatureImage}
                                alt="Sign"
                                className="signature-img-template4"
                                onError={(e: any) => {
                                    console.warn("Signature failed to load:", signatureImage);
                                    e.target.style.display = 'none';
                                }}
                            />
                        )}
                        <div className="principal-label-template4">{designation}</div>
                    </div>
                </div>

                {/* Details */}
                <div className="details-template4">
                    <div className="detail-row-template4">
                        <span className="detail-label-template4">Name:</span>
                        <span className="detail-value-template4 student-name-template4">{studentName}</span>
                    </div>

                    <div className="detail-row-template4">
                        <span className="detail-label-template4">Std:</span>
                        <span className="detail-value-template4" style={{ display: 'flex', gap: '10px' }}>
                            <span>{standard} - {division}</span>
                            {/* <span style={{ marginLeft: '10px' }}>GR No: {grNo}</span> */}
                        </span>
                    </div>

                    <div className="detail-row-template4">
                        <span className="detail-label-template4">DOB:</span>
                        <span className="detail-value-template4 dob-val-template4">{dob}</span>
                    </div>

                    <div className="detail-row-template4">
                        <span className="detail-label-template4">Address:</span>
                        <span className="detail-value-template4 address-val-template4">{address}</span>
                    </div>

                    <div className="detail-row-template4">
                        <span className="detail-label-template4">Mobile:</span>
                        <span className="detail-value-template4">{contactNumber}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IdentityCardTemplate4;
