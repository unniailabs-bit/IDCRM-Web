import React from "react";

export function CustomCssCard({ template, studentData }: { template: any, studentData: any }) {
    const card = studentData || {
        schoolName: "SCHOOL NAME",
        studentName: "Student Name",
        classRoll: "Class X | Roll: 00",
        father: "Father Name",
        mother: "Mother Name",
        gender: "Gender",
        address: "Address",
        emergency: "Emergency",
        qrCodeUrl: "https://via.placeholder.com/80?text=QR",
        photoUrl: "https://via.placeholder.com/96?text=Photo",
    };

    // Render Custom Design 1: Wave Header (Blue Theme)
    if (template.cssLayout === 'custom-1') {
        return (
            <div style={{
                position: 'relative',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                backgroundColor: 'white',
                color: '#1f2937',
                border: '1px solid #e5e7eb',
                width: '300px',
                height: '480px',
                fontFamily: 'sans-serif'
            }}>
                {/* Wave Header Background */}
                <div style={{ position: 'absolute', top: 0, width: '100%', height: '160px', backgroundColor: '#2563eb' }}>
                    <svg style={{ position: 'absolute', bottom: 0, width: '100%', height: '64px', color: 'white', transform: 'translateY(1px)' }} viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path fill="currentColor" fillOpacity="1" d="M0,96L80,112C160,128,320,160,480,160C640,160,800,128,960,112C1120,96,1280,96,1360,96L1440,96L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
                    </svg>
                    <div style={{
                        position: 'absolute',
                        top: '8px',
                        width: '100%',
                        textAlign: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.125rem',
                        padding: '0 8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em',
                        lineHeight: '1.25'
                    }}>
                        {card.schoolName}
                    </div>
                </div>

                {/* Content */}
                <div style={{ position: 'absolute', top: '112px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
                    {/* Photo with border */}
                    <div style={{
                        width: '112px',
                        height: '112px',
                        borderRadius: '9999px',
                        border: '4px solid white',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        overflow: 'hidden',
                        backgroundColor: '#f3f4f6',
                        marginBottom: '8px'
                    }}>
                        <img src={card.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Student" />
                    </div>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e3a8a', padding: '0 8px', textAlign: 'center', lineHeight: '1.25', margin: 0 }}>
                        {card.studentName}
                    </h2>
                    <span style={{
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        fontSize: '0.75rem',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontWeight: '600',
                        marginTop: '4px',
                        display: 'inline-block'
                    }}>
                        {card.classRoll}
                    </span>

                    {/* Details Table */}
                    <div style={{
                        marginTop: '16px',
                        width: '91.66%',
                        fontSize: '0.875rem',
                        textAlign: 'left',
                        color: '#374151',
                        backgroundColor: 'rgba(239, 246, 255, 0.5)',
                        padding: '12px',
                        borderRadius: '0.5rem',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                    }}>
                        <div style={{ display: 'flex', borderBottom: '1px solid #dbeafe', paddingBottom: '4px', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '600', width: '80px', color: '#6b7280', fontSize: '0.75rem' }}>Father:</span>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem', fontWeight: '500' }}>{card.father}</span>
                        </div>
                        <div style={{ display: 'flex', borderBottom: '1px solid #dbeafe', paddingBottom: '4px', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '600', width: '80px', color: '#6b7280', fontSize: '0.75rem' }}>Gender:</span>
                            <span style={{ flex: 1, fontSize: '0.75rem', fontWeight: '500' }}>{card.gender}</span>
                        </div>
                        <div style={{ display: 'flex', paddingBottom: '4px' }}>
                            <span style={{ fontWeight: '600', width: '80px', color: '#6b7280', fontSize: '0.75rem' }}>Contact:</span>
                            <span style={{ flex: 1, color: '#dc2626', fontWeight: 'bold', fontSize: '0.75rem' }}>{card.emergency}</span>
                        </div>
                    </div>
                </div>

                {/* Footer QR */}
                <div style={{ position: 'absolute', bottom: '12px', width: '100%', display: 'flex', justifyContent: 'center', zIndex: 20 }}>
                    <div style={{ padding: '4px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.25rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                        <img src={card.qrCodeUrl} style={{ width: '56px', height: '56px' }} alt="QR" />
                    </div>
                </div>

                {/* Bottom colored bar */}
                <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '12px', backgroundColor: '#2563eb' }}></div>
            </div>
        );
    }

    // Render Custom Design 2: Geometric (Orange Theme)
    if (template.cssLayout === 'custom-2') {
        return (
            <div style={{
                position: 'relative',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                backgroundColor: '#f9fafb',
                color: '#1f2937',
                border: '1px solid #e5e7eb',
                width: '300px',
                height: '480px',
                fontFamily: 'sans-serif'
            }}>
                {/* Diagonal Header */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '176px',
                    backgroundColor: '#f97316',
                    transform: 'skewY(-6deg)',
                    transformOrigin: 'top left',
                    zIndex: 0,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}></div>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '176px',
                    backgroundColor: '#ea580c',
                    transform: 'skewY(-6deg) translateY(8px)',
                    transformOrigin: 'top left',
                    opacity: 0.3,
                    zIndex: 0
                }}></div>

                <div style={{ position: 'absolute', top: '8px', width: '100%', textAlign: 'center', zIndex: 10, padding: '0 16px' }}>
                    <div style={{
                        color: 'white',
                        fontWeight: '900',
                        fontSize: '1.125rem',
                        textTransform: 'uppercase',
                        filter: 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07))',
                        letterSpacing: '-0.025em',
                        lineHeight: '1.25'
                    }}>
                        {card.schoolName}
                    </div>
                    <div style={{ color: '#ffedd5', fontSize: '10px', letterSpacing: '0.05em', marginTop: '4px', opacity: 0.9 }}>ACADEMIC YEAR 2024-2025</div>
                </div>

                {/* Content */}
                <div style={{ position: 'absolute', top: '128px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
                    {/* Square Photo */}
                    <div style={{
                        width: '112px',
                        height: '112px',
                        backgroundColor: 'white',
                        padding: '4px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        borderRadius: '2px',
                        transform: 'rotate(3deg)',
                        border: '1px solid #e5e7eb',
                        marginBottom: '12px'
                    }}>
                        <img src={card.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Student" />
                    </div>

                    <div style={{ textAlign: 'center', padding: '0 16px', width: '100%', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', lineHeight: '1.25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                            {card.studentName}
                        </h2>
                        <div style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.1em' }}>Student</div>
                    </div>

                    {/* Circular Details Info */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: '8px',
                        fontSize: '0.75rem',
                        width: '100%',
                        padding: '0 20px',
                        boxSizing: 'border-box'
                    }}>
                        <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '0.25rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', borderLeft: '4px solid #f97316' }}>
                            <span style={{ display: 'block', color: '#9ca3af', fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold' }}>Class & Div</span>
                            <span style={{ fontWeight: 'bold', color: '#374151', fontSize: '0.75rem' }}>{card.classRoll.split('|')[0] || "Class X"}</span>
                        </div>
                        <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '0.25rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', borderLeft: '4px solid #f97316' }}>
                            <span style={{ display: 'block', color: '#9ca3af', fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold' }}>Roll No</span>
                            <span style={{ fontWeight: 'bold', color: '#374151', fontSize: '0.75rem' }}>{card.classRoll.includes('Roll:') ? card.classRoll.split('Roll:')[1] : "00"}</span>
                        </div>
                        <div style={{
                            gridColumn: 'span 2 / span 2',
                            backgroundColor: 'white',
                            padding: '8px',
                            borderRadius: '0.25rem',
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                            borderLeft: '4px solid #f97316',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <span style={{ display: 'block', color: '#9ca3af', fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold' }}>Emergency Contact</span>
                                <span style={{ fontWeight: 'bold', color: '#374151', fontSize: '0.875rem' }}>{card.emergency}</span>
                            </div>
                            {/* Small Icon or Visual */}
                            <div style={{ height: '24px', width: '24px', backgroundColor: '#ffedd5', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontSize: '0.75rem' }}>
                                📞
                            </div>
                        </div>
                    </div>

                    {/* Footer Bar with QR */}
                    <div style={{ position: 'absolute', top: '340px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '8px' }}>
                        <img src={card.qrCodeUrl} style={{ width: '48px', height: '48px', border: '1px solid #e5e7eb', padding: '2px', backgroundColor: 'white', borderRadius: '0.25rem' }} alt="QR" />
                    </div>
                </div>

                <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '12px', backgroundColor: '#ea580c' }}></div>
            </div>
        );
    }

    // Render Custom Design 3: Traditional Red (Reflected from Image)
    if (template.cssLayout === 'custom-3') {
        // Using standard ID Card dimensions: 54mm x 85.6mm
        return (
            <div style={{
                position: 'relative',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: 'white',
                width: '54mm',
                height: '85.6mm',
                fontFamily: 'Arial, sans-serif',
                fontSize: '10px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header Block */}
                <div style={{
                    backgroundColor: '#dc2626', // Red
                    color: 'white',
                    padding: '6px 2px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1.2'
                }}>
                    <div style={{ fontSize: '7px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2px' }}>Shree Shyam Education Trust</div>
                    <div style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', marginTop: '2px' }}>{card.schoolName}</div>
                    <div style={{ fontSize: '6px', marginTop: '1px', opacity: 0.9 }}>Appa Pada, Malad (East), Mumbai-97.</div>
                    <div style={{ fontSize: '6px', fontWeight: 'bold', backgroundColor: '#b91c1c', padding: '1px 6px', borderRadius: '1px', marginTop: '3px' }}>MEDIUM - SEMI ENGLISH</div>
                </div>

                {/* Body */}
                <div style={{ position: 'relative', flex: 1, padding: '8px 8px 0 8px' }}>

                    {/* Vertical Year Text (Right Side) */}
                    <div style={{
                        position: 'absolute',
                        right: '-8px',
                        top: '45px',
                        transform: 'rotate(-90deg)',
                        color: '#4c1d95', // Deep purple
                        fontWeight: 'bold',
                        fontSize: '11px',
                        letterSpacing: '0.5px'
                    }}>
                        2024 - 25
                    </div>

                    {/* Logo (Left Placeholder) */}
                    <div style={{
                        position: 'absolute',
                        left: '6px',
                        top: '12px',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {/* Placeholder generic logo */}
                        <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                    </div>

                    {/* Photo (Center) */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
                        <div style={{
                            width: '28mm',
                            height: '32mm',
                            border: '1.5px solid #fca5a5',
                            padding: '1px',
                            backgroundColor: 'white',
                            zIndex: 10
                        }}>
                            <img src={card.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Student" />
                        </div>
                    </div>

                    {/* Student Name */}
                    <div style={{ textAlign: 'center', marginTop: '8px', marginBottom: '10px' }}>
                        <h2 style={{
                            color: '#7c3aed', // Purple/Violet
                            fontWeight: 'bold',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            margin: 0,
                            lineHeight: '1.2'
                        }}>
                            {card.studentName}
                        </h2>
                    </div>

                    {/* Details Table */}
                    <div style={{ paddingLeft: '4px', fontSize: '9px', color: '#374151', lineHeight: '1.6' }}>
                        <div style={{ display: 'flex' }}>
                            <span style={{ fontWeight: 'bold', color: '#dc2626', width: '28px' }}>Std.</span>
                            <span style={{ fontWeight: '500', textTransform: 'uppercase' }}>{card.classRoll.split('|')[0].replace('Class', '').trim() || 'JR.KG.'}</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <span style={{ fontWeight: 'bold', color: '#dc2626', width: '28px' }}>D.O.B.</span>
                            <span style={{ fontWeight: '500' }}>{card.dob || ''}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <span style={{ fontWeight: 'bold', color: '#dc2626', width: '28px' }}>Add. :</span>
                            <div style={{ flex: 1, fontSize: '8px', lineHeight: '1.2', paddingTop: '2px' }}>
                                {card.address ? card.address.substring(0, 70) : ""}
                            </div>
                        </div>
                        <div style={{ display: 'flex', marginTop: '3px' }}>
                            <span style={{ width: '28px' }}></span> {/* Spacer */}
                            <span style={{ fontSize: '8px', fontWeight: 'bold' }}>Mob.No.: {card.emergency}</span>
                        </div>
                    </div>

                    {/* Footer Signature */}
                    <div style={{ position: 'absolute', bottom: '12px', left: '8px' }}>
                        <div style={{ fontFamily: 'cursive', fontSize: '10px', color: '#dc2626' }}>Sign...</div>
                        <div style={{ fontSize: '6px', color: '#6b7280' }}>Head Mistress</div>
                    </div>

                </div>
            </div>
        );
    }

    return null;
}
