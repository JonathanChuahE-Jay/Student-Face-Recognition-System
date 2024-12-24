const handleUpdateStudent = (database) => async (req, res) => {
    const { id,  name, profile_picture, email, prefix, programme ,student_id, current_year,current_semester} = req.body;
    
    // Trim the email to remove any leading or trailing spaces
    const trimmedEmail = email.trim();

    // Validate required fields
    if (!trimmedEmail) {
        return res.status(400).json({ error: 'Email cannot be left empty' });
    } else if (!name) {
        return res.status(400).json({ error: 'Name cannot be left empty' });
    } else if (!student_id) {
        return res.status(400).json({ error: 'Student ID cannot be left empty' });
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        // Current user
        const current_user = await database('students').where({id}).select('user_id').first();
        // Check if the email already exists
        const existingEmail = await database('users').where('email', trimmedEmail).first();
        if (existingEmail && existingEmail.id !== current_user.user_id) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Check if the student ID already exists
        const existingStudentId = await database('students')
            .where('student_id', student_id)
            .whereNot('id', id)
            .first();

        if (existingStudentId) {
            return res.status(400).json({ error: 'Student ID already exists' });
        }

        //Convert stundent_id into numerical
        const numeric_student_id = student_id.replace(/[A-Za-z]/g, '');
        
        // Convert prefix to uppercase and remove spaces
        const formatted_prefix = prefix.toUpperCase().replace(/\s+/g, '');

        // Combine prefix with the formatted student_id
        const upper_case_student_id = formatted_prefix + numeric_student_id;

        // Check if student prefix are the same as the previous prefix
    await database.transaction(async (trx) => {
        // Check if student's current prefix matches the new prefix
        const student = await trx('students')
            .where({ id })
            .select('prefix')
            .first(); 

        if (student && student.prefix !== prefix) {
            // Remove all existing courses related to this student
            await trx('student_subjects')
                .where('student_id', id)
                .del();

            // Add new courses related to the new prefix
            const courseSubjects = await trx('courses')
                .join('course_subjects', 'courses.id', 'course_subjects.course_id')
                .select('course_subjects.*')
                .where('courses.code', prefix);

            for (const subject of courseSubjects) {
                await trx('student_subjects').insert({
                    student_id: id,
                    subject_id: subject.subject_id,
                    year: subject.year,
                    semester: subject.semester
                });
            }
        }

        // Commit the transaction
        await trx.commit();
    }).catch(async (err) => {
        // Rollback the transaction in case of an error
        await trx.rollback();
        console.error('Transaction failed:', err);
    });

        // Update student details
        await database('students')
            .where({id})
            .update({
                student_id: upper_case_student_id,
                profile_picture: profile_picture || 'https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg',
                prefix,
                programme,
                current_semester,
                current_year
            });
        await database('users')
            .where('id',current_user.user_id)
            .update({
                name,
                email: trimmedEmail,
            })

        res.status(200).json({ message: 'Student updated successfully' });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Error updating student' });
    }
};

module.exports = { handleUpdateStudent };
