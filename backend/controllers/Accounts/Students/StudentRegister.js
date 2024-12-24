const handleStudentRegister = (database, bcrypt) => async (req, res) => {
    const { prefix, name, email, password, facial_path, programme, currentIntakeSemester, currentIntakeYear } = req.body;
    let { profile_picture, student_id } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const trimmedEmail = email.trim();
    const numeric_student_id = student_id ? student_id.replace(/[A-Za-z]/g, '') : null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const generateRandomStudentId = (prefix) => {
        const length = 8;
        let studentId = '';
        for (let i = 0; i < length; i++) {
            studentId += Math.floor(Math.random() * 10);
        }
        return prefix + studentId;
    };

    const generateUniqueStudentId = async (prefix) => {
        let uniqueId = generateRandomStudentId(prefix);
        let exists = await database('students').where('student_id', uniqueId).first();
        while (exists) {
            uniqueId = generateRandomStudentId(prefix);
            exists = await database('students').where('student_id', uniqueId).first();
        }
        return uniqueId;
    };

    if (!student_id) {
        student_id = await generateUniqueStudentId(prefix);
    } else {
        student_id = prefix + numeric_student_id;
    }

    if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!profile_picture) {
        profile_picture = 'https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg';
    }

    try {
        const hash = bcrypt.hashSync(password, 10);

        // Check if the email already exists in the users table
        const emailExist = await database('users').where({ email: trimmedEmail }).first();
        if (emailExist) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Check if the student ID already exists in the students table
        const upper_case_student_Id = student_id.toUpperCase().replace(/\s+/g, '');
        const IDExist = await database('students').where('student_id', '=', upper_case_student_Id).first();
        if (IDExist) {
            return res.status(400).json({ error: 'Student ID already exists' });
        }

        // Register the user and student
        await database.transaction(async (trx) => {
            // Insert into users table
            const [newUser] = await trx('users')
                .insert({
                    name,
                    email: trimmedEmail,
                    password: hash,
                    role: 'student',
                    created_at: new Date(),
                })
                .returning('*');

            // Insert into students table using the new user's ID
            const [newStudent] = await trx('students')
                .insert({
                    user_id: newUser.id, 
                    prefix,
                    student_id: upper_case_student_Id,
                    facial_path,
                    programme,
                    profile_picture,
                    joined_date: new Date(),
                    current_year: currentIntakeYear,
                    current_semester: currentIntakeSemester,
                })
                .returning('*');
                
            // Add course to subjects
            const courseSubjects = await trx('courses')
                .join('course_subjects', 'courses.id', 'course_subjects.course_id')
                .select('course_subjects.*')
                .where('courses.code', prefix);

            for (const subject of courseSubjects) {
                await trx('student_subjects').insert({
                    student_id: newStudent.id,
                    subject_id: subject.subject_id,
                    year: subject.year,
                    semester: subject.semester,
                });
            }
            const user = {
                user_id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                created_at: newUser.created_at,
                student_id: newStudent.student_id,
                programme: newStudent.programme,
                facial_path: newStudent.facial_path,
                profile_picture: newStudent.profile_picture,
                current_year: newStudent.current_year,
                current_semester: newStudent.current_semester,
                joined_date: newStudent.joined_date
            };
            res.status(201).json({ message: 'User registered successfully', user });
        });
    } catch (err) {
        console.error('Failed to register user:', err);
        res.status(500).json({ error: 'Failed to register user', details: err.message });
    }
};


module.exports = { handleStudentRegister };
