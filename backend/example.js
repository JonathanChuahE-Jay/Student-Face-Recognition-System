//main
// const express = require("express");
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const app = express();

// const database = {
//     users: [
//         {
//             name: "sally",
//             email: "sally@gmail.com",
//             password: "123"
//         },
//         {
//             name: "jona",
//             email: "jona@gmail.com",
//             password: "321"
//         }
//     ]
// };

// const register = require("./controllers/Register");
// const login = require("./controllers/Login");
// app.use(cors());
// app.use(bodyParser.json());


// app.post("/register", register.handleRegister(database));
// app.post("/login", login.handleLogin(database));

// app.listen(5000, () => {
//   console.log('Server is running on http://localhost:5000');
// });



//login
// const handleLogin = (database) => (req, res) => {
//     const { email, password } = req.body;

//     const user = database.users.find(u => u.email === email && u.password === password);

//     if (user) {
//         res.json("Login successful");
//     } else {
//         res.status(400).json("Invalid credentials");
//     }
// };

// module.exports = { handleLogin };


//register


// const handleRegister = (database) => (req, res) => {
//     const { name, email, password } = req.body;
  
//     const newUser = {
//         name: name,
//         email: email,
//         password: password
//     };
  
//     database.users.push(newUser);
  
//     res.json(database);
// };
  
// module.exports = { handleRegister };

// **************************************************************************
//bcrypt

//login
// const handleLogin = (database, bcrypt) => async (req, res) => {
//     const { email, password } = req.body;

//     if (!email || !password) {
//         return res.status(400).json({ error: "Email and password are required" });
//     }

//     try {
//         const user = database.users.find(user => user.email === email);

//         if (!user) {
//             return res.status(404).json({ error: "User not found" });
//         }

//         const passwordMatch = await bcrypt.compare(password, user.password);

//         if (passwordMatch) {
//             res.status(200).json({ message: "Login successful" });
//         } else {
//             res.status(401).json({ error: "Authentication failed" });
//         }

//     } catch (error) {
//         console.error("Login error:", error);
//         res.status(500).json("Server error");
//     }
// };

// module.exports = { handleLogin };


//register
// const handleRegister = (database,bcrypt) => async (req, res) => {
//     const { name, email, password } = req.body;

//     try{
//         const hash = await bcrypt.hash(password,10);

//         const newUser = {
//             name: name,
//             email: email,
//             password: hash
//         };
    
//         database.users.push(newUser);
//         res.json(database);

//     }catch(err){
//         res.status(500).json(err);
//     }

// };
  
// module.exports = { handleRegister };
  

// nodemailer (removed)
// require('dotenv').config();

// const handleForgotPassword = (database, uuidv4, nodemailer) => async (req, res) => {
//     const { email } = req.body;
//     if (!email) {
//         return res.status(400).json('Email is required');
//     }

//     try {
//         const user = await database('users').where('email', email).first();

//         if (!user) {
//             return res.status(400).json('Email not found');
//         }

//         const transporter = nodemailer.createTransport({
//             host: 'smtp.gmail.com',
//             port: 465,
//             secure: true,
//             auth: {
//                 user: process.env.EMAIL_USER,
//                 pass: process.env.EMAIL_PASS
//             }
//         });

//         const mailOptions = {
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject: 'Password Reset Request',
//             text: 'Hello! You requested a password reset.'
//         };

//         transporter.verify((error, success) => {
//             if (error) {
//                 console.error('SMTP connection error:', error);
//                 return res.status(500).json('SMTP connection error');
//             } else {
//                 console.log("Server is ready to take our messages");

//                 transporter.sendMail(mailOptions, (error, info) => {
//                     if (error) {
//                         console.error('Error sending email:', error);
//                         return res.status(500).json('Error sending email');
//                     }
//                     console.log('Email sent:', info.response);
//                     res.status(200).json('Reset code sent!');
//                 });
//             }
//         });
//     } catch (err) {
//         console.error('Error finding user:', err);
//         res.status(500).json('Error finding user');
//     }
// };

// module.exports = {
//     handleForgotPassword
// };



//sql 
/*CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    date timestamp,
    status VARCHAR(50) NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
); */


