import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const StudentList = () => {
  const navigate = useNavigate();
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [searchText, setSearchText] = useState('');
  const [studentRows, setStudentRows] = useState<any[]>([]);
  const [newRow, setNewRow] = useState<any>(null);

  const goToImportStudents = () => {
    navigate('/teacher-dashboard/importstudents');
  };

  // ✅ Fetch students from backend API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('token'); // JWT token
        if (!token) return;
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/teacher/students`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Map API data to table format
        const mappedStudents = res.data.students.map((s: any) => ({
          roll: s.roll_number?.toString() || '',
          name: s.name || '',
          gender: s.gender || '',
          parent: s.parent_name || '',
          phone: s.parent_phone || '',
          email: s.parent_email || '',
          status: 'Not Sent', // default
        }));

        setStudentRows(mappedStudents);
      } catch (err) {
        console.error('Error fetching students:', err);
      }
    };

    fetchStudents();
  }, []);

  // 🔍 SEARCH + STATUS FILTER
  const filteredStudents = studentRows.filter((s) => {
    const searchLower = searchText.toLowerCase();
    const matchesSearch =
      s.roll.toLowerCase().includes(searchLower) ||
      s.name.toLowerCase().includes(searchLower) ||
      s.parent.toLowerCase().includes(searchLower);
    const matchesStatus = selectedStatus === 'All Status' || s.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // ➕ ADD NEW ROW
  const addNewRow = () => {
    setNewRow({
      roll: '',
      name: '',
      gender: '',
      parent: '',
      phone: '',
      email: '',
      status: 'Not Sent',
    });
  };

  // ✔ SAVE NEW ROW
  const saveNewRow = () => {
    setStudentRows([...studentRows, newRow]);
    setNewRow(null);
  };

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-dvh mx-auto bg-white">
      <div className="mb-6 md:mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Student Forms</h1>
          <p className="text-base md:text-lg text-gray-600 font-medium">
            All students in your class
          </p>
        </div>
        <button
          onClick={goToImportStudents}
          className="w-fit self-end text-white hover:text-white bg-gradient-to-r from-green-400 via-green-600 to-green-600
          hover:from-orange-400 hover:via-orange-600 hover:to-orange-600 hover:scale-105 group
          flex flex-row justify-center items-center gap-2 py-2 px-3 rounded-lg text-lg font-semibold transition-all duration-200"
        >
          Import More Students
        </button>
      </div>

      {/* Top Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border p-5 rounded-xl shadow-xl">
          <p className="text-lg text-gray-500">Total Students</p>
          <h2 className="text-2xl font-bold mt-2 text-gray-900">{studentRows.length}</h2>
        </div>
        <div className="bg-white border p-5 rounded-xl shadow-xl">
          <p className="text-sm text-gray-500">Not Sent</p>
          <h2 className="text-2xl font-bold mt-2 text-gray-900">
            {studentRows.filter((s) => s.status === 'Not Sent').length}
          </h2>
        </div>
        <div className="bg-white border p-5 rounded-xl shadow-xl">
          <p className="text-sm text-blue-600">Sent</p>
          <h2 className="text-2xl font-bold mt-2 text-blue-600">
            {studentRows.filter((s) => s.status === 'Sent').length}
          </h2>
        </div>
        <div className="bg-white border p-5 rounded-xl shadow-xl">
          <p className="text-sm text-green-600">Submitted</p>
          <h2 className="text-2xl font-bold mt-2 text-green-600">
            {studentRows.filter((s) => s.status === 'Submitted').length}
          </h2>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 relative border px-4 py-2 rounded-md bg-gray-100">
        <div className="flex items-center bg-white border px-3 py-2 rounded-md w-full">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student name, roll no., or parent name…"
            className="ml-2 w-full outline-none"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setStatusOpen(!statusOpen)}
            className="flex items-center justify-between gap-2 border border-gray-300 
              bg-white rounded-xl px-4 h-12 w-40 shadow-sm text-gray-700"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              {selectedStatus}
            </div>
            <ChevronDown className="h-5 w-5 text-gray-600" />
          </button>

          {statusOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-10">
              {['All Status', 'Not Sent', 'Sent', 'Submitted'].map((status) => (
                <div
                  key={status}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSelectedStatus(status);
                    setStatusOpen(false);
                  }}
                >
                  {status}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden px-6 py-3 border">
        <table className="w-full text-left border rounded-xl table-fixed">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 w-[80px]">Roll No</th>
              <th className="p-3 w-[160px]">Student Name</th>
              <th className="p-3 w-[90px]">Gender</th>
              <th className="p-3 w-[160px]">Parent Name</th>
              <th className="p-3 w-[120px]">Phone</th>
              <th className="p-3 w-[180px]">Email</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s, index) => (
              <tr key={index} className="border-b">
                <td className="p-3">{s.roll}</td>
                <td className="p-3 w-[160px]">
                  <span className="block truncate" title={s.name}>
                    {s.name}
                  </span>
                </td>
                <td className="p-3">{s.gender}</td>
                <td className="p-3 w-[160px]">
                  <span className="block truncate" title={s.parent}>
                    {s.parent}
                  </span>
                </td>
                <td className="p-3">{s.phone}</td>
                <td className="p-3 w-[180px]">
                  <span className="block truncate" title={s.email}>
                    {s.email}
                  </span>
                </td>
                <td className="p-3">
                  <span className="px-3 py-1 text-xs rounded-full bg-gray-200">{s.status}</span>
                </td>
              </tr>
            ))}

            {/* New Editable Row */}
            {newRow && (
              <tr className="bg-gray-50">
                {['roll', 'name', 'gender', 'parent', 'phone', 'email'].map((field) => (
                  <td className="p-3" key={field}>
                    <input
                      type="text"
                      className="border p-2 rounded w-full"
                      value={newRow[field]}
                      onChange={(e) => setNewRow({ ...newRow, [field]: e.target.value })}
                    />
                  </td>
                ))}
                <td className="p-3">Not Sent</td>
                <td className="p-3">
                  <button
                    onClick={saveNewRow}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                  >
                    Save
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Student Row Button */}
      <div className="mt-4">
        <button
          onClick={addNewRow}
          className="flex items-center gap-2 border px-4 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" /> Add Student Row
        </button>
      </div>

      <p className="text-sm text-gray-500 mt-3">
        Showing {filteredStudents.length} of {studentRows.length} students
      </p>
    </div>
  );
};

export default StudentList;
