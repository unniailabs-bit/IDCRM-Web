// StudentIdCard.tsx
// Web version of the mobile app's Digital ID Card.
// Opened when a student's QR code is scanned.
// Layout mirrors digital_id_view.dart exactly.

import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axiosInstance from '@/api/axiosInstance';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';

// ── Icons (inline SVG to avoid extra deps) ──────────────────────
const IconSchool = () => (
  <svg viewBox="0 0 24 24" width={40} height={40} fill="#6200EA">
    <path d="M12 3L1 9l4 2.18V17h2v-4.82L9 13.36V17h6v-3.64l2-1.1V17h2v-5.82L23 9 12 3zm0 2.26L19.68 9 12 12.74 4.32 9 12 5.26z"/>
  </svg>
);
const IconPerson = () => (
  <svg viewBox="0 0 24 24" width={40} height={40} fill="white">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
  </svg>
);
const IconQr = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="#7C4DFF">
    <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v2h2v-2zm0 4h-2v2h2v-2zm-4 0h-2v2h2v-2zm0 4h-2v2h2v-2zm4 0h-2v2h2v-2zm2-8h-2v2h2v-2z"/>
  </svg>
);
const IconCalendar = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="#7C4DFF">
    <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
  </svg>
);
const IconFather = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="#7C4DFF">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);
const IconPhone = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="#7C4DFF">
    <path d="M6.62 10.79A15.053 15.053 0 0013.21 17.38l2.12-2.12a1 1 0 011.02-.24 11.36 11.36 0 003.56.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.56 1 1 0 01-.25 1.02L6.62 10.79z"/>
  </svg>
);
const IconLocation = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="#7C4DFF">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);
const IconBlood = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="#7C4DFF">
    <path d="M12 2l-5.5 9h11L12 2zm0 3.84L14.1 9h-4.2L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5S15.01 22 17.5 22s4.5-2.01 4.5-4.5S19.99 13 17.5 13zM6.5 20c1.93 0 3.5-1.57 3.5-3.5H3c0 1.93 1.57 3.5 3.5 3.5z"/>
  </svg>
);

