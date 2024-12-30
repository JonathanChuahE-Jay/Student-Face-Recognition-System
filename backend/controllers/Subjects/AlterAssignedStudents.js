const handleAlterAssignSubjectToStudent = (database) => async (req, res) => {
    const { selectedStudents, mode, subject_id } = req.body;

    if (!selectedStudents || !Array.isArray(selectedStudents) || !subject_id) {
        return res.status(400).json({ error: 'Invalid request data' });
    }

    try {
        if (mode === 'DELETE') {
            await Promise.all(
                selectedStudents.map(async ({ id: student_id }) => {
                    if (student_id) {
                        await database('student_subjects').where({ student_id, subject_id }).del();
                        await database('attendances').where({ student_id, subject_id }).del();
                    }
                })
            );
            return res.status(200).json({ message: 'Subjects deleted successfully' });
        } 

        if (mode === 'Assign' || mode === 'Alter') {
            const existingAssignments = await database('student_subjects')
                .where({ subject_id })
                .select('student_id', 'subject_section', 'year', 'semester');

            const existingMap = new Map(
                existingAssignments.map((a) => [a.student_id, a])
            );

            const updates = [];
            const inserts = [];
            const deletes = existingAssignments.filter(
                ({ student_id }) => !selectedStudents.some((s) => s.id === student_id)
            );

            selectedStudents.forEach(({ id: student_id, subject_section, current_year, current_semester }) => {
                const existing = existingMap.get(student_id);
                if (existing) {
                    updates.push({
                        student_id,
                        updates: { subject_section, year: current_year, semester: current_semester },
                    });
                } else {
                    inserts.push({
                        student_id,
                        subject_id,
                        subject_section,
                        year: current_year,
                        semester: current_semester,
                    });
                }
            });

            if (deletes.length > 0) {
                await database('student_subjects')
                    .whereIn('student_id', deletes.map((d) => d.student_id))
                    .andWhere({ subject_id })
                    .del();
            }

            if (updates.length > 0) {
                await Promise.all(
                    updates.map(({ student_id, updates }) =>
                        database('student_subjects')
                            .where({ student_id, subject_id })
                            .update(updates)
                    )
                );
            }

            if (inserts.length > 0) {
                await database('student_subjects').insert(inserts);
            }

            return res.status(200).json({ message: 'Subjects assigned/updated successfully' });
        }

        return res.status(400).json({ error: 'Invalid mode' });
    } catch (error) {
        console.error('Error updating subjects:', error);
        res.status(500).json({ error: 'Failed to update subjects' });
    }
};

module.exports = { handleAlterAssignSubjectToStudent };
