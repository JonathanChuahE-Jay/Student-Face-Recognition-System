const express = require("express");
const cors = require("cors");
const bcrypt = require('bcrypt');
const knex = require("knex");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require('path');

const { handleRegister } = require('./controllers/Accounts/Authentication/Register');
const { handleLogin } = require("./controllers/Accounts/Authentication/Login");
const { handleAddNewSubject } = require("./controllers/Subjects/AddNewSubject");
const { handleShowAllSubjects } = require("./controllers/Subjects/ShowAllSubject");
const { handleValidEmail } = require("./controllers/Accounts/Authentication/ValidEmail");
const { handleForgotPassword } = require('./controllers/Accounts/Authentication/ForgotPassword');
const { handleExistingEmail } = require('./controllers/Accounts/Authentication/ExistingEmail');
const { handleUpdateSubject } = require("./controllers/Subjects/UpdateSubject");
const { handleDeleteSubject } = require("./controllers/Subjects/DeleteSubject");
const { handleStudentRegister } = require("./controllers/Accounts/Students/StudentRegister");
const { handleShowStudents } = require("./controllers/Accounts/Students/ShowStudents");
const { handleLecturerRegister } = require("./controllers/Accounts/Lecturers/LecturerRegister");
const { handleShowLecturers } = require("./controllers/Accounts/Lecturers/ShowLecturers");
const { handleDeleteLecturer } = require("./controllers/Accounts/Lecturers/DeleteLecturer");
const { handleUpdateLecturer } = require("./controllers/Accounts/Lecturers/UpdateLecturer");
const { handleAssignSubjectToLecturer } = require('./controllers/Accounts/Lecturers/AssignSubject');
const { handleDisplayAssignedSubject } = require('./controllers/Subjects/DisplayAssignedSubject');
const { handleUpdateStudent } = require("./controllers/Accounts/Students/UpdateStudent");
const { handleDeleteStudent } = require("./controllers/Accounts/Students/DeleteStudent");
const { handleShowAttendance } = require('./controllers/Attendance/Show_Attendance');
const { handleAddAttendance } = require("./controllers/Attendance/Add_Attendance");
const { handleAssignSubjectToStudent } = require("./controllers/Accounts/Students/AssignSubjectStudent");
const { handleShowAssignedStudentAndLecturer } = require("./controllers/Subjects/ShowAssignedStudentAndLecturer");
const { handleShowSelectedSubjects } = require("./controllers/Course/ShowSelectedSujects");
const { handleAddNewCourse } = require("./controllers/Course/AddNewCourse");
const { handleShowAllCourseSubjects } = require("./controllers/Course/ShowAllCourseSubjects");
const { handleUpdateCourse } = require("./controllers/Course/UpdateCourse");
const { handleDeleteCourse } = require("./controllers/Course/DeleteCourse");
const { handleDisplayStudentCourse } = require("./controllers/Accounts/Students/DisplayStudentCourse");
const { handleDeleteAssignedSubject } = require("./controllers/Accounts/Students/DeleteAssignedSubject");
const { handleAlterAssignedLecturer } = require("./controllers/Subjects/AlterAssignedLecturer");
const { handleAlterAssignSubjectToStudent } = require("./controllers/Subjects/AlterAssignedStudents");
const { handleUpdateAttendance } = require("./controllers/Attendance/Update_Attendance");
const { handleDisplayDailyReport } = require("./controllers/Report/Display_Report");
const { handleAdminHomeStats } = require("./controllers/Stats/AdminHomeStats");
const { handleUpdateProfile } = require("./controllers/Accounts/Authentication/updateProfile");
const { handleShowUser } = require("./controllers/Accounts/Authentication/ShowUser");
const { handleUpload } = require('./controllers/FaceRecognition/Upload');
const { handleAutoAddAttendance } = require("./controllers/Attendance/Auto_Add_Attendance");
const { handleDisplayClassStudents } = require("./controllers/FaceRecognition/DisplayClassStudents");
const { handleAlterSessionLogs } = require("./controllers/Subjects/AlterSessionLogs");
const { handleAutoSessionLogs } = require("./controllers/Subjects/AutoSessionLogs");

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const database = knex({
    client: 'pg',
    connection: {
        host: 'localhost',
        user: 'postgres',
        password: '123123',
        database: 'Form'
    }
});

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

// Routes
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Stats
app.get('/display-admin-home-stats',handleAdminHomeStats(database));

// Report
app.post('/display-daily-report', handleDisplayDailyReport(database));

// Attendances
app.get('/auto-update-attendance',handleAutoAddAttendance(database));
app.post('/add-attendance', handleAddAttendance(database));
app.post('/show-attendances', handleShowAttendance(database));
app.post('/update-attendance',handleUpdateAttendance(database));

// Students
app.delete('/delete-student', handleDeleteStudent(database));
app.post('/register-student', handleStudentRegister(database, bcrypt));
app.get('/show-students/:student_id?', handleShowStudents(database));
app.post('/update-student', handleUpdateStudent(database));
app.post('/assign-subject-student',handleAssignSubjectToStudent(database));
app.post('/display-student-course-subjects',handleDisplayStudentCourse(database));
app.post('/delete-assigned-subject',handleDeleteAssignedSubject(database));

// Lecturers
app.post('/register-lecturer', handleLecturerRegister(database, bcrypt));
app.get('/show-lecturers', handleShowLecturers(database));
app.delete('/delete-lecturer', handleDeleteLecturer(database));
app.post('/update-lecturer', handleUpdateLecturer(database)); 
app.post('/assign-subject-lecturer', handleAssignSubjectToLecturer(database));

// Subjects
app.post('/add-new-subject', handleAddNewSubject(database));
app.get('/show-all-subjects', handleShowAllSubjects(database));
app.post('/update-subject', handleUpdateSubject(database));
app.post('/delete-subject', handleDeleteSubject(database));
app.post('/display-assigned-subjects', handleDisplayAssignedSubject(database));
app.post('/display-assigned-student-and-lecturer',handleShowAssignedStudentAndLecturer(database));
app.post('/alter-assigned-lecturer',handleAlterAssignedLecturer(database));
app.post('/alter-assigned-student',handleAlterAssignSubjectToStudent(database));
app.post('/alter-session-logs',handleAlterSessionLogs(database));
app.get('/auto-session-logs',handleAutoSessionLogs(database));

// Courses
app.post('/show-selected-subjects',handleShowSelectedSubjects(database));
app.post('/add-new-course',handleAddNewCourse(database));
app.get('/show-all-courses',handleShowAllCourseSubjects(database));
app.post('/update-course',handleUpdateCourse(database));
app.post('/delete-course',handleDeleteCourse(database));

// Authentication and Other Routes
app.post("/register", handleRegister(database, bcrypt));
app.post("/login", handleLogin(database, bcrypt));
app.post('/forgot-password', handleForgotPassword(database, bcrypt));
app.post('/valid-email', handleValidEmail(database));
app.post('/existing-email', handleExistingEmail(database));
app.post('/update-profile',handleUpdateProfile(database, bcrypt));
app.post('/show-user',handleShowUser(database));

// Face recognition
app.post('/upload', upload.single('image'),handleUpload(database));
app.post('/display-class-students',handleDisplayClassStudents(database));

app.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
});
