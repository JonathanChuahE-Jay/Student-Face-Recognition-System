const handleShowStudentsCourseCode = (database) => async (req, res) => {
    try {
        const courses = await database('courses').select('*');
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
};

module.exports = { handleShowStudentsCourseCode };
