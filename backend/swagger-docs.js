/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Authentication endpoints for Super Admin, Trust, School, and Teacher
 *   - name: Super Admin
 *     description: Super Admin management endpoints
 *   - name: Trust
 *     description: Trust management endpoints
 *   - name: School
 *     description: School management endpoints
 *   - name: Class
 *     description: Class and Division management endpoints
 *   - name: Teacher
 *     description: Teacher management endpoints
 *   - name: Student
 *     description: Student management endpoints
 *   - name: Student Forms
 *     description: Student form submission and management endpoints
 *   - name: Form Links
 *     description: Form link generation and management endpoints
 *   - name: Digital Forms
 *     description: Digital forms summary and reporting endpoints
 *   - name: Student ID
 *     description: Student ID card generation endpoints
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check endpoint
 *     tags: [General]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "✅ IDCRM API is running"
 */

// ==================== SUPER ADMIN ROUTES ====================

/**
 * @swagger
 * /api/superadmin/create:
 *   post:
 *     summary: Create a new Super Admin
 *     tags: [Super Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       201:
 *         description: Super Admin created successfully
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/superadmin/login:
 *   post:
 *     summary: Super Admin login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/superadmin/logout:
 *   post:
 *     summary: Super Admin logout
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */

/**
 * @swagger
 * /api/superadmin/trusts/{trustId}/status:
 *   put:
 *     summary: Update trust registration status
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trustId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Trust ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 example: approved
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/trust/create:
 *   post:
 *     summary: Create a new Trust
 *     tags: [Trust]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrustCreate'
 *     responses:
 *       201:
 *         description: Trust created successfully
 */

/**
 * @swagger
 * /api/trust/all:
 *   get:
 *     summary: Get all Trusts
 *     tags: [Trust]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all trusts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Trust'
 */

/**
 * @swagger
 * /api/trust/{id}:
 *   patch:
 *     summary: Update a Trust
 *     tags: [Trust]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrustCreate'
 *     responses:
 *       200:
 *         description: Trust updated successfully
 */

/**
 * @swagger
 * /api/school/all:
 *   get:
 *     summary: Get all Schools
 *     tags: [School]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all schools
 */

/**
 * @swagger
 * /api/school/create:
 *   post:
 *     summary: Create a new School
 *     tags: [School]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchoolCreate'
 *     responses:
 *       201:
 *         description: School created successfully
 */

/**
 * @swagger
 * /api/school/{id}:
 *   patch:
 *     summary: Update a School
 *     tags: [School]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchoolCreate'
 *     responses:
 *       200:
 *         description: School updated successfully
 */

// ==================== AUTHENTICATION ROUTES ====================

/**
 * @swagger
 * /api/trust/auth/login:
 *   post:
 *     summary: Trust login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 */

/**
 * @swagger
 * /api/trust/auth/logout:
 *   post:
 *     summary: Trust logout
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */

/**
 * @swagger
 * /api/school/auth/login:
 *   post:
 *     summary: School login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 */

/**
 * @swagger
 * /api/school/auth/logout:
 *   post:
 *     summary: School logout
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */

/**
 * @swagger
 * /api/teacher/auth/login:
 *   post:
 *     summary: Teacher login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 */

/**
 * @swagger
 * /api/teacher/auth/logout:
 *   post:
 *     summary: Teacher logout
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */

// ==================== TRUST REGISTRATION ROUTES ====================

/**
 * @swagger
 * /api/trust/register:
 *   post:
 *     summary: Register a new Trust (Public endpoint)
 *     tags: [Trust]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrustCreate'
 *     responses:
 *       201:
 *         description: Trust registration successful
 */

/**
 * @swagger
 * /api/trust/register:
 *   put:
 *     summary: Update Trust registration (Requires authentication)
 *     tags: [Trust]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrustCreate'
 *     responses:
 *       200:
 *         description: Trust registration updated successfully
 */

/**
 * @swagger
 * /api/trust/schools/create:
 *   post:
 *     summary: Trust creates a School
 *     tags: [School]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchoolCreate'
 *     responses:
 *       201:
 *         description: School created successfully
 */

/**
 * @swagger
 * /api/trust/schools/all:
 *   get:
 *     summary: Get all Schools for a Trust
 *     tags: [School]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of schools for the trust
 */

// ==================== CLASS ROUTES ====================

/**
 * @swagger
 * /api/school/class/create:
 *   post:
 *     summary: Create a new Class
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassCreate'
 *     responses:
 *       201:
 *         description: Class created successfully
 */

/**
 * @swagger
 * /api/school/class/school/{school_id}:
 *   get:
 *     summary: Get all Classes for a School
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: school_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of classes
 */

/**
 * @swagger
 * /api/school/class/update/{class_id}:
 *   patch:
 *     summary: Update a Class
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: class_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassCreate'
 *     responses:
 *       200:
 *         description: Class updated successfully
 */

/**
 * @swagger
 * /api/school/class/delete/{class_id}:
 *   delete:
 *     summary: Delete a Class
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: class_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Class deleted successfully
 */

/**
 * @swagger
 * /api/school/class/division:
 *   post:
 *     summary: Create a new Division
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DivisionCreate'
 *     responses:
 *       201:
 *         description: Division created successfully
 */

/**
 * @swagger
 * /api/school/class/class/{class_name}/divisions:
 *   get:
 *     summary: Get all Divisions for a Class
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: class_name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of divisions
 */

