import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// ==================== SCHOOLS API ====================

// Get all schools for a trust
app.get('/make-server-9d5cfccf/schools/:trustId', async (c) => {
  try {
    const trustId = c.req.param('trustId');
    const schools = await kv.getByPrefix(`school:${trustId}:`);

    return c.json({
      success: true,
      data: schools || [],
    });
  } catch (error) {
    console.log('Error fetching schools:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Add a new school
app.post('/make-server-9d5cfccf/schools', async (c) => {
  try {
    const body = await c.req.json();
    const { trustId, schoolData } = body;

    const schoolId = `school:${trustId}:${Date.now()}`;
    const school = {
      id: schoolId,
      ...schoolData,
      totalStudents: 0,
      totalClasses: 0,
      creditsAllocated: 0,
      creditsUsed: 0,
      addedOn: new Date().toISOString().split('T')[0],
    };

    await kv.set(schoolId, school);

    return c.json({
      success: true,
      data: school,
    });
  } catch (error) {
    console.log('Error adding school:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update school
app.put('/make-server-9d5cfccf/schools/:schoolId', async (c) => {
  try {
    const schoolId = c.req.param('schoolId');
    const updates = await c.req.json();

    const existingSchool = await kv.get(schoolId);
    if (!existingSchool) {
      return c.json({ success: false, error: 'School not found' }, 404);
    }

    const updatedSchool = { ...existingSchool, ...updates };
    await kv.set(schoolId, updatedSchool);

    return c.json({
      success: true,
      data: updatedSchool,
    });
  } catch (error) {
    console.log('Error updating school:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== TEACHERS API ====================

// Get all teachers for a school
app.get('/make-server-9d5cfccf/teachers/:schoolId', async (c) => {
  try {
    const schoolId = c.req.param('schoolId');
    const teachers = await kv.getByPrefix(`teacher:${schoolId}:`);

    return c.json({
      success: true,
      data: teachers || [],
    });
  } catch (error) {
    console.log('Error fetching teachers:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Add a new teacher
app.post('/make-server-9d5cfccf/teachers', async (c) => {
  try {
    const body = await c.req.json();
    const { schoolId, teacherData } = body;

    const teacherId = `teacher:${schoolId}:${Date.now()}`;
    const teacher = {
      id: teacherId,
      ...teacherData,
      classesAssigned: [],
      totalStudents: 0,
      joinedOn: new Date().toISOString().split('T')[0],
    };

    await kv.set(teacherId, teacher);

    return c.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    console.log('Error adding teacher:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update teacher
app.put('/make-server-9d5cfccf/teachers/:teacherId', async (c) => {
  try {
    const teacherId = c.req.param('teacherId');
    const updates = await c.req.json();

    const existingTeacher = await kv.get(teacherId);
    if (!existingTeacher) {
      return c.json({ success: false, error: 'Teacher not found' }, 404);
    }

    const updatedTeacher = { ...existingTeacher, ...updates };
    await kv.set(teacherId, updatedTeacher);

    return c.json({
      success: true,
      data: updatedTeacher,
    });
  } catch (error) {
    console.log('Error updating teacher:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete teacher
app.delete('/make-server-9d5cfccf/teachers/:teacherId', async (c) => {
  try {
    const teacherId = c.req.param('teacherId');
    await kv.del(teacherId);

    return c.json({
      success: true,
      message: 'Teacher deleted successfully',
    });
  } catch (error) {
    console.log('Error deleting teacher:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== STUDENTS API ====================

// Get all students for a school
app.get('/make-server-9d5cfccf/students/:schoolId', async (c) => {
  try {
    const schoolId = c.req.param('schoolId');
    const students = await kv.getByPrefix(`student:${schoolId}:`);

    return c.json({
      success: true,
      data: students || [],
    });
  } catch (error) {
    console.log('Error fetching students:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Add a new student
app.post('/make-server-9d5cfccf/students', async (c) => {
  try {
    const body = await c.req.json();
    const { schoolId, studentData } = body;

    const studentId = `student:${schoolId}:${Date.now()}`;
    const student = {
      id: studentId,
      ...studentData,
      formStatus: 'Pending',
      submittedOn: '-',
    };

    await kv.set(studentId, student);

    return c.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.log('Error adding student:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update student
app.put('/make-server-9d5cfccf/students/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId');
    const updates = await c.req.json();

    const existingStudent = await kv.get(studentId);
    if (!existingStudent) {
      return c.json({ success: false, error: 'Student not found' }, 404);
    }

    const updatedStudent = { ...existingStudent, ...updates };
    await kv.set(studentId, updatedStudent);

    return c.json({
      success: true,
      data: updatedStudent,
    });
  } catch (error) {
    console.log('Error updating student:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete student
app.delete('/make-server-9d5cfccf/students/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId');
    await kv.del(studentId);

    return c.json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.log('Error deleting student:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== CLASSES API ====================

// Get all classes for a school
app.get('/make-server-9d5cfccf/classes/:schoolId', async (c) => {
  try {
    const schoolId = c.req.param('schoolId');
    const classes = await kv.getByPrefix(`class:${schoolId}:`);

    return c.json({
      success: true,
      data: classes || [],
    });
  } catch (error) {
    console.log('Error fetching classes:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Add a new class
app.post('/make-server-9d5cfccf/classes', async (c) => {
  try {
    const body = await c.req.json();
    const { schoolId, classData } = body;

    const classId = `class:${schoolId}:${Date.now()}`;
    const classRecord = {
      id: classId,
      ...classData,
      totalStudents: 0,
      createdOn: new Date().toISOString().split('T')[0],
    };

    await kv.set(classId, classRecord);

    return c.json({
      success: true,
      data: classRecord,
    });
  } catch (error) {
    console.log('Error adding class:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update class
app.put('/make-server-9d5cfccf/classes/:classId', async (c) => {
  try {
    const classId = c.req.param('classId');
    const updates = await c.req.json();

    const existingClass = await kv.get(classId);
    if (!existingClass) {
      return c.json({ success: false, error: 'Class not found' }, 404);
    }

    const updatedClass = { ...existingClass, ...updates };
    await kv.set(classId, updatedClass);

    return c.json({
      success: true,
      data: updatedClass,
    });
  } catch (error) {
    console.log('Error updating class:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete class
app.delete('/make-server-9d5cfccf/classes/:classId', async (c) => {
  try {
    const classId = c.req.param('classId');
    await kv.del(classId);

    return c.json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    console.log('Error deleting class:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== CREDITS API ====================

// Get credit allocation for a school
app.get('/make-server-9d5cfccf/credits/:schoolId', async (c) => {
  try {
    const schoolId = c.req.param('schoolId');
    const credits = (await kv.get(`credits:${schoolId}`)) || {
      allocated: 0,
      used: 0,
      remaining: 0,
    };

    return c.json({
      success: true,
      data: credits,
    });
  } catch (error) {
    console.log('Error fetching credits:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Allocate credits to a school
app.post('/make-server-9d5cfccf/credits/allocate', async (c) => {
  try {
    const body = await c.req.json();
    const { schoolId, amount, description, performedBy } = body;

    // Get current credits
    const currentCredits = (await kv.get(`credits:${schoolId}`)) || {
      allocated: 0,
      used: 0,
      remaining: 0,
    };

    // Update credits
    const updatedCredits = {
      allocated: currentCredits.allocated + amount,
      used: currentCredits.used,
      remaining: currentCredits.remaining + amount,
    };

    await kv.set(`credits:${schoolId}`, updatedCredits);

    // Log transaction
    const transactionId = `transaction:${schoolId}:${Date.now()}`;
    const transaction = {
      id: transactionId,
      schoolId,
      date: new Date().toISOString(),
      type: 'Allocation',
      credits: amount,
      description,
      performedBy,
    };

    await kv.set(transactionId, transaction);

    return c.json({
      success: true,
      data: updatedCredits,
    });
  } catch (error) {
    console.log('Error allocating credits:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Use credits (for ID card generation)
app.post('/make-server-9d5cfccf/credits/use', async (c) => {
  try {
    const body = await c.req.json();
    const { schoolId, amount, description } = body;

    // Get current credits
    const currentCredits = (await kv.get(`credits:${schoolId}`)) || {
      allocated: 0,
      used: 0,
      remaining: 0,
    };

    // Check if enough credits available
    if (currentCredits.remaining < amount) {
      return c.json(
        {
          success: false,
          error: 'Insufficient credits',
        },
        400
      );
    }

    // Update credits
    const updatedCredits = {
      allocated: currentCredits.allocated,
      used: currentCredits.used + amount,
      remaining: currentCredits.remaining - amount,
    };

    await kv.set(`credits:${schoolId}`, updatedCredits);

    // Log transaction
    const transactionId = `transaction:${schoolId}:${Date.now()}`;
    const transaction = {
      id: transactionId,
      schoolId,
      date: new Date().toISOString(),
      type: 'Usage',
      credits: -amount,
      description,
      performedBy: 'School Admin',
    };

    await kv.set(transactionId, transaction);

    return c.json({
      success: true,
      data: updatedCredits,
    });
  } catch (error) {
    console.log('Error using credits:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get credit transactions
app.get('/make-server-9d5cfccf/credits/transactions/:schoolId', async (c) => {
  try {
    const schoolId = c.req.param('schoolId');
    const transactions = await kv.getByPrefix(`transaction:${schoolId}:`);

    return c.json({
      success: true,
      data: transactions || [],
    });
  } catch (error) {
    console.log('Error fetching transactions:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== DIGITAL FORMS API ====================

// Get all forms for a school
app.get('/make-server-9d5cfccf/forms/:schoolId', async (c) => {
  try {
    const schoolId = c.req.param('schoolId');
    const forms = await kv.getByPrefix(`form:${schoolId}:`);

    return c.json({
      success: true,
      data: forms || [],
    });
  } catch (error) {
    console.log('Error fetching forms:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Submit a form
app.post('/make-server-9d5cfccf/forms/submit', async (c) => {
  try {
    const body = await c.req.json();
    const { schoolId, studentId, formData } = body;

    const formId = `form:${schoolId}:${studentId}`;
    const form = {
      id: formId,
      studentId,
      schoolId,
      ...formData,
      status: 'Pending Teacher Approval',
      submittedOn: new Date().toISOString(),
      teacherApproval: null,
      adminApproval: null,
    };

    await kv.set(formId, form);

    // Update student form status
    const student = await kv.get(studentId);
    if (student) {
      student.formStatus = 'Completed';
      student.submittedOn = new Date().toISOString().split('T')[0];
      await kv.set(studentId, student);
    }

    return c.json({
      success: true,
      data: form,
    });
  } catch (error) {
    console.log('Error submitting form:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Approve/Reject form (Teacher)
app.post('/make-server-9d5cfccf/forms/teacher-action', async (c) => {
  try {
    const body = await c.req.json();
    const { formId, action, teacherId, remarks } = body;

    const form = await kv.get(formId);
    if (!form) {
      return c.json({ success: false, error: 'Form not found' }, 404);
    }

    form.teacherApproval = {
      action,
      teacherId,
      remarks,
      timestamp: new Date().toISOString(),
    };

    if (action === 'approved') {
      form.status = 'Pending Admin Approval';
    } else {
      form.status = 'Rejected by Teacher';
    }

    await kv.set(formId, form);

    return c.json({
      success: true,
      data: form,
    });
  } catch (error) {
    console.log('Error processing teacher action:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Approve/Reject form (Admin)
app.post('/make-server-9d5cfccf/forms/admin-action', async (c) => {
  try {
    const body = await c.req.json();
    const { formId, action, adminId, remarks } = body;

    const form = await kv.get(formId);
    if (!form) {
      return c.json({ success: false, error: 'Form not found' }, 404);
    }

    form.adminApproval = {
      action,
      adminId,
      remarks,
      timestamp: new Date().toISOString(),
    };

    if (action === 'approved') {
      form.status = 'Approved - Ready for ID Card';
    } else {
      form.status = 'Rejected by Admin';
    }

    await kv.set(formId, form);

    return c.json({
      success: true,
      data: form,
    });
  } catch (error) {
    console.log('Error processing admin action:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Health check
app.get('/make-server-9d5cfccf/health', (c) => {
  return c.json({ status: 'OK', timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);