// ── Detail row (matches _buildDetailItem in Flutter) ─────────────
function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: 16,
      borderRadius: 15,
      backgroundColor: 'rgba(243,229,245,0.5)',
      marginBottom: 12,
    }}>
      <div style={{
        padding: 8,
        borderRadius: 10,
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 11, color: '#90A4AE', fontWeight: 500 }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: 14, color: '#2D3436', fontWeight: 700 }}>{value || 'N/A'}</p>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────
export default function StudentIdCard() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axiosInstance
      .get(`/api/student/public/${id}`)
      .then((res) => {
        const s = res.data?.student || res.data?.data || res.data;
        setStudent(s);
      })
      .catch((e) => {
        console.error(e);
        setError('Could not load student details.');
        toast.error('Could not load student details.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F5F3FF' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, border: '4px solid #E9D5FF',
            borderTopColor: '#7C4DFF', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
          }}/>
          <p style={{ color: '#7C4DFF', fontWeight: 600 }}>Loading ID Card…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !student) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F5F3FF' }}>
        <p style={{ color: '#E53935', fontWeight: 600, fontSize: 16 }}>{error || 'Student not found.'}</p>
      </div>
    );
  }

  // ── Build display values ─────────────────────────────────────
  const name = student.student_name || student.name || 'Student Name';
  const grade = `Class ${student.standard || student.class || ''} ${student.division ? '- ' + student.division : ''}`.trim();
  const rollNo = `Roll No: ${student.roll_number || student.rollNo || 'N/A'}`;
  const bloodGroup = `Blood Group: ${student.blood_group || student.bloodGroup || 'N/A'}`;
  const dob = student.dob || student.date_of_birth || 'N/A';
  const fatherName = student.father_name || student.fatherName || 'N/A';
  const motherName = student.mother_name || student.motherName || 'N/A';
  const phone = student.father_phone || student.mother_phone || student.parentPhone || 'N/A';
  const address = [student.street_address || student.streetAddress, student.city, student.state]
    .filter(Boolean).join(', ') || student.address || 'N/A';
  const photoUrl = student.photo || student.url || student.profile_image || '';
  const schoolName = student.school_name || student.schoolName || 'School';

  const base = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  const qrValue = student.qr_code_value || student.qrCodeValue || `${base}/student-id/${id}`;

  const today = new Date();
  const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3FF', padding: '24px 0' }}>
      {/* Page width constraint */}
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '0 16px' }}>

        {/* ── 1. PURPLE GRADIENT CARD (mirrors _buildDigitalIdCard) ── */}
        <div style={{
          borderRadius: 30,
          background: 'linear-gradient(135deg, #6200EA 0%, #7C4DFF 100%)',
          boxShadow: '0 10px 40px rgba(124,77,255,0.35)',
          padding: '0 0 24px',
          marginBottom: 24,
        }}>
          {/* School icon */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 28 }}>
            <div style={{
              padding: 12,
              borderRadius: 15,
              background: 'rgba(255,255,255,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <IconSchool />
            </div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: '12px 20px 0', textAlign: 'center' }}>
              {schoolName}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, margin: '4px 0 0' }}>
              Student Identity Card
            </p>
          </div>

          {/* Student info row */}
          <div style={{ margin: '24px 20px 0' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 16,
              borderRadius: 20,
              background: 'rgba(255,255,255,0.15)',
            }}>
              {/* Photo */}
              <div style={{
                width: 70, height: 70, flexShrink: 0,
                borderRadius: 15,
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.2)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <IconPerson />
                )}
              </div>

              {/* Name / class / roll */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: 0, lineHeight: 1.2 }}>{name}</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: '4px 0 0' }}>{grade}</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '2px 0 0' }}>{rollNo}</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '2px 0 0' }}>{bloodGroup}</p>
              </div>
            </div>
          </div>

          {/* QR section */}
          <div style={{ margin: '24px 20px 0' }}>
            <div style={{
              borderRadius: 25,
              background: '#fff',
              padding: 24,
              textAlign: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                <IconQr />
                <span style={{ color: '#546E7A', fontWeight: 700, fontSize: 14 }}>Daily Authentication QR</span>
              </div>

              {/* QR image */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <QRCodeCanvas
                  value={qrValue}
                  size={160}
                  fgColor="#2D3436"
                  bgColor="#ffffff"
                  level="M"
                  style={{ display: 'block' }}
                />
              </div>

              <p style={{ color: '#90A4AE', fontSize: 12, fontWeight: 500, margin: '12px 0 2px' }}>Scan for details</p>
              <p style={{ color: '#90A4AE', fontSize: 11, margin: 0 }}>Valid for: {todayStr}</p>
            </div>
          </div>

          {/* Valid until */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <span style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 13,
              fontWeight: 700,
              padding: '6px 20px',
              borderRadius: 20,
              background: 'rgba(0,0,0,0.2)',
            }}>
              Valid Until: 31/05/2027
            </span>
          </div>
        </div>

        {/* ── 2. STUDENT DETAILS CARD ── */}
        <div style={{
          borderRadius: 24,
          background: '#fff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          padding: 24,
          marginBottom: 40,
        }}>
          <p style={{ fontWeight: 700, fontSize: 18, color: '#2D3436', margin: '0 0 20px' }}>Student Details</p>

          <DetailItem icon={<IconCalendar />} label="Date of Birth" value={dob} />
          <DetailItem icon={<IconFather />}   label="Father's Name"  value={fatherName} />
          <DetailItem icon={<IconFather />}   label="Mother's Name"  value={motherName} />
          <DetailItem icon={<IconPhone />}    label="Contact Number" value={phone} />
          <DetailItem icon={<IconBlood />}    label="Blood Group"    value={student.blood_group || student.bloodGroup || 'N/A'} />
          <DetailItem icon={<IconLocation />} label="Address"        value={address} />
        </div>
      </div>
    </div>
  );
}
