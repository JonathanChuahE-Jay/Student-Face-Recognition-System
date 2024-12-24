const fs = require('fs');
const path = require('path');
const handleDeleteStudent = (database) => async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Id can\'t be empty.' });
    }

    const trx = await database.transaction();

    try {
        // Fetch student and user_id before deleting
        const student = await trx('students').where('id', id).select('user_id', 'facial_path').first();
        if (!student) {
            await trx.rollback();
            return res.status(404).json({ error: 'Student not found.' });
        }

        const user_id = student.user_id;
        const facialPath = student.facial_path;
        
        // Delete the file if exists
        if (facialPath) {
            const fullPath = path.resolve('uploads', facialPath);
            console.log(fullPath);
            try {
                fs.unlinkSync(fullPath);  
                console.log(`File deleted: ${fullPath}`);
            } catch (err) {
                console.error(`Error deleting file: ${err.message}`);
                await trx.rollback();
                return res.status(500).json({ error: 'Failed to delete associated file.' });
            }
        }

        // Delete student and related records
        await trx('attendances').where('student_id', id).del();
        await trx('student_subjects').where('student_id', id).del();
        const deletedRows = await trx('students').where('id', id).del();

        if (deletedRows === 0) {
            await trx.rollback();
            return res.status(404).json({ error: 'Student not found.' });
        }

        // Delete the user from the users table
        await trx('users').where({ id: user_id }).del();

        await trx.commit();
        res.status(200).json({ message: 'Student and associated file deleted successfully.' });
    } catch (error) {
        await trx.rollback();
        console.error(error);
        res.status(500).json({ error: 'Failed to delete student.' });
    }
};

module.exports = { handleDeleteStudent };
