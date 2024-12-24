const handleShowLecturers = (database) => (req, res) => {
    database
        .select('lecturers.*', 'users.name as name', 'users.email as email')
        .from('lecturers')
        .leftJoin('users', 'lecturers.user_id', 'users.id')
        .then(lecturers => {
            res.json(lecturers);
        })
        .catch(err => {
            console.error('Error fetching lecturers:', err);
            res.status(400).json({ error: 'Error fetching lecturers' });
        });
};

module.exports = { handleShowLecturers };
