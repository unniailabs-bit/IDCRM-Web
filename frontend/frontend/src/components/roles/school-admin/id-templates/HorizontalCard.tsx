import React from "react";

export function HorizontalCard({ template, studentData }: { template: any, studentData: any }) {
    // Placeholder data if API data is not available
    const card = studentData || {
        schoolName: "SCHOOL NAME",
        studentName: "--- Student Name ---",
        classRoll: "Class ? | Roll: ?",
        father: "N/A",
        mother: "N/A",
        gender: "N/A",
        address: "Address Not Available",
        emergency: "N/A",
        qrCodeUrl: "https://via.placeholder.com/50?text=QR",
        photoUrl: "https://via.placeholder.com/80?text=Photo",
    };

    // Use dynamic header background color from the template
    const headerBg = template.headerBg;
    // Use a fixed/dummy background for the roll number badge for visual appeal in preview
    const rollBg = "bg-green-600";

    return (
        <div className="border rounded-xl shadow-md bg-white overflow-hidden hover:shadow-lg transition-shadow w-full max-w-md">
            {/* Header (UI from Code 1, dynamic color from template) */}
            <div className={`p-3 text-white font-semibold text-center text-base ${headerBg}`}>
                {card.schoolName}
            </div>

            <div className="flex gap-3 p-3">
                {/* Photo and Optional QR Code (Code 1 UI) */}
                <div className="flex flex-col items-center gap-2">
                    <img
                        src={card.photoUrl}
                        className="w-20 h-20 object-cover border-2 border-gray-300"
                        alt="Student Photo"
                    />
                    {template.features.includes("QR Code") && (
                        <img src={card.qrCodeUrl} className="w-12 h-12" alt="QR Code" />
                    )}
                </div>

                {/* Details Section (Code 1 UI) */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base">{card.studentName}</h3>

                    {/* Class/Roll Badge */}
                    <div
                        className={`text-xs ${rollBg} text-white inline-block px-2 py-1 rounded-md mt-1`}
                    >
                        {card.classRoll}
                    </div>

                    {/* Information List (UI from Code 1, conditional rendering from template features) */}
                    <div className="text-xs mt-2 space-y-1">
                        <p><strong>Father:</strong> {card.father}</p>
                        <p><strong>Mother:</strong> {card.mother}</p>
                        <p><strong>Gender:</strong> {card.gender}</p>

                        {/* Conditional features based on template settings */}
                        {template.features.includes("Address") && (
                            <p><strong>Address:</strong> {card.address}</p>
                        )}
                        {template.features.includes("Emergency Contact") && (
                            <p><strong>Emergency:</strong> {card.emergency}</p>
                        )}
                        {/* Add more conditional info (like Blood Group) here if needed */}
                    </div>
                </div>
            </div>
        </div>
    );
}
