import { useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../../ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../ui/table";
import studentIcon from "@/layouts/assets/Icon (5).svg";
import academicIcon from "@/layouts/assets/Icon (6).svg";
import parentIcon from "@/layouts/assets/Icon (7).svg";


type Props = { onBack: () => void };

export default function DigitalFormPage({ onBack }: Props) {
    const [step, setStep] = useState<number>(0); // 0 = Student, 1 = Academic, 2 = Parent
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [showCommentBox, setShowCommentBox] = useState(false);
    const [comment, setComment] = useState("");
    const [showRequestBox, setShowRequestBox] = useState(false);



    const goNext = () => setStep((s) => Math.min(2, s + 1));
    const goBack = () => setStep((s) => Math.max(0, s - 1));
    const goTo = (i: number) => setStep(i);

    // helper to decide if step index is active or completed
    const stepState = (i: number) => {
        if (i < step) return "completed";
        if (i === step) return "active";
        return "pending";
    };


    // STUDENT FORM DATA
    const [studentData, setStudentData] = useState({
        name: "",
        dob: "",
        blood: "",
        address: "",
        emergency: "",
        photo: null
    });

    // CLASS DETAILS DATA
    const [classData, setClassData] = useState({
        section: "",
        className: "",
        division: "",
        rollNo: "",
        idNo: "",
        grNo: "",
        srNo: "",
        admissionNo: "",
        registerNo: "",
        busNo: ""
    });


    // PARENT DATA
    const [fatherData, setFatherData] = useState({
        name: "",
        relation: "",
        contact: "",
        occupation: "",
        office: "",
        photo: null
    });

    const [motherData, setMotherData] = useState({
        name: "",
        relation: "",
        contact: "",
        occupation: "",
        office: "",
        photo: null
    });


    return (
        <div className="min-h-screen bg-[#f4f7fb] p-6">


            {/* MAIN CARD */}
            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10">
                <div className="text-center mb-6">
                    <h2
                        className="text-2xl font-bold"
                        style={{ color: "#FF6A00" }}
                    >
                        Student Registration Form
                    </h2>

                    <p className="text-sm text-gray-600 mt-1">
                        All fields are mandatory
                    </p>
                </div>

                {/* STEPPER */}
                {/* =============== FIXED STEPPER WITH CONNECTING LINES =============== */}
                {/* PERFECT FIXED STEPPER */}
                {step !== 5 && (
                    <div className="w-full flex justify-center mt-10 mb-12">
                        <div className="flex items-center gap-20">

                            {/* ----- STEP 1 (VERIFY) ----- */}
                            <div className="flex flex-col items-center cursor-pointer" onClick={() => goTo(0)}>
                                <div
                                    className={`
          flex items-center justify-center rounded-full text-3xl font-bold
          transition-all duration-300
          ${step === 0
                                            ? "bg-orange-600 text-white shadow-[0_10px_25px_rgba(37,99,235,0.35)]"
                                            : step > 0
                                                ? "bg-orange-600 text-white"
                                                : "bg-orange-100 text-gray-500"}
        `}
                                    style={{ width: "70px", height: "70px" }}
                                >
                                    1
                                </div>
                                <p className={`mt-3 text-lg font-semibold ${step >= 0 ? "text-black" : "text-gray-400"}`}>
                                    Verify
                                </p>
                            </div>

                            {/* LINE 1 */}
                            <div className={`h-2 w-40 rounded-full mt-[-15px] 
      ${step >= 1 ? "bg-orange-600" : "bg-orange-100"}`}
                            />

                            {/* ----- STEP 2 (STUDENT) ----- */}
                            <div className="flex flex-col items-center cursor-pointer" onClick={() => goTo(1)}>
                                <div
                                    className={`
          flex items-center justify-center rounded-full text-3xl font-bold
          transition-all duration-300
          ${step === 1
                                            ? "bg-orange-600 text-white shadow-[0_10px_25px_rgba(37,99,235,0.35)]"
                                            : step > 1
                                                ? "bg-orange-600 text-white"
                                                : "bg-orange-100 text-gray-500"}
        `}
                                    style={{ width: "70px", height: "70px" }}
                                >
                                    2
                                </div>
                                <p className={`mt-3 text-lg font-semibold ${step >= 1 ? "text-black-600" : "text-gray-400"}`}>
                                    Student
                                </p>
                            </div>

                            {/* LINE 2 */}
                            <div className={`h-2 w-40 rounded-full mt-[-15px] 
      ${step >= 2 ? "bg-orange-600" : "bg-orange-100"}`}
                            />

                            {/* ----- STEP 3 (PARENTS) ----- */}
                            <div className="flex flex-col items-center cursor-pointer" onClick={() => goTo(2)}>
                                <div
                                    className={`
          flex items-center justify-center rounded-full text-3xl font-bold
          transition-all duration-300
          ${step === 2
                                            ? "bg-orange-600 text-white shadow-[0_10px_25px_rgba(37,99,235,0.35)]"
                                            : step > 2
                                                ? "bg-orange-600 text-white"
                                                : "bg-orange-100 text-gray-500"}
        `}
                                    style={{ width: "70px", height: "70px" }}
                                >
                                    3
                                </div>
                                <p className={`mt-3 text-lg font-semibold ${step >= 2 ? "text-black-600" : "text-gray-400"}`}>
                                    Parents
                                </p>
                            </div>

                            {/* LINE 3 */}
                            <div className={`h-2 w-40 rounded-full mt-[-15px] 
      ${step >= 3 ? "bg-orange-600" : "bg-orange-100"}`}
                            />

                            {/* ----- STEP 4 (PREVIEW) ----- */}
                            <div className="flex flex-col items-center cursor-pointer" onClick={() => goTo(3)}>
                                <div
                                    className={`
          flex items-center justify-center rounded-full text-3xl font-bold
          transition-all duration-300
          ${step === 3
                                            ? "bg-orange-600 text-white shadow-[0_10px_25px_rgba(37,99,235,0.35)]"
                                            : step > 3
                                                ? "bg-orange-600 text-white"
                                                : "bg-orange-100 text-gray-500"}
        `}
                                    style={{ width: "70px", height: "70px" }}
                                >
                                    4
                                </div>
                                <p className={`mt-3 text-lg font-semibold ${step >= 3 ? "text-black-600" : "text-gray-400"}`}>
                                    Preview
                                </p>
                            </div>

                            {/* LINE 4 */}
                            <div className={`h-2 w-40 rounded-full mt-[-15px] 
      ${step >= 4 ? "bg-orange-600" : "bg-orange-100"}`}
                            />

                            {/* ----- STEP 5 (SUBMIT) ----- */}
                            <div className="flex flex-col items-center cursor-pointer" onClick={() => goTo(4)}>
                                <div
                                    className={`
          flex items-center justify-center rounded-full text-3xl font-bold
          transition-all duration-300
          ${step === 4
                                            ? "bg-orange-600 text-white shadow-[0_10px_25px_rgba(37,99,235,0.35)]"
                                            : "bg-orange-100 text-gray-500"}
        `}
                                    style={{ width: "70px", height: "70px" }}
                                >
                                    5
                                </div>
                                <p className={`mt-3 text-lg font-semibold ${step === 4 ? "text-black-600" : "text-gray-400"}`}>
                                    Submit
                                </p>
                            </div>

                        </div>
                    </div>
                )}










                {/* CONTENT AREA */}
                <div className="mt-2 mb-6">


                    {/* ================= VERIFY PAGE (STEP 1) ================= */}
                    {step === 0 && (
                        <div className="mb-10">

                            {/* HEADING */}
                            <div className="text-center mb-6">

                            </div>



                            {/* WARNING BOX */}
                            <div className="bg-orange-50 border border-orange-300 p-2 rounded-lg mb-6">
                                <div className="flex gap-4">
                                    <div className="text-orange-600 text-xl">⚠️</div>
                                    <div>
                                        <h3 className="font-semibold" style={{ color: '#8B4513' }}>
                                            Verify Student Details
                                        </h3>
                                        <p className="text-sm text-orange-600 mt-1">
                                            Please verify the following details provided by your teacher.
                                            If everything is correct, click <b>"Accept & Continue"</b>.
                                            If you need to make changes, request changes.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* CLASS DETAILS TITLE */}
                            <h3 className="text-lg  text-orange-600 mb-3">
                                Class Details
                            </h3>

                            <div className="border-t mb-6" style={{ borderColor: '#FFA500' }}></div>



                            {/* FORM (STATIC VALUES LIKE FIGMA) */}
                            <div className="grid grid-cols-2 gap-4">

                                <div>
                                    <label className="text-sm font-medium">
                                        Select Your Section <span className="text-orange-600">*</span>
                                    </label>
                                    <Input
                                        value={classData.section}
                                        onChange={(e) => setClassData({ ...classData, section: e.target.value })}
                                        className="border border-gray-300 bg-orange-50"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">
                                        Select Your Class <span className="text-orange-600">*</span>
                                    </label>
                                    <Input
                                        value={classData.className}
                                        onChange={(e) => setClassData({ ...classData, className: e.target.value })}
                                        className="border border-gray-300 bg-orange-50"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">
                                        Division <span className="text-orange-600">*</span>
                                    </label>
                                    <Input
                                        value={classData.division}
                                        onChange={(e) => setClassData({ ...classData, division: e.target.value })}
                                        className="border border-gray-300 bg-orange-50"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">
                                        Roll No <span className="text-orange-600">*</span>
                                    </label>
                                    <Input
                                        value={classData.rollNo}
                                        onChange={(e) => setClassData({ ...classData, rollNo: e.target.value })}
                                        className="border border-gray-300 bg-orange-50"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">
                                        ID No <span className="text-orange-600">*</span>
                                    </label>
                                    <Input
                                        value={classData.idNo}
                                        onChange={(e) => setClassData({ ...classData, idNo: e.target.value })}
                                        className="border border-gray-300 bg-orange-50"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">
                                        GR NO <span className="text-orange-600">*</span>
                                    </label>
                                    <Input
                                        value={classData.grNo}
                                        onChange={(e) => setClassData({ ...classData, grNo: e.target.value })}
                                        className="border border-gray-300 bg-orange-50"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">
                                        SR No <span className="text-orange-600">*</span>
                                    </label>
                                    <Input
                                        value={classData.srNo}
                                        onChange={(e) => setClassData({ ...classData, srNo: e.target.value })}
                                        className="border border-gray-300 bg-orange-50"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">
                                        Admission No <span className="text-orange-600">*</span>
                                    </label>
                                    <Input
                                        value={classData.admissionNo}
                                        onChange={(e) => setClassData({ ...classData, admissionNo: e.target.value })}
                                        className="border border-gray-300 bg-orange-50"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">
                                        Register No <span className="text-orange-600">*</span>
                                    </label>
                                    <Input
                                        value={classData.registerNo}
                                        onChange={(e) => setClassData({ ...classData, registerNo: e.target.value })}
                                        className="border border-gray-300 bg-orange-50"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">
                                        Bus No <span className="text-orange-600">*</span>
                                    </label>
                                    <Input
                                        value={classData.busNo}
                                        onChange={(e) => setClassData({ ...classData, busNo: e.target.value })}
                                        className="border border-gray-300 bg-orange-50"
                                    />
                                </div>

                            </div>


                            {/* ACCEPT / REQUEST BUTTONS */}
                            <div className="flex justify-between mt-16 pt-4 gap-4">

                                {/* Accept & Continue → STEP 2 student form */}
                                <Button
                                    className="bg-green-600 text-white flex-1 py-4 text-xl font-semibold rounded-lg 
               hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => setStep(1)}
                                    disabled={false} // change to true if you want it disabled
                                >
                                    ✔ Accept & Continue
                                </Button>

                                {/* Request Changes */}
                                <Button
                                    className="bg-orange-600 text-white flex-1 py-4 text-xl font-semibold rounded-lg 
               hover:bg-orange-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => setShowRequestBox(true)}
                                    disabled={false} // change to true if you want it disabled
                                >
                                    Request Changes
                                </Button>

                            </div>


                        </div>
                    )}



                    {/* STUDENT FORM */}
                    {step === 1 && (
                        <div className="mb-10">

                            {/* HEADING */}
                            <div className="text-center mb-6">

                            </div>

                            {/* SECTION TITLE */}
                            <h3 className="text-lg font-semibold text-orange-600">
                                Section 1: Student Details
                            </h3>
                            <div className="border-t  mt-1 mb-6" style={{ borderColor: '#FFA500' }}></div>

                            {/* FORM START */}
                            <div className="grid grid-cols-1 gap-5">

                                {/* Name */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Name of Student<span className="text-orange-600">*</span>
                                    </label>
                                    <Input
                                        value={studentData.name}
                                        onChange={(e) => setStudentData({ ...studentData, name: e.target.value })}
                                        placeholder="Enter student name"
                                        className="h-12"
                                    />
                                </div><br></br>

                                {/* Date of Birth */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Date of Birth<span className="text-orange-600">*</span>
                                    </label>

                                    <div className="relative">
                                        <Input
                                            type="date"
                                            value={studentData.dob}
                                            onChange={(e) => setStudentData({ ...studentData, dob: e.target.value })}
                                            className="h-12"
                                        />

                                    </div>
                                </div><br></br>

                                {/* Blood Group */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Select Blood Group <span className="text-orange-600">*</span>
                                    </label>

                                    <Select
                                        onValueChange={(value) =>
                                            setStudentData({ ...studentData, blood: value })
                                        }
                                    >
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Select Blood Group" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="A+">A+</SelectItem>
                                            <SelectItem value="B+">B+</SelectItem>
                                            <SelectItem value="O+">O+</SelectItem>
                                            <SelectItem value="AB+">AB+</SelectItem>
                                            <SelectItem value="A+">A-</SelectItem>
                                            <SelectItem value="B+">B-</SelectItem>
                                            <SelectItem value="O+">O-</SelectItem>
                                            <SelectItem value="AB+">AB-</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div><br></br>

                                {/* Address */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Address <span className="text-orange-600">*</span>
                                    </label>
                                    <textarea
                                        value={studentData.address}
                                        onChange={(e) =>
                                            setStudentData({ ...studentData, address: e.target.value })
                                        }
                                        className="w-full border border-gray-300 rounded-md p-3 h-24"
                                    />

                                </div><br></br>

                                {/* Emergency Contact */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Emergency Contact Number <span className="text-orange-600">*</span>
                                    </label>
                                    <Input
                                        value={studentData.emergency}
                                        onChange={(e) =>
                                            setStudentData({ ...studentData, emergency: e.target.value })
                                        }
                                        placeholder="Enter 10-digit contact number"
                                        className="h-12"
                                    />

                                </div><br></br>

                                {/* Photo Upload */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Upload Student Photograph <span className="text-red-500">*</span>
                                    </label>

                                    <Input
                                        type="file"
                                        onChange={(e) =>
                                            setStudentData({ ...studentData, photo: e.target.files?.[0] })
                                        }
                                        className="h-12"
                                    />

                                </div><br></br>

                            </div>
                            {/* FORM END */}
                        </div>
                    )}

                    {/* ===================== PARENT FORM (FIGMA STYLE) ====================== */}
                    {/* PARENT FORM (STEP 2) */}
                    {step === 2 && (
                        <div className="mb-10 ">

                            {/* HEADING */}
                            <div className="text-center mb-6">

                            </div>

                            {/* SECTION TITLE */}
                            <h3 className="text-lg font-semibold text-orange-600 mb-3]">
                                Section 3: Parent Details
                            </h3>
                            <div className="border-t ] mt-1 mb-6" style={{ borderColor: '#FFA500' }}></div>

                            {/* ------------------------ FATHER DETAILS ------------------------ */}
                            <div className="bg-[#FFF3E8] border border-[#F5A86A] p-6 rounded-xl mb-10">

                                <h4 className="text-base font-semibold mb-4" style={{ color: "#8B4513" }}>
                                    Father Details
                                </h4>


                                <div className="grid grid-cols-1 gap-5">

                                    <div>
                                        <label className="text-sm font-medium">
                                            Name <span className="text-orange-600">*</span>
                                        </label>
                                        <Input
                                            value={fatherData.name}
                                            onChange={(e) =>
                                                setFatherData({ ...fatherData, name: e.target.value })
                                            }
                                            className="h-12 border border-gray-300"
                                        />

                                    </div><br></br>

                                    <div>
                                        <label className="text-sm font-medium">
                                            Relation <span className="text-orange-600">*</span>
                                        </label>
                                        <Input
                                            value={fatherData.relation}
                                            onChange={(e) =>
                                                setFatherData({ ...fatherData, relation: e.target.value })
                                            }
                                            className="h-12 border border-gray-300"
                                        />

                                    </div><br></br>

                                    <div>
                                        <label className="text-sm font-medium">
                                            Contact No <span className="text-orange-600">*</span>
                                        </label>
                                        <Input
                                            value={fatherData.contact}
                                            onChange={(e) =>
                                                setFatherData({ ...fatherData, contact: e.target.value })
                                            }
                                            className="h-12 border border-gray-300"
                                        />

                                    </div><br></br>

                                    <div>
                                        <label className="text-sm font-medium">
                                            Occupation <span className="text-orange-600">*</span>
                                        </label>

                                        <Select
                                            onValueChange={(value) =>
                                                setFatherData({ ...fatherData, occupation: value })
                                            }
                                        >

                                            <SelectTrigger className="h-12 border border-gray-300">
                                                <SelectValue placeholder="Occupation" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="service">Service</SelectItem>
                                                <SelectItem value="business">Business</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                                <SelectItem value="self">Self Employed</SelectItem>
                                                <SelectItem value="retired">Retired</SelectItem>
                                                <SelectItem value="housewife">Housewife</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div><br></br>

                                    <div>
                                        <label className="text-sm font-medium">
                                            Office Address <span className="text-orange-600">*</span>
                                        </label>
                                        <textarea
                                            value={fatherData.office}
                                            onChange={(e) =>
                                                setFatherData({ ...fatherData, office: e.target.value })
                                            }
                                            className="w-full border border-gray-300 rounded-md p-3 h-24"
                                        />

                                    </div><br></br>

                                    <div>
                                        <label className="text-sm font-medium">
                                            Upload Photograph <span className="text-orange-600">*</span>
                                        </label>
                                        <Input
                                            type="file"
                                            onChange={(e) =>
                                                setFatherData({ ...fatherData, photo: e.target.files?.[0] })
                                            }
                                        />

                                    </div>

                                </div>

                            </div>
                            <br></br>

                            {/* ------------------------ MOTHER DETAILS ------------------------ */}
                            <div className="bg-[#FFF3E8] border border-[#F5A86A] p-6 rounded-xl mb-10">

                                <h4 className="text-base font-semibold  mb-4" style={{ color: "#8B4513" }}>
                                    Mother Details
                                </h4><br></br>

                                <div className="grid grid-cols-1 gap-5">

                                    <div>
                                        <label className="text-sm font-medium">
                                            Name <span className="text-orange-600">*</span>
                                        </label>
                                        <Input
                                            value={motherData.name}
                                            onChange={(e) =>
                                                setMotherData({ ...motherData, name: e.target.value })
                                            }
                                        />

                                    </div><br></br>

                                    <div>
                                        <label className="text-sm font-medium">
                                            Relation <span className="text-orange-600">*</span>
                                        </label>
                                        <Input
                                            value={motherData.relation}
                                            onChange={(e) =>
                                                setMotherData({ ...motherData, relation: e.target.value })
                                            }
                                            className="h-12 border border-gray-300"
                                        />
                                    </div><br></br>

                                    <div>
                                        <label className="text-sm font-medium">
                                            Contact No <span className="text-orange-600">*</span>
                                        </label>
                                        <Input
                                            value={motherData.contact}
                                            onChange={(e) =>
                                                setMotherData({ ...motherData, contact: e.target.value })
                                            }
                                            className="h-12 border border-gray-300"
                                        />
                                    </div><br></br>

                                    <div>
                                        <label className="text-sm font-medium">
                                            Occupation <span className="text-orange-600">*</span>
                                        </label>

                                        <Select
                                            onValueChange={(value) =>
                                                setMotherData({ ...motherData, occupation: value })
                                            }
                                        >
                                            <SelectTrigger className="h-12 border border-gray-300">
                                                <SelectValue placeholder="Occupation" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                <SelectItem value="service">Service</SelectItem>
                                                <SelectItem value="business">Business</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                                <SelectItem value="self">Self Employed</SelectItem>
                                                <SelectItem value="retired">Retired</SelectItem>
                                                <SelectItem value="housewife">Housewife</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div><br></br>

                                    <div>
                                        <label className="text-sm font-medium">
                                            Office Address <span className="text-orange-600">*</span>
                                        </label>
                                        <textarea
                                            value={motherData.office}
                                            onChange={(e) =>
                                                setMotherData({ ...motherData, office: e.target.value })
                                            }
                                            className="w-full border border-gray-300 rounded-md p-3 h-24"
                                        />
                                    </div><br></br>

                                    <div>
                                        <label className="text-sm font-medium">
                                            Upload Photograph <span className="text-orange-600">*</span>
                                        </label>
                                        <Input
                                            type="file"
                                            onChange={(e) =>
                                                setMotherData({ ...motherData, photo: e.target.files?.[0] })
                                            }
                                            className="h-12 border border-gray-300"
                                        />
                                    </div><br></br>

                                </div>

                            </div>

                        </div>
                    )}<br></br>
                    {/* ---- BACK + PREVIEW BUTTONS FOR PARENT FORM ---- */}
                    {step === 2 && (
                        <div className="flex justify-between items-center mt-10">

                            {/* BACK BUTTON */}
                            <Button
                                variant="outline"
                                onClick={goBack}
                                className="w-[200px] h-[55px] bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xl font-semibold flex items-center justify-center"
                            >
                                Back
                            </Button>




                            {/* PREVIEW BUTTON → goes to Step 3 */}
                            <Button
                                onClick={() => setStep(3)}
                                className="w-[200px] h-[55px] bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-xl font-semibold flex items-center justify-center"
                            >
                                Preview
                            </Button>



                        </div>
                    )}



                    {step === 3 && (
                        <div className="space-y-10">

                            {/* PAGE HEADING */}
                            <div className="text-center mb-6">

                            </div>

                            {/* ---------------- STUDENT DETAILS PREVIEW ---------------- */}
                            <div
                                style={{ backgroundColor: "#FFF3E8", border: "1px solid #F5A86A" }}
                                className="p-6 rounded-xl shadow-sm"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3
                                        style={{ color: "#8B4513", fontSize: "20px", fontWeight: "600" }}
                                        className="flex items-center gap-2"
                                    >
                                        <img src={studentIcon} className="w-6" style={{
                                            filter:
                                                "invert(24%) sepia(34%) saturate(1500%) hue-rotate(356deg) brightness(90%) contrast(90%)",
                                        }} />
                                        Student Details
                                    </h3>

                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-orange-600 font-medium"
                                    >
                                        ✏ Edit
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-gray-700">
                                    <p><b>Name:</b> {studentData.name}</p>
                                    <p><b>Date of Birth:</b> {studentData.dob}</p>

                                    <p><b>Blood Group:</b> {studentData.blood}</p>
                                    <p><b>Emergency Contact:</b> {studentData.emergency}</p>

                                    <p className="col-span-2"><b>Address:</b> {studentData.address}</p>

                                    <p className="col-span-2">
                                        <b>Photograph:</b> {studentData.photo ? studentData.photo.name : "No file selected"}
                                    </p>
                                </div>
                            </div>


                            <br></br>

                            {/* ----------- CLASS DETAILS CONTAINER (Figma Style) ------------ */}
                            <div
                                style={{ backgroundColor: "#FFF3E8", border: "1px solid #F5A86A" }}
                                className="p-6 rounded-xl shadow-sm"
                            >
                                {/* Title row */}
                                <div className="flex items-center justify-between mb-4">
                                    <h4
                                        style={{ color: "#8B4513", fontSize: "20px", fontWeight: "600" }}
                                        className="flex items-center gap-2"
                                    >
                                        <img
                                            src={academicIcon}

                                            className="w-5 h-5" style={{
                                                filter:
                                                    "invert(24%) sepia(34%) saturate(1500%) hue-rotate(356deg) brightness(90%) contrast(90%)",
                                            }}
                                        />
                                        Class Details
                                    </h4>


                                    <button onClick={() => setStep(0)} className="text-orange-600 text-sm font-medium hover:underline">
                                        ✏ Edit
                                    </button>
                                </div>

                                <br></br>

                                {/* Fields Grid */}
                                <div className="grid grid-cols-2 gap-4">

                                    {/* Section */}
                                    <div className="flex justify-start gap-4">
                                        <span className="font-semibold">Section:</span>
                                        <span className="text-gray-800">{classData.section || "—"}</span>
                                    </div>

                                    {/* Class */}
                                    <div className="flex justify-start gap-4">
                                        <span className="font-semibold">Class:</span>
                                        <span className="text-gray-800">{classData.className || "—"}</span>
                                    </div>

                                    {/* Division */}
                                    <div className="flex justify-start gap-4">
                                        <span className="font-semibold">Division:</span>
                                        <span className="text-gray-800">{classData.division || "—"}</span>
                                    </div>

                                    {/* Roll No */}
                                    <div className="flex justify-start gap-4">
                                        <span className="font-semibold">Roll No:</span>
                                        <span className="text-gray-800">{classData.rollNo || "—"}</span>
                                    </div>

                                    {/* ID No */}
                                    <div className="flex justify-start gap-4">
                                        <span className="font-semibold">ID No:</span>
                                        <span className="text-gray-800">{classData.idNo || "—"}</span>
                                    </div>

                                    {/* GR No */}
                                    <div className="flex justify-start gap-4">
                                        <span className="font-semibold">GR No:</span>
                                        <span className="text-gray-800">{classData.grNo || "—"}</span>
                                    </div>

                                    {/* SR No */}
                                    <div className="flex justify-start gap-4">
                                        <span className="font-semibold">SR No:</span>
                                        <span className="text-gray-800">{classData.srNo || "—"}</span>
                                    </div>

                                    {/* Admission No */}
                                    <div className="flex justify-start gap-4">
                                        <span className="font-semibold">Admission No:</span>
                                        <span className="text-gray-800">{classData.admissionNo || "—"}</span>
                                    </div>

                                    {/* Register No */}
                                    <div className="flex justify-start gap-4">
                                        <span className="font-semibold">Register No:</span>
                                        <span className="text-gray-800">{classData.registerNo || "—"}</span>
                                    </div>

                                    {/* Bus No */}
                                    <div className="flex justify-start gap-4">
                                        <span className="font-semibold">Bus No:</span>
                                        <span className="text-gray-800">{classData.busNo || "—"}</span>
                                    </div>

                                </div>


                            </div>

                            <br></br>


                            {/* ---------------- FATHER DETAILS PREVIEW ---------------- */}
                            <div
                                style={{ backgroundColor: "#FFF3E8", border: "1px solid #F5A86A" }}
                                className="p-6 rounded-xl shadow-sm"
                            >

                                <div className="flex justify-between items-center mb-4">
                                    <h3
                                        style={{ color: "#8B4513", fontSize: "20px", fontWeight: "600" }}
                                        className="flex items-center gap-2"
                                    >      <img src={parentIcon} className="w-6" style={{
                                        filter:
                                            "invert(24%) sepia(34%) saturate(1500%) hue-rotate(356deg) brightness(90%) contrast(90%)",
                                    }} />
                                        Father's Details
                                    </h3>
                                    <button onClick={() => setStep(2)} className="text-orange-600 font-medium">✏ Edit</button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-gray-700">

                                    <p><b>Name:</b> {fatherData.name}</p>
                                    <p><b>Relation:</b> {fatherData.relation}</p>

                                    <p><b>Contact No:</b> {fatherData.contact}</p>
                                    <p><b>Occupation:</b> {fatherData.occupation}</p>

                                    <p className="col-span-2"><b>Office Address:</b> {fatherData.office}</p>

                                    <p className="col-span-2">
                                        <b>Photograph:</b> {fatherData.photo ? fatherData.photo.name : "No file selected"}
                                    </p>

                                </div>
                            </div>

                            <br></br>

                            {/* ---------------- MOTHER DETAILS PREVIEW ---------------- */}
                            <div
                                style={{ backgroundColor: "#FFF3E8", border: "1px solid #F5A86A" }}
                                className="p-6 rounded-xl shadow-sm"
                            >

                                <div className="flex justify-between items-center mb-4">
                                    <h3
                                        style={{ color: "#8B4513", fontSize: "20px", fontWeight: "600" }}
                                        className="flex items-center gap-2"
                                    >       <img
                                            src={parentIcon}
                                            className="w-6"
                                            style={{
                                                filter:
                                                    "invert(24%) sepia(34%) saturate(1500%) hue-rotate(356deg) brightness(90%) contrast(90%)",
                                            }}
                                        />

                                        Mother's Details
                                    </h3>
                                    <button onClick={() => setStep(2)} className="text-orange-600 font-medium">✏ Edit</button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-gray-700">

                                    <p><b>Name:</b> {motherData.name}</p>
                                    <p><b>Relation:</b> {motherData.relation}</p>

                                    <p><b>Contact No:</b> {motherData.contact}</p>
                                    <p><b>Occupation:</b> {motherData.occupation}</p>

                                    <p className="col-span-2"><b>Office Address:</b> {motherData.office}</p>

                                    <p className="col-span-2">
                                        <b>Photograph:</b> {motherData.photo ? motherData.photo.name : "No file selected"}
                                    </p>

                                </div>
                            </div>
                            <br></br>

                            {/* SUBMIT BUTTON */}
                            <div className="text-center">
                                <p className="text-gray-700 mb-4" style={{ backgroundColor: "#FFF3E8", border: "1px solid #F5A86A" }}
                                    className="p-6 rounded-xl shadow-sm">
                                    Please review all the information carefully. You can edit any section by clicking the <span className="font-semibold text-orange-600">Edit</span> button above.
                                </p><br></br>

                                <div className="flex justify-center">
                                    <Button
                                        className="w-[260px] h-[65px] bg-orange-600 text-white rounded-xl text-xl font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center"
                                        onClick={() => setStep(4)}
                                    >
                                        Continue to Submit
                                    </Button>
                                </div>


                            </div>


                        </div>
                    )}



                </div>

                {/* ===================== SUBMIT PAGE (STEP 5) ===================== */}
                {step === 4 && (
                    <div className="space-y-10">

                        {/* TOP HEADING AREA */}
                        <div className="text-center mt-6">
                            <div className="flex justify-center">
                                <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="45"
                                        height="45"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#ffffff"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="rotate-[15deg]"
                                    >
                                        <path d="M22 2L11 13"></path>
                                        <path d="M22 2L15 22 11 13 2 9 22 2z"></path>
                                    </svg>
                                </div>




                            </div>

                            <h2 className="text-2xl font-semibold text-blue-600 mt-4">
                                Ready to Submit?
                            </h2>


                            <p className="text-gray-600 text-xl mt-1">
                                You're about to submit the student registration form
                            </p>
                        </div><br></br>

                        {/* SUMMARY CARD */}
                        <div className="bg-[#FFF3E8] border border-[#F5A86A] p-6 rounded-2xl shadow-sm" style={{ backgroundColor: "#FFF3E8", border: "1px solid #F5A86A" }}
                            className="p-6 rounded-xl shadow-sm">

                            <h3
                                className="text-center text-lg font-semibold mb-5"
                                style={{ color: "#8B4513" }}
                            >
                                Summary
                            </h3>
                            <br></br>

                            <div className="space-y-4">

                                {/* STUDENT NAME */}
                                <div className="bg-white rounded-lg px-4 py-3 flex justify-start gap-4 text-gray-700 shadow-sm">
                                    <span className="font-medium">Student Name:</span>
                                    <span>{studentData.name || "—"}</span>
                                </div>

                                {/* CLASS */}
                                <div className="bg-white rounded-lg px-4 py-3 flex justify-start gap-4 text-gray-700 shadow-sm">
                                    <span className="font-medium">Class:</span>
                                    <span>
                                        {classData.className && classData.division
                                            ? `${classData.className} - ${classData.division}`
                                            : "—"}
                                    </span>
                                </div>

                                {/* ROLL NO */}
                                <div className="bg-white rounded-lg px-4 py-3 flex justify-start gap-4 text-gray-700 shadow-sm">
                                    <span className="font-medium">Roll No:</span>
                                    <span>{classData.rollNo || "—"}</span>
                                </div>

                                {/* FATHER NAME */}
                                <div className="bg-white rounded-lg px-4 py-3 flex justify-start gap-4 text-gray-700 shadow-sm">
                                    <span className="font-medium">Father's Name:</span>
                                    <span>{fatherData.name || "—"}</span>
                                </div>

                                {/* MOTHER NAME */}
                                <div className="bg-white rounded-lg px-4 py-3 flex justify-start gap-4 text-gray-700 shadow-sm">
                                    <span className="font-medium">Mother's Name:</span>
                                    <span>{motherData.name || "—"}</span>
                                </div>

                            </div>
                        </div><br></br>

                        {/* WHAT HAPPENS NEXT BOX  */}
                        <div
                            style={{
                                backgroundColor: "#E8FBEF",
                                border: "1px solid #7BCC8A",
                                padding: "20px",
                                borderRadius: "12px",
                            }}
                            className="shadow-sm"
                        >
                            <h4 className="font-semibold flex items-center gap-2" style={{ color: "#0f7a28" }}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    fill="#0f7a28"
                                    viewBox="0 0 24 24"
                                >
                                    <circle cx="12" cy="12" r="10" stroke="#0f7a28" strokeWidth="2" fill="none" />
                                    <path d="M8 12l2.5 2.5L16 9" stroke="#0f7a28" strokeWidth="2" fill="none" />
                                </svg>
                                What happens next?
                            </h4>

                            <ul
                                style={{ color: "#0f7a28" }}
                                className="text-sm mt-3 space-y-1 ml-6 list-disc"
                            >
                                <li>Your form will be submitted to the school administration</li>
                                <li>You will receive a confirmation email</li>
                                <li>The school will contact you if any additional information is needed</li>
                            </ul>
                        </div><br></br>



                        {/* ACTION BUTTONS */}
                        <div className="flex justify-center items-center gap-6 mt-8">

                            <Button
                                className="w-[220px] h-[60px] bg-gray-200 text-gray-700 text-lg font-semibold rounded-lg hover:bg-gray-300"
                                onClick={() => setStep(3)}
                            >
                                Back to Review
                            </Button>

                            <Button
                                className="w-[220px] h-[60px] bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700"
                                onClick={() => setStep(5)}
                            >
                                ✔ Confirm & Submit
                            </Button>

                        </div>


                    </div>
                )}


                {step === 5 && (
                    <div className="space-y-10">

                        {/* SUCCESS ICON */}
                        <div className="text-center mt-6">
                            <div className="flex justify-center mt-6">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-green-600 rounded-full flex items-center justify-center shadow-md">
                                    <span className="text-white text-6xl sm:text-8xl md:text-9xl">✔</span>
                                </div>
                            </div>




                            <h2
                                className="mt-6"
                                style={{
                                    color: "#0A8A0A",
                                    fontSize: "40px",
                                    fontWeight: "400",
                                }}
                            >
                                🎉 Form Submitted Successfully!
                            </h2>



                            <p className="text-gray-600 text-lg mt-2">
                                Thank you for completing the student registration form
                            </p>

                        </div><br></br>


                        {/* REGISTRATION COMPLETE BOX */}
                        <div className="flex justify-center items-center">
                            <div className="bg-green-100 border border-green-400 p-6 rounded-xl shadow-md text-center w-full max-w-sm">

                                <h3 className="text-green-800 font-semibold flex justify-center items-center gap-2 text-lg">
                                    ✔ Registration Complete
                                </h3>

                                <p className="text-green-800 text-sm mt-2">
                                    Your student registration has been successfully submitted and will be
                                    processed by the school administration.
                                </p>

                            </div>
                        </div><br></br>





                        {/* WHAT’S NEXT SECTION */}
                        <div
                            style={{ backgroundColor: "#EEF1FF", border: "1px solid #5C4CF9" }}
                            className="w-full max-w-md p-6 rounded-xl shadow-sm mx-auto"
                        >
                            <h4 className="text-[#5C4CF9] font-semibold flex items-center gap-2 text-lg mb-4">
                                📋 What's Next?
                            </h4>

                            <div className="text-[#5C4CF9] text-sm space-y-4">
                                <div>
                                    <h5 className="font-semibold">Email Confirmation</h5>
                                    <p>You will receive a confirmation email with your registration details shortly.</p>
                                </div>

                                <div>
                                    <h5 className="font-semibold">School Contact</h5>
                                    <p>The school administration will contact you if any additional information is required.</p>
                                </div>

                                <div>
                                    <h5 className="font-semibold">Visit School Office</h5>
                                    <p>Please visit the school office with original documents for verification within 7 days.</p>
                                </div>
                            </div>
                        </div>
                        <br></br>



                        {/* NEED HELP BOX */}
                        <div className="bg-white border border-gray-300 p-6 rounded-xl shadow-sm max-w-md mx-auto">
                            {/* Centered Heading */}
                            <h4 className="text-red-600 font-semibold flex items-center justify-center gap-2 text-lg mb-2">
                                ☎ Need Help?
                            </h4>

                            <p className="text-gray-600 text-sm text-center">
                                If you have any questions or concerns, please contact the school office:
                            </p>

                            <div className="mt-3 text-gray-700 text-sm space-y-1 text-center">
                                <p><b>Phone:</b> +1 (555) 123-4567</p>
                                <p><b>Email:</b> admin@school.edu</p>
                                <p><b>Office Hours:</b> Monday – Friday, 8:00 AM – 4:00 PM</p>
                            </div>
                        </div><br></br>


                        {/* SUBMIT ANOTHER FORM BUTTON */}
                        <div className="flex justify-center mt-10 pb-10">
                            <Button
                                className=" w-[300px] py-5 bg-blue-600 text-white rounded-lg text-lg shadow-md hover:bg-blue-700"
                                onClick={() => setStep(0)}
                            >
                                Submit Another Form
                            </Button>
                        </div>




                        {/* REFERENCE ID (RANDOM) */}
                        <p className="text-center text-gray-400 text-xs mt-2">
                            Reference ID: REG-{Math.floor(100000 + Math.random() * 900000)}
                        </p>

                    </div>
                )}


                {/* FOOTER ACTIONS */}
                <div className="flex items-center justify-between gap-4 mt-4">
                    <div>

                    </div>

                    <div className="flex items-center gap-3">
                        {step > 0 && step !== 2 && step !== 4 && (
                            <Button variant="outline" onClick={goBack} className="px-6 py-2">
                                Back
                            </Button>
                        )}

                        {step > 0 && step < 2 ? (
                            <Button onClick={goNext} className="px-6 py-2 bg-blue-600 text-white">
                                Next Step
                            </Button>
                        ) : (
                            <>
                                {step === 3 && (

                                    <Button
                                        onClick={() => setIsDialogOpen(true)}
                                        className="px-6 py-3 rounded-lg shadow-md 
             !bg-gradient-to-r !from-[#6A11CB] !to-[#2575FC]
             text-white font-semibold 
             hover:opacity-90 transition 
             !border-none !bg-opacity-100"
                                    >
                                        Share with Parents
                                    </Button>
                                )}




                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* SHARE DIALOG - kept same structure as your dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl p-6 md:p-8 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg md:text-xl font-semibold text-gray-900">
                            Share Student Information Form
                        </DialogTitle>
                        <p className="text-gray-600 text-sm mt-1">
                            Send digital student info forms to parents of your selected class.
                        </p>
                    </DialogHeader>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        <div>
                            <label className="text-sm text-gray-600 mb-1 block">
                                Select Class
                            </label>
                            <Select>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Class 1">Class 1</SelectItem>
                                    <SelectItem value="Class 2">Class 2</SelectItem>
                                    <SelectItem value="Class 3">Class 3</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 mb-1 block">
                                Select Division
                            </label>
                            <Select>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Division" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A">Division A</SelectItem>
                                    <SelectItem value="B">Division B</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 text-sm font-medium mt-4 mb-2">
                        <span className="text-green-600">✅ 2 Sent</span>
                        <span className="text-red-500">❌ 3 Not Sent</span>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <Table className="table-fixed w-full">
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="w-[160px]">Student Name</TableHead>
                                    <TableHead className="w-[160px]">Parent Name</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="w-[160px]">
                                        <span className="block truncate" title="Aarav Sharma">Aarav Sharma</span>
                                    </TableCell>
                                    <TableCell className="w-[160px]">
                                        <span className="block truncate" title="Mr. Rajesh Sharma">Mr. Rajesh Sharma</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm font-medium">
                                            Sent
                                        </span>
                                    </TableCell>
                                </TableRow>

                                <TableRow>
                                    <TableCell className="w-[160px]">
                                        <span className="block truncate" title="Diya Patel">Diya Patel</span>
                                    </TableCell>
                                    <TableCell className="w-[160px]">
                                        <span className="block truncate" title="Mr. Amit Patel">Mr. Amit Patel</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-red-600 bg-red-100 px-3 py-1 rounded-full text-sm font-medium">
                                            Not Sent
                                        </span>
                                    </TableCell>
                                </TableRow>

                                <TableRow>
                                    <TableCell className="w-[160px]">
                                        <span className="block truncate" title="Rohan Kumar">Rohan Kumar</span>
                                    </TableCell>
                                    <TableCell className="w-[160px]">
                                        <span className="block truncate" title="Mrs. Priya Kumar">Mrs. Priya Kumar</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm font-medium">
                                            Sent
                                        </span>
                                    </TableCell>
                                </TableRow>

                                <TableRow>
                                    <TableCell className="w-[160px]">
                                        <span className="block truncate" title="Ananya Singh">Ananya Singh</span>
                                    </TableCell>
                                    <TableCell className="w-[160px]">
                                        <span className="block truncate" title="Mr. Vikram Singh">Mr. Vikram Singh</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-red-600 bg-red-100 px-3 py-1 rounded-full text-sm font-medium">
                                            Not Sent
                                        </span>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
                        <Button
                            onClick={() => console.log("Sent to all parents")}   // <-- fully clickable
                            className="
        w-full sm:w-auto
        bg-blue-600 text-white font-semibold
        px-8 py-3 rounded-md shadow-md
        transition-all duration-200
        hover:bg-blue-700 active:scale-95
    "
                        >
                            Send to All Parents
                        </Button>


                        <Button
                            variant="outline"
                            className="w-full sm:w-auto border-2 border-[#8E2DE2] text-[#8E2DE2] 
                     hover:bg-[#F5E6FF] font-semibold px-8 py-3 rounded-md transition"
                        >
                            Resend to Pending (3)
                        </Button>
                    </div>

                    <div className="text-center mt-4">
                        <button
                            onClick={() => setIsDialogOpen(false)}
                            className="text-gray-600 text-sm font-medium hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <p className="text-xs text-gray-400 mt-2">
                            Parents will receive a secure link via email or SMS.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
