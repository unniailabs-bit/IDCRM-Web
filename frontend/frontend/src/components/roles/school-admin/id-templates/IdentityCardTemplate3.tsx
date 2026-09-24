import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './IdentityCardTemplate3.css';

const IdentityCardTemplate3 = ({
  headerSmall = 'Shree Shyam Education Trust',
  headerMain = 'SHIVAJI VIDYA MANDIR HIGH SCHOOL',
  headerAddress = 'Appa Pada, Malad (East), Mumbai - 97',
  schoolState = '',
  medium = 'MEDIUM - SEMI ENGLISH',
  schoolLogo = '/assets/id-templates/logo.png',
  academicYear = '2024 - 25',
  studentPhoto = '/assets/id-templates/photo.png',
  rollNumber = '123303',
  studentName = 'SINGH UTKARSH DEVIPRASAD',
  standard = '10th - A',
  dateOfBirth = '18.1.2009',
  address = 'Navjeevan Chawl, Appapada, Malad (E), Mum - 97',
  mobileNumber = '9920767317',
  designation = 'Head Master',
  apiSignature,
}: any) => {
  // const [apiSignature, setApiSignature] = useState<string | null>(null);

  // Vite environment variable integration
  const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // useEffect(() => {
  // const fetchSignature = async () => {
  //   try {
  //     const token = localStorage.getItem('token');

  //     // API call using dynamic BASE_URL
  //     const response = await axios.get(`${BASE_URL}/api/school/1/principal-sign`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     if (response.data.success) {
  //       // Path formatting: image URL create karna
  //       const fullImageUrl = `${BASE_URL}${response.data.principal_sign}`;
  //       setApiSignature(fullImageUrl);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching principal signature:', error);
  //   }
  // };

  // fetchSignature();
  // }, [masterSignature]);

  return (
    <div className="id-card-wrapper-template3">
      <div className="id-card-template3">
        <div className="header-template3">
          <div className="header-small-template3">{headerSmall}</div>
          <div className="header-main-template3">{headerMain}</div>
          <div className="header-address-template3">
            {headerAddress}{schoolState ? `, ${schoolState}` : ''}
            <br />
            <span>{medium}</span>
          </div>
        </div>

        <img
          src={schoolLogo}
          className="logo-template3"
          alt="School Logo"
          onError={(e: any) => (e.target.style.display = 'none')}
        />
        <div className="year-template3">{academicYear}</div>

        <div className="photo-template3">
          <img
            src={studentPhoto}
            alt="Student Photo"
            onError={(e: any) => {
              e.target.style.display = 'none';
            }}
          />
        </div>

        <div className="roll-template3">{rollNumber}</div>
        <div className="name-template3">{studentName}</div>

        <div className="details-template3">
          <div>
            <span>Std.</span> : {standard}
          </div>
          <div>
            <span>D.O.B.</span> : {dateOfBirth}
          </div>
          <div>
            <span>Add.</span> :
            <div style={{ display: 'inline-block', verticalAlign: 'top' }}>
              {address.split(',').map((part: string, index: number) => (
                <React.Fragment key={index}>
                  {index === 0 ? part.trim() : <>, {part.trim()}</>}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div>
            <span>Mob.No.</span> : {mobileNumber}
          </div>
        </div>

        {/* API integrated Signature */}
        {apiSignature && (
          <img
            src={apiSignature}
            className="sign-template3"
            alt="Signature"
            onError={(e: any) => {
              e.target.style.display = 'none';
            }}
          />
        )}

        <div className="designation-template3">{designation}</div>
      </div>
    </div>
  );
};

export default IdentityCardTemplate3;
