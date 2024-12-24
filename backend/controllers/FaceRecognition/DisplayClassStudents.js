const handleDisplayClassStudents = (database) => async (req, res) => {
    const { subject_id, date, section } = req.body;

    if (!subject_id || !date || !section) {
        return res.status(400).json({ message: 'Missing fields are required' });
    }
    
    console.log("Original Date:", date);
    
    const sectionInt = parseInt(section, 10);
    
    // Create a Date object from the input date
    const formattedDate = new Date(date);
    
    // Check if the date is valid
    if (isNaN(formattedDate)) {
        return res.status(400).json({ message: 'Invalid date format' });
    }
    
    // Format the date for comparison in YYYY-MM-DD format
    const startOfDay = new Date(formattedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(formattedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const trx = await database.transaction();
    
    try {
        // Fetch students in the subject
        const allStudentsInSubject = await trx('students')
            .leftJoin('student_subjects', function () {
                this.on('students.id', '=', 'student_subjects.student_id')
                    .andOn('student_subjects.subject_id', '=', subject_id)
                    .andOn('student_subjects.subject_section', '=', sectionInt)
                    .andOn('students.current_year', '=', 'student_subjects.year')
                    .andOn('students.current_semester', '=', 'student_subjects.semester');
            })
            .whereNotNull('student_subjects.subject_section')
            .leftJoin('users', 'users.id', 'students.user_id')
            .select('students.*', 'users.id as user_id', 'students.id as student_id', 'users.name as name');

        // Fetch attendance records for the given date and subject
        const attendances = await trx('attendances')
            .where('attendances.subject_id', subject_id)
            .andWhere('attendances.date', '>=', startOfDay)
            .andWhere('attendances.date', '<=', endOfDay)
            .select('attendances.student_id', 'attendances.status as status');

        // Map attendance data by student_id for quick lookup
        const attendanceMap = {};
        attendances.forEach(attendance => {
            attendanceMap[attendance.student_id] = attendance.status;
        });

        const studentsWithAttendance = allStudentsInSubject.map(student => ({
            ...student,
            status: attendanceMap[student.student_id] || 'Absent',
        }));

        await trx.commit();
        res.status(200).json({ message: 'Successful', allStudentsInSubject: studentsWithAttendance });
    } catch (error) {
        await trx.rollback();
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { handleDisplayClassStudents };
