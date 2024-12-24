const handleUpdateAttendance = (database) => async (req, res) => {
    const { attendance } = req.body;

    if (!Array.isArray(attendance) || attendance.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty attendance records' });
    }

    try {
        // Create an array of promises for updating attendance records
        const updatePromises = attendance.map(att => {
            if (!att.id || !att.status) {
                throw new Error('Missing required fields: id or status');
            }
            return database('attendances')
                .where('id', att.id)
                .update({ status: att.status });
        });

        await Promise.all(updatePromises);

        res.status(200).json({ message: 'Attendance records updated successfully' });
    } catch (err) {
        console.error('Error updating attendance:', err);
        res.status(500).json({ error: 'Failed to update attendance records' });
    }
};

module.exports = { handleUpdateAttendance };
