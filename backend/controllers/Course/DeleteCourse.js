const handleDeleteCourse = (database) => async (req, res) => {
    const { id } = req.body;
    
    try {
        const result = await database('courses')
            .where({ id })
            .del();
        
        if (result) {
            res.status(200).json({ message: 'Course deleted successfully' });
        } else {
            res.status(404).json({ message: 'Course not found' });
        }
    } catch (err) {
        console.error('Error deleting course:', err);
        res.status(500).json({ message: 'Error deleting course', error: err.message });
    }
};

module.exports = { handleDeleteCourse };