/*const handleDisplayAssignedSubject = (database) => (req, res) => {
    // const { student_id, lecturer_id } = req.body;

    // if (!student_id && !lecturer_id) {
    //     return res.status(400).json({ error: 'Either lecturer_id or student_id is required' });
    // }

    // const query = database.select('subject_id').from('registered_subject');

    // if (student_id) {
    //     query.where('student_id', '=', student_id);
    // }
    // if (lecturer_id) {
    //     query.where('lecturer_id', '=', lecturer_id);
    // }

    // query
    //     .then(data => {
    //         const subjectIds = data.map(item => item.subject_id);
    //         if (subjectIds.length === 0) {
    //             return res.json([]); // No subjects found
    //         }
    //         return database
    //             .select('name')
    //             .from('subjects')
    //             .whereIn('id', subjectIds);
    //     })
    //     .then(subjects => {
    //         // Ensure only sending one response
    //         if (!res.headersSent) {
    //             res.json(subjects);
    //         }
    //     })
    //     .catch(err => {
    //         console.error('Error:', err);
    //         if (!res.headersSent) {
    //             res.status(500).json({ error: 'Failed to fetch assigned subjects' });
    //         }
    //     });
        const { student_id, lecturer_id } = req.body;

    if (!student_id && !lecturer_id) {
        return res.status(400).json({ error: 'Either lecturer_id or student_id is required' });
    }

    const query = database.select('*').from('registered_subject');

    if (student_id) {
        query.where('student_id', '=', student_id);
    }
    if (lecturer_id) {
        query.where('lecturer_id', '=', lecturer_id);
    }

    query
        .then(
            data=>{
            res.json(data);
            }
        )   
        .catch(err => {
            console.error('Error:', err);
                res.status(500).json({ error: 'Failed to fetch assigned subjects' });

        });
};

module.exports = { handleDisplayAssignedSubject };
 */

/*
DisplayAssignedSubjectId
const handleDisplayAssignedSubjectId = (database) => (req, res) => {
    const { lecturer_id, student_id } = req.body;

    if (!lecturer_id && !student_id) {
        return res.status(400).json({ error: 'Either lecturer_id or student_id is required' });
    }

    const query = database.select('subject_id', 'subject_section').from('registered_subject');
    
    if (lecturer_id) {
        query.where('lecturer_id', '=', lecturer_id);
    }
    
    if (student_id) {
        query.where('student_id', '=', student_id);
    }

    query
        .then(data => res.json(data))
        .catch(err => {
            console.error('Error fetching assigned subjects:', err);
            res.status(500).json({ error: 'Failed to fetch assigned subjects' });
        });
};

module.exports = { handleDisplayAssignedSubjectId };

*/

/*
const handleShowAttendance = (database) => async (req, res) => {
    const { subject_id } = req.params;
    const currentDate = new Date();

    try {
        // Fetch student-related subjects
        const studentSubjects = await database('student_subjects')
            .leftJoin('students', 'student_subjects.student_id', 'students.id')
            .where('student_subjects.subject_id', subject_id)
            .whereNotNull('student_subjects.student_id') 
            .select(
                'student_subjects.student_id',
                'students.name as student_name',
                'students.profile_picture as student_profile_picture',
                'student_subjects.subject_section'
            );

        // Fetch lecturer-related subjects
        const lecturerSubjects = await database('lecturer_subjects')
            .leftJoin('lecturers', 'lecturer_subjects.lecturer_id', 'lecturers.id')
            .where('lecturer_subjects.subject_id', subject_id)
            .whereNotNull('lecturer_subjects.lecturer_id')
            .select(
                'lecturer_subjects.lecturer_id',
                'lecturers.name as lecturer_name',
                'lecturers.profile_picture as lecturer_profile_picture',
                'lecturer_subjects.subject_section'
            );

        // Fetch attendance records
        const attendances = await database('attendances')
            .where('attendances.subject_id', subject_id)
            .andWhere('attendances.date', '<=', currentDate)
            .select(
                'attendances.*',
                'attendances.student_id as attendance_student_id'
            );

        // Extract unique dates from attendance records
        const attendanceDates = [...new Set(attendances.map(att => new Date(att.date).toDateString()))];

        // Prepare result for students
        const studentResult = [];
        studentSubjects.forEach(record => {
            attendanceDates.forEach(date => {
                const attendanceRecord = attendances.find(att => 
                    att.attendance_student_id === record.student_id && 
                    new Date(att.date).toDateString() === date
                );
                studentResult.push({
                    ...record,
                    status: attendanceRecord ? attendanceRecord.status : 'Absent',
                    date: attendanceRecord ? attendanceRecord.date : date
                });
            });
        });

        // Prepare result for lecturers
        const lecturerResult = [];
        lecturerSubjects.forEach(record => {
            lecturerResult.push({
                ...record,
                status: 'N/A',
                date: null
            });
        });

        // Return both results in the response
        res.json({
            students: studentResult,
            lecturers: lecturerResult
        });
    } catch (error) {
        console.error('Error fetching attendances:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { handleShowAttendance };

*/

// const handleUpdateSubject = (database) => async (req, res) => {
//     const { id, subjectName, subjectCode, subjectPicture, subjectSection, numberOfSections, sectionTimes, venue } = req.body;

//     // Validate input
//     if (!subjectName || !subjectCode || !subjectSection) {
//         return res.status(400).json({ error: 'Subject name, code, and section are required.' });
//     }

//     try {
//         // Check for duplicate subject code
//         const sameCode = await database('subjects')
//             .where('code', '=', subjectCode)
//             .whereNot('id', id)
//             .first();

//         if (sameCode) {
//             return res.status(400).json({ error: 'Subject code already exists.' });
//         }

