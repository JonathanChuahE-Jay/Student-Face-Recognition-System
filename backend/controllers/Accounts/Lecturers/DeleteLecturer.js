const handleDeleteLecturer = (database) => async (req, res) => {
    const { id } = req.body;
    
    if (!id) {
        return res.status(400).json({ error: 'Invalid request: Lecturer ID is required' });
    }

    const trx = await database.transaction();

    try {
        // Fetch lecturer user_id before deletion
        const lecturerRecord = await trx('lecturers').where({ id }).select('user_id').first();

        if (!lecturerRecord) {
            await trx.rollback();
            return res.status(404).json({ error: 'Lecturer not found' });
        }

        // Fetch lecturer name using user_id
        const lecturer = await trx('users').where('id', lecturerRecord.user_id).select('name').first();

        if (!lecturer) {
            await trx.rollback();
            return res.status(404).json({ error: 'Lecturer not found in users table' });
        }

        // Delete lecturer's subject assignments
        await trx('lecturer_subjects').where('lecturer_id', id).del();

        // Delete the lecturer record
        const deleteCount = await trx('users').where('id', lecturerRecord.user_id).del();

        if (deleteCount > 0) {
            await trx.commit();
            res.status(200).json({ success: `${lecturer.name} deleted successfully` });
        } else {
            await trx.rollback();
            res.status(400).json({ error: 'Lecturer not found or already deleted' });
        }
    } catch (err) {
        await trx.rollback();
        console.error('Error deleting lecturer:', err);
        res.status(500).json({ error: 'Error deleting lecturer', details: 'An internal server error occurred' });
    }
};

module.exports = { handleDeleteLecturer };
