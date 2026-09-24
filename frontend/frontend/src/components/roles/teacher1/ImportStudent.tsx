import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";


export const ImportStudents = () => {
  const fileInputRef = useRef(null);
  const navigate = useNavigate(); 

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const REQUIRED_COLUMNS = ["Student Name","Roll No","Email","Gender", "Parent Name","Address","Phone"];
  const CLASSES = ["Class 1","Class 2","Class 3","Class 4"];
  const DIVISIONS = ["Division A","Division B","Division C"];

  // Open file selector
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = null; // Reset input so same file can be selected
      fileInputRef.current.click();
    }
  };

   const StudentsList = () => {
    navigate("/teacher-dashboard/student-list");
  };

  // Handle uploaded file
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setError("❌ No file selected");
      setSuccess("");
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const headers = jsonData[0];
      const missing = REQUIRED_COLUMNS.filter((col) => !headers?.includes(col));

      if (missing.length > 0) {
        setError(`❌ Missing required columns: ${missing.join(", ")}`);
        setSuccess("");
        setUploadedFile(null);
      } else {
        setError("");
        setSuccess(`✅ File "${file.name}" imported successfully!`);
        setUploadedFile({
          name: file.name,
          size: (file.size / 1024).toFixed(2) + " KB",
        });
      }

    } catch (err) {
      setError("❌ Invalid file format or unable to read file.");
      setSuccess("");
      setUploadedFile(null);
    } finally {
      e.target.value = null;
    }
  };

  // Change file - clears previous and opens file selector
  const handleChangeFile = () => {
    setUploadedFile(null);
    setError("");
    setSuccess("");
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
      fileInputRef.current.click(); // Open file selector
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-10 px-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm p-8">
        <h2 className="text-lg font-semibold mb-2">Import Students</h2>
        <p className="text-sm text-gray-500 mb-6">
          Step 1: Select class/division and upload student data
        </p>

        <div className="border rounded-xl p-6">
          <h3 className="font-medium mb-4">Class & Division</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Class</label>
              <select
                className="w-full border rounded-md p-2 text-gray-700"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select class</option>
                {CLASSES.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Division</label>
              <select
                className="w-full border rounded-md p-2 text-gray-700"
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
              >
                <option value="">Select division</option>
                {DIVISIONS.map((div) => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>
          </div><br></br>

          <hr className="my-6" /><br></br>

          <h3 className="font-medium mb-4">Upload Student Data</h3>

          {!uploadedFile ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg h-64 flex flex-col justify-center items-center text-center p-4 cursor-pointer"
              onClick={handleBrowseClick}
            >
              <div className="text-4xl mb-3 text-gray-500">⬆️</div>
              <p className="text-gray-600">Drag & drop your file here</p>
              <p className="text-sm text-gray-400 my-1">or</p>

              <button
                type="button"
                className="mt-2 px-4 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
                onClick={handleBrowseClick}
              >
                Browse Files
              </button>

              <p className="text-xs text-gray-400 mt-3">
                Supports Excel (.xlsx, .xls) & CSV files
              </p>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between border rounded-lg p-4 bg-green-100">
              <div>
                <p className="font-medium text-green-700">{uploadedFile.name}</p>
                <p className="text-xs text-green-600">{uploadedFile.size}</p>
              </div>
              <button
                className="text-green-700 text-sm hover:underline"
                onClick={handleChangeFile}
              >
                Change
              </button>
            </div>
          )}

          {/* Messages */}
          {error && <div className="text-red-600 font-medium mt-3">{error}</div>}
          {success && <div className="text-green-600 font-medium mt-3">{success}</div>}

         <a
  href="/student_import_template.xlsx"
  download="student_import_template.xlsx"
  className="text-blue-600 text-sm flex items-center gap-1 mt-4"
>
  📄 Download Sample Template
</a>

        </div><br></br>

        <div className="flex justify-end mt-6">
          <button  onClick={StudentsList} 
          className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800">
            Continue → Preview & Import
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportStudents;