//         // Check if the subject exists
//         const existingSubject = await database('subjects')
//             .where('id', '=', id)
//             .first();

//         if (!existingSubject) {
//             return res.status(404).json({ error: 'Subject ID not found.' });
//         }

//         // Check if the new number of sections is less than the existing one
//         const prevSection = 
//             await database('subjects')
//                 .where('id', '=', id)
//                 .select('number_of_sections')
//                 .first();

//         if (prevSection && numberOfSections < prevSection.number_of_sections) {
//             // Delete associated records where subject_section is greater than the new number of sections
//             await database('lecturer_subjects')
//                 .where('subject_id', id)
//                 .where('subject_section', '>', numberOfSections)
//                 .del();
            
//             await database('student_subjects')
//                 .where('subject_id', id)
//                 .where('subject_section', '>', numberOfSections)
//                 .del();

//             await database('sections')
//                 .where('subject_id', id)
//                 .where('section_number', '>', numberOfSections)
//                 .del();
//         }
        
//         // Update the subject
//         const upper_case_subject_code = subjectCode.toUpperCase().replace(/\s+/g, '');

//         await database('subjects')
//             .where('id', '=', id)
//             .update({
//                 name: subjectName,
//                 code: upper_case_subject_code,
//                 profile_picture: subjectPicture,
//                 section: subjectSection,
//                 number_of_sections: numberOfSections
//             });

//         // Call update or create section times
//         await updateOrCreateSectionTimes(database, id, sectionTimes, venue);

//         return res.status(200).json({ message: 'Subject and section times updated successfully.' });

//     } catch (error) {
//         console.error('Error updating subject:', error);
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// };

// const updateOrCreateSectionTimes = async (database, subjectId, sectionTimes, venue) => {
//     try {
//         await database.transaction(async trx => {
//             for (const [index, time] of sectionTimes.entries()) {
//                 const sectionNumber = index + 1;
//                 const { startTime, endTime } = time;
//                 const sectionVenue = venue[index] || ''; 

//                 console.log(`Section ${sectionNumber}: startTime = ${startTime}, endTime = ${endTime}, venue = ${sectionVenue}`);

//                 const existingSection = await trx('sections')
//                     .where({
//                         subject_id: subjectId,
//                         section_number: sectionNumber
//                     })
//                     .first();

//                 if (existingSection) {
//                     console.log(`Updating section ${sectionNumber}`);
//                     await trx('sections')
//                         .where({
//                             subject_id: subjectId,
//                             section_number: sectionNumber
//                         })
//                         .update({
//                             start_time: startTime,
//                             end_time: endTime,
//                             venue: sectionVenue
//                         });
//                 } else {
//                     console.log(`Inserting section ${sectionNumber}`);
//                     await trx('sections')
//                         .insert({
//                             subject_id: subjectId,
//                             section_number: sectionNumber,
//                             start_time: startTime,
//                             end_time: endTime,
//                             venue: sectionVenue
//                         });
//                 }
//             }
//         });

//         console.log('Section times updated or created successfully');
//     } catch (error) {
//         console.error('Error updating or creating section times:', error);
//         throw error; 
//     }
// };


// module.exports = { handleUpdateSubject };

/*

const handleDisplayAssignedSubject = (database) => async (req, res) => {
    const { lecturer_id, student_id } = req.body;

    if (!lecturer_id && !student_id) {
        return res.status(400).json({ error: 'Either lecturer_id or student_id is required' });
    }

    try {
        // Fetch subject IDs and sections for the lecturer or student
        const registeredSubjectsQuery = database
            .select('subject_id', 'subject_section')
            

        if (lecturer_id) {
            registeredSubjectsQuery.from('lecturer_subjects').where('lecturer_id', '=', lecturer_id);
        }

        if (student_id) {
            registeredSubjectsQuery.from('student_subjects').where('student_id', '=', student_id);
        }

        const registeredSubjects = await registeredSubjectsQuery;

        // If no subjects are found, return an empty array
        if (registeredSubjects.length === 0) {
            return res.json([]);
        }

        // Extract subject IDs from registered subjects
        const subjectIds = registeredSubjects.map(item => item.subject_id);

        // Fetch subject details using subject IDs
        const subjectDetails = await database
            .select('id', 'name', 'code', 'number_of_sections')
            .from('subjects')
            .whereIn('id', subjectIds);

        // Combine registered subjects with subject details
        const combinedSubjects = registeredSubjects.map(regSub => {
            const details = subjectDetails.find(subDetail => subDetail.id === regSub.subject_id);
            return {
                ...regSub,
                name: details ? details.name : 'Unknown Subject',
                code: details ? details.code : 'Unknown Code',
                section: regSub.subject_section 
            };
        });

        res.json(combinedSubjects);

    } catch (err) {
        console.error('Error fetching assigned subjects:', err);
        res.status(500).json({ error: 'Failed to fetch assigned subjects' });
    }
};

module.exports = { handleDisplayAssignedSubject };
*/