/**
 * @swagger
 * /api/school/class/division/update/{division_id}:
 *   patch:
 *     summary: Update a Division
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: division_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DivisionCreate'
 *     responses:
 *       200:
 *         description: Division updated successfully
 */

/**
 * @swagger
 * /api/school/class/division/delete/{division_id}:
 *   delete:
 *     summary: Delete a Division
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: division_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Division deleted successfully
 */

// ==================== TEACHER ROUTES ====================

/**
 * @swagger
 * /api/school/teacher/create:
 *   post:
 *     summary: Create a new Teacher
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TeacherCreate'
 *     responses:
 *       201:
 *         description: Teacher created successfully
 */

/**
 * @swagger
 * /api/school/teacher/school/{school_id}:
 *   get:
 *     summary: Get all Teachers for a School
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: school_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of teachers
 */

/**
 * @swagger
 * /api/teacher/myclass/dashboard:
 *   get:
 *     summary: Get Teacher Dashboard data
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher dashboard data
 */

/**
 * @swagger
 * /api/teacher/pending-summary:
 *   get:
 *     summary: Get pending approval summary for Teacher
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending approval summary
 */

/**
 * @swagger
 * /api/teacher/students:
 *   get:
 *     summary: Get all Students for Teacher's class/division
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students
 */

/**
 * @swagger
 * /api/teacher/import-excel:
 *   post:
 *     summary: Import Students from Excel file
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file (.xlsx) containing student data
 *     responses:
 *       200:
 *         description: Students imported successfully
 *       400:
 *         description: Invalid file format or data
 */

// ==================== STUDENT ROUTES ====================

/**
 * @swagger
 * /api/school/student/create:
 *   post:
 *     summary: Create a new Student
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentCreate'
 *     responses:
 *       201:
 *         description: Student created successfully
 */

/**
 * @swagger
 * /api/school/student/school/{school_id}:
 *   get:
 *     summary: Get all Students for a School
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: school_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of students
 */

// ==================== STUDENT FORMS ROUTES ====================

/**
 * @swagger
 * /api/student-forms/submit:
 *   post:
 *     summary: Submit a Student Form (Public endpoint)
 *     tags: [Student Forms]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/StudentFormSubmit'
 *     responses:
 *       201:
 *         description: Form submitted successfully
 */

/**
 * @swagger
 * /api/teacher/student-forms:
 *   get:
 *     summary: Get all Student Forms for Teacher's class
 *     tags: [Student Forms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of student forms
 */

/**
 * @swagger
 * /api/teacher/student-forms/{id}:
 *   patch:
 *     summary: Update Student Form status (approve/reject)
 *     tags: [Student Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FormStatusUpdate'
 *     responses:
 *       200:
 *         description: Form status updated successfully
 */

/**
 * @swagger
 * /api/teacher/share-form:
 *   post:
 *     summary: Share form link with students
 *     tags: [Student Forms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *               - division_id
 *             properties:
 *               class_id:
 *                 type: integer
 *               division_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Form link shared successfully
 */

// ==================== FORM LINKS ROUTES ====================

/**
 * @swagger
 * /api/form-links/generate:
 *   post:
 *     summary: Generate a new Form Link
 *     tags: [Form Links]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FormLinkCreate'
 *     responses:
 *       201:
 *         description: Form link generated successfully
 */

/**
 * @swagger
 * /api/form-links/my-links:
 *   get:
 *     summary: Get all Form Links for logged-in Teacher
 *     tags: [Form Links]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of form links
 */

/**
 * @swagger
 * /api/form-links/public/{token}:
 *   get:
 *     summary: Get Form Link information (Public)
 *     tags: [Form Links]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Form link information
 */

/**
 * @swagger
 * /api/form-links/public/{token}/submit:
 *   post:
 *     summary: Submit form using public token (Public endpoint)
 *     tags: [Form Links]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/StudentFormSubmit'
 *     responses:
 *       201:
 *         description: Form submitted successfully
 */

/**
 * @swagger
 * /api/form-links/deactivate/{token}:
 *   patch:
 *     summary: Deactivate a Form Link
 *     tags: [Form Links]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Form link deactivated successfully
 */

// ==================== DIGITAL FORMS ROUTES ====================

/**
 * @swagger
 * /api/school/school-summary:
 *   get:
 *     summary: Get School-level Forms Summary
 *     tags: [Digital Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: export
 *         schema:
 *           type: string
 *           enum: [csv]
 *         description: Export as CSV if value is 'csv'
 *     responses:
 *       200:
 *         description: School forms summary (JSON or CSV)
 */

/**
 * @swagger
 * /api/school/class-students:
 *   get:
 *     summary: Get Student Forms for a specific Class/Division
 *     tags: [Digital Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: integer
 *         required: true
 *       - in: query
 *         name: division_id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: List of student forms for the class
 */

// ==================== STUDENT ID ROUTES ====================

/**
 * @swagger
 * /api/school/generate-ids:
 *   post:
 *     summary: Generate Student IDs for approved students
 *     tags: [Student ID]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               student_form_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Student IDs generated successfully
 */

/**
 * @swagger
 * /api/school/pending-ids:
 *   get:
 *     summary: Get approved students without generated IDs
 *     tags: [Student ID]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students pending ID generation
 */

