const handleDisplayStudentCourse = (database) => async (req, res) => {
    const { prefix, student_id } = req.body;

    try {
        // Validate that student_id is provided
        if (!student_id) {
            return res.status(400).json({ error: 'Student ID is required.' });
        }

        // Fetch the course by code (prefix)
        const course = await database('courses')
            .where('code', prefix)
            .first();

        if (!course) {
            return res.status(404).json({ error: 'No course found with the given code.' });
        }

        // Fetch subjects associated with the student
        const subjects = await database('student_subjects')
            .join('subjects', 'student_subjects.subject_id', '=', 'subjects.id')
            .select('student_subjects.*', 'subjects.name', 'subjects.code', 'subjects.section')
            .where({ student_id });

        // Send response
        res.status(200).json({ course, subjects });
    } catch (error) {
        console.error('Error fetching student course and subjects:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to fetch course and subjects' });
        }
    }
};

module.exports = { handleDisplayStudentCourse };
