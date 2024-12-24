const handleDeleteAssignedSubject = (database) => async (req, res) => {
    const { subject_id } = req.body;
    try {
        const deleteCount = await database('student_subjects')
            .where( 'id', subject_id)
            .del();

        if (deleteCount) {
            res.status(200).json({ message: 'Subject deleted successfully' });
        } else {
            res.status(404).json({ message: 'Subject not found' });
        }
    } catch (error) {
        console.error('Error deleting assigned subject:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { handleDeleteAssignedSubject };
