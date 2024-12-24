const handleAssignSubjectToLecturer = (database) => async (req, res) => {
    let { lecturer_id, subject_ids, subject_sections } = req.body;

    if (!Array.isArray(subject_ids) || !Array.isArray(subject_sections) || subject_ids.length !== subject_sections.length) {
        return res.status(400).json({ error: 'Invalid input: subject_ids and subject_sections must be arrays of the same length.' });
    }

    try {
        // Ensure subject_sections is an array of arrays
        const parsedSections = subject_sections.map(sections => 
            Array.isArray(sections) ? sections.map(section => parseInt(section, 10)) : [parseInt(sections, 10)]
        );

        await database.transaction(async (trx) => {
            // Fetch existing assignments to compare with new ones
            const existingAssignments = await trx('lecturer_subjects')
                .where({ lecturer_id })
                .select('subject_id', 'subject_section');

            // Determine which assignments to delete and which to add
            const assignmentsToDelete = existingAssignments.filter(({ subject_id, subject_section }) => {
                return !subject_ids.some((id, index) => 
                    id === subject_id && parsedSections[index].includes(subject_section)
                );
            });

            const assignmentsToAdd = [];
            subject_ids.forEach((id, index) => {
                const sections = parsedSections[index];
                sections.forEach(section => {
                    if (!existingAssignments.some(assign => 
                        assign.subject_id === id && assign.subject_section === section
                    )) {
                        assignmentsToAdd.push({ lecturer_id, subject_id: id, subject_section: section });
                    }
                });
            });

            // Delete removed assignments
            if (assignmentsToDelete.length > 0) {
                await trx('lecturer_subjects')
                    .where({ lecturer_id })
                    .whereIn(['subject_id', 'subject_section'], assignmentsToDelete.map(assign => [assign.subject_id, assign.subject_section]))
                    .del();
            }

            // Check for conflicting sections
            const conflicts = await Promise.all(subject_ids.map(async (id, index) => {
                const sections = parsedSections[index];
                return Promise.all(sections.map(section => 
                    trx('lecturer_subjects')
                        .select('lecturer_id')
                        .where('subject_id', id)
                        .andWhere('subject_section', section)
                        .whereNot('lecturer_id', lecturer_id)
                ));
            }));

            const results = conflicts.flat().flat();
            if (results.length > 0) {
                const lecturerIds = results.map(result => result.lecturer_id);

                // Fetch conflicting lecturers' names by joining lecturers and users tables
                const conflictingLecturers = await trx('lecturers')
                    .join('users', 'lecturers.user_id', '=', 'users.id')
                    .whereIn('lecturers.id', lecturerIds)
                    .select('lecturers.id', 'users.name');

                const lecturerNames = conflictingLecturers.reduce((acc, lecturer) => {
                    acc[lecturer.id] = lecturer.name;
                    return acc;
                }, {});

                const existingLecturerNames = results.map(result => lecturerNames[result.lecturer_id]).filter(name => name);
                return res.status(400).json({ error: `Sections are already taken by: ${existingLecturerNames.join(', ')}` });
            }

            // Add new subjects
            if (assignmentsToAdd.length > 0) {
                await trx('lecturer_subjects')
                    .insert(assignmentsToAdd)
                    .onConflict(['lecturer_id', 'subject_id', 'subject_section'])
                    .ignore();
            }

            // Fetch the lecturer's name from the users table via a join
            const lecturer = await trx('lecturers')
                .join('users', 'lecturers.user_id', '=', 'users.id')
                .where('lecturers.id', lecturer_id)
                .select('users.name')
                .first();

            const lecturerName = lecturer ? lecturer.name : 'Lecturer';

            res.status(200).json({ message: `Subjects for ${lecturerName} updated successfully` });
        });
    } catch (error) {
        console.error('Error updating subjects:', error);
        res.status(500).json({ error: 'Failed to update subjects', details: error.message });
    }
};

module.exports = { handleAssignSubjectToLecturer };

