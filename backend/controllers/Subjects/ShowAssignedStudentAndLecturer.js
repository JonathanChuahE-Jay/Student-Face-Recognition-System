const handleShowAssignedStudentAndLecturer = (database) => async (req, res) => {
    const { subject_id } = req.body;

    if (!subject_id) {
        return res.status(400).json({ error: 'Subject ID is required' });
    }

    try {
        const lecturers = await database
            .select('lecturers.*', 'users.name as name', 'users.email as email', 'lecturer_subjects.subject_section')
            .from('lecturer_subjects')
            .leftJoin('lecturers', 'lecturer_subjects.lecturer_id', 'lecturers.id')
            .leftJoin('users', 'lecturers.user_id', 'users.id')
            .where('lecturer_subjects.subject_id', subject_id);

        const all_lecturers = await database
            .select('lecturers.*','users.name as name', 'users.email as email')
            .from('lecturers')
            .leftJoin('users','lecturers.user_id','users.id')
            
        const students = await database
            .select('students.*', 'users.name as name', 'users.email as email', 'student_subjects.subject_section')
            .from('student_subjects')
            .leftJoin('students', 'student_subjects.student_id', 'students.id')
            .leftJoin('users', 'students.user_id', 'users.id')
            .where('student_subjects.subject_id', subject_id);

        const subject = await database
            .select('*')
            .from('subjects')
            .where('id', subject_id)
            .first();

        const subject_section = await database
            .select('*')
            .from('sections')
            .where({ subject_id });
        
        const student_subjects = await database
            .select("*")
            .from('student_subjects')
            .where({ subject_id });
        
        const sections = subject_section.map(section => {
            const currentStudents = student_subjects.reduce((count, student) => {
                if (student.subject_section === section.section_number) {
                    count++;
                }
                return count;
            }, 0);
        
            return {
                ...section,
                current_students: currentStudents
            };
        });
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        res.status(200).json({
            all_lecturers,
            lecturers,
            students,
            subject,
            sections,
        });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).json({ error: 'An error occurred while fetching the data' });
    }
};

module.exports = { handleShowAssignedStudentAndLecturer };
