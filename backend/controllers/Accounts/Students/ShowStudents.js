const handleShowStudents = (database) => async (req, res) => {
    const { student_id } = req.params;

    try {
        if (!student_id) {
            // Fetch all students with user information
            const data = await database('students')
                .leftJoin('users', 'students.user_id', 'users.id') 
                .select('students.*', 'users.name as name', 'users.email as email'); 
            return res.status(200).json(data);
        } else {
            // Fetch student by id
            const student = await database('students')
                .leftJoin('users', 'students.user_id', 'users.id') 
                .where({ 'students.id': student_id })
                .select('students.*', 'users.name as name', 'users.email as email'); 
            
            if (!student.length) { 
                return res.status(404).json({ error: 'Student not found' });
            }
            return res.json(student[0]); 
        }
    } catch (error) {
        console.error('Error fetching students:', error);
        return res.status(500).json({ error: 'Failed to retrieve data' });
    }
}

module.exports = { handleShowStudents };
