import React from "react";

export function VerticalCard({ template, studentData }: { template: any, studentData: any }) {
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
        qrCodeUrl: "https://via.placeholder.com/80?text=QR",
        photoUrl: "https://via.placeholder.com/96?text=Photo",
    };

    // Use dynamic header background color from the template
    const headerBg = template.headerBg;
    // Use a fixed/dummy background for the roll number badge for visual appeal in preview
    const rollBg = "bg-green-600";

    return (
        <div className="border rounded-xl shadow-md bg-white flex flex-col overflow-hidden hover:shadow-lg transition-shadow max-w-xs w-full">
            {/* Header (UI from Code 1, dynamic color from template) */}
            <div className={`p-4 text-white font-semibold text-center text-lg ${headerBg}`}>
                {card.schoolName}
            </div><br></br>

            {/* Photo */}
            <div className="flex justify-center mt-6">
                <img
                    src={card.photoUrl}
                    className="w-24 h-24 rounded-lg object-cover border-2 border-gray-300"
                    alt="Student Photo"
                />
            </div>

            <div className="px-6 py-5 text-center">
                <h3 className="font-semibold text-lg">{card.studentName}</h3>

                {/* Class/Roll Badge */}
                <div
                    className={`text-xs ${rollBg} text-white inline-block px-3 py-1 rounded-md mt-2`}
                >
                    {card.classRoll}
                </div>

                {/* Details (UI from Code 1, conditional rendering from template features) */}
                <div className="text-left mt-4 text-sm space-y-2">
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

                {/* QR Code */}
                {template.features.includes("QR Code") && (
                    <div className="flex justify-center mt-3">
                        <img src={card.qrCodeUrl} className="w-20 h-20" alt="QR Code" />
                    </div>
                )}
                <br />
            </div>
        </div>
    );
}
