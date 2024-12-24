const handleAlterAssignedLecturer = (database) => async (req, res) => {
    const { lecturer_id, subject_section, subject_id, mode } = req.body;

    if (!lecturer_id || !subject_section || !subject_id || !mode) {
        return res.status(400).json({ error: 'Invalid request data' });
    }
    
    try {
        if (mode === 'Delete') {
            const lecturerExists = await database('lecturer_subjects')
                .where({ lecturer_id, subject_section, subject_id })
                .first();

            if (!lecturerExists) {
                return res.status(404).json({ error: 'Lecturer not found' });
            }

            // Remove the lecturer from the database
            await database('lecturer_subjects')
                .where({ lecturer_id, subject_section, subject_id })
                .del();

            return res.status(200).json({ message: 'Lecturer removed successfully' });
        } else if (mode === 'Assign') {
            // Check if the lecturer is already assigned
            const existingAssignment = await database('lecturer_subjects')
                .where({ lecturer_id, subject_section, subject_id })
                .first();

            if (existingAssignment) {
                return res.status(400).json({ error: 'Lecturer is already assigned' });
            }

            // Insert the lecturer into the database
            await database('lecturer_subjects')
                .insert({ lecturer_id, subject_section, subject_id });

            return res.status(201).json({ message: 'Lecturer assigned successfully' });
        } else {
            return res.status(400).json({ error: 'Unsupported mode' });
        }
    } catch (error) {
        console.error('Error handling lecturer assignment:', error);
        return res.status(500).json({ error: 'Failed to handle lecturer assignment' });
    }
};

module.exports = { handleAlterAssignedLecturer };
