const handleDeleteSubject = (database) => async (req, res) => {
    const { id } = req.body;
    try {
        const deletedCount = await database('subjects')
            .where('id', '=', id)
            .del();

        if (deletedCount === 0) {
            return res.status(404).json({ message: 'Subject not found' }); // Structured JSON response
        }

        return res.status(200).json({ message: 'Subject deleted successfully' }); // Structured JSON response
    } catch (error) {
        console.error('Error deleting subject:', error);
        return res.status(500).json({ message: 'Internal server error' }); // Structured JSON response
    }
};

module.exports = { handleDeleteSubject };
