const handleAssignSubjectToStudent = (database) => async (req, res) => {
    const { subjects, student_id } = req.body;

    if (!student_id || !subjects || !Array.isArray(subjects)) {
        return res.status(400).json({ error: 'Invalid request data' });
    }

    try {
        // Fetch existing subjects for the student
        const existingSubjects = await database('student_subjects')
            .select('subject_id')
            .where({ student_id });

        const existingSubjectIds = new Set(existingSubjects.map(subject => subject.subject_id));

        // Determine which subjects to update, insert, and delete
        const subjectsFromRequest = new Set(subjects.map(subject => subject.subject_id));
        
        // Subjects to update
        const updates = subjects.filter(subject => existingSubjectIds.has(subject.subject_id));
        
        // Subjects to insert
        const inserts = subjects.filter(subject => !existingSubjectIds.has(subject.subject_id));
        
        // Subjects to delete
        const deletes = existingSubjects.filter(subject => !subjectsFromRequest.has(subject.subject_id))
                                        .map(subject => subject.subject_id);

        // Update existing subjects
        for (const subject of updates) {
            await database('student_subjects')
                .where({ student_id, subject_id: subject.subject_id })
                .update({
                    subject_section: subject.subject_section,
                    year: subject.year,
                    semester: subject.semester
                });
        }

        // Insert new subjects
        if (inserts.length > 0) {
            await database('student_subjects')
                .insert(inserts.map(subject => ({
                    student_id,
                    subject_id: subject.subject_id,
                    subject_section: subject.subject_section,
                    year: subject.year,
                    semester: subject.semester
                })));
        }

        // Delete removed subjects
        if (deletes.length > 0) {
            await database('student_subjects')
                .where({ student_id })
                .whereIn('subject_id', deletes)
                .del();
        }

        res.status(200).json({ message: 'Subjects updated successfully' });
    } catch (error) {
        console.error('Error updating subjects:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to update subjects' });
        }
    }
};

module.exports = { handleAssignSubjectToStudent };